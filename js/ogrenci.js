// ============================================================================
// ÖĞRENCİ YÖNETİMİ MODÜLÜ (NET, HAM VE HAP BİLGİLER - SINIFSIZ & SADE)
// ============================================================================

const AKADEMIK_AYLAR = ["Eylül", "Ekim", "Kasım", "Aralık", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos"];

function getLocalTodayYMD() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

let dbOgrenci = JSON.parse(localStorage.getItem('okul_v25_db')) || {
    ogrenciler: [
        { id: 1, ad: "Örnek Öğrenci", telefon: "0555 123 45 67", donem: "Eylül", brut: 120000, indirim: 10000, taksit: 10, kirtasiye: 5000, kirtasiyeTeslim: true, sebep: "", okul: "okul1" }
    ],
    odemeler: [
        { id: 1, tarih: "15.09.2026", ogrenciId: 1, donem: "Eylül", tutar: 11000, tur: "Nakit", makbuzNo: "MK-1001", not: "Eylül ayı taksiti" }
    ]
};

// ============================================================================
// OKUL 1 / OKUL 2 YÖNETİMİ VE SEÇİM MOTORU
// ============================================================================
let currentOkul = localStorage.getItem('portal_selected_okul') || 'okul1'; // 'okul1' | 'okul2'

// Mevcut öğrencilerin okul alanını güvenceye al
if (dbOgrenci && Array.isArray(dbOgrenci.ogrenciler)) {
    dbOgrenci.ogrenciler.forEach(o => {
        if (!o.okul) o.okul = 'okul1';
    });
    // Okul 2 için en az bir örnek öğrenci yoksa başlangıç olarak 1 kayıt ekleyelim
    const hasOkul2 = dbOgrenci.ogrenciler.some(o => o.okul === 'okul2');
    if (!hasOkul2) {
        const o2Id = 201;
        dbOgrenci.ogrenciler.push({
            id: o2Id,
            ad: "Örnek Öğrenci (Okul 2)",
            telefon: "0532 999 88 77",
            donem: "Eylül",
            brut: 130000,
            indirim: 10000,
            taksit: 10,
            kirtasiye: 5000,
            kirtasiyeTeslim: false,
            sebep: "Okul 2 Kaydı",
            okul: "okul2"
        });
        dbOgrenci.odemeler.push({
            id: o2Id,
            tarih: "20.09.2026",
            ogrenciId: o2Id,
            donem: "Eylül",
            tutar: 12000,
            tur: "Banka Havale",
            makbuzNo: "MK-2001",
            not: "Okul 2 - Eylül Taksiti"
        });
        localStorage.setItem('okul_v25_db', JSON.stringify(dbOgrenci));
    }
}

function getOkulOgrenciler() {
    return (dbOgrenci.ogrenciler || []).filter(o => (o.okul || 'okul1') === currentOkul);
}

function getOkulOdemeler() {
    return (dbOgrenci.odemeler || []).filter(o => {
        const ogr = dbOgrenci.ogrenciler.find(s => s.id === o.ogrenciId);
        return ogr && (ogr.okul || 'okul1') === currentOkul;
    });
}

function getOkulDisplayName(okulCode) {
    const kInfo = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
    return okulCode === 'okul2' ? (kInfo.okul2Adi || 'Okul 2') : (kInfo.okul1Adi || 'Okul 1');
}

function setActiveOkul(okul) {
    if (okul !== 'okul1' && okul !== 'okul2') okul = 'okul1';
    currentOkul = okul;
    localStorage.setItem('portal_selected_okul', okul);

    // Butonların aktiflik durumunu güncelle
    document.querySelectorAll('.btn-okul-toggle, .sidebar-okul-btn').forEach(btn => {
        if (btn.classList.contains(okul + '-btn')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updateOkulStatsDisplay();

    // Aktif sekme öğrenci sekmesiyse yeniden render et
    if (typeof currentActiveTab !== 'undefined') {
        if (currentActiveTab === 'ogrenci-genel') renderOgrenciGenelTab();
        else if (currentActiveTab === 'ogrenci-matris') renderOgrenciMatrisTab();
        else if (currentActiveTab === 'ogrenci-aylik') renderOgrenciAylikTab();
        else if (currentActiveTab === 'ogrenci-vezne') renderOgrenciOdemelerTab();
        else if (currentActiveTab === 'ogrenci-kirtasiye') renderOgrenciKirtasiyeTab();
        else if (currentActiveTab === 'ogrenci-gunluk-rapor') renderGunlukTahsilatRaporu();
        else renderOgrenciGenelTab();
    } else {
        renderOgrenciGenelTab();
    }

    if (typeof updateGlobalBadges === 'function') updateGlobalBadges();
    showToast(`Aktif Okul: ${getOkulDisplayName(okul)}`);
}

function updateOkulStatsDisplay() {
    const list = getOkulOgrenciler();
    const count = list.length;
    const label = getOkulDisplayName(currentOkul);
    document.querySelectorAll('.okul-stats-text').forEach(el => {
        el.innerText = `${label}: ${count} Kayıtlı Öğrenci`;
    });
}

function saveOgrenciDb() {
    localStorage.setItem('okul_v25_db', JSON.stringify(dbOgrenci));
    if (typeof updateGlobalBadges === 'function') updateGlobalBadges();
}

// ----------------------------------------------------------------------------
// PLAN, TAKSİT VE AY BAZLI MUAFİYET / DÜZENLEME MOTORU
// ----------------------------------------------------------------------------
function getStudentPlanDetails(ogr) {
    const rawNet = Math.max(0, (Number(ogr.brut) || 0) - (Number(ogr.indirim) || 0));
    const taksitSayisi = (ogr.taksit && ogr.taksit > 0) ? ogr.taksit : 1;
    const baseMonthly = Math.round(rawNet / taksitSayisi);
    const kirtasiye = Number(ogr.kirtasiye) || 0;

    const muafAylar = Array.isArray(ogr.muafAylar) ? ogr.muafAylar : [];
    const ozelTaksitler = (ogr.ozelTaksitler && typeof ogr.ozelTaksitler === 'object') ? ogr.ozelTaksitler : {};

    let baslangicIdx = AKADEMIK_AYLAR.indexOf(ogr.donem);
    if (baslangicIdx === -1) baslangicIdx = 0;

    let activeMonths = [];
    let exemptMonths = [];
    let totalScheduledInstallments = 0;
    let monthSchedule = {}; // ay -> { isScheduled, isExempt, target }

    AKADEMIK_AYLAR.forEach((ay, idx) => {
        const taksitSirasi = idx - baslangicIdx;
        const isScheduled = (taksitSirasi >= 0 && taksitSirasi < taksitSayisi);
        const isExempt = muafAylar.includes(ay);

        let target = 0;
        if (isScheduled) {
            if (isExempt) {
                target = 0;
                exemptMonths.push(ay);
            } else if (ozelTaksitler[ay] !== undefined) {
                target = Number(ozelTaksitler[ay]) || 0;
                activeMonths.push(ay);
            } else {
                target = baseMonthly;
                activeMonths.push(ay);
            }
            totalScheduledInstallments += target;
        }
        monthSchedule[ay] = { isScheduled, isExempt, target };
    });

    const netSozlesme = totalScheduledInstallments;
    const toplamUcret = netSozlesme + kirtasiye;

    const payments = (dbOgrenci.odemeler || []).filter(o => o.ogrenciId === ogr.id);
    const paid = payments.reduce((sum, o) => sum + (Number(o.tutar) || 0), 0);
    const kalan = Math.max(0, toplamUcret - paid);

    return {
        rawNet,
        baseMonthly,
        taksitSayisi,
        kirtasiye,
        muafAylar,
        ozelTaksitler,
        activeMonths,
        exemptMonths,
        monthSchedule,
        netSozlesme,
        toplamUcret,
        paid,
        kalan
    };
}

let currentMatrisOgrId = null;
let currentMatrisAy = null;

function openMatrisAyAyarModal(ogrId, ay) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;
    currentMatrisOgrId = ogrId;
    currentMatrisAy = ay;

    const plan = getStudentPlanDetails(ogr);
    const sched = plan.monthSchedule[ay] || {};
    const ayOdemesi = (dbOgrenci.odemeler || [])
        .filter(o => o.ogrenciId === ogr.id && o.donem === ay)
        .reduce((s, o) => s + (Number(o.tutar) || 0), 0);

    const ogrAdEl = document.getElementById("matrisAyOgrAd");
    if (ogrAdEl) ogrAdEl.innerText = ogr.ad;
    const ayDispEl = document.getElementById("matrisAyDisplay");
    if (ayDispEl) ayDispEl.innerText = ay;
    const stdEl = document.getElementById("matrisAyStandartTutar");
    if (stdEl) stdEl.innerText = formatCurrency(plan.baseMonthly);
    const odenenEl = document.getElementById("matrisAyOdenenTutar");
    if (odenenEl) odenenEl.innerText = formatCurrency(ayOdemesi);

    const isExempt = sched.isExempt;
    const isCustom = (plan.ozelTaksitler[ay] !== undefined);

    let badgeHtml = "";
    if (isExempt) {
        badgeHtml = `<span class="badge-pill badge-danger"><i class="fa-solid fa-ban"></i> Silindi / Muaf (0 ₺)</span>`;
    } else if (ayOdemesi >= sched.target && sched.target > 0) {
        badgeHtml = `<span class="badge-pill badge-success"><i class="fa-solid fa-check"></i> Ödendi</span>`;
    } else if (isCustom) {
        badgeHtml = `<span class="badge-pill badge-gold"><i class="fa-solid fa-pen"></i> Özel Tutar (${formatCurrency(sched.target)})</span>`;
    } else {
        badgeHtml = `<span class="badge-pill badge-subtle">Aktif Taksit (${formatCurrency(sched.target)})</span>`;
    }
    const durumEl = document.getElementById("matrisAyDurumBadge");
    if (durumEl) durumEl.innerHTML = badgeHtml;

    const btnMuaf = document.getElementById("btnMatrisAyMuafText");
    const btnMuafDesc = document.getElementById("btnMatrisAyMuafDesc");
    if (isExempt) {
        if (btnMuaf) btnMuaf.innerText = "✅ Bu Ayı Tekrar Aktifleştir (Taksite Dahil Et)";
        if (btnMuafDesc) btnMuafDesc.innerText = "Bu ayı muafiyetten çıkarıp standart taksit planına geri ekler.";
    } else {
        if (btnMuaf) btnMuaf.innerText = "🗑️ Bu Ayı Taksitten Sil / Muaf Tut (0 ₺)";
        if (btnMuafDesc) btnMuafDesc.innerText = "Kurum bu ayın ücretini önceden aldıysa seçin. Aylık takipten ve genel borçtan düşülür.";
    }

    const resetBtn = document.getElementById("btnMatrisAyReset");
    if (resetBtn) resetBtn.style.display = (isExempt || isCustom) ? "flex" : "none";

    const inputBox = document.getElementById("matrisAyOzelInputBox");
    if (inputBox) inputBox.style.display = "none";

    openModal("modalMatrisAyAyar");
}

function toggleMatrisAyMuaf() {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === currentMatrisOgrId);
    if (!ogr) return;
    if (!Array.isArray(ogr.muafAylar)) ogr.muafAylar = [];

    const ay = currentMatrisAy;
    const idx = ogr.muafAylar.indexOf(ay);

    if (idx > -1) {
        ogr.muafAylar.splice(idx, 1);
        showToast(`${ogr.ad} için ${ay} ayı tekrar taksit planına eklendi.`);
    } else {
        ogr.muafAylar.push(ay);
        if (ogr.ozelTaksitler && ogr.ozelTaksitler[ay] !== undefined) delete ogr.ozelTaksitler[ay];
        showToast(`${ogr.ad} için ${ay} ayı taksitten silindi ve genel borçtan düşüldü.`);
    }

    saveOgrenciDb();
    closeModal("modalMatrisAyAyar");
    renderOgrenciGenelTab();
    renderOgrenciMatrisTab();
    renderOgrenciAylikTab();
}

function showMatrisAyOzelInput() {
    const box = document.getElementById("matrisAyOzelInputBox");
    if (box) {
        box.style.display = box.style.display === "none" ? "block" : "none";
        const input = document.getElementById("matrisAyOzelTutarInput");
        if (input && box.style.display !== "none") {
            const ogr = dbOgrenci.ogrenciler.find(o => o.id === currentMatrisOgrId);
            const plan = getStudentPlanDetails(ogr);
            setCurrencyValue("matrisAyOzelTutarInput", plan.monthSchedule[currentMatrisAy]?.target || plan.baseMonthly);
            input.focus();
        }
    }
}

function saveMatrisAyOzelTutar() {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === currentMatrisOgrId);
    if (!ogr) return;
    const ay = currentMatrisAy;
    const newAmount = getCurrencyValue("matrisAyOzelTutarInput");

    if (newAmount < 0) {
        showToast("Geçersiz taksit tutarı!", "error");
        return;
    }

    if (!ogr.ozelTaksitler) ogr.ozelTaksitler = {};
    ogr.ozelTaksitler[ay] = newAmount;

    if (Array.isArray(ogr.muafAylar)) {
        const mIdx = ogr.muafAylar.indexOf(ay);
        if (mIdx > -1) ogr.muafAylar.splice(mIdx, 1);
    }

    saveOgrenciDb();
    closeModal("modalMatrisAyAyar");
    renderOgrenciGenelTab();
    renderOgrenciMatrisTab();
    renderOgrenciAylikTab();
    showToast(`${ogr.ad} için ${ay} ayı taksiti ${formatCurrency(newAmount)} olarak güncellendi.`);
}

function resetMatrisAyAyar() {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === currentMatrisOgrId);
    if (!ogr) return;
    const ay = currentMatrisAy;

    if (Array.isArray(ogr.muafAylar)) {
        const mIdx = ogr.muafAylar.indexOf(ay);
        if (mIdx > -1) ogr.muafAylar.splice(mIdx, 1);
    }
    if (ogr.ozelTaksitler && ogr.ozelTaksitler[ay] !== undefined) {
        delete ogr.ozelTaksitler[ay];
    }

    saveOgrenciDb();
    closeModal("modalMatrisAyAyar");
    renderOgrenciGenelTab();
    renderOgrenciMatrisTab();
    renderOgrenciAylikTab();
    showToast(`${ogr.ad} için ${ay} ayı standart taksite sıfırlandı.`);
}

function executeMatrisAyTahsilat() {
    const ogrId = currentMatrisOgrId;
    const ay = currentMatrisAy;
    closeModal("modalMatrisAyAyar");
    openQuickOgrenciPayModal(ogrId, ay);
}

// 1. GENEL DURUM & ÖĞRENCİ LİSTESİ (NET HAM BİLGİLER)
function renderOgrenciGenelTab() {
    const tbody = document.getElementById("ogrenciTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchOgrenciInput")?.value || "").toLowerCase().trim();
    const filterBorc = document.getElementById("filterBorcSelect")?.value || "ALL";

    let totalSozlesme = 0;
    let totalTahsilat = 0;
    let totalKalan = 0;
    let borcluSayisi = 0;

    const okulList = getOkulOgrenciler();

    let filtered = okulList.filter(ogr => {
        const plan = getStudentPlanDetails(ogr);

        totalSozlesme += plan.toplamUcret;
        totalTahsilat += plan.paid;
        totalKalan += plan.kalan;
        if (plan.kalan > 0) borcluSayisi++;

        const matchesSearch = !searchTerm || (ogr.ad && ogr.ad.toLowerCase().includes(searchTerm)) || (ogr.telefon && ogr.telefon.includes(searchTerm));
        const matchesBorc = filterBorc === "ALL" || (filterBorc === "DEBT" && plan.kalan > 0) || (filterBorc === "PAID" && plan.kalan === 0);

        return matchesSearch && matchesBorc;
    });

    if (document.getElementById("kpiOgrToplam")) document.getElementById("kpiOgrToplam").innerText = okulList.length;
    if (document.getElementById("kpiOgrSozlesme")) document.getElementById("kpiOgrSozlesme").innerText = formatCurrency(totalSozlesme);
    if (document.getElementById("kpiOgrTahsilat")) document.getElementById("kpiOgrTahsilat").innerText = formatCurrency(totalTahsilat);
    if (document.getElementById("kpiOgrKalan")) document.getElementById("kpiOgrKalan").innerText = formatCurrency(totalKalan);
    if (document.getElementById("kpiOgrBorclu")) document.getElementById("kpiOgrBorclu").innerText = borcluSayisi + " Borçlu";

    updateOkulStatsDisplay();

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 30px; color: var(--text-muted);">Kayıt bulunamadı.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((ogr, index) => {
        const plan = getStudentPlanDetails(ogr);

        const isFullyPaid = plan.kalan <= 0;
        const statusBadge = isFullyPaid 
            ? `<span class="badge-pill badge-success"><i class="fa-solid fa-check"></i> Ödendi</span>`
            : `<span class="badge-pill badge-danger"><i class="fa-solid fa-clock"></i> Borçlu</span>`;

        const taksitDesc = plan.exemptMonths.length > 0 
            ? `${plan.activeMonths.length} Taksit (${plan.exemptMonths.length} Muaf)` 
            : `${plan.taksitSayisi} Taksit`;

        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 11px;">#${index + 1}</td>
                <td>
                    <strong style="cursor:pointer; color: var(--text-main);" onclick="openOgrenciDetailModal(${ogr.id})" title="Detaylı kartı aç">
                        ${ogr.ad || '-'}
                    </strong>
                </td>
                <td style="font-size: 11px; color: var(--text-muted);">${ogr.telefon || '-'}</td>
                <td><span class="badge-pill badge-gold">${ogr.donem || 'Eylül'}</span></td>
                <td><strong>${formatCurrency(plan.netSozlesme)}</strong></td>
                <td><span class="badge-pill badge-subtle" style="cursor:pointer;" onclick="promptQuickTaksitChange(${ogr.id})" title="Taksiti Değiştir">${taksitDesc} ✏️</span></td>
                <td>${formatCurrency(plan.kirtasiye)}</td>
                <td style="color: #34d399; font-weight: 700;">${formatCurrency(plan.paid)}</td>
                <td style="color: ${plan.kalan > 0 ? '#f87171' : '#94a3b8'}; font-weight: 800;">${formatCurrency(plan.kalan)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="openQuickOgrenciPayModal(${ogr.id})" title="Tahsilat Al">
                            <i class="fa-solid fa-hand-holding-dollar" style="color: #34d399;"></i> Tahsil Et
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="printOgrenciOdemePlani(${ogr.id})" title="Yıllık Ödeme Planı Yazdır">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="openEditOgrenciModal(${ogr.id})" title="Düzenle">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="deleteOgrenciPrompt(${ogr.id})" title="Sil">
                            <i class="fa-solid fa-trash-can" style="color: #f87171;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 2. TAKSİT MATRİSİ TABLOSU
function renderOgrenciMatrisTab() {
    const tbody = document.getElementById("matrisTableBody");
    const tfoot = document.getElementById("matrisTableFoot");
    if (!tbody) return;

    tbody.innerHTML = "";
    const aylar = AKADEMIK_AYLAR;

    const now = new Date();
    const currentMonth = now.getMonth();
    let currentSchoolIdx = -1;
    if (currentMonth >= 8) currentSchoolIdx = currentMonth - 8;
    else currentSchoolIdx = currentMonth + 4;

    let totalNetSum = 0;
    let totalMonthlySum = 0;
    let totalKalanSum = 0;
    let monthCollectedSums = Array(aylar.length).fill(0);
    let monthTargetSums = Array(aylar.length).fill(0);

    const okulList = getOkulOgrenciler();

    if (okulList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="17" style="text-align:center; padding: 30px; color: var(--text-muted);">${getOkulDisplayName(currentOkul)} için henüz kayıtlı öğrenci bulunmuyor.</td></tr>`;
        if (tfoot) tfoot.innerHTML = "";
        return;
    }

    okulList.forEach(ogr => {
        const plan = getStudentPlanDetails(ogr);
        const ogrOdemeleri = (dbOgrenci.odemeler || []).filter(o => o.ogrenciId === ogr.id);

        totalNetSum += plan.netSozlesme;
        totalMonthlySum += plan.baseMonthly;
        totalKalanSum += plan.kalan;

        let monthCells = "";
        aylar.forEach((ay, idx) => {
            const sched = plan.monthSchedule[ay] || {};
            const ayOdemesi = ogrOdemeleri.filter(o => o.donem === ay).reduce((s, o) => s + (Number(o.tutar) || 0), 0);

            if (sched.isScheduled) {
                if (sched.isExempt) {
                    monthCells += `<td style="background: rgba(148, 163, 184, 0.08); text-align: center; cursor: pointer;" onclick="openMatrisAyAyarModal(${ogr.id}, '${ay}')" title="Bu ay taksitten silindi / muaf tutuldu. Düzenlemek için tıklayın.">
                        <span class="badge-pill" style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; font-size: 10px; font-weight: 700; padding: 3px 6px;">🚫 Muaf (0 ₺)</span>
                    </td>`;
                } else {
                    const aylikTutar = sched.target;
                    monthTargetSums[idx] += aylikTutar;
                    monthCollectedSums[idx] += ayOdemesi;

                    const isCustom = (plan.ozelTaksitler[ay] !== undefined);
                    const customBadge = isCustom ? `<br><small style="font-size:9px; color:var(--accent-gold);">Özel</small>` : "";

                    if (ayOdemesi >= aylikTutar && aylikTutar > 0) {
                        monthCells += `<td style="background: rgba(16, 185, 129, 0.12); color: #34d399; font-weight: 700; text-align: center; cursor: pointer;" onclick="openMatrisAyAyarModal(${ogr.id}, '${ay}')" title="Ödendi: ${formatCurrency(ayOdemesi)} (Taksiti düzenlemek / silmek için tıklayın)">✔ ${formatCurrency(ayOdemesi)}${customBadge}</td>`;
                    } else if (ayOdemesi > 0) {
                        monthCells += `<td style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; font-weight: 700; text-align: center; cursor: pointer;" onclick="openMatrisAyAyarModal(${ogr.id}, '${ay}')" title="Kısmi: ${formatCurrency(ayOdemesi)} / ${formatCurrency(aylikTutar)} (Taksiti düzenlemek / silmek için tıklayın)">⚠️ ${formatCurrency(ayOdemesi)}${customBadge}</td>`;
                    } else if (idx < currentSchoolIdx && plan.kalan > 0) {
                        monthCells += `<td style="background: rgba(239, 68, 68, 0.12); color: #f87171; font-weight: 700; text-align: center; cursor: pointer;" onclick="openMatrisAyAyarModal(${ogr.id}, '${ay}')" title="Gecikmiş Taksit: ${formatCurrency(aylikTutar)} (Taksiti silmek / muaf tutmak veya tahsil etmek için tıklayın)">⏰ ${formatCurrency(aylikTutar)}${customBadge}</td>`;
                    } else {
                        monthCells += `<td style="text-align: center; color: var(--text-muted); cursor: pointer;" onclick="openMatrisAyAyarModal(${ogr.id}, '${ay}')" title="Bekleyen Taksit: ${formatCurrency(aylikTutar)} (Taksiti silmek / muaf tutmak veya tahsil etmek için tıklayın)">${formatCurrency(aylikTutar)}${customBadge}</td>`;
                    }
                }
            } else if (ayOdemesi > 0) {
                monthCollectedSums[idx] += ayOdemesi;
                monthCells += `<td style="background: rgba(16, 185, 129, 0.12); color: #34d399; font-weight: 700; text-align: center; cursor: pointer;" onclick="openMatrisAyAyarModal(${ogr.id}, '${ay}')" title="Dönem Dışı Tahsilat: ${formatCurrency(ayOdemesi)}">✔ ${formatCurrency(ayOdemesi)}</td>`;
            } else {
                monthCells += `<td style="text-align: center; color: var(--text-dim);">-</td>`;
            }
        });

        tbody.innerHTML += `
            <tr>
                <td><strong style="cursor:pointer; color: var(--text-main);" onclick="openOgrenciDetailModal(${ogr.id})">${ogr.ad}</strong></td>
                <td><strong>${formatCurrency(plan.netSozlesme)}</strong></td>
                <td>
                    <span class="badge-pill badge-gold" style="cursor:pointer;" onclick="promptQuickTaksitChange(${ogr.id})" title="Taksiti Değiştir">
                        ${plan.activeMonths.length} Taksit ✏️
                    </span>
                </td>
                <td style="color: var(--primary); font-weight: 700;">${formatCurrency(plan.baseMonthly)}</td>
                ${monthCells}
                <td style="color: ${plan.kalan > 0 ? '#f87171' : '#34d399'}; font-weight: 800; text-align: right;">${formatCurrency(plan.kalan)}</td>
            </tr>
        `;
    });

    if (tfoot) {
        let footMonthCells = "";
        aylar.forEach((ay, idx) => {
            const target = monthTargetSums[idx];
            const coll = monthCollectedSums[idx];
            footMonthCells += `
                <td style="text-align:center; font-size:10px;">
                    <div style="color: #34d399; font-weight: 700;">${formatCurrency(coll)}</div>
                    <div style="color: var(--text-dim);">/ ${formatCurrency(target)}</div>
                </td>
            `;
        });

        tfoot.innerHTML = `
            <tr>
                <td>GENEL TOPLAM</td>
                <td>${formatCurrency(totalNetSum)}</td>
                <td>-</td>
                <td>${formatCurrency(totalMonthlySum)}</td>
                ${footMonthCells}
                <td style="text-align:right; color: #f87171;">${formatCurrency(totalKalanSum)}</td>
            </tr>
        `;
    }
}

// 3. AYLIK ÖĞRENCİ TAKİBİ
function renderOgrenciAylikTab() {
    const ay = document.getElementById("selectOgrenciAylikAy")?.value || "Ekim";
    const tbody = document.getElementById("ogrenciAylikTableBody");
    if (!tbody) return;

    let ayTargetTotal = 0;
    let ayCollectedTotal = 0;
    let ayPendingTotal = 0;

    let rowsHtml = "";

    const okulList = getOkulOgrenciler();

    okulList.forEach(ogr => {
        const plan = getStudentPlanDetails(ogr);
        const sched = plan.monthSchedule[ay] || {};

        // SADECE BU AY İÇİN AKTİF VE MUAF OLMAYAN TAKSİTLER LİSTELENİR
        if (sched.isScheduled && !sched.isExempt) {
            const aylikTaksit = sched.target;
            if (aylikTaksit > 0) {
                ayTargetTotal += aylikTaksit;
                const ayOdemeleri = (dbOgrenci.odemeler || []).filter(o => o.ogrenciId === ogr.id && o.donem === ay);
                const paidForMonth = ayOdemeleri.reduce((s, o) => s + (Number(o.tutar) || 0), 0);
                const remainingForMonth = Math.max(0, aylikTaksit - paidForMonth);

                ayCollectedTotal += paidForMonth;
                ayPendingTotal += remainingForMonth;

                let status = `<span class="badge-pill badge-danger">Ödenmedi</span>`;
                if (paidForMonth >= aylikTaksit && aylikTaksit > 0) {
                    status = `<span class="badge-pill badge-success">Tamamlandı</span>`;
                } else if (paidForMonth > 0) {
                    status = `<span class="badge-pill badge-warning">Kısmi (${formatCurrency(paidForMonth)})</span>`;
                }

                rowsHtml += `
                    <tr>
                        <td><strong>${ogr.ad}</strong></td>
                        <td style="font-size: 11px; color: var(--text-muted);">${ogr.telefon || '-'}</td>
                        <td><strong>${formatCurrency(aylikTaksit)}</strong></td>
                        <td style="color:#34d399; font-weight:700;">${formatCurrency(paidForMonth)}</td>
                        <td style="color:${remainingForMonth > 0 ? '#f87171' : '#94a3b8'}; font-weight:800;">${formatCurrency(remainingForMonth)}</td>
                        <td>${status}</td>
                        <td>
                            <div style="display: flex; gap: 6px; align-items: center;">
                                <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="openMatrisAyAyarModal(${ogr.id}, '${ay}')" title="Bu Ayı Sil / Muaf Tut veya Ayarla">
                                    <i class="fa-solid fa-sliders" style="color: var(--accent-gold);"></i> Ayar
                                </button>
                                ${remainingForMonth > 0 ? `
                                    <button class="btn btn-success" style="padding: 4px 10px; font-size: 11px;" onclick="openQuickOgrenciPayModal(${ogr.id}, '${ay}')">
                                        <i class="fa-solid fa-plus"></i> Tahsil Et
                                    </button>
                                ` : `
                                    <button class="btn btn-subtle" style="padding: 4px 10px; font-size: 11px;" onclick="openOgrenciDetailModal(${ogr.id})">
                                        Detay
                                    </button>
                                `}
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    });

    tbody.innerHTML = rowsHtml || `<tr><td colspan="7" style="text-align:center; padding: 25px; color: var(--text-muted);">${ay} ayı için taksit bulunmuyor.</td></tr>`;

    if (document.getElementById("kpiAylikTarget")) document.getElementById("kpiAylikTarget").innerText = formatCurrency(ayTargetTotal);
    if (document.getElementById("kpiAylikCollected")) document.getElementById("kpiAylikCollected").innerText = formatCurrency(ayCollectedTotal);
    if (document.getElementById("kpiAylikPending")) document.getElementById("kpiAylikPending").innerText = formatCurrency(ayPendingTotal);
}

function renderPaymentMethodBadge(yontem) {
    const m = (yontem || 'Nakit').trim().toLowerCase();
    if (m.includes('banka') || m.includes('havale') || m.includes('eft')) {
        return `<span class="badge-pill badge-banka"><i class="fa-solid fa-building-columns"></i> Banka</span>`;
    } else if (m.includes('pos') || m.includes('kart') || m.includes('kredi')) {
        return `<span class="badge-pill badge-pos"><i class="fa-solid fa-credit-card"></i> POS / Kart</span>`;
    } else {
        return `<span class="badge-pill badge-nakit"><i class="fa-solid fa-money-bill-wave"></i> Nakit</span>`;
    }
}

// 4. VEZNE & TAHSİLAT LİSTESİ (GÜNLÜK RAPOR VE İSTEĞE BAĞLI MAKBUZ)
function setVezneTarihBugun() {
    const inp = document.getElementById("vezneRaporTarih");
    if (inp) inp.value = getLocalTodayYMD();
    renderOgrenciOdemelerTab();
}

function getVezneReportOptions() {
    const tarihInput = document.getElementById("vezneRaporTarih");
    if (tarihInput && !tarihInput.value) {
        tarihInput.value = getLocalTodayYMD();
    }
    return {
        tarih: tarihInput ? tarihInput.value : getLocalTodayYMD(),
        okul: currentOkul || "okul1",
        yontem: document.getElementById("vezneYontemFiltre")?.value || "ALL",
        kategori: "ALL",
        search: document.getElementById("searchVezneInput")?.value || ""
    };
}

function renderOgrenciOdemelerTab() {
    const tbody = document.getElementById("ogrenciOdemelerTableBody");
    if (!tbody) return;

    const opts = getVezneReportOptions();
    const dailyStats = getFilteredTahsilatReportData({ ...opts, yontem: "ALL", search: "" });

    const elTot = document.getElementById("kpiVezneGunlukToplam");
    const elIslem = document.getElementById("kpiVezneGunlukIslem");
    const elNak = document.getElementById("kpiVezneGunlukNakit");
    const elNakOran = document.getElementById("kpiVezneGunlukNakitOran");
    const elBnk = document.getElementById("kpiVezneGunlukBanka");
    const elBnkOran = document.getElementById("kpiVezneGunlukBankaOran");
    const elPos = document.getElementById("kpiVezneGunlukPos");
    const elPosOran = document.getElementById("kpiVezneGunlukPosOran");

    const t = dailyStats.toplam;
    if (elTot) elTot.innerText = formatCurrency(t);
    if (elIslem) elIslem.innerText = `${formatDateTurkish(opts.tarih)} • ${dailyStats.rows.length} İşlem`;
    if (elNak) elNak.innerText = formatCurrency(dailyStats.nakit);
    if (elNakOran) elNakOran.innerText = `%${t > 0 ? Math.round((dailyStats.nakit / t) * 100) : 0} Nakit`;
    if (elBnk) elBnk.innerText = formatCurrency(dailyStats.banka);
    if (elBnkOran) elBnkOran.innerText = `%${t > 0 ? Math.round((dailyStats.banka / t) * 100) : 0} Banka`;
    if (elPos) elPos.innerText = formatCurrency(dailyStats.pos);
    if (elPosOran) elPosOran.innerText = `%${t > 0 ? Math.round((dailyStats.pos / t) * 100) : 0} POS`;

    const gorunumModu = document.getElementById("vezneGorunumModu")?.value || "ALL";
    const searchTerm = (opts.search || "").toLowerCase().trim();
    const okulOdemeler = getOkulOdemeler().filter(o => {
        if (gorunumModu === "DAY" && normalizeDateToYMD(o.tarih) !== opts.tarih) return false;
        if (opts.yontem !== "ALL" && !matchesYontemFilter(o.tur || o.yontem || 'Nakit', opts.yontem)) return false;
        if (searchTerm) {
            const ogr = dbOgrenci.ogrenciler.find(s => s.id === o.ogrenciId);
            const haystack = `${ogr ? ogr.ad : ''} ${o.makbuzNo || ''} ${o.donem || ''} ${o.not || ''}`.toLowerCase();
            if (!haystack.includes(searchTerm)) return false;
        }
        return true;
    });

    if (okulOdemeler.length === 0) {
        const scopeLabel = gorunumModu === "DAY" ? `${formatDateTurkish(opts.tarih)} tarihinde` : getOkulDisplayName(currentOkul) + " için";
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-muted);">${scopeLabel} kriterlere uygun tahsilat bulunmuyor.</td></tr>`;
        return;
    }

    const sorted = [...okulOdemeler].reverse();
    tbody.innerHTML = sorted.map(o => {
        const ogr = dbOgrenci.ogrenciler.find(s => s.id === o.ogrenciId);
        const ogrAd = ogr ? ogr.ad : `Öğrenci #${o.ogrenciId}`;
        const yontemBadge = renderPaymentMethodBadge(o.tur || o.yontem || 'Nakit');

        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 11px;">${o.makbuzNo || ('MK-' + (1000 + o.id))}</td>
                <td style="font-size: 11px; color: var(--text-muted);">${o.tarih || '-'}</td>
                <td><strong>${ogrAd}</strong></td>
                <td><span class="badge-pill badge-gold">${o.donem || 'Genel'}</span></td>
                <td style="text-align: center;">${yontemBadge}</td>
                <td style="text-align: right; font-weight: 800; color: #34d399; font-size: 13px;">${formatCurrency(o.tutar)}</td>
                <td style="color: var(--text-muted); font-size: 11px;">${o.not || '-'}</td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 4px;">
                        <button type="button" class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="printOgrenciMakbuz(${o.id})" title="İsteğe bağlı resmi makbuz çıktısı al">
                            <i class="fa-solid fa-print"></i> Makbuz
                        </button>
                        <button type="button" class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="deleteOgrenciOdemePrompt(${o.id})" title="Sil">
                            <i class="fa-solid fa-trash-can" style="color: #f87171;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function printVezneGunlukRapor() {
    const opts = getVezneReportOptions();
    const reportData = getFilteredTahsilatReportData(opts);
    const printContainer = document.getElementById("printableReceipt");
    if (printContainer) {
        printContainer.innerHTML = buildGunlukTahsilatPrintHtml(reportData, opts.tarih);
        window.print();
    }
}

function exportVezneGunlukExcel() {
    const opts = getVezneReportOptions();
    const reportData = getFilteredTahsilatReportData(opts);
    exportTahsilatReportToExcel(reportData, opts.tarih);
}

// ============================================================================
// 5. KIRTASİYE TAKİBİ, TAHSİLAT & ÖDEME YÖNTEMLERİ (NAKİT / BANKA / POS)
// ============================================================================

let selectedKirtasiyeMethod = 'Nakit';

function handleKirtasiyeMethodChange(method) {
    selectedKirtasiyeMethod = method;
    document.querySelectorAll('#modalKirtasiyeTahsilat .payment-method-card').forEach(card => card.classList.remove('active'));
    const targetCard = document.getElementById('lblMethod' + method);
    if (targetCard) targetCard.classList.add('active');
}

function getOgrenciKirtasiyeDetails(ogr) {
    const toplamBedel = Number(ogr.kirtasiye) || 0;
    
    // Kırtasiye ödemeleri dizisini güvene al
    if (!Array.isArray(ogr.kirtasiyeOdemeler)) {
        ogr.kirtasiyeOdemeler = [];
    }

    // Genel vezne/odemeler tablosunda Kırtasiye dönemiyle kaydedilmiş ama ogr.kirtasiyeOdemeler'de olmayan kayıtları da senkronize et
    if (dbOgrenci && Array.isArray(dbOgrenci.odemeler)) {
        const vezneKirtasiyeOdemeler = dbOgrenci.odemeler.filter(o => o.ogrenciId === ogr.id && (o.donem === 'Kırtasiye' || (o.not && o.not.toLowerCase().includes('kırtasiye'))));
        vezneKirtasiyeOdemeler.forEach(vo => {
            const exists = ogr.kirtasiyeOdemeler.some(ko => ko.id === vo.id || (normalizeDateToYMD(ko.tarih) === normalizeDateToYMD(vo.tarih) && Number(ko.tutar) === Number(vo.tutar)));
            if (!exists) {
                ogr.kirtasiyeOdemeler.push({
                    id: vo.id || Date.now(),
                    tarih: vo.tarih || getLocalTodayYMD(),
                    tutar: Number(vo.tutar) || 0,
                    yontem: vo.tur === 'Nakit' ? 'Nakit' : (vo.tur && vo.tur.includes('POS') ? 'POS' : (vo.tur && vo.tur.includes('Banka') ? 'Banka' : 'Nakit')),
                    makbuzNo: vo.makbuzNo || ('KT-' + (1000 + (vo.id % 9000))),
                    not: vo.not || 'Kırtasiye Bedeli Tahsilatı'
                });
            }
        });
    }

    // Toplam ödenen
    const odenen = ogr.kirtasiyeOdemeler.reduce((s, p) => s + (Number(p.tutar) || 0), 0);
    const kalan = Math.max(0, toplamBedel - odenen);
    const teslim = ogr.kirtasiyeTeslim === true;

    // Son kullanılan ödeme yöntemi
    let yontem = ogr.kirtasiyeYontem;
    if (!yontem && ogr.kirtasiyeOdemeler.length > 0) {
        yontem = ogr.kirtasiyeOdemeler[ogr.kirtasiyeOdemeler.length - 1].yontem;
    }
    if (!yontem) yontem = '-';

    return {
        toplamBedel,
        odenen,
        kalan,
        teslim,
        yontem,
        odemeler: ogr.kirtasiyeOdemeler
    };
}

function renderOgrenciKirtasiyeTab() {
    const tbody = document.getElementById("kirtasiyeTableBody");
    if (!tbody) return;

    const okulList = getOkulOgrenciler();

    // KPI Hesaplamaları
    let totalTahakkuk = 0;
    let totalTahsilat = 0;
    let totalKalan = 0;
    let totalTeslim = 0;
    let totalBorcluCount = 0;

    okulList.forEach(ogr => {
        const det = getOgrenciKirtasiyeDetails(ogr);
        totalTahakkuk += det.toplamBedel;
        totalTahsilat += det.odenen;
        totalKalan += det.kalan;
        if (det.teslim) totalTeslim++;
        if (det.kalan > 0 && det.toplamBedel > 0) totalBorcluCount++;
    });

    const kpiTahakkukEl = document.getElementById("kpiKirtasiyeToplamTahakkuk");
    if (kpiTahakkukEl) kpiTahakkukEl.innerText = formatCurrency(totalTahakkuk);

    const kpiOgrCountEl = document.getElementById("kpiKirtasiyeToplamOgrenci");
    if (kpiOgrCountEl) {
        const currentKurum = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
        const okulLabel = currentOkul === 'okul2' ? (currentKurum.okul2Adi || 'Okul 2') : (currentKurum.okul1Adi || 'Okul 1');
        kpiOgrCountEl.innerText = `${okulList.length} Öğrenci (${okulLabel})`;
    }

    const kpiTahsilatEl = document.getElementById("kpiKirtasiyeTahsilEdilen");
    if (kpiTahsilatEl) kpiTahsilatEl.innerText = formatCurrency(totalTahsilat);

    const kpiTahsilatOranEl = document.getElementById("kpiKirtasiyeTahsilatOrani");
    if (kpiTahsilatOranEl) {
        const oran = totalTahakkuk > 0 ? Math.round((totalTahsilat / totalTahakkuk) * 100) : 0;
        kpiTahsilatOranEl.innerText = `%${oran} Tahsil Edildi`;
    }

    const kpiKalanEl = document.getElementById("kpiKirtasiyeKalanAlacak");
    if (kpiKalanEl) kpiKalanEl.innerText = formatCurrency(totalKalan);

    const kpiBorcluEl = document.getElementById("kpiKirtasiyeBorcluSayisi");
    if (kpiBorcluEl) kpiBorcluEl.innerText = `${totalBorcluCount} Öğrencinin Borcu Var`;

    const kpiTeslimatEl = document.getElementById("kpiKirtasiyeTeslimatSayisi");
    if (kpiTeslimatEl) kpiTeslimatEl.innerText = `${totalTeslim} / ${okulList.length}`;

    const kpiTeslimatOranEl = document.getElementById("kpiKirtasiyeTeslimatOrani");
    if (kpiTeslimatOranEl) {
        const oran = okulList.length > 0 ? Math.round((totalTeslim / okulList.length) * 100) : 0;
        kpiTeslimatOranEl.innerText = `%${oran} Teslim Edildi`;
    }

    // Filtreleme & Arama
    const searchVal = (document.getElementById("searchKirtasiyeInput")?.value || "").toLowerCase().trim();
    const filterDurum = document.getElementById("filterKirtasiyeDurum")?.value || "ALL";
    const filterYontem = document.getElementById("filterKirtasiyeYontem")?.value || "ALL";

    let filtered = okulList.filter(ogr => {
        const det = getOgrenciKirtasiyeDetails(ogr);

        // Arama filtresi
        if (searchVal) {
            const adMatch = (ogr.ad || "").toLowerCase().includes(searchVal);
            const telMatch = (ogr.telefon || "").toLowerCase().includes(searchVal);
            if (!adMatch && !telMatch) return false;
        }

        // Durum filtresi
        if (filterDurum === "BORCLU") {
            if (det.kalan <= 0 || det.toplamBedel <= 0) return false;
        } else if (filterDurum === "ODENDI") {
            if (det.odenen < det.toplamBedel || det.toplamBedel <= 0) return false;
        } else if (filterDurum === "BEKLIYOR") {
            if (det.odenen > 0 || det.toplamBedel <= 0) return false;
        } else if (filterDurum === "TESLIM_EDILMEDI") {
            if (det.teslim) return false;
        } else if (filterDurum === "TESLIM_EDILDI") {
            if (!det.teslim) return false;
        }

        // Yöntem filtresi
        if (filterYontem !== "ALL") {
            const hasMethod = det.odemeler.some(p => p.yontem === filterYontem);
            if (!hasMethod && det.yontem !== filterYontem) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        const currentKurum = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
        const okulLabel = currentOkul === 'okul2' ? (currentKurum.okul2Adi || 'Okul 2') : (currentKurum.okul1Adi || 'Okul 1');
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 32px; color: var(--text-muted);">${okulLabel} için kriterlere uygun kırtasiye kaydı bulunamadı.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((ogr, idx) => {
        const det = getOgrenciKirtasiyeDetails(ogr);

        // Ödeme Yöntemi Rozeti
        let yontemBadge = `<span style="color: var(--text-muted); font-size: 11px;">-</span>`;
        if (det.odemeler.length > 0) {
            const methods = [...new Set(det.odemeler.map(p => p.yontem))];
            yontemBadge = methods.map(m => {
                if (m === 'Nakit') return `<span class="badge-pill badge-nakit" title="Nakit Kasa"><i class="fa-solid fa-money-bill-wave"></i> Nakit</span>`;
                if (m === 'Banka') return `<span class="badge-pill badge-banka" title="Banka Havale / EFT"><i class="fa-solid fa-building-columns"></i> Banka</span>`;
                if (m === 'POS') return `<span class="badge-pill badge-pos" title="POS Kredi Kartı"><i class="fa-solid fa-credit-card"></i> POS</span>`;
                return `<span class="badge-pill badge-subtle">${m}</span>`;
            }).join(" ");
        }

        // Tahsilat Durumu Rozeti
        let durumBadge = "";
        if (det.toplamBedel <= 0) {
            durumBadge = `<span class="badge-pill badge-subtle">Muaf</span>`;
        } else if (det.odenen >= det.toplamBedel) {
            durumBadge = `<span class="badge-pill badge-success"><i class="fa-solid fa-check"></i> Ödendi</span>`;
        } else if (det.odenen > 0) {
            durumBadge = `<span class="badge-pill badge-warning"><i class="fa-solid fa-hourglass-half"></i> Kısmi (${formatCurrency(det.odenen)})</span>`;
        } else {
            durumBadge = `<span class="badge-pill badge-danger"><i class="fa-solid fa-clock"></i> Bekliyor</span>`;
        }

        // Kitap Teslimat Butonu
        const teslimBtn = det.teslim 
            ? `<button type="button" class="btn btn-success" style="padding: 3px 8px; font-size: 10.5px; white-space: nowrap;" onclick="toggleKirtasiyeTeslim(${ogr.id})" title="Kitaplar teslim edildi (Geri almak için tıklayın)">
                   <i class="fa-solid fa-boxes-packing"></i> Teslim Edildi
               </button>`
            : `<button type="button" class="btn btn-subtle" style="padding: 3px 8px; font-size: 10.5px; white-space: nowrap;" onclick="toggleKirtasiyeTeslim(${ogr.id})" title="Kitap henüz teslim edilmedi (Teslim etmek için tıklayın)">
                   <i class="fa-solid fa-clock"></i> Bekliyor
               </button>`;

        return `
            <tr>
                <td style="text-align: center; color: var(--text-muted); font-size: 11px;">${idx + 1}</td>
                <td><strong>${ogr.ad}</strong></td>
                <td style="font-size: 11.5px; color: var(--text-muted);">${ogr.telefon || '-'}</td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(det.toplamBedel)}</td>
                <td style="text-align: right; color: #10b981; font-weight: 700;">${formatCurrency(det.odenen)}</td>
                <td style="text-align: right; font-weight: 800; color: ${det.kalan > 0 ? '#ef4444' : '#10b981'};">
                    ${det.kalan > 0 ? formatCurrency(det.kalan) : '✔ 0 ₺'}
                </td>
                <td style="text-align: center;">${yontemBadge}</td>
                <td style="text-align: center;">${durumBadge}</td>
                <td style="text-align: center;">${teslimBtn}</td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 4px; align-items: center;">
                        ${det.kalan > 0 ? `
                            <button type="button" class="btn btn-success" style="padding: 3px 7px; font-size: 10.5px; font-weight: 700; background: #10b981; border-color: #10b981; color: #fff;" onclick="openKirtasiyeTahsilatModal(${ogr.id})" title="Kırtasiye Tahsilatı Al (Nakit/Banka/POS)">
                                <i class="fa-solid fa-plus"></i> Tahsil Et
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-subtle" style="padding: 3px 7px; font-size: 10.5px;" onclick="openKirtasiyeGecmisModal(${ogr.id})" title="Ödeme Geçmişi ve Makbuzlar">
                            <i class="fa-solid fa-receipt"></i> Makbuz (${det.odemeler.length})
                        </button>
                        <button type="button" class="btn btn-subtle" style="padding: 3px 6px; font-size: 10.5px;" onclick="openEditOgrenciModal(${ogr.id})" title="Öğrenciyi & Kırtasiye Bedelini Düzenle">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function toggleKirtasiyeTeslim(id) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === id);
    if (!ogr) return;
    ogr.kirtasiyeTeslim = !ogr.kirtasiyeTeslim;
    saveOgrenciDb();
    renderOgrenciKirtasiyeTab();
    showToast(`Kitap teslim durumu güncellendi: ${ogr.kirtasiyeTeslim ? 'Teslim Edildi' : 'Bekliyor'}`);
}

function openKirtasiyeTahsilatModal(ogrId) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;

    const det = getOgrenciKirtasiyeDetails(ogr);
    const currentKurum = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
    const okulLabel = ogr.okul === 'okul2' ? (currentKurum.okul2Adi || 'Okul 2') : (currentKurum.okul1Adi || 'Okul 1');

    document.getElementById("formKirtasiyeTahsilatOgrId").value = ogr.id;
    document.getElementById("lblKirtasiyeTahsilatOgrAd").innerText = `${ogr.ad} (${okulLabel})`;
    document.getElementById("lblKirtasiyeModalToplam").innerText = formatCurrency(det.toplamBedel);
    document.getElementById("lblKirtasiyeModalOdenen").innerText = formatCurrency(det.odenen);
    document.getElementById("lblKirtasiyeModalKalan").innerText = formatCurrency(det.kalan);

    // Kalan borcu varsayılan tutar olarak hazırla
    setCurrencyValue("formKirtasiyeTutar", det.kalan > 0 ? det.kalan : det.toplamBedel);

    // Varsayılan ödeme yöntemi: Nakit
    handleKirtasiyeMethodChange('Nakit');
    const radioNakit = document.querySelector('input[name="kirtasiyeYontemRadio"][value="Nakit"]');
    if (radioNakit) radioNakit.checked = true;

    // Tarih ve Makbuz No
    document.getElementById("formKirtasiyeTarih").value = getLocalTodayYMD();
    document.getElementById("formKirtasiyeMakbuzNo").value = `KT-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById("formKirtasiyeNot").value = `${ogr.ad} - Kırtasiye ve Kitap Seti Bedeli`;

    // Kitap teslim onay kutusu: Eğer henüz teslim edilmediyse otomatik işaretle sun
    const chk = document.getElementById("chkKirtasiyeTeslimEt");
    if (chk) chk.checked = !det.teslim;

    openModal("modalKirtasiyeTahsilat");
}

function fillKirtasiyeMaxRemaining() {
    const ogrId = Number(document.getElementById("formKirtasiyeTahsilatOgrId").value);
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;
    const det = getOgrenciKirtasiyeDetails(ogr);
    setCurrencyValue("formKirtasiyeTutar", det.kalan > 0 ? det.kalan : 0);
}

function executeKirtasiyeSubmit(withPrint) {
    const ogrId = Number(document.getElementById("formKirtasiyeTahsilatOgrId").value);
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;

    const tutar = getCurrencyValue("formKirtasiyeTutar");
    if (tutar <= 0) {
        showToast("Lütfen geçerli bir tahsilat tutarı giriniz", "error");
        return;
    }

    const yontemRadio = document.querySelector('input[name="kirtasiyeYontemRadio"]:checked');
    const yontem = yontemRadio ? yontemRadio.value : selectedKirtasiyeMethod || "Nakit";

    const tarih = document.getElementById("formKirtasiyeTarih").value || getLocalTodayYMD();
    const makbuzNo = document.getElementById("formKirtasiyeMakbuzNo").value.trim() || `KT-${Math.floor(1000 + Math.random() * 9000)}`;
    const aciklama = document.getElementById("formKirtasiyeNot").value.trim() || `${ogr.ad} - Kırtasiye Bedeli`;
    const teslimOnay = document.getElementById("chkKirtasiyeTeslimEt")?.checked;

    if (!Array.isArray(ogr.kirtasiyeOdemeler)) ogr.kirtasiyeOdemeler = [];

    const paymentId = Date.now();
    const paymentRecord = {
        id: paymentId,
        tarih,
        tutar,
        yontem,
        makbuzNo,
        not: aciklama
    };

    ogr.kirtasiyeOdemeler.push(paymentRecord);
    ogr.kirtasiyeOdenen = ogr.kirtasiyeOdemeler.reduce((s, p) => s + (Number(p.tutar) || 0), 0);
    ogr.kirtasiyeYontem = yontem;

    if (teslimOnay) {
        ogr.kirtasiyeTeslim = true;
    }

    // Genel vezne / ödemeler tablosuna da kaydet (öğrencinin toplam bakiyesinden düşer)
    if (dbOgrenci && Array.isArray(dbOgrenci.odemeler)) {
        dbOgrenci.odemeler.push({
            id: paymentId,
            tarih: tarih.split('-').reverse().join('.'), // DD.MM.YYYY
            ogrenciId: ogr.id,
            donem: "Kırtasiye",
            tutar,
            tur: yontem === 'Nakit' ? 'Nakit' : (yontem === 'Banka' ? 'Banka Havale' : 'POS Kredi Kartı'),
            makbuzNo,
            not: aciklama
        });
    }

    saveOgrenciDb();
    closeModal("modalKirtasiyeTahsilat");

    renderOgrenciKirtasiyeTab();
    if (typeof renderOgrenciGenelTab === 'function') renderOgrenciGenelTab();
    if (typeof renderOgrenciOdemelerTab === 'function') renderOgrenciOdemelerTab();
    if (typeof renderGunlukTahsilatRaporu === 'function') renderGunlukTahsilatRaporu();

    showToast(`₺${tutar.toLocaleString('tr-TR')} kırtasiye tahsilatı başarıyla alındı (${yontem})`);

    if (withPrint) {
        printKirtasiyeMakbuz(ogr.id, paymentId);
    }
}

function submitKirtasiyeTahsilat(e) {
    if (e) e.preventDefault();
    executeKirtasiyeSubmit(false);
}

function openKirtasiyeGecmisModal(ogrId) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;

    const det = getOgrenciKirtasiyeDetails(ogr);
    const currentKurum = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
    const okulLabel = ogr.okul === 'okul2' ? (currentKurum.okul2Adi || 'Okul 2') : (currentKurum.okul1Adi || 'Okul 1');

    document.getElementById("lblKirtasiyeGecmisOgrAd").innerText = `${ogr.ad} (${okulLabel})`;

    // Özet kutusu
    const summaryBox = document.getElementById("kirtasiyeGecmisSummaryBox");
    if (summaryBox) {
        summaryBox.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 12px; background: var(--bg-card-subtle); border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
                <div>
                    <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);">TOPLAM BEDEL</div>
                    <div style="font-size: 14px; font-weight: 800; color: var(--text-main);">${formatCurrency(det.toplamBedel)}</div>
                </div>
                <div>
                    <div style="font-size: 11px; font-weight: 700; color: #10b981;">TAHSİL EDİLEN</div>
                    <div style="font-size: 14px; font-weight: 800; color: #10b981;">${formatCurrency(det.odenen)}</div>
                </div>
                <div>
                    <div style="font-size: 11px; font-weight: 700; color: #ef4444;">KALAN BAKİYE</div>
                    <div style="font-size: 14px; font-weight: 800; color: ${det.kalan > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(det.kalan)}</div>
                </div>
                <div>
                    <div style="font-size: 11px; font-weight: 700; color: var(--primary);">KİTAP TESLİMATI</div>
                    <div style="margin-top: 2px;">
                        ${det.teslim 
                            ? `<span class="badge-pill badge-success"><i class="fa-solid fa-check"></i> Teslim Edildi</span>`
                            : `<span class="badge-pill badge-warning"><i class="fa-solid fa-clock"></i> Bekliyor</span>`}
                    </div>
                </div>
            </div>
        `;
    }

    const btnYeni = document.getElementById("btnGecmisYeniTahsilat");
    if (btnYeni) {
        btnYeni.onclick = () => {
            closeModal("modalKirtasiyeGecmis");
            openKirtasiyeTahsilatModal(ogr.id);
        };
    }

    // Tablo doldur
    const tbody = document.getElementById("kirtasiyeGecmisTableBody");
    if (tbody) {
        if (!det.odemeler || det.odemeler.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Bu öğrenci için henüz kaydedilmiş bir kırtasiye ödemesi bulunmuyor.</td></tr>`;
        } else {
            tbody.innerHTML = [...det.odemeler].reverse().map(p => {
                let badge = `<span class="badge-pill badge-nakit">Nakit</span>`;
                if (p.yontem === 'Banka') badge = `<span class="badge-pill badge-banka">Banka</span>`;
                if (p.yontem === 'POS') badge = `<span class="badge-pill badge-pos">POS</span>`;

                return `
                    <tr>
                        <td style="font-size: 11.5px; color: var(--text-muted);">${p.tarih}</td>
                        <td style="font-weight: 600; font-size: 11.5px;">${p.makbuzNo || '-'}</td>
                        <td>${badge}</td>
                        <td style="text-align: right; font-weight: 800; color: #10b981;">${formatCurrency(p.tutar)}</td>
                        <td style="font-size: 11.5px; color: var(--text-muted);">${p.not || '-'}</td>
                        <td style="text-align: right;">
                            <div style="display: inline-flex; gap: 4px;">
                                <button type="button" class="btn btn-subtle" style="padding: 3px 6px; font-size: 11px;" onclick="printKirtasiyeMakbuz(${ogr.id}, ${p.id})" title="Makbuz Yazdır">
                                    <i class="fa-solid fa-print"></i>
                                </button>
                                <button type="button" class="btn btn-subtle" style="padding: 3px 6px; font-size: 11px;" onclick="deleteKirtasiyePayment(${ogr.id}, ${p.id})" title="Bu Ödemeyi Sil">
                                    <i class="fa-solid fa-trash-can" style="color: #ef4444;"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    }

    openModal("modalKirtasiyeGecmis");
}

function deleteKirtasiyePayment(ogrId, paymentId) {
    if (!confirm("Bu kırtasiye tahsilat kaydını silmek istediğinize emin misiniz?")) return;

    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr || !Array.isArray(ogr.kirtasiyeOdemeler)) return;

    ogr.kirtasiyeOdemeler = ogr.kirtasiyeOdemeler.filter(p => p.id !== paymentId);
    ogr.kirtasiyeOdenen = ogr.kirtasiyeOdemeler.reduce((s, p) => s + (Number(p.tutar) || 0), 0);

    // Genel vezne tablosundan da kaldır
    if (dbOgrenci && Array.isArray(dbOgrenci.odemeler)) {
        dbOgrenci.odemeler = dbOgrenci.odemeler.filter(o => o.id !== paymentId);
    }

    saveOgrenciDb();
    openKirtasiyeGecmisModal(ogrId);
    renderOgrenciKirtasiyeTab();
    if (typeof renderOgrenciGenelTab === 'function') renderOgrenciGenelTab();
    if (typeof renderOgrenciOdemelerTab === 'function') renderOgrenciOdemelerTab();
    if (typeof renderGunlukTahsilatRaporu === 'function') renderGunlukTahsilatRaporu();
    showToast("Tahsilat kaydı silindi");
}

function printKirtasiyeMakbuz(ogrId, paymentId) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;

    const det = getOgrenciKirtasiyeDetails(ogr);
    const payment = det.odemeler.find(p => p.id === paymentId) || det.odemeler[det.odemeler.length - 1] || {
        tarih: getLocalTodayYMD(),
        tutar: det.odenen || det.toplamBedel,
        yontem: ogr.kirtasiyeYontem || "Nakit",
        makbuzNo: "KT-" + Math.floor(1000 + Math.random() * 9000),
        not: "Kırtasiye ve Kitap Seti Bedeli"
    };

    const currentKurum = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
    const okulLabel = ogr.okul === 'okul2' ? (currentKurum.okul2Adi || 'Okul 2') : (currentKurum.okul1Adi || 'Okul 1');
    const kurumAdi = currentKurum.name || "Kurumsal Eğitim Kurumları";
    const subTitle = currentKurum.subTitle || "Mali ve İdari İşler Yönetimi";
    const yetkili = currentKurum.bursar || currentKurum.kasaSorumlusu || "Vezne Yetkilisi";
    const tarihDisp = formatDateTurkish(normalizeDateToYMD(payment.tarih));

    const makbuzHtml = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 8px; padding: 24px 28px; background: #fff; color: #0f172a;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
                <div>
                    <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin: 0 0 4px 0;">${kurumAdi}</h1>
                    <div style="font-size: 12px; color: #64748b; font-weight: 600;">${subTitle} &bull; ${okulLabel}</div>
                </div>
                <div style="text-align: right;">
                    <span style="display: inline-block; background: #0f172a; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.05em;">KIRTASİYE TAHSİLAT MAKBUZU</span>
                    <div style="font-size: 11.5px; color: #64748b; margin-top: 4px; font-weight: 700;">No: ${payment.makbuzNo || 'KT-1001'}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 12.5px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #64748b; font-weight: 600;">Öğrenci Adı:</span><span style="font-weight: 700; color: #0f172a;">${ogr.ad}</span></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #64748b; font-weight: 600;">Telefon:</span><span style="font-weight: 700; color: #0f172a;">${ogr.telefon || '-'}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 600;">Kayıtlı Şube:</span><span style="font-weight: 700; color: #0f172a;">${okulLabel}</span></div>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 12.5px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #64748b; font-weight: 600;">Tahsilat Tarihi:</span><span style="font-weight: 700; color: #0f172a;">${tarihDisp}</span></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #64748b; font-weight: 600;">Ödeme Yöntemi:</span><span style="font-weight: 700; color: #0284c7; text-transform: uppercase;">${payment.yontem}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 600;">Kitap Teslimatı:</span><span style="font-weight: 700; color: ${det.teslim ? '#059669' : '#d97706'};">${det.teslim ? 'Teslim Edildi' : 'Teslim Bekliyor'}</span></div>
                </div>
            </div>

            <div style="background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.04em;">TAHSİL EDİLEN TUTAR</div>
                    <div style="font-size: 12px; color: #047857; margin-top: 2px;">${payment.not || 'Kitap & Kırtasiye Seti Bedeli'}</div>
                </div>
                <div style="font-size: 24px; font-weight: 900; color: #059669;">${formatCurrency(payment.tutar)}</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 11.5px; margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #64748b;">Toplam Kırtasiye Bedeli:</span>
                    <strong style="color: #0f172a;">${formatCurrency(det.toplamBedel)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #64748b;">Bugüne Kadar Yapılan Tahsilat:</span>
                    <strong style="color: #059669;">${formatCurrency(det.odenen)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px;">
                    <span style="font-weight: 700; color: #0f172a;">Kalan Kırtasiye Bakiyesi:</span>
                    <strong style="color: ${det.kalan > 0 ? '#dc2626' : '#059669'}; font-size: 13px;">${formatCurrency(det.kalan)}</strong>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 12px;">
                <div>
                    <div style="font-weight: 600; color: #64748b;">Ödemeyi Yapan (Veli / Öğrenci)</div>
                    <div style="margin-top: 45px; border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 700;">${ogr.ad}</div>
                </div>
                <div>
                    <div style="font-weight: 600; color: #64748b;">Tahsil Eden (Vezne / Yetkili)</div>
                    <div style="margin-top: 45px; border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 700;">${yetkili}</div>
                </div>
            </div>
        </div>
    `;

    const printContainer = document.getElementById("printableReceipt");
    if (printContainer) {
        printContainer.innerHTML = makbuzHtml;
        window.print();
    }
}

function exportKirtasiyeToExcel() {
    const okulList = getOkulOgrenciler();
    const currentKurum = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
    const okulLabel = currentOkul === 'okul2' ? (currentKurum.okul2Adi || 'Okul 2') : (currentKurum.okul1Adi || 'Okul 1');

    let rowsXml = "";
    okulList.forEach((ogr, idx) => {
        const det = getOgrenciKirtasiyeDetails(ogr);
        const durumText = det.toplamBedel <= 0 ? "Muaf" : (det.odenen >= det.toplamBedel ? "Tamamı Ödendi" : (det.odenen > 0 ? "Kısmi Ödeme" : "Ödenmedi"));
        const teslimText = det.teslim ? "Teslim Edildi" : "Bekliyor";

        rowsXml += `
            <Row>
                <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
                <Cell><Data ss:Type="String">${ogr.ad}</Data></Cell>
                <Cell><Data ss:Type="String">${ogr.telefon || '-'}</Data></Cell>
                <Cell><Data ss:Type="String">${okulLabel}</Data></Cell>
                <Cell><Data ss:Type="Number">${det.toplamBedel}</Data></Cell>
                <Cell><Data ss:Type="Number">${det.odenen}</Data></Cell>
                <Cell><Data ss:Type="Number">${det.kalan}</Data></Cell>
                <Cell><Data ss:Type="String">${det.yontem}</Data></Cell>
                <Cell><Data ss:Type="String">${durumText}</Data></Cell>
                <Cell><Data ss:Type="String">${teslimText}</Data></Cell>
            </Row>
        `;
    });

    const excelTemplate = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
     xmlns:o="urn:schemas-microsoft-com:office:office"
     xmlns:x="urn:schemas-microsoft-com:office:excel"
     xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
     <Worksheet ss:Name="Kırtasiye Takip">
      <Table>
       <Row>
        <Cell><Data ss:Type="String">No</Data></Cell>
        <Cell><Data ss:Type="String">Öğrenci Adı</Data></Cell>
        <Cell><Data ss:Type="String">Telefon</Data></Cell>
        <Cell><Data ss:Type="String">Okul / Şube</Data></Cell>
        <Cell><Data ss:Type="String">Kırtasiye Bedeli (TL)</Data></Cell>
        <Cell><Data ss:Type="String">Tahsil Edilen (TL)</Data></Cell>
        <Cell><Data ss:Type="String">Kalan Bakiye (TL)</Data></Cell>
        <Cell><Data ss:Type="String">Ödeme Yöntemi</Data></Cell>
        <Cell><Data ss:Type="String">Tahsilat Durumu</Data></Cell>
        <Cell><Data ss:Type="String">Teslimat Durumu</Data></Cell>
       </Row>
       ${rowsXml}
      </Table>
     </Worksheet>
    </Workbook>`;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kirtasiye_Tahsilat_Listesi_${okulLabel.replace(/\s+/g, '_')}_${getLocalTodayYMD()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Kırtasiye listesi Excel olarak indirildi");
}

function topluKirtasiyeTeslimatPrompt() {
    const okulList = getOkulOgrenciler();
    const bekleyenler = okulList.filter(o => !o.kirtasiyeTeslim);

    if (bekleyenler.length === 0) {
        showToast("Tüm öğrencilerin kitapları zaten teslim edilmiş durumda");
        return;
    }

    if (!confirm(`Kitabı henüz teslim edilmemiş ${bekleyenler.length} öğrencinin kitaplarını toplu olarak 'Teslim Edildi' durumuna getirmek istiyor musunuz?`)) {
        return;
    }

    bekleyenler.forEach(o => {
        o.kirtasiyeTeslim = true;
    });

    saveOgrenciDb();
    renderOgrenciKirtasiyeTab();
    showToast(`${bekleyenler.length} öğrencinin kitap seti teslim edildi olarak işaretlendi`);
}

// 6. ÖĞRENCİ EKLEME & DÜZENLEME & SİLME (NET HAM BİLGİLERLE)
function submitOgrenciForm(e) {
    if (e) e.preventDefault();

    const editId = document.getElementById("formOgrenciEditId")?.value;
    const ad = document.getElementById("formOgrenciAd").value.trim();
    const donem = document.getElementById("formOgrenciDonem").value;
    const telefon = document.getElementById("formOgrenciTelefon").value.trim();
    const brut = getCurrencyValue("formOgrenciBrut");
    const indirim = getCurrencyValue("formOgrenciIndirim");
    const taksit = Number(document.getElementById("formOgrenciTaksit").value) || 1;
    const kirtasiye = getCurrencyValue("formOgrenciKirtasiye");
    const sebep = document.getElementById("formOgrenciSebep")?.value?.trim() || "";
    const okul = document.getElementById("formOgrenciOkul")?.value || currentOkul || "okul1";

    if (!ad) {
        showToast("Lütfen öğrenci ad ve soyadını giriniz", "error");
        return;
    }

    if (editId) {
        const ogr = dbOgrenci.ogrenciler.find(o => o.id === Number(editId));
        if (ogr) {
            ogr.ad = ad;
            ogr.donem = donem;
            ogr.telefon = telefon;
            ogr.brut = brut;
            ogr.indirim = indirim;
            ogr.taksit = taksit;
            ogr.kirtasiye = kirtasiye;
            ogr.sebep = sebep;
            ogr.okul = okul;
            showToast("Öğrenci bilgileri güncellendi");
        }
    } else {
        const newId = Date.now();
        dbOgrenci.ogrenciler.push({
            id: newId,
            ad, donem, telefon,
            brut, indirim, taksit, kirtasiye,
            kirtasiyeTeslim: false,
            sebep,
            okul
        });
        showToast(`Yeni öğrenci kaydedildi (${getOkulDisplayName(okul)})`);
    }

    saveOgrenciDb();
    closeModal("modalOgrenciForm");
    renderOgrenciGenelTab();
    renderOgrenciMatrisTab();
    renderOgrenciAylikTab();
    renderOgrenciKirtasiyeTab();
}

function openEditOgrenciModal(id) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === id);
    if (!ogr) return;

    document.getElementById("formOgrenciEditId").value = ogr.id;
    document.getElementById("formOgrenciModalTitle").innerText = "Öğrenci Düzenle: " + ogr.ad;
    document.getElementById("formOgrenciAd").value = ogr.ad;
    document.getElementById("formOgrenciDonem").value = ogr.donem || "Eylül";
    document.getElementById("formOgrenciTelefon").value = ogr.telefon || "";
    setCurrencyValue("formOgrenciBrut", ogr.brut || 0);
    setCurrencyValue("formOgrenciIndirim", ogr.indirim || 0);
    document.getElementById("formOgrenciTaksit").value = ogr.taksit || 1;
    setCurrencyValue("formOgrenciKirtasiye", ogr.kirtasiye || 0);
    if (document.getElementById("formOgrenciSebep")) document.getElementById("formOgrenciSebep").value = ogr.sebep || "";
    if (document.getElementById("formOgrenciOkul")) document.getElementById("formOgrenciOkul").value = ogr.okul || "okul1";

    openModal("modalOgrenciForm");
}

function openNewOgrenciModal() {
    document.getElementById("formOgrenciEditId").value = "";
    document.getElementById("formOgrenciModalTitle").innerText = "Yeni Öğrenci Kaydı";
    document.getElementById("ogrenciForm").reset();
    setCurrencyValue("formOgrenciBrut", 0);
    setCurrencyValue("formOgrenciIndirim", 0);
    const defKirtasiye = (typeof kurumInfo !== 'undefined' && kurumInfo.defaultKirtasiye) ? kurumInfo.defaultKirtasiye : 5000;
    setCurrencyValue("formOgrenciKirtasiye", defKirtasiye);
    if (document.getElementById("formOgrenciOkul")) document.getElementById("formOgrenciOkul").value = currentOkul || "okul1";
    openModal("modalOgrenciForm");
}

function deleteOgrenciPrompt(id) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === id);
    if (!ogr) return;

    if (confirm(`"${ogr.ad}" isimli öğrenciyi silmek istediğinize emin misiniz?`)) {
        dbOgrenci.ogrenciler = dbOgrenci.ogrenciler.filter(o => o.id !== id);
        dbOgrenci.odemeler = dbOgrenci.odemeler.filter(o => o.ogrenciId !== id);
        saveOgrenciDb();
        renderOgrenciGenelTab();
        renderOgrenciMatrisTab();
        renderOgrenciAylikTab();
        renderOgrenciOdemelerTab();
        renderOgrenciKirtasiyeTab();
        if (typeof renderGunlukTahsilatRaporu === 'function') renderGunlukTahsilatRaporu();
        showToast("Öğrenci silindi");
    }
}

// 7. TAHSİLAT ALMA (NAKİT / BANKA / POS SEÇENEKLİ)
let selectedOgrenciPayMethod = 'Nakit';

function handleOgrenciPayMethodChange(method) {
    selectedOgrenciPayMethod = method;
    ['Nakit', 'Banka', 'POS'].forEach(m => {
        const lbl = document.getElementById('lblOgrPay' + m);
        if (lbl) {
            if (m === method) lbl.classList.add('active');
            else lbl.classList.remove('active');
        }
    });
}

function openQuickOgrenciPayModal(ogrenciId, defaultAy) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrenciId);
    if (!ogr) return;

    const targetAy = defaultAy || ogr.donem || "Eylül";
    document.getElementById("payModalOgrenciId").value = ogr.id;
    document.getElementById("payModalOgrenciAd").innerText = ogr.ad;

    const aySelect = document.getElementById("payModalAySelect");
    if (aySelect) {
        aySelect.value = targetAy;
        aySelect.onchange = function () { updateQuickOgrenciPayModalByAy(ogr.id, this.value); };
    }

    updateQuickOgrenciPayModalByAy(ogr.id, targetAy);
    document.getElementById("payModalTarih").value = getLocalTodayYMD();
    
    const makbuzInput = document.getElementById("payModalMakbuzNo");
    if (makbuzInput) {
        makbuzInput.value = "MK-" + Math.floor(1000 + Math.random() * 9000);
    }

    const defaultYontem = (typeof getKurumInfo === 'function' && getKurumInfo().defaultYontem) || 'Nakit';
    handleOgrenciPayMethodChange(defaultYontem);
    const radio = document.querySelector(`input[name="ogrenciPayYontemRadio"][value="${defaultYontem}"]`);
    if (radio) radio.checked = true;

    openModal("modalOgrenciPay");
}

function updateQuickOgrenciPayModalByAy(ogrenciId, selectedAy) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrenciId);
    if (!ogr) return;

    const plan = getStudentPlanDetails(ogr);
    const sched = plan.monthSchedule[selectedAy];
    const hedefTaksit = (sched && sched.isScheduled) ? sched.target : plan.baseMonthly;
    const ayPaid = (dbOgrenci.odemeler || [])
        .filter(p => p.ogrenciId === ogr.id && p.donem === selectedAy)
        .reduce((acc, p) => acc + (Number(p.tutar) || 0), 0);
    const ayRemaining = Math.max(0, hedefTaksit - ayPaid);

    const targetEl = document.getElementById("payModalTargetDisplay");
    if (targetEl) targetEl.innerText = formatCurrency(hedefTaksit);
    const remEl = document.getElementById("payModalRemainingDisplay");
    if (remEl) remEl.innerText = formatCurrency(plan.kalan);

    const suggestAmount = ayRemaining > 0 ? ayRemaining : (hedefTaksit > 0 ? hedefTaksit : 0);
    setCurrencyValue("payModalTutar", suggestAmount);
    const notEl = document.getElementById("payModalNot");
    if (notEl) notEl.value = `${ogr.ad} - ${selectedAy} ödemesi`;
}

function executeOgrenciPaySubmit(withPrint) {
    const ogrenciId = Number(document.getElementById("payModalOgrenciId").value);
    const donem = document.getElementById("payModalAySelect").value;
    const tutar = getCurrencyValue("payModalTutar");
    const rawDate = document.getElementById("payModalTarih").value;
    const makbuzNo = (document.getElementById("payModalMakbuzNo")?.value || "").trim();
    const not = (document.getElementById("payModalNot")?.value || "").trim();

    if (tutar <= 0) {
        showToast("Lütfen geçerli bir ödeme tutarı giriniz", "error");
        return;
    }

    const dParts = rawDate.split("-");
    const formattedDate = dParts.length === 3 ? `${dParts[2]}.${dParts[1]}.${dParts[0]}` : rawDate;

    const checkedRadio = document.querySelector('input[name="ogrenciPayYontemRadio"]:checked');
    const yontem = checkedRadio ? checkedRadio.value : (selectedOgrenciPayMethod || 'Nakit');

    const newId = Date.now();
    const newPayment = {
        id: newId,
        makbuzNo: makbuzNo || ("MK-" + (newId % 100000)),
        tarih: formattedDate,
        ogrenciId,
        donem,
        tutar,
        tur: yontem,
        yontem: yontem,
        not: not || `${donem} dönemi ${yontem} tahsilatı`
    };

    dbOgrenci.odemeler.push(newPayment);
    saveOgrenciDb();
    closeModal("modalOgrenciPay");

    renderOgrenciGenelTab();
    renderOgrenciMatrisTab();
    renderOgrenciAylikTab();
    renderOgrenciOdemelerTab();
    if (typeof renderOgrenciKirtasiyeTab === 'function') renderOgrenciKirtasiyeTab();
    if (typeof renderGunlukTahsilatRaporu === 'function') renderGunlukTahsilatRaporu();

    showToast(`Tahsilat (${yontem}) başarıyla kaydedildi!`);

    if (withPrint) {
        printOgrenciMakbuz(newId);
    }
}

function submitOgrenciPay(e) {
    if (e) e.preventDefault();
    executeOgrenciPaySubmit(false);
}

function deleteOgrenciOdemePrompt(id) {
    if (confirm("Bu tahsilat kaydını silmek istediğinize emin misiniz?")) {
        dbOgrenci.odemeler = (dbOgrenci.odemeler || []).filter(o => o.id !== id);
        if (Array.isArray(dbOgrenci.ogrenciler)) {
            dbOgrenci.ogrenciler.forEach(ogr => {
                if (Array.isArray(ogr.kirtasiyeOdemeler)) {
                    ogr.kirtasiyeOdemeler = ogr.kirtasiyeOdemeler.filter(ko => ko.id !== id);
                    ogr.kirtasiyeOdenen = ogr.kirtasiyeOdemeler.reduce((s, ko) => s + (Number(ko.tutar) || 0), 0);
                }
            });
        }
        saveOgrenciDb();
        renderOgrenciGenelTab();
        renderOgrenciMatrisTab();
        renderOgrenciAylikTab();
        renderOgrenciOdemelerTab();
        if (typeof renderOgrenciKirtasiyeTab === 'function') renderOgrenciKirtasiyeTab();
        if (typeof renderGunlukTahsilatRaporu === 'function') renderGunlukTahsilatRaporu();
        showToast("Tahsilat kaydı silindi");
    }
}

// RESMİ YAZDIRILABİLİR MAKBUZ
function printOgrenciMakbuz(odemeId) {
    const o = dbOgrenci.odemeler.find(item => item.id === odemeId);
    if (!o) return;

    const ogr = dbOgrenci.ogrenciler.find(item => item.id === o.ogrenciId);
    const kurum = getKurumInfo();

    const receiptHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 680px; margin: 0 auto; border: 2px solid #000; padding: 30px; background: #fff; color: #000;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">${kurum.name}</h2>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">${kurum.subTitle}</p>
                    <p style="margin: 3px 0 0 0; font-size: 11px;">Mali İşler & Tahsilat Birimi</p>
                </div>
                <div style="text-align: right;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 800;">TAHSİLAT MAKBUZU</h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>Makbuz No:</strong> ${o.makbuzNo || ('MK-' + o.id)}</p>
                    <p style="margin: 2px 0 0 0; font-size: 12px;"><strong>Tarih:</strong> ${o.tarih}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold; width: 140px;">Öğrenci Adı Soyadı:</td>
                    <td style="padding: 8px 0;">${ogr ? ogr.ad : 'Belirtilmemiş'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold;">Ödeme Dönemi:</td>
                    <td style="padding: 8px 0;">${o.donem || 'Genel Taksit'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold;">Ödeme Yöntemi:</td>
                    <td style="padding: 8px 0; font-weight: 700;">${o.tur || o.yontem || 'Nakit'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold;">Tahsil Edilen Tutar:</td>
                    <td style="padding: 8px 0; font-size: 16px; font-weight: 800;">${formatCurrency(o.tutar)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold;">Yazı ile:</td>
                    <td style="padding: 8px 0; font-style: italic;"># ${numberToTurkishWords(o.tutar)} #</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Açıklama / Not:</td>
                    <td style="padding: 8px 0;">${o.not || 'Öğrenim ücreti tahsilatı.'}</td>
                </tr>
            </table>

            <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
                <div style="width: 200px;">
                    <p style="font-size: 12px; margin-bottom: 50px;"><strong>Teslim Eden</strong></p>
                    <p style="border-top: 1px dotted #000; padding-top: 5px; font-size: 11px;">İmza</p>
                </div>
                <div style="width: 200px;">
                    <p style="font-size: 12px; margin-bottom: 50px;"><strong>Tahsil Eden Yetkili</strong></p>
                    <p style="border-top: 1px dotted #000; padding-top: 5px; font-size: 11px;">İmza / Kaşe</p>
                </div>
            </div>
        </div>
    `;

    const printContainer = document.getElementById("printableReceipt");
    if (printContainer) {
        printContainer.innerHTML = receiptHtml;
        window.print();
    }
}

function promptQuickTaksitChange(id) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === id);
    if (!ogr) return;

    const val = prompt(`"${ogr.ad}" için taksit sayısını giriniz (1-12):`, ogr.taksit || 1);
    if (val !== null) {
        const num = parseInt(val);
        if (num > 0 && num <= 12) {
            ogr.taksit = num;
            saveOgrenciDb();
            renderOgrenciGenelTab();
            renderOgrenciMatrisTab();
            showToast("Taksit sayısı güncellendi");
        }
    }
}

// ÖĞRENCİ DETAY
function openOgrenciDetailModal(id) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === id);
    if (!ogr) return;

    const plan = getStudentPlanDetails(ogr);
    const kirtasiyeDet = getOgrenciKirtasiyeDetails(ogr);
    const kirtasiye = kirtasiyeDet.toplamBedel;
    const net = plan.netSozlesme;
    const kalan = plan.kalan;

    const ogrOdemeleri = dbOgrenci.odemeler.filter(o => o.ogrenciId === ogr.id);
    const taksitSummary = plan.exemptMonths.length > 0
        ? `${plan.activeMonths.length} Aktif (${plan.exemptMonths.length} Muaf)`
        : `${plan.taksitSayisi} Taksit`;

    const currentKurum = (typeof getKurumInfo === 'function') ? getKurumInfo() : (typeof kurumInfo !== 'undefined' ? kurumInfo : {});
    const okulLabel = ogr.okul === 'okul2' ? (currentKurum.okul2Adi || 'Okul 2') : (currentKurum.okul1Adi || 'Okul 1');

    document.getElementById("detailModalTitle").innerText = ogr.ad + " - Bilgi Kartı";
    
    let odemeListHtml = ogrOdemeleri.length === 0 
        ? `<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">Henüz ödeme yapılmamış.</td></tr>`
        : ogrOdemeleri.map(o => `
            <tr>
                <td>${o.tarih}</td>
                <td><span class="badge-pill badge-gold">${o.donem}</span></td>
                <td style="font-weight:700; color:#34d399;">${formatCurrency(o.tutar)}</td>
                <td>
                    <button type="button" class="btn btn-subtle" style="padding: 3px 7px; font-size:10.5px;" onclick="printOgrenciMakbuz(${o.id})" title="İsteğe bağlı makbuz yazdır">
                        <i class="fa-solid fa-print"></i> Makbuz
                    </button>
                </td>
            </tr>
        `).join("");

    document.getElementById("detailModalContent").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Okul / Şube</div>
                <div style="font-size: 14px; font-weight: 800; color: var(--primary);">🏫 ${okulLabel}</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">İletişim / Telefon${ogr.veli ? ' &bull; Veli' : ''}</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${ogr.telefon || '-'}${ogr.veli ? ` <span style="font-size:11.5px; color:var(--text-muted); font-weight:600;">(${ogr.veli})</span>` : ''}</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Kayıt Ayı</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${ogr.donem || 'Eylül'}</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Eğitim Sözleşmesi (Net)</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${formatCurrency(net)} (${taksitSummary})</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Kırtasiye & Kitap Bedeli</div>
                <div style="font-size: 13.5px; font-weight: 800; color: var(--text-main); display: flex; justify-content: space-between;">
                    <span>${formatCurrency(kirtasiye)}</span>
                    <span style="font-size: 11px; font-weight: 700; color:${kirtasiyeDet.kalan > 0 ? '#ef4444' : '#10b981'};">
                        ${kirtasiyeDet.kalan > 0 ? `Kalan: ${formatCurrency(kirtasiyeDet.kalan)}` : 'Ödendi'}
                    </span>
                </div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Kitap Teslimatı & Yöntem</div>
                <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">
                    ${kirtasiyeDet.teslim ? '<span class="badge-pill badge-success">Teslim Edildi</span>' : '<span class="badge-pill badge-warning">Bekliyor</span>'}
                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(${kirtasiyeDet.yontem})</span>
                </div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); grid-column: span 2;">
                <div style="font-size: 11px; color: var(--text-muted);">Toplam Kalan Borç Durumu</div>
                <div style="font-size: 15px; font-weight: 800; color: ${kalan > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(kalan)}</div>
            </div>
        </div>

        <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--text-main);">Tahsilat Geçmişi</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Tarih</th>
                    <th>Dönem</th>
                    <th>Tutar</th>
                    <th>Makbuz</th>
                </tr>
            </thead>
            <tbody>
                ${odemeListHtml}
            </tbody>
        </table>

        <button type="button" class="btn btn-gold" onclick="printOgrenciOdemePlani(${ogr.id})" style="width: 100%; margin-top: 18px; padding: 11px;">
            <i class="fa-solid fa-file-invoice-dollar"></i> Resmi Yıllık Taksit ve Ödeme Planını Yazdır (A4)
        </button>
    `;

    openModal("modalOgrenciDetail");
}

// RESMİ ÖĞRENCİ SÖZLEŞME VE TAKSİT ÖDEME PLANI (A4)
function printOgrenciOdemePlani(ogrId) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;
    const info = typeof getKurumInfo === 'function' ? getKurumInfo() : { name: "Yönetim Sistemi", subTitle: "Mali İşler", bursar: "Yetkili" };
    const plan = getStudentPlanDetails(ogr);

    const brut = Number(ogr.brut) || 0;
    const indirim = Number(ogr.indirim) || 0;
    const netEgitim = plan.netSozlesme;
    const kirtasiye = plan.kirtasiye;
    const genelToplam = plan.toplamUcret;
    const kalanGenel = plan.kalan;

    const ogrOdemeleri = (dbOgrenci.odemeler || []).filter(o => o.ogrenciId === ogr.id);
    const hasSpecificMonthPayments = ogrOdemeleri.some(o => AKADEMIK_AYLAR.includes(o.donem));

    let remainingPaidPool = ogrOdemeleri
        .filter(o => o.donem !== 'Kırtasiye' && !(o.not && o.not.toLowerCase().includes('kırtasiye')))
        .reduce((s, o) => s + (Number(o.tutar) || 0), 0);

    let taksitRowsHtml = "";
    let rowNo = 0;

    AKADEMIK_AYLAR.forEach(ayAdi => {
        const sched = plan.monthSchedule[ayAdi];
        if (!sched || !sched.isScheduled) return;
        rowNo++;

        const isExempt = sched.isExempt;
        const isCustom = (plan.ozelTaksitler[ayAdi] !== undefined);
        const buTaksitTutar = isExempt ? 0 : sched.target;

        let durumStr = "";
        let aciklamaStr = "Vadesinde Ödenecektir";

        if (isExempt) {
            durumStr = `<span style="color: #64748b; font-weight: 700;">MUAF (0 ₺)</span>`;
            aciklamaStr = "Taksitten Silindi / Muaf";
        } else {
            let ayPaid = 0;
            if (hasSpecificMonthPayments) {
                ayPaid = ogrOdemeleri.filter(o => o.donem === ayAdi).reduce((s, o) => s + (Number(o.tutar) || 0), 0);
            } else if (remainingPaidPool > 0) {
                ayPaid = Math.min(buTaksitTutar, remainingPaidPool);
                remainingPaidPool -= ayPaid;
            }

            if (ayPaid >= buTaksitTutar && buTaksitTutar > 0) {
                durumStr = `<span style="color: #059669; font-weight: 700;">ÖDENDİ</span>`;
                aciklamaStr = isCustom ? "Tahsil Edildi (Özel Tutar)" : "Tahsil Edildi";
            } else if (ayPaid > 0) {
                durumStr = `<span style="color: #d97706; font-weight: 700;">KISMİ (${formatCurrency(ayPaid)})</span>`;
                aciklamaStr = `Kalan: ${formatCurrency(Math.max(0, buTaksitTutar - ayPaid))}`;
            } else {
                durumStr = `<span style="color: #dc2626; font-weight: 700;">BEKLİYOR</span>`;
                if (isCustom) aciklamaStr = "Özel Taksit Tutarı";
            }
        }

        taksitRowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 7px 10px; text-align: center; font-weight: 700;">${rowNo}</td>
                <td style="padding: 7px 10px; font-weight: 700;">${ayAdi}</td>
                <td style="padding: 7px 10px; text-align: right; font-weight: 700;">${formatCurrency(buTaksitTutar)}</td>
                <td style="padding: 7px 10px; text-align: center;">${durumStr}</td>
                <td style="padding: 7px 10px; color: #64748b; font-size: 10px;">${aciklamaStr}</td>
            </tr>
        `;
    });

    const planHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 820px; margin: 0 auto; color: #0f172a; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    ${info.logo ? `<img src="${info.logo}" alt="Logo" style="max-height: 52px; max-width: 140px; object-fit: contain;">` : ''}
                    <div>
                        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${info.name}</h1>
                        <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">${info.subTitle}</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 15px; font-weight: 800; color: #2563eb;">ÖĞRENCİ TAKSİT VE ÖDEME PLANI</div>
                    <div style="font-size: 11px; color: #475569;">Düzenleme Tarihi: ${new Date().toLocaleDateString('tr-TR')}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 12px;">
                <div>
                    <div style="font-size: 11px; color: #64748b;">Öğrenci Adı Soyadı:</div>
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${ogr.ad}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 6px;">İletişim / Veli Telefonu:</div>
                    <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${ogr.telefon || '-'}</div>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #64748b;">Brüt Eğitim Ücreti:</span>
                        <strong style="color: #0f172a;">${formatCurrency(brut)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #64748b;">Burs / İndirim:</span>
                        <strong style="color: #059669;">- ${formatCurrency(indirim)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #64748b;">Kırtasiye Bedeli:</span>
                        <strong style="color: #0f172a;">${formatCurrency(kirtasiye)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px;">
                        <span style="font-weight: 700; color: #0f172a;">Toplam Sözleşme:</span>
                        <strong style="font-size: 14px; color: #2563eb;">${formatCurrency(genelToplam)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                        <span style="font-weight: 700; color: #64748b;">Kalan Toplam Borç:</span>
                        <strong style="font-size: 13px; color: ${kalanGenel > 0 ? '#dc2626' : '#059669'};">${formatCurrency(kalanGenel)}</strong>
                    </div>
                </div>
            </div>

            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 8px;">Dönemsel Taksit Tablosu</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                    <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                        <th style="padding: 8px 10px; text-align: center; width: 40px;">No</th>
                        <th style="padding: 8px 10px; text-align: left; width: 120px;">Taksit Dönemi</th>
                        <th style="padding: 8px 10px; text-align: right; width: 130px;">Taksit Tutarı</th>
                        <th style="padding: 8px 10px; text-align: center; width: 120px;">Durum</th>
                        <th style="padding: 8px 10px; text-align: left;">Açıklama / Kayıt</th>
                    </tr>
                </thead>
                <tbody>
                    ${taksitRowsHtml}
                </tbody>
                <tfoot>
                    <tr style="background: #f8fafc; border-top: 2px solid #0f172a; font-weight: 800; font-size: 12px;">
                        <td colspan="2" style="padding: 10px; text-align: right;">TOPLAM EĞİTİM TAKSİTİ:</td>
                        <td style="padding: 10px; text-align: right; color: #2563eb;">${formatCurrency(netEgitim)}</td>
                        <td colspan="2" style="padding: 10px; text-align: right; color: ${kalanGenel > 0 ? '#dc2626' : '#059669'};">Kalan Bakiye: ${formatCurrency(kalanGenel)}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #475569; margin-bottom: 40px;">
                <strong>Taahhütname:</strong> İşbu ödeme planı okul kayıt sözleşmesinin ayrılmaz bir parçası olup, veli belirtilen vadelerde taksitlerini zamanında ödemeyi taahhüt eder.
            </div>

            <div style="display: flex; justify-content: space-between; padding: 0 30px;">
                <div style="text-align: center; width: 220px;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${info.name}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Yetkili İsim / Kaşe / İmza</div>
                    <div style="margin-top: 50px; border-top: 1px dotted #94a3b8;"></div>
                </div>
                <div style="text-align: center; width: 220px;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Öğrenci Velisi</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Ad Soyad / İmza</div>
                    <div style="margin-top: 50px; border-top: 1px dotted #94a3b8;"></div>
                </div>
            </div>
        </div>
    `;

    const printContainer = document.getElementById("printableReceipt");
    if (printContainer) {
        printContainer.innerHTML = planHtml;
        window.print();
    }
}

// ============================================================================
// GÜNLÜK TAHSİLAT VE KASA RAPORU MOTORU
// ============================================================================

function setGunlukRaporBugun() {
    const tarihInput = document.getElementById("gunlukRaporTarih");
    if (tarihInput) {
        tarihInput.value = getLocalTodayYMD();
    }
    renderGunlukTahsilatRaporu();
}

function normalizeDateToYMD(dStr) {
    if (!dStr) return "";
    dStr = dStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dStr)) {
        const p = dStr.split('.');
        const dd = p[0].padStart(2, '0');
        const mm = p[1].padStart(2, '0');
        return `${p[2]}-${mm}-${dd}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dStr)) {
        const p = dStr.split('/');
        const dd = p[0].padStart(2, '0');
        const mm = p[1].padStart(2, '0');
        return `${p[2]}-${mm}-${dd}`;
    }
    return dStr;
}

function formatDateTurkish(ymdStr) {
    if (!ymdStr) return "";
    const p = ymdStr.split('-');
    if (p.length === 3) {
        return `${p[2]}.${p[1]}.${p[0]}`;
    }
    return ymdStr;
}

function getAllTahsilatTransactions() {
    const list = [];
    if (!dbOgrenci || !Array.isArray(dbOgrenci.ogrenciler)) return list;

    if (Array.isArray(dbOgrenci.odemeler)) {
        dbOgrenci.odemeler.forEach(o => {
            const ogr = dbOgrenci.ogrenciler.find(s => s.id === o.ogrenciId);
            const ymd = normalizeDateToYMD(o.tarih);
            const tutar = Number(o.tutar) || 0;
            if (tutar > 0) {
                list.push({
                    id: o.id || Date.now(),
                    tarih: ymd,
                    rawTarih: o.tarih,
                    ogrenciId: o.ogrenciId,
                    ogrenciAd: ogr ? ogr.ad : 'Bilinmeyen Öğrenci',
                    okul: ogr ? (ogr.okul || 'okul1') : 'okul1',
                    kategori: (o.donem === 'Kırtasiye' || (o.not && o.not.toLowerCase().includes('kırtasiye'))) ? 'KIRTASIYE' : 'TAKSIT',
                    donem: o.donem || 'Taksit',
                    tutar: tutar,
                    tur: o.tur || 'Nakit',
                    makbuzNo: o.makbuzNo || '-',
                    not: o.not || ''
                });
            }
        });
    }

    dbOgrenci.ogrenciler.forEach(ogr => {
        if (Array.isArray(ogr.kirtasiyeOdemeler)) {
            ogr.kirtasiyeOdemeler.forEach(ko => {
                const alreadyExists = list.some(x => x.id === ko.id || (x.ogrenciId === ogr.id && ko.makbuzNo && ko.makbuzNo !== '-' && x.makbuzNo === ko.makbuzNo && x.kategori === 'KIRTASIYE'));
                if (!alreadyExists) {
                    const ymd = normalizeDateToYMD(ko.tarih);
                    const tutar = Number(ko.tutar) || 0;
                    if (tutar > 0) {
                        list.push({
                            id: ko.id || Date.now(),
                            tarih: ymd,
                            rawTarih: ko.tarih,
                            ogrenciId: ogr.id,
                            ogrenciAd: ogr.ad,
                            okul: ogr.okul || 'okul1',
                            kategori: 'KIRTASIYE',
                            donem: 'Kırtasiye',
                            tutar: tutar,
                            tur: ko.yontem || 'Nakit',
                            makbuzNo: ko.makbuzNo || '-',
                            not: ko.not || 'Kırtasiye Bedeli'
                        });
                    }
                }
            });
        }
    });

    return list;
}

function matchesYontemFilter(tur, yontemFiltre) {
    if (!yontemFiltre || yontemFiltre === "ALL") return true;
    const turNorm = (tur || '').toLowerCase();
    if (yontemFiltre === 'Nakit') return turNorm.includes('nakit');
    if (yontemFiltre === 'Banka') return turNorm.includes('banka') || turNorm.includes('havale') || turNorm.includes('eft');
    if (yontemFiltre === 'POS') return turNorm.includes('pos') || turNorm.includes('kart');
    return true;
}

function getFilteredTahsilatReportData(opts = {}) {
    const selectedDate = opts.tarih || getLocalTodayYMD();
    const okulFiltre = opts.okul || "ALL";
    const yontemFiltre = opts.yontem || "ALL";
    const kategoriFiltre = opts.kategori || "ALL";
    const searchTerm = (opts.search || "").toLowerCase().trim();

    const rows = getAllTahsilatTransactions().filter(item => {
        if (item.tarih !== selectedDate) return false;
        if (okulFiltre !== "ALL" && item.okul !== okulFiltre) return false;
        if (!matchesYontemFilter(item.tur, yontemFiltre)) return false;
        if (kategoriFiltre !== "ALL" && item.kategori !== kategoriFiltre) return false;
        if (searchTerm) {
            const hay = `${item.ogrenciAd} ${item.makbuzNo} ${item.donem} ${item.not}`.toLowerCase();
            if (!hay.includes(searchTerm)) return false;
        }
        return true;
    });

    let toplam = 0, nakit = 0, banka = 0, pos = 0;
    rows.forEach(item => {
        toplam += item.tutar;
        const turNorm = (item.tur || '').toLowerCase();
        if (turNorm.includes('nakit')) nakit += item.tutar;
        else if (turNorm.includes('pos') || turNorm.includes('kart')) pos += item.tutar;
        else banka += item.tutar;
    });

    return { rows, toplam, nakit, banka, pos };
}

function getGunlukRaporOptions() {
    const tarihInput = document.getElementById("gunlukRaporTarih");
    if (tarihInput && !tarihInput.value) {
        tarihInput.value = getLocalTodayYMD();
    }
    return {
        tarih: tarihInput ? tarihInput.value : getLocalTodayYMD(),
        okul: document.getElementById("gunlukRaporOkulFiltre")?.value || "ALL",
        yontem: document.getElementById("gunlukRaporYontemFiltre")?.value || "ALL",
        kategori: document.getElementById("gunlukRaporKategoriFiltre")?.value || "ALL"
    };
}

function renderGunlukTahsilatRaporu() {
    const opts = getGunlukRaporOptions();
    const selectedDate = opts.tarih;

    const lblTarih = document.getElementById("lblGunlukRaporTarihMetin");
    if (lblTarih) {
        lblTarih.innerText = `Rapor Tarihi: ${formatDateTurkish(selectedDate)}`;
    }

    const report = getFilteredTahsilatReportData(opts);
    const filtered = report.rows;
    const toplamTahsilat = report.toplam;
    const nakitToplam = report.nakit;
    const bankaToplam = report.banka;
    const posToplam = report.pos;

    const elKpiToplam = document.getElementById("kpiGunlukToplamTahsilat");
    const elKpiIslem = document.getElementById("kpiGunlukIslemSayisi");
    const elKpiNakit = document.getElementById("kpiGunlukNakit");
    const elKpiNakitOran = document.getElementById("kpiGunlukNakitOran");
    const elKpiBanka = document.getElementById("kpiGunlukBanka");
    const elKpiBankaOran = document.getElementById("kpiGunlukBankaOran");
    const elKpiPos = document.getElementById("kpiGunlukPos");
    const elKpiPosOran = document.getElementById("kpiGunlukPosOran");
    const elDipToplam = document.getElementById("lblGunlukRaporDipToplam");

    if (elKpiToplam) elKpiToplam.innerText = formatCurrency(toplamTahsilat);
    if (elKpiIslem) elKpiIslem.innerText = `${filtered.length} İşlem Kayıtlı`;

    const nakitOran = toplamTahsilat > 0 ? Math.round((nakitToplam / toplamTahsilat) * 100) : 0;
    const bankaOran = toplamTahsilat > 0 ? Math.round((bankaToplam / toplamTahsilat) * 100) : 0;
    const posOran = toplamTahsilat > 0 ? Math.round((posToplam / toplamTahsilat) * 100) : 0;

    if (elKpiNakit) elKpiNakit.innerText = formatCurrency(nakitToplam);
    if (elKpiNakitOran) elKpiNakitOran.innerText = `%${nakitOran} Nakit`;
    if (elKpiBanka) elKpiBanka.innerText = formatCurrency(bankaToplam);
    if (elKpiBankaOran) elKpiBankaOran.innerText = `%${bankaOran} Banka`;
    if (elKpiPos) elKpiPos.innerText = formatCurrency(posToplam);
    if (elKpiPosOran) elKpiPosOran.innerText = `%${posOran} POS`;
    if (elDipToplam) elDipToplam.innerText = formatCurrency(toplamTahsilat);

    const tbody = document.getElementById("gunlukTahsilatTableBody");
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
                    <i class="fa-solid fa-calendar-xmark" style="font-size: 26px; color: var(--text-dim); margin-bottom: 8px;"></i>
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Seçilen Tarihte Tahsilat Bulunamadı</div>
                    <div style="font-size: 11.5px; margin-top: 3px;">${formatDateTurkish(selectedDate)} tarihinde filtreye uygun herhangi bir ödeme hareketi bulunmuyor.</div>
                </td>
            </tr>
        `;
        return;
    }

    window._lastGunlukTxList = filtered;

    let rowsHtml = "";
    filtered.forEach((tx, idx) => {
        const turNorm = (tx.tur || '').toLowerCase();
        let badgeHtml = "";
        if (turNorm.includes('nakit')) {
            badgeHtml = '<span class="badge-pill badge-success" style="font-size: 11px;"><i class="fa-solid fa-money-bill-wave"></i> Nakit</span>';
        } else if (turNorm.includes('pos') || turNorm.includes('kart')) {
            badgeHtml = '<span class="badge-pill badge-warning" style="font-size: 11px;"><i class="fa-solid fa-credit-card"></i> POS / Kart</span>';
        } else {
            badgeHtml = '<span class="badge-pill badge-primary" style="font-size: 11px;"><i class="fa-solid fa-building-columns"></i> Banka Havale</span>';
        }

        const okulAdi = getOkulDisplayName(tx.okul);
        const okulBadge = tx.okul === 'okul2' 
            ? `<span class="badge-pill badge-primary" style="font-size: 10.5px;">🎓 ${okulAdi}</span>` 
            : `<span class="badge-pill badge-gold" style="font-size: 10.5px;">🏫 ${okulAdi}</span>`;

        const kategoriBadge = tx.kategori === 'KIRTASIYE'
            ? '<span style="font-weight: 700; color: var(--accent-gold);"><i class="fa-solid fa-book-bookmark"></i> Kırtasiye</span>'
            : `<span style="font-weight: 700; color: var(--text-main);"><i class="fa-solid fa-calendar-check"></i> ${tx.donem} Taksiti</span>`;

        rowsHtml += `
            <tr>
                <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
                <td style="font-weight: 700; font-family: monospace; font-size: 12px; color: var(--primary);">${tx.makbuzNo}</td>
                <td style="font-weight: 700; color: var(--text-main);">${tx.ogrenciAd}</td>
                <td style="text-align: center;">${okulBadge}</td>
                <td>${kategoriBadge}</td>
                <td style="text-align: center;">${badgeHtml}</td>
                <td style="text-align: right; font-weight: 800; color: #10b981; font-size: 13px;">${formatCurrency(tx.tutar)}</td>
                <td style="font-size: 11.5px; color: var(--text-muted); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${tx.not || '-'}</td>
                <td style="text-align: center;">
                    <button type="button" class="btn btn-subtle" onclick="printSingleTahsilatMakbuzuByIndex(${idx})" title="Makbuz Çıktısı Al" style="padding: 4px 8px; font-size: 11px;">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

function printSingleTahsilatMakbuzuByIndex(idx) {
    if (window._lastGunlukTxList && window._lastGunlukTxList[idx]) {
        printSingleTahsilatMakbuzu(window._lastGunlukTxList[idx]);
    }
}

function printSingleTahsilatMakbuzu(tx) {
    if (!tx) return;
    const info = getKurumInfo();
    const makbuzHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px 30px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1.5px solid #0f172a; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
                <div>
                    <h2 style="margin: 0; font-size: 17px; font-weight: 800; color: #0f172a;">${info.name}</h2>
                    <div style="font-size: 11px; color: #475569; margin-top: 2px;">RESMİ TAHSİLAT MAKBUZU / VEZNE ALINDISI</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: 700; color: #2563eb;">Makbuz: ${tx.makbuzNo}</div>
                    <div style="font-size: 11px; color: #64748b;">${formatDateTurkish(tx.tarih)}</div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 140px;">Öğrenci Adı Soyadı:</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13.5px;">${tx.ogrenciAd}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Kampüs / Birim:</td>
                    <td style="padding: 6px 0; font-weight: 600;">${getOkulDisplayName(tx.okul)}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Tahsilat Kalemi:</td>
                    <td style="padding: 6px 0; font-weight: 600;">${tx.kategori === 'KIRTASIYE' ? 'Kırtasiye & Kitap Bedeli' : tx.donem + ' Taksiti'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Ödeme Yöntemi:</td>
                    <td style="padding: 6px 0; font-weight: 700;">${tx.tur}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #64748b;">Açıklama:</td>
                    <td style="padding: 6px 0; font-style: italic;">${tx.not || 'Tahsil edildi'}</td>
                </tr>
                <tr style="border-top: 1.5px solid #cbd5e1;">
                    <td style="padding: 10px 0; font-size: 14px; font-weight: 800; color: #0f172a;">Tahsil Edilen Tutar:</td>
                    <td style="padding: 10px 0; font-size: 18px; font-weight: 800; color: #059669;">${formatCurrency(tx.tutar)}</td>
                </tr>
            </table>

            <div style="display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px;">
                <div style="text-align: center; width: 180px;">
                    <div style="font-size: 11px; font-weight: 700; color: #0f172a;">${info.name}</div>
                    <div style="font-size: 10px; color: #64748b;">Yetkili / Vezne Kaşe & İmza</div>
                    <div style="margin-top: 40px; border-top: 1px dotted #94a3b8;"></div>
                </div>
                <div style="text-align: center; width: 180px;">
                    <div style="font-size: 11px; font-weight: 700; color: #0f172a;">Ödemeyi Yapan (Veli / Öğrenci)</div>
                    <div style="font-size: 10px; color: #64748b;">İmza</div>
                    <div style="margin-top: 40px; border-top: 1px dotted #94a3b8;"></div>
                </div>
            </div>
        </div>
    `;

    const printContainer = document.getElementById("printableReceipt");
    if (printContainer) {
        printContainer.innerHTML = makbuzHtml;
        window.print();
    }
}

function buildGunlukTahsilatPrintHtml(reportData, selectedDate) {
    const { rows: filtered, toplam, nakit, banka, pos } = reportData;
    const info = getKurumInfo();

    let tableRows = "";
    filtered.forEach((tx, idx) => {
        tableRows += `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
                <td style="padding: 6px 8px; font-weight: 700;">${tx.makbuzNo}</td>
                <td style="padding: 6px 8px; font-weight: 600;">${tx.ogrenciAd}</td>
                <td style="padding: 6px 8px; text-align: center;">${getOkulDisplayName(tx.okul)}</td>
                <td style="padding: 6px 8px;">${tx.kategori === 'KIRTASIYE' ? 'Kırtasiye' : tx.donem}</td>
                <td style="padding: 6px 8px; text-align: center;">${tx.tur}</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 700;">${formatCurrency(tx.tutar)}</td>
                <td style="padding: 6px 8px; font-size: 10px; color: #64748b;">${tx.not || '-'}</td>
            </tr>
        `;
    });

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #0f172a; max-width: 900px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
                <div>
                    <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">${info.name}</h1>
                    <div style="font-size: 12px; color: #475569; margin-top: 3px; font-weight: 600;">GÜNLÜK KASA VE TAHSİLAT RAPORU</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Rapor Tarihi: ${formatDateTurkish(selectedDate)}</div>
                    <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Yazdırma: ${new Date().toLocaleTimeString('tr-TR')}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; text-align: center;">
                    <div style="font-size: 10.5px; color: #64748b; font-weight: 700;">GÜNLÜK TOPLAM</div>
                    <div style="font-size: 15px; font-weight: 800; color: #2563eb; margin-top: 4px;">${formatCurrency(toplam)}</div>
                    <div style="font-size: 10px; color: #64748b;">${filtered.length} İşlem</div>
                </div>
                <div style="border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; background: #f0fdf4; text-align: center;">
                    <div style="font-size: 10.5px; color: #15803d; font-weight: 700;">NAKİT KASA</div>
                    <div style="font-size: 15px; font-weight: 800; color: #16a34a; margin-top: 4px;">${formatCurrency(nakit)}</div>
                </div>
                <div style="border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px; background: #eff6ff; text-align: center;">
                    <div style="font-size: 10.5px; color: #1d4ed8; font-weight: 700;">BANKA / HAVALE</div>
                    <div style="font-size: 15px; font-weight: 800; color: #2563eb; margin-top: 4px;">${formatCurrency(banka)}</div>
                </div>
                <div style="border: 1px solid #fde68a; border-radius: 6px; padding: 10px; background: #fffbeb; text-align: center;">
                    <div style="font-size: 10.5px; color: #b45309; font-weight: 700;">POS / KART</div>
                    <div style="font-size: 15px; font-weight: 800; color: #d97706; margin-top: 4px;">${formatCurrency(pos)}</div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px;">
                        <th style="padding: 8px; text-align: center; width: 35px;">#</th>
                        <th style="padding: 8px; text-align: left; width: 90px;">Makbuz</th>
                        <th style="padding: 8px; text-align: left;">Öğrenci Adı Soyadı</th>
                        <th style="padding: 8px; text-align: center; width: 75px;">Kampüs</th>
                        <th style="padding: 8px; text-align: left; width: 110px;">Kalem</th>
                        <th style="padding: 8px; text-align: center; width: 100px;">Yöntem</th>
                        <th style="padding: 8px; text-align: right; width: 110px;">Tutar</th>
                        <th style="padding: 8px; text-align: left;">Not</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows || '<tr><td colspan="8" style="text-align: center; padding: 20px;">Kayıt bulunamadı.</td></tr>'}
                </tbody>
                <tfoot>
                    <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a; font-size: 12px;">
                        <td colspan="6" style="padding: 10px; text-align: right;">GÜNLÜK TOPLAM TAHSİLAT:</td>
                        <td style="padding: 10px; text-align: right; color: #16a34a;">${formatCurrency(toplam)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            <div style="display: flex; justify-content: space-between; padding: 0 40px; margin-top: 40px;">
                <div style="text-align: center; width: 200px;">
                    <div style="font-size: 11px; font-weight: 700; color: #0f172a;">Veznedar / Tahsil Eden</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">İsim / İmza</div>
                    <div style="margin-top: 45px; border-top: 1px dotted #94a3b8;"></div>
                </div>
                <div style="text-align: center; width: 200px;">
                    <div style="font-size: 11px; font-weight: 700; color: #0f172a;">Kasa &amp; Muhasebe Sorumlusu</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Kaşe / Onay</div>
                    <div style="margin-top: 45px; border-top: 1px dotted #94a3b8;"></div>
                </div>
            </div>
        </div>
    `;
}

function exportTahsilatReportToExcel(reportData, selectedDate) {
    const filtered = reportData.rows || [];
    if (filtered.length === 0) {
        showToast("Dışa aktarılacak tahsilat kaydı bulunmuyor!", "error");
        return;
    }

    if (typeof XLSX === 'undefined') {
        if (typeof exportToExcelFile === 'function') {
            const headers = ["Sıra", "Makbuz No", "Öğrenci Adı Soyadı", "Kampüs", "Tahsilat Kalemi", "Ödeme Yöntemi", "Tutar (TL)", "Açıklama / Not"];
            const rows = filtered.map((tx, idx) => [
                idx + 1,
                tx.makbuzNo,
                tx.ogrenciAd,
                getOkulDisplayName(tx.okul),
                tx.kategori === 'KIRTASIYE' ? 'Kırtasiye Bedeli' : tx.donem + ' Taksiti',
                tx.tur,
                tx.tutar,
                tx.not || ''
            ]);
            exportToExcelFile(`Gunluk_Tahsilat_Raporu_${selectedDate}`, headers, rows);
        } else {
            showToast("Excel kütüphanesi henüz yüklenmedi!", "error");
        }
        return;
    }

    const data = [
        ["GÜNLÜK KASA VE TAHSİLAT RAPORU"],
        ["Tarih:", formatDateTurkish(selectedDate)],
        ["Oluşturulma:", new Date().toLocaleTimeString('tr-TR')],
        [],
        ["Sıra", "Makbuz No", "Öğrenci Adı Soyadı", "Kampüs", "Tahsilat Kalemi", "Ödeme Yöntemi", "Tutar (TL)", "Açıklama / Not"]
    ];

    let toplam = 0;
    filtered.forEach((tx, idx) => {
        toplam += tx.tutar;
        data.push([
            idx + 1,
            tx.makbuzNo,
            tx.ogrenciAd,
            getOkulDisplayName(tx.okul),
            tx.kategori === 'KIRTASIYE' ? 'Kırtasiye Bedeli' : tx.donem + ' Taksiti',
            tx.tur,
            tx.tutar,
            tx.not || ''
        ]);
    });

    data.push([]);
    data.push(["", "", "", "", "", "TOPLAM:", toplam, ""]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gunluk_Tahsilat");
    XLSX.writeFile(wb, `Gunluk_Tahsilat_Raporu_${selectedDate}.xlsx`);
    showToast("Günlük tahsilat raporu Excel olarak indirildi!");
}

function printGunlukTahsilatRaporu() {
    const opts = getGunlukRaporOptions();
    const reportData = getFilteredTahsilatReportData(opts);
    const printContainer = document.getElementById("printableReceipt");
    if (printContainer) {
        printContainer.innerHTML = buildGunlukTahsilatPrintHtml(reportData, opts.tarih);
        window.print();
    }
}

function exportGunlukRaporExcel() {
    const opts = getGunlukRaporOptions();
    const reportData = getFilteredTahsilatReportData(opts);
    exportTahsilatReportToExcel(reportData, opts.tarih);
}
