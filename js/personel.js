// ============================================================================
// PERSONEL, MAAŞ VE KİRA YÖNETİMİ MODÜLÜ (ORİJİNAL İŞLEYİŞ, SAF & NET)
// ============================================================================

let defaultPersonnelData = [
    { id: 1, code: "P001", name: "Ahmet Yılmaz", salary: 45000, rent: 0, sosyal1: 3000, sosyal2: 0, sosyal3: 0, startSalary: "2026-09", startRent: "", initialDebt: 0 },
    { id: 2, code: "P002", name: "Ayşe Kaya", salary: 38000, rent: 0, sosyal1: 2500, sosyal2: 1500, sosyal3: 0, startSalary: "2026-09", startRent: "", initialDebt: 0 },
    { id: 3, code: "K001", name: "Merkez Bina Mülk Sahibi", salary: 0, rent: 25000, sosyal1: 0, sosyal2: 0, sosyal3: 0, startSalary: "", startRent: "2026-09", initialDebt: 0 }
];

let defaultPaymentsData = [
    { id: 1, date: "05.10.2026", code: "P001", type: "MAAŞ", amount: 45000, period: "2026-09", channel: "BANKA", note: "Eylül ayı net maaş ödemesi" },
    { id: 2, date: "05.10.2026", code: "K001", type: "KİRA", amount: 25000, period: "2026-09", channel: "BANKA", note: "Eylül ayı bina kirası" }
];

let dbPersonel = JSON.parse(localStorage.getItem('app_personnel')) || defaultPersonnelData;
let dbPersonelChanges = JSON.parse(localStorage.getItem('app_changes')) || [];
let dbPersonelPayments = JSON.parse(localStorage.getItem('app_payments')) || defaultPaymentsData;

// Otomatik Veri Uyumluluğu
dbPersonel.forEach(p => {
    if (!p.startSalary && Number(p.salary) > 0) p.startSalary = "2026-09";
    if (!p.startRent && Number(p.rent) > 0) p.startRent = "2026-09";
    if (p.initialDebt === undefined) p.initialDebt = 0;
    if (p.sosyal1 === undefined) p.sosyal1 = 0;
    if (p.sosyal2 === undefined) p.sosyal2 = 0;
    if (p.sosyal3 === undefined) p.sosyal3 = 0;
});

function savePersonelDb() {
    localStorage.setItem('app_personnel', JSON.stringify(dbPersonel));
    localStorage.setItem('app_changes', JSON.stringify(dbPersonelChanges));
    localStorage.setItem('app_payments', JSON.stringify(dbPersonelPayments));
    if (typeof updateGlobalBadges === 'function') updateGlobalBadges();
}

function getPeriodStr(year, month) {
    const m = month < 10 ? '0' + month : '' + month;
    return `${year}-${m}`;
}

function getCurrentPeriod() {
    const year = parseInt(document.getElementById("selectPersonelYil")?.value || "2026");
    const month = parseInt(document.getElementById("selectPersonelAy")?.value || "10");
    return getPeriodStr(year, month);
}

// ----------------------------------------------------------------------------
// SOSYAL HAK & EK ÖDEME BAŞLIKLARI (DİNAMİK VE KURUMA ÖZEL)
// ----------------------------------------------------------------------------
function getSocialLabels() {
    const defaultLabels = {
        sosyal1: "Sosyal-1",
        sosyal2: "Sosyal-2",
        sosyal3: "Sosyal-3"
    };
    try {
        const stored = JSON.parse(localStorage.getItem('app_social_labels'));
        if (stored && typeof stored === 'object') {
            return {
                sosyal1: stored.sosyal1?.trim() || defaultLabels.sosyal1,
                sosyal2: stored.sosyal2?.trim() || defaultLabels.sosyal2,
                sosyal3: stored.sosyal3?.trim() || defaultLabels.sosyal3
            };
        }
    } catch (e) {}
    return defaultLabels;
}

function getSocialLabelByType(type) {
    const labels = getSocialLabels();
    if (type === 'SOSYAL-1') return labels.sosyal1;
    if (type === 'SOSYAL-2') return labels.sosyal2;
    if (type === 'SOSYAL-3') return labels.sosyal3;
    if (type === 'MAAŞ') return "Net Maaş";
    if (type === 'KİRA') return "Kira";
    if (type === 'AVANS') return "Avans";
    if (type === 'TOPLU') return "Toplu Ödeme";
    return type;
}

function updateSocialLabelsInUI() {
    const labels = getSocialLabels();

    // Aylık Takip Tablosu
    const thA1 = document.getElementById("thAylikSosyal1");
    if (thA1) thA1.innerText = labels.sosyal1;
    const thA2 = document.getElementById("thAylikSosyal2");
    if (thA2) thA2.innerText = labels.sosyal2;
    const thA3 = document.getElementById("thAylikSosyal3");
    if (thA3) thA3.innerText = labels.sosyal3;

    // Kadro Tablosu
    const thK1 = document.getElementById("thKadroSosyal1");
    if (thK1) thK1.innerText = labels.sosyal1;
    const thK2 = document.getElementById("thKadroSosyal2");
    if (thK2) thK2.innerText = labels.sosyal2;
    const thK3 = document.getElementById("thKadroSosyal3");
    if (thK3) thK3.innerText = labels.sosyal3;

    // Personel Formu Etiketleri
    const lblF1 = document.getElementById("lblFormSosyal1");
    if (lblF1) lblF1.innerText = `${labels.sosyal1} (₺)`;
    const lblF2 = document.getElementById("lblFormSosyal2");
    if (lblF2) lblF2.innerText = `${labels.sosyal2} (₺)`;
    const lblF3 = document.getElementById("lblFormSosyal3");
    if (lblF3) lblF3.innerText = `${labels.sosyal3} (₺)`;

    // Ödeme Modalı Seçenekleri
    const optP1 = document.getElementById("optPaySosyal1");
    if (optP1) optP1.innerText = `${labels.sosyal1} Ödemesi`;
    const optP2 = document.getElementById("optPaySosyal2");
    if (optP2) optP2.innerText = `${labels.sosyal2} Ödemesi`;
    const optP3 = document.getElementById("optPaySosyal3");
    if (optP3) optP3.innerText = `${labels.sosyal3} Ödemesi`;

    // Zam Modalı Seçenekleri
    const optZ1 = document.getElementById("optZamSosyal1");
    if (optZ1) optZ1.innerText = labels.sosyal1;
    const optZ2 = document.getElementById("optZamSosyal2");
    if (optZ2) optZ2.innerText = labels.sosyal2;
    const optZ3 = document.getElementById("optZamSosyal3");
    if (optZ3) optZ3.innerText = labels.sosyal3;

    // Ayarlar Sekmesi Girişleri
    const setS1 = document.getElementById("cfgSettingSocial1");
    if (setS1 && !setS1.value) setS1.value = labels.sosyal1;
    const setS2 = document.getElementById("cfgSettingSocial2");
    if (setS2 && !setS2.value) setS2.value = labels.sosyal2;
    const setS3 = document.getElementById("cfgSettingSocial3");
    if (setS3 && !setS3.value) setS3.value = labels.sosyal3;
}

function openSocialLabelsModal() {
    const labels = getSocialLabels();
    if (document.getElementById("cfgSocialLabel1")) document.getElementById("cfgSocialLabel1").value = labels.sosyal1;
    if (document.getElementById("cfgSocialLabel2")) document.getElementById("cfgSocialLabel2").value = labels.sosyal2;
    if (document.getElementById("cfgSocialLabel3")) document.getElementById("cfgSocialLabel3").value = labels.sosyal3;
    openModal("modalSocialLabels");
}

function saveSocialLabelsForm(e) {
    if (e) e.preventDefault();
    const l1 = document.getElementById("cfgSocialLabel1")?.value.trim() || "Sosyal-1";
    const l2 = document.getElementById("cfgSocialLabel2")?.value.trim() || "Sosyal-2";
    const l3 = document.getElementById("cfgSocialLabel3")?.value.trim() || "Sosyal-3";

    const labels = {
        sosyal1: l1,
        sosyal2: l2,
        sosyal3: l3
    };

    localStorage.setItem('app_social_labels', JSON.stringify(labels));
    closeModal("modalSocialLabels");

    updateSocialLabelsInUI();
    renderPersonelAylikTab();
    renderPersonelKadroTab();
    renderPersonelOdemelerTab();

    // Ayarlar sekmesindeki kutuları da senkronize et
    if (document.getElementById("cfgSettingSocial1")) document.getElementById("cfgSettingSocial1").value = l1;
    if (document.getElementById("cfgSettingSocial2")) document.getElementById("cfgSettingSocial2").value = l2;
    if (document.getElementById("cfgSettingSocial3")) document.getElementById("cfgSettingSocial3").value = l3;

    showToast(`Kalem isimleri güncellendi: "${l1}", "${l2}", "${l3}"`);
}

function resetSocialLabelsDefault() {
    if (document.getElementById("cfgSocialLabel1")) document.getElementById("cfgSocialLabel1").value = "Sosyal-1";
    if (document.getElementById("cfgSocialLabel2")) document.getElementById("cfgSocialLabel2").value = "Sosyal-2";
    if (document.getElementById("cfgSocialLabel3")) document.getElementById("cfgSocialLabel3").value = "Sosyal-3";
}

// Zam geçmişi ve başlangıç aylarına göre o aydaki geçerli tahakkuk tutarı
function getEffectiveRate(code, type, targetPeriod) {
    const p = dbPersonel.find(item => item.code === code);
    if (!p) return 0;

    let baseRate = 0;
    if (type === 'MAAŞ') {
        if (p.startSalary && targetPeriod >= p.startSalary) {
            baseRate = Number(p.salary) || 0;
        }
    } else if (type === 'SOSYAL-1') {
        if (p.startSalary && targetPeriod >= p.startSalary) {
            baseRate = Number(p.sosyal1) || 0;
        }
    } else if (type === 'SOSYAL-2') {
        if (p.startSalary && targetPeriod >= p.startSalary) {
            baseRate = Number(p.sosyal2) || 0;
        }
    } else if (type === 'SOSYAL-3') {
        if (p.startSalary && targetPeriod >= p.startSalary) {
            baseRate = Number(p.sosyal3) || 0;
        }
    } else if (type === 'KİRA') {
        if (p.startRent && targetPeriod >= p.startRent) {
            baseRate = Number(p.rent) || 0;
        }
    }

    // Zam geçmişini kontrol et
    const matchingChanges = dbPersonelChanges
        .filter(c => c.code === code && c.type === type && c.effectiveMonth <= targetPeriod)
        .sort((a, b) => (a.effectiveMonth > b.effectiveMonth ? 1 : -1));

    if (matchingChanges.length > 0) {
        baseRate = Number(matchingChanges[matchingChanges.length - 1].newRate) || 0;
    }

    return baseRate;
}

// 1. AYLIK BORDRO & GİDER TAKİBİ (MAAŞ + SOSYAL HAKLAR AYRI AYRI)
function renderPersonelAylikTab() {
    updateSocialLabelsInUI();

    const year = parseInt(document.getElementById("selectPersonelYil")?.value || "2026");
    const month = parseInt(document.getElementById("selectPersonelAy")?.value || "10");
    const filterType = document.getElementById("selectPersonelGiderTur")?.value || "ALL";

    const currentPeriod = getPeriodStr(year, month);
    const tbody = document.getElementById("personelAylikTableBody");
    if (!tbody) return;

    let totalAccrual = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    let rowsHtml = "";

    dbPersonel.forEach(p => {
        const isRentOnly = (Number(p.rent) > 0 && (!p.salary || Number(p.salary) === 0));
        if (filterType === "SALARY" && isRentOnly) return;
        if (filterType === "RENT" && !isRentOnly) return;

        // Seçilen aya ait tahakkuk tutarları (zamlar dahil)
        const curSalary = (filterType === "ALL" || filterType === "SALARY") ? getEffectiveRate(p.code, 'MAAŞ', currentPeriod) : 0;
        const curS1 = (filterType === "ALL" || filterType === "SALARY") ? getEffectiveRate(p.code, 'SOSYAL-1', currentPeriod) : 0;
        const curS2 = (filterType === "ALL" || filterType === "SALARY") ? getEffectiveRate(p.code, 'SOSYAL-2', currentPeriod) : 0;
        const curS3 = (filterType === "ALL" || filterType === "SALARY") ? getEffectiveRate(p.code, 'SOSYAL-3', currentPeriod) : 0;
        const curRent = (filterType === "ALL" || filterType === "RENT") ? getEffectiveRate(p.code, 'KİRA', currentPeriod) : 0;

        const curAccrual = curSalary + curS1 + curS2 + curS3 + curRent;

        // Seçilen aya ait yapılan ödemeler
        let paidSalary = 0;
        let paidS1 = 0;
        let paidS2 = 0;
        let paidS3 = 0;
        let paidRent = 0;
        let paidOther = 0;

        dbPersonelPayments.forEach(pay => {
            if (pay.code === p.code && pay.period === currentPeriod) {
                const amt = Number(pay.amount) || 0;
                if (pay.type === 'MAAŞ') paidSalary += amt;
                else if (pay.type === 'SOSYAL-1') paidS1 += amt;
                else if (pay.type === 'SOSYAL-2') paidS2 += amt;
                else if (pay.type === 'SOSYAL-3') paidS3 += amt;
                else if (pay.type === 'KİRA') paidRent += amt;
                else paidOther += amt;
            }
        });

        let curPaid = 0;
        if (filterType === "ALL") {
            curPaid = paidSalary + paidS1 + paidS2 + paidS3 + paidRent + paidOther;
        } else if (filterType === "SALARY") {
            curPaid = paidSalary + paidS1 + paidS2 + paidS3 + paidOther;
        } else if (filterType === "RENT") {
            curPaid = paidRent;
        }

        // Sadece o ayın kendi borcu ve kalanı
        const buAyKalan = Math.max(0, curAccrual - curPaid);

        totalAccrual += curAccrual;
        totalPaid += curPaid;
        totalRemaining += buAyKalan;

        let statusBadge = `<span class="badge-pill badge-danger">Ödenmedi</span>`;
        if (curPaid >= curAccrual && curAccrual > 0) {
            statusBadge = `<span class="badge-pill badge-success">Ödendi</span>`;
        } else if (curPaid > 0) {
            statusBadge = `<span class="badge-pill badge-warning">Kısmi (${formatCurrency(curPaid)})</span>`;
        } else if (curAccrual === 0) {
            statusBadge = `<span class="badge-pill badge-info">Tahakkuk Yok</span>`;
        }

        function renderCompCell(eff, paid, color) {
            if (eff <= 0) return `<span style="color: #64748b; font-size: 11px;">-</span>`;
            let indicator = `<div style="font-size: 10px; color: #f87171;">Ödenmedi</div>`;
            if (paid >= eff) {
                indicator = `<div style="font-size: 10px; color: #34d399; font-weight: 700;">✓ Ödendi</div>`;
            } else if (paid > 0) {
                indicator = `<div style="font-size: 10px; color: #fbbf24;">Kısmi (${formatCurrency(paid)})</div>`;
            }
            return `<div><strong style="color: ${color};">${formatCurrency(eff)}</strong>${indicator}</div>`;
        }

        rowsHtml += `
            <tr>
                <td>
                    <strong>${p.name}</strong>
                    <div style="font-size: 10px; color: var(--text-muted);">${p.code}</div>
                </td>
                <td>${renderCompCell(curSalary, paidSalary, '#e2e8f0')}</td>
                <td>${renderCompCell(curS1, paidS1, '#38bdf8')}</td>
                <td>${renderCompCell(curS2, paidS2, '#a78bfa')}</td>
                <td>${renderCompCell(curS3, paidS3, '#f472b6')}</td>
                <td>${renderCompCell(curRent, paidRent, '#fbbf24')}</td>
                <td><strong style="font-size: 13px;">${formatCurrency(curAccrual)}</strong></td>
                <td style="color: #34d399; font-weight: 700;">${formatCurrency(curPaid)}</td>
                <td style="color: ${buAyKalan > 0 ? '#f87171' : '#94a3b8'}; font-weight: 800;">${formatCurrency(buAyKalan)}</td>
                <td>${statusBadge}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="openPersonelPayModal('${p.code}', '', '${currentPeriod}')">
                        <i class="fa-solid fa-money-bill-transfer"></i> Öde
                    </button>
                    ${!isRentOnly ? `
                    <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px; margin-left: 4px;" onclick="openZamModal('${p.code}')" title="Maaş / Sosyal Hak Zammı">
                        <i class="fa-solid fa-arrow-trend-up" style="color: var(--accent-gold);"></i> Zam
                    </button>` : ''}
                    <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px; margin-left: 4px;" onclick="printPersonelPusula('${p.code}', '${currentPeriod}')" title="Aylık Pusula / Bordro Yazdır">
                        <i class="fa-solid fa-print"></i> Pusula
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml || `<tr><td colspan="11" style="text-align:center; padding: 25px; color: var(--text-muted);">Kayıt bulunamadı.</td></tr>`;

    if (document.getElementById("kpiPersonelAccrual")) document.getElementById("kpiPersonelAccrual").innerText = formatCurrency(totalAccrual);
    if (document.getElementById("kpiPersonelPaid")) document.getElementById("kpiPersonelPaid").innerText = formatCurrency(totalPaid);
    if (document.getElementById("kpiPersonelRemaining")) document.getElementById("kpiPersonelRemaining").innerText = formatCurrency(totalRemaining);
}

// 2. PERSONEL KADROSU (ANA TAHAKKUK - NET VE HAM LİSTE)
function renderPersonelKadroTab() {
    updateSocialLabelsInUI();

    const tbody = document.getElementById("personelKadroTableBody");
    if (!tbody) return;

    if (dbPersonel.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-muted);">Henüz kayıtlı personel/mülk bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = dbPersonel.map((p, index) => {
        return `
            <tr>
                <td>
                    <strong>${p.name}</strong>
                    <div style="font-size: 10px; color: var(--text-muted);">${p.code}</div>
                </td>
                <td style="font-weight: 800; color: #e2e8f0;">${formatCurrency(p.salary || 0)}</td>
                <td style="font-weight: 700; color: #38bdf8;">${formatCurrency(p.sosyal1 || 0)}</td>
                <td style="font-weight: 700; color: #a78bfa;">${formatCurrency(p.sosyal2 || 0)}</td>
                <td style="font-weight: 700; color: #f472b6;">${formatCurrency(p.sosyal3 || 0)}</td>
                <td style="font-weight: 700; color: #fbbf24;">${formatCurrency(p.rent || 0)}</td>
                <td><span class="badge-pill badge-gold">${p.startSalary || p.startRent || '-'}</span></td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 5px;">
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="openZamModal('${p.code}')" title="Zam Yap">
                            <i class="fa-solid fa-arrow-trend-up" style="color: #ffd700;"></i> Zam
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="openEditPersonelModal(${p.id})" title="Düzenle">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="deletePersonelPrompt(${p.id})" title="Sil">
                            <i class="fa-solid fa-trash-can" style="color: #f87171;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 3. ZAM İŞLEMLERİ
function renderPersonelZamTab() {
    const tbody = document.getElementById("personelZamTableBody");
    if (!tbody) return;

    if (dbPersonelChanges.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color: var(--text-muted);">Henüz uygulanmış bir zam geçmişi bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = [...dbPersonelChanges].reverse().map(c => {
        const p = dbPersonel.find(item => item.code === c.code);
        const name = p ? p.name : c.code;
        const isKira = (c.type === 'KİRA');
        const badgeStyle = isKira
            ? 'background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);'
            : 'background: rgba(59, 130, 246, 0.15); color: #60a5fa;';
        const typeLabel = isKira ? 'Kira Bedeli' : getSocialLabelByType(c.type);

        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 11px;">${c.date || '-'}</td>
                <td><strong>${name}</strong></td>
                <td><span class="badge-pill" style="${badgeStyle}; font-weight: 700;">${typeLabel}</span></td>
                <td><span class="badge-pill badge-info">${c.effectiveMonth}</span></td>
                <td style="font-weight: 800; color: #ffd700;">${formatCurrency(c.newRate)}</td>
                <td style="font-size: 11px; color: var(--text-muted);">${c.note || '-'}</td>
                <td>
                    <button class="btn btn-subtle" style="padding: 3px 8px; font-size: 11px;" onclick="deleteZamPrompt(${c.id})">
                        <i class="fa-solid fa-trash-can" style="color: #f87171;"></i> İptal
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// 4. KİRA TAKİBİ
function renderPersonelKiraTab() {
    const tbody = document.getElementById("personelKiraTableBody");
    if (!tbody) return;

    const kiraList = dbPersonel.filter(p => Number(p.rent) > 0);
    if (kiraList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 25px; color: var(--text-muted);">Tanımlanmış kira kaydı bulunamadı.</td></tr>`;
        return;
    }

    const now = new Date();
    const curPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    tbody.innerHTML = kiraList.map(p => {
        const curRent = getEffectiveRate(p.code, 'KİRA', curPeriod) || Number(p.rent) || 0;
        return `
            <tr>
                <td><strong>${p.name}</strong> <span style="font-size: 10.5px; color: var(--text-dim);">(${p.code})</span></td>
                <td style="font-weight: 800; color: #10b981; font-size: 14px;">${formatCurrency(curRent)}</td>
                <td><span class="badge-pill badge-info">${p.startRent || '-'}</span></td>
                <td style="color: var(--text-muted);">${formatCurrency(p.initialDebt || 0)}</td>
                <td>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="openPersonelPayModal('${p.code}', 'KİRA', '', ${curRent})">
                            <i class="fa-solid fa-money-bill-transfer"></i> Kira Öde
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px; color: #d97706; border-color: #f59e0b;" onclick="openZamModal('${p.code}', 'KİRA')" title="Kira Zammı Uygula">
                            <i class="fa-solid fa-arrow-trend-up"></i> Kira Zammı
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 5. MAAŞ & KİRA ÖDEME GEÇMİŞİ
function renderPersonelOdemelerTab() {
    const tbody = document.getElementById("personelOdemelerTableBody");
    if (!tbody) return;

    if (dbPersonelPayments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">Henüz kaydedilmiş ödeme bulunmuyor.</td></tr>`;
        return;
    }

    tbody.innerHTML = [...dbPersonelPayments].reverse().map(pay => {
        const p = dbPersonel.find(item => item.code === pay.code);
        const name = p ? p.name : pay.code;

        let badgeStyle = "background: rgba(59, 130, 246, 0.15); color: #60a5fa;";
        if (pay.type === 'KİRA') badgeStyle = "background: rgba(245, 158, 11, 0.15); color: #fbbf24;";
        else if (pay.type === 'SOSYAL-1') badgeStyle = "background: rgba(56, 189, 248, 0.15); color: #38bdf8;";
        else if (pay.type === 'SOSYAL-2') badgeStyle = "background: rgba(167, 139, 250, 0.15); color: #a78bfa;";
        else if (pay.type === 'SOSYAL-3') badgeStyle = "background: rgba(244, 114, 182, 0.15); color: #f472b6;";
        else if (pay.type === 'MAAŞ') badgeStyle = "background: rgba(16, 185, 129, 0.15); color: #34d399;";
        else if (pay.type === 'AVANS') badgeStyle = "background: rgba(249, 115, 22, 0.15); color: #fb923c;";

        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 11px;">${pay.date}</td>
                <td><strong>${name}</strong></td>
                <td><span class="badge-pill" style="${badgeStyle}; font-weight: 700;">${getSocialLabelByType(pay.type)}</span></td>
                <td><span class="badge-pill badge-gold">${pay.period}</span></td>
                <td style="font-weight: 800; color: #f87171; font-size: 13px;">-${formatCurrency(pay.amount)}</td>
                <td style="font-size: 11px; color: var(--text-muted);">${pay.note || '-'}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="printPersonelDekont(${pay.id})" title="Dekont Yazdır">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button class="btn btn-subtle" style="padding: 4px 8px; font-size: 11px;" onclick="deletePersonelPaymentPrompt(${pay.id})" title="Sil">
                            <i class="fa-solid fa-trash-can" style="color: #f87171;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// PERSONEL EKLEME / DÜZENLEME (TAM ORİJİNAL İŞLEYİŞ)
function openNewPersonelModal() {
    updateSocialLabelsInUI();

    document.getElementById("formPersonelEditId").value = "";
    document.getElementById("formPersonelModalTitle").innerText = "Yeni Personel / Mülk Ekle";
    document.getElementById("personelForm").reset();

    // Default ayları bu aya ayarla
    const nowPeriod = getPeriodStr(new Date().getFullYear(), new Date().getMonth() + 1);
    document.getElementById("formPersonelStartSalary").value = nowPeriod;
    document.getElementById("formPersonelStartRent").value = nowPeriod;
    setCurrencyValue("formPersonelSalary", 0);
    setCurrencyValue("formPersonelSosyal1", 0);
    setCurrencyValue("formPersonelSosyal2", 0);
    setCurrencyValue("formPersonelSosyal3", 0);
    setCurrencyValue("formPersonelRent", 0);
    setCurrencyValue("formPersonelInitialDebt", 0);

    openModal("modalPersonelForm");
}

function openEditPersonelModal(id) {
    updateSocialLabelsInUI();

    const p = dbPersonel.find(item => item.id === id);
    if (!p) return;

    document.getElementById("formPersonelEditId").value = p.id;
    document.getElementById("formPersonelModalTitle").innerText = "Düzenle: " + p.name;
    document.getElementById("formPersonelName").value = p.name;
    setCurrencyValue("formPersonelSalary", p.salary || 0);
    setCurrencyValue("formPersonelSosyal1", p.sosyal1 || 0);
    setCurrencyValue("formPersonelSosyal2", p.sosyal2 || 0);
    setCurrencyValue("formPersonelSosyal3", p.sosyal3 || 0);
    setCurrencyValue("formPersonelRent", p.rent || 0);
    document.getElementById("formPersonelStartSalary").value = p.startSalary || "2026-09";
    document.getElementById("formPersonelStartRent").value = p.startRent || "";
    setCurrencyValue("formPersonelInitialDebt", p.initialDebt || 0);

    openModal("modalPersonelForm");
}

function submitPersonelForm(e) {
    if (e) e.preventDefault();

    const editId = document.getElementById("formPersonelEditId").value;
    const name = document.getElementById("formPersonelName").value.trim();
    const salary = getCurrencyValue("formPersonelSalary");
    const sosyal1 = getCurrencyValue("formPersonelSosyal1");
    const sosyal2 = getCurrencyValue("formPersonelSosyal2");
    const sosyal3 = getCurrencyValue("formPersonelSosyal3");
    const rent = getCurrencyValue("formPersonelRent");
    const startSalary = document.getElementById("formPersonelStartSalary").value;
    const startRent = document.getElementById("formPersonelStartRent").value;
    const initialDebt = getCurrencyValue("formPersonelInitialDebt");

    if (!name) {
        showToast("Lütfen personel veya mülk sahibinin adını giriniz", "error");
        return;
    }

    if (editId) {
        const p = dbPersonel.find(item => item.id === Number(editId));
        if (p) {
            p.name = name;
            p.salary = salary;
            p.sosyal1 = sosyal1;
            p.sosyal2 = sosyal2;
            p.sosyal3 = sosyal3;
            p.rent = rent;
            p.startSalary = startSalary;
            p.startRent = startRent;
            p.initialDebt = initialDebt;
            showToast("Personel bilgileri güncellendi");
        }
    } else {
        const newId = Date.now();
        const code = (rent > 0 && salary === 0 && (sosyal1 + sosyal2 + sosyal3 === 0)) ? "K" + (100 + dbPersonel.length) : "P" + (100 + dbPersonel.length);
        dbPersonel.push({
            id: newId,
            code,
            name,
            salary,
            sosyal1,
            sosyal2,
            sosyal3,
            rent,
            startSalary,
            startRent,
            initialDebt
        });
        showToast("Yeni kayıt başarıyla eklendi");
    }

    savePersonelDb();
    closeModal("modalPersonelForm");
    renderPersonelKadroTab();
    renderPersonelAylikTab();
    renderPersonelKiraTab();
}

function deletePersonelPrompt(id) {
    const p = dbPersonel.find(item => item.id === id);
    if (!p) return;

    if (confirm(`"${p.name}" kaydını ve tüm geçmişini silmek istediğinize emin misiniz?`)) {
        dbPersonel = dbPersonel.filter(item => item.id !== id);
        savePersonelDb();
        renderPersonelKadroTab();
        renderPersonelAylikTab();
        renderPersonelKiraTab();
        showToast("Kayıt silindi");
    }
}

// ÖDEME YAPMA MODALI (HIZLI SEÇİMLİ VE ÇOKLU KALEM DESTEKLİ)
function openPersonelPayModal(code, defaultType, defaultPeriod, defaultAmount) {
    updateSocialLabelsInUI();

    const p = dbPersonel.find(item => item.code === code);
    if (!p) return;

    document.getElementById("payPersonelCode").value = p.code;
    document.getElementById("payPersonelNameDisplay").innerText = p.name;
    
    const now = new Date();
    const curYear = now.getFullYear();
    const curM = (now.getMonth() + 1);
    const activePeriod = defaultPeriod || getPeriodStr(curYear, curM);
    document.getElementById("payPersonelPeriod").value = activePeriod;
    document.getElementById("payPersonelDate").value = now.toISOString().slice(0, 10);

    updatePayModalSummaryAndFields(defaultType, defaultAmount);
    openModal("modalPersonelPay");
}

function updatePayModalSummaryAndFields(preferredType, preferredAmount) {
    const code = document.getElementById("payPersonelCode").value;
    const p = dbPersonel.find(item => item.code === code);
    if (!p) return;

    const period = document.getElementById("payPersonelPeriod").value;

    const effSalary = getEffectiveRate(code, 'MAAŞ', period);
    const effS1 = getEffectiveRate(code, 'SOSYAL-1', period);
    const effS2 = getEffectiveRate(code, 'SOSYAL-2', period);
    const effS3 = getEffectiveRate(code, 'SOSYAL-3', period);
    const effRent = getEffectiveRate(code, 'KİRA', period);

    let paidSalary = 0, paidS1 = 0, paidS2 = 0, paidS3 = 0, paidRent = 0;
    dbPersonelPayments.forEach(pay => {
        if (pay.code === code && pay.period === period) {
            const a = Number(pay.amount) || 0;
            if (pay.type === 'MAAŞ') paidSalary += a;
            else if (pay.type === 'SOSYAL-1') paidS1 += a;
            else if (pay.type === 'SOSYAL-2') paidS2 += a;
            else if (pay.type === 'SOSYAL-3') paidS3 += a;
            else if (pay.type === 'KİRA') paidRent += a;
        }
    });

    const remSalary = Math.max(0, effSalary - paidSalary);
    const remS1 = Math.max(0, effS1 - paidS1);
    const remS2 = Math.max(0, effS2 - paidS2);
    const remS3 = Math.max(0, effS3 - paidS3);
    const remRent = Math.max(0, effRent - paidRent);
    const totalRem = remSalary + remS1 + remS2 + remS3 + remRent;

    const summaryEl = document.getElementById("payComponentSummary");
    const labels = getSocialLabels();

    if (summaryEl) {
        let cardsHtml = `
            <div style="font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">
                ${period} Dönemi Kalan Hakedişler (Ödemek istediğinize tıklayın):
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        `;

        if (effSalary > 0) {
            cardsHtml += `
                <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 5px 10px; border-color: ${remSalary > 0 ? 'var(--primary)' : 'var(--border-color)'};" onclick="selectPayComponent('MAAŞ', ${remSalary})">
                    Maaş: <strong style="color: ${remSalary > 0 ? '#f87171' : '#34d399'}; margin-left: 4px;">${formatCurrency(remSalary)}</strong>
                </button>
            `;
        }
        if (effS1 > 0) {
            cardsHtml += `
                <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 5px 10px; border-color: ${remS1 > 0 ? '#38bdf8' : 'var(--border-color)'};" onclick="selectPayComponent('SOSYAL-1', ${remS1})">
                    ${labels.sosyal1}: <strong style="color: ${remS1 > 0 ? '#38bdf8' : '#34d399'}; margin-left: 4px;">${formatCurrency(remS1)}</strong>
                </button>
            `;
        }
        if (effS2 > 0) {
            cardsHtml += `
                <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 5px 10px; border-color: ${remS2 > 0 ? '#a78bfa' : 'var(--border-color)'};" onclick="selectPayComponent('SOSYAL-2', ${remS2})">
                    ${labels.sosyal2}: <strong style="color: ${remS2 > 0 ? '#a78bfa' : '#34d399'}; margin-left: 4px;">${formatCurrency(remS2)}</strong>
                </button>
            `;
        }
        if (effS3 > 0) {
            cardsHtml += `
                <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 5px 10px; border-color: ${remS3 > 0 ? '#f472b6' : 'var(--border-color)'};" onclick="selectPayComponent('SOSYAL-3', ${remS3})">
                    ${labels.sosyal3}: <strong style="color: ${remS3 > 0 ? '#f472b6' : '#34d399'}; margin-left: 4px;">${formatCurrency(remS3)}</strong>
                </button>
            `;
        }
        if (effRent > 0) {
            cardsHtml += `
                <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 5px 10px; border-color: ${remRent > 0 ? '#fbbf24' : 'var(--border-color)'};" onclick="selectPayComponent('KİRA', ${remRent})">
                    Kira: <strong style="color: ${remRent > 0 ? '#fbbf24' : '#34d399'}; margin-left: 4px;">${formatCurrency(remRent)}</strong>
                </button>
            `;
        }
        cardsHtml += `
            <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 5px 10px; background: rgba(56, 189, 248, 0.1); border-color: var(--primary);" onclick="selectPayComponent('TOPLU', ${totalRem})">
                Tüm Kalan: <strong style="color: #ffd700; margin-left: 4px;">${formatCurrency(totalRem)}</strong>
            </button>
        </div>`;
        summaryEl.innerHTML = cardsHtml;
    }

    let targetType = preferredType;
    if (!targetType) {
        if (remSalary > 0) targetType = 'MAAŞ';
        else if (remS1 > 0) targetType = 'SOSYAL-1';
        else if (remS2 > 0) targetType = 'SOSYAL-2';
        else if (remS3 > 0) targetType = 'SOSYAL-3';
        else if (remRent > 0) targetType = 'KİRA';
        else targetType = (effRent > 0 && effSalary === 0) ? 'KİRA' : 'MAAŞ';
    }

    const typeSelect = document.getElementById("payPersonelType");
    if (typeSelect) typeSelect.value = targetType;

    let targetAmount = preferredAmount;
    if (targetAmount === undefined || targetAmount === null) {
        if (targetType === 'MAAŞ') targetAmount = remSalary || effSalary;
        else if (targetType === 'SOSYAL-1') targetAmount = remS1 || effS1;
        else if (targetType === 'SOSYAL-2') targetAmount = remS2 || effS2;
        else if (targetType === 'SOSYAL-3') targetAmount = remS3 || effS3;
        else if (targetType === 'KİRA') targetAmount = remRent || effRent;
        else if (targetType === 'TOPLU') targetAmount = totalRem;
        else targetAmount = 0;
    }

    setCurrencyValue("payPersonelAmount", targetAmount);
    document.getElementById("payPersonelNote").value = `${p.name} - ${period} ${getSocialLabelByType(targetType)} ödemesi`;
}

function selectPayComponent(type, amount) {
    const typeSelect = document.getElementById("payPersonelType");
    if (typeSelect) typeSelect.value = type;
    setCurrencyValue("payPersonelAmount", amount);

    const code = document.getElementById("payPersonelCode").value;
    const p = dbPersonel.find(item => item.code === code);
    const period = document.getElementById("payPersonelPeriod").value;
    const name = p ? p.name : code;
    document.getElementById("payPersonelNote").value = `${name} - ${period} ${getSocialLabelByType(type)} ödemesi`;
}

function onPersonelPayTypeChange() {
    const type = document.getElementById("payPersonelType").value;
    const code = document.getElementById("payPersonelCode").value;
    const p = dbPersonel.find(item => item.code === code);
    const period = document.getElementById("payPersonelPeriod").value;

    let targetAmount = 0;
    if (type === 'MAAŞ') {
        const eff = getEffectiveRate(code, 'MAAŞ', period);
        const paid = dbPersonelPayments.filter(pay => pay.code === code && pay.period === period && pay.type === 'MAAŞ').reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        targetAmount = Math.max(0, eff - paid) || eff;
    } else if (type === 'SOSYAL-1') {
        const eff = getEffectiveRate(code, 'SOSYAL-1', period);
        const paid = dbPersonelPayments.filter(pay => pay.code === code && pay.period === period && pay.type === 'SOSYAL-1').reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        targetAmount = Math.max(0, eff - paid) || eff;
    } else if (type === 'SOSYAL-2') {
        const eff = getEffectiveRate(code, 'SOSYAL-2', period);
        const paid = dbPersonelPayments.filter(pay => pay.code === code && pay.period === period && pay.type === 'SOSYAL-2').reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        targetAmount = Math.max(0, eff - paid) || eff;
    } else if (type === 'SOSYAL-3') {
        const eff = getEffectiveRate(code, 'SOSYAL-3', period);
        const paid = dbPersonelPayments.filter(pay => pay.code === code && pay.period === period && pay.type === 'SOSYAL-3').reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        targetAmount = Math.max(0, eff - paid) || eff;
    } else if (type === 'KİRA') {
        const eff = getEffectiveRate(code, 'KİRA', period);
        const paid = dbPersonelPayments.filter(pay => pay.code === code && pay.period === period && pay.type === 'KİRA').reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        targetAmount = Math.max(0, eff - paid) || eff;
    } else if (type === 'TOPLU') {
        const effSalary = getEffectiveRate(code, 'MAAŞ', period);
        const effS1 = getEffectiveRate(code, 'SOSYAL-1', period);
        const effS2 = getEffectiveRate(code, 'SOSYAL-2', period);
        const effS3 = getEffectiveRate(code, 'SOSYAL-3', period);
        const effRent = getEffectiveRate(code, 'KİRA', period);
        const totEff = effSalary + effS1 + effS2 + effS3 + effRent;
        const totPaid = dbPersonelPayments.filter(pay => pay.code === code && pay.period === period).reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        targetAmount = Math.max(0, totEff - totPaid);
    }

    setCurrencyValue("payPersonelAmount", targetAmount);
    const name = p ? p.name : code;
    document.getElementById("payPersonelNote").value = `${name} - ${period} ${getSocialLabelByType(type)} ödemesi`;
}

function onPersonelPayPeriodChange() {
    updatePayModalSummaryAndFields();
}

function submitPersonelPayment(e) {
    if (e) e.preventDefault();

    const code = document.getElementById("payPersonelCode").value;
    const type = document.getElementById("payPersonelType").value;
    const period = document.getElementById("payPersonelPeriod").value;
    const amount = getCurrencyValue("payPersonelAmount");
    const rawDate = document.getElementById("payPersonelDate").value;
    const note = document.getElementById("payPersonelNote").value.trim();

    if (amount <= 0) {
        showToast("Lütfen geçerli bir ödeme tutarı giriniz", "error");
        return;
    }

    const dParts = rawDate.split("-");
    const formattedDate = dParts.length === 3 ? `${dParts[2]}.${dParts[1]}.${dParts[0]}` : rawDate;

    let nextId = (dbPersonelPayments.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
    let lastAddedId = nextId;

    if (type === 'TOPLU') {
        // Kalan kalemlere göre sırayla dağıt (Maaş -> Sosyal-1 -> Sosyal-2 -> Sosyal-3 -> Kira)
        const effSalary = getEffectiveRate(code, 'MAAŞ', period);
        const effS1 = getEffectiveRate(code, 'SOSYAL-1', period);
        const effS2 = getEffectiveRate(code, 'SOSYAL-2', period);
        const effS3 = getEffectiveRate(code, 'SOSYAL-3', period);
        const effRent = getEffectiveRate(code, 'KİRA', period);

        let paidSalary = 0, paidS1 = 0, paidS2 = 0, paidS3 = 0, paidRent = 0;
        dbPersonelPayments.forEach(pay => {
            if (pay.code === code && pay.period === period) {
                const a = Number(pay.amount) || 0;
                if (pay.type === 'MAAŞ') paidSalary += a;
                else if (pay.type === 'SOSYAL-1') paidS1 += a;
                else if (pay.type === 'SOSYAL-2') paidS2 += a;
                else if (pay.type === 'SOSYAL-3') paidS3 += a;
                else if (pay.type === 'KİRA') paidRent += a;
            }
        });

        const items = [
            { type: 'MAAŞ', rem: Math.max(0, effSalary - paidSalary) },
            { type: 'SOSYAL-1', rem: Math.max(0, effS1 - paidS1) },
            { type: 'SOSYAL-2', rem: Math.max(0, effS2 - paidS2) },
            { type: 'SOSYAL-3', rem: Math.max(0, effS3 - paidS3) },
            { type: 'KİRA', rem: Math.max(0, effRent - paidRent) }
        ];

        let remainingToDistribute = amount;
        items.forEach(item => {
            if (remainingToDistribute > 0 && item.rem > 0) {
                const payAmt = Math.min(remainingToDistribute, item.rem);
                dbPersonelPayments.push({
                    id: nextId++,
                    date: formattedDate,
                    code,
                    type: item.type,
                    amount: payAmt,
                    period,
                    channel: "BANKA",
                    note: note || `${item.type} ödemesi`
                });
                remainingToDistribute -= payAmt;
            }
        });

        if (remainingToDistribute > 0) {
            dbPersonelPayments.push({
                id: nextId++,
                date: formattedDate,
                code,
                type: "AVANS",
                amount: remainingToDistribute,
                period,
                channel: "BANKA",
                note: note ? `${note} (Ek Bakiye)` : "Avans / Ek Ödeme"
            });
        }
        lastAddedId = nextId - 1;
    } else {
        const payment = {
            id: nextId,
            date: formattedDate,
            code,
            type,
            amount,
            period,
            channel: "BANKA",
            note
        };
        dbPersonelPayments.push(payment);
        lastAddedId = nextId;
    }

    savePersonelDb();
    closeModal("modalPersonelPay");

    renderPersonelAylikTab();
    renderPersonelOdemelerTab();
    showToast("Ödeme kaydı başarıyla eklendi");

    if (confirm("Ödeme dekontunu yazdırmak ister misiniz?")) {
        printPersonelDekont(lastAddedId);
    }
}

function deletePersonelPaymentPrompt(id) {
    if (confirm("Bu ödeme kaydını silmek istediğinize emin misiniz?")) {
        dbPersonelPayments = dbPersonelPayments.filter(item => item.id !== id);
        savePersonelDb();
        renderPersonelAylikTab();
        renderPersonelOdemelerTab();
        showToast("Ödeme kaydı silindi");
    }
}

// RESMİ ÖDEME DEKONTU
function printPersonelDekont(payId) {
    const pay = dbPersonelPayments.find(item => item.id === payId);
    if (!pay) return;

    const p = dbPersonel.find(item => item.code === pay.code);
    const kurum = getKurumInfo();

    const receiptHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 680px; margin: 0 auto; border: 2px solid #000; padding: 30px; background: #fff; color: #000;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">${kurum.name}</h2>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">${kurum.subTitle}</p>
                    <p style="margin: 3px 0 0 0; font-size: 11px;">Mali İşler & Muhasebe Birimi</p>
                </div>
                <div style="text-align: right;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 800;">ÖDEME DEKONTU</h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>Dekont No:</strong> DK-${1000 + pay.id}</p>
                    <p style="margin: 2px 0 0 0; font-size: 12px;"><strong>Tarih:</strong> ${pay.date}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold; width: 140px;">Ödeme Yapılan:</td>
                    <td style="padding: 8px 0;">${p ? p.name : pay.code}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold;">Ödeme Türü:</td>
                    <td style="padding: 8px 0;">${getSocialLabelByType(pay.type)} (Dönem: ${pay.period})</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold;">Ödenen Tutar:</td>
                    <td style="padding: 8px 0; font-size: 16px; font-weight: 800;">${formatCurrency(pay.amount)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px 0; font-weight: bold;">Yazı ile:</td>
                    <td style="padding: 8px 0; font-style: italic;"># ${numberToTurkishWords(pay.amount)} #</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Açıklama:</td>
                    <td style="padding: 8px 0;">${pay.note || 'Ödeme tamamlandı.'}</td>
                </tr>
            </table>

            <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
                <div style="width: 200px;">
                    <p style="font-size: 12px; margin-bottom: 50px;"><strong>Ödeyen Yetkili</strong></p>
                    <p style="border-top: 1px dotted #000; padding-top: 5px; font-size: 11px;">İmza / Kaşe</p>
                </div>
                <div style="width: 200px;">
                    <p style="font-size: 12px; margin-bottom: 50px;"><strong>Teslim Alan</strong></p>
                    <p style="border-top: 1px dotted #000; padding-top: 5px; font-size: 11px;">İmza</p>
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

// ZAM MODALI (MAAŞ / KİRA / SOSYAL HAK)
function openZamModal(code, defaultType) {
    updateSocialLabelsInUI();

    const isKiraDefault = (defaultType === 'KİRA');
    const eligibleStaff = dbPersonel.filter(item => {
        if (isKiraDefault) return Number(item.rent) > 0;
        return (Number(item.salary) > 0 || Number(item.rent) > 0 || Number(item.sosyal1) > 0 || Number(item.sosyal2) > 0 || Number(item.sosyal3) > 0);
    });

    if (eligibleStaff.length === 0) {
        showToast(isKiraDefault ? "Sistemde tanımlı kira / mülk kaydı bulunmuyor." : "Sistemde kayıtlı personel veya mülk kaydı bulunmuyor.", "error");
        return;
    }

    const selectEl = document.getElementById("zamPersonelSelect");
    if (selectEl) {
        selectEl.innerHTML = eligibleStaff.map(p => {
            let roleTag = "Personel";
            if (Number(p.rent) > 0 && (!p.salary || Number(p.salary) === 0)) roleTag = "Mülk Sahibi";
            else if (Number(p.rent) > 0 && Number(p.salary) > 0) roleTag = "Personel & Mülk";
            return `<option value="${p.code}" ${code === p.code ? 'selected' : ''}>${p.name} (${roleTag} - ${p.code})</option>`;
        }).join("");
    }

    const targetTypeSelect = document.getElementById("zamTargetType");
    if (targetTypeSelect) {
        targetTypeSelect.value = defaultType || (code && dbPersonel.find(x => x.code === code && Number(x.rent) > 0 && !x.salary) ? "KİRA" : "MAAŞ");
    }

    const titleEl = document.getElementById("modalZamTitle");
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${defaultType === 'KİRA' ? 'Kira Zammı Uygula' : 'Maaş / Kira / Sosyal Hak Zammı Uygula'}`;
    }

    const targetCode = code || (selectEl ? selectEl.value : eligibleStaff[0].code);
    if (selectEl) selectEl.value = targetCode;

    onZamPersonelChange(targetCode);

    // Başlangıç ayı olarak cari dönemi seç
    const now = new Date();
    const curYear = now.getFullYear();
    const curM = (now.getMonth() + 1).toString().padStart(2, '0');
    document.getElementById("zamEffectiveMonth").value = `${curYear}-${curM}`;
    document.getElementById("zamNote").value = defaultType === 'KİRA' ? "Dönemsel kira artışı" : "Dönemsel artış";

    openModal("modalZam");
}

function onZamPersonelChange(code) {
    const p = dbPersonel.find(item => item.code === code);
    if (!p) return;

    let targetType = document.getElementById("zamTargetType")?.value || "MAAŞ";

    // Eğer mülk sahibiyse ve maaşı yoksa otomatik KİRA seç
    if (Number(p.rent) > 0 && (!p.salary || Number(p.salary) === 0) && (!p.sosyal1 && !p.sosyal2 && !p.sosyal3)) {
        const targetTypeSelect = document.getElementById("zamTargetType");
        if (targetTypeSelect && targetType !== 'KİRA') {
            targetTypeSelect.value = 'KİRA';
            targetType = 'KİRA';
        }
    }

    const nowPeriod = getPeriodStr(new Date().getFullYear(), new Date().getMonth() + 1);
    let currentRate = getEffectiveRate(p.code, targetType, nowPeriod);
    if (!currentRate && targetType === 'KİRA') {
        currentRate = Number(p.rent) || 0;
    }

    const disp = document.getElementById("zamCurrentSalaryDisplay");
    if (disp) {
        const labelName = (targetType === 'KİRA') ? 'Kira Bedeli' : getSocialLabelByType(targetType);
        disp.innerHTML = `Mevcut ${labelName}: <strong style="color: var(--primary); font-size: 13px;">${formatCurrency(currentRate)}</strong>`;
    }

    setCurrencyValue("zamNewRate", currentRate);
}

function onZamTypeChange() {
    const code = document.getElementById("zamPersonelSelect")?.value;
    if (code) onZamPersonelChange(code);
}

function submitZamForm(e) {
    if (e) e.preventDefault();

    const selectEl = document.getElementById("zamPersonelSelect");
    const code = selectEl ? selectEl.value : "";
    const targetType = document.getElementById("zamTargetType")?.value || "MAAŞ";
    const effectiveMonth = document.getElementById("zamEffectiveMonth").value;
    const newRate = getCurrencyValue("zamNewRate");
    const note = document.getElementById("zamNote").value.trim();

    if (!code) {
        showToast("Lütfen bir personel / mülk seçiniz", "error");
        return;
    }

    if (!effectiveMonth) {
        showToast("Lütfen geçerlilik başlangıç ayını seçiniz", "error");
        return;
    }

    if (newRate <= 0) {
        showToast("Lütfen geçerli bir yeni tutar giriniz", "error");
        return;
    }

    const p = dbPersonel.find(item => item.code === code);
    const pName = p ? p.name : code;

    const newId = (dbPersonelChanges.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
    const labelName = (targetType === 'KİRA') ? 'Kira Bedeli' : getSocialLabelByType(targetType);

    dbPersonelChanges.push({
        id: newId,
        date: new Date().toISOString().slice(0, 10),
        code,
        type: targetType,
        effectiveMonth,
        newRate,
        note: note || `${labelName} artışı`
    });

    savePersonelDb();
    closeModal("modalZam");
    renderPersonelZamTab();
    renderPersonelAylikTab();
    renderPersonelKadroTab();
    renderPersonelKiraTab();
    showToast(`${pName} için ${effectiveMonth} döneminden itibaren yeni ${labelName} ${formatCurrency(newRate)} olarak güncellendi!`);
}

function deleteZamPrompt(id) {
    if (confirm("Bu zam kaydını iptal etmek istediğinize emin misiniz?")) {
        dbPersonelChanges = dbPersonelChanges.filter(item => item.id !== id);
        savePersonelDb();
        renderPersonelZamTab();
        renderPersonelAylikTab();
        renderPersonelKadroTab();
        renderPersonelKiraTab();
        showToast("Zam kaydı iptal edildi");
    }
}

// RESMİ AYLIK MAAŞ & SOSYAL HAKLAR PUSULASI (A4 / A5)
function printPersonelPusula(code, period) {
    const p = dbPersonel.find(item => item.code === code);
    if (!p) return;
    const kurum = typeof getKurumInfo === 'function' ? getKurumInfo() : { name: "Yönetim Sistemi", subTitle: "Mali İşler", bursar: "Yetkili" };
    const labels = getSocialLabels();

    const isRent = p.rent > 0 && (!p.salary || p.salary === 0) && (p.sosyal1 + p.sosyal2 + p.sosyal3 === 0);
    const typeLabel = isRent ? "KİRA BORDROSU" : "MAAŞ VE SOSYAL HAKLAR PUSULASI";

    const effSalary = getEffectiveRate(p.code, 'MAAŞ', period);
    const effS1 = getEffectiveRate(p.code, 'SOSYAL-1', period);
    const effS2 = getEffectiveRate(p.code, 'SOSYAL-2', period);
    const effS3 = getEffectiveRate(p.code, 'SOSYAL-3', period);
    const effRent = getEffectiveRate(p.code, 'KİRA', period);
    const totalAccrual = effSalary + effS1 + effS2 + effS3 + effRent;

    const payments = dbPersonelPayments.filter(pay => pay.code === p.code && pay.period === period);
    const paidSum = payments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
    const kalan = Math.max(0, totalAccrual - paidSum);

    const paymentRows = payments.map((pay, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
            <td style="padding: 6px 8px;">${pay.date}</td>
            <td style="padding: 6px 8px; font-weight: 700;">${getSocialLabelByType(pay.type)}</td>
            <td style="padding: 6px 8px;">${pay.note || '-'}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #059669;">${formatCurrency(pay.amount)}</td>
        </tr>
    `).join("");

    const printHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #0f172a; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    ${kurum.logo ? `<img src="${kurum.logo}" alt="Logo" style="max-height: 52px; max-width: 140px; object-fit: contain;">` : ''}
                    <div>
                        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${kurum.name}</h1>
                        <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">${kurum.subTitle}</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 15px; font-weight: 800; color: #059669;">${typeLabel}</div>
                    <div style="font-size: 11px; color: #475569;">Dönem: <strong>${period}</strong> | Düzenleme: ${new Date().toLocaleDateString('tr-TR')}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 12px;">
                <div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">PERSONEL / HAK SAHİBİ BİLGİLERİ</div>
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;">${p.name}</div>
                    <div style="font-size: 11px; color: #475569; margin-top: 4px;">Sicil / Kod: <strong>${p.code}</strong></div>
                    <div style="font-size: 11px; color: #475569;">Maaş Başlangıcı: <strong>${p.startSalary || '-'}</strong></div>
                </div>
                <div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">HAKEDİŞ & ÖDEME ÖZETİ</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #64748b;">Net Maaş:</span>
                        <strong style="color: #0f172a;">${formatCurrency(effSalary)}</strong>
                    </div>
                    ${effS1 > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #64748b;">${labels.sosyal1}:</span>
                        <strong style="color: #0284c7;">${formatCurrency(effS1)}</strong>
                    </div>` : ''}
                    ${effS2 > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #64748b;">${labels.sosyal2}:</span>
                        <strong style="color: #7c3aed;">${formatCurrency(effS2)}</strong>
                    </div>` : ''}
                    ${effS3 > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #64748b;">${labels.sosyal3}:</span>
                        <strong style="color: #db2777;">${formatCurrency(effS3)}</strong>
                    </div>` : ''}
                    ${effRent > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #64748b;">Kira:</span>
                        <strong style="color: #d97706;">${formatCurrency(effRent)}</strong>
                    </div>` : ''}
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px;">
                        <span style="font-weight: 700; color: #0f172a;">Toplam Tahakkuk:</span>
                        <strong style="color: #0f172a; font-size: 13px;">${formatCurrency(totalAccrual)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #64748b;">Toplam Ödenen:</span>
                        <strong style="color: #059669; font-size: 13px;">${formatCurrency(paidSum)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px;">
                        <span style="font-weight: 700; color: #0f172a;">Kalan Bakiye:</span>
                        <strong style="font-size: 15px; color: ${kalan > 0 ? '#dc2626' : '#059669'};">${formatCurrency(kalan)}</strong>
                    </div>
                </div>
            </div>

            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 8px;">Dönem İçi Tediye / Ödeme Hareketleri</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                    <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                        <th style="padding: 7px 8px; text-align: center; width: 30px;">#</th>
                        <th style="padding: 7px 8px; text-align: left; width: 90px;">Ödeme Tarihi</th>
                        <th style="padding: 7px 8px; text-align: left; width: 95px;">Ödeme Türü</th>
                        <th style="padding: 7px 8px; text-align: left;">Açıklama / Not</th>
                        <th style="padding: 7px 8px; text-align: right; width: 110px;">Ödenen Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    ${paymentRows || '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">Bu dönem henüz ödeme kaydı bulunmamaktadır.</td></tr>'}
                </tbody>
                <tfoot>
                    <tr style="background: #f8fafc; border-top: 2px solid #0f172a; font-weight: 800; font-size: 12px;">
                        <td colspan="4" style="padding: 10px 8px; text-align: right;">TOPLAM ÖDENEN:</td>
                        <td style="padding: 10px 8px; text-align: right; color: #059669;">${formatCurrency(paidSum)}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #475569; margin-bottom: 40px;">
                <strong>İbra Beyanı:</strong> ${period} dönemine ait maaş ve sosyal haklar tahakkukum yukarıdaki tabloda belirtildiği şekilde tarafıma ödenmiş olup, bu döneme ilişkin başkaca bir alacağım kalmadığını beyan ederim.
            </div>

            <div style="display: flex; justify-content: space-between; padding: 0 30px;">
                <div style="text-align: center; width: 220px;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${kurum.name}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${kurum.bursar} (Yetkili Kaşe / İmza)</div>
                    <div style="margin-top: 50px; border-top: 1px dotted #94a3b8;"></div>
                </div>
                <div style="text-align: center; width: 220px;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${p.name}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Personel / Hak Sahibi (İmza)</div>
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


// ============================================================================
// WHATSAPP MAAŞ VE GİDER RAPORU (FİRMA BAZLI VE DÖNEM KALEM KALEM)
// ============================================================================

function getPeriodTurkishLabel(periodStr) {
    if (!periodStr || typeof periodStr !== 'string') return periodStr || '';
    const parts = periodStr.split('-');
    if (parts.length < 2) return periodStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    const mName = monthNames[m - 1] || parts[1];
    return `${mName} ${y}`;
}
// ============================================================================
// WHATSAPP MAAŞ VE GİDER RAPORU (SADE, TABLO ŞEKLİNDE & SIFIR TANIMSIZ KARAKTER)
// ============================================================================

function formatTL(val) {
    const num = Math.round(Number(val) || 0);
    return num.toLocaleString('tr-TR') + ' TL';
}

function getPeriodTurkishLabel(periodStr) {
    if (!periodStr || typeof periodStr !== 'string') return periodStr || '';
    const parts = periodStr.split('-');
    if (parts.length < 2) return periodStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    const mName = monthNames[m - 1] || parts[1];
    return `${mName} ${y}`;
}


// ============================================================================
// WHATSAPP & GRAFİK MAAŞ VE GİDER RAPORU (RENKLİ GÖRSEL KART & METİN)
// ============================================================================

function switchReportTab(tabName) {
    const tabImg = document.getElementById('reportTabImageContent');
    const tabTxt = document.getElementById('reportTabTextContent');
    const btnImg = document.getElementById('tabBtnReportImage');
    const btnTxt = document.getElementById('tabBtnReportText');
    if (!tabImg || !tabTxt) return;

    if (tabName === 'image') {
        tabImg.style.display = 'block';
        tabTxt.style.display = 'none';
        if (btnImg) {
            btnImg.className = 'btn btn-primary';
            btnImg.style.background = '';
        }
        if (btnTxt) {
            btnTxt.className = 'btn btn-subtle';
        }
    } else {
        tabImg.style.display = 'none';
        tabTxt.style.display = 'block';
        if (btnImg) {
            btnImg.className = 'btn btn-subtle';
        }
        if (btnTxt) {
            btnTxt.className = 'btn btn-primary';
            btnTxt.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
        }
    }
}

function openPersonelWhatsAppRaporModal() {
    const defaultFirma = localStorage.getItem('app_report_firma_name') || (typeof kurumInfo !== 'undefined' && kurumInfo.name ? kurumInfo.name : 'A Firması');
    const fInput = document.getElementById('reportFirmaAdi');
    if (fInput) {
        fInput.value = defaultFirma;
    }

    const savedPhone = localStorage.getItem('app_report_wa_phone') || '';
    const pInput = document.getElementById('reportWhatsAppPhone');
    if (pInput) {
        pInput.value = savedPhone;
    }

    // Aktif sayfadaki yılı ve ayı aktar
    const pageYear = document.getElementById('selectPersonelYil')?.value || '2026';
    const pageMonth = document.getElementById('selectPersonelAy')?.value || '10';

    const rYear = document.getElementById('reportSelectYil');
    if (rYear) rYear.value = pageYear;
    const rMonth = document.getElementById('reportSelectAy');
    if (rMonth) rMonth.value = pageMonth;

    switchReportTab('image');
    generatePersonelWhatsAppReportText();
    openModal('modalPersonelWhatsAppRapor');
}

function onReportConfigChange() {
    const f = document.getElementById('reportFirmaAdi')?.value || '';
    if (f.trim()) localStorage.setItem('app_report_firma_name', f.trim());
    generatePersonelWhatsAppReportText();
}

function onReportPhoneChange() {
    const p = document.getElementById('reportWhatsAppPhone')?.value || '';
    localStorage.setItem('app_report_wa_phone', p.trim());
}

function updateReportCharCount() {
    const msgEl = document.getElementById('reportMessageText');
    const countEl = document.getElementById('reportCharCount');
    if (msgEl && countEl) {
        countEl.innerText = `${msgEl.value.length} karakter`;
    }
}

// ----------------------------------------------------------------------------
// 1. DÖNEM BAZLI RAPOR VERİSİ HESAPLAMA MOTORU
// ----------------------------------------------------------------------------
function getCalculatedReportDataset() {
    const firmaAdi = (document.getElementById('reportFirmaAdi')?.value || '').trim() || (typeof kurumInfo !== 'undefined' && kurumInfo.name ? kurumInfo.name : 'A Firması');
    const year = parseInt(document.getElementById('reportSelectYil')?.value || '2026', 10);
    const month = parseInt(document.getElementById('reportSelectAy')?.value || '10', 10);
    const currentPeriod = getPeriodStr(year, month);
    const currentPeriodLabel = getPeriodTurkishLabel(currentPeriod);
    const kapsam = document.getElementById('reportKapsam')?.value || 'ALL';
    const labels = getSocialLabels();
    const nowStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const nowTimeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const allPeriodsSet = new Set();
    dbPersonel.forEach(p => {
        if (p.startSalary) allPeriodsSet.add(p.startSalary);
        if (p.startRent) allPeriodsSet.add(p.startRent);
    });
    dbPersonelPayments.forEach(pay => {
        if (pay.period) allPeriodsSet.add(pay.period);
    });
    allPeriodsSet.add(currentPeriod);

    const sortedPeriods = Array.from(allPeriodsSet).filter(p => /^\d{4}-\d{2}$/.test(p)).sort();
    const minPeriod = sortedPeriods[0] || currentPeriod;
    const expandedPeriods = [];
    let [curY, curM] = minPeriod.split('-').map(Number);
    const [targetY, targetM] = currentPeriod.split('-').map(Number);
    while (curY < targetY || (curY === targetY && curM <= targetM)) {
        expandedPeriods.push(getPeriodStr(curY, curM));
        curM++;
        if (curM > 12) { curM = 1; curY++; }
    }

    function calcPeriod(period) {
        let effSalary = 0, effS1 = 0, effS2 = 0, effS3 = 0, effRent = 0;
        let remSalary = 0, remS1 = 0, remS2 = 0, remS3 = 0, remRent = 0;
        let paidSalary = 0, paidS1 = 0, paidS2 = 0, paidS3 = 0, paidRent = 0, paidOther = 0;

        dbPersonel.forEach(p => {
            const pEffSalary = getEffectiveRate(p.code, 'MAAŞ', period);
            const pEffS1 = getEffectiveRate(p.code, 'SOSYAL-1', period);
            const pEffS2 = getEffectiveRate(p.code, 'SOSYAL-2', period);
            const pEffS3 = getEffectiveRate(p.code, 'SOSYAL-3', period);
            const pEffRent = getEffectiveRate(p.code, 'KİRA', period);

            effSalary += pEffSalary;
            effS1 += pEffS1;
            effS2 += pEffS2;
            effS3 += pEffS3;
            effRent += pEffRent;

            let pPaidSalary = 0, pPaidS1 = 0, pPaidS2 = 0, pPaidS3 = 0, pPaidRent = 0, pPaidOther = 0;
            dbPersonelPayments.forEach(pay => {
                if (pay.code === p.code && pay.period === period) {
                    const amt = Number(pay.amount) || 0;
                    if (pay.type === 'MAAŞ') pPaidSalary += amt;
                    else if (pay.type === 'SOSYAL-1') pPaidS1 += amt;
                    else if (pay.type === 'SOSYAL-2') pPaidS2 += amt;
                    else if (pay.type === 'SOSYAL-3') pPaidS3 += amt;
                    else if (pay.type === 'KİRA') pPaidRent += amt;
                    else pPaidOther += amt;
                }
            });

            paidSalary += pPaidSalary;
            paidS1 += pPaidS1;
            paidS2 += pPaidS2;
            paidS3 += pPaidS3;
            paidRent += pPaidRent;
            paidOther += pPaidOther;

            let leftOther = pPaidOther;
            let actSalary = Math.min(pEffSalary, pPaidSalary); leftOther += (pPaidSalary - actSalary);
            let needSalary = pEffSalary - actSalary; let extraSalary = Math.min(needSalary, leftOther); actSalary += extraSalary; leftOther -= extraSalary;
            let actS1 = Math.min(pEffS1, pPaidS1); leftOther += (pPaidS1 - actS1);
            let needS1 = pEffS1 - actS1; let extraS1 = Math.min(needS1, leftOther); actS1 += extraS1; leftOther -= extraS1;
            let actS2 = Math.min(pEffS2, pPaidS2); leftOther += (pPaidS2 - actS2);
            let needS2 = pEffS2 - actS2; let extraS2 = Math.min(needS2, leftOther); actS2 += extraS2; leftOther -= extraS2;
            let actS3 = Math.min(pEffS3, pPaidS3); leftOther += (pPaidS3 - actS3);
            let needS3 = pEffS3 - actS3; let extraS3 = Math.min(needS3, leftOther); actS3 += extraS3; leftOther -= extraS3;
            let actRent = Math.min(pEffRent, pPaidRent); leftOther += (pPaidRent - actRent);
            let needRent = pEffRent - actRent; let extraRent = Math.min(needRent, leftOther); actRent += extraRent; leftOther -= extraRent;

            remSalary += Math.max(0, pEffSalary - actSalary);
            remS1 += Math.max(0, pEffS1 - actS1);
            remS2 += Math.max(0, pEffS2 - actS2);
            remS3 += Math.max(0, pEffS3 - actS3);
            remRent += Math.max(0, pEffRent - actRent);
        });

        const totalEff = effSalary + effS1 + effS2 + effS3 + effRent;
        const totalPaid = paidSalary + paidS1 + paidS2 + paidS3 + paidRent + paidOther;
        const totalRem = remSalary + remS1 + remS2 + remS3 + remRent;

        return {
            period,
            label: getPeriodTurkishLabel(period),
            remSalary, remS1, remS2, remS3, remRent, totalRem,
            effSalary, effS1, effS2, effS3, effRent, totalEff,
            paidSalary, paidS1, paidS2, paidS3, paidRent, paidOther, totalPaid,
            hasS3: (effS3 > 0 || remS3 > 0)
        };
    }

    const pastDataList = [];
    expandedPeriods.forEach(p => {
        if (p < currentPeriod) pastDataList.push(calcPeriod(p));
    });
    const curData = calcPeriod(currentPeriod);
    const pastWithDebt = pastDataList.filter(d => d.totalRem > 0);
    const initialDebtTotal = (kapsam !== 'CURRENT_ONLY') ? dbPersonel.reduce((sum, p) => sum + (Number(p.initialDebt) || 0), 0) : 0;

    let totalPastDebt = initialDebtTotal;
    pastWithDebt.forEach(d => { totalPastDebt += d.totalRem; });
    const curRemaining = (kapsam !== 'PAST_ONLY') ? curData.totalRem : 0;
    const grandTotal = (kapsam === 'CURRENT_ONLY' ? 0 : totalPastDebt) + curRemaining;

    return {
        firmaAdi, year, month, currentPeriod, currentPeriodLabel,
        kapsam, labels, nowStr, nowTimeStr,
        pastWithDebt, curData, initialDebtTotal, totalPastDebt, curRemaining, grandTotal
    };
}

// ----------------------------------------------------------------------------
// 2. RENKLİ YÜKSEK ÇÖZÜNÜRLÜKLÜ TABLO GÖRSELİ (CANVAS RENDERER)
// ----------------------------------------------------------------------------
function generatePersonelReportCanvas() {
    const data = getCalculatedReportDataset();
    const canvasW = 740;

    function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke, lw) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        ctx.beginPath();
        ctx.moveTo(x + r.tl, y);
        ctx.lineTo(x + w - r.tr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        ctx.lineTo(x + w, y + h - r.br);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        ctx.lineTo(x + r.bl, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        ctx.lineTo(x, y + r.tl);
        ctx.quadraticCurveTo(x, y, x + r.tl, y);
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    }

    // Dinamik Yükseklik Hesabı
    let contentH = 105; // Header
    if (data.initialDebtTotal > 0 && data.kapsam !== 'CURRENT_ONLY') {
        contentH += 50; // Başlangıç devreden borcu
    }
    if (data.kapsam !== 'CURRENT_ONLY') {
        if (data.pastWithDebt.length > 0) {
            data.pastWithDebt.forEach(d => {
                contentH += (d.hasS3 ? 205 : 180) + 16;
            });
        } else {
            contentH += 60; // Geçmiş borç yok kartı
        }
    }
    if (data.kapsam !== 'PAST_ONLY') {
        contentH += (data.curData.hasS3 ? 205 : 180) + 16;
    }
    contentH += 82 + 16; // Genel Toplam Banner
    contentH += 40; // Footer
    const canvasH = Math.max(480, contentH);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW * 2;
    canvas.height = canvasH * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // 1. Ana Arka Plan
    const bgGrad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    bgGrad.addColorStop(0, '#0b1120');
    bgGrad.addColorStop(1, '#0f172a');
    drawRoundedRect(ctx, 0, 0, canvasW, canvasH, 20, bgGrad, '#1e293b', 2);

    // 2. Üst Başlık Kartı (Header Box)
    const headerGrad = ctx.createLinearGradient(20, 18, canvasW - 40, 78);
    headerGrad.addColorStop(0, '#1e293b');
    headerGrad.addColorStop(1, '#0f172a');
    drawRoundedRect(ctx, 20, 18, canvasW - 40, 74, 14, headerGrad, 'rgba(56, 189, 248, 0.25)', 1);

    // Header Sol: İkon Rozeti
    drawRoundedRect(ctx, 32, 29, 52, 52, 12, 'linear-gradient(135deg, #2563eb, #1d4ed8)', 'rgba(255,255,255,0.2)', 1);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₺', 58, 55);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // Header Sol: Firma & Rapor Başlığı
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(data.firmaAdi.toUpperCase(), 96, 47);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PERSONEL MAAŞ & GİDER HESAP ÖZETİ', 96, 67);

    // Header Sağ: Tarih & Dönem Rozetleri
    const badgeX = canvasW - 32;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Tarih: ' + data.nowStr, badgeX, 44);

    drawRoundedRect(ctx, badgeX - 150, 52, 150, 24, 6, 'rgba(56, 189, 248, 0.12)', 'rgba(56, 189, 248, 0.4)', 1);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Dönem: ' + data.currentPeriodLabel, badgeX - 10, 68);
    ctx.textAlign = 'left';

    let curY = 106;

    // Kart Çizim Yardımcısı
    function drawSectionCard(isPast, title, badgeText, periodData, subtotalLabel) {
        const cardX = 20;
        const cardW = canvasW - 40;
        const cardH = periodData.hasS3 ? 205 : 180;
        const accentColor = isPast ? '#f59e0b' : '#38bdf8';
        const accentBorder = isPast ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.35)';
        const headerBg = isPast ? 'rgba(245, 158, 11, 0.16)' : 'rgba(56, 189, 248, 0.16)';
        const subtotalBg = isPast ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)';

        // Kart Arka Planı
        drawRoundedRect(ctx, cardX, curY, cardW, cardH, 12, '#111c30', accentBorder, 1.2);

        // Başlık Bandı
        drawRoundedRect(ctx, cardX, curY, cardW, 36, { tl: 12, tr: 12, bl: 0, br: 0 }, headerBg, null, 0);

        // Başlık Metni
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(title, cardX + 14, curY + 23);

        // Başlık Sağ Rozeti
        ctx.textAlign = 'right';
        ctx.fillStyle = isPast ? '#fbbf24' : '#bae6fd';
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(badgeText, cardX + cardW - 14, curY + 23);
        ctx.textAlign = 'left';

        // Kalem Satırları
        const rows = [
            { badge: 'MAAŞ', badgeCol: '#f87171', badgeBg: 'rgba(239, 68, 68, 0.18)', label: 'Net Personel Maaşları', val: periodData.remSalary },
            { badge: (data.labels.sosyal1.toUpperCase().split(' ')[0] || 'SGK').substring(0, 8), badgeCol: '#38bdf8', badgeBg: 'rgba(56, 189, 248, 0.18)', label: data.labels.sosyal1, val: periodData.remS1 },
            { badge: (data.labels.sosyal2.toUpperCase().split(' ')[0] || 'VERGİ').substring(0, 8), badgeCol: '#c084fc', badgeBg: 'rgba(192, 132, 252, 0.18)', label: data.labels.sosyal2, val: periodData.remS2 }
        ];
        if (periodData.hasS3) {
            rows.push({ badge: (data.labels.sosyal3.toUpperCase().split(' ')[0] || 'EK').substring(0, 8), badgeCol: '#818cf8', badgeBg: 'rgba(129, 140, 248, 0.18)', label: data.labels.sosyal3, val: periodData.remS3 });
        }
        rows.push({ badge: 'KİRA', badgeCol: '#fbbf24', badgeBg: 'rgba(251, 191, 36, 0.18)', label: 'Mülk Kira Bedeli', val: periodData.remRent });

        let rowY = curY + 45;
        rows.forEach((r, idx) => {
            const itemH = 26;
            // Rozet
            drawRoundedRect(ctx, cardX + 14, rowY + 3, 58, 18, 5, r.badgeBg, null, 0);
            ctx.fillStyle = r.badgeCol;
            ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(r.badge, cardX + 14 + 29, rowY + 15);
            ctx.textAlign = 'left';

            // Etiket
            ctx.fillStyle = '#f1f5f9';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(r.label, cardX + 82, rowY + 16);

            // Tutar
            ctx.textAlign = 'right';
            if (r.val > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(formatTL(r.val), cardX + cardW - 14, rowY + 16);
            } else {
                ctx.fillStyle = '#64748b';
                ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText('₺0,00 (Ödendi)', cardX + cardW - 14, rowY + 16);
            }
            ctx.textAlign = 'left';

            // İnce Çizgi
            if (idx < rows.length - 1) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.beginPath();
                ctx.moveTo(cardX + 14, rowY + itemH);
                ctx.lineTo(cardX + cardW - 14, rowY + itemH);
                ctx.stroke();
            }

            rowY += itemH;
        });

        // Alt Toplam Çubuğu
        const subY = curY + cardH - 34;
        drawRoundedRect(ctx, cardX, subY, cardW, 34, { tl: 0, tr: 0, bl: 12, br: 12 }, subtotalBg, accentBorder, 1);

        ctx.fillStyle = isPast ? '#fef08a' : '#bae6fd';
        ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(subtotalLabel, cardX + 14, subY + 21);

        ctx.textAlign = 'right';
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(formatTL(periodData.totalRem), cardX + cardW - 14, subY + 22);
        ctx.textAlign = 'left';

        curY += cardH + 14;
    }

    // Devreden Başlangıç Borcu (Varsa)
    if (data.initialDebtTotal > 0 && data.kapsam !== 'CURRENT_ONLY') {
        const cardX = 20;
        const cardW = canvasW - 40;
        drawRoundedRect(ctx, cardX, curY, cardW, 36, 10, 'rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.4)', 1);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('💼 DEVREDEN BAŞLANGIÇ AÇILIŞ BORCU', cardX + 14, curY + 23);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(formatTL(data.initialDebtTotal), cardX + cardW - 14, curY + 23);
        ctx.textAlign = 'left';
        curY += 46;
    }

    // Geçmiş Aylar Borçları
    if (data.kapsam !== 'CURRENT_ONLY') {
        if (data.pastWithDebt.length > 0) {
            data.pastWithDebt.forEach(d => {
                drawSectionCard(true, '⚠️ GEÇMİŞ AY BORÇLARI — ' + d.label.toUpperCase(), 'ÖDENMEMİŞ KALAN BAKİYE', d, d.label.toUpperCase() + ' TOPLAM KALAN BORÇ');
            });
        } else {
            // Geçmiş Borç Yok Kartı
            const cardX = 20;
            const cardW = canvasW - 40;
            drawRoundedRect(ctx, cardX, curY, cardW, 46, 10, 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)', 1);
            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('✅ Geçmiş dönemlere ait gecikmiş/ödenmemiş borç bulunmamaktadır.', cardX + 16, curY + 28);
            curY += 58;
        }
    }

    // Cari Ay Borçları
    if (data.kapsam !== 'PAST_ONLY') {
        drawSectionCard(false, '📌 CARİ AY HESAP TABLOSU — ' + data.curData.label.toUpperCase(), 'CARİ DÖNEM TAHAKKUKU', data.curData, data.curData.label.toUpperCase() + ' CARİ AY TOPLAMI');
    }

    // GENEL ÖDENECEK TOPLAM BANNER
    const bannerX = 20;
    const bannerW = canvasW - 40;
    const bannerH = 74;
    const bannerGrad = ctx.createLinearGradient(bannerX, curY, bannerX + bannerW, curY + bannerH);
    bannerGrad.addColorStop(0, '#064e3b');
    bannerGrad.addColorStop(0.5, '#047857');
    bannerGrad.addColorStop(1, '#0f766e');
    drawRoundedRect(ctx, bannerX, curY, bannerW, bannerH, 14, bannerGrad, '#10b981', 1.8);

    // Banner Sol Bilgi
    ctx.fillStyle = '#ecfdf5';
    ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('💳 ÖDENECEK GENEL TOPLAM TUTAR', bannerX + 18, curY + 31);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Geçmiş Borçlar: ${formatTL(data.totalPastDebt)}   •   Cari Ay: ${formatTL(data.curRemaining)}`, bannerX + 18, curY + 53);

    // Banner Sağ Tutar
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(formatTL(data.grandTotal), bannerX + bannerW - 18, curY + 46);
    ctx.textAlign = 'left';

    curY += bannerH + 16;

    // Alt Bilgi (Footer)
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('🔒 Kurumsal Yönetim Sistemi • Resmi Finans Hesap Özeti', 24, curY + 12);

    ctx.textAlign = 'right';
    ctx.fillText(`${data.nowStr} ${data.nowTimeStr} • dgn systems`, canvasW - 24, curY + 12);
    ctx.textAlign = 'left';

    return canvas;
}

// ----------------------------------------------------------------------------
// 3. CANLI GÖRSEL ÖNİZLEME GÜNCELLEME
// ----------------------------------------------------------------------------
function updatePersonelReportVisualPreview() {
    try {
        const previewImg = document.getElementById('reportCardPreviewImg');
        if (!previewImg) return;
        const canvas = generatePersonelReportCanvas();
        if (canvas) {
            previewImg.src = canvas.toDataURL('image/png');
        }
    } catch (e) {
        console.error('Önizleme güncellenirken hata:', e);
    }
}

// ----------------------------------------------------------------------------
// 4. TABLO RESMİNİ KOPYALA
// ----------------------------------------------------------------------------
function copyReportTableAsImage() {
    try {
        const canvas = generatePersonelReportCanvas();
        if (!canvas) {
            showToast('Görsel oluşturulamadı.', 'error');
            return;
        }

        canvas.toBlob(function(blob) {
            if (!blob) {
                showToast('Görsel verisi alınamadı.', 'error');
                return;
            }
            if (navigator.clipboard && window.ClipboardItem) {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(function() {
                    showToast('📸 Renkli tablo resmi panoya kopyalandı! WhatsApp veya herhangi bir yere CTRL+V ile yapıştırabilirsiniz.');
                }).catch(function(err) {
                    console.warn('Clipboard write hatası, indirmeye yönlendiriliyor:', err);
                    downloadReportImage();
                });
            } else {
                downloadReportImage();
            }
        }, 'image/png');
    } catch (err) {
        console.error('Resim kopyalama hatası:', err);
        showToast('Resim kopyalanamadı.', 'error');
    }
}

// ----------------------------------------------------------------------------
// 5. RESMİ PNG OLARAK İNDİR
// ----------------------------------------------------------------------------
function downloadReportImage() {
    try {
        const canvas = generatePersonelReportCanvas();
        if (!canvas) return;
        const year = document.getElementById('reportSelectYil')?.value || '2026';
        const month = document.getElementById('reportSelectAy')?.value || '10';
        const link = document.createElement('a');
        link.download = `Maas_Gider_Raporu_${year}_${month}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('💾 Rapor görseli PNG olarak indirildi!');
    } catch (e) {
        console.error('İndirme hatası:', e);
        showToast('Görsel indirilemedi.', 'error');
    }
}

// ----------------------------------------------------------------------------
// 6. WHATSAPP İLE GÖNDER (RESMİ KOPYALA + SOHBETİ AÇ)
// ----------------------------------------------------------------------------
function sendReportToWhatsApp(mode) {
    const data = getCalculatedReportDataset();

    // 1. Resmi doğrudan panoya kopyala
    copyReportTableAsImage();

    // 2. Telefon numarasını temizle
    let phone = (document.getElementById('reportWhatsAppPhone')?.value || '').trim();
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
        phone = '90' + phone.substring(1);
    } else if (phone.length === 10) {
        phone = '90' + phone;
    }

    // Kısa, temiz ve kurumsal başlık mesajı
    const caption = `Sayın Yetkili, ${data.firmaAdi} - ${data.currentPeriodLabel} dönemi Personel Maaş & Gider Hesap Tablosu ekte yer almaktadır. Toplam Tutar: ${formatTL(data.grandTotal)}`;
    const encodedCaption = encodeURIComponent(caption);

    setTimeout(function() {
        if (phone && phone.length >= 10) {
            if (mode === 'web') {
                window.open('https://web.whatsapp.com/send?phone=' + phone + '&text=' + encodedCaption, '_blank');
            } else {
                window.location.href = 'whatsapp://send?phone=' + phone + '&text=' + encodedCaption;
            }
        } else {
            if (mode === 'web') {
                window.open('https://web.whatsapp.com/', '_blank');
            } else {
                window.location.href = 'whatsapp://send?text=' + encodedCaption;
            }
        }
        showToast('📸 Renkli tablo resmi panoya kopyalandı! WhatsApp açıldığında sohbette CTRL+V (Yapıştır) yaparak görseli hemen gönderebilirsiniz.');
    }, 250);
}

// ----------------------------------------------------------------------------
// 7. WHATSAPP METİN FORMATI OLUŞTURUCU (ALTERNATİF)
// ----------------------------------------------------------------------------
function generatePersonelWhatsAppReportText() {
    const data = getCalculatedReportDataset();

    function makeWhatsAppAsciiTable(items, totalLabel, totalVal) {
        const col1W = 18;
        const col2W = 12;

        function padR(s, l) {
            s = String(s || '');
            while (s.length < l) s += ' ';
            return s.substring(0, l);
        }
        function padL(s, l) {
            s = String(s || '');
            while (s.length < l) s = ' ' + s;
            return s.substring(s.length - l);
        }

        const sep = '+' + '-'.repeat(col1W + 2) + '+' + '-'.repeat(col2W + 2) + '+';
        const tLines = [];
        tLines.push('```');
        tLines.push(sep);
        tLines.push('| ' + padR('KALEM', col1W) + ' | ' + padL('KALAN TUTAR', col2W) + ' |');
        tLines.push(sep);
        items.forEach(it => {
            tLines.push('| ' + padR(it.label, col1W) + ' | ' + padL(it.val, col2W) + ' |');
        });
        tLines.push(sep);
        tLines.push('| ' + padR(totalLabel, col1W) + ' | ' + padL(totalVal, col2W) + ' |');
        tLines.push(sep);
        tLines.push('```');
        return tLines.join('\n');
    }

    function padLStr(s, l) {
        s = String(s || '');
        while (s.length < l) s = ' ' + s;
        return s.substring(s.length - l);
    }

    const lines = [];
    lines.push(`*${data.firmaAdi.toUpperCase()} - PERSONEL MAAŞ & GİDER RAPORU*`);
    lines.push(`Tarih: ${data.nowStr}`);
    lines.push(``);

    if (data.initialDebtTotal > 0 && data.kapsam !== 'CURRENT_ONLY') {
        lines.push(`*Devreden Açılış Borcu:* ${formatTL(data.initialDebtTotal)}`);
        lines.push(``);
    }

    // Geçmiş Aylar Tabloları
    if (data.kapsam !== 'CURRENT_ONLY') {
        if (data.pastWithDebt.length > 0) {
            data.pastWithDebt.forEach(d => {
                lines.push(`*1. GEÇMİŞ AY BORÇLARI (${d.label.toUpperCase()})*`);
                const items = [
                    { label: 'Net Maaş', val: formatTL(d.remSalary) },
                    { label: data.labels.sosyal1, val: formatTL(d.remS1) },
                    { label: data.labels.sosyal2, val: formatTL(d.remS2) }
                ];
                if (d.hasS3) {
                    items.push({ label: data.labels.sosyal3, val: formatTL(d.remS3) });
                }
                items.push({ label: 'Kira Bedeli', val: formatTL(d.remRent) });

                lines.push(makeWhatsAppAsciiTable(items, `${d.label.toUpperCase()} TOPLAM`, formatTL(d.totalRem)));
                lines.push(``);
            });
        } else {
            lines.push(`*1. GEÇMİŞ AY BORÇLARI*`);
            lines.push(`Geçmiş aylara ait ödenmemiş borç yoktur.`);
            lines.push(``);
        }
    }

    // Cari Ay Tablosu
    if (data.kapsam !== 'PAST_ONLY') {
        lines.push(`*2. CARİ AY BORÇLARI (${data.curData.label.toUpperCase()})*`);
        const curItems = [
            { label: 'Net Maaş', val: formatTL(data.curData.remSalary) },
            { label: data.labels.sosyal1, val: formatTL(data.curData.remS1) },
            { label: data.labels.sosyal2, val: formatTL(data.curData.remS2) }
        ];
        if (data.curData.hasS3) {
            curItems.push({ label: data.labels.sosyal3, val: formatTL(data.curData.remS3) });
        }
        curItems.push({ label: 'Kira Bedeli', val: formatTL(data.curData.remRent) });

        lines.push(makeWhatsAppAsciiTable(curItems, `${data.curData.label.toUpperCase()} TOPLAM`, formatTL(data.curData.totalRem)));
        lines.push(``);
    }

    // Genel Özet
    lines.push(`*GENEL ÖZET*`);
    const summaryLines = [
        '```',
        '==================================',
        '  Geçmiş Borçlar : ' + padLStr(formatTL(data.totalPastDebt), 14),
        '  Cari Ay Borcu  : ' + padLStr(formatTL(data.curRemaining), 14),
        '==================================',
        '  TOPLAM ÖDENECEK: ' + padLStr(formatTL(data.grandTotal), 14),
        '==================================',
        '```'
    ];
    lines.push(summaryLines.join('\n'));
    lines.push(``);
    lines.push(`Bilgilerinize arz olunur.`);

    const fullMessage = lines.join('\n');
    const msgEl = document.getElementById('reportMessageText');
    if (msgEl) {
        msgEl.value = fullMessage;
    }
    updateReportCharCount();

    // Canlı görsel önizlemeyi de anında yenile
    updatePersonelReportVisualPreview();
}

function copyReportTextToClipboard(silent) {
    const textEl = document.getElementById('reportMessageText');
    if (!textEl || !textEl.value) {
        if (!silent) showToast('Kopyalanacak metin bulunamadı.', 'error');
        return false;
    }
    textEl.select();
    let success = false;
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textEl.value);
            success = true;
        } else {
            document.execCommand('copy');
            success = true;
        }
        if (!silent) {
            showToast('📋 Rapor metni panoya kopyalandı! WhatsApp veya SMS ile paylaşabilirsiniz.');
        }
    } catch (err) {
        if (!silent) showToast('Kopyalama başarısız oldu.', 'error');
    }
    return success;
}

function printReportText() {
    const text = document.getElementById('reportMessageText')?.value || '';
    if (!text) return;
    const printWindow = window.open('', '_blank', 'width=750,height=850');
    const htmlFormatted = text
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>Personel Maaş ve Gider Raporu</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; line-height: 1.6; color: #0f172a; font-size: 13px; background: #ffffff; }
                strong { font-weight: 700; color: #000000; }
                @media print { body { padding: 10px; } }
            </style>
        </head>
        <body>
            <div style="max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                ${htmlFormatted}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 400);
}
