// ============================================================================
// ALACAK VE CARİ TAKİP MODÜLÜ (ALACAKLAR, TAHSİLATLAR VE CANLI BAKİYE ÖZETLERİ)
// ============================================================================

const DEFAULT_ALACAK_TURLERI = ["İFT", "THH", "KRM", "BK", "Diğer", "SAH", "KAMP.", "TAK"];

const DEFAULT_ALACAKLAR = [
    { id: 1, tarih: "2026-10-01", ref: "FD", cari: "Ahmet Yılmaz", tur: "BK", tutar: 20000, aciklama: "FD - BK 1. Parça Alacak" },
    { id: 2, tarih: "2015-01-01", ref: "FD", cari: "Ahmet Yılmaz", tur: "BK", tutar: 10000, aciklama: "FD - BK 2. Parça Alacak" },
    { id: 3, tarih: "2026-05-02", ref: "FD", cari: "Ahmet Yılmaz", tur: "İFT", tutar: 15000, aciklama: "FD - İFT Borcu" },
    { id: 4, tarih: "2020-02-01", ref: "TD", cari: "Mehmet Demir", tur: "İFT", tutar: 22000, aciklama: "50 Adet B Malzemesi" },
    { id: 5, tarih: "2026-12-03", ref: "AS", cari: "Ahmet Yılmaz", tur: "BK", tutar: 3000, aciklama: "Elden Verilen Borç" },
    { id: 6, tarih: "2025-03-01", ref: "SS", cari: "Ayşe Kaya", tur: "THH", tutar: 12000, aciklama: "Yazılım Desteği" },
    { id: 7, tarih: "2026-12-11", ref: "MFA", cari: "AÇ", tur: "İFT", tutar: 20000, aciklama: "" },
    { id: 8, tarih: "2028-09-21", ref: "MFA", cari: "SA", tur: "İFT", tutar: 200000, aciklama: "" },
    { id: 9, tarih: "2030-07-03", ref: "MFA", cari: "SA", tur: "SAH", tutar: 10000, aciklama: "" },
    { id: 10, tarih: "2032-04-13", ref: "MFA", cari: "AA", tur: "SAH", tutar: 5000, aciklama: "" },
    { id: 11, tarih: "2034-01-23", ref: "ma", cari: "ibrahim", tur: "SAH", tutar: 1000000, aciklama: "" },
    { id: 12, tarih: "2035-11-04", ref: "şd", cari: "dd", tur: "Diğer", tutar: 50000, aciklama: "" },
    { id: 13, tarih: "2037-08-15", ref: "şd", cari: "ssw", tur: "KAMP.", tutar: 340000, aciklama: "" }
];

const DEFAULT_TAHSILATLAR = [
    { id: 1, tarih: "2026-01-18", ref: "FD", cari: "Ahmet Yılmaz", tur: "BK", tutar: 10000, aciklama: "Kısmi Havale" },
    { id: 2, tarih: "2026-02-10", ref: "FD", cari: "Ahmet Yılmaz", tur: "İFT", tutar: 5000, aciklama: "Nakit Ödeme" },
    { id: 3, tarih: "2026-03-01", ref: "TD", cari: "Mehmet Demir", tur: "İFT", tutar: 15000, aciklama: "Bankadan Gelen" },
    { id: 4, tarih: "2026-03-01", ref: "MFA", cari: "AÇ", tur: "İFT", tutar: 15000, aciklama: "" },
    { id: 5, tarih: "2026-03-01", ref: "mfa", cari: "aç", tur: "İFT", tutar: 2000, aciklama: "" },
    { id: 6, tarih: "2026-10-14", ref: "ma", cari: "ibrahim", tur: "SAH", tutar: 500000, aciklama: "" }
];

let dbAlacak = JSON.parse(localStorage.getItem('alacak_db')) || {
    alacaklar: DEFAULT_ALACAKLAR,
    tahsilatlar: DEFAULT_TAHSILATLAR,
    turler: DEFAULT_ALACAK_TURLERI
};

if (!dbAlacak.turler || !Array.isArray(dbAlacak.turler) || dbAlacak.turler.length === 0) {
    dbAlacak.turler = [...DEFAULT_ALACAK_TURLERI];
    saveAlacakDb();
}

function saveAlacakDb() {
    localStorage.setItem('alacak_db', JSON.stringify(dbAlacak));
    if (typeof updateGlobalBadges === 'function') updateGlobalBadges();
}

// 1. ALACAK KAYITLARI TABLOSU
function renderAlacakKayitlariTab() {
    const tbody = document.getElementById("alacakTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchAlacakInput")?.value || "").toLowerCase().trim();
    const filterTur = document.getElementById("filterAlacakTurSelect")?.value || "ALL";

    let totalTutar = 0;

    const filtered = dbAlacak.alacaklar.filter(a => {
        const matchesSearch = !searchTerm ||
            (a.ref && a.ref.toLowerCase().includes(searchTerm)) ||
            (a.cari && a.cari.toLowerCase().includes(searchTerm)) ||
            (a.aciklama && a.aciklama.toLowerCase().includes(searchTerm));
        const matchesTur = filterTur === "ALL" || a.tur === filterTur;
        return matchesSearch && matchesTur;
    });

    filtered.forEach(a => {
        totalTutar += Number(a.tutar) || 0;
    });

    if (document.getElementById("kpiAlacakToplamTutar")) {
        document.getElementById("kpiAlacakToplamTutar").innerText = formatCurrency(totalTutar);
    }
    if (document.getElementById("kpiAlacakKayitSayisi")) {
        document.getElementById("kpiAlacakKayitSayisi").innerText = filtered.length + " Kayıt";
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color: var(--text-muted);">Kriterlere uygun alacak kaydı bulunamadı.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((a, idx) => {
        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 11px;">${a.tarih || '-'}</td>
                <td><strong style="color: var(--accent-gold); font-family: monospace; font-size: 13px;">${a.ref || '-'}</strong></td>
                <td><strong>${a.cari || '-'}</strong></td>
                <td><span class="badge-pill badge-info">${a.tur || 'Diğer'}</span></td>
                <td style="font-weight: 800; color: var(--text-main); font-size: 13px;">${formatCurrency(a.tutar)}</td>
                <td style="color: var(--text-muted); font-size: 11px;">${a.aciklama || '-'}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="openEditAlacakModal(${a.id})" title="Düzenle">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="deleteAlacakPrompt(${a.id})" title="Sil">
                            <i class="fa-solid fa-trash-can" style="color: #f87171;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 2. TAHSİLAT KAYITLARI TABLOSU
function renderTahsilatKayitlariTab() {
    const tbody = document.getElementById("alacakTahsilatTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchTahsilatInput")?.value || "").toLowerCase().trim();
    const filterTur = document.getElementById("filterTahsilatTurSelect")?.value || "ALL";

    let totalTutar = 0;

    const filtered = dbAlacak.tahsilatlar.filter(t => {
        const matchesSearch = !searchTerm ||
            (t.ref && t.ref.toLowerCase().includes(searchTerm)) ||
            (t.cari && t.cari.toLowerCase().includes(searchTerm)) ||
            (t.aciklama && t.aciklama.toLowerCase().includes(searchTerm));
        const matchesTur = filterTur === "ALL" || t.tur === filterTur;
        return matchesSearch && matchesTur;
    });

    filtered.forEach(t => {
        totalTutar += Number(t.tutar) || 0;
    });

    if (document.getElementById("kpiTahsilatToplamTutar")) {
        document.getElementById("kpiTahsilatToplamTutar").innerText = formatCurrency(totalTutar);
    }
    if (document.getElementById("kpiTahsilatKayitSayisi")) {
        document.getElementById("kpiTahsilatKayitSayisi").innerText = filtered.length + " Tahsilat";
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color: var(--text-muted);">Kayıt bulunamadı.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((t, idx) => {
        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 11px;">${t.tarih || '-'}</td>
                <td><strong style="color: var(--accent-gold); font-family: monospace; font-size: 13px;">${t.ref || '-'}</strong></td>
                <td><strong>${t.cari || '-'}</strong></td>
                <td><span class="badge-pill badge-info">${t.tur || 'Diğer'}</span></td>
                <td style="font-weight: 800; color: #34d399; font-size: 13px;">+${formatCurrency(t.tutar)}</td>
                <td style="color: var(--text-muted); font-size: 11px;">${t.aciklama || '-'}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="openEditTahsilatModal(${t.id})" title="Düzenle">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="deleteTahsilatPrompt(${t.id})" title="Sil">
                            <i class="fa-solid fa-trash-can" style="color: #f87171;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 3. REFERANS VE ALACAK TÜRÜ BAZINDA NET BAKİYE ÖZETİ
function renderNetBakiyeOzetiTab() {
    const tbody = document.getElementById("netBakiyeTableBody");
    const tfoot = document.getElementById("netBakiyeTableFoot");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchNetBakiyeInput")?.value || "").toLowerCase().trim();

    // Group by (ref.toUpperCase(), tur)
    const map = new Map();

    dbAlacak.alacaklar.forEach(a => {
        const refKey = (a.ref || "").trim().toUpperCase();
        const turKey = (a.tur || "Diğer").trim();
        const key = `${refKey}:::${turKey}`;

        if (!map.has(key)) {
            map.set(key, { ref: a.ref.trim(), tur: turKey, toplamAlacak: 0, toplamTahsilat: 0 });
        }
        map.get(key).toplamAlacak += Number(a.tutar) || 0;
    });

    dbAlacak.tahsilatlar.forEach(t => {
        const refKey = (t.ref || "").trim().toUpperCase();
        const turKey = (t.tur || "Diğer").trim();
        const key = `${refKey}:::${turKey}`;

        if (!map.has(key)) {
            map.set(key, { ref: t.ref.trim(), tur: turKey, toplamAlacak: 0, toplamTahsilat: 0 });
        }
        map.get(key).toplamTahsilat += Number(t.tutar) || 0;
    });

    let items = Array.from(map.values());

    if (searchTerm) {
        items = items.filter(item =>
            item.ref.toLowerCase().includes(searchTerm) ||
            item.tur.toLowerCase().includes(searchTerm)
        );
    }

    let grandAlacak = 0;
    let grandTahsilat = 0;
    let grandKalan = 0;

    tbody.innerHTML = items.map(item => {
        const kalan = item.toplamAlacak - item.toplamTahsilat;
        grandAlacak += item.toplamAlacak;
        grandTahsilat += item.toplamTahsilat;
        grandKalan += kalan;

        const isClosed = kalan <= 0;
        const statusBadge = isClosed 
            ? `<span class="badge-pill badge-success"><i class="fa-solid fa-check"></i> Kapandı</span>`
            : `<span class="badge-pill badge-danger"><i class="fa-solid fa-circle-exclamation"></i> Açık Bakiye</span>`;

        return `
            <tr>
                <td><strong style="color: var(--accent-gold); font-family: monospace; font-size: 13px;">${item.ref}</strong></td>
                <td><span class="badge-pill badge-info">${item.tur}</span></td>
                <td style="font-weight: 700;">${formatCurrency(item.toplamAlacak)}</td>
                <td style="font-weight: 700; color: #34d399;">${formatCurrency(item.toplamTahsilat)}</td>
                <td style="font-weight: 800; color: ${kalan > 0 ? '#f87171' : '#34d399'}; font-size: 13px;">${formatCurrency(kalan)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join("");

    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td>GENEL TOPLAM</td>
                <td>-</td>
                <td>${formatCurrency(grandAlacak)}</td>
                <td style="color: #34d399;">${formatCurrency(grandTahsilat)}</td>
                <td style="color: ${grandKalan > 0 ? '#f87171' : '#34d399'}; font-size: 14px;">${formatCurrency(grandKalan)}</td>
                <td>-</td>
            </tr>
        `;
    }

    if (document.getElementById("kpiNetOzetToplamAlacak")) document.getElementById("kpiNetOzetToplamAlacak").innerText = formatCurrency(grandAlacak);
    if (document.getElementById("kpiNetOzetToplamTahsilat")) document.getElementById("kpiNetOzetToplamTahsilat").innerText = formatCurrency(grandTahsilat);
    if (document.getElementById("kpiNetOzetKalan")) document.getElementById("kpiNetOzetKalan").innerText = formatCurrency(grandKalan);
}

// 4. DETAYLI CARİ VE REFERANS BAKİYE ÖZETİ
function renderCariBakiyeOzetiTab() {
    const tbody = document.getElementById("cariBakiyeTableBody");
    const tfoot = document.getElementById("cariBakiyeTableFoot");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchCariBakiyeInput")?.value || "").toLowerCase().trim();

    // Group by (ref.toUpperCase(), cari.toLowerCase(), tur)
    const map = new Map();

    dbAlacak.alacaklar.forEach(a => {
        const refKey = (a.ref || "").trim().toUpperCase();
        const cariKey = (a.cari || "").trim().toLowerCase();
        const turKey = (a.tur || "Diğer").trim();
        const key = `${refKey}:::${cariKey}:::${turKey}`;

        if (!map.has(key)) {
            map.set(key, { ref: a.ref.trim(), cari: a.cari.trim(), tur: turKey, toplamAlacak: 0, toplamTahsilat: 0 });
        }
        map.get(key).toplamAlacak += Number(a.tutar) || 0;
    });

    dbAlacak.tahsilatlar.forEach(t => {
        const refKey = (t.ref || "").trim().toUpperCase();
        const cariKey = (t.cari || "").trim().toLowerCase();
        const turKey = (t.tur || "Diğer").trim();
        const key = `${refKey}:::${cariKey}:::${turKey}`;

        if (!map.has(key)) {
            map.set(key, { ref: t.ref.trim(), cari: t.cari.trim(), tur: turKey, toplamAlacak: 0, toplamTahsilat: 0 });
        }
        map.get(key).toplamTahsilat += Number(t.tutar) || 0;
    });

    let items = Array.from(map.values());

    if (searchTerm) {
        items = items.filter(item =>
            item.ref.toLowerCase().includes(searchTerm) ||
            item.cari.toLowerCase().includes(searchTerm) ||
            item.tur.toLowerCase().includes(searchTerm)
        );
    }

    let grandAlacak = 0;
    let grandTahsilat = 0;
    let grandKalan = 0;

    tbody.innerHTML = items.map(item => {
        const kalan = item.toplamAlacak - item.toplamTahsilat;
        grandAlacak += item.toplamAlacak;
        grandTahsilat += item.toplamTahsilat;
        grandKalan += kalan;

        const isClosed = kalan <= 0;
        const statusBadge = isClosed 
            ? `<span class="badge-pill badge-success"><i class="fa-solid fa-check"></i> Kapandı</span>`
            : `<span class="badge-pill badge-danger"><i class="fa-solid fa-circle-exclamation"></i> Açık Bakiye</span>`;

        return `
            <tr>
                <td><strong style="color: var(--accent-gold); font-family: monospace; font-size: 13px;">${item.ref}</strong></td>
                <td><strong>${item.cari}</strong></td>
                <td><span class="badge-pill badge-info">${item.tur}</span></td>
                <td style="font-weight: 700;">${formatCurrency(item.toplamAlacak)}</td>
                <td style="font-weight: 700; color: #34d399;">${formatCurrency(item.toplamTahsilat)}</td>
                <td style="font-weight: 800; color: ${kalan > 0 ? '#f87171' : '#34d399'}; font-size: 13px;">${formatCurrency(kalan)}</td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                    <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 4px 8px;" onclick="printCariEkstre('${item.cari.replace(/'/g, "\\'")}')" title="Cari Hesap Ekstresi Yazdır">
                        <i class="fa-solid fa-print"></i> Ekstre
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td>GENEL TOPLAM</td>
                <td>-</td>
                <td>-</td>
                <td>${formatCurrency(grandAlacak)}</td>
                <td style="color: #34d399;">${formatCurrency(grandTahsilat)}</td>
                <td style="color: ${grandKalan > 0 ? '#f87171' : '#34d399'}; font-size: 14px;">${formatCurrency(grandKalan)}</td>
                <td>-</td>
                <td>-</td>
            </tr>
        `;
    }

    if (document.getElementById("kpiCariOzetToplamAlacak")) document.getElementById("kpiCariOzetToplamAlacak").innerText = formatCurrency(grandAlacak);
    if (document.getElementById("kpiCariOzetToplamTahsilat")) document.getElementById("kpiCariOzetToplamTahsilat").innerText = formatCurrency(grandTahsilat);
    if (document.getElementById("kpiCariOzetKalan")) document.getElementById("kpiCariOzetKalan").innerText = formatCurrency(grandKalan);
}

// RESMİ CARİ HESAP EKSTRESİ VE MUTABAKAT MEKTUBU (A4)
function printCariEkstre(cariName) {
    if (!cariName) return;
    const info = typeof getKurumInfo === 'function' ? getKurumInfo() : { name: "Yönetim Sistemi", subTitle: "Mali İşler", bursar: "Yetkili" };

    const cariAlacaklar = (dbAlacak.alacaklar || []).filter(a => (a.cari || "").trim().toLowerCase() === cariName.trim().toLowerCase());
    const cariTahsilatlar = (dbAlacak.tahsilatlar || []).filter(t => (t.cari || "").trim().toLowerCase() === cariName.trim().toLowerCase());

    const ledger = [];
    cariAlacaklar.forEach(a => {
        ledger.push({
            date: a.tarih || "",
            vade: a.vade || "-",
            ref: a.ref || "-",
            tur: a.tur || "Alacak",
            desc: a.aciklama || "Alacak Tahakkuku",
            borc: Number(a.tutar) || 0,
            alacak: 0
        });
    });
    cariTahsilatlar.forEach(t => {
        ledger.push({
            date: t.tarih || "",
            vade: "-",
            ref: t.ref || "-",
            tur: t.tur || "Tahsilat",
            desc: t.aciklama || (t.odemeSekli ? `Tahsilat (${t.odemeSekli})` : "Tahsilat"),
            borc: 0,
            alacak: Number(t.tutar) || 0
        });
    });

    ledger.sort((a, b) => (a.date > b.date ? 1 : -1));

    let runningBalance = 0;
    let totalBorc = 0;
    let totalAlacak = 0;

    const rowsHtml = ledger.map((item, idx) => {
        totalBorc += item.borc;
        totalAlacak += item.alacak;
        runningBalance = runningBalance + item.borc - item.alacak;
        return `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 7px 8px; text-align: center;">${idx + 1}</td>
                <td style="padding: 7px 8px;">${item.date}</td>
                <td style="padding: 7px 8px; font-weight: 700;">${item.ref}</td>
                <td style="padding: 7px 8px;">${item.tur}</td>
                <td style="padding: 7px 8px;">${item.desc}</td>
                <td style="padding: 7px 8px; text-align: right; font-weight: 600;">${item.borc > 0 ? formatCurrency(item.borc) : '-'}</td>
                <td style="padding: 7px 8px; text-align: right; font-weight: 600; color: #059669;">${item.alacak > 0 ? formatCurrency(item.alacak) : '-'}</td>
                <td style="padding: 7px 8px; text-align: right; font-weight: 800; color: ${runningBalance > 0 ? '#dc2626' : '#059669'};">${formatCurrency(runningBalance)}</td>
            </tr>
        `;
    }).join("");

    const printHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 820px; margin: 0 auto; color: #0f172a; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    ${info.logo ? `<img src="${info.logo}" alt="Logo" style="max-height: 52px; max-width: 140px; object-fit: contain;">` : ''}
                    <div>
                        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${info.name}</h1>
                        <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">${info.subTitle}</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 15px; font-weight: 800; color: #b45309;">CARİ HESAP EKSTRESİ</div>
                    <div style="font-size: 11px; color: #475569;">Döküm Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 12px;">
                <div>
                    <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">CARİ / MÜŞTERİ ÜNVANI</div>
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${cariName}</div>
                </div>
                <div style="display: flex; gap: 24px; text-align: right;">
                    <div>
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">TOPLAM ALACAK</div>
                        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${formatCurrency(totalBorc)}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">TOPLAM TAHSİLAT</div>
                        <div style="font-size: 13px; font-weight: 700; color: #059669;">${formatCurrency(totalAlacak)}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">NET KALAN BAKİYE</div>
                        <div style="font-size: 15px; font-weight: 800; color: ${runningBalance > 0 ? '#dc2626' : '#059669'};">${formatCurrency(runningBalance)}</div>
                    </div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                    <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                        <th style="padding: 8px; text-align: center; width: 30px;">#</th>
                        <th style="padding: 8px; text-align: left; width: 75px;">Tarih</th>
                        <th style="padding: 8px; text-align: left; width: 85px;">Ref No</th>
                        <th style="padding: 8px; text-align: left; width: 60px;">Tür</th>
                        <th style="padding: 8px; text-align: left;">Açıklama</th>
                        <th style="padding: 8px; text-align: right; width: 90px;">Borç</th>
                        <th style="padding: 8px; text-align: right; width: 90px;">Tahsilat</th>
                        <th style="padding: 8px; text-align: right; width: 95px;">Bakiye</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="8" style="padding: 20px; text-align: center; color: #64748b;">Bu cariye ait hareket kaydı bulunamadı.</td></tr>'}
                </tbody>
                <tfoot>
                    <tr style="background: #f8fafc; border-top: 2px solid #0f172a; font-weight: 800; font-size: 12px;">
                        <td colspan="5" style="padding: 10px 8px; text-align: right;">TOPLAMLAR:</td>
                        <td style="padding: 10px 8px; text-align: right;">${formatCurrency(totalBorc)}</td>
                        <td style="padding: 10px 8px; text-align: right; color: #059669;">${formatCurrency(totalAlacak)}</td>
                        <td style="padding: 10px 8px; text-align: right; color: ${runningBalance > 0 ? '#dc2626' : '#059669'}; font-size: 13px;">${formatCurrency(runningBalance)}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #475569; margin-bottom: 40px;">
                <strong>Mutabakat Notu:</strong> Yukarıdaki döküm sistem kayıtlarımızla birebir mutabıktır. Ekstredeki bakiye hakkında 7 iş günü içinde yazılı itiraz edilmediği takdirde hesap mutabık sayılacaktır.
            </div>

            <div style="display: flex; justify-content: space-between; padding: 0 30px;">
                <div style="text-align: center; width: 220px;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${info.name}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${info.bursar} (Yetkili Kaşe / İmza)</div>
                    <div style="margin-top: 50px; border-top: 1px dotted #94a3b8;"></div>
                </div>
                <div style="text-align: center; width: 220px;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${cariName}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Yetkili İsim / Kaşe / İmza</div>
                    <div style="margin-top: 50px; border-top: 1px dotted #94a3b8;"></div>
                </div>
            </div>
        </div>
    `;

    const printContainer = document.getElementById("printableReceipt");
    if (printContainer) {
        printContainer.innerHTML = printHtml;
        window.print();
    }
}

// 5. ALACAK EKLEME / DÜZENLEME / SİLME
function openNewAlacakModal() {
    document.getElementById("formAlacakEditId").value = "";
    document.getElementById("formAlacakModalTitle").innerText = "Yeni Alacak Kaydı Ekle";
    document.getElementById("alacakForm").reset();
    document.getElementById("formAlacakTarih").value = new Date().toISOString().slice(0, 10);
    populateAlacakTurSelect("formAlacakTur");
    setCurrencyValue("formAlacakTutar", 0);
    openModal("modalAlacakForm");
}

function openEditAlacakModal(id) {
    const a = dbAlacak.alacaklar.find(item => item.id === id);
    if (!a) return;

    document.getElementById("formAlacakEditId").value = a.id;
    document.getElementById("formAlacakModalTitle").innerText = "Alacak Düzenle: " + a.ref;
    document.getElementById("formAlacakTarih").value = a.tarih || "";
    document.getElementById("formAlacakRef").value = a.ref || "";
    document.getElementById("formAlacakCari").value = a.cari || "";
    populateAlacakTurSelect("formAlacakTur", a.tur);
    setCurrencyValue("formAlacakTutar", a.tutar || 0);
    document.getElementById("formAlacakAciklama").value = a.aciklama || "";

    openModal("modalAlacakForm");
}

function submitAlacakForm(e) {
    if (e) e.preventDefault();

    const editId = document.getElementById("formAlacakEditId").value;
    const tarih = document.getElementById("formAlacakTarih").value;
    const ref = document.getElementById("formAlacakRef").value.trim().toUpperCase();
    const cari = document.getElementById("formAlacakCari").value.trim();
    const tur = document.getElementById("formAlacakTur").value.trim();
    const tutar = getCurrencyValue("formAlacakTutar");
    const aciklama = document.getElementById("formAlacakAciklama").value.trim();

    if (!ref || !cari || tutar <= 0) {
        showToast("Lütfen Referans No, Cari Adı ve geçerli tutar giriniz", "error");
        return;
    }

    if (editId) {
        const a = dbAlacak.alacaklar.find(item => item.id === Number(editId));
        if (a) {
            a.tarih = tarih;
            a.ref = ref;
            a.cari = cari;
            a.tur = tur;
            a.tutar = tutar;
            a.aciklama = aciklama;
            showToast("Alacak kaydı güncellendi");
        }
    } else {
        const newId = Date.now();
        dbAlacak.alacaklar.push({
            id: newId,
            tarih,
            ref,
            cari,
            tur,
            tutar,
            aciklama
        });
        showToast("Yeni alacak kaydı eklendi");
    }

    saveAlacakDb();
    closeModal("modalAlacakForm");
    renderAlacakKayitlariTab();
    renderNetBakiyeOzetiTab();
    renderCariBakiyeOzetiTab();
}

function deleteAlacakPrompt(id) {
    if (confirm("Bu alacak kaydını silmek istediğinize emin misiniz?")) {
        dbAlacak.alacaklar = dbAlacak.alacaklar.filter(item => item.id !== id);
        saveAlacakDb();
        renderAlacakKayitlariTab();
        renderNetBakiyeOzetiTab();
        renderCariBakiyeOzetiTab();
        showToast("Alacak kaydı silindi");
    }
}

// 6. TAHSİLAT EKLEME / DÜZENLEME / SİLME
function openNewTahsilatModal() {
    document.getElementById("formTahsilatEditId").value = "";
    document.getElementById("formTahsilatModalTitle").innerText = "Yeni Tahsilat Girişi";
    document.getElementById("tahsilatForm").reset();
    document.getElementById("formTahsilatTarih").value = new Date().toISOString().slice(0, 10);
    populateAlacakTurSelect("formTahsilatTur");
    setCurrencyValue("formTahsilatTutar", 0);
    openModal("modalTahsilatForm");
}

function openEditTahsilatModal(id) {
    const t = dbAlacak.tahsilatlar.find(item => item.id === id);
    if (!t) return;

    document.getElementById("formTahsilatEditId").value = t.id;
    document.getElementById("formTahsilatModalTitle").innerText = "Tahsilat Düzenle: " + t.ref;
    document.getElementById("formTahsilatTarih").value = t.tarih || "";
    document.getElementById("formTahsilatRef").value = t.ref || "";
    document.getElementById("formTahsilatCari").value = t.cari || "";
    populateAlacakTurSelect("formTahsilatTur", t.tur);
    setCurrencyValue("formTahsilatTutar", t.tutar || 0);
    document.getElementById("formTahsilatAciklama").value = t.aciklama || "";

    openModal("modalTahsilatForm");
}

function submitTahsilatForm(e) {
    if (e) e.preventDefault();

    const editId = document.getElementById("formTahsilatEditId").value;
    const tarih = document.getElementById("formTahsilatTarih").value;
    const ref = document.getElementById("formTahsilatRef").value.trim().toUpperCase();
    const cari = document.getElementById("formTahsilatCari").value.trim();
    const tur = document.getElementById("formTahsilatTur").value.trim();
    const tutar = getCurrencyValue("formTahsilatTutar");
    const aciklama = document.getElementById("formTahsilatAciklama").value.trim();

    if (!ref || !cari || tutar <= 0) {
        showToast("Lütfen Referans No, Cari Adı ve geçerli tutar giriniz", "error");
        return;
    }

    if (editId) {
        const t = dbAlacak.tahsilatlar.find(item => item.id === Number(editId));
        if (t) {
            t.tarih = tarih;
            t.ref = ref;
            t.cari = cari;
            t.tur = tur;
            t.tutar = tutar;
            t.aciklama = aciklama;
            showToast("Tahsilat kaydı güncellendi");
        }
    } else {
        const newId = Date.now();
        dbAlacak.tahsilatlar.push({
            id: newId,
            tarih,
            ref,
            cari,
            tur,
            tutar,
            aciklama
        });
        showToast("Yeni tahsilat girişi kaydedildi");
    }

    saveAlacakDb();
    closeModal("modalTahsilatForm");
    renderTahsilatKayitlariTab();
    renderNetBakiyeOzetiTab();
    renderCariBakiyeOzetiTab();
}

function deleteTahsilatPrompt(id) {
    if (confirm("Bu tahsilat kaydını silmek istediğinize emin misiniz?")) {
        dbAlacak.tahsilatlar = dbAlacak.tahsilatlar.filter(item => item.id !== id);
        saveAlacakDb();
        renderTahsilatKayitlariTab();
        renderNetBakiyeOzetiTab();
        renderCariBakiyeOzetiTab();
        showToast("Tahsilat kaydı silindi");
    }
}

function populateAlacakTurSelect(selectId, selectedValue = "") {
    const sel = document.getElementById(selectId);
    if (!sel) return;

    const turler = dbAlacak.turler || DEFAULT_ALACAK_TURLERI;
    sel.innerHTML = turler.map(t => `<option value="${t}" ${t === selectedValue ? 'selected' : ''}>${t}</option>`).join("");
}

// 7. ALACAK TÜRLERİ YÖNETİMİ (EKLE, DÜZENLE, ÇIKART)
function populateFilterTurSelects() {
    const turler = dbAlacak.turler || DEFAULT_ALACAK_TURLERI;
    const filterIds = ["filterAlacakTurSelect", "filterTahsilatTurSelect"];
    
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const currentVal = el.value || "ALL";
            let optionsHtml = `<option value="ALL">Tüm Alacak Türleri</option>`;
            optionsHtml += turler.map(t => `<option value="${t}" ${t === currentVal ? 'selected' : ''}>${t}</option>`).join("");
            el.innerHTML = optionsHtml;
        }
    });
}

function openAlacakTurleriModal() {
    renderAlacakTurleriList();
    openModal("modalAlacakTurleri");
}

function renderAlacakTurleriList() {
    const tbody = document.getElementById("alacakTurleriTableBody");
    if (!tbody) return;

    const turler = dbAlacak.turler || DEFAULT_ALACAK_TURLERI;

    if (turler.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">Tanımlı alacak türü bulunamadı.</td></tr>`;
        return;
    }

    tbody.innerHTML = turler.map((tur, idx) => {
        const alacakSayisi = dbAlacak.alacaklar.filter(a => a.tur === tur).length;
        const tahsilatSayisi = dbAlacak.tahsilatlar.filter(t => t.tur === tur).length;
        const toplamKayit = alacakSayisi + tahsilatSayisi;

        return `
            <tr>
                <td style="color:var(--text-muted); font-size:11px;">#${idx + 1}</td>
                <td>
                    <span class="badge-pill badge-info" style="font-size:12px; font-weight:700; padding:4px 10px;">${tur}</span>
                </td>
                <td style="font-size:11px; color:var(--text-muted);">
                    ${alacakSayisi} Alacak • ${tahsilatSayisi} Tahsilat
                </td>
                <td style="text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:5px;">
                        <button type="button" class="btn btn-subtle" style="padding:4px 8px; font-size:11px;" onclick="editAlacakTuru(${idx})" title="Türü Yeniden Adlandır">
                            <i class="fa-solid fa-pen-to-square"></i> Düzenle
                        </button>
                        <button type="button" class="btn btn-subtle" style="padding:4px 8px; font-size:11px;" onclick="deleteAlacakTuru(${idx})" title="Türü Sil">
                            <i class="fa-solid fa-trash-can" style="color:#f87171;"></i> Sil
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function addAlacakTuru(e) {
    if (e) e.preventDefault();

    const input = document.getElementById("inputNewAlacakTuru");
    const newName = (input?.value || "").trim();

    if (!newName) {
        showToast("Lütfen bir alacak türü adı yazınız", "error");
        return;
    }

    if (!dbAlacak.turler) dbAlacak.turler = [...DEFAULT_ALACAK_TURLERI];

    if (dbAlacak.turler.some(t => t.toLowerCase() === newName.toLowerCase())) {
        showToast("Bu tür zaten mevcut!", "error");
        return;
    }

    dbAlacak.turler.push(newName);
    saveAlacakDb();

    if (input) input.value = "";
    renderAlacakTurleriList();
    populateFilterTurSelects();
    populateAlacakTurSelect("formAlacakTur");
    populateAlacakTurSelect("formTahsilatTur");

    showToast(`"${newName}" türü başarıyla eklendi`);
}

function editAlacakTuru(index) {
    if (!dbAlacak.turler || !dbAlacak.turler[index]) return;
    const oldName = dbAlacak.turler[index];

    const newName = prompt(`"${oldName}" türü için yeni bir isim giriniz:`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;

    const trimmed = newName.trim();

    // Mevcut kayıtlarda eski tür adını güncelle
    let affectedCount = 0;
    dbAlacak.alacaklar.forEach(a => {
        if (a.tur === oldName) {
            a.tur = trimmed;
            affectedCount++;
        }
    });
    dbAlacak.tahsilatlar.forEach(t => {
        if (t.tur === oldName) {
            t.tur = trimmed;
            affectedCount++;
        }
    });

    dbAlacak.turler[index] = trimmed;
    saveAlacakDb();

    renderAlacakTurleriList();
    populateFilterTurSelects();
    populateAlacakTurSelect("formAlacakTur");
    populateAlacakTurSelect("formTahsilatTur");
    renderAlacakKayitlariTab();
    renderTahsilatKayitlariTab();
    renderNetBakiyeOzetiTab();
    renderCariBakiyeOzetiTab();

    showToast(`"${oldName}" -> "${trimmed}" olarak güncellendi (${affectedCount} kayıt etkilendi)`);
}

function deleteAlacakTuru(index) {
    if (!dbAlacak.turler || !dbAlacak.turler[index]) return;
    const turName = dbAlacak.turler[index];

    const alacakCount = dbAlacak.alacaklar.filter(a => a.tur === turName).length;
    const tahsilatCount = dbAlacak.tahsilatlar.filter(t => t.tur === turName).length;
    const totalCount = alacakCount + tahsilatCount;

    let confirmMsg = `"${turName}" türünü silmek istediğinize emin misiniz?`;
    if (totalCount > 0) {
        confirmMsg = `"${turName}" türüne ait ${totalCount} adet kayıt bulunuyor. Bu türü silerseniz ilgili kayıtlar "Diğer" türüne aktarılacaktır. Onaylıyor musunuz?`;
    }

    if (confirm(confirmMsg)) {
        if (totalCount > 0) {
            dbAlacak.alacaklar.forEach(a => { if (a.tur === turName) a.tur = "Diğer"; });
            dbAlacak.tahsilatlar.forEach(t => { if (t.tur === turName) t.tur = "Diğer"; });
        }

        dbAlacak.turler.splice(index, 1);
        if (!dbAlacak.turler.includes("Diğer")) {
            dbAlacak.turler.push("Diğer");
        }

        saveAlacakDb();

        renderAlacakTurleriList();
        populateFilterTurSelects();
        populateAlacakTurSelect("formAlacakTur");
        populateAlacakTurSelect("formTahsilatTur");
        renderAlacakKayitlariTab();
        renderTahsilatKayitlariTab();
        renderNetBakiyeOzetiTab();
        renderCariBakiyeOzetiTab();

        showToast(`"${turName}" türü silindi`);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    populateFilterTurSelects();
});
