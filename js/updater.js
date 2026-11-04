// ============================================================================
// SİSTEM GÜNCELLEME VE SÜRÜM YÖNETİM MODÜLÜ (DGN • SYSTEMS)
// ============================================================================

const APP_CURRENT_VERSION = "1.1.0";
const APP_VERSION_DATE = "04.11.2026";
const APP_VERSION_TITLE = "v1.1.0 (WhatsApp Tablo Raporlu Stabil Sürüm)";

// Varsayılan Güncelleme Kontrol Adresi (Fatih Dugan - GitHub Deposu)
let appUpdateUrl = localStorage.getItem('app_custom_update_url') || "https://raw.githubusercontent.com/fatihhd4006-dd/kurumsal-yonetim-sistemi/main/version.json";
const GITHUB_REPO_URL = "https://github.com/fatihhd4006-dd/kurumsal-yonetim-sistemi";

function getCurrentAppVersion() {
    return APP_CURRENT_VERSION;
}

function updateVersionBadgeUI() {
    const badge = document.getElementById("badgeAppVersion");
    if (badge) badge.innerText = "Sürüm v" + APP_CURRENT_VERSION;
    
    const verDisplay = document.getElementById("lblCurrentVersionText");
    if (verDisplay) verDisplay.innerText = "Mevcut Sürüm: v" + APP_CURRENT_VERSION + " (" + APP_VERSION_DATE + ")";
}

// Semantik sürüm karşılaştırma (v1.2.0 > v1.1.0)
function compareVersions(vA, vB) {
    if (!vA || !vB) return 0;
    const cleanA = vA.replace(/[^0-9.]/g, '').split('.').map(Number);
    const cleanB = vB.replace(/[^0-9.]/g, '').split('.').map(Number);
    const maxLen = Math.max(cleanA.length, cleanB.length);
    for (let i = 0; i < maxLen; i++) {
        const numA = cleanA[i] || 0;
        const numB = cleanB[i] || 0;
        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }
    return 0;
}

// ----------------------------------------------------------------------------
// 1. İNTERNETTEN GÜNCELLEMELERİ DENETLE
// ----------------------------------------------------------------------------
async function checkSystemUpdates(isManual = true) {
    const btn = document.getElementById("btnCheckUpdates");
    const statusBox = document.getElementById("updateStatusAlert");
    const timeLabel = document.getElementById("lblUpdateCheckTime");

    const now = new Date();
    const timeStr = now.toLocaleDateString("tr-TR") + " " + now.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });
    if (timeLabel) timeLabel.innerHTML = `Son Kontrol: <strong>${timeStr}</strong>`;
    localStorage.setItem("app_last_update_check", timeStr);

    if (btn && isManual) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Denetleniyor...`;
    }

    if (statusBox && isManual) {
        statusBox.style.display = "block";
        statusBox.style.background = "rgba(56, 189, 248, 0.08)";
        statusBox.style.border = "1px solid rgba(56, 189, 248, 0.3)";
        statusBox.style.color = "#38bdf8";
        statusBox.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 8px;"></i>Sunucuya bağlanılıyor, sürüm bilgisi kontrol ediliyor...`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5 sn timeout

    try {
        // Cache bypass için zaman damgası ekle
        const fetchUrl = appUpdateUrl + (appUpdateUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
        const response = await fetch(fetchUrl, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Sunucu yanıt vermedi (HTTP ${response.status})`);
        }

        const manifest = await response.json();
        const remoteVersion = manifest.version || "1.0.0";
        const hasUpdate = compareVersions(remoteVersion, APP_CURRENT_VERSION) > 0;

        if (hasUpdate) {
            showUpdateAvailableUI(manifest);
        } else {
            if (statusBox) {
                statusBox.style.display = "block";
                statusBox.style.background = "rgba(16, 185, 129, 0.1)";
                statusBox.style.border = "1px solid #10b981";
                statusBox.style.color = "#10b981";
                statusBox.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <strong><i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i>Sisteminiz Güncel!</strong>
                            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">En son stabil sürümü (v${APP_CURRENT_VERSION}) kullanıyorsunuz.</div>
                        </div>
                        <span class="badge-pill badge-success" style="font-size: 11px;">v${APP_CURRENT_VERSION}</span>
                    </div>
                `;
            }
            if (isManual) showToast(`Sisteminiz güncel! (v${APP_CURRENT_VERSION})`);
        }
    } catch (err) {
        clearTimeout(timeoutId);
        if (isManual) {
            if (statusBox) {
                statusBox.style.display = "block";
                statusBox.style.background = "rgba(245, 158, 11, 0.1)";
                statusBox.style.border = "1px solid rgba(245, 158, 11, 0.4)";
                statusBox.style.color = "#fbbf24";
                statusBox.innerHTML = `
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 16px; margin-top: 2px;"></i>
                        <div>
                            <strong>İnternet Bağlantısı Kurulamadı</strong>
                            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 3px; line-height: 1.5;">
                                Güncelleme sunucusuna erişilemedi. Sisteminiz mevcut <strong>v${APP_CURRENT_VERSION}</strong> sürümü ile çevrimdışı (offline) olarak eksiksiz çalışmaya devam etmektedir.
                            </div>
                        </div>
                    </div>
                `;
            }
            showToast("Çevrimdışı mod: Güncelleme sunucusuna bağlanılamadı.");
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-down" style="font-size: 15px;"></i><span>İnternetten Güncellemeleri Denetle</span>`;
        }
    }
}

function showUpdateAvailableUI(manifest) {
    const statusBox = document.getElementById("updateStatusAlert");
    if (!statusBox) return;

    let notesHtml = "";
    if (manifest.notes && Array.isArray(manifest.notes)) {
        notesHtml = manifest.notes.map(n => `<li>${n}</li>`).join("");
    } else {
        notesHtml = `<li>Genel sistem ve performans iyileştirmeleri.</li>`;
    }

    statusBox.style.display = "block";
    statusBox.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.08))";
    statusBox.style.border = "1.5px solid #10b981";
    statusBox.style.color = "var(--text-main)";

    statusBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 800; font-size: 14px; color: #10b981; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-rocket" style="font-size: 16px;"></i> Yeni Güncelleme Yayında: v${manifest.version}
            </div>
            <span class="badge-pill badge-success" style="font-size: 11px;">${manifest.releaseDate || 'Yeni Sürüm'}</span>
        </div>
        
        <div style="font-weight: 700; font-size: 12.5px; color: var(--accent-gold); margin-bottom: 6px;">
            ${manifest.title || 'Sistem Güncellemesi'}
        </div>

        <ul style="margin: 0 0 12px 18px; font-size: 12px; color: var(--text-muted); line-height: 1.6;">
            ${notesHtml}
        </ul>

        <div style="background: rgba(0,0,0,0.2); border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #38bdf8; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Verileriniz güvendedir: Kayıtlı öğrenciler, maaşlar ve kurum bilgileriniz asla silinmez.</span>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-success" onclick="startSystemUpdateDownload('${manifest.downloadUrl || ''}')" style="background: linear-gradient(135deg, #10b981, #059669); font-weight: 700; padding: 8px 16px;">
                <i class="fa-solid fa-download"></i> Güncellemeyi İndir / Yükle
            </button>
            <button type="button" class="btn btn-subtle" onclick="document.getElementById('updateStatusAlert').style.display='none'">
                Daha Sonra
            </button>
        </div>
    `;

    // Menüde Ayarlar sekmesine kırmızı bildirim rozeti ekle
    const navAyarlar = document.getElementById("nav-ayarlar");
    if (navAyarlar && !document.getElementById("updateNavDot")) {
        const dot = document.createElement("span");
        dot.id = "updateNavDot";
        dot.style.cssText = "width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; margin-left: auto; box-shadow: 0 0 8px #ef4444;";
        dot.title = "Yeni Güncelleme Mevcut!";
        navAyarlar.appendChild(dot);
    }
}

// ----------------------------------------------------------------------------
// 2. PAKET DOSYASI İLE MANUEL GÜNCELLEME (WHATSAPP'TAN GELEN DOSYA)
// ----------------------------------------------------------------------------
function applyUpdatePackage(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.appName || !data.version) {
                showToast("Geçersiz güncelleme paketi! Dosya tanınamadı.", "error");
                return;
            }

            const isNewer = compareVersions(data.version, APP_CURRENT_VERSION) > 0;
            const msg = isNewer 
                ? `Yüklenen Sürüm: v${data.version}\nMevcut Sürüm: v${APP_CURRENT_VERSION}\n\nBu güncelleme paketini uygulamak istiyor musunuz?`
                : `Yüklenen Sürüm: v${data.version}\nMevcut Sürüm: v${APP_CURRENT_VERSION}\n\nSürüm eşit veya daha eski. Yine de yenilemek istiyor musunuz?`;

            if (confirm(msg)) {
                // Eğer paket içinde özel ayar veya veri formatı güncellemeleri varsa uygula
                if (data.patchData && typeof data.patchData === 'object') {
                    Object.keys(data.patchData).forEach(k => {
                        localStorage.setItem(k, JSON.stringify(data.patchData[k]));
                    });
                }

                localStorage.setItem("app_installed_version", data.version);
                showToast(`✅ v${data.version} güncellemesi başarıyla yüklendi! Sayfa yenileniyor...`);
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            }
        } catch (err) {
            showToast("Güncelleme dosyası okunamadı: " + err.message, "error");
        }
    };
    reader.readAsText(file, "UTF-8");
    event.target.value = "";
}

function startSystemUpdateDownload(downloadUrl) {
    const targetUrl = (downloadUrl && downloadUrl.startsWith("http")) ? downloadUrl : GITHUB_REPO_URL;
    window.open(targetUrl, "_blank");
    showToast("GitHub güncelleme sayfası açılıyor...");
}

// Uygulama açıldığında sessiz kontrol (Arka planda 3 sn sonra)
window.addEventListener("DOMContentLoaded", () => {
    updateVersionBadgeUI();
    const lastCheck = localStorage.getItem("app_last_update_check");
    const timeLabel = document.getElementById("lblUpdateCheckTime");
    if (timeLabel && lastCheck) {
        timeLabel.innerHTML = `Son Kontrol: <strong>${lastCheck}</strong>`;
    }

    setTimeout(() => {
        checkSystemUpdates(false); // Sessiz kontrol
    }, 2500);
});
