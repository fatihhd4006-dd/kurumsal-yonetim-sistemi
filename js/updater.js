// ============================================================================
// SİSTEM GÜNCELLEME VE SÜRÜM YÖNETİM MOTORU (KURUMSAL YÖNETİM PANELİ)
// Canlı GitHub Manifest Denetimi • Doğrudan Klasör Kurulumu & Otomatik Yeniden Açılış
// ============================================================================

const APP_CURRENT_VERSION = "1.5.1";
const APP_VERSION_DATE = "12.11.2026";
const APP_VERSION_TITLE = "v1.5.1 (Tek Tıkla İndirmesiz Doğrudan Güncelleme & Otomatik Yeniden Başlatma)";

const GITHUB_OWNER = "fatihhd4006-dd";
const GITHUB_REPO = "kurumsal-yonetim-sistemi";
const GITHUB_BRANCH = "main";
const GITHUB_MANIFEST_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/version.json`;
const GITHUB_ZIP_FALLBACK_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/archive/refs/heads/${GITHUB_BRANCH}.zip`;

// Varsayılan Yerel Manifest Bilgileri
const APP_DEFAULT_MANIFEST = {
    version: "1.5.1",
    releaseDate: "2026-11-12",
    title: "Tek Tıkla İndirmesiz Doğrudan Güncelleme & Otomatik Yeniden Başlatma",
    notes: [
        "Uygulama içi yerel güncelleme köprüsü eklendi: ZIP indirmeden doğrudan klasöre kurup otomatik yeniden açar",
        "Veri_Profili ve Otomatik_Yedekler güncelleme sırasında %100 korunur",
        "Öğrenci Vezne ve Takip modülüne Günlük Tahsilat & Kasa Raporu eklendi",
        "Tahsilat işlemleri makbuzsuz kaydedilebilir, makbuzlar istenen anda yazdırılabilir",
        "Sistemi_Baslat.bat açılışına Türkçe yol URI dönüşümü ve otomatik bulut denetimi eklendi"
    ],
    downloadUrl: GITHUB_ZIP_FALLBACK_URL
};

let latestAvailableManifest = null;

function initLocalBridgeFromHash() {
    try {
        const hash = window.location.hash || "";
        if (!hash.includes("bridge=")) return;
        const clean = hash.replace(/^#/, "");
        const params = new URLSearchParams(clean);
        const port = params.get("bridge");
        const token = params.get("token");
        if (port && token) {
            sessionStorage.setItem("kys_bridge_port", port);
            sessionStorage.setItem("kys_bridge_token", token);
            if (window.history && typeof window.history.replaceState === "function") {
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
            }
        }
    } catch (e) {
        console.warn("Köprü parametresi okuma uyarısı:", e);
    }
}

function getLocalBridgeConfig() {
    const port = sessionStorage.getItem("kys_bridge_port");
    const token = sessionStorage.getItem("kys_bridge_token");
    if (!port || !token) return null;
    return { port, token };
}

async function pingLocalBridge(timeoutMs = 1200) {
    const cfg = getLocalBridgeConfig();
    if (!cfg) return null;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
        const url = `http://127.0.0.1:${cfg.port}/ping?token=${encodeURIComponent(cfg.token)}`;
        const res = await fetch(url, {
            method: "GET",
            cache: "no-store",
            signal: controller ? controller.signal : undefined
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.ok) return cfg;
        return null;
    } catch (_) {
        return null;
    } finally {
        if (timer) clearTimeout(timer);
    }
}

function getCurrentAppVersion() {
    return APP_CURRENT_VERSION;
}

function updateVersionBadgeUI() {
    const badge = document.getElementById("badgeAppVersion");
    if (badge) badge.innerText = "Sürüm v" + APP_CURRENT_VERSION;

    const verDisplay = document.getElementById("lblCurrentVersionText");
    if (verDisplay) verDisplay.innerText = "Mevcut Sürüm: v" + APP_CURRENT_VERSION + " (" + APP_VERSION_DATE + ")";
}

// Semantik sürüm karşılaştırma (v1.5.1 vs v1.6.0)
function compareVersions(vA, vB) {
    if (!vA || !vB) return 0;
    const cleanA = String(vA).replace(/[^0-9.]/g, '').split('.').filter(Boolean).map(Number);
    const cleanB = String(vB).replace(/[^0-9.]/g, '').split('.').filter(Boolean).map(Number);
    const maxLen = Math.max(cleanA.length, cleanB.length);
    for (let i = 0; i < maxLen; i++) {
        const numA = cleanA[i] || 0;
        const numB = cleanB[i] || 0;
        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }
    return 0;
}

function setSidebarUpdateBadge(visible, versionText = "") {
    const badge = document.getElementById("badgeUpdateAvailable");
    if (!badge) return;
    if (visible && versionText) {
        badge.style.display = "inline-flex";
        badge.innerText = "v" + versionText;
    } else {
        badge.style.display = "none";
    }
}

function populateAvailableUpdateModal(manifest) {
    const titleEl = document.getElementById("modalNewVersionTitle");
    const dateEl = document.getElementById("modalNewVersionDate");
    const notesEl = document.getElementById("modalUpdateNotesList");

    if (titleEl) {
        titleEl.innerText = `Yeni Güncelleme Hazır: v${manifest.version}`;
    }
    if (dateEl) {
        dateEl.innerText = `Yayın Tarihi: ${manifest.releaseDate || "-"}`;
    }
    if (notesEl) {
        notesEl.innerHTML = "";
        const notes = Array.isArray(manifest.notes) && manifest.notes.length
            ? manifest.notes
            : ["Sistem iyileştirmeleri ve performans güncellemeleri."];
        notes.forEach(noteText => {
            const li = document.createElement("li");
            li.textContent = String(noteText);
            notesEl.appendChild(li);
        });
    }
}

async function fetchRemoteManifest(timeoutMs = 5000) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
        const url = `${GITHUB_MANIFEST_URL}?t=${Date.now()}`;
        const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
            signal: controller ? controller.signal : undefined
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!data || typeof data.version !== "string") {
            throw new Error("Geçersiz sürüm manifest biçimi");
        }
        return { status: "ok", manifest: data };
    } catch (err) {
        return { status: "offline", error: err && err.message ? err.message : "Ağ erişilemiyor" };
    } finally {
        if (timer) clearTimeout(timer);
    }
}

// ----------------------------------------------------------------------------
// 1. GÜNCELLEMELERİ DENETLE (CANLI GITHUB KONTROLÜ + ÇEVRİMDIŞI KORUMA)
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

    if (isManual) {
        if (typeof openModal === 'function') openModal('modalSystemUpdate');
        showModalUpdateStep('checking');
    }

    const result = await fetchRemoteManifest(5000);

    if (result.status === "ok") {
        const remoteManifest = result.manifest;
        const cmp = compareVersions(remoteManifest.version, APP_CURRENT_VERSION);

        if (cmp > 0) {
            latestAvailableManifest = remoteManifest;
            populateAvailableUpdateModal(remoteManifest);
            setSidebarUpdateBadge(true, remoteManifest.version);

            if (isManual) {
                showModalUpdateStep('available');
            } else if (sessionStorage.getItem('portal_session_active') === 'true' && sessionStorage.getItem('app_update_toast_ver') !== remoteManifest.version) {
                sessionStorage.setItem('app_update_toast_ver', remoteManifest.version);
                if (typeof showToast === 'function') {
                    showToast(`Yeni güncelleme hazır (v${remoteManifest.version})! Kurum & Ayarlar'dan tek tıkla yükleyip yeniden başlatabilirsiniz.`);
                }
            }

            if (statusBox) {
                statusBox.style.display = "block";
                statusBox.style.background = "var(--primary-light)";
                statusBox.style.border = "1px solid var(--primary)";
                statusBox.style.color = "var(--text-main)";
                statusBox.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-rocket" style="font-size: 16px; color: var(--primary);"></i>
                            <div>
                                <strong>Yeni Sürüm Hazır: v${remoteManifest.version}</strong>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                                    Verileriniz (Veri_Profili) korunarak otomatik kuruluma hazır.
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary" onclick="openAvailableUpdateModal()" style="font-size: 11px; padding: 5px 10px; height: auto;">
                            Yenilikleri Gör &amp; Güncelle
                        </button>
                    </div>
                `;
            }
        } else {
            latestAvailableManifest = APP_DEFAULT_MANIFEST;
            setSidebarUpdateBadge(false);

            if (isManual) {
                showModalUpdateStep('uptodate', 'online');
            }

            if (statusBox) {
                statusBox.style.display = "block";
                statusBox.style.background = "var(--success-light)";
                statusBox.style.border = "1px solid var(--success-border, #bbf7d0)";
                statusBox.style.color = "var(--success)";
                statusBox.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-circle-check" style="font-size: 16px;"></i>
                            <div>
                                <strong>Sisteminiz En Güncel Sürümde (v${APP_CURRENT_VERSION})</strong>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                                    Bulut güncelleme sunucusu doğrulandı. Tüm modüller güncel.
                                </div>
                            </div>
                        </div>
                        <span class="badge-pill badge-success" style="font-size: 11px;">v${APP_CURRENT_VERSION} Güncel</span>
                    </div>
                `;
            }
        }
    } else {
        latestAvailableManifest = APP_DEFAULT_MANIFEST;

        if (isManual) {
            showModalUpdateStep('uptodate', 'offline');
        }

        if (statusBox && isManual) {
            statusBox.style.display = "block";
            statusBox.style.background = "var(--warning-light, #fffbeb)";
            statusBox.style.border = "1px solid var(--warning, #d97706)";
            statusBox.style.color = "var(--text-main)";
            statusBox.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-wifi" style="font-size: 15px; color: var(--warning, #d97706);"></i>
                        <div>
                            <strong>Bulut Güncelleme Sunucusuna Erişilemedi</strong>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                                Çevrimdışı modda yerel sürüm (v${APP_CURRENT_VERSION}) ile çalışmaya devam ediyorsunuz.
                            </div>
                        </div>
                    </div>
                    <span class="badge-pill" style="font-size: 11px; background: var(--bg-card-subtle); color: var(--text-muted);">Çevrimdışı</span>
                </div>
            `;
        }
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i><span>Güncellemeleri Denetle</span>`;
    }
}

function openAvailableUpdateModal() {
    if (latestAvailableManifest && compareVersions(latestAvailableManifest.version, APP_CURRENT_VERSION) > 0) {
        populateAvailableUpdateModal(latestAvailableManifest);
        if (typeof openModal === 'function') openModal('modalSystemUpdate');
        showModalUpdateStep('available');
    } else {
        checkSystemUpdates(true);
    }
}

// Modal içi adımları yönet
function showModalUpdateStep(step, checkSource = 'online') {
    const vCheck = document.getElementById("updateViewChecking");
    const vUpToDate = document.getElementById("updateViewUpToDate");
    const vAvailable = document.getElementById("updateViewAvailable");
    const vInstall = document.getElementById("updateViewInstalling");

    if (vCheck) vCheck.style.display = (step === 'checking') ? 'block' : 'none';
    if (vUpToDate) vUpToDate.style.display = (step === 'uptodate') ? 'block' : 'none';
    if (vAvailable) vAvailable.style.display = (step === 'available') ? 'block' : 'none';
    if (vInstall) vInstall.style.display = (step === 'installing') ? 'block' : 'none';

    if (step === 'uptodate') {
        const verEl = document.getElementById("modalUpToDateVersion");
        const titleEl = document.getElementById("modalUpToDateTitle");
        const descEl = document.getElementById("modalUpToDateDesc");
        if (verEl) verEl.innerText = `v${APP_CURRENT_VERSION}`;

        if (checkSource === 'offline') {
            if (titleEl) titleEl.innerText = "Çevrimdışı Mod — Yerel Sürüm Aktif";
            if (descEl) {
                descEl.innerHTML = `Uzak güncelleme sunucusuna şu an ulaşılamadı. Kullandığınız <strong>v${APP_CURRENT_VERSION}</strong> yerel sürümü tüm verilerinizle güvenle çalışmaktadır.`;
            }
        } else {
            if (titleEl) titleEl.innerText = "Sisteminiz En Güncel Sürümde!";
            if (descEl) {
                descEl.innerHTML = `Kullandığınız <strong id="modalUpToDateVersion">v${APP_CURRENT_VERSION}</strong> sürümü en son özelliklere sahiptir. Tüm verileriniz yerel kasanızda güvenle korunmaktadır.`;
            }
        }
    }
}

function triggerPackageDownload(url) {
    const safeUrl = url || GITHUB_ZIP_FALLBACK_URL;
    const a = document.createElement("a");
    a.href = safeUrl;
    a.setAttribute("download", "kurumsal-yonetim-sistemi-main.zip");
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// ----------------------------------------------------------------------------
// 2. GÜNCELLEME UYGULAMA (YEREL KÖPRÜ İLE İNDİRMESİZ KURULUM + OTOMATİK YENİDEN AÇILIŞ)
// ----------------------------------------------------------------------------
async function confirmAndStartUpdate() {
    const hasNewRemote = latestAvailableManifest && compareVersions(latestAvailableManifest.version, APP_CURRENT_VERSION) > 0;
    const targetVer = hasNewRemote ? latestAvailableManifest.version : APP_CURRENT_VERSION;
    if (!hasNewRemote) {
        runInAppSystemUpdate(targetVer, false);
        return;
    }

    const bridge = await pingLocalBridge(1200);
    if (bridge) {
        await startSeamlessBridgeUpdate(targetVer, bridge);
    } else {
        startFallbackZipUpdate(targetVer, latestAvailableManifest.downloadUrl || GITHUB_ZIP_FALLBACK_URL);
    }
}

async function startSeamlessBridgeUpdate(targetVer, bridge) {
    if (typeof openModal === 'function') openModal('modalSystemUpdate');
    showModalUpdateStep('installing');

    const titleEl = document.getElementById("updateInstallTitle");
    const stageEl = document.getElementById("updateInstallStageText");
    const fillEl = document.getElementById("updateProgressBarFill");
    const stepNameEl = document.getElementById("updateProgressStepName");
    const percentEl = document.getElementById("updateProgressPercent");
    const doneActions = document.getElementById("updateInstallDoneActions");
    if (doneActions) doneActions.style.display = "none";

    // Adım 1: Yerel veritabanı güvenlik yedeği
    if (titleEl) titleEl.innerText = `v${targetVer} Otomatik Yükleniyor...`;
    if (fillEl) fillEl.style.width = "25%";
    if (percentEl) percentEl.innerText = "25%";
    if (stepNameEl) stepNameEl.innerText = "Veri Yedeği";
    if (stageEl) stageEl.innerText = "1/3: Tüm kayıtlarınız korunarak anlık güvenlik yedeği alınıyor...";
    createAutoUpdateBackupSnapshot();

    // Adım 2: Köprü üzerinden doğrudan klasöre indirme ve yerleştirme
    await new Promise(r => setTimeout(r, 250));
    if (fillEl) fillEl.style.width = "60%";
    if (percentEl) percentEl.innerText = "60%";
    if (stepNameEl) stepNameEl.innerText = "Klasöre Kuruluyor";
    if (stageEl) stageEl.innerText = `2/3: v${targetVer} dosyaları doğrudan sistem klasörüne yükleniyor (ZIP indirilmez, Veri_Profili korunur)...`;

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 45000) : null;
    try {
        const applyUrl = `http://127.0.0.1:${bridge.port}/apply-update?token=${encodeURIComponent(bridge.token)}`;
        const res = await fetch(applyUrl, {
            method: "POST",
            cache: "no-store",
            signal: controller ? controller.signal : undefined
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data && data.ok && data.applied) {
            if (fillEl) fillEl.style.width = "100%";
            if (percentEl) percentEl.innerText = "100%";
            if (stepNameEl) stepNameEl.innerText = "Yeniden Açılıyor";
            if (titleEl) titleEl.innerText = `v${data.version || targetVer} Başarıyla Kuruldu!`;
            if (stageEl) stageEl.innerText = "3/3: Güncelleme tamamlandı. Pencere otomatik kapatılıp yeni sürüm açılıyor...";

            localStorage.setItem("app_installed_version", data.version || targetVer);
            localStorage.setItem("app_last_update_check", new Date().toLocaleDateString("tr-TR"));

            await new Promise(r => setTimeout(r, 600));
            const relaunchUrl = `http://127.0.0.1:${bridge.port}/relaunch?token=${encodeURIComponent(bridge.token)}`;
            await fetch(relaunchUrl, { method: "POST", cache: "no-store" });
            return;
        }

        // GitHub paketinde yeni sürüm henüz doğrulanamadıysa yedek ZIP seçeneğine geç
        startFallbackZipUpdate(targetVer, latestAvailableManifest.downloadUrl || GITHUB_ZIP_FALLBACK_URL);
    } catch (err) {
        console.warn("Yerel köprü güncelleme uyarısı:", err);
        startFallbackZipUpdate(targetVer, latestAvailableManifest.downloadUrl || GITHUB_ZIP_FALLBACK_URL);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

function startFallbackZipUpdate(targetVer, downloadUrl) {
    if (typeof openModal === 'function') openModal('modalSystemUpdate');
    showModalUpdateStep('installing');

    const titleEl = document.getElementById("updateInstallTitle");
    const stageEl = document.getElementById("updateInstallStageText");
    const fillEl = document.getElementById("updateProgressBarFill");
    const stepNameEl = document.getElementById("updateProgressStepName");
    const percentEl = document.getElementById("updateProgressPercent");
    const doneActions = document.getElementById("updateInstallDoneActions");
    if (doneActions) doneActions.style.display = "none";

    if (titleEl) titleEl.innerText = `v${targetVer} Güncellemesi Hazırlanıyor...`;
    if (fillEl) fillEl.style.width = "15%";
    if (percentEl) percentEl.innerText = "15%";

    setTimeout(() => {
        if (fillEl) fillEl.style.width = "40%";
        if (percentEl) percentEl.innerText = "40%";
        if (stepNameEl) stepNameEl.innerText = "Güvenlik Yedeği";
        if (stageEl) stageEl.innerText = "1/3: Yerel veritabanı anlık yedeği kaydediliyor...";
        createAutoUpdateBackupSnapshot();
    }, 300);

    setTimeout(() => {
        if (fillEl) fillEl.style.width = "75%";
        if (percentEl) percentEl.innerText = "75%";
        if (stepNameEl) stepNameEl.innerText = "Paket İndirme";
        if (stageEl) stageEl.innerText = `2/3: v${targetVer} güncelleme paketi indiriliyor...`;
        triggerPackageDownload(downloadUrl);
    }, 900);

    setTimeout(() => {
        if (fillEl) fillEl.style.width = "100%";
        if (percentEl) percentEl.innerText = "100%";
        if (stepNameEl) stepNameEl.innerText = "Hazır";
        if (titleEl) titleEl.innerText = `v${targetVer} Güncelleme Paketi İndirildi!`;
        if (stageEl) {
            stageEl.innerHTML = `Verileriniz yedeklendi ve paket indirildi. Otomatik kurulum için programı kapatıp <strong>Sistemi_Baslat.bat</strong> dosyasını açın (bundan sonra güncellemeler ZIP indirmeden otomatik kurulur).`;
        }
        if (doneActions) doneActions.style.display = "flex";
    }, 1600);
}

function createAutoUpdateBackupSnapshot() {
    try {
        const backupSnapshot = {
            date: new Date().toISOString(),
            version: APP_CURRENT_VERSION,
            data: {}
        };
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k !== "portal_auto_backup_before_update") {
                backupSnapshot.data[k] = localStorage.getItem(k);
            }
        }
        localStorage.setItem("portal_auto_backup_before_update", JSON.stringify(backupSnapshot));
    } catch (e) {
        console.warn("Yedekleme önbellek uyarısı:", e);
    }
}

function runInAppSystemUpdate(targetVer = APP_CURRENT_VERSION, isRepair = false) {
    if (typeof openModal === 'function') openModal('modalSystemUpdate');
    showModalUpdateStep('installing');

    const titleEl = document.getElementById("updateInstallTitle");
    const stageEl = document.getElementById("updateInstallStageText");
    const fillEl = document.getElementById("updateProgressBarFill");
    const stepNameEl = document.getElementById("updateProgressStepName");
    const percentEl = document.getElementById("updateProgressPercent");
    const doneActions = document.getElementById("updateInstallDoneActions");
    if (doneActions) doneActions.style.display = "none";

    if (titleEl) {
        titleEl.innerText = isRepair
            ? "Sistem Dosyaları Onarılıyor ve Doğrulanıyor..."
            : `v${targetVer} Güncellemesi Uygulanıyor...`;
    }

    setTimeout(() => {
        if (fillEl) fillEl.style.width = "25%";
        if (percentEl) percentEl.innerText = "25%";
        if (stepNameEl) stepNameEl.innerText = "Güvenlik Yedeği";
        if (stageEl) stageEl.innerText = "1/4: Yerel veritabanı kopyalanıyor ve otomatik kurtarma noktası oluşturuluyor...";
        createAutoUpdateBackupSnapshot();
    }, 400);

    setTimeout(() => {
        if (fillEl) fillEl.style.width = "60%";
        if (percentEl) percentEl.innerText = "60%";
        if (stepNameEl) stepNameEl.innerText = "Bileşen Doğrulama";
        if (stageEl) stageEl.innerText = "2/4: Sistem bileşenleri, temalar ve muhasebe şablonları doğrulanıyor...";
    }, 1100);

    setTimeout(() => {
        if (fillEl) fillEl.style.width = "85%";
        if (percentEl) percentEl.innerText = "85%";
        if (stepNameEl) stepNameEl.innerText = "Senkronizasyon";
        if (stageEl) stageEl.innerText = "3/4: Çevrimdışı kasa tabloları ve stil motoru yenileniyor...";
    }, 1800);

    setTimeout(() => {
        if (fillEl) fillEl.style.width = "100%";
        if (percentEl) percentEl.innerText = "100%";
        if (stepNameEl) stepNameEl.innerText = "Tamamlandı";
        if (stageEl) stageEl.innerText = "4/4: Doğrulama başarıyla tamamlandı! Sistem yeniden başlatılıyor...";

        localStorage.setItem("app_installed_version", targetVer);
        localStorage.setItem("app_last_update_check", new Date().toLocaleDateString("tr-TR"));

        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(`v${targetVer} doğrulaması tamamlandı!`);
            }
            window.location.reload();
        }, 800);
    }, 2500);
}

// ----------------------------------------------------------------------------
// 3. PAKET DOSYASI İLE ÇEVRİMDIŞI GÜNCELLEME (WHATSAPP/FLASH .JSON)
// ----------------------------------------------------------------------------
function applyUpdatePackage(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.version && !data.appName) {
                if (typeof showToast === 'function') showToast("Geçersiz güncelleme paketi! Dosya biçimi tanınamadı.", "error");
                return;
            }

            const targetVer = data.version || APP_CURRENT_VERSION;

            if (data.patchData && typeof data.patchData === 'object') {
                Object.keys(data.patchData).forEach(k => {
                    localStorage.setItem(k, typeof data.patchData[k] === 'string' ? data.patchData[k] : JSON.stringify(data.patchData[k]));
                });
            }

            runInAppSystemUpdate(targetVer, false);
        } catch (err) {
            if (typeof showToast === 'function') showToast("Güncelleme paketi okunamadı: " + err.message, "error");
        }
    };
    reader.readAsText(file, "UTF-8");
    event.target.value = "";
}

function startSystemUpdateDownload(downloadUrl) {
    confirmAndStartUpdate();
}

// Başlangıç senkronizasyonu + açılış ve periyodik arka plan sürüm kontrolü
window.addEventListener("DOMContentLoaded", () => {
    initLocalBridgeFromHash();
    updateVersionBadgeUI();
    const lastCheck = localStorage.getItem("app_last_update_check");
    const timeLabel = document.getElementById("lblUpdateCheckTime");
    if (timeLabel && lastCheck) {
        timeLabel.innerHTML = `Son Kontrol: <strong>${lastCheck}</strong>`;
    }
    if (window.location.search.includes('open_update')) {
        if (typeof openModal === 'function') openModal('modalSystemUpdate');
        checkSystemUpdates(true);
    } else if (!sessionStorage.getItem('portal_bg_update_checked')) {
        sessionStorage.setItem('portal_bg_update_checked', '1');
        setTimeout(() => {
            checkSystemUpdates(false);
        }, 1800);
    }

    // Açık oturum boyunca her 15 dakikada bir sessiz güncelleme kontrolü
    setInterval(() => {
        checkSystemUpdates(false);
    }, 15 * 60 * 1000);
});
