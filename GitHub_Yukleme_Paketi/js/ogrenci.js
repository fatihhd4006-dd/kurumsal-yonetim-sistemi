// ============================================================================
// ÖĞRENCİ YÖNETİMİ MODÜLÜ (NET, HAM VE HAP BİLGİLER - SINIFSIZ & SADE)
// ============================================================================

const AKADEMIK_AYLAR = ["Eylül", "Ekim", "Kasım", "Aralık", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos"];

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
        else renderOgrenciGenelTab();
    } else {
        renderOgrenciGenelTab();
    }

    if (typeof updateGlobalBadges === 'function') updateGlobalBadges();
    showToast(`Aktif Okul: ${okul === 'okul1' ? 'Okul 1' : 'Okul 2'}`);
}

function updateOkulStatsDisplay() {
    const list = getOkulOgrenciler();
    const count = list.length;
    const label = currentOkul === 'okul1' ? 'Okul 1' : 'Okul 2';
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
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 30px; color: var(--text-muted);">Kayıt bulunamadı.</td></tr>`;
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
        tbody.innerHTML = `<tr><td colspan="17" style="text-align:center; padding: 30px; color: var(--text-muted);">${currentOkul === 'okul2' ? 'Okul 2' : 'Okul 1'} için henüz kayıtlı öğrenci bulunmuyor.</td></tr>`;
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

// 4. VEZNE & TAHSİLAT LİSTESİ
function renderOgrenciOdemelerTab() {
    const tbody = document.getElementById("ogrenciOdemelerTableBody");
    if (!tbody) return;

    const okulOdemeler = getOkulOdemeler();

    if (okulOdemeler.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">${currentOkul === 'okul2' ? 'Okul 2' : 'Okul 1'} için henüz kaydedilmiş bir tahsilat bulunmuyor.</td></tr>`;
        return;
    }

    const sorted = [...okulOdemeler].reverse();
    tbody.innerHTML = sorted.map((o, idx) => {
        const ogr = dbOgrenci.ogrenciler.find(s => s.id === o.ogrenciId);
        const ogrAd = ogr ? ogr.ad : `Öğrenci #${o.ogrenciId}`;

        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 11px;">${o.makbuzNo || ('MK-' + (1000 + o.id))}</td>
                <td style="font-size: 11px; color: var(--text-muted);">${o.tarih || '-'}</td>
                <td><strong>${ogrAd}</strong></td>
                <td><span class="badge-pill badge-gold">${o.donem || 'Genel'}</span></td>
                <td style="font-weight: 800; color: #34d399; font-size: 13px;">${formatCurrency(o.tutar)}</td>
                <td style="color: var(--text-muted); font-size: 11px;">${o.not || '-'}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="printOgrenciMakbuz(${o.id})" title="Makbuz Yazdır">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="deleteOgrenciOdemePrompt(${o.id})" title="Sil">
                            <i class="fa-solid fa-trash-can" style="color: #f87171;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 5. KIRTASİYE TAKİBİ
function renderOgrenciKirtasiyeTab() {
    const tbody = document.getElementById("kirtasiyeTableBody");
    if (!tbody) return;

    const okulList = getOkulOgrenciler();

    if (okulList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--text-muted);">${currentOkul === 'okul2' ? 'Okul 2' : 'Okul 1'} için kayıtlı öğrenci bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = okulList.map(ogr => {
        const ucret = Number(ogr.kirtasiye) || 0;
        const teslim = ogr.kirtasiyeTeslim === true;

        return `
            <tr>
                <td><strong>${ogr.ad}</strong></td>
                <td><strong>${formatCurrency(ucret)}</strong></td>
                <td>
                    <button class="btn ${teslim ? 'btn-success' : 'btn-subtle'}" style="padding: 4px 10px; font-size: 11px;" onclick="toggleKirtasiyeTeslim(${ogr.id})">
                        ${teslim ? '✔ Teslim Edildi' : '⏳ Bekliyor'}
                    </button>
                </td>
                <td>
                    <button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="openEditOgrenciModal(${ogr.id})">
                        Ücreti Güncelle
                    </button>
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
    showToast("Kırtasiye teslim durumu güncellendi");
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
        showToast(`Yeni öğrenci kaydedildi (${okul === 'okul2' ? 'Okul 2' : 'Okul 1'})`);
    }

    saveOgrenciDb();
    closeModal("modalOgrenciForm");
    renderOgrenciGenelTab();
    renderOgrenciMatrisTab();
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
    setCurrencyValue("formOgrenciKirtasiye", 0);
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
        showToast("Öğrenci silindi");
    }
}

// 7. TAHSİLAT ALMA
function openQuickOgrenciPayModal(ogrenciId, defaultAy) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrenciId);
    if (!ogr) return;

    document.getElementById("payModalOgrenciId").value = ogr.id;
    document.getElementById("payModalOgrenciAd").innerText = ogr.ad;
    document.getElementById("payModalAySelect").value = defaultAy || ogr.donem || "Eylül";
    
    const net = Math.max(0, (Number(ogr.brut) || 0) - (Number(ogr.indirim) || 0));
    const aylikTaksit = Math.round(net / (ogr.taksit || 1));
    setCurrencyValue("payModalTutar", aylikTaksit);
    document.getElementById("payModalTarih").value = new Date().toISOString().slice(0, 10);
    document.getElementById("payModalNot").value = `${ogr.ad} - ${defaultAy || ogr.donem || 'Taksit'} ödemesi`;

    openModal("modalOgrenciPay");
}

function submitOgrenciPay(e) {
    if (e) e.preventDefault();

    const ogrenciId = Number(document.getElementById("payModalOgrenciId").value);
    const donem = document.getElementById("payModalAySelect").value;
    const tutar = getCurrencyValue("payModalTutar");
    const rawDate = document.getElementById("payModalTarih").value;
    const not = document.getElementById("payModalNot").value.trim();

    if (tutar <= 0) {
        showToast("Lütfen geçerli bir ödeme tutarı giriniz", "error");
        return;
    }

    const dParts = rawDate.split("-");
    const formattedDate = dParts.length === 3 ? `${dParts[2]}.${dParts[1]}.${dParts[0]}` : rawDate;

    const newId = Date.now();
    const newPayment = {
        id: newId,
        makbuzNo: "MK-" + (newId % 100000),
        tarih: formattedDate,
        ogrenciId,
        donem,
        tutar,
        tur: "Nakit / Banka",
        not
    };

    dbOgrenci.odemeler.push(newPayment);
    saveOgrenciDb();
    closeModal("modalOgrenciPay");

    renderOgrenciGenelTab();
    renderOgrenciMatrisTab();
    renderOgrenciAylikTab();
    renderOgrenciOdemelerTab();

    showToast("Tahsilat kaydedildi!");
    
    if (confirm("Tahsilat makbuzunu yazdırmak ister misiniz?")) {
        printOgrenciMakbuz(newId);
    }
}

function deleteOgrenciOdemePrompt(id) {
    if (confirm("Bu tahsilat kaydını silmek istediğinize emin misiniz?")) {
        dbOgrenci.odemeler = dbOgrenci.odemeler.filter(o => o.id !== id);
        saveOgrenciDb();
        renderOgrenciGenelTab();
        renderOgrenciMatrisTab();
        renderOgrenciAylikTab();
        renderOgrenciOdemelerTab();
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

    const net = Math.max(0, (Number(ogr.brut) || 0) - (Number(ogr.indirim) || 0));
    const kirtasiye = Number(ogr.kirtasiye) || 0;
    const toplamGenel = net + kirtasiye;

    const ogrOdemeleri = dbOgrenci.odemeler.filter(o => o.ogrenciId === ogr.id);
    const toplamOdenen = ogrOdemeleri.reduce((s, o) => s + (Number(o.tutar) || 0), 0);
    const kalan = Math.max(0, toplamGenel - toplamOdenen);

    document.getElementById("detailModalTitle").innerText = ogr.ad + " - Bilgi Kartı";
    
    let odemeListHtml = ogrOdemeleri.length === 0 
        ? `<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">Henüz ödeme yapılmamış.</td></tr>`
        : ogrOdemeleri.map(o => `
            <tr>
                <td>${o.tarih}</td>
                <td><span class="badge-pill badge-gold">${o.donem}</span></td>
                <td style="font-weight:700; color:#34d399;">${formatCurrency(o.tutar)}</td>
                <td>
                    <button class="btn btn-subtle" style="padding: 2px 6px; font-size:10px;" onclick="printOgrenciMakbuz(${o.id})">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </td>
            </tr>
        `).join("");

    document.getElementById("detailModalContent").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Okul / Şube</div>
                <div style="font-size: 14px; font-weight: 800; color: var(--primary);">${ogr.okul === 'okul2' ? '🏫 Okul 2' : '🏫 Okul 1'}</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">İletişim / Telefon</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${ogr.telefon || '-'}</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Kayıt Ayı</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${ogr.donem || 'Eylül'}</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted);">Sözleşme (Net)</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${formatCurrency(net)} (${ogr.taksit} Taksit)</div>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); grid-column: span 2;">
                <div style="font-size: 11px; color: var(--text-muted);">Kalan Borç Durumu</div>
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

// RESMİ ÖĞRENCİ SÖZLEŞME VE 10 AYLIK TAKSİT ÖDEME PLANI (A4)
function printOgrenciOdemePlani(ogrId) {
    const ogr = dbOgrenci.ogrenciler.find(o => o.id === ogrId);
    if (!ogr) return;
    const info = typeof getKurumInfo === 'function' ? getKurumInfo() : { name: "Yönetim Sistemi", subTitle: "Mali İşler", bursar: "Yetkili" };

    const brut = Number(ogr.brut) || 0;
    const indirim = Number(ogr.indirim) || 0;
    const netEgitim = Math.max(0, brut - indirim);
    const kirtasiye = Number(ogr.kirtasiye) || 0;
    const genelToplam = netEgitim + kirtasiye;

    const taksitSayisi = Math.max(1, parseInt(ogr.taksit) || 10);
    const aylikTaksit = Math.round(netEgitim / taksitSayisi);

    const ogrOdemeleri = dbOgrenci.odemeler.filter(o => o.ogrenciId === ogr.id);
    let toplamOdenen = ogrOdemeleri.reduce((s, o) => s + (Number(o.tutar) || 0), 0);
    const kalanGenel = Math.max(0, genelToplam - toplamOdenen);

    const aylarListesi = ["Eylül", "Ekim", "Kasım", "Aralık", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos"];
    
    let remainingPaidPool = toplamOdenen;
    let taksitRowsHtml = "";

    for (let i = 0; i < taksitSayisi; i++) {
        const ayAdi = aylarListesi[i % aylarListesi.length];
        const buTaksitTutar = (i === taksitSayisi - 1) ? (netEgitim - (aylikTaksit * (taksitSayisi - 1))) : aylikTaksit;
        
        let durumStr = "";
        let odendiMi = false;
        if (remainingPaidPool >= buTaksitTutar) {
            durumStr = `<span style="color: #059669; font-weight: 700;">ÖDENDİ</span>`;
            remainingPaidPool -= buTaksitTutar;
            odendiMi = true;
        } else if (remainingPaidPool > 0) {
            durumStr = `<span style="color: #d97706; font-weight: 700;">KISMİ (${formatCurrency(remainingPaidPool)})</span>`;
            remainingPaidPool = 0;
        } else {
            durumStr = `<span style="color: #dc2626; font-weight: 700;">BEKLİYOR</span>`;
        }

        taksitRowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 7px 10px; text-align: center; font-weight: 700;">${i + 1}</td>
                <td style="padding: 7px 10px; font-weight: 700;">${ayAdi}</td>
                <td style="padding: 7px 10px; text-align: right; font-weight: 700;">${formatCurrency(buTaksitTutar)}</td>
                <td style="padding: 7px 10px; text-align: center;">${durumStr}</td>
                <td style="padding: 7px 10px; color: #64748b; font-size: 10px;">${odendiMi ? 'Tahsil Edildi' : 'Vadesinde Ödenecektir'}</td>
            </tr>
        `;
    }

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
