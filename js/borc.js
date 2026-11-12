// ============================================================================
// BORÇ & EMANET TAKİP MODÜLÜ (ELDEN / RESMİ BORÇLAR, DÖVİZ & ALTIN, ÖDEME GEÇMİŞİ)
// ============================================================================

// Para ve Varlık Tanımları
const BORC_BIRIMLERI = {
    'TL': { code: 'TL', label: 'TL (₺)', symbol: '₺', type: 'currency', isGold: false },
    'USD': { code: 'USD', label: 'Dolar ($)', symbol: '$', type: 'currency', isGold: false },
    'EUR': { code: 'EUR', label: 'Euro (€)', symbol: '€', type: 'currency', isGold: false },
    'ALTIN_GR': { code: 'ALTIN_GR', label: 'Gram Altın (gr)', symbol: 'gr', type: 'weight', isGold: true },
    'ALTIN_CEYREK': { code: 'ALTIN_CEYREK', label: 'Çeyrek Altın (Adet)', symbol: 'Adet', type: 'count', isGold: true },
    'ALTIN_YARIM': { code: 'ALTIN_YARIM', label: 'Yarım Altın (Adet)', symbol: 'Adet', type: 'count', isGold: true },
    'ALTIN_TAM': { code: 'ALTIN_TAM', label: 'Tam / Ziynet Altın (Adet)', symbol: 'Adet', type: 'count', isGold: true },
    'ALTIN_ATA': { code: 'ALTIN_ATA', label: 'Ata Lira (Adet)', symbol: 'Adet', type: 'count', isGold: true },
    'ALTIN_22AYAR': { code: 'ALTIN_22AYAR', label: '22 Ayar Bilezik (gr)', symbol: 'gr', type: 'weight', isGold: true },
    'DIGER': { code: 'DIGER', label: 'Diğer Varlık', symbol: '', type: 'custom', isGold: false }
};

// ============================================================================
// DÖVİZ VE ALTIN KURLARI (CANLI İNTERNETTEN ÇEKME VE MANUEL GİRİŞ)
// ============================================================================
const DEFAULT_KUR_LISTESI = {
    USD: 34.50,
    EUR: 37.20,
    ALTIN_GR: 3050.00,
    ALTIN_CEYREK: 5000.00,
    ALTIN_YARIM: 10000.00,
    ALTIN_TAM: 20000.00,
    ALTIN_ATA: 20600.00,
    ALTIN_22AYAR: 2800.00,
    sonGuncelleme: new Date().toISOString()
};

let dbKurlar = JSON.parse(localStorage.getItem('app_doviz_kurlar'));
if (!dbKurlar || typeof dbKurlar !== 'object') {
    dbKurlar = { ...DEFAULT_KUR_LISTESI };
    localStorage.setItem('app_doviz_kurlar', JSON.stringify(dbKurlar));
} else {
    // Eksik alanlar varsa tamamla
    Object.keys(DEFAULT_KUR_LISTESI).forEach(k => {
        if (dbKurlar[k] === undefined) dbKurlar[k] = DEFAULT_KUR_LISTESI[k];
    });
}

function saveKurlarDb() {
    dbKurlar.sonGuncelleme = new Date().toISOString();
    localStorage.setItem('app_doviz_kurlar', JSON.stringify(dbKurlar));
    renderKurTicker();
    renderBorcListesiTab();
    renderBorcOzetTab();
}

function getBirimKur(birimCode) {
    if (!birimCode || birimCode === 'TL') return 1;
    if (birimCode === 'USD') return Number(dbKurlar.USD) || 34.50;
    if (birimCode === 'EUR') return Number(dbKurlar.EUR) || 37.20;
    if (birimCode === 'ALTIN_GR') return Number(dbKurlar.ALTIN_GR) || 3050.00;
    if (birimCode === 'ALTIN_CEYREK') return Number(dbKurlar.ALTIN_CEYREK) || 5000.00;
    if (birimCode === 'ALTIN_YARIM') return Number(dbKurlar.ALTIN_YARIM) || 10000.00;
    if (birimCode === 'ALTIN_TAM') return Number(dbKurlar.ALTIN_TAM) || 20000.00;
    if (birimCode === 'ALTIN_ATA') return Number(dbKurlar.ALTIN_ATA) || 20600.00;
    if (birimCode === 'ALTIN_22AYAR') return Number(dbKurlar.ALTIN_22AYAR) || 2800.00;
    return 1;
}

function convertBirimToTL(miktar, birimCode, customKur = null) {
    const kur = (customKur !== null && !isNaN(customKur) && Number(customKur) > 0) ? Number(customKur) : getBirimKur(birimCode);
    return (Number(miktar) || 0) * kur;
}

function convertTLToBirim(tlTutar, birimCode, customKur = null) {
    const kur = (customKur !== null && !isNaN(customKur) && Number(customKur) > 0) ? Number(customKur) : getBirimKur(birimCode);
    if (kur <= 0) return 0;
    return (Number(tlTutar) || 0) / kur;
}

async function fetchLiveExchangeRates(silent = false) {
    try {
        if (!silent && typeof showToast === 'function') {
            showToast("Canlı piyasa kurları sorgulanıyor...", "info");
        }
        let updatedCount = 0;

        // 1. Döviz Kurları (USD, EUR) - Serbest Piyasa Open API
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data && data.rates && data.rates.TRY) {
                    const usdTry = parseFloat(data.rates.TRY);
                    if (usdTry > 10) {
                        dbKurlar.USD = Math.round(usdTry * 100) / 100;
                        updatedCount++;
                    }
                    if (data.rates.EUR) {
                        const eurTry = usdTry / parseFloat(data.rates.EUR);
                        if (eurTry > 10) {
                            dbKurlar.EUR = Math.round(eurTry * 100) / 100;
                            updatedCount++;
                        }
                    }
                }
            }
        } catch (e1) {
            console.warn("Döviz kuru servisi erişim uyarısı (er-api):", e1);
        }

        // 2. Altın Kurları - Finans Truncgil API
        try {
            const resGold = await fetch("https://finans.truncgil.com/today.json", { cache: "no-store" });
            if (resGold.ok) {
                const gData = await resGold.json();
                if (gData && typeof gData === 'object') {
                    if (gData["gram-altin"] && gData["gram-altin"].Alış) {
                        const gr = parseFloat(String(gData["gram-altin"].Alış).replace(/\./g, '').replace(',', '.'));
                        if (gr > 500) { dbKurlar.ALTIN_GR = Math.round(gr); updatedCount++; }
                    }
                    if (gData["ceyrek-altin"] && gData["ceyrek-altin"].Alış) {
                        const ceyrek = parseFloat(String(gData["ceyrek-altin"].Alış).replace(/\./g, '').replace(',', '.'));
                        if (ceyrek > 1000) { dbKurlar.ALTIN_CEYREK = Math.round(ceyrek); updatedCount++; }
                    }
                    if (gData["yarim-altin"] && gData["yarim-altin"].Alış) {
                        const yarim = parseFloat(String(gData["yarim-altin"].Alış).replace(/\./g, '').replace(',', '.'));
                        if (yarim > 2000) dbKurlar.ALTIN_YARIM = Math.round(yarim);
                    }
                    if (gData["tam-altin"] && gData["tam-altin"].Alış) {
                        const tam = parseFloat(String(gData["tam-altin"].Alış).replace(/\./g, '').replace(',', '.'));
                        if (tam > 4000) dbKurlar.ALTIN_TAM = Math.round(tam);
                    }
                    if (gData["cumhuriyet-altini"] && gData["cumhuriyet-altini"].Alış) {
                        const ata = parseFloat(String(gData["cumhuriyet-altini"].Alış).replace(/\./g, '').replace(',', '.'));
                        if (ata > 4000) dbKurlar.ALTIN_ATA = Math.round(ata);
                    }
                    if (gData["22-ayar-bilezik"] && gData["22-ayar-bilezik"].Alış) {
                        const b = parseFloat(String(gData["22-ayar-bilezik"].Alış).replace(/\./g, '').replace(',', '.'));
                        if (b > 500) dbKurlar.ALTIN_22AYAR = Math.round(b);
                    }
                }
            }
        } catch (e2) {
            console.warn("Altın kuru servisi erişim uyarısı (truncgil):", e2);
        }

        saveKurlarDb();

        if (!silent && typeof showToast === 'function') {
            if (updatedCount > 0) {
                showToast(`Piyasa kurları güncellendi! (USD: ${dbKurlar.USD} ₺, EUR: ${dbKurlar.EUR} ₺, Gr Altın: ${Number(dbKurlar.ALTIN_GR).toLocaleString('tr-TR')} ₺)`);
            } else {
                showToast("Canlı kur servisine ulaşılamadı. Mevcut kayıtlı kurlar kullanılıyor.", "info");
            }
        }
    } catch (err) {
        console.error("Kur güncelleme hatası:", err);
        if (!silent && typeof showToast === 'function') {
            showToast("Kurlar güncellenirken hata oluştu. Mevcut kurlar kullanılıyor.", "error");
        }
    }
}

function renderGlobalBorsaTicker() {
    const track = document.getElementById("globalBorsaTrack");
    if (!track) return;

    const usd = Number(dbKurlar.USD || 34.50).toFixed(2);
    const eur = Number(dbKurlar.EUR || 37.20).toFixed(2);
    const grAltin = Number(dbKurlar.ALTIN_GR || 3050).toLocaleString('tr-TR');
    const ceyrek = Number(dbKurlar.ALTIN_CEYREK || 5000).toLocaleString('tr-TR');
    const yarim = Number(dbKurlar.ALTIN_YARIM || 10000).toLocaleString('tr-TR');
    const tam = Number(dbKurlar.ALTIN_TAM || 20000).toLocaleString('tr-TR');
    const ata = Number(dbKurlar.ALTIN_ATA || 20600).toLocaleString('tr-TR');
    const b22 = Number(dbKurlar.ALTIN_22AYAR || 2800).toLocaleString('tr-TR');
    const updateTime = dbKurlar.sonGuncelleme ? new Date(dbKurlar.sonGuncelleme).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';

    const items = `
        <div class="borsa-item" title="Amerikan Doları">
            <span class="borsa-item-flag">🇺🇸</span>
            <span class="borsa-item-code">USD/TRY:</span>
            <span class="borsa-item-val">${usd} ₺</span>
            <span class="borsa-item-change"><i class="fa-solid fa-arrow-trend-up"></i> %0.12</span>
        </div>
        <div class="borsa-item" title="Euro">
            <span class="borsa-item-flag">🇪🇺</span>
            <span class="borsa-item-code">EUR/TRY:</span>
            <span class="borsa-item-val">${eur} ₺</span>
            <span class="borsa-item-change"><i class="fa-solid fa-arrow-trend-up"></i> %0.08</span>
        </div>
        <div class="borsa-item gold" title="24 Ayar Gram Altın">
            <span class="borsa-item-flag">🪙</span>
            <span class="borsa-item-code">Gram Altın:</span>
            <span class="borsa-item-val">${grAltin} ₺</span>
            <span class="borsa-item-change"><i class="fa-solid fa-arrow-trend-up"></i> %0.25</span>
        </div>
        <div class="borsa-item gold" title="Çeyrek Altın">
            <span class="borsa-item-flag">🪙</span>
            <span class="borsa-item-code">Çeyrek:</span>
            <span class="borsa-item-val">${ceyrek} ₺</span>
        </div>
        <div class="borsa-item gold" title="Yarım Altın">
            <span class="borsa-item-flag">🪙</span>
            <span class="borsa-item-code">Yarım:</span>
            <span class="borsa-item-val">${yarim} ₺</span>
        </div>
        <div class="borsa-item gold" title="Tam Ziynet Altın">
            <span class="borsa-item-flag">👑</span>
            <span class="borsa-item-code">Tam:</span>
            <span class="borsa-item-val">${tam} ₺</span>
        </div>
        <div class="borsa-item gold" title="Cumhuriyet / Ata Altın">
            <span class="borsa-item-flag">🏛️</span>
            <span class="borsa-item-code">Ata:</span>
            <span class="borsa-item-val">${ata} ₺</span>
        </div>
        <div class="borsa-item gold" title="22 Ayar Bilezik Gram">
            <span class="borsa-item-flag">✨</span>
            <span class="borsa-item-code">22 Ayar:</span>
            <span class="borsa-item-val">${b22} ₺</span>
        </div>
        <div class="borsa-item" title="Borsa İstanbul 100">
            <span class="borsa-item-flag">📈</span>
            <span class="borsa-item-code">BIST 100:</span>
            <span class="borsa-item-val">9.452</span>
            <span class="borsa-item-change"><i class="fa-solid fa-arrow-trend-up"></i> %0.45</span>
        </div>
        <div class="borsa-item" style="color: var(--text-dim); font-size: 10.5px;" title="Son Kur Güncellemesi">
            <i class="fa-regular fa-clock"></i> <span>${updateTime}</span>
        </div>
    `;

    // 2 kopya ile pürüzsüz sonsuz döngü (infinite marquee)
    track.innerHTML = items + items;
}

function renderKurTicker() {
    renderGlobalBorsaTicker();

    const containers = document.querySelectorAll(".kur-chips-wrapper");
    if (!containers || containers.length === 0) return;

    const html = `
        <div class="kur-chip" title="1 Amerikan Doları = ${dbKurlar.USD} ₺">
            <span class="kur-chip-flag">🇺🇸</span>
            <span class="kur-chip-code">USD:</span>
            <span class="kur-chip-val">${Number(dbKurlar.USD).toFixed(2)} ₺</span>
        </div>
        <div class="kur-chip" title="1 Euro = ${dbKurlar.EUR} ₺">
            <span class="kur-chip-flag">🇪🇺</span>
            <span class="kur-chip-code">EUR:</span>
            <span class="kur-chip-val">${Number(dbKurlar.EUR).toFixed(2)} ₺</span>
        </div>
        <div class="kur-chip gold" title="1 Gram Altın (24 Ayar) = ${Number(dbKurlar.ALTIN_GR).toLocaleString('tr-TR')} ₺">
            <span class="kur-chip-flag">🪙</span>
            <span class="kur-chip-code">Gr Altın:</span>
            <span class="kur-chip-val">${Number(dbKurlar.ALTIN_GR).toLocaleString('tr-TR')} ₺</span>
        </div>
        <div class="kur-chip gold" title="1 Çeyrek Altın = ${Number(dbKurlar.ALTIN_CEYREK).toLocaleString('tr-TR')} ₺">
            <span class="kur-chip-flag">🪙</span>
            <span class="kur-chip-code">Çeyrek:</span>
            <span class="kur-chip-val">${Number(dbKurlar.ALTIN_CEYREK).toLocaleString('tr-TR')} ₺</span>
        </div>
        <div class="kur-chip subtle" style="font-size: 11px; opacity: 0.8;" title="Son Güncelleme Saati">
            <i class="fa-regular fa-clock"></i> ${dbKurlar.sonGuncelleme ? new Date(dbKurlar.sonGuncelleme).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
        </div>
    `;

    containers.forEach(c => {
        c.innerHTML = html;
    });
}


// Örnek Başlangıç Borç Verileri
const DEFAULT_BORCLAR = [
    {
        id: 101,
        tarih: "2026-10-15",
        kisi: "Ahmet Yılmaz",
        telefon: "0532 111 22 33",
        alinisTipi: "ELDEN",
        birim: "TL",
        tutar: 50000,
        vadeTarihi: "2026-12-31",
        aciklama: "Ofis tadilatı ve demirbaş alımı için elden nakit alındı"
    },
    {
        id: 102,
        tarih: "2026-10-20",
        kisi: "Mehmet Demir",
        telefon: "0544 222 33 44",
        alinisTipi: "ELDEN",
        birim: "USD",
        tutar: 2500,
        vadeTarihi: "2027-01-15",
        aciklama: "Elden dolar borcu alındı"
    },
    {
        id: 103,
        tarih: "2026-11-01",
        kisi: "Kuzey Danışmanlık A.Ş.",
        telefon: "0212 555 66 77",
        alinisTipi: "RESMI",
        birim: "EUR",
        tutar: 3000,
        vadeTarihi: "2026-12-15",
        aciklama: "Banka şirket hesabından havale ile gelen kurumsal borç"
    },
    {
        id: 104,
        tarih: "2026-10-05",
        kisi: "Mustafa Çelik",
        telefon: "0505 888 99 00",
        alinisTipi: "ELDEN",
        birim: "ALTIN_GR",
        tutar: 50,
        vadeTarihi: "2027-03-01",
        aciklama: "Elden fiziksel 24 ayar gram külçe altın alındı"
    },
    {
        id: 105,
        tarih: "2026-09-10",
        kisi: "Ali Vural",
        telefon: "0533 444 55 66",
        alinisTipi: "ELDEN",
        birim: "ALTIN_CEYREK",
        tutar: 10,
        vadeTarihi: "2026-11-01",
        aciklama: "Düğün ve etkinlik için elden alınan 10 adet çeyrek altın (Tamamı kapatıldı)"
    }
];

// Örnek Başlangıç Ödeme Verileri
const DEFAULT_BORC_ODEMELER = [
    {
        id: 1,
        borcId: 101,
        tarih: "2026-11-02",
        tutar: 20000,
        kanal: "ELDEN",
        makbuzNo: "MK-101",
        aciklama: "Elden 1. taksit nakit teslim edildi"
    },
    {
        id: 2,
        borcId: 103,
        tarih: "2026-11-04",
        tutar: 1000,
        kanal: "BANKA",
        makbuzNo: "DEK-9921",
        aciklama: "Banka üzerinden kısmi havale yapıldı"
    },
    {
        id: 3,
        borcId: 104,
        tarih: "2026-11-05",
        tutar: 15,
        kanal: "FIZIKSEL",
        makbuzNo: "ALT-04",
        aciklama: "15 gram altın elden teslim edildi"
    },
    {
        id: 4,
        borcId: 105,
        tarih: "2026-10-25",
        tutar: 10,
        kanal: "FIZIKSEL",
        makbuzNo: "TESLIM-10",
        aciklama: "10 adet çeyrek altın eksiksiz elden iade edildi"
    }
];

// Veritabanı Yükleme
let dbBorclar = JSON.parse(localStorage.getItem('app_borclar'));
if (!dbBorclar || !Array.isArray(dbBorclar)) {
    dbBorclar = DEFAULT_BORCLAR;
    localStorage.setItem('app_borclar', JSON.stringify(dbBorclar));
}

let dbBorcOdemeler = JSON.parse(localStorage.getItem('app_borc_odemeler'));
if (!dbBorcOdemeler || !Array.isArray(dbBorcOdemeler)) {
    dbBorcOdemeler = DEFAULT_BORC_ODEMELER;
    localStorage.setItem('app_borc_odemeler', JSON.stringify(dbBorcOdemeler));
}

// Kaydetme Fonksiyonu
function saveBorcDb() {
    localStorage.setItem('app_borclar', JSON.stringify(dbBorclar));
    localStorage.setItem('app_borc_odemeler', JSON.stringify(dbBorcOdemeler));
    if (typeof updateGlobalBadges === 'function') updateGlobalBadges();
    if (typeof calculateNotifications === 'function') calculateNotifications();
}

// ----------------------------------------------------------------------------
// HESAPLAMA VE FORMATLAMA YARDIMCILARI
// ----------------------------------------------------------------------------

function getBorcSummary(borcId) {
    const borc = dbBorclar.find(b => Number(b.id) === Number(borcId));
    if (!borc) return { toplamTutar: 0, odenen: 0, kalan: 0, yuzde: 0, durum: 'BILINMIYOR' };

    const anaTutar = Number(borc.tutar) || 0;
    const odenen = dbBorcOdemeler
        .filter(o => Number(o.borcId) === Number(borcId))
        .reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);

    const kalan = Math.max(0, anaTutar - odenen);
    const yuzde = anaTutar > 0 ? Math.min(100, Math.round((odenen / anaTutar) * 100)) : 100;

    let durum = 'ACIK';
    if (kalan <= 0.0001) {
        durum = 'ODENDI';
    } else if (odenen > 0) {
        durum = 'KISMI';
    }

    return {
        toplamTutar: anaTutar,
        odenen,
        kalan,
        yuzde,
        durum
    };
}

function formatBorcMiktar(val, birimCode) {
    const num = Number(val) || 0;
    const birim = BORC_BIRIMLERI[birimCode] || { symbol: '', type: 'custom' };

    if (birimCode === 'TL') {
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₺';
    }
    if (birimCode === 'USD') {
        return '$ ' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    if (birimCode === 'EUR') {
        return '€ ' + num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    if (birim.type === 'weight') {
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ' + birim.symbol;
    }
    if (birim.type === 'count') {
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + birim.symbol;
    }
    return num.toLocaleString('tr-TR') + ' ' + (birim.symbol || birimCode || '');
}

function getBorcBirimBadge(birimCode) {
    const b = BORC_BIRIMLERI[birimCode];
    if (!b) return `<span class="badge-pill badge-info">${birimCode}</span>`;

    if (b.isGold) {
        return `<span class="badge-pill" style="background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 700;"><i class="fa-solid fa-coins"></i> ${b.label}</span>`;
    }
    if (birimCode === 'USD') {
        return `<span class="badge-pill" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700;"><i class="fa-solid fa-dollar-sign"></i> Dolar ($)</span>`;
    }
    if (birimCode === 'EUR') {
        return `<span class="badge-pill" style="background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 700;"><i class="fa-solid fa-euro-sign"></i> Euro (€)</span>`;
    }
    return `<span class="badge-pill" style="background: rgba(100, 116, 139, 0.12); color: #334155; border: 1px solid rgba(100, 116, 139, 0.25); font-weight: 700;"><i class="fa-solid fa-turkish-lira-sign"></i> TL (₺)</span>`;
}

function getBorcTipiBadge(tipi) {
    if (tipi === 'ELDEN') {
        return `<span class="badge-pill" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-weight: 700;"><i class="fa-solid fa-handshake"></i> Elden Alınan</span>`;
    }
    return `<span class="badge-pill" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 700;"><i class="fa-solid fa-building-columns"></i> Resmi / Banka</span>`;
}

function getBorcDurumBadge(kalan, toplam, vadeTarihi) {
    if (kalan <= 0.0001) {
        return `<span class="badge-pill badge-success" style="font-weight: 700;"><i class="fa-solid fa-circle-check"></i> ÖDENDİ</span>`;
    }

    let vadeUyarisi = "";
    if (vadeTarihi) {
        const today = new Date().toISOString().slice(0, 10);
        if (vadeTarihi < today) {
            vadeUyarisi = ` <span style="font-size: 10px; color: var(--danger); font-weight: 700;" title="Vadesi Geçti!"><i class="fa-solid fa-triangle-exclamation"></i> Gecikti</span>`;
        }
    }

    if (kalan < toplam) {
        return `<span class="badge-pill badge-warning" style="font-weight: 700;"><i class="fa-solid fa-hourglass-half"></i> KISMİ ÖDENDİ</span>` + vadeUyarisi;
    }
    return `<span class="badge-pill badge-danger" style="font-weight: 700;"><i class="fa-solid fa-clock"></i> BEKLİYOR</span>` + vadeUyarisi;
}

function getKanalBadge(kanal) {
    if (kanal === 'ELDEN') {
        return `<span class="badge-pill badge-warning"><i class="fa-solid fa-handshake"></i> Elden Nakit</span>`;
    }
    if (kanal === 'BANKA') {
        return `<span class="badge-pill badge-info"><i class="fa-solid fa-building-columns"></i> Banka Havale</span>`;
    }
    if (kanal === 'FIZIKSEL') {
        return `<span class="badge-pill badge-gold"><i class="fa-solid fa-coins"></i> Fiziksel Teslim</span>`;
    }
    return `<span class="badge-pill badge-subtle">Diğer</span>`;
}

// ----------------------------------------------------------------------------
// 1. SEKME: BORÇ LİSTESİ TABLOSU
// ----------------------------------------------------------------------------
function renderBorcListesiTab() {
    const tbody = document.getElementById("borcTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchBorcInput")?.value || "").toLowerCase().trim();
    const filterBirim = document.getElementById("filterBorcBirimSelect")?.value || "ALL";
    const filterTip = document.getElementById("filterBorcTipSelect")?.value || "ALL";
    const filterDurum = document.getElementById("filterBorcDurumSelect")?.value || "ALL";

    // Toplam sayaçlar ve döviz/altın bakiyeleri
    let kpiTlToplam = 0, kpiTlKalan = 0;
    let kpiUsdToplam = 0, kpiUsdKalan = 0;
    let kpiEurToplam = 0, kpiEurKalan = 0;
    let kpiAltinGrToplam = 0, kpiAltinGrKalan = 0;
    let kpiAltinAdetToplam = 0, kpiAltinAdetKalan = 0;

    let aktifBorcSayisi = 0;
    let kapaliBorcSayisi = 0;

    // Filtreleme
    const filtered = dbBorclar.filter(b => {
        const sum = getBorcSummary(b.id);
        const matchesSearch = !searchTerm ||
            (b.kisi && b.kisi.toLowerCase().includes(searchTerm)) ||
            (b.telefon && b.telefon.toLowerCase().includes(searchTerm)) ||
            (b.aciklama && b.aciklama.toLowerCase().includes(searchTerm));

        const matchesBirim = (filterBirim === 'ALL') || (b.birim === filterBirim);
        const matchesTip = (filterTip === 'ALL') || (b.alinisTipi === filterTip);
        
        let matchesDurum = true;
        if (filterDurum === 'ACIK') matchesDurum = (sum.durum === 'ACIK');
        else if (filterDurum === 'KISMI') matchesDurum = (sum.durum === 'KISMI');
        else if (filterDurum === 'ODENDI') matchesDurum = (sum.durum === 'ODENDI');
        else if (filterDurum === 'AKTIF') matchesDurum = (sum.durum !== 'ODENDI');

        return matchesSearch && matchesBirim && matchesTip && matchesDurum;
    });

    // Bütün borçlar üzerinden KPI hesapla
    dbBorclar.forEach(b => {
        const sum = getBorcSummary(b.id);
        if (sum.durum === 'ODENDI') {
            kapaliBorcSayisi++;
        } else {
            aktifBorcSayisi++;
        }

        if (b.birim === 'TL') {
            kpiTlToplam += sum.toplamTutar;
            kpiTlKalan += sum.kalan;
        } else if (b.birim === 'USD') {
            kpiUsdToplam += sum.toplamTutar;
            kpiUsdKalan += sum.kalan;
        } else if (b.birim === 'EUR') {
            kpiEurToplam += sum.toplamTutar;
            kpiEurKalan += sum.kalan;
        } else if (b.birim === 'ALTIN_GR' || b.birim === 'ALTIN_22AYAR') {
            kpiAltinGrToplam += sum.toplamTutar;
            kpiAltinGrKalan += sum.kalan;
        } else if (b.birim.startsWith('ALTIN_')) {
            kpiAltinAdetToplam += sum.toplamTutar;
            kpiAltinAdetKalan += sum.kalan;
        }
    });

    renderKurTicker();

    // Toplam Portföy TL Değeri Hesaplama
    let altinTlKalan = 0;
    let altinTlToplam = 0;
    dbBorclar.forEach(b => {
        const sum = getBorcSummary(b.id);
        if (b.birim.startsWith('ALTIN_')) {
            altinTlKalan += convertBirimToTL(sum.kalan, b.birim);
            altinTlToplam += convertBirimToTL(sum.toplamTutar, b.birim);
        }
    });

    const netPortfolioTL = kpiTlKalan + convertBirimToTL(kpiUsdKalan, 'USD') + convertBirimToTL(kpiEurKalan, 'EUR') + altinTlKalan;
    const totalPortfolioTL = kpiTlToplam + convertBirimToTL(kpiUsdToplam, 'USD') + convertBirimToTL(kpiEurToplam, 'EUR') + altinTlToplam;

    // KPI Kartlarını Güncelle
    const kpiTlEl = document.getElementById("kpiBorcKalanTL");
    if (kpiTlEl) kpiTlEl.innerHTML = `${formatBorcMiktar(kpiTlKalan, 'TL')}`;
    const kpiTlSub = document.getElementById("kpiBorcToplamTL");
    if (kpiTlSub) kpiTlSub.innerText = `Toplam: ${formatBorcMiktar(kpiTlToplam, 'TL')}`;

    const kpiUsdEl = document.getElementById("kpiBorcKalanUSD");
    if (kpiUsdEl) kpiUsdEl.innerHTML = `${formatBorcMiktar(kpiUsdKalan, 'USD')}`;
    const kpiUsdSub = document.getElementById("kpiBorcToplamUSD");
    if (kpiUsdSub) {
        const tlApprox = Math.round(convertBirimToTL(kpiUsdKalan, 'USD')).toLocaleString('tr-TR');
        kpiUsdSub.innerHTML = `Toplam: ${formatBorcMiktar(kpiUsdToplam, 'USD')} <span style="color: var(--accent-gold); font-weight: 700;">(~${tlApprox} ₺)</span>`;
    }

    const kpiEurEl = document.getElementById("kpiBorcKalanEUR");
    if (kpiEurEl) kpiEurEl.innerHTML = `${formatBorcMiktar(kpiEurKalan, 'EUR')}`;
    const kpiEurSub = document.getElementById("kpiBorcToplamEUR");
    if (kpiEurSub) {
        const tlApprox = Math.round(convertBirimToTL(kpiEurKalan, 'EUR')).toLocaleString('tr-TR');
        kpiEurSub.innerHTML = `Toplam: ${formatBorcMiktar(kpiEurToplam, 'EUR')} <span style="color: var(--accent-gold); font-weight: 700;">(~${tlApprox} ₺)</span>`;
    }

    const kpiAltinEl = document.getElementById("kpiBorcKalanAltin");
    if (kpiAltinEl) {
        let altinStr = "";
        if (kpiAltinGrKalan > 0) altinStr += `${kpiAltinGrKalan.toLocaleString('tr-TR')} gr`;
        if (kpiAltinAdetKalan > 0) {
            if (altinStr) altinStr += " + ";
            altinStr += `${kpiAltinAdetKalan} Adet`;
        }
        if (!altinStr) altinStr = "0 gr / Adet";
        kpiAltinEl.innerText = altinStr;
    }
    const kpiAltinSub = document.getElementById("kpiBorcToplamAltin");
    if (kpiAltinSub) {
        let subStr = "";
        if (kpiAltinGrToplam > 0) subStr += `${kpiAltinGrToplam} gr`;
        if (kpiAltinAdetToplam > 0) {
            if (subStr) subStr += " / ";
            subStr += `${kpiAltinAdetToplam} Adet`;
        }
        const altinTlApprox = Math.round(altinTlKalan).toLocaleString('tr-TR');
        kpiAltinSub.innerHTML = (subStr ? `Toplam: ${subStr}` : "Borç yok") + ` <span style="color: var(--accent-gold); font-weight: 700;">(~${altinTlApprox} ₺)</span>`;
    }

    const kpiNetTlEl = document.getElementById("kpiBorcToplamNetTL");
    if (kpiNetTlEl) kpiNetTlEl.innerText = `${Math.round(netPortfolioTL).toLocaleString('tr-TR')} ₺`;

    const kpiAktifSayisiEl = document.getElementById("kpiBorcAktifSayisi");
    if (kpiAktifSayisiEl) kpiAktifSayisiEl.innerText = `${aktifBorcSayisi} Aktif Borç (Portföy: ~${Math.round(totalPortfolioTL).toLocaleString('tr-TR')} ₺)`;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--text-muted); font-size: 13px;">
            <i class="fa-solid fa-inbox" style="font-size: 26px; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
            Kayıtlı borç bulunamadı veya arama kriterine uymuyor.
        </td></tr>`;
        return;
    }

    // Sıralama: Aktifler önce, ardından tarihe göre yeni -> eski
    filtered.sort((a, b) => {
        const sumA = getBorcSummary(a.id);
        const sumB = getBorcSummary(b.id);
        if (sumA.durum === 'ODENDI' && sumB.durum !== 'ODENDI') return 1;
        if (sumA.durum !== 'ODENDI' && sumB.durum === 'ODENDI') return -1;
        return (b.tarih || "").localeCompare(a.tarih || "");
    });

    tbody.innerHTML = filtered.map(b => {
        const sum = getBorcSummary(b.id);
        const isKapandi = sum.durum === 'ODENDI';
        const rowStyle = isKapandi ? 'background: rgba(16, 185, 129, 0.03); opacity: 0.8;' : '';

        // Vade formatı
        let vadeHtml = '<span style="color: var(--text-dim);">-</span>';
        if (b.vadeTarihi) {
            const today = new Date().toISOString().slice(0, 10);
            const isGecikmis = (b.vadeTarihi < today) && !isKapandi;
            vadeHtml = `<span style="${isGecikmis ? 'color: var(--danger); font-weight: 700;' : 'font-weight: 600;'}">
                ${b.vadeTarihi.split('-').reverse().join('.')}
            </span>`;
        }

        // Kalan tutar rengi
        let kalanStyle = "font-weight: 800; font-size: 14px;";
        if (isKapandi) {
            kalanStyle += " color: var(--success);";
        } else if (sum.odenen > 0) {
            kalanStyle += " color: #d97706;";
        } else {
            kalanStyle += " color: var(--danger);";
        }

        return `
            <tr style="${rowStyle}">
                <td style="white-space: nowrap;">
                    <div style="font-weight: 700; color: var(--text-main);">${b.tarih ? b.tarih.split('-').reverse().join('.') : '-'}</div>
                    <small style="color: var(--text-dim); font-size: 10px;">ID: #${b.id}</small>
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 13.5px;">${escapeHtml(b.kisi)}</div>
                    ${b.telefon ? `<div style="font-size: 11px; color: var(--text-dim);"><i class="fa-solid fa-phone" style="font-size: 10px;"></i> ${escapeHtml(b.telefon)}</div>` : ''}
                </td>
                <td style="white-space: nowrap;">${getBorcTipiBadge(b.alinisTipi)}</td>
                <td style="white-space: nowrap;">${getBorcBirimBadge(b.birim)}</td>
                <td style="font-weight: 700; white-space: nowrap;">${formatBorcMiktar(b.tutar, b.birim)}</td>
                <td style="white-space: nowrap; color: ${sum.odenen > 0 ? 'var(--success)' : 'var(--text-dim)'}; font-weight: 600;">
                    ${formatBorcMiktar(sum.odenen, b.birim)}
                    ${sum.odenen > 0 ? `<div style="font-size: 10px; color: var(--text-dim);">(%${sum.yuzde})</div>` : ''}
                </td>
                <td style="white-space: nowrap;">
                    <div style="${kalanStyle}">${formatBorcMiktar(sum.kalan, b.birim)}</div>
                    ${b.birim !== 'TL' && sum.kalan > 0 ? `
                        <div style="font-size: 11px; color: var(--accent-gold); font-weight: 700; margin-top: 2px;" title="Güncel kura göre yaklaşık TL karşılığı">
                            ~${Math.round(convertBirimToTL(sum.kalan, b.birim)).toLocaleString('tr-TR')} ₺
                        </div>
                    ` : ''}
                </td>
                <td style="white-space: nowrap;">${vadeHtml}</td>
                <td style="white-space: nowrap;">${getBorcDurumBadge(sum.kalan, b.tutar, b.vadeTarihi)}</td>
                <td style="max-width: 180px; font-size: 12px; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHtml(b.aciklama || '')}">
                    ${escapeHtml(b.aciklama || '-')}
                </td>
                <td style="white-space: nowrap; text-align: right;">
                    <div style="display: inline-flex; gap: 4px;">
                        ${!isKapandi ? `
                            <button type="button" class="btn btn-subtle" onclick="openNewBorcOdemeModal(${b.id})" style="padding: 4px 8px; font-size: 11px; color: #10b981; border-color: rgba(16, 185, 129, 0.4);" title="Bu borca geri ödeme yap">
                                <i class="fa-solid fa-credit-card"></i> Öde
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-subtle" onclick="openBorcDetayModal(${b.id})" style="padding: 4px 8px; font-size: 11px;" title="Ödeme Geçmişi ve Detay">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </button>
                        <button type="button" class="btn btn-subtle" onclick="openEditBorcModal(${b.id})" style="padding: 4px 8px; font-size: 11px;" title="Borç Bilgilerini Düzenle">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn btn-subtle" onclick="deleteBorc(${b.id})" style="padding: 4px 8px; font-size: 11px; color: var(--danger);" title="Borcu Sil">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// ----------------------------------------------------------------------------
// 2. SEKME: BORÇ ÖDEMELERİ GEÇMİŞİ TABLOSU
// ----------------------------------------------------------------------------
function renderBorcOdemelerTab() {
    renderKurTicker();
    const tbody = document.getElementById("borcOdemelerTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchBorcOdemeInput")?.value || "").toLowerCase().trim();
    const filterKanal = document.getElementById("filterBorcOdemeKanalSelect")?.value || "ALL";

    let totalOdenenSayisi = dbBorcOdemeler.length;
    let totalTlOdenen = 0;
    let totalUsdOdenen = 0;
    let totalEurOdenen = 0;
    let totalAltinGrOdenen = 0;
    let totalAltinAdetOdenen = 0;

    dbBorcOdemeler.forEach(o => {
        const borc = dbBorclar.find(b => Number(b.id) === Number(o.borcId));
        const birim = borc ? borc.birim : 'TL';
        const t = Number(o.tutar) || 0;

        if (birim === 'TL') totalTlOdenen += t;
        else if (birim === 'USD') totalUsdOdenen += t;
        else if (birim === 'EUR') totalEurOdenen += t;
        else if (birim === 'ALTIN_GR' || birim === 'ALTIN_22AYAR') totalAltinGrOdenen += t;
        else if (birim.startsWith('ALTIN_')) totalAltinAdetOdenen += t;
    });

    const kpiCount = document.getElementById("kpiBorcOdemeToplamSayisi");
    if (kpiCount) kpiCount.innerText = `${totalOdenenSayisi} Ödeme Hareketi`;

    const kpiTl = document.getElementById("kpiBorcOdemeTl");
    if (kpiTl) kpiTl.innerText = formatBorcMiktar(totalTlOdenen, 'TL');

    const kpiUsd = document.getElementById("kpiBorcOdemeUsd");
    if (kpiUsd) kpiUsd.innerText = formatBorcMiktar(totalUsdOdenen, 'USD');

    const kpiEur = document.getElementById("kpiBorcOdemeEur");
    if (kpiEur) kpiEur.innerText = formatBorcMiktar(totalEurOdenen, 'EUR');

    const kpiAltin = document.getElementById("kpiBorcOdemeAltin");
    if (kpiAltin) {
        let str = "";
        if (totalAltinGrOdenen > 0) str += `${totalAltinGrOdenen} gr`;
        if (totalAltinAdetOdenen > 0) {
            if (str) str += " + ";
            str += `${totalAltinAdetOdenen} Adet`;
        }
        kpiAltin.innerText = str || "0 gr";
    }

    const filtered = dbBorcOdemeler.filter(o => {
        const borc = dbBorclar.find(b => Number(b.id) === Number(o.borcId));
        const matchesSearch = !searchTerm ||
            (borc && borc.kisi && borc.kisi.toLowerCase().includes(searchTerm)) ||
            (o.makbuzNo && o.makbuzNo.toLowerCase().includes(searchTerm)) ||
            (o.aciklama && o.aciklama.toLowerCase().includes(searchTerm));

        const matchesKanal = (filterKanal === 'ALL') || (o.kanal === filterKanal);
        return matchesSearch && matchesKanal;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-muted); font-size: 13px;">
            <i class="fa-solid fa-receipt" style="font-size: 26px; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
            Kayıtlı ödeme bulunamadı.
        </td></tr>`;
        return;
    }

    // Tarihe göre yeni -> eski sırala
    filtered.sort((a, b) => (b.tarih || "").localeCompare(a.tarih || ""));

    tbody.innerHTML = filtered.map(o => {
        const borc = dbBorclar.find(b => Number(b.id) === Number(o.borcId));
        const kisi = borc ? borc.kisi : '<span style="color: var(--danger);">(Silinmiş Borç)</span>';
        const birim = borc ? borc.birim : 'TL';
        const borcInfo = borc ? `#${borc.id} - ${borc.tarih ? borc.tarih.split('-').reverse().join('.') : ''} (${formatBorcMiktar(borc.tutar, birim)})` : '-';

        return `
            <tr>
                <td style="font-weight: 700; white-space: nowrap;">${o.tarih ? o.tarih.split('-').reverse().join('.') : '-'}</td>
                <td>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 13.5px;">${escapeHtml(kisi)}</div>
                    <small style="color: var(--text-dim); font-size: 11px;">${escapeHtml(borcInfo)}</small>
                </td>
                <td style="white-space: nowrap;">
                    ${(o.odenenBirim === 'TL' && borc && borc.birim !== 'TL') ? `${getBorcBirimBadge('TL')} <span style="font-size: 10px; color: var(--text-dim);">➔</span> ${getBorcBirimBadge(birim)}` : getBorcBirimBadge(birim)}
                </td>
                <td style="white-space: nowrap;">
                    ${(o.odenenBirim === 'TL' && borc && borc.birim !== 'TL') ? `
                        <div style="font-weight: 800; font-size: 14px; color: #047857;">
                            ${Number(o.odenenTutar || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </div>
                        <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">
                            Kur: <strong>${o.kur} ₺</strong> ➔ <span style="color: #059669; font-weight: 700;">${formatBorcMiktar(o.tutar, borc.birim)} mahsup</span>
                        </div>
                    ` : `
                        <div style="font-weight: 800; font-size: 14px; color: var(--success);">
                            ${formatBorcMiktar(o.tutar, birim)}
                        </div>
                    `}
                </td>
                <td style="white-space: nowrap;">${getKanalBadge(o.kanal)}</td>
                <td style="white-space: nowrap; font-family: monospace; font-weight: 700; color: var(--accent-gold);">
                    ${escapeHtml(o.makbuzNo || '-')}
                </td>
                <td style="font-size: 12px; color: var(--text-muted); max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHtml(o.aciklama || '')}">
                    ${escapeHtml(o.aciklama || '-')}
                </td>
                <td style="white-space: nowrap; text-align: right;">
                    <div style="display: inline-flex; gap: 4px;">
                        <button type="button" class="btn btn-subtle" onclick="printBorcOdemeMakbuz(${o.id})" style="padding: 4px 8px; font-size: 11px;" title="Tediye Makbuzu Yazdır">
                            <i class="fa-solid fa-print"></i> Makbuz
                        </button>
                        <button type="button" class="btn btn-subtle" onclick="deleteBorcOdeme(${o.id})" style="padding: 4px 8px; font-size: 11px; color: var(--danger);" title="Ödeme Kaydını Sil (Borç bakiyesi geri artar)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// ----------------------------------------------------------------------------
// 3. SEKME: NET BORÇ VE BAKİYE ÖZETİ (BİLANÇO VE KİŞİ BAZINDA DÖKÜM)
// ----------------------------------------------------------------------------
function renderBorcOzetTab() {
    renderKurTicker();
    const assetTbody = document.getElementById("borcOzetAssetTableBody");
    const personTbody = document.getElementById("borcOzetPersonTableBody");
    if (!assetTbody && !personTbody) return;

    // 1. Varlık / Para Birimi Bazında Agregasyon
    const assetTotals = {};
    Object.keys(BORC_BIRIMLERI).forEach(k => {
        assetTotals[k] = { code: k, alinan: 0, odenen: 0, kalan: 0, count: 0 };
    });

    dbBorclar.forEach(b => {
        const sum = getBorcSummary(b.id);
        const code = b.birim || 'TL';
        if (!assetTotals[code]) {
            assetTotals[code] = { code, alinan: 0, odenen: 0, kalan: 0, count: 0 };
        }
        assetTotals[code].alinan += sum.toplamTutar;
        assetTotals[code].odenen += sum.odenen;
        assetTotals[code].kalan += sum.kalan;
        assetTotals[code].count++;
    });

    if (assetTbody) {
        const activeAssets = Object.values(assetTotals).filter(a => a.count > 0);
        if (activeAssets.length === 0) {
            assetTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">Henüz borç kaydı bulunmuyor.</td></tr>`;
        } else {
            assetTbody.innerHTML = activeAssets.map(a => {
                const yuzde = a.alinan > 0 ? Math.min(100, Math.round((a.odenen / a.alinan) * 100)) : 100;
                return `
                    <tr>
                        <td style="white-space: nowrap;">${getBorcBirimBadge(a.code)}</td>
                        <td style="font-weight: 700;">${a.count} Adet Kayıt</td>
                        <td style="font-weight: 700; white-space: nowrap;">${formatBorcMiktar(a.alinan, a.code)}</td>
                        <td style="color: var(--success); font-weight: 700; white-space: nowrap;">${formatBorcMiktar(a.odenen, a.code)}</td>
                        <td style="font-weight: 800; font-size: 14px; color: ${a.kalan > 0 ? 'var(--danger)' : 'var(--success)'}; white-space: nowrap;">
                            ${formatBorcMiktar(a.kalan, a.code)}
                            ${(a.code !== 'TL' && a.kalan > 0) ? `
                                <div style="font-size: 11px; color: var(--accent-gold); font-weight: 700; margin-top: 2px;">
                                    ~${Math.round(convertBirimToTL(a.kalan, a.code)).toLocaleString('tr-TR')} ₺
                                </div>
                            ` : ''}
                        </td>
                        <td style="min-width: 140px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${yuzde}%; height: 100%; background: ${yuzde === 100 ? '#10b981' : '#f59e0b'};"></div>
                                </div>
                                <span style="font-size: 11px; font-weight: 700; color: var(--text-dim);">%${yuzde}</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    }

    // 2. Kişi Bazında Borç Dökümü
    if (personTbody) {
        const personMap = {};
        dbBorclar.forEach(b => {
            const kisiKey = (b.kisi || "Bilinmeyen").trim();
            if (!personMap[kisiKey]) {
                personMap[kisiKey] = {
                    kisi: kisiKey,
                    telefon: b.telefon || "",
                    borclar: [],
                    currencies: {}
                };
            }
            if (!personMap[kisiKey].telefon && b.telefon) {
                personMap[kisiKey].telefon = b.telefon;
            }
            personMap[kisiKey].borclar.push(b);

            const sum = getBorcSummary(b.id);
            const cur = b.birim || 'TL';
            if (!personMap[kisiKey].currencies[cur]) {
                personMap[kisiKey].currencies[cur] = { alinan: 0, odenen: 0, kalan: 0 };
            }
            personMap[kisiKey].currencies[cur].alinan += sum.toplamTutar;
            personMap[kisiKey].currencies[cur].odenen += sum.odenen;
            personMap[kisiKey].currencies[cur].kalan += sum.kalan;
        });

        const personList = Object.values(personMap);
        if (personList.length === 0) {
            personTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color: var(--text-muted);">Kayıtlı kişi bulunmuyor.</td></tr>`;
        } else {
            // Bakiyesi olanları önce sırala
            personList.sort((a, b) => {
                const aHasDebt = Object.values(a.currencies).some(c => c.kalan > 0);
                const bHasDebt = Object.values(b.currencies).some(c => c.kalan > 0);
                if (aHasDebt && !bHasDebt) return -1;
                if (!aHasDebt && bHasDebt) return 1;
                return a.kisi.localeCompare(b.kisi);
            });

            personTbody.innerHTML = personList.map(p => {
                const hasKalan = Object.values(p.currencies).some(c => c.kalan > 0);
                const alinanListHtml = Object.keys(p.currencies)
                    .map(c => `<div>${formatBorcMiktar(p.currencies[c].alinan, c)}</div>`)
                    .join("");
                const odenenListHtml = Object.keys(p.currencies)
                    .map(c => `<div style="color: var(--success);">${formatBorcMiktar(p.currencies[c].odenen, c)}</div>`)
                    .join("");
                const kalanListHtml = Object.keys(p.currencies)
                    .map(c => {
                        const kal = p.currencies[c].kalan;
                        const tlApp = (c !== 'TL' && kal > 0) ? ` <span style="font-size: 10px; color: var(--accent-gold); font-weight: 600;">(~${Math.round(convertBirimToTL(kal, c)).toLocaleString('tr-TR')} ₺)</span>` : '';
                        return `<div style="font-weight: 800; color: ${kal > 0 ? 'var(--danger)' : 'var(--success)'};">${formatBorcMiktar(kal, c)}${tlApp}</div>`;
                    })
                    .join("");

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 700; font-size: 14px; color: var(--text-main);">${escapeHtml(p.kisi)}</div>
                            ${p.telefon ? `<div style="font-size: 11px; color: var(--text-dim);"><i class="fa-solid fa-phone"></i> ${escapeHtml(p.telefon)}</div>` : ''}
                        </td>
                        <td style="font-weight: 600;">${p.borclar.length} Kayıt</td>
                        <td style="white-space: nowrap;">${alinanListHtml}</td>
                        <td style="white-space: nowrap;">${odenenListHtml}</td>
                        <td style="white-space: nowrap;">${kalanListHtml}</td>
                        <td style="white-space: nowrap;">
                            ${hasKalan ? 
                                '<span class="badge-pill badge-danger" style="font-weight: 700;"><i class="fa-solid fa-circle-exclamation"></i> Bakiyeli</span>' : 
                                '<span class="badge-pill badge-success" style="font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Borç Kapandı</span>'}
                        </td>
                        <td style="white-space: nowrap; text-align: right;">
                            <div style="display: inline-flex; gap: 4px;">
                                ${hasKalan ? `
                                    <button type="button" class="btn btn-subtle" onclick="openNewBorcOdemeModalForPerson('${escapeHtml(p.kisi).replace(/'/g, "\\'")}')" style="font-size: 11px; padding: 4px 8px; color: #10b981; border-color: rgba(16, 185, 129, 0.4);" title="Bu kişiye ödeme yap">
                                        <i class="fa-solid fa-credit-card"></i> Öde
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    }
}

// ----------------------------------------------------------------------------
// MODAL: YENİ BORÇ / BORÇ DÜZENLEME
// ----------------------------------------------------------------------------
function openNewBorcModal() {
    const modal = document.getElementById("modalBorcForm");
    if (!modal) return;

    document.getElementById("formBorcEditId").value = "";
    document.getElementById("formBorcModalTitle").innerText = "Yeni Borç & Emanet Ekle";
    document.getElementById("formBorcTarih").value = new Date().toISOString().slice(0, 10);
    document.getElementById("formBorcKisi").value = "";
    document.getElementById("formBorcTelefon").value = "";
    document.getElementById("formBorcAlinisTipi").value = "ELDEN";
    document.getElementById("formBorcBirim").value = "TL";
    document.getElementById("formBorcTutar").value = "";
    document.getElementById("formBorcVadeTarihi").value = "";
    document.getElementById("formBorcAciklama").value = "";

    updateBorcFormTutarLabel();
    openModal('modalBorcForm');
}

function openEditBorcModal(id) {
    const borc = dbBorclar.find(b => Number(b.id) === Number(id));
    if (!borc) {
        showToast("Borç kaydı bulunamadı!", "error");
        return;
    }

    document.getElementById("formBorcEditId").value = borc.id;
    document.getElementById("formBorcModalTitle").innerText = "Borç Kaydını Düzenle (#" + borc.id + ")";
    document.getElementById("formBorcTarih").value = borc.tarih || "";
    document.getElementById("formBorcKisi").value = borc.kisi || "";
    document.getElementById("formBorcTelefon").value = borc.telefon || "";
    document.getElementById("formBorcAlinisTipi").value = borc.alinisTipi || "ELDEN";
    document.getElementById("formBorcBirim").value = borc.birim || "TL";
    document.getElementById("formBorcTutar").value = borc.tutar || "";
    document.getElementById("formBorcVadeTarihi").value = borc.vadeTarihi || "";
    document.getElementById("formBorcAciklama").value = borc.aciklama || "";

    updateBorcFormTutarLabel();
    openModal('modalBorcForm');
}

function updateBorcFormTutarLabel() {
    const birimCode = document.getElementById("formBorcBirim")?.value || "TL";
    const birim = BORC_BIRIMLERI[birimCode] || { label: birimCode, type: 'currency' };
    const label = document.getElementById("formBorcTutarLabel");
    if (label) {
        if (birim.type === 'weight') {
            label.innerText = `Alınan Gram / Ağırlık (${birim.symbol}) *`;
        } else if (birim.type === 'count') {
            label.innerText = `Alınan Adet Sayısı (${birim.symbol}) *`;
        } else {
            label.innerText = `Alınan Borç Tutarı (${birim.label}) *`;
        }
    }
}

function submitBorcForm(e) {
    if (e) e.preventDefault();

    const editId = document.getElementById("formBorcEditId").value;
    const tarih = document.getElementById("formBorcTarih").value;
    const kisi = document.getElementById("formBorcKisi").value.trim();
    const telefon = document.getElementById("formBorcTelefon").value.trim();
    const alinisTipi = document.getElementById("formBorcAlinisTipi").value;
    const birim = document.getElementById("formBorcBirim").value;
    const tutar = parseFloat(document.getElementById("formBorcTutar").value);
    const vadeTarihi = document.getElementById("formBorcVadeTarihi").value;
    const aciklama = document.getElementById("formBorcAciklama").value.trim();

    if (!kisi) {
        showToast("Lütfen borç alınan kişinin adını giriniz.", "error");
        return;
    }
    if (isNaN(tutar) || tutar <= 0) {
        showToast("Lütfen geçerli bir tutar veya miktar giriniz.", "error");
        return;
    }

    if (editId) {
        // Düzenleme
        const idx = dbBorclar.findIndex(b => Number(b.id) === Number(editId));
        if (idx >= 0) {
            dbBorclar[idx] = {
                ...dbBorclar[idx],
                tarih,
                kisi,
                telefon,
                alinisTipi,
                birim,
                tutar,
                vadeTarihi,
                aciklama
            };
            saveBorcDb();
            showToast("Borç kaydı başarıyla güncellendi.");
        }
    } else {
        // Yeni Kayıt
        const newId = Date.now();
        dbBorclar.push({
            id: newId,
            tarih,
            kisi,
            telefon,
            alinisTipi,
            birim,
            tutar,
            vadeTarihi,
            aciklama,
            olusturmaTarihi: new Date().toISOString()
        });
        saveBorcDb();
        showToast("Yeni borç kaydı başarıyla eklendi.");
    }

    closeModal('modalBorcForm');
    renderBorcListesiTab();
    renderBorcOzetTab();
}

function deleteBorc(id) {
    const borc = dbBorclar.find(b => Number(b.id) === Number(id));
    if (!borc) return;

    const odemeCount = dbBorcOdemeler.filter(o => Number(o.borcId) === Number(id)).length;
    let confirmMsg = `"${borc.kisi}" isimli kişiden alınan ${formatBorcMiktar(borc.tutar, borc.birim)} tutarındaki borcu silmek istediğinize emin misiniz?`;
    if (odemeCount > 0) {
        confirmMsg += `\n\n⚠️ DİKKAT: Bu borca ait ${odemeCount} adet yapılmış ödeme kaydı da birlikte silinecektir!`;
    }

    if (confirm(confirmMsg)) {
        dbBorclar = dbBorclar.filter(b => Number(b.id) !== Number(id));
        dbBorcOdemeler = dbBorcOdemeler.filter(o => Number(o.borcId) !== Number(id));
        saveBorcDb();
        showToast("Borç kaydı ve bağlı ödemeleri silindi.");
        renderBorcListesiTab();
        renderBorcOdemelerTab();
        renderBorcOzetTab();
    }
}

// ----------------------------------------------------------------------------
// MODAL: BORÇ GERİ ÖDEMESİ YAP (ÖDEME MODALI)
// ----------------------------------------------------------------------------
function openNewBorcOdemeModal(preSelectedBorcId = null) {
    const modal = document.getElementById("modalBorcOdemeForm");
    if (!modal) return;

    const select = document.getElementById("formBorcOdemeBorcId");
    if (!select) return;

    // Aktif (henüz kapanmamış) borçları listele
    select.innerHTML = '<option value="">-- Borç Seçiniz --</option>';

    // Önce kapanmamışları ekle, en sona da gerekirse seçilmiş olanı ekle
    dbBorclar.forEach(b => {
        const sum = getBorcSummary(b.id);
        const isSelected = preSelectedBorcId && Number(preSelectedBorcId) === Number(b.id);
        if (sum.durum !== 'ODENDI' || isSelected) {
            const opt = document.createElement("option");
            opt.value = b.id;
            opt.innerText = `${b.kisi} - Kalan: ${formatBorcMiktar(sum.kalan, b.birim)} (${getBorcTipiLabel(b.alinisTipi)})`;
            if (isSelected) opt.selected = true;
            select.appendChild(opt);
        }
    });

    document.getElementById("formBorcOdemeTarih").value = new Date().toISOString().slice(0, 10);
    document.getElementById("formBorcOdemeTutar").value = "";
    document.getElementById("formBorcOdemeKanal").value = "ELDEN";
    document.getElementById("formBorcOdemeMakbuzNo").value = "MAK-" + Math.floor(1000 + Math.random() * 9000);
    document.getElementById("formBorcOdemeAciklama").value = "";

    updateBorcOdemeModalInfo();
    openModal('modalBorcOdemeForm');
}

function openNewBorcOdemeModalForPerson(kisiName) {
    // Kişiye ait ilk açık borcu bul
    const borc = dbBorclar.find(b => (b.kisi || "").toLowerCase() === (kisiName || "").toLowerCase() && getBorcSummary(b.id).kalan > 0);
    if (borc) {
        openNewBorcOdemeModal(borc.id);
    } else {
        openNewBorcOdemeModal();
    }
}

function getBorcTipiLabel(tipi) {
    return tipi === 'ELDEN' ? 'Elden' : 'Resmi/Banka';
}

let currentBorcOdemeMode = 'TL'; // 'TL' | 'BIRIM'

function setBorcOdemeMode(mode) {
    currentBorcOdemeMode = mode;
    const btnTL = document.getElementById("btnOdemeModeTL");
    const btnBirim = document.getElementById("btnOdemeModeBirim");
    const containerTL = document.getElementById("containerOdemeTutarTL");
    const containerBirim = document.getElementById("containerOdemeTutarBirim");

    if (mode === 'TL') {
        if (btnTL) btnTL.classList.add("active");
        if (btnBirim) btnBirim.classList.remove("active");
        if (containerTL) containerTL.style.display = "block";
        if (containerBirim) containerBirim.style.display = "none";
    } else {
        if (btnTL) btnTL.classList.remove("active");
        if (btnBirim) btnBirim.classList.add("active");
        if (containerTL) containerTL.style.display = "none";
        if (containerBirim) containerBirim.style.display = "block";
    }

    onBorcKurOrAmountChange();
}

function updateBorcOdemeModalInfo() {
    const borcId = document.getElementById("formBorcOdemeBorcId")?.value;
    const infoBox = document.getElementById("borcOdemeSelectedInfo");
    const currencyPanel = document.getElementById("borcOdemeCurrencyPanel");
    const containerTL = document.getElementById("containerOdemeTutarTL");
    const containerBirim = document.getElementById("containerOdemeTutarBirim");
    const tutarLabel = document.getElementById("formBorcOdemeTutarLabel");

    if (!borcId) {
        if (infoBox) infoBox.style.display = "none";
        if (currencyPanel) currencyPanel.style.display = "none";
        if (containerTL) containerTL.style.display = "none";
        if (containerBirim) containerBirim.style.display = "block";
        if (tutarLabel) tutarLabel.innerText = "Ödeme Tutarı / Miktarı *";
        return;
    }

    const borc = dbBorclar.find(b => Number(b.id) === Number(borcId));
    if (!borc) return;

    const sum = getBorcSummary(borc.id);
    const birim = BORC_BIRIMLERI[borc.birim] || { label: borc.birim, symbol: '', isGold: false };
    const kur = getBirimKur(borc.birim);

    if (infoBox) {
        infoBox.style.display = "block";
        const tlKarsiligiHtml = borc.birim !== 'TL' ? ` <span style="color: var(--accent-gold); font-size: 11.5px; font-weight: 700;">(~${(sum.kalan * kur).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺)</span>` : '';
        infoBox.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 14px; font-size: 12.5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-weight: 700; color: var(--text-main);">${escapeHtml(borc.kisi)}</span> 
                        <span style="color: var(--text-dim); margin-left: 6px;">(${getBorcTipiBadge(borc.alinisTipi)})</span>
                    </div>
                    <div style="font-weight: 800; color: var(--danger); font-size: 13.5px;">
                        Kalan: ${formatBorcMiktar(sum.kalan, borc.birim)}${tlKarsiligiHtml}
                    </div>
                </div>
                <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
                    Toplam Borç: ${formatBorcMiktar(borc.tutar, borc.birim)} | Önceden Ödenen: ${formatBorcMiktar(sum.odenen, borc.birim)}
                </div>
            </div>
        `;
    }

    // Eğer borç döviz veya altın ise kur ve çevirici panelini aç
    if (borc.birim !== 'TL') {
        if (currencyPanel) currencyPanel.style.display = "block";

        const labelKurBirim = document.getElementById("labelKurBirimAd");
        if (labelKurBirim) labelKurBirim.innerText = birim.label;

        const labelModeBirim = document.getElementById("labelOdemeModeBirim");
        if (labelModeBirim) labelModeBirim.innerText = `${birim.symbol || birim.label} Olarak Öde`;

        const kurInput = document.getElementById("formBorcOdemeKur");
        if (kurInput) kurInput.value = kur;

        const kalanTlEl = document.getElementById("borcKalanTLDegeri");
        if (kalanTlEl) kalanTlEl.innerText = (sum.kalan * kur).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

        // Varsayılan olarak TL modunu aç
        setBorcOdemeMode('TL');
    } else {
        if (currencyPanel) currencyPanel.style.display = "none";
        if (containerTL) containerTL.style.display = "none";
        if (containerBirim) containerBirim.style.display = "block";
        if (tutarLabel) tutarLabel.innerText = "Ödeme Tutarı (TL) *";
    }

    // Kanal önerisi
    const kanalSelect = document.getElementById("formBorcOdemeKanal");
    if (kanalSelect) {
        if (borc.birim.startsWith('ALTIN_') && currentBorcOdemeMode === 'BIRIM') {
            kanalSelect.value = "FIZIKSEL";
        } else if (borc.alinisTipi === 'ELDEN') {
            kanalSelect.value = "ELDEN";
        } else {
            kanalSelect.value = "BANKA";
        }
    }
}

function refreshOdemeModalKur() {
    const borcId = document.getElementById("formBorcOdemeBorcId")?.value;
    if (!borcId) return;
    const borc = dbBorclar.find(b => Number(b.id) === Number(borcId));
    if (!borc) return;

    const guncelKur = getBirimKur(borc.birim);
    const kurInput = document.getElementById("formBorcOdemeKur");
    if (kurInput) kurInput.value = guncelKur;

    onBorcKurOrAmountChange();
    showToast(`Piyasa kuru yüklendi: ${guncelKur} ₺`);
}

function onBorcKurOrAmountChange() {
    const borcId = document.getElementById("formBorcOdemeBorcId")?.value;
    if (!borcId) return;
    const borc = dbBorclar.find(b => Number(b.id) === Number(borcId));
    if (!borc) return;

    const sum = getBorcSummary(borc.id);
    const kur = parseFloat(document.getElementById("formBorcOdemeKur")?.value) || 1;
    const kalanTl = sum.kalan * kur;

    const kalanTlEl = document.getElementById("borcKalanTLDegeri");
    if (kalanTlEl) kalanTlEl.innerText = kalanTl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

    const sonucKutusu = document.getElementById("borcOdemeCeviriSonucKutusu");
    if (!sonucKutusu) return;

    if (borc.birim === 'TL') return;

    if (currentBorcOdemeMode === 'TL') {
        const tlTutar = parseFloat(document.getElementById("formBorcOdemeTutarTL")?.value) || 0;
        if (tlTutar <= 0) {
            sonucKutusu.innerHTML = `
                <div style="color: #64748b;">
                    <i class="fa-solid fa-circle-info"></i> Ödemek istediğiniz <strong>TL tutarını</strong> giriniz veya yukarıdaki hızlı butonlara tıklayınız.
                </div>
            `;
            return;
        }

        const mahsupDoviz = tlTutar / kur;
        const yeniKalanDoviz = Math.max(0, sum.kalan - mahsupDoviz);
        const yeniKalanTl = yeniKalanDoviz * kur;
        const tamamiKapandi = yeniKalanDoviz <= 0.0001;

        // Eş zamanlı olarak diğer tutar inputunu da senkronize edelim
        const birimInput = document.getElementById("formBorcOdemeTutar");
        if (birimInput) birimInput.value = Math.round(mahsupDoviz * 1000) / 1000;

        if (mahsupDoviz > sum.kalan + 0.001) {
            sonucKutusu.innerHTML = `
                <div style="color: #b91c1c; font-weight: 700;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Girdiğiniz ${tlTutar.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺, kalan borçtan (${kalanTl.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺) fazladır!
                </div>
                <div style="font-size: 11px; color: #dc2626; margin-top: 3px;">
                    Borcun tamamını kapatmak için <strong>${kalanTl.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</strong> ödemeniz yeterlidir.
                </div>
            `;
        } else {
            sonucKutusu.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <div>
                        <span style="font-size: 11px; color: #047857;">Ödenen:</span> <strong>${tlTutar.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</strong>
                        <span style="color: #64748b; margin: 0 4px;">➔</span> 
                        <span style="color: #059669; font-weight: 800;">Borçtan ${formatBorcMiktar(mahsupDoviz, borc.birim)} Düşülecek</span>
                    </div>
                    <div style="font-weight: 700; color: ${tamamiKapandi ? '#059669' : '#b45309'}; font-size: 11.5px;">
                        ${tamamiKapandi ? '🟢 Borç Tamamen Kapanıyor!' : `Kalan: ${formatBorcMiktar(yeniKalanDoviz, borc.birim)} (~${yeniKalanTl.toLocaleString('tr-TR', {maximumFractionDigits: 0})} ₺)`}
                    </div>
                </div>
            `;
        }
    } else {
        // Kendi biriminde ödeme
        const dovizTutar = parseFloat(document.getElementById("formBorcOdemeTutar")?.value) || 0;
        if (dovizTutar <= 0) {
            sonucKutusu.innerHTML = `
                <div style="color: #64748b;">
                    <i class="fa-solid fa-circle-info"></i> Ödemek istediğiniz <strong>${borc.birim} miktarını</strong> giriniz.
                </div>
            `;
            return;
        }

        const tlKarsilik = dovizTutar * kur;
        const yeniKalanDoviz = Math.max(0, sum.kalan - dovizTutar);
        const tamamiKapandi = yeniKalanDoviz <= 0.0001;

        // TL inputunu da senkronize et
        const tlInput = document.getElementById("formBorcOdemeTutarTL");
        if (tlInput) tlInput.value = Math.round(tlKarsilik * 100) / 100;

        sonucKutusu.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div>
                    <span style="font-size: 11px; color: #047857;">Ödenen Miktar:</span> <strong>${formatBorcMiktar(dovizTutar, borc.birim)}</strong>
                    <span style="color: #64748b; margin: 0 4px;">➔</span> 
                    <span style="color: #b45309; font-weight: 800;">TL Karşılığı: ~${tlKarsilik.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
                </div>
                <div style="font-weight: 700; color: ${tamamiKapandi ? '#059669' : '#b45309'}; font-size: 11.5px;">
                    ${tamamiKapandi ? '🟢 Borç Tamamen Kapanıyor!' : `Kalan: ${formatBorcMiktar(yeniKalanDoviz, borc.birim)}`}
                </div>
            </div>
        `;
    }
}

function fillBorcOdemeFullRemainingTL() {
    const borcId = document.getElementById("formBorcOdemeBorcId")?.value;
    if (!borcId) {
        showToast("Lütfen önce listeden bir borç seçiniz.", "error");
        return;
    }
    const sum = getBorcSummary(borcId);
    const kur = parseFloat(document.getElementById("formBorcOdemeKur")?.value) || 1;
    const fullTL = Math.round(sum.kalan * kur * 100) / 100;

    const inputTL = document.getElementById("formBorcOdemeTutarTL");
    if (inputTL) {
        inputTL.value = fullTL;
        onBorcKurOrAmountChange();
        showToast(`Kalan borcun tamamı TL olarak dolduruldu: ${fullTL.toLocaleString('tr-TR')} ₺`);
    }
}

function fillBorcOdemeHalfRemainingTL() {
    const borcId = document.getElementById("formBorcOdemeBorcId")?.value;
    if (!borcId) {
        showToast("Lütfen önce listeden bir borç seçiniz.", "error");
        return;
    }
    const sum = getBorcSummary(borcId);
    const kur = parseFloat(document.getElementById("formBorcOdemeKur")?.value) || 1;
    const halfTL = Math.round((sum.kalan / 2) * kur * 100) / 100;

    const inputTL = document.getElementById("formBorcOdemeTutarTL");
    if (inputTL) {
        inputTL.value = halfTL;
        onBorcKurOrAmountChange();
        showToast(`Kalan borcun yarısı dolduruldu: ${halfTL.toLocaleString('tr-TR')} ₺`);
    }
}

function fillBorcOdemeFullRemaining() {
    const borcId = document.getElementById("formBorcOdemeBorcId")?.value;
    if (!borcId) {
        showToast("Lütfen önce listeden borç seçiniz.", "error");
        return;
    }
    const sum = getBorcSummary(borcId);
    const tutarInput = document.getElementById("formBorcOdemeTutar");
    if (tutarInput) {
        tutarInput.value = sum.kalan;
        onBorcKurOrAmountChange();
        showToast(`Kalan bakiyenin tamamı (${sum.kalan}) dolduruldu.`);
    }
}

function submitBorcOdemeForm(e) {
    if (e) e.preventDefault();

    const borcId = document.getElementById("formBorcOdemeBorcId").value;
    const tarih = document.getElementById("formBorcOdemeTarih").value;
    const kanal = document.getElementById("formBorcOdemeKanal").value;
    const makbuzNo = document.getElementById("formBorcOdemeMakbuzNo").value.trim();
    let aciklama = document.getElementById("formBorcOdemeAciklama").value.trim();

    if (!borcId) {
        showToast("Lütfen bir borç seçiniz.", "error");
        return;
    }

    const borc = dbBorclar.find(b => Number(b.id) === Number(borcId));
    if (!borc) {
        showToast("Borç kaydı bulunamadı!", "error");
        return;
    }

    const sum = getBorcSummary(borc.id);
    let tutarDusen = 0;
    let odenenBirim = borc.birim;
    let odenenTutar = 0;
    let kur = 1;

    if (borc.birim !== 'TL' && currentBorcOdemeMode === 'TL') {
        const tlTutar = parseFloat(document.getElementById("formBorcOdemeTutarTL").value);
        kur = parseFloat(document.getElementById("formBorcOdemeKur").value);

        if (isNaN(tlTutar) || tlTutar <= 0) {
            showToast("Lütfen geçerli bir TL ödeme tutarı giriniz.", "error");
            return;
        }
        if (isNaN(kur) || kur <= 0) {
            showToast("Lütfen geçerli bir kur değeri giriniz.", "error");
            return;
        }

        tutarDusen = tlTutar / kur;
        odenenBirim = 'TL';
        odenenTutar = tlTutar;

        if (tutarDusen > sum.kalan + 0.001) {
            const onay = confirm(`Girdiğiniz TL tutarı (${tlTutar.toLocaleString('tr-TR')} ₺), kalan borcun tamamından (${(sum.kalan * kur).toLocaleString('tr-TR')} ₺) daha fazladır!\n\nBorç bakiyesi kapatılsın mı?`);
            if (!onay) return;
        }

        if (!aciklama) {
            aciklama = `${tlTutar.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺ ödendi (Kur: ${kur} ₺ | ${formatBorcMiktar(tutarDusen, borc.birim)} mahsup)`;
        }
    } else {
        const girilenTutar = parseFloat(document.getElementById("formBorcOdemeTutar").value);
        if (isNaN(girilenTutar) || girilenTutar <= 0) {
            showToast("Lütfen geçerli bir ödeme tutarı giriniz.", "error");
            return;
        }

        tutarDusen = girilenTutar;
        odenenBirim = borc.birim;
        odenenTutar = girilenTutar;
        kur = (borc.birim !== 'TL') ? (parseFloat(document.getElementById("formBorcOdemeKur")?.value) || getBirimKur(borc.birim)) : 1;

        if (tutarDusen > sum.kalan + 0.0001) {
            const onay = confirm(`Girdiğiniz ödeme tutarı (${formatBorcMiktar(tutarDusen, borc.birim)}), kalan borçtan (${formatBorcMiktar(sum.kalan, borc.birim)}) daha fazla! Yine de işlemek istiyor musunuz?`);
            if (!onay) return;
        }
    }

    const newPayment = {
        id: Date.now(),
        borcId: Number(borcId),
        tarih,
        tutar: tutarDusen, // Borcun ana para biriminden tam olarak düşecek tutar
        odenenBirim,
        odenenTutar,
        kur,
        mahsupBirim: borc.birim,
        mahsupMiktar: tutarDusen,
        kanal,
        makbuzNo,
        aciklama,
        olusturmaTarihi: new Date().toISOString()
    };

    dbBorcOdemeler.push(newPayment);
    saveBorcDb();

    closeModal('modalBorcOdemeForm');
    showToast("Borç geri ödemesi başarıyla kaydedildi ve bakiye düşüldü.");

    renderBorcListesiTab();
    renderBorcOdemelerTab();
    renderBorcOzetTab();
}

function deleteBorcOdeme(id) {
    const odeme = dbBorcOdemeler.find(o => Number(o.id) === Number(id));
    if (!odeme) return;

    const borc = dbBorclar.find(b => Number(b.id) === Number(odeme.borcId));
    const kisi = borc ? borc.kisi : 'İlgili kişi';
    const birim = borc ? borc.birim : 'TL';

    if (confirm(`"${kisi}" için yapılmış ${formatBorcMiktar(odeme.tutar, birim)} tutarındaki ödeme kaydını silmek istediğinize emin misiniz?\n\n(Bu işlem borcun kalan bakiyesini tekrar artıracaktır)`)) {
        dbBorcOdemeler = dbBorcOdemeler.filter(o => Number(o.id) !== Number(id));
        saveBorcDb();
        showToast("Ödeme kaydı silindi, borç bakiyesi güncellendi.");
        renderBorcListesiTab();
        renderBorcOdemelerTab();
        renderBorcOzetTab();
    }
}

// ----------------------------------------------------------------------------
// MODAL: BORÇ DETAYI VE ÖDEME HAREKETLERİ
// ----------------------------------------------------------------------------
function openBorcDetayModal(borcId) {
    const borc = dbBorclar.find(b => Number(b.id) === Number(borcId));
    if (!borc) return;

    const sum = getBorcSummary(borc.id);
    const odemeler = dbBorcOdemeler.filter(o => Number(o.borcId) === Number(borc.id));

    const content = document.getElementById("borcDetayModalContent");
    if (!content) return;

    let odemelerHtml = "";
    if (odemeler.length === 0) {
        odemelerHtml = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">Bu borca ait henüz herhangi bir geri ödeme yapılmamış.</div>`;
    } else {
        odemelerHtml = `
            <table class="data-table" style="font-size: 12px; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th>Ödenen Miktar</th>
                        <th>Kanal</th>
                        <th>Makbuz / Dekont</th>
                        <th>Açıklama</th>
                        <th>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    ${odemeler.map(o => `
                        <tr>
                            <td style="font-weight: 700;">${o.tarih ? o.tarih.split('-').reverse().join('.') : '-'}</td>
                            <td style="font-weight: 800; color: var(--success);">${formatBorcMiktar(o.tutar, borc.birim)}</td>
                            <td>${getKanalBadge(o.kanal)}</td>
                            <td style="font-family: monospace; font-weight: 700;">${escapeHtml(o.makbuzNo || '-')}</td>
                            <td>${escapeHtml(o.aciklama || '-')}</td>
                            <td style="text-align: right;">
                                <button type="button" class="btn btn-subtle" onclick="printBorcOdemeMakbuz(${o.id})" style="padding: 2px 6px; font-size: 10px;" title="Makbuz">
                                    <i class="fa-solid fa-print"></i>
                                </button>
                                <button type="button" class="btn btn-subtle" onclick="deleteBorcOdeme(${o.id}); openBorcDetayModal(${borc.id});" style="padding: 2px 6px; font-size: 10px; color: var(--danger);" title="Sil">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    content.innerHTML = `
        <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        ${escapeHtml(borc.kisi)} 
                        ${getBorcTipiBadge(borc.alinisTipi)}
                        ${getBorcBirimBadge(borc.birim)}
                    </h3>
                    <div style="font-size: 12px; color: var(--text-dim);">
                        ${borc.telefon ? `<span><i class="fa-solid fa-phone"></i> ${escapeHtml(borc.telefon)}</span> | ` : ''}
                        <span>Alınış Tarihi: ${borc.tarih ? borc.tarih.split('-').reverse().join('.') : '-'}</span>
                        ${borc.vadeTarihi ? ` | <span>Vade: <strong>${borc.vadeTarihi.split('-').reverse().join('.')}</strong></span>` : ''}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Kalan Borç</div>
                    <div style="font-size: 18px; font-weight: 900; color: ${sum.kalan > 0 ? 'var(--danger)' : 'var(--success)'};">
                        ${formatBorcMiktar(sum.kalan, borc.birim)}
                    </div>
                </div>
            </div>
            ${borc.aciklama ? `<div style="margin-top: 8px; font-size: 12px; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 6px;"><em>"${escapeHtml(borc.aciklama)}"</em></div>` : ''}
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
                <div style="font-size: 11px; color: #64748b; font-weight: 700;">ALINAN BORÇ</div>
                <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px;">${formatBorcMiktar(borc.tutar, borc.birim)}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; text-align: center;">
                <div style="font-size: 11px; color: #166534; font-weight: 700;">GERİ ÖDENEN</div>
                <div style="font-size: 15px; font-weight: 800; color: #15803d; margin-top: 3px;">${formatBorcMiktar(sum.odenen, borc.birim)}</div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px; text-align: center;">
                <div style="font-size: 11px; color: #991b1b; font-weight: 700;">NET KALAN</div>
                <div style="font-size: 15px; font-weight: 800; color: #b91c1c; margin-top: 3px;">${formatBorcMiktar(sum.kalan, borc.birim)}</div>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 13.5px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-list-check" style="color: var(--accent-gold);"></i> Geri Ödeme Geçmişi (${odemeler.length})
            </h4>
            ${sum.kalan > 0 ? `
                <button type="button" class="btn btn-gold" onclick="closeModal('modalBorcDetay'); openNewBorcOdemeModal(${borc.id});" style="font-size: 11px; padding: 5px 10px;">
                    <i class="fa-solid fa-plus"></i> + Yeni Ödeme Ekle
                </button>
            ` : ''}
        </div>
        ${odemelerHtml}
    `;

    openModal('modalBorcDetay');
}

// ----------------------------------------------------------------------------
// MAKBUZ / TEDİYE YAZDIRMA
// ----------------------------------------------------------------------------
function printBorcOdemeMakbuz(odemeId) {
    const odeme = dbBorcOdemeler.find(o => Number(o.id) === Number(odemeId));
    if (!odeme) return;

    const borc = dbBorclar.find(b => Number(b.id) === Number(odeme.borcId));
    const birim = borc ? borc.birim : 'TL';
    const sum = borc ? getBorcSummary(borc.id) : { kalan: 0, toplamTutar: 0 };
    const kurum = (typeof getKurumInfo === 'function' ? getKurumInfo().name : kurumInfo?.name) || "KURUMSAL YÖNETİM SİSTEMİ";

    const printContainer = document.getElementById("printableReceipt");
    if (!printContainer) return;

    printContainer.innerHTML = `
        <div style="max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; font-family: 'Segoe UI', Arial, sans-serif; background: #ffffff; color: #0f172a;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
                <div>
                    <h2 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">${escapeHtml(kurum)}</h2>
                    <div style="font-size: 11px; color: #64748b;">BORÇ GERİ ÖDEME VE TEDİYE MAKBUZU</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-family: monospace; font-size: 14px; font-weight: 800; color: #b45309;">${escapeHtml(odeme.makbuzNo || 'DEKONT')}</div>
                    <div style="font-size: 11px; color: #475569;">Tarih: ${odeme.tarih ? odeme.tarih.split('-').reverse().join('.') : '-'}</div>
                </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                    <div><strong>Alacaklı / Kime Ödendi:</strong> ${escapeHtml(borc ? borc.kisi : '-')}</div>
                    <div><strong>Ödeme Kanalı:</strong> ${getBorcOdemeKanalLabel(odeme.kanal)}</div>
                    <div><strong>Telefon:</strong> ${escapeHtml(borc ? (borc.telefon || '-') : '-')}</div>
                    <div><strong>İlgili Borç Alınış:</strong> ${borc && borc.tarih ? borc.tarih.split('-').reverse().join('.') : '-'} (${getBorcTipiLabel(borc ? borc.alinisTipi : '')})</div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <thead>
                    <tr style="background: #0f172a; color: white;">
                        <th style="padding: 8px; text-align: left;">Açıklama</th>
                        <th style="padding: 8px; text-align: right; width: 170px;">Ödenen Tutar / Miktar</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #cbd5e1;">
                        <td style="padding: 12px 8px;">
                            <strong>${escapeHtml(odeme.aciklama || 'Borç Geri Ödemesi')}</strong>
                            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                                Toplam Borç: ${formatBorcMiktar(borc ? borc.tutar : 0, birim)}
                                ${(odeme.odenenBirim === 'TL' && borc && borc.birim !== 'TL') ? ` | İşlem Kuru: 1 ${birim} = ${odeme.kur} TL` : ''}
                            </div>
                            ${(odeme.odenenBirim === 'TL' && borc && borc.birim !== 'TL') ? `
                                <div style="font-size: 12px; color: #059669; font-weight: 700; margin-top: 3px;">
                                    Borçtan Mahsup Edilen: ${formatBorcMiktar(odeme.tutar, birim)}
                                </div>
                            ` : ''}
                        </td>
                        <td style="padding: 12px 8px; text-align: right;">
                            ${(odeme.odenenBirim === 'TL' && borc && borc.birim !== 'TL') ? `
                                <div style="font-size: 17px; font-weight: 800; color: #15803d;">
                                    ${Number(odeme.odenenTutar || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                </div>
                                <div style="font-size: 11px; color: #64748b;">(TL Tahsilat)</div>
                            ` : `
                                <div style="font-size: 17px; font-weight: 800; color: #15803d;">
                                    ${formatBorcMiktar(odeme.tutar, birim)}
                                </div>
                            `}
                        </td>
                    </tr>
                    <tr style="background: #f1f5f9; font-weight: 700;">
                        <td style="padding: 8px;">Kalan Borç Bakiyesi:</td>
                        <td style="padding: 8px; text-align: right; color: #b91c1c;">
                            ${formatBorcMiktar(sum.kalan, birim)}
                            ${(borc && borc.birim !== 'TL') ? `<div style="font-size: 10px; color: #64748b; font-weight: normal;">(~${Math.round(convertBirimToTL(sum.kalan, birim, odeme.kur)).toLocaleString('tr-TR')} TL)</div>` : ''}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #94a3b8; font-size: 12px;">
                <div style="text-align: center; width: 180px;">
                    <div><strong>Ödemeyi Yapan (Kurum Yetkilisi)</strong></div>
                    <div style="margin-top: 40px; border-top: 1px solid #64748b;">İmza / Kaşe</div>
                </div>
                <div style="text-align: center; width: 180px;">
                    <div><strong>Teslim Alan (Alacaklı)</strong></div>
                    <div style="margin-top: 40px; border-top: 1px solid #64748b;">İmza</div>
                </div>
            </div>
            
            <div style="margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8;">
                Bu belge Kurumsal Yönetim Sistemi tarafından dijital olarak düzenlenmiştir. Tarih: ${new Date().toLocaleString('tr-TR')}
            </div>
        </div>
    `;

    window.print();
}

function getBorcOdemeKanalLabel(kanal) {
    if (kanal === 'ELDEN') return 'Elden Nakit Teslim';
    if (kanal === 'BANKA') return 'Banka Havale / EFT';
    if (kanal === 'FIZIKSEL') return 'Fiziksel Teslim (Altın/Döviz)';
    return 'Diğer';
}

// ----------------------------------------------------------------------------
// EXCEL DIŞA AKTARMA (BORÇLAR VE ÖDEMELER)
// ----------------------------------------------------------------------------
function exportBorclarToExcel() {
    if (dbBorclar.length === 0) {
        showToast("İndirilecek borç kaydı bulunmuyor.", "error");
        return;
    }
    const headers = ["ID", "Tarih", "Kişi", "Telefon", "Alınış Tipi", "Birim", "Alınan Tutar", "Geri Ödenen", "Kalan Borç", "Vade Tarihi", "Durum", "Açıklama"];
    const rows = dbBorclar.map(b => {
        const sum = getBorcSummary(b.id);
        return [
            b.id,
            b.tarih || "",
            b.kisi || "",
            b.telefon || "",
            b.alinisTipi === 'ELDEN' ? "Elden" : "Resmi / Banka",
            b.birim || "",
            b.tutar || 0,
            sum.odenen,
            sum.kalan,
            b.vadeTarihi || "",
            sum.durum,
            b.aciklama || ""
        ];
    });
    exportToExcelFile("Alinan_Borclar_Listesi", headers, rows);
}

function exportBorcOdemelerToExcel() {
    if (dbBorcOdemeler.length === 0) {
        showToast("İndirilecek ödeme kaydı bulunmuyor.", "error");
        return;
    }
    const headers = ["ID", "Ödeme Tarihi", "Kişi", "İlgili Borç ID", "Ödenen Miktar (Borçtan Düşen)", "Borç Birimi", "Ödenen TL Tutarı", "İşlem Kuru", "Kanal", "Makbuz No", "Açıklama"];
    const rows = dbBorcOdemeler.map(o => {
        const borc = dbBorclar.find(b => Number(b.id) === Number(o.borcId));
        return [
            o.id,
            o.tarih || "",
            borc ? borc.kisi : "",
            o.borcId,
            o.tutar || 0,
            borc ? borc.birim : "",
            o.odenenBirim === 'TL' ? (o.odenenTutar || "") : "",
            (o.odenenBirim === 'TL' && o.kur) ? o.kur : "",
            getBorcOdemeKanalLabel(o.kanal),
            o.makbuzNo || "",
            o.aciklama || ""
        ];
    });
    exportToExcelFile("Borc_Geri_Odemeler_Listesi", headers, rows);
}

// ----------------------------------------------------------------------------
// MODAL: KURLARI AYARLA
// ----------------------------------------------------------------------------
function openKurAyarlariModal() {
    const modal = document.getElementById("modalKurAyarlari");
    if (!modal) return;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal("kurInputUSD", dbKurlar.USD || 34.50);
    setVal("kurInputEUR", dbKurlar.EUR || 37.20);
    setVal("kurInputALTIN_GR", dbKurlar.ALTIN_GR || 3050);
    setVal("kurInputALTIN_CEYREK", dbKurlar.ALTIN_CEYREK || 5000);
    setVal("kurInputALTIN_YARIM", dbKurlar.ALTIN_YARIM || 10000);
    setVal("kurInputALTIN_TAM", dbKurlar.ALTIN_TAM || 20000);
    setVal("kurInputALTIN_ATA", dbKurlar.ALTIN_ATA || 20600);
    setVal("kurInputALTIN_22AYAR", dbKurlar.ALTIN_22AYAR || 2800);

    openModal('modalKurAyarlari');
}

function saveKurAyarlariForm(e) {
    if (e) e.preventDefault();

    const getNum = (id, def) => {
        const v = parseFloat(document.getElementById(id)?.value);
        return isNaN(v) || v <= 0 ? def : v;
    };

    dbKurlar.USD = getNum("kurInputUSD", 34.50);
    dbKurlar.EUR = getNum("kurInputEUR", 37.20);
    dbKurlar.ALTIN_GR = getNum("kurInputALTIN_GR", 3050);
    dbKurlar.ALTIN_CEYREK = getNum("kurInputALTIN_CEYREK", 5000);
    dbKurlar.ALTIN_YARIM = getNum("kurInputALTIN_YARIM", 10000);
    dbKurlar.ALTIN_TAM = getNum("kurInputALTIN_TAM", 20000);
    dbKurlar.ALTIN_ATA = getNum("kurInputALTIN_ATA", 20600);
    dbKurlar.ALTIN_22AYAR = getNum("kurInputALTIN_22AYAR", 2800);

    saveKurlarDb();
    closeModal('modalKurAyarlari');
    showToast("Piyasa kurları başarıyla güncellendi.");
}

// ----------------------------------------------------------------------------
// MODAL: HIZLI DÖVİZ VE ALTIN ÇEVİRİCİ
// ----------------------------------------------------------------------------
function openHizliCeviriciModal() {
    calculateHizliCevirici();
    openModal('modalHizliCevirici');
}

function calculateHizliCevirici() {
    const miktar = parseFloat(document.getElementById("ceviriciMiktar")?.value) || 0;
    const kaynak = document.getElementById("ceviriciKaynakBirim")?.value || "USD";
    const hedef = document.getElementById("ceviriciHedefBirim")?.value || "TL";

    const tlDegeri = convertBirimToTL(miktar, kaynak);
    const hedefMiktar = convertTLToBirim(tlDegeri, hedef);

    const kaynakAd = BORC_BIRIMLERI[kaynak]?.label || kaynak;
    const hedefAd = BORC_BIRIMLERI[hedef]?.label || hedef;

    const elKaynak = document.getElementById("ceviriciKaynakGosterim");
    if (elKaynak) elKaynak.innerText = `${miktar.toLocaleString('tr-TR')} ${kaynakAd} =`;

    const elSonuc = document.getElementById("ceviriciSonucTutar");
    if (elSonuc) {
        if (hedef === 'TL') {
            elSonuc.innerText = hedefMiktar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
        } else {
            elSonuc.innerText = formatBorcMiktar(hedefMiktar, hedef);
        }
    }

    const elAciklama = document.getElementById("ceviriciKurAciklama");
    if (elAciklama) {
        if (kaynak === 'TL' && hedef !== 'TL') {
            elAciklama.innerText = `Uygulanan Kur: 1 ${hedef} = ${getBirimKur(hedef).toLocaleString('tr-TR')} ₺`;
        } else if (kaynak !== 'TL') {
            elAciklama.innerText = `Uygulanan Kur: 1 ${kaynak} = ${getBirimKur(kaynak).toLocaleString('tr-TR')} ₺`;
        } else {
            elAciklama.innerText = `Birebir TL işlemi`;
        }
    }
}

function swapCeviriciBirimler() {
    const selKaynak = document.getElementById("ceviriciKaynakBirim");
    const selHedef = document.getElementById("ceviriciHedefBirim");
    if (!selKaynak || !selHedef) return;

    const temp = selKaynak.value;
    selKaynak.value = selHedef.value;
    selHedef.value = temp;

    calculateHizliCevirici();
}

// Otomatik başlatma ve kurları arka planda tazeleme
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        renderKurTicker();
        setTimeout(() => {
            fetchLiveExchangeRates(true);
        }, 1200);

        // Her 5 dakikada bir otomatik sessiz kur güncellemesi
        setInterval(() => {
            fetchLiveExchangeRates(true);
        }, 5 * 60 * 1000);
    });
}

// Basit HTML kaçırma
function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
