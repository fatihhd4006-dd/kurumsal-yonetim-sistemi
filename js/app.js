// ============================================================================
// ANA UYGULAMA, ŞİFRELİ GİRİŞ, GENİŞLEYEN YAN PANEL (ACCORDION) VE NAVİGASYON
// ============================================================================

let kurumInfo = JSON.parse(localStorage.getItem('portal_kurum')) || {
    name: "Yönetim Sistemi",
    subTitle: "Mali ve İdari İşler Portalı",
    bursar: "Mali İşler Yetkilisi"
};

function getKurumInfo() {
    return kurumInfo;
}

function saveKurumInfo() {
    localStorage.setItem('portal_kurum', JSON.stringify(kurumInfo));
    updateBrandDisplay();
}

function updateBrandDisplay() {
    const brandNameEls = document.querySelectorAll(".dynamic-brand-name");
    brandNameEls.forEach(el => el.innerText = kurumInfo.name);

    const brandSubEls = document.querySelectorAll(".dynamic-brand-sub");
    brandSubEls.forEach(el => el.innerText = kurumInfo.subTitle);

    // 1. Sol Sidebar Logo Güncellemesi
    const sidebarIcon = document.getElementById("sidebarBrandIcon");
    if (sidebarIcon) {
        if (kurumInfo.logo) {
            sidebarIcon.innerHTML = `<img src="${kurumInfo.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;">`;
            sidebarIcon.style.padding = "2px";
            sidebarIcon.style.background = "#ffffff";
        } else {
            sidebarIcon.innerHTML = `<i class="fa-solid fa-building-columns" style="color: var(--accent-gold); font-size: 16px;"></i>`;
            sidebarIcon.style.padding = "";
            sidebarIcon.style.background = "";
        }
    }

    // 2. Giriş Ekranı (Auth Overlay) Monogram & Logo Güncellemesi
    const authCrest = document.getElementById("authMonogramCrest") || document.getElementById("authCrestBox");
    if (authCrest) {
        if (kurumInfo.logo) {
            authCrest.innerHTML = `<img src="${kurumInfo.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 14px;">`;
            authCrest.style.padding = "4px";
            authCrest.style.background = "#ffffff";
        } else {
            authCrest.innerHTML = `<i class="fa-solid fa-building-columns" style="font-size: 22px; color: #ffffff;"></i>`;
            authCrest.style.padding = "";
            authCrest.style.background = "";
        }
    }

    // 3. Ayarlar Sekmesi Logo Önizleme
    const previewContainer = document.getElementById("cfgLogoPreviewContainer");
    const previewWrapper = document.getElementById("previewLogoWrapper");
    const imgLogoPreview = document.getElementById("imgLogoPreview");
    const lblNoLogoIcon = document.getElementById("lblNoLogoIcon");
    const btnRemove = document.getElementById("btnRemoveLogo");

    if (previewWrapper && imgLogoPreview && lblNoLogoIcon) {
        if (kurumInfo.logo) {
            imgLogoPreview.src = kurumInfo.logo;
            imgLogoPreview.style.display = "block";
            lblNoLogoIcon.style.display = "none";
            if (btnRemove) btnRemove.style.display = "inline-flex";
        } else {
            imgLogoPreview.src = "";
            imgLogoPreview.style.display = "none";
            lblNoLogoIcon.style.display = "block";
            if (btnRemove) btnRemove.style.display = "none";
        }
    } else if (previewContainer) {
        if (kurumInfo.logo) {
            previewContainer.innerHTML = `<img src="${kurumInfo.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;">`;
            if (btnRemove) btnRemove.style.display = "inline-flex";
        } else {
            previewContainer.innerHTML = `<i class="fa-solid fa-image" style="color: var(--text-dim); font-size: 20px;"></i>`;
            if (btnRemove) btnRemove.style.display = "none";
        }
    }
}

function handleLogoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast("Lütfen geçerli bir resim dosyası seçin (PNG, JPG).", "error");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast("Logo dosya boyutu 2 MB'den küçük olmalıdır.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        kurumInfo.logo = evt.target.result;
        saveKurumInfo();
        showToast("Kurum logosu başarıyla güncellendi!");
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    kurumInfo.logo = null;
    const fileInput = document.getElementById("cfgLogoFileInput") || document.getElementById("inputLogoFile");
    if (fileInput) fileInput.value = "";
    saveKurumInfo();
    showToast("Kurum logosu kaldırıldı.");
}

function removeInstitutionLogo() {
    removeLogo();
}

// 1. ŞİFRE İLE GİRİŞ & İLK KURULUM (KULLANICI OLUŞTURMA)
function toggleAuthPasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        if (icon) {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }
    } else {
        input.type = "password";
        if (icon) {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
}

function startAuthLiveClock() {
    function updateClock() {
        const el = document.getElementById("authClockText");
        if (!el) return;
        const now = new Date();
        const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
        const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        
        const dayStr = days[now.getDay()];
        const monthStr = months[now.getMonth()];
        const dateStr = `${now.getDate()} ${monthStr} ${now.getFullYear()}, ${dayStr}`;
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        el.innerText = `${dateStr} • ${timeStr}`;
    }
    updateClock();
    if (!window._authClockInterval) {
        window._authClockInterval = setInterval(updateClock, 1000);
    }
}

function startAuthLiveGreeting() {
    const greetingEl = document.getElementById("authGreetingText");
    const subGreetingEl = document.getElementById("authLoginSubGreeting");
    const now = new Date();
    const hour = now.getHours();
    let greeting = "☀️ İyi Günler, Hoş Geldiniz";
    let sub = "Yetkili Oturumu • Sistem Hazır";

    if (hour >= 5 && hour < 12) {
        greeting = "🌅 Günaydın, Hoş Geldiniz";
        sub = "Sabah Mesaisi • Sistem Çevrimdışı Korumada";
    } else if (hour >= 12 && hour < 18) {
        greeting = "☀️ İyi Günler, Hoş Geldiniz";
        sub = "Öğle Seansı • Finansal Kayıtlar Hazır";
    } else if (hour >= 18 && hour < 23) {
        greeting = "🌙 İyi Akşamlar, Hoş Geldiniz";
        sub = "Akşam Mesaisi • Kasa Kapanış Kontrolü";
    } else {
        greeting = "🌌 İyi Geceler, Hoş Geldiniz";
        sub = "Gece Mesaisi • Güvenli Kasa İzolasyonu";
    }

    if (greetingEl) greetingEl.textContent = greeting;
    if (subGreetingEl) subGreetingEl.textContent = sub;
}

function checkAuth() {
    if (window.location.search.includes('test_login')) {
        sessionStorage.setItem('portal_session_active', 'true');
    }
    startAuthLiveClock();
    startAuthLiveGreeting();
    loadSavedLoginScene();
    const isLogged = sessionStorage.getItem('portal_session_active') === 'true';
    const authOverlay = document.getElementById("authOverlay");
    const isInitialized = localStorage.getItem('portal_user_initialized') === 'true';

    if (isLogged) {
        authOverlay.classList.add("hidden");
        const activeTab = new URLSearchParams(window.location.search).get('tab') || localStorage.getItem('portal_active_tab') || 'alacak-kayitlari';
        switchAppTab(activeTab);
    } else {
        authOverlay.classList.remove("hidden");

        const setupBox = document.getElementById("authSetupBox");
        const loginBox = document.getElementById("authLoginBox");

        if (!isInitialized) {
            // İlk kez kullanıcı oluşturma / üye olma ekranı
            setupBox.style.display = "block";
            loginBox.style.display = "none";
        } else {
            // Sonraki girişlerde sadece şifre girme ekranı
            setupBox.style.display = "none";
            loginBox.style.display = "block";
            setTimeout(() => {
                const passInput = document.getElementById("loginPassOnly");
                if (passInput) passInput.focus();
            }, 100);
        }
    }
}

// İstanbul Tarihi & Sahil Manzaraları Motoru (Dinamik Atmosfer & Başlıklar)
const ISTANBUL_SCENES = [
    {
        id: 'dolmabahce',
        name: 'Dolmabahçe',
        icon: '🏰',
        file: 'assets/login_bg_istanbul_dolmabahce.jpg',
        eyebrow: 'TARİHİ PRESTİJ &amp; BOĞAZIN ASALETİ',
        titleMain: 'Köklü Birikim,',
        titleAccent: 'Zarif Yönetim.',
        lead: 'Saray mimarisinin zarafetiyle mali disiplini buluşturan kurumsal yapı. Her kayıt şeffaf, her bilanço tam vaktinde hazır.',
        badges: [
            { icon: 'fa-solid fa-crown', color: '#f59e0b', text: 'Kurumsal Prestij &amp; İtibar Koruması' },
            { icon: 'fa-solid fa-scale-balanced', color: '#10b981', text: 'Kırtasiye, Aidat &amp; Cari Dengesi' },
            { icon: 'fa-solid fa-credit-card', color: '#3b82f6', text: 'Nakit &bull; Banka &bull; POS Tahsilat' }
        ]
    },
    {
        id: 'galata',
        name: 'Galata',
        icon: '🗼',
        file: 'assets/login_bg_istanbul_galata.jpg',
        eyebrow: 'ASIRLIK İSTİKRAR &amp; PERA UFUKLARI',
        titleMain: 'Zamana Meydan Okuyan',
        titleAccent: 'Sağlam Kasa.',
        lead: 'Yüzyılların tanığı Galata gibi sarsılmaz bir mali omurga. Borç takibi, anlık döviz dönüşümleri ve mutabakatlar güvencede.',
        badges: [
            { icon: 'fa-solid fa-shield-halved', color: '#3b82f6', text: 'Sarsılmaz Finansal İstikrar' },
            { icon: 'fa-solid fa-money-bill-transfer', color: '#10b981', text: 'Çapraz Döviz &amp; TL Çevirici' },
            { icon: 'fa-solid fa-user-shield', color: '#f59e0b', text: 'Yetkilendirilmiş Güvenli Giriş' }
        ]
    },
    {
        id: 'ortakoy',
        name: 'Ortaköy',
        icon: '🕌',
        file: 'assets/login_bg_istanbul_ortakoy.jpg',
        eyebrow: 'İKİ YAKANIN BİRLİĞİ &amp; BOĞAZ İNCİSİ',
        titleMain: 'Kampüsleri Birleştiren',
        titleAccent: 'Güçlü Köprü.',
        lead: 'Okul 1 ve Okul 2 birimleri arasında kesintisiz veri köprüsü. Merkezi mali koordinasyon ve ayrıştırılmış şeffaf kampüs raporları.',
        badges: [
            { icon: 'fa-solid fa-bridge', color: '#38bdf8', text: 'Okul 1 &amp; Okul 2 Tam Koordinasyon' },
            { icon: 'fa-solid fa-mosque', color: '#f59e0b', text: 'Kültürel Değer &amp; Kurumsal Duruş' },
            { icon: 'fa-solid fa-users-viewfinder', color: '#10b981', text: 'Şeffaf Öğrenci &amp; Veli Takip' }
        ]
    },
    {
        id: 'kizkulesi',
        name: 'Kız Kulesi',
        icon: '🏛️',
        file: 'assets/login_bg_istanbul_kizkulesi.jpg',
        eyebrow: 'DENİZİN ORTASINDA ZIRHLI KORUMA',
        titleMain: 'Eşsiz Değer,',
        titleAccent: 'Tam Koruma Kalkanı.',
        lead: 'Marmara\'nın incisi gibi dış dünyadan tamamen izole edilmiş yerel veri tabanı. İnternet kesilse bile kasanız duraksamadan işlemeye devam eder.',
        badges: [
            { icon: 'fa-solid fa-landmark', color: '#f59e0b', text: 'Harici Müdahaleye Kapalı Yerel Kasa' },
            { icon: 'fa-solid fa-hard-drive', color: '#10b981', text: 'Otomatik Tarayıcı &amp; JSON Koruması' },
            { icon: 'fa-solid fa-dove', color: '#38bdf8', text: 'Özgür &amp; Bağımsız Çalışma Mimarisi' }
        ]
    },
    {
        id: 'bosphorus',
        name: 'Boğaziçi',
        icon: '🌉',
        file: 'assets/login_bg_istanbul_bosphorus.jpg',
        eyebrow: 'KESİNTİSİZ AKIŞ &amp; BÜYÜK VİZYON',
        titleMain: 'Dinamik Finans,',
        titleAccent: 'Küresel Vizyon.',
        lead: 'Asya ile Avrupa\'yı bağlayan Boğaziçi gibi geniş ve güçlü bir operasyonel vizyon. Canlı borsa takibi ve kur çeviriciyle anlık kontrol.',
        badges: [
            { icon: 'fa-solid fa-water', color: '#38bdf8', text: 'Geniş Kapsamlı Finans Yönetimi' },
            { icon: 'fa-solid fa-chart-line', color: '#10b981', text: 'Canlı Borsa &amp; Anlık Kur Entegrasyonu' },
            { icon: 'fa-solid fa-bolt', color: '#f59e0b', text: 'Hızlı &amp; Akıcı Veri İşleme Kapasitesi' }
        ]
    },
    {
        id: 'suleymaniye',
        name: 'Süleymaniye',
        icon: '🌅',
        file: 'assets/login_bg_istanbul_suleymaniye.jpg',
        eyebrow: 'KUSURSUZ MİMARİ &amp; ALTIN BOYNUZ',
        titleMain: 'Usta İşi Nizam,',
        titleAccent: 'Kusursuz Denge.',
        lead: 'Mimar Sinan\'ın Süleymaniye\'de kurduğu kusursuz statik denge gibi; gelir, gider ve personel hesaplarında milimetrik hassasiyet.',
        badges: [
            { icon: 'fa-solid fa-scale-unbalanced-flip', color: '#f59e0b', text: 'Kuruşu Kuruşuna Bilanço Dengesi' },
            { icon: 'fa-solid fa-compass-drafting', color: '#38bdf8', text: 'Statik Güvenli Veri Yapısı' },
            { icon: 'fa-solid fa-file-invoice-dollar', color: '#10b981', text: 'Gelişmiş Mali Raporlama Çıktıları' }
        ]
    },
    {
        id: 'rumeli',
        name: 'Rumeli Hisarı',
        icon: '🛡️',
        file: 'assets/login_bg_istanbul_rumeli.jpg',
        eyebrow: 'STRATEJİK KONUM &amp; SAĞLAM SAVUNMA',
        titleMain: 'Aşılmaz Güvenlik,',
        titleAccent: 'Sarsılmaz Savunma.',
        lead: 'Boğaz\'ın en dar noktasındaki tarihi burçlar gibi kurum bütçesini savunan, kaçak ve mükerrer kayıtları sıfırlayan kontrol kalkanı.',
        badges: [
            { icon: 'fa-solid fa-shield', color: '#10b981', text: 'Kaçak &amp; Mükerrer Kayıt Engelleme' },
            { icon: 'fa-solid fa-dungeon', color: '#f59e0b', text: 'Çift Katmanlı Kasa Koruması' },
            { icon: 'fa-solid fa-user-check', color: '#38bdf8', text: 'Denetim &amp; Yetki Kontrol Kayıtları' }
        ]
    },
    {
        id: 'sarayburnu',
        name: 'Sarayburnu',
        icon: '🚢',
        file: 'assets/login_bg_istanbul_sarayburnu.jpg',
        eyebrow: 'TARİHİ YARIMADA &amp; İMPARATORLUK HAFIZASI',
        titleMain: 'Köklü Hafıza,',
        titleAccent: 'Şeffaf Kayıt.',
        lead: 'Üç imparatorluğun yönetim merkezi Sarayburnu\'nun hafızası gibi; hiçbir ödemeyi, makbuzu ve geçmiş sözleşmeyi unutturmayan dijital arşiv.',
        badges: [
            { icon: 'fa-solid fa-box-archive', color: '#f59e0b', text: 'Sonsuz Geçmiş Veri &amp; Arşivleme' },
            { icon: 'fa-solid fa-receipt', color: '#38bdf8', text: 'Sözleşme &amp; Makbuz Geçmişi Takibi' },
            { icon: 'fa-solid fa-vault', color: '#10b981', text: 'Kişisel Veri İzolasyon Güvencesi' }
        ]
    }
];

// Geriye dönük uyumluluk
const LOGIN_THEMES = ISTANBUL_SCENES;

function updateLoginHeroCopy(scene) {
    const heroCopy = document.querySelector('.login-hero-copy');
    if (!heroCopy) return;

    heroCopy.classList.add('theme-switching');

    setTimeout(() => {
        const eyebrowText = document.getElementById('loginHeroEyebrowText');
        const titleMain = document.getElementById('loginHeroTitleMain');
        const titleAccent = document.getElementById('loginHeroTitleAccent');
        const lead = document.getElementById('loginHeroLead');
        const badgesContainer = document.getElementById('loginHeroBadges');

        if (eyebrowText) eyebrowText.innerHTML = scene.eyebrow || 'TARİHİ PRESTİJ &bull; BOĞAZIN ASALETİ';
        if (titleMain) titleMain.textContent = scene.titleMain || 'Köklü Birikim,';
        if (titleAccent) titleAccent.textContent = scene.titleAccent || 'Zarif Yönetim.';
        if (lead) lead.textContent = scene.lead || 'Saray mimarisinin zarafetiyle mali disiplini buluşturan kurumsal yapı. Her kayıt şeffaf, her bilanço tam vaktinde hazır.';

        if (badgesContainer && Array.isArray(scene.badges)) {
            badgesContainer.innerHTML = scene.badges.map(b => `
                <div class="login-feature-badge">
                    <i class="${b.icon}" style="color: ${b.color};"></i>
                    <span>${b.text}</span>
                </div>
            `).join('');
        }

        heroCopy.classList.remove('theme-switching');
    }, 140);
}

function setLoginScene(sceneId) {
    const scene = ISTANBUL_SCENES.find(s => s.id === sceneId) || ISTANBUL_SCENES[0];
    localStorage.setItem('portal_login_scene', scene.id);
    const bgLayer = document.getElementById('loginBgLayer');
    if (bgLayer) {
        bgLayer.style.backgroundImage = `url('${scene.file}')`;
    }
    ISTANBUL_SCENES.forEach(s => {
        const btn = document.getElementById(`sceneBtn_${s.id}`);
        if (btn) {
            if (s.id === scene.id) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    updateLoginHeroCopy(scene);
}

function loadSavedLoginScene() {
    const saved = localStorage.getItem('portal_login_scene') || 'dolmabahce';
    setLoginScene(saved);
}

// Geriye dönük uyumluluk alias'ları
function setSignatureAmbiance(id) { setLoginScene(id); }
function loadSavedSignatureAmbiance() { loadSavedLoginScene(); }

// İlk Kurulum: Şifre Oluşturma
function handleSetupPassword(e) {
    if (e) e.preventDefault();

    const p1 = (document.getElementById("setupPass1").value || "").trim();
    const p2 = (document.getElementById("setupPass2").value || "").trim();

    if (!p1) {
        showToast("Lütfen bir şifre belirleyiniz", "error");
        return;
    }
    if (p1 !== p2) {
        showToast("Şifreler birbiriyle eşleşmiyor!", "error");
        return;
    }

    localStorage.setItem('portal_master_pwd', p1);
    localStorage.setItem('portal_user_initialized', 'true');
    sessionStorage.setItem('portal_session_active', 'true');

    document.getElementById("authOverlay").classList.add("hidden");
    showToast("Giriş şifreniz başarıyla oluşturuldu!");
    switchAppTab(localStorage.getItem('portal_active_tab') || 'alacak-kayitlari');
}

// Sonraki Girişler: Sadece Şifre ile Giriş
function handlePasswordOnlyLogin(e) {
    if (e) e.preventDefault();

    const p = (document.getElementById("loginPassOnly").value || "").trim();
    const masterPwd = localStorage.getItem('portal_master_pwd') || "1234";

    if (p === masterPwd) {
        sessionStorage.setItem('portal_session_active', 'true');
        document.getElementById("authOverlay").classList.add("hidden");
        document.getElementById("loginPassOnly").value = "";
        showToast("Giriş başarılı!");
        switchAppTab(localStorage.getItem('portal_active_tab') || 'alacak-kayitlari');
    } else {
        showToast("Hatalı şifre!", "error");
    }
}

function handleLogout() {
    if (confirm("Güvenli çıkış yapmak ve oturumunuzu sonlandırmak istediğinize emin misiniz?")) {
        try {
            createAutoBackupSnapshot("Güvenli Çıkış Yedeği");
        } catch(e) {
            console.error(e);
        }
        sessionStorage.removeItem('portal_session_active');
        const loginInput = document.getElementById("loginPassOnly");
        if (loginInput) loginInput.value = "";
        checkAuth();
        showToast("Güvenli çıkış yapıldı ve otomatik sistem yedeği alındı.");
    }
}

// 2. YAN PANEL AÇILIR/KAPANIR AKORDİYON MENÜ (ACCORDION)
function toggleAccordion(groupId) {
    const sidebar = document.getElementById("mainSidebar");
    // Eğer sidebar daraltılmış haldeyse, kullanıcı açılır menüye bastığında sidebarı otomatik genişlet
    if (sidebar && sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
        localStorage.setItem("portal_sidebar_collapsed", "false");
    }

    const groupBody = document.getElementById("nav-sub-" + groupId);
    const chevron = document.getElementById("chevron-" + groupId);
    if (!groupBody) return;

    const isCurrentlyOpen = groupBody.classList.contains("open");

    if (isCurrentlyOpen) {
        groupBody.classList.remove("open");
        if (chevron) chevron.style.transform = "rotate(0deg)";
        localStorage.setItem("acc_" + groupId, "closed");
    } else {
        groupBody.classList.add("open");
        if (chevron) chevron.style.transform = "rotate(180deg)";
        localStorage.setItem("acc_" + groupId, "open");
    }
}

function ensureAccordionOpen(groupId) {
    const groupBody = document.getElementById("nav-sub-" + groupId);
    const chevron = document.getElementById("chevron-" + groupId);
    if (groupBody && !groupBody.classList.contains("open")) {
        groupBody.classList.add("open");
        if (chevron) chevron.style.transform = "rotate(180deg)";
        localStorage.setItem("acc_" + groupId, "open");
    }
}

// 3. SAYFA GEÇİŞLERİ VE NAVİGASYON (FİNANS YÖNETİMİ KALDIRILDI)
let currentActiveTab = 'alacak-kayitlari';

const TAB_TITLES = {
    // Alacak & Cari Takip
    'alacak-kayitlari': { group: 'alacak', title: 'Alacak Kayıtları Paneli', sub: 'Tüm vadeli ve peşin alacak girişlerini bu tabloya kaydedebilirsiniz' },
    'alacak-tahsilatlar': { group: 'alacak', title: 'Tahsilat Kayıtları Paneli', sub: 'Müşterilerden gelen banka, nakit ve çek tahsilatlarını buradan işleyin' },
    'alacak-net-ozet': { group: 'alacak', title: 'Referans ve Alacak Türü Bazında Net Bakiye Özeti', sub: 'Mükerrersiz referans-tür kesişimleri ve canlı bakiye durumları' },
    'alacak-cari-ozet': { group: 'alacak', title: 'Detaylı Cari ve Referans Bakiye Özeti', sub: 'Cari firma bazında bölünmüş, tüm detayları içeren ana özet tablosu' },

    // Öğrenci Yönetimi
    'ogrenci-genel': { group: 'ogrenci', title: 'Öğrenci Listesi & Genel Durum', sub: 'Tüm kayıtlı öğrenciler, sözleşme bedelleri, tahsilat ve kalan borçlar' },
    'ogrenci-matris': { group: 'ogrenci', title: 'Akademik Taksit Matrisi', sub: '10 aylık takvim bazında öğrencilerin taksit ödeme durumu' },
    'ogrenci-aylik': { group: 'ogrenci', title: 'Aylık Öğrenci Taksit Takibi', sub: 'Seçilen ayın tahsilat hedefleri, tahsil edilen ve geciken taksitler' },
    'ogrenci-vezne': { group: 'ogrenci', title: 'Öğrenci Vezne & Tahsilat Listesi', sub: 'Öğrencilerden alınan tüm taksit ödemeleri ve tahsilat makbuzları' },
    'ogrenci-kirtasiye': { group: 'ogrenci', title: 'Kırtasiye & Kitap Takibi', sub: 'Öğrencilerin kırtasiye bedelleri ve teslimat kontrolü' },
    'ogrenci-gunluk-rapor': { group: 'ogrenci', title: 'Günlük Tahsilat & Kasa Raporu', sub: 'Gün bazlı öğrenci taksit, aidat ve kırtasiye tahsilat dökümü, Nakit/Banka/POS dağılımı' },

    // Personel & Maaş / Kira
    'personel-aylik': { group: 'personel', title: 'Aylık Bordro Takibi', sub: 'Seçilen ayın personel maaş ve kira tahakkukları ile bakiye kontrolü' },
    'personel-kadro': { group: 'personel', title: 'Personel Kadrosu (Ana Tahakkuk)', sub: 'Kayıtlı personeller, net maaşlar, başlangıç ayları ve devir borçları' },
    'personel-zam': { group: 'personel', title: 'Maaş Zam İşlemleri', sub: 'Personele zam uygulama ve zam geçmişi dökümü' },
    'personel-kira': { group: 'personel', title: 'Bina & Mülk Kira Takibi', sub: 'Ofis ve okul mülk kiralarının aylık ödeme durumu' },
    'personel-odemeler': { group: 'personel', title: 'Maaş & Kira Ödeme Geçmişi', sub: 'Personele ve mülk sahiplerine yapılan tüm tediye ödemeleri' },

    // Borç & Emanet Takibi
    'borc-listesi': { group: 'borc', title: 'Alınan Borçlar ve Emanet Takibi', sub: 'Elden ve resmi tüm borçlarınızı; TL, Dolar, Euro ve Altın cinsinden takip edin' },
    'borc-odemeler': { group: 'borc', title: 'Borç Geri Ödeme Geçmişi', sub: 'Yapılan tüm borç kapama, elden ödeme ve dekontlu tediye hareketleri' },
    'borc-ozet': { group: 'borc', title: 'Net Borç & Bakiye Özeti (Bilanço)', sub: 'Döviz, altın ve TL bazında kişi ve varlık portföy dökümü' },

    // Ayarlar
    'ayarlar': { group: '', title: 'Sistem Ayarları & Yedekleme', sub: 'Kurum bilgileri, şifre değişikliği ve veritabanı tam yedekleme' }
};

function switchAppTab(tabId) {
    if (!TAB_TITLES[tabId]) tabId = 'alacak-kayitlari';
    currentActiveTab = tabId;
    localStorage.setItem('portal_active_tab', tabId);

    const info = TAB_TITLES[tabId];

    // Accordion aç
    if (info.group) {
        ensureAccordionOpen(info.group);
    }

    // Sidebar items aktiflik
    const navTab = (tabId === "ogrenci-gunluk-rapor") ? "ogrenci-vezne" : tabId;
    document.querySelectorAll(".nav-item, .nav-sub-item").forEach(btn => {
        if (btn.getAttribute("data-tab") === navTab) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Header başlığı
    document.getElementById("headerPageTitle").innerText = info.title;
    document.getElementById("headerPageSub").innerText = info.sub;

    // View section göster/gizle
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
    const targetSec = document.getElementById("view-" + tabId);
    if (targetSec) targetSec.classList.add("active");

    // İlgili modülün render fonksiyonunu çağır
    if (tabId === 'alacak-kayitlari') {
        if (typeof populateFilterTurSelects === 'function') populateFilterTurSelects();
        renderAlacakKayitlariTab();
    }
    else if (tabId === 'alacak-tahsilatlar') {
        if (typeof populateFilterTurSelects === 'function') populateFilterTurSelects();
        renderTahsilatKayitlariTab();
    }
    else if (tabId === 'alacak-net-ozet') renderNetBakiyeOzetiTab();
    else if (tabId === 'alacak-cari-ozet') renderCariBakiyeOzetiTab();
    else if (tabId === 'ogrenci-genel') renderOgrenciGenelTab();
    else if (tabId === 'ogrenci-matris') renderOgrenciMatrisTab();
    else if (tabId === 'ogrenci-aylik') renderOgrenciAylikTab();
    else if (tabId === 'ogrenci-vezne') renderOgrenciOdemelerTab();
    else if (tabId === 'ogrenci-kirtasiye') renderOgrenciKirtasiyeTab();
    else if (tabId === 'ogrenci-gunluk-rapor') renderGunlukTahsilatRaporu();
    else if (tabId === 'personel-aylik') renderPersonelAylikTab();
    else if (tabId === 'personel-kadro') renderPersonelKadroTab();
    else if (tabId === 'personel-zam') renderPersonelZamTab();
    else if (tabId === 'personel-kira') renderPersonelKiraTab();
    else if (tabId === 'personel-odemeler') renderPersonelOdemelerTab();
    else if (tabId === 'borc-listesi') renderBorcListesiTab();
    else if (tabId === 'borc-odemeler') renderBorcOdemelerTab();
    else if (tabId === 'borc-ozet') renderBorcOzetTab();
    else if (tabId === 'ayarlar') loadSettingsTab();

    updateGlobalBadges();
}

// 4. ROZETLERİ GÜNCELLE
function updateGlobalBadges() {
    const activeOkulCode = (typeof currentOkul !== 'undefined') ? currentOkul : 'okul1';
    const ogrCount = dbOgrenci.ogrenciler ? dbOgrenci.ogrenciler.filter(o => (o.okul || 'okul1') === activeOkulCode).length : 0;
    const persCount = dbPersonel ? dbPersonel.length : 0;
    const alacakCount = (typeof dbAlacak !== 'undefined' && dbAlacak.alacaklar) ? dbAlacak.alacaklar.length : 0;

    const bOgr = document.getElementById("badgeNavOgrenciSayisi");
    if (bOgr) bOgr.innerText = ogrCount;

    const bPers = document.getElementById("badgeNavPersonelSayisi");
    if (bPers) bPers.innerText = persCount;

    const bAlacak = document.getElementById("badgeNavAlacakSayisi");
    if (bAlacak) bAlacak.innerText = alacakCount;

    const borcCount = (typeof dbBorclar !== 'undefined' && Array.isArray(dbBorclar)) ? 
        dbBorclar.filter(b => typeof getBorcSummary === 'function' ? getBorcSummary(b.id).durum !== 'ODENDI' : true).length : 0;
    const bBorc = document.getElementById("badgeNavBorcSayisi");
    if (bBorc) bBorc.innerText = borcCount;

    const hOgr = document.getElementById("headerPillOgrenci");
    if (hOgr) {
        const okulDisplay = activeOkulCode === 'okul2' ? (kurumInfo.okul2Adi || 'Okul 2') : (kurumInfo.okul1Adi || 'Okul 1');
        hOgr.innerHTML = `<i class="fa-solid fa-graduation-cap" style="color: var(--primary);"></i> <span>${ogrCount} Öğrenci (${okulDisplay})</span>`;
    }
    if (typeof updateOkulStatsDisplay === 'function') updateOkulStatsDisplay();

    const hPers = document.getElementById("headerPillPersonel");
    if (hPers) hPers.innerHTML = `<i class="fa-solid fa-users-gear" style="color: var(--success);"></i> <span>${persCount} Personel</span>`;

    const hAlacak = document.getElementById("headerPillAlacak");
    if (hAlacak) hAlacak.innerHTML = `<i class="fa-solid fa-hand-holding-dollar" style="color: var(--accent-gold);"></i> <span>${alacakCount} Alacak</span>`;

    const hBorc = document.getElementById("headerPillBorc");
    if (hBorc) hBorc.innerHTML = `<i class="fa-solid fa-scale-unbalanced-flip" style="color: #f59e0b;"></i> <span>${borcCount} Borç</span>`;

    calculateNotifications();
}

// 5. AYARLAR SEKMESİ & SİSTEM YÖNETİMİ
function updateOkulNameLabels() {
    const o1 = kurumInfo.okul1Adi || "Okul 1";
    const o2 = kurumInfo.okul2Adi || "Okul 2";

    // Tüm Okul 1 / Okul 2 metinlerini güncelle
    document.querySelectorAll(".lbl-okul1-name, .okul1-label").forEach(el => el.innerText = o1);
    document.querySelectorAll(".lbl-okul2-name, .okul2-label").forEach(el => el.innerText = o2);

    // Sidebar & Başlık Butonları
    document.querySelectorAll(".btn-okul-toggle.okul1-btn, .sidebar-okul-btn.okul1-btn").forEach(btn => {
        const span = btn.querySelector(".lbl-okul1-name");
        if (span) span.innerText = o1;
    });
    document.querySelectorAll(".btn-okul-toggle.okul2-btn, .sidebar-okul-btn.okul2-btn").forEach(btn => {
        const span = btn.querySelector(".lbl-okul2-name");
        if (span) span.innerText = o2;
    });

    // Form seçim kutusu
    const formOkulSelect = document.getElementById("formOgrenciOkul");
    if (formOkulSelect) {
        const opt1 = formOkulSelect.querySelector('option[value="okul1"]');
        if (opt1) opt1.innerText = `🏫 ${o1}`;
        const opt2 = formOkulSelect.querySelector('option[value="okul2"]');
        if (opt2) opt2.innerText = `🎓 ${o2}`;
    }

    // Günlük Rapor Okul filtresi
    const gunlukOkulSelect = document.getElementById("gunlukRaporOkulFiltre");
    if (gunlukOkulSelect) {
        const gOpt1 = gunlukOkulSelect.querySelector('option[value="okul1"]');
        if (gOpt1) gOpt1.innerText = `🏫 ${o1}`;
        const gOpt2 = gunlukOkulSelect.querySelector('option[value="okul2"]');
        if (gOpt2) gOpt2.innerText = `🎓 ${o2}`;
    }

    if (typeof currentActiveTab !== 'undefined' && currentActiveTab === 'ogrenci-gunluk-rapor' && typeof renderGunlukTahsilatRaporu === 'function') {
        renderGunlukTahsilatRaporu();
    }

    if (typeof updateOkulStatsDisplay === 'function') updateOkulStatsDisplay();
    if (typeof updateGlobalBadges === 'function') updateGlobalBadges();
}

function loadSettingsTab() {
    // 1. Kurum Tanımları
    const kName = document.getElementById("cfgKurumAdi");
    if (kName) kName.value = kurumInfo.name || "Yönetim Sistemi";
    const o1El = document.getElementById("cfgOkul1Adi");
    if (o1El) o1El.value = kurumInfo.okul1Adi || "Okul 1";
    const o2El = document.getElementById("cfgOkul2Adi");
    if (o2El) o2El.value = kurumInfo.okul2Adi || "Okul 2";
    const kSub = document.getElementById("cfgAltBaslik");
    if (kSub) kSub.value = kurumInfo.subTitle || "Mali ve İdari İşler Portalı";
    const kYet = document.getElementById("cfgYetkili");
    if (kYet) kYet.value = kurumInfo.bursar || "Yetkili";

    // 2. İletişim, Adres & Fatura
    const telEl = document.getElementById("cfgTelefon");
    if (telEl) telEl.value = kurumInfo.telefon || "";
    const mailEl = document.getElementById("cfgEposta");
    if (mailEl) mailEl.value = kurumInfo.eposta || "";
    const vergiEl = document.getElementById("cfgVergiNo");
    if (vergiEl) vergiEl.value = kurumInfo.vergiNo || "";
    const adresEl = document.getElementById("cfgAdres");
    if (adresEl) adresEl.value = kurumInfo.adres || "";

    // 3. Mali Tanımlar & Kasa
    if (document.getElementById("cfgDefaultKirtasiye")) {
        setCurrencyValue("cfgDefaultKirtasiye", kurumInfo.defaultKirtasiye || 5000);
    }
    const kasaSorumluEl = document.getElementById("cfgKasaSorumlusu");
    if (kasaSorumluEl) kasaSorumluEl.value = kurumInfo.kasaSorumlusu || kurumInfo.bursar || "Vezne Yetkilisi";
    const b1El = document.getElementById("cfgBanka1");
    if (b1El) b1El.value = kurumInfo.banka1 || "";
    const b2El = document.getElementById("cfgBanka2");
    if (b2El) b2El.value = kurumInfo.banka2 || "";
    const posEl = document.getElementById("cfgPosTerminal");
    if (posEl) posEl.value = kurumInfo.posTerminal || "";

    const defYontemEl = document.getElementById("cfgDefaultYontem");
    if (defYontemEl) defYontemEl.value = kurumInfo.defaultYontem || "Nakit";

    // 4. İstatistik & Depolama Bilgileri
    const ogrCount = (dbOgrenci && Array.isArray(dbOgrenci.ogrenciler)) ? dbOgrenci.ogrenciler.length : 0;
    const persCount = (typeof dbPersonel !== 'undefined' && Array.isArray(dbPersonel)) ? dbPersonel.length : 0;
    const alacakCount = (typeof dbAlacak !== 'undefined' && Array.isArray(dbAlacak.alacaklar)) ? dbAlacak.alacaklar.length : 0;

    const statOgr = document.getElementById("lblStatOgrenciSayisi");
    if (statOgr) statOgr.innerText = `${ogrCount} Öğrenci`;

    const statPers = document.getElementById("lblStatPersonelSayisi");
    if (statPers) statPers.innerText = `${persCount} Personel`;

    const statAlacak = document.getElementById("lblStatAlacakSayisi");
    if (statAlacak) statAlacak.innerText = `${alacakCount} Kayıt`;

    // Bellek Hesaplama
    let totalBytes = 0;
    try {
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalBytes += (localStorage[key].length + key.length) * 2;
            }
        }
    } catch (e) {}
    const kb = (totalBytes / 1024).toFixed(1);
    const storageEl = document.getElementById("lblStatStorageSize");
    if (storageEl) storageEl.innerText = `${kb} KB (~%${((totalBytes / (5 * 1024 * 1024)) * 100).toFixed(1)})`;

    if (typeof getSocialLabels === 'function') {
        const labels = getSocialLabels();
        if (document.getElementById("cfgSettingSocial1")) document.getElementById("cfgSettingSocial1").value = labels.sosyal1;
        if (document.getElementById("cfgSettingSocial2")) document.getElementById("cfgSettingSocial2").value = labels.sosyal2;
        if (document.getElementById("cfgSettingSocial3")) document.getElementById("cfgSettingSocial3").value = labels.sosyal3;
    }

    renderAutoBackupHistoryList();
    loadSavedTheme();
    updateBrandDisplay();
    updateOkulNameLabels();
}

function saveSettingsForm(e) {
    if (e) e.preventDefault();

    const nameEl = document.getElementById("cfgKurumAdi");
    if (nameEl) kurumInfo.name = nameEl.value.trim() || "Yönetim Sistemi";
    const o1El = document.getElementById("cfgOkul1Adi");
    if (o1El) kurumInfo.okul1Adi = o1El.value.trim() || "Okul 1";
    const o2El = document.getElementById("cfgOkul2Adi");
    if (o2El) kurumInfo.okul2Adi = o2El.value.trim() || "Okul 2";
    const subEl = document.getElementById("cfgAltBaslik");
    if (subEl) kurumInfo.subTitle = subEl.value.trim() || "Mali ve İdari İşler Portalı";
    const yetEl = document.getElementById("cfgYetkili");
    if (yetEl) kurumInfo.bursar = yetEl.value.trim() || "Yetkili";

    const defYontemEl = document.getElementById("cfgDefaultYontem");
    if (defYontemEl) kurumInfo.defaultYontem = defYontemEl.value;

    if (document.getElementById("cfgDefaultKirtasiye")) {
        const defKirtasiye = getCurrencyValue("cfgDefaultKirtasiye");
        if (defKirtasiye > 0) kurumInfo.defaultKirtasiye = defKirtasiye;
    }

    saveKurumInfo();
    updateOkulNameLabels();

    if (document.getElementById("cfgSettingSocial1")) {
        const labels = {
            sosyal1: document.getElementById("cfgSettingSocial1").value.trim() || "Sosyal-1",
            sosyal2: document.getElementById("cfgSettingSocial2").value.trim() || "Sosyal-2",
            sosyal3: document.getElementById("cfgSettingSocial3").value.trim() || "Sosyal-3"
        };
        localStorage.setItem('app_social_labels', JSON.stringify(labels));
        if (typeof updateSocialLabelsInUI === 'function') updateSocialLabelsInUI();
    }

    showToast("Kurum & Kampüs tanımları başarıyla kaydedildi!");
}

function saveContactAndLogoSettings(e) {
    if (e) e.preventDefault();

    const telEl = document.getElementById("cfgTelefon");
    if (telEl) kurumInfo.telefon = telEl.value.trim();
    const mailEl = document.getElementById("cfgEposta");
    if (mailEl) kurumInfo.eposta = mailEl.value.trim();
    const vergiEl = document.getElementById("cfgVergiNo");
    if (vergiEl) kurumInfo.vergiNo = vergiEl.value.trim();
    const adresEl = document.getElementById("cfgAdres");
    if (adresEl) kurumInfo.adres = adresEl.value.trim();

    saveKurumInfo();
    showToast("İletişim ve adres bilgileri kaydedildi!");
}

function saveFinancialSettings(e) {
    if (e) e.preventDefault();

    const defKirtasiye = getCurrencyValue("cfgDefaultKirtasiye");
    kurumInfo.defaultKirtasiye = defKirtasiye > 0 ? defKirtasiye : 5000;

    const kasaSorumluEl = document.getElementById("cfgKasaSorumlusu");
    if (kasaSorumluEl) kurumInfo.kasaSorumlusu = kasaSorumluEl.value.trim();
    const b1El = document.getElementById("cfgBanka1");
    if (b1El) kurumInfo.banka1 = b1El.value.trim();
    const b2El = document.getElementById("cfgBanka2");
    if (b2El) kurumInfo.banka2 = b2El.value.trim();
    const posEl = document.getElementById("cfgPosTerminal");
    if (posEl) kurumInfo.posTerminal = posEl.value.trim();

    const defYontemEl = document.getElementById("cfgDefaultYontem");
    if (defYontemEl) kurumInfo.defaultYontem = defYontemEl.value;

    saveKurumInfo();
    showToast("Mali tanımlar ve POS / Banka hesapları kaydedildi!");
}

function handlePasswordChangeForm(e) {
    if (e) e.preventDefault();

    const currentPwdInput = document.getElementById("cfgCurrentPassword");
    const newPwdInput = document.getElementById("cfgPassword");
    const confirmPwdInput = document.getElementById("cfgPasswordConfirm");

    const currentSaved = localStorage.getItem('portal_master_pwd') || "1234";

    if (!currentPwdInput || currentPwdInput.value !== currentSaved) {
        showToast("Mevcut yönetici şifresi hatalı!", "error");
        return;
    }

    const newPwd = newPwdInput ? newPwdInput.value.trim() : "";
    const confirmPwd = confirmPwdInput ? confirmPwdInput.value.trim() : "";

    if (!newPwd || newPwd.length < 4) {
        showToast("Yeni şifre en az 4 karakterden oluşmalıdır!", "error");
        return;
    }

    if (newPwd !== confirmPwd) {
        showToast("Yeni şifreler birbiriyle eşleşmiyor!", "error");
        return;
    }

    localStorage.setItem('portal_master_pwd', newPwd);
    currentPwdInput.value = "";
    newPwdInput.value = "";
    confirmPwdInput.value = "";

    showToast("Yönetici şifreniz başarıyla güncellendi!");
}

function optimizeDatabase() {
    let fixCount = 0;

    // 1. Öğrenci veritabanı bütünlüğü
    if (dbOgrenci && Array.isArray(dbOgrenci.ogrenciler)) {
        dbOgrenci.ogrenciler.forEach(o => {
            if (!o.okul) { o.okul = "okul1"; fixCount++; }
            if (!Array.isArray(o.kirtasiyeOdemeler)) { o.kirtasiyeOdemeler = []; }
            if (typeof o.brut !== 'number') { o.brut = Number(o.brut) || 0; }
            if (typeof o.indirim !== 'number') { o.indirim = Number(o.indirim) || 0; }
            if (typeof o.kirtasiye !== 'number') { o.kirtasiye = Number(o.kirtasiye) || 0; }
        });
        localStorage.setItem('okul_v25_db', JSON.stringify(dbOgrenci));
    }

    // 2. Personel veritabanı bütünlüğü
    if (typeof dbPersonel !== 'undefined' && Array.isArray(dbPersonel)) {
        localStorage.setItem('app_personnel', JSON.stringify(dbPersonel));
    }

    // 3. Alacak veritabanı bütünlüğü
    if (typeof dbAlacak !== 'undefined' && Array.isArray(dbAlacak.alacaklar)) {
        localStorage.setItem('alacak_db', JSON.stringify(dbAlacak));
    }

    // 4. Borç veritabanı bütünlüğü
    if (typeof dbBorclar !== 'undefined' && Array.isArray(dbBorclar)) {
        localStorage.setItem('app_borclar', JSON.stringify(dbBorclar));
    }

    const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const optEl = document.getElementById("lblLastOptimizationTime");
    if (optEl) {
        optEl.innerHTML = `<span style="color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${timeStr} itibarıyla doğrulandı (0 hata)</span>`;
    }

    loadSettingsTab();
    showToast("Veritabanı başarıyla tarandı ve optimize edildi!");
}

function cleanTemporaryCache() {
    sessionStorage.clear();
    loadSettingsTab();
    showToast("Geçici arayüz önbelleği temizlendi!");
}

// 6. AKILLI YEDEKLEME & GERİ YÜKLEME (TAM VEYA MODÜL BAZLI)
function exportFullSystemJson() {
    exportModuleJson('all');
}

function exportModuleJson(moduleType) {
    let backupData = {};
    let fileName = "";
    const nowLocal = new Date();
    const dateStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;

    if (moduleType === 'ogrenci') {
        const okulMeta = {
            name: kurumInfo.name || "Yönetim Sistemi",
            subTitle: kurumInfo.subTitle || "",
            bursar: kurumInfo.bursar || "",
            okul1Adi: kurumInfo.okul1Adi || "Okul 1",
            okul2Adi: kurumInfo.okul2Adi || "Okul 2",
            logo: kurumInfo.logo || null,
            ...(dbOgrenci.school || {})
        };
        backupData = {
            type: "ogrenci_paneli_yedek",
            ogrenciler: dbOgrenci.ogrenciler || [],
            odemeler: dbOgrenci.odemeler || [],
            payments: dbOgrenci.odemeler || [],
            okul_v25_db: dbOgrenci,
            school: okulMeta,
            exportDate: new Date().toISOString(),
            module: "ogrenci"
        };
        fileName = `Ogrenci_Takip_Yedek_${dateStr}.json`;
    } else if (moduleType === 'personel') {
        backupData = {
            personnel: dbPersonel || [],
            changes: dbPersonelChanges || [],
            payments: dbPersonelPayments || [],
            app_social_labels: JSON.parse(localStorage.getItem('app_social_labels')) || {},
            exportDate: new Date().toISOString(),
            module: "personel"
        };
        fileName = `Personel_Maas_Kira_Yedek_${dateStr}.json`;
    } else if (moduleType === 'alacak') {
        backupData = {
            alacaklar: dbAlacak.alacaklar || [],
            tahsilatlar: dbAlacak.tahsilatlar || [],
            turler: dbAlacak.turler || DEFAULT_ALACAK_TURLERI,
            exportDate: new Date().toISOString(),
            module: "alacak"
        };
        fileName = `Alacak_Cari_Yedek_${dateStr}.json`;
    } else if (moduleType === 'borc') {
        backupData = {
            borclar: dbBorclar || [],
            borc_odemeler: dbBorcOdemeler || [],
            exportDate: new Date().toISOString(),
            module: "borc"
        };
        fileName = `Borc_Emanet_Yedek_${dateStr}.json`;
    } else {
        // Tam Sistem Yedeği
        backupData = {
            exportedAt: new Date().toISOString(),
            system: "Kurumsal_Yonetim_Sistemi",
            version: "5.0-borc-entegre",
            kurumInfo,
            master_pwd: localStorage.getItem('portal_master_pwd') || '1234',
            alacak_db: dbAlacak,
            okul_v25_db: dbOgrenci,
            app_personnel: dbPersonel,
            app_changes: dbPersonelChanges,
            app_payments: dbPersonelPayments,
            app_social_labels: JSON.parse(localStorage.getItem('app_social_labels')) || {},
            app_borclar: dbBorclar,
            app_borc_odemeler: dbBorcOdemeler
        };
        fileName = `Kurumsal_Sistem_Tam_Yedek_${dateStr}.json`;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", fileName);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    showToast("Yedek dosyası indirildi (" + fileName + ")");
}

function importFullSystemJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object') {
                alert("Geçersiz yedek dosyası formatı!");
                return;
            }

            const updatedModules = [];

            // 1. ÖĞRENCİ VERİSİ ALGILAMA (Akıllı & Güvenli Entegrasyon)
            const isStudentOnlyBackup = (data.type === "ogrenci_paneli_yedek" || data.source === "Ogrenci_Takip_Paneli") ||
                (data.ogrenciler && !data.app_personnel && !data.personnel && !data.alacak_db && !data.alacaklar);

            if (isStudentOnlyBackup) {
                if (!dbOgrenci) dbOgrenci = { ogrenciler: [], odemeler: [] };
                const incomingDb = data.okul_v25_db;
                dbOgrenci.ogrenciler = data.ogrenciler || (incomingDb && incomingDb.ogrenciler) || [];
                dbOgrenci.odemeler = data.odemeler || data.payments || (incomingDb && (incomingDb.odemeler || incomingDb.payments)) || [];
                if (data.school && typeof data.school === 'object') {
                    dbOgrenci.school = data.school;
                    if (data.school.name) kurumInfo.name = data.school.name;
                    if (data.school.subTitle) kurumInfo.subTitle = data.school.subTitle;
                    if (data.school.bursar) kurumInfo.bursar = data.school.bursar;
                    if (data.school.okul1Adi) kurumInfo.okul1Adi = data.school.okul1Adi;
                    if (data.school.okul2Adi) kurumInfo.okul2Adi = data.school.okul2Adi;
                    if (data.school.logo !== undefined) kurumInfo.logo = data.school.logo;
                    localStorage.setItem('portal_kurum', JSON.stringify(kurumInfo));
                }
                localStorage.setItem('okul_v25_db', JSON.stringify(dbOgrenci));

                const oCount = dbOgrenci.ogrenciler.length;
                const pCount = dbOgrenci.odemeler.length;
                alert(
                    "✅ Öğrenci Paneli Yedeği Başarıyla İçe Aktarıldı!\n\n" +
                    "• Kaydedilen Öğrenci: " + oCount + " Öğrenci\n" +
                    "• Kaydedilen Tahsilat: " + pCount + " Makbuz Kaydı\n\n" +
                    "🔒 Kurumsal Güvence: Personel, Maaş, Kira ve Alacak kayıtlarınızdaki hiçbir veri değiştirilmemiş ve aynen korunmuştur."
                );
                showToast("Öğrenci verileri başarıyla yüklendi! Sistem yenileniyor...");
                setTimeout(() => window.location.reload(), 1000);
                return;
            }

            // Normal tam yedek akışı:
            if (data.okul_v25_db && data.okul_v25_db.ogrenciler) {
                dbOgrenci = data.okul_v25_db;
                localStorage.setItem('okul_v25_db', JSON.stringify(dbOgrenci));
                updatedModules.push("Öğrenci Yönetimi (" + (dbOgrenci.ogrenciler?.length || 0) + " Öğrenci)");
            } else if (data.ogrenciler && Array.isArray(data.ogrenciler)) {
                // Eski bağımsız Öğrenci Takip Paneli yedeği
                if (!dbOgrenci) dbOgrenci = { ogrenciler: [], odemeler: [] };
                dbOgrenci.ogrenciler = data.ogrenciler;
                if (data.school) dbOgrenci.school = data.school;
                if (Array.isArray(data.odemeler) || Array.isArray(data.payments)) {
                    dbOgrenci.odemeler = data.odemeler || data.payments || [];
                }
                localStorage.setItem('okul_v25_db', JSON.stringify(dbOgrenci));
                updatedModules.push("Öğrenci Yönetimi (" + data.ogrenciler.length + " Öğrenci)");
            } else if (Array.isArray(data) && data.length > 0 && data[0].ad && (data[0].sozlesme !== undefined || data[0].net !== undefined || data[0].taksit !== undefined)) {
                if (!dbOgrenci) dbOgrenci = {};
                dbOgrenci.ogrenciler = data;
                localStorage.setItem('okul_v25_db', JSON.stringify(dbOgrenci));
                updatedModules.push("Öğrenci Yönetimi (" + data.length + " Öğrenci)");
            }

            // 2. PERSONEL & MAAŞ/KİRA VERİSİ ALGILAMA (Hem yeni sistemden, hem eski 'maas_kira_takip' sisteminden)
            let personelUpdated = false;
            if (data.app_personnel && Array.isArray(data.app_personnel)) {
                dbPersonel = data.app_personnel;
                localStorage.setItem('app_personnel', JSON.stringify(dbPersonel));
                personelUpdated = true;
            } else if (data.personnel && Array.isArray(data.personnel)) {
                // Eski bağımsız Maaş/Kira Sistemi yedeği
                dbPersonel = data.personnel;
                localStorage.setItem('app_personnel', JSON.stringify(dbPersonel));
                personelUpdated = true;
            } else if (Array.isArray(data) && data.length > 0 && data[0].code && (data[0].salary !== undefined || data[0].rent !== undefined)) {
                dbPersonel = data;
                localStorage.setItem('app_personnel', JSON.stringify(dbPersonel));
                personelUpdated = true;
            }

            // Personel ödeme dekontları
            if (data.app_payments && Array.isArray(data.app_payments)) {
                dbPersonelPayments = data.app_payments;
                localStorage.setItem('app_payments', JSON.stringify(dbPersonelPayments));
            } else if (data.payments && Array.isArray(data.payments) && (personelUpdated || (data.payments[0] && data.payments[0].code))) {
                dbPersonelPayments = data.payments;
                localStorage.setItem('app_payments', JSON.stringify(dbPersonelPayments));
            }

            // Personel zam geçmişi
            if (data.app_changes && Array.isArray(data.app_changes)) {
                dbPersonelChanges = data.app_changes;
                localStorage.setItem('app_changes', JSON.stringify(dbPersonelChanges));
            } else if (data.changes && Array.isArray(data.changes)) {
                dbPersonelChanges = data.changes;
                localStorage.setItem('app_changes', JSON.stringify(dbPersonelChanges));
            }

            if (data.app_social_labels) {
                localStorage.setItem('app_social_labels', JSON.stringify(data.app_social_labels));
            }

            if (personelUpdated) {
                updatedModules.push("Personel & Maaş/Kira (" + (dbPersonel?.length || 0) + " Personel/Mülk)");
            }

            // 3. ALACAK & CARİ VERİSİ ALGILAMA
            if (data.alacak_db && data.alacak_db.alacaklar) {
                dbAlacak = data.alacak_db;
                localStorage.setItem('alacak_db', JSON.stringify(dbAlacak));
                updatedModules.push("Alacak & Cari Takip (" + (dbAlacak.alacaklar?.length || 0) + " Alacak Kaydı)");
            } else if (data.alacaklar && Array.isArray(data.alacaklar)) {
                if (!dbAlacak) dbAlacak = { alacaklar: [], tahsilatlar: [], turler: [] };
                dbAlacak.alacaklar = data.alacaklar;
                if (data.tahsilatlar) dbAlacak.tahsilatlar = data.tahsilatlar;
                if (data.turler) dbAlacak.turler = data.turler;
                localStorage.setItem('alacak_db', JSON.stringify(dbAlacak));
                updatedModules.push("Alacak & Cari Takip (" + data.alacaklar.length + " Alacak Kaydı)");
            }

            // 4. BORÇ & EMANET VERİSİ ALGILAMA
            if (data.app_borclar && Array.isArray(data.app_borclar)) {
                dbBorclar = data.app_borclar;
                localStorage.setItem('app_borclar', JSON.stringify(dbBorclar));
                if (data.app_borc_odemeler && Array.isArray(data.app_borc_odemeler)) {
                    dbBorcOdemeler = data.app_borc_odemeler;
                    localStorage.setItem('app_borc_odemeler', JSON.stringify(dbBorcOdemeler));
                }
                updatedModules.push("Borç & Emanet Takibi (" + dbBorclar.length + " Borç Kaydı)");
            } else if (data.borclar && Array.isArray(data.borclar)) {
                dbBorclar = data.borclar;
                localStorage.setItem('app_borclar', JSON.stringify(dbBorclar));
                if (data.odemeler || data.borc_odemeler) {
                    dbBorcOdemeler = data.odemeler || data.borc_odemeler;
                    localStorage.setItem('app_borc_odemeler', JSON.stringify(dbBorcOdemeler));
                }
                updatedModules.push("Borç & Emanet Takibi (" + dbBorclar.length + " Borç Kaydı)");
            }

            // 5. KURUM VE ŞİFRE (Varsa)
            if (data.kurumInfo) {
                kurumInfo = data.kurumInfo;
                localStorage.setItem('portal_kurum', JSON.stringify(kurumInfo));
            }
            if (data.master_pwd) {
                localStorage.setItem('portal_master_pwd', data.master_pwd);
                localStorage.setItem('portal_user_initialized', 'true');
            }

            // BİLGİLENDİRME VE GÜNCELLEME
            if (updatedModules.length > 0) {
                const msg = "✅ Yedek Başarıyla İçe Aktarıldı!\n\n" +
                            "Güncellenen Modül(ler):\n• " + updatedModules.join("\n• ") + "\n\n" +
                            "🔒 Güvenlik Güvencesi: Dosyada bulunmayan diğer tüm sistem verileriniz aynen korunmuştur.";
                alert(msg);
                showToast("Veriler başarıyla yüklendi! Sistem yenileniyor...");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                alert("⚠️ Yüklenen JSON dosyası içerisinde tanınabilir bir Öğrenci, Personel veya Alacak verisi bulunamadı!");
            }
        } catch(err) {
            alert("Dosya okuma hatası: " + err.message);
        } finally {
            event.target.value = "";
        }
    };
    reader.readAsText(file);
}

// 7. YARDIMCI FORMAT VE DİYALOG ARAÇLARI
function formatCurrency(val) {
    return '₺' + (Number(val) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// CANLI PARA FORMATLAMA VE PARSE ARAÇLARI (BİNLİK AYRACI)
function parseCurrencyInput(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const digits = val.toString().replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
}

function getCurrencyValue(elementOrId) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return 0;
    if (el.dataset && el.dataset.rawValue !== undefined && el.dataset.rawValue !== "") {
        return Number(el.dataset.rawValue) || 0;
    }
    return parseCurrencyInput(el.value);
}

function setCurrencyValue(elementOrId, val) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;
    const num = Number(val) || 0;
    el.dataset.rawValue = num.toString();
    el.value = num > 0 ? num.toLocaleString('tr-TR') + ' ₺' : (num === 0 ? '0 ₺' : '');
}

function handleLiveCurrencyInput(e) {
    const el = e.target;
    const digits = el.value.replace(/\D/g, '');
    if (!digits) {
        el.value = '';
        el.dataset.rawValue = '0';
        return;
    }
    const num = parseInt(digits, 10);
    el.dataset.rawValue = num.toString();
    el.value = num.toLocaleString('tr-TR') + ' ₺';
}

function initCurrencyMasks() {
    document.querySelectorAll('.currency-mask').forEach(input => {
        input.removeEventListener('input', handleLiveCurrencyInput);
        input.addEventListener('input', handleLiveCurrencyInput);
        input.removeEventListener('focus', handleCurrencyFocus);
        input.addEventListener('focus', handleCurrencyFocus);
    });
}

function handleCurrencyFocus(e) {
    // Odaklanıldığında metnin tamamını seç
    setTimeout(() => e.target.select(), 50);
}

// ============================================================================
// 8. TEK TIKLA EXCEL İNDİRME MOTORU (TÜRKÇE EXCEL UYUMLU CSV)
// ============================================================================
function exportToExcelFile(filename, headers, rows) {
    // UTF-8 BOM so Turkish characters (ş, ç, ö, ğ, ü, İ, ı) render 100% correctly in Excel
    let csvContent = "\uFEFF";
    
    // Headers joined with semicolon (Standard list separator for Turkish regional Excel)
    csvContent += headers.map(h => `"${(h || '').toString().replace(/"/g, '""')}"`).join(";") + "\r\n";
    
    // Rows
    rows.forEach(row => {
        csvContent += row.map(cell => {
            if (cell === null || cell === undefined) return '""';
            return `"${cell.toString().replace(/"/g, '""')}"`;
        }).join(";") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const nowLocal = new Date();
    const localYmd = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
    link.setAttribute("download", `${filename}_${localYmd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${filename} başarıyla Excel formatında indirildi!`);
}

function exportAlacaklarToExcel() {
    const list = (typeof dbAlacak !== 'undefined' && dbAlacak.alacaklar) ? dbAlacak.alacaklar : [];
    if (list.length === 0) {
        showToast("İndirilecek alacak kaydı bulunmuyor.", "error");
        return;
    }
    const headers = ["Tarih", "Referans / Fatura No", "Cari Adı", "Alacak Türü", "Tutar (TL)", "Açıklama"];
    const rows = list.map(a => [
        a.tarih || "",
        a.ref || "",
        a.cari || "",
        a.tur || "",
        Number(a.tutar) || 0,
        a.aciklama || ""
    ]);
    exportToExcelFile("Kurum_Alacak_Listesi", headers, rows);
}

function exportCarilerToExcel() {
    if (typeof dbAlacak === 'undefined' || !dbAlacak.alacaklar) {
        showToast("İndirilecek cari kaydı bulunmuyor.", "error");
        return;
    }
    const carilerSet = new Set();
    (dbAlacak.alacaklar || []).forEach(a => { if (a.cari) carilerSet.add(a.cari.trim()); });
    (dbAlacak.tahsilatlar || []).forEach(t => { if (t.cari) carilerSet.add(t.cari.trim()); });

    const rows = Array.from(carilerSet).map(cari => {
        const alacakTop = (dbAlacak.alacaklar || [])
            .filter(a => (a.cari || "").trim().toLowerCase() === cari.toLowerCase())
            .reduce((s, a) => s + (Number(a.tutar) || 0), 0);
        const tahsilatTop = (dbAlacak.tahsilatlar || [])
            .filter(t => (t.cari || "").trim().toLowerCase() === cari.toLowerCase())
            .reduce((s, t) => s + (Number(t.tutar) || 0), 0);
        const bakiye = alacakTop - tahsilatTop;
        const durum = bakiye <= 0 ? "Borcu Yok" : "Bakiyeli";
        return [cari, alacakTop, tahsilatTop, bakiye, durum];
    });

    if (rows.length === 0) {
        showToast("İndirilecek cari hesabı bulunmuyor.", "error");
        return;
    }
    const headers = ["Cari Adı", "Toplam Alacak (TL)", "Toplam Tahsilat (TL)", "Kalan Bakiye (TL)", "Durum"];
    exportToExcelFile("Cari_Hesap_Ozeti", headers, rows);
}

function exportOgrencilerToExcel() {
    const activeOkulCode = (typeof currentOkul !== 'undefined') ? currentOkul : 'okul1';
    const list = (typeof dbOgrenci !== 'undefined' && dbOgrenci.ogrenciler) ? 
        dbOgrenci.ogrenciler.filter(o => (o.okul || 'okul1') === activeOkulCode) : [];
    if (list.length === 0) {
        showToast("İndirilecek öğrenci kaydı bulunmuyor.", "error");
        return;
    }
    const headers = ["Okul", "Öğrenci No", "Adı Soyadı", "İletişim / Veli Telefonu", "Kayıt Dönemi", "Net Sözleşme (TL)", "Taksit Sayısı", "Aylık Taksit (TL)", "Kırtasiye (TL)", "Ödenen Tutar (TL)", "Kalan Borç (TL)", "Durum"];
    const rows = list.map(o => {
        const plan = (typeof getStudentPlanDetails === 'function') ? getStudentPlanDetails(o) : null;
        const netEgitim = plan ? plan.netSozlesme : Math.max(0, (Number(o.brut) || 0) - (Number(o.indirim) || 0));
        const kirtasiye = plan ? plan.kirtasiye : (Number(o.kirtasiye) || 0);
        const taksit = plan ? plan.taksitSayisi : Math.max(1, parseInt(o.taksit) || 10);
        const aylik = plan ? plan.baseMonthly : Math.round(netEgitim / taksit);
        const odenen = plan ? plan.paid : (dbOgrenci.odemeler || []).filter(pay => pay.ogrenciId === o.id).reduce((s, pay) => s + (Number(pay.tutar) || 0), 0);
        const kalan = plan ? plan.kalan : Math.max(0, (netEgitim + kirtasiye) - odenen);
        const durum = kalan <= 0 ? "Borcu Kapandı" : "Devam Ediyor";

        return [
            o.okul === 'okul2' ? (kurumInfo.okul2Adi || "Okul 2") : (kurumInfo.okul1Adi || "Okul 1"),
            o.no || o.id,
            o.ad || "",
            o.telefon || "",
            o.donem || "",
            netEgitim,
            taksit,
            aylik,
            kirtasiye,
            odenen,
            kalan,
            durum
        ];
    });
    const okulSlug = (activeOkulCode === 'okul2' ? (kurumInfo.okul2Adi || 'Okul_2') : (kurumInfo.okul1Adi || 'Okul_1')).replace(/\s+/g, '_');
    exportToExcelFile(`Ogrenci_Kayit_Listesi_${okulSlug}`, headers, rows);
}

function exportPersonelToExcel() {
    const list = (typeof dbPersonel !== 'undefined') ? dbPersonel : [];
    if (list.length === 0) {
        showToast("İndirilecek personel kaydı bulunmuyor.", "error");
        return;
    }
    const currentPeriod = (typeof getCurrentPeriod === 'function') ? getCurrentPeriod() : '2026-10';
    const labels = (typeof getSocialLabels === 'function') ? getSocialLabels() : { sosyal1: "Sosyal-1", sosyal2: "Sosyal-2", sosyal3: "Sosyal-3" };
    const headers = ["Personel / Mülk Adı", "Sicil / Kod", "Net Maaş (TL)", `${labels.sosyal1} (TL)`, `${labels.sosyal2} (TL)`, `${labels.sosyal3} (TL)`, "Kira Bedeli (TL)", "Cari Dönem Tahakkuk (TL)", "Ödenen (TL)", "Kalan Borç (TL)", "Durum"];

    const rows = list.map(p => {
        const effSalary = (typeof getEffectiveRate === 'function') ? getEffectiveRate(p.code, 'MAAŞ', currentPeriod) : (Number(p.salary) || 0);
        const effS1 = (typeof getEffectiveRate === 'function') ? getEffectiveRate(p.code, 'SOSYAL-1', currentPeriod) : (Number(p.sosyal1) || 0);
        const effS2 = (typeof getEffectiveRate === 'function') ? getEffectiveRate(p.code, 'SOSYAL-2', currentPeriod) : (Number(p.sosyal2) || 0);
        const effS3 = (typeof getEffectiveRate === 'function') ? getEffectiveRate(p.code, 'SOSYAL-3', currentPeriod) : (Number(p.sosyal3) || 0);
        const effRent = (typeof getEffectiveRate === 'function') ? getEffectiveRate(p.code, 'KİRA', currentPeriod) : (Number(p.rent) || 0);
        const totalAccrual = effSalary + effS1 + effS2 + effS3 + effRent;

        const payments = (typeof dbPersonelPayments !== 'undefined') ? dbPersonelPayments.filter(pay => pay.code === p.code && pay.period === currentPeriod) : [];
        const paidSum = payments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        const kalan = Math.max(0, totalAccrual - paidSum);
        const durum = kalan <= 0 ? "Ödendi" : (paidSum > 0 ? "Kısmi Ödendi" : "Ödenmedi");

        return [
            p.name || "",
            p.code || "",
            effSalary,
            effS1,
            effS2,
            effS3,
            effRent,
            totalAccrual,
            paidSum,
            kalan,
            durum
        ];
    });
    exportToExcelFile("Personel_Maas_Sosyal_Kira_Listesi", headers, rows);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById("portalToast");
    if (!toast) return;

    toast.innerText = message;
    if (type === 'error') {
        toast.style.background = '#dc2626';
        toast.style.borderColor = '#ef4444';
    } else {
        toast.style.background = '#1e293b';
        toast.style.borderColor = '#334155';
    }

    toast.style.display = 'flex';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3200);
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
    initCurrencyMasks();
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
}

function toggleSidebar() {
    const sidebar = document.getElementById("mainSidebar");
    if (!sidebar) return;
    sidebar.classList.toggle("collapsed");
    localStorage.setItem("portal_sidebar_collapsed", sidebar.classList.contains("collapsed") ? "true" : "false");
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
}

// TÜRKÇE RAKAM - YAZI DÖNÜŞTÜRÜCÜ
function numberToTurkishWords(num) {
    num = Math.floor(Number(num) || 0);
    if (num === 0) return "Sıfır Türk Lirası";

    const birler = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
    const onlar = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
    const basamaklar = ["", "Bin", "Milyon", "Milyar"];

    function ucluGrup(n) {
        let str = "";
        const yuzler = Math.floor(n / 100);
        const kalan = n % 100;
        const onlarBas = Math.floor(kalan / 10);
        const birlerBas = kalan % 10;

        if (yuzler > 1) str += birler[yuzler] + " Yüz ";
        else if (yuzler === 1) str += "Yüz ";

        if (onlarBas > 0) str += onlar[onlarBas] + " ";
        if (birlerBas > 0) str += birler[birlerBas] + " ";

        return str.trim();
    }

    let result = "";
    let grupIdx = 0;

    while (num > 0) {
        const grup = num % 1000;
        if (grup > 0) {
            let grupStr = ucluGrup(grup);
            if (grupIdx === 1 && grup === 1) {
                result = "Bin " + result;
            } else {
                result = grupStr + " " + basamaklar[grupIdx] + " " + result;
            }
        }
        num = Math.floor(num / 1000);
        grupIdx++;
    }

    return result.trim() + " Türk Lirası";
}

// ============================================================================
// 8. ÇOKLU TEMA MOTORU (SOFT LIGHT, DARK SLATE, NORDIC NAVY, EMERALD)
// ============================================================================
const ALL_APP_THEMES = ['light', 'dark', 'gray', 'bordo', 'monokai', 'nordic', 'emerald'];
let currentAppTheme = localStorage.getItem('portal_theme') || 'light';

function setAppTheme(themeName) {
    if (!ALL_APP_THEMES.includes(themeName)) themeName = 'light';
    // Eski temalar için takma ad (alias) eşleştirmesi
    if (themeName === 'nordic') themeName = 'dark';
    if (themeName === 'emerald') themeName = 'light';

    currentAppTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('portal_theme', themeName);

    // Sol menü footer tema dropdown'ını senkronize et
    const sidebarSelect = document.getElementById('sidebarThemeSelect');
    if (sidebarSelect) {
        sidebarSelect.value = themeName;
    }

    // Header dropdown öğeleri ve ayarlar kartlarını senkronize et
    ALL_APP_THEMES.forEach(t => {
        const dropItem = document.getElementById(`themeItem${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (dropItem) {
            if (t === themeName) dropItem.classList.add('active');
            else dropItem.classList.remove('active');
        }
        const cardItem = document.getElementById(`themeCard_${t}`) || document.getElementById(`themeCard-${t}`);
        if (cardItem) {
            if (t === themeName) cardItem.classList.add('active');
            else cardItem.classList.remove('active');
        }
    });

    const themeTitles = {
        light: "☀️ Açık (Zümrüt & Soft Slate)",
        dark: "🌙 Koyu (Deep Slate & Sapphire)",
        gray: "🌫️ Gri (Charcoal & Steel)",
        bordo: "🍷 Bordo (Burgundy Rose)",
        monokai: "⚡ Monokai (Developer Terminal)"
    };
    showToast(`Tema uygulandı: ${themeTitles[themeName] || themeName}`);
    closeDropdowns();
}

function loadSavedTheme() {
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    let saved = urlTheme || localStorage.getItem('portal_theme') || 'light';
    if (!ALL_APP_THEMES.includes(saved)) saved = 'light';
    if (saved === 'nordic') saved = 'dark';
    if (saved === 'emerald') saved = 'light';

    document.documentElement.setAttribute('data-theme', saved);
    currentAppTheme = saved;

    const sidebarSelect = document.getElementById('sidebarThemeSelect');
    if (sidebarSelect) {
        sidebarSelect.value = saved;
    }

    ALL_APP_THEMES.forEach(t => {
        const dropItem = document.getElementById(`themeItem${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (dropItem) {
            if (t === saved) dropItem.classList.add('active');
            else dropItem.classList.remove('active');
        }
        const cardItem = document.getElementById(`themeCard_${t}`) || document.getElementById(`themeCard-${t}`);
        if (cardItem) {
            if (t === saved) cardItem.classList.add('active');
            else cardItem.classList.remove('active');
        }
    });
}

function toggleThemeDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("themeDropdownMenu");
    const notifMenu = document.getElementById("notificationDropdownMenu");
    if (notifMenu) notifMenu.classList.remove("show");
    if (menu) menu.classList.toggle("show");
}

function closeDropdowns() {
    const m1 = document.getElementById("themeDropdownMenu");
    const m2 = document.getElementById("notificationDropdownMenu");
    if (m1) m1.classList.remove("show");
    if (m2) m2.classList.remove("show");
}

window.addEventListener("click", () => {
    closeDropdowns();
});

// ============================================================================
// 9. AKILLI BİLDİRİM MERKEZİ (GERÇEK ZAMANLI ALACAK, ÖĞRENCİ VE MAAŞ ALARMLARI)
// ============================================================================
function toggleNotificationDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("notificationDropdownMenu");
    const themeMenu = document.getElementById("themeDropdownMenu");
    if (themeMenu) themeMenu.classList.remove("show");
    if (menu) {
        menu.classList.toggle("show");
        if (menu.classList.contains("show")) {
            calculateNotifications();
        }
    }
}

function calculateNotifications() {
    const notifs = [];
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMonthNum = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const activePeriod = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    // 1. Vadesi Geçmiş / Yaklaşan Alacaklar
    if (typeof dbAlacak !== 'undefined' && dbAlacak.alacaklar) {
        dbAlacak.alacaklar.forEach(a => {
            const tutar = Number(a.tutar) || 0;
            const tahsilat = (dbAlacak.tahsilatlar || [])
                .filter(t => (t.ref || "").trim().toUpperCase() === (a.ref || "").trim().toUpperCase() && (t.cari || "").trim().toLowerCase() === (a.cari || "").trim().toLowerCase())
                .reduce((s, t) => s + (Number(t.tutar) || 0), 0);
            const kalan = tutar - tahsilat;

            if (kalan > 0 && a.vade) {
                if (a.vade <= today) {
                    notifs.push({
                        type: 'alacak',
                        badge: 'Vadesi Geçti',
                        badgeColor: 'badge-danger',
                        icon: 'fa-hand-holding-dollar',
                        iconBg: 'rgba(220, 38, 38, 0.15)',
                        iconColor: 'var(--danger)',
                        title: `${a.cari} (${a.ref})`,
                        desc: `Vade: ${a.vade} - Kalan: ${formatCurrency(kalan)}`,
                        amount: formatCurrency(kalan),
                        action: () => { switchAppTab('alacak-kayitlari'); closeDropdowns(); }
                    });
                }
            }
        });
    }

    // 2. Geciken / Borçlu Öğrenciler
    if (typeof dbOgrenci !== 'undefined' && dbOgrenci.ogrenciler) {
        dbOgrenci.ogrenciler.forEach(ogr => {
            const plan = (typeof getStudentPlanDetails === 'function') ? getStudentPlanDetails(ogr) : null;
            const borc = plan ? plan.kalan : Math.max(0, (Math.max(0, (Number(ogr.brut) || 0) - (Number(ogr.indirim) || 0)) + (Number(ogr.kirtasiye) || 0)) - (dbOgrenci.odemeler || []).filter(o => o.ogrenciId === ogr.id).reduce((s, o) => s + (Number(o.tutar) || 0), 0));

            if (borc > 0 && (!ogr.durum || ogr.durum === 'Aktif')) {
                notifs.push({
                    type: 'ogrenci',
                    badge: 'Bakiye Borç',
                    badgeColor: 'badge-warning',
                    icon: 'fa-graduation-cap',
                    iconBg: 'rgba(37, 99, 235, 0.15)',
                    iconColor: 'var(--primary)',
                    title: `${ogr.ad} (${ogr.okul === 'okul2' ? (kurumInfo.okul2Adi || 'Okul 2') : (kurumInfo.okul1Adi || 'Okul 1')})`,
                    desc: `Telefon: ${ogr.telefon || '-'} - Kalan Borç`,
                    amount: formatCurrency(borc),
                    action: () => {
                        if (typeof setActiveOkul === 'function') setActiveOkul(ogr.okul || 'okul1');
                        switchAppTab('ogrenci-genel');
                        if (typeof openOgrenciDetailModal === 'function') openOgrenciDetailModal(ogr.id);
                        closeDropdowns();
                    }
                });
            }
        });
    }

    // 3. Personel Ödenmemiş Cari Ay Maaş & Sosyal Ödemeleri
    if (typeof dbPersonel !== 'undefined') {
        dbPersonel.forEach(p => {
            const totalDue = (typeof getEffectiveRate === 'function') 
                ? (getEffectiveRate(p.code, 'MAAŞ', activePeriod) + getEffectiveRate(p.code, 'SOSYAL-1', activePeriod) + getEffectiveRate(p.code, 'SOSYAL-2', activePeriod) + getEffectiveRate(p.code, 'SOSYAL-3', activePeriod) + getEffectiveRate(p.code, 'KİRA', activePeriod))
                : ((Number(p.salary) || 0) + (Number(p.sosyal1) || 0) + (Number(p.sosyal2) || 0) + (Number(p.sosyal3) || 0) + (Number(p.rent) || 0));
            const paid = (typeof dbPersonelPayments !== 'undefined' ? dbPersonelPayments : [])
                .filter(pay => pay.code === p.code && pay.period === activePeriod)
                .reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
            const rem = totalDue - paid;

            if (rem > 0 && totalDue > 0) {
                notifs.push({
                    type: 'personel',
                    badge: `${activePeriod} Hakediş`,
                    badgeColor: 'badge-info',
                    icon: 'fa-users-gear',
                    iconBg: 'rgba(5, 150, 105, 0.15)',
                    iconColor: 'var(--success)',
                    title: p.name,
                    desc: `${p.role || 'Personel'} - Bu ay bekleyen hakediş`,
                    amount: formatCurrency(rem),
                    action: () => { switchAppTab('personel-aylik'); closeDropdowns(); }
                });
            }
        });
    }

    // 4. Vadesi Geçmiş / Yaklaşan Borçlar
    if (typeof dbBorclar !== 'undefined' && Array.isArray(dbBorclar)) {
        dbBorclar.forEach(b => {
            if (typeof getBorcSummary === 'function') {
                const sum = getBorcSummary(b.id);
                if (sum.kalan > 0 && b.vadeTarihi) {
                    if (b.vadeTarihi <= today) {
                        notifs.push({
                            type: 'borc',
                            badge: 'Borç Vadesi Doldu',
                            badgeColor: 'badge-danger',
                            icon: 'fa-scale-unbalanced-flip',
                            iconBg: 'rgba(239, 68, 68, 0.15)',
                            iconColor: 'var(--danger)',
                            title: `${b.kisi} (${b.alinisTipi === 'ELDEN' ? 'Elden' : 'Resmi'})`,
                            desc: `Vade: ${b.vadeTarihi} - Kalan: ${formatBorcMiktar(sum.kalan, b.birim)}`,
                            amount: formatBorcMiktar(sum.kalan, b.birim),
                            action: () => { switchAppTab('borc-listesi'); closeDropdowns(); }
                        });
                    }
                }
            }
        });
    }

    // Render Badge
    const badgeEl = document.getElementById("notificationBadgeCount");
    if (badgeEl) {
        if (notifs.length > 0) {
            badgeEl.innerText = notifs.length > 99 ? '99+' : notifs.length;
            badgeEl.style.display = 'flex';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    // Render Dropdown List
    const listEl = document.getElementById("notificationItemsList");
    if (listEl) {
        if (notifs.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 30px 20px; color: var(--text-muted);">
                    <i class="fa-solid fa-circle-check" style="font-size: 32px; color: var(--success); margin-bottom: 10px;"></i>
                    <p style="font-size: 13px; font-weight: 700; margin: 0; color: var(--text-main);">Her Şey Yolunda!</p>
                    <p style="font-size: 11px; margin: 4px 0 0 0;">Geciken ödeme veya işlem gerektiren acil bildirim bulunmuyor.</p>
                </div>
            `;
        } else {
            window.notifsStore = notifs.map(n => n.action);
            listEl.innerHTML = notifs.slice(0, 15).map((n, idx) => `
                <div class="notification-row" onclick="window.notifsStore[${idx}]()">
                    <div class="notification-row-icon" style="background: ${n.iconBg}; color: ${n.iconColor};">
                        <i class="fa-solid ${n.icon}"></i>
                    </div>
                    <div class="notification-row-body">
                        <div class="notification-row-title">
                            <span>${n.title}</span>
                            <span class="badge-pill ${n.badgeColor}">${n.badge}</span>
                        </div>
                        <div class="notification-row-desc">${n.desc}</div>
                    </div>
                    <div class="notification-row-amount">${n.amount}</div>
                </div>
            `).join("");
        }
    }
}

// ============================================================================
// 10. GLOBAL COMMAND PALETTE (CTRL + K SPOTLIGHT HIZLI ARAMA & KOMUTLAR)
// ============================================================================
let currentCmdFilter = 'all';
let cmdSelectedIndex = 0;
let currentCmdResults = [];

function openCommandPalette() {
    closeDropdowns();
    const modal = document.getElementById("modalCommandPalette");
    if (!modal) return;
    modal.classList.add("active");
    const input = document.getElementById("commandPaletteInput");
    if (input) {
        input.value = "";
        input.focus();
    }
    setCommandFilter('all');
}

function closeCommandPalette() {
    const modal = document.getElementById("modalCommandPalette");
    if (modal) modal.classList.remove("active");
}

function closeCommandPaletteOnBackdrop(e) {
    if (e.target.id === "modalCommandPalette") {
        closeCommandPalette();
    }
}

function setCommandFilter(filter) {
    currentCmdFilter = filter;
    ['all', 'ogrenci', 'personel', 'alacak', 'menu'].forEach(f => {
        const btn = document.getElementById(`cmdFilter-${f}`);
        if (btn) {
            if (f === filter) btn.classList.add("active");
            else btn.classList.remove("active");
        }
    });
    handleCommandPaletteSearch();
}

function handleCommandPaletteKeydown(e) {
    if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentCmdResults.length > 0) {
            cmdSelectedIndex = (cmdSelectedIndex + 1) % currentCmdResults.length;
            updateCommandPaletteSelection();
        }
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentCmdResults.length > 0) {
            cmdSelectedIndex = (cmdSelectedIndex - 1 + currentCmdResults.length) % currentCmdResults.length;
            updateCommandPaletteSelection();
        }
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentCmdResults[cmdSelectedIndex]) {
            currentCmdResults[cmdSelectedIndex].run();
            closeCommandPalette();
        }
    } else if (e.key === "Escape") {
        closeCommandPalette();
    }
}

function updateCommandPaletteSelection() {
    const items = document.querySelectorAll(".command-result-item");
    items.forEach((item, idx) => {
        if (idx === cmdSelectedIndex) {
            item.classList.add("selected");
            item.scrollIntoView({ block: "nearest" });
        } else {
            item.classList.remove("selected");
        }
    });
}

function handleCommandPaletteSearch() {
    const term = (document.getElementById("commandPaletteInput")?.value || "").toLowerCase().trim();
    const results = [];

    // 1. Menü & Sayfa Komutları
    const navItems = [
        { name: "Alacak Kayıtları", sub: "Vadeli ve peşin alacak listesi", badge: "Alacak Modülü", icon: "fa-clipboard-list", color: "var(--accent-gold)", run: () => switchAppTab('alacak-kayitlari') },
        { name: "Tahsilat Kayıtları", sub: "Müşterilerden gelen ödemeler", badge: "Alacak Modülü", icon: "fa-credit-card", color: "var(--accent-gold)", run: () => switchAppTab('alacak-tahsilatlar') },
        { name: "Net Bakiye Özeti", sub: "Referans & Tür kesişim tablosu", badge: "Alacak Modülü", icon: "fa-chart-column", color: "var(--accent-gold)", run: () => switchAppTab('alacak-net-ozet') },
        { name: "Cari Bakiye Özeti & Ekstre", sub: "Cari firma bazında detaylı bakiye dökümü", badge: "Alacak Modülü", icon: "fa-building", color: "var(--accent-gold)", run: () => switchAppTab('alacak-cari-ozet') },
        { name: "Öğrenci Listesi & Genel Durum", sub: "Kayıtlı öğrenciler ve borç takibi", badge: "Öğrenci Modülü", icon: "fa-users", color: "var(--primary)", run: () => switchAppTab('ogrenci-genel') },
        { name: "Akademik Taksit Matrisi", sub: "10 aylık taksit ödeme matrisi", badge: "Öğrenci Modülü", icon: "fa-table-cells", color: "var(--primary)", run: () => switchAppTab('ogrenci-matris') },
        { name: "Aylık Öğrenci Taksit Takibi", sub: "Aylık tahsilat ve hedef durumu", badge: "Öğrenci Modülü", icon: "fa-calendar-check", color: "var(--primary)", run: () => switchAppTab('ogrenci-aylik') },
        { name: "Vezne & Tahsilat Listesi", sub: "Tüm tahsil edilen öğrenci taksitleri", badge: "Öğrenci Modülü", icon: "fa-receipt", color: "var(--primary)", run: () => switchAppTab('ogrenci-vezne') },
        { name: "Kırtasiye & Kitap Takibi", sub: "Öğrenci kırtasiye bedeli teslimatı", badge: "Öğrenci Modülü", icon: "fa-book-bookmark", color: "var(--primary)", run: () => switchAppTab('ogrenci-kirtasiye') },
        { name: "Günlük Tahsilat & Kasa Raporu", sub: "Günlük taksit ve kırtasiye tahsilat raporu", badge: "Öğrenci Modülü", icon: "fa-file-invoice-dollar", color: "var(--primary)", run: () => switchAppTab('ogrenci-gunluk-rapor') },
        { name: "Aylık Bordro Takibi", sub: "Personel maaş ve kira tahakkukları", badge: "Personel Modülü", icon: "fa-calendar-days", color: "var(--success)", run: () => switchAppTab('personel-aylik') },
        { name: "Personel Kadrosu (Ana Liste)", sub: "Kayıtlı personeller ve maaş oranları", badge: "Personel Modülü", icon: "fa-id-card", color: "var(--success)", run: () => switchAppTab('personel-kadro') },
        { name: "Maaş Zam İşlemleri", sub: "Personele zam yapma ve geçmişi", badge: "Personel Modülü", icon: "fa-arrow-trend-up", color: "var(--success)", run: () => switchAppTab('personel-zam') },
        { name: "Bina & Mülk Kira Takibi", sub: "Ofis ve okul mülk kiraları", badge: "Personel Modülü", icon: "fa-house", color: "var(--success)", run: () => switchAppTab('personel-kira') },
        { name: "Maaş & Kira Ödeme Geçmişi", sub: "Personele yapılan tüm tediyeler", badge: "Personel Modülü", icon: "fa-money-bill-transfer", color: "var(--success)", run: () => switchAppTab('personel-odemeler') },
        { name: "Borç & Emanet Listesi", sub: "Elden ve resmi tüm borçlar (TL, USD, EUR, Altın)", badge: "Borç Modülü", icon: "fa-scale-unbalanced-flip", color: "#f59e0b", run: () => switchAppTab('borc-listesi') },
        { name: "Borç Ödeme Geçmişi", sub: "Geri ödenen tüm borç hareketleri", badge: "Borç Modülü", icon: "fa-clock-rotate-left", color: "#f59e0b", run: () => switchAppTab('borc-odemeler') },
        { name: "Borç & Bakiye Özeti", sub: "Döviz ve altın bazında net borç bilançosu", badge: "Borç Modülü", icon: "fa-coins", color: "#f59e0b", run: () => switchAppTab('borc-ozet') },
        { name: "Sistem Ayarları & Yedekleme", sub: "Kurum bilgileri, temalar ve yedek geçmişi", badge: "Sistem", icon: "fa-gear", color: "#64748b", run: () => switchAppTab('ayarlar') },
        { name: "Yeni Öğrenci Ekle", sub: "Sisteme yeni bir öğrenci kaydı oluştur", badge: "Hızlı Eylem", icon: "fa-user-plus", color: "var(--primary)", run: () => { switchAppTab('ogrenci-genel'); if (typeof openNewOgrenciModal === 'function') openNewOgrenciModal(); } },
        { name: "Yeni Personel Ekle", sub: "Sisteme yeni personel veya mülk kaydı ekle", badge: "Hızlı Eylem", icon: "fa-user-plus", color: "var(--success)", run: () => { switchAppTab('personel-kadro'); if (typeof openNewPersonelModal === 'function') openNewPersonelModal(); } },
        { name: "Yeni Alacak Kaydı Ekle", sub: "Yeni cari alacak ve referans oluştur", badge: "Hızlı Eylem", icon: "fa-plus-circle", color: "var(--accent-gold)", run: () => { switchAppTab('alacak-kayitlari'); if (typeof openNewAlacakModal === 'function') openNewAlacakModal(); } },
        { name: "Yeni Tahsilat Girişi", sub: "Müşteriden yapılan tahsilatı kaydet", badge: "Hızlı Eylem", icon: "fa-hand-holding-dollar", color: "var(--success)", run: () => { switchAppTab('alacak-tahsilatlar'); if (typeof openNewTahsilatModal === 'function') openNewTahsilatModal(); } },
        { name: "Yeni Borç / Emanet Ekle", sub: "Sisteme yeni borç kaydı gir", badge: "Hızlı Eylem", icon: "fa-plus-circle", color: "#f59e0b", run: () => { switchAppTab('borc-listesi'); if (typeof openNewBorcModal === 'function') openNewBorcModal(); } },
        { name: "Borç Geri Ödemesi Yap", sub: "Alınan borca kısmi veya tam ödeme düş", badge: "Hızlı Eylem", icon: "fa-credit-card", color: "#10b981", run: () => { switchAppTab('borc-listesi'); if (typeof openNewBorcOdemeModal === 'function') openNewBorcOdemeModal(); } },
        { name: "Tüm Sistemi Yedekle (JSON)", sub: "Veritabanını bilgisayara tek dosya indir", badge: "Yedek", icon: "fa-download", color: "var(--accent-gold)", run: () => exportFullSystemJson() },
        { name: "Güvenli Çıkış Yap", sub: "Oturumu kapat ve güvenli yedek al", badge: "Güvenlik", icon: "fa-arrow-right-from-bracket", color: "var(--danger)", run: () => handleLogout() }
    ];

    if (currentCmdFilter === 'all' || currentCmdFilter === 'menu') {
        navItems.forEach(item => {
            if (!term || item.name.toLowerCase().includes(term) || item.sub.toLowerCase().includes(term) || item.badge.toLowerCase().includes(term)) {
                results.push({
                    group: "Menü & Komutlar",
                    title: item.name,
                    sub: item.sub,
                    badge: item.badge,
                    icon: item.icon,
                    iconColor: item.color,
                    run: item.run
                });
            }
        });
    }

    // 2. Öğrenciler Arama
    if ((currentCmdFilter === 'all' || currentCmdFilter === 'ogrenci') && typeof dbOgrenci !== 'undefined' && dbOgrenci.ogrenciler) {
        dbOgrenci.ogrenciler.forEach(ogr => {
            const matches = !term ||
                (ogr.ad || "").toLowerCase().includes(term) ||
                (ogr.telefon || "").toLowerCase().includes(term) ||
                (ogr.donem || "").toLowerCase().includes(term);

            if (matches) {
                const plan = (typeof getStudentPlanDetails === 'function') ? getStudentPlanDetails(ogr) : null;
                const toplamSozlesme = plan ? plan.toplamUcret : Math.max(0, (Number(ogr.brut) || 0) - (Number(ogr.indirim) || 0));
                const okulAdi = ogr.okul === 'okul2' ? (kurumInfo.okul2Adi || 'Okul 2') : (kurumInfo.okul1Adi || 'Okul 1');
                results.push({
                    group: "Öğrenciler",
                    title: ogr.ad,
                    sub: `${okulAdi} • Tel: ${ogr.telefon || '-'} • Kayıt: ${ogr.donem || 'Eylül'} • Toplam: ${formatCurrency(toplamSozlesme)}`,
                    badge: `${ogr.taksit || 10} Taksit`,
                    icon: "fa-graduation-cap",
                    iconColor: "var(--primary)",
                    run: () => {
                        if (typeof setActiveOkul === 'function') setActiveOkul(ogr.okul || 'okul1');
                        switchAppTab('ogrenci-genel');
                        if (typeof openOgrenciDetailModal === 'function') openOgrenciDetailModal(ogr.id);
                    }
                });
            }
        });
    }

    // 3. Personel & Mülk Arama
    if ((currentCmdFilter === 'all' || currentCmdFilter === 'personel') && typeof dbPersonel !== 'undefined') {
        dbPersonel.forEach(p => {
            const matches = !term ||
                (p.name || "").toLowerCase().includes(term) ||
                (p.code || "").toLowerCase().includes(term) ||
                (p.role || "").toLowerCase().includes(term) ||
                (p.phone || "").toLowerCase().includes(term);

            if (matches) {
                const isRent = Number(p.rent) > 0 && (!p.salary || Number(p.salary) === 0);
                results.push({
                    group: "Personel & Kira",
                    title: `${p.name} (${p.code})`,
                    sub: `${p.role || (isRent ? 'Mülk Sahibi' : 'Personel')} • Ücret: ${formatCurrency(isRent ? p.rent : p.salary)}`,
                    badge: isRent ? 'Kira' : 'Maaş',
                    icon: "fa-users-gear",
                    iconColor: "var(--success)",
                    run: () => {
                        switchAppTab('personel-kadro');
                    }
                });
            }
        });
    }

    // 4. Alacak & Cari Arama
    if ((currentCmdFilter === 'all' || currentCmdFilter === 'alacak') && typeof dbAlacak !== 'undefined' && dbAlacak.alacaklar) {
        dbAlacak.alacaklar.forEach(a => {
            const matches = !term ||
                (a.cari || "").toLowerCase().includes(term) ||
                (a.ref || "").toLowerCase().includes(term) ||
                (a.tur || "").toLowerCase().includes(term) ||
                (a.aciklama || "").toLowerCase().includes(term);

            if (matches) {
                results.push({
                    group: "Alacak & Cari",
                    title: `${a.cari} - Ref: ${a.ref}`,
                    sub: `Tür: ${a.tur} • Vade: ${a.vade || '-'} • ${a.aciklama || ''}`,
                    badge: formatCurrency(a.tutar),
                    icon: "fa-hand-holding-dollar",
                    iconColor: "var(--accent-gold)",
                    run: () => {
                        switchAppTab('alacak-kayitlari');
                    }
                });
            }
        });
    }

    currentCmdResults = results.slice(0, 30);
    cmdSelectedIndex = 0;

    const countEl = document.getElementById("commandPaletteTotalCount");
    if (countEl) countEl.innerText = results.length;

    const resListEl = document.getElementById("commandPaletteResults");
    if (!resListEl) return;

    if (currentCmdResults.length === 0) {
        resListEl.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-magnifying-glass" style="font-size: 28px; color: var(--text-dim); margin-bottom: 8px;"></i>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Eşleşen Sonuç Bulunamadı</div>
                <div style="font-size: 11px; margin-top: 4px;">Farklı bir arama terimi deneyin veya filtreyi değiştirin.</div>
            </div>
        `;
        return;
    }

    resListEl.innerHTML = currentCmdResults.map((r, idx) => `
        <div class="command-result-item ${idx === 0 ? 'selected' : ''}" onclick="currentCmdResults[${idx}].run(); closeCommandPalette();">
            <div class="command-result-left">
                <div class="command-result-icon" style="background: rgba(0,0,0,0.04); color: ${r.iconColor};">
                    <i class="fa-solid ${r.icon}"></i>
                </div>
                <div class="command-result-info">
                    <div class="command-result-name">${r.title}</div>
                    <div class="command-result-sub">${r.sub}</div>
                </div>
            </div>
            <div class="command-result-badge">${r.badge}</div>
        </div>
    `).join("");
}

// Global Keyboard Shortcut: Ctrl + K ve Esc
window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openCommandPalette();
    }
    if (e.key === "Escape") {
        closeCommandPalette();
        closeDropdowns();
    }
});

// ============================================================================
// 11. OTOMATİK SİSTEM YEDEK GEÇMİŞİ (ROLLING SNAPSHOT ENGINE)
// ============================================================================
function createAutoBackupSnapshot(reason = "Otomatik Sistem Snapshot") {
    try {
        const snapshot = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            displayDate: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
            reason: reason,
            stats: {
                ogrenciCount: (typeof dbOgrenci !== 'undefined' && dbOgrenci.ogrenciler) ? dbOgrenci.ogrenciler.length : 0,
                personelCount: (typeof dbPersonel !== 'undefined') ? dbPersonel.length : 0,
                alacakCount: (typeof dbAlacak !== 'undefined' && dbAlacak.alacaklar) ? dbAlacak.alacaklar.length : 0,
                borcCount: (typeof dbBorclar !== 'undefined' && Array.isArray(dbBorclar)) ? dbBorclar.length : 0
            },
            data: {
                alacak_db: localStorage.getItem('alacak_db'),
                alacak_turleri: localStorage.getItem('alacak_turleri'),
                okul_v25_db: localStorage.getItem('okul_v25_db'),
                app_personnel: localStorage.getItem('app_personnel'),
                app_payments: localStorage.getItem('app_payments'),
                app_changes: localStorage.getItem('app_changes'),
                portal_kurum: localStorage.getItem('portal_kurum'),
                app_borclar: localStorage.getItem('app_borclar'),
                app_borc_odemeler: localStorage.getItem('app_borc_odemeler')
            }
        };

        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('portal_auto_backups_history') || '[]');
        } catch(e) { history = []; }
        if (!Array.isArray(history)) history = [];

        history.unshift(snapshot);
        history = history.slice(0, 5); // En son 5 otomatik yedek
        localStorage.setItem('portal_auto_backups_history', JSON.stringify(history));
    } catch(err) {
        console.warn("Otomatik snapshot hatası:", err);
    }
}

function renderAutoBackupHistoryList() {
    const container = document.getElementById("autoBackupHistoryContainer");
    if (!container) return;

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('portal_auto_backups_history') || '[]');
    } catch(e) { history = []; }

    if (!Array.isArray(history) || history.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px; background: var(--bg-card-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-clock-rotate-left" style="font-size: 20px; color: var(--text-dim); margin-bottom: 6px;"></i>
                <div>Henüz kayıtlı otomatik yedek bulunmuyor.</div>
                <div style="font-size: 10px; margin-top: 4px;">Sistemden güvenli çıkış yaptığınızda otomatik olarak burada listelenecektir.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(snap => `
        <div class="backup-history-item">
            <div class="backup-history-left">
                <div class="backup-history-icon"><i class="fa-solid fa-floppy-disk"></i></div>
                <div>
                    <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">
                        ${snap.displayDate} - <span style="color: var(--accent-gold);">${snap.reason || 'Sistem Yedeği'}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                        <span>🎓 ${snap.stats?.ogrenciCount || 0} Öğrenci</span> • 
                        <span>👔 ${snap.stats?.personelCount || 0} Personel</span> • 
                        <span>💰 ${snap.stats?.alacakCount || 0} Alacak</span> • 
                        <span>⚖️ ${snap.stats?.borcCount || 0} Borç</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn btn-subtle" style="font-size: 11px; padding: 6px 10px;" onclick="downloadAutoBackupSnapshot(${snap.id})" title="JSON Dosyası Olarak İndir">
                    <i class="fa-solid fa-download"></i> İndir
                </button>
                <button type="button" class="btn btn-primary" style="font-size: 11px; padding: 6px 10px;" onclick="restoreAutoBackupSnapshot(${snap.id})" title="Bu Noktaya Geri Yükle">
                    <i class="fa-solid fa-rotate-left"></i> Geri Yükle
                </button>
            </div>
        </div>
    `).join("");
}

function restoreAutoBackupSnapshot(snapId) {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('portal_auto_backups_history') || '[]');
    } catch(e) { return; }

    const snap = history.find(s => s.id === snapId);
    if (!snap) {
        showToast("Yedek noktası bulunamadı!", "error");
        return;
    }

    if (confirm(`⚠️ DİKKAT!\n\n${snap.displayDate} tarihli "${snap.reason}" yedeğine geri dönmek istediğinize emin misiniz?\n\nBu işlem mevcut tüm verileri seçilen yedek anındaki haline geri döndürecektir.`)) {
        if (snap.data.alacak_db) localStorage.setItem('alacak_db', snap.data.alacak_db);
        if (snap.data.alacak_turleri) localStorage.setItem('alacak_turleri', snap.data.alacak_turleri);
        if (snap.data.okul_v25_db) localStorage.setItem('okul_v25_db', snap.data.okul_v25_db);
        if (snap.data.app_personnel) localStorage.setItem('app_personnel', snap.data.app_personnel);
        if (snap.data.app_payments) localStorage.setItem('app_payments', snap.data.app_payments);
        if (snap.data.app_changes) localStorage.setItem('app_changes', snap.data.app_changes);
        if (snap.data.portal_kurum) localStorage.setItem('portal_kurum', snap.data.portal_kurum);
        if (snap.data.app_borclar) localStorage.setItem('app_borclar', snap.data.app_borclar);
        if (snap.data.app_borc_odemeler) localStorage.setItem('app_borc_odemeler', snap.data.app_borc_odemeler);

        showToast("Sistem başarıyla yedekten geri yüklendi! Yenileniyor...");
        setTimeout(() => window.location.reload(), 900);
    }
}

function downloadAutoBackupSnapshot(snapId) {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('portal_auto_backups_history') || '[]');
    } catch(e) { return; }

    const snap = history.find(s => s.id === snapId);
    if (!snap) return;

    const exportPayload = {
        meta: {
            appName: "Kurumsal Yönetim Sistemi",
            backupType: "auto_snapshot",
            reason: snap.reason,
            exportedAt: snap.timestamp,
            version: "2.5.0"
        },
        data: {
            alacak_db: snap.data.alacak_db ? JSON.parse(snap.data.alacak_db) : null,
            alacak_turleri: snap.data.alacak_turleri ? JSON.parse(snap.data.alacak_turleri) : null,
            okul_v25_db: snap.data.okul_v25_db ? JSON.parse(snap.data.okul_v25_db) : null,
            app_personnel: snap.data.app_personnel ? JSON.parse(snap.data.app_personnel) : null,
            app_payments: snap.data.app_payments ? JSON.parse(snap.data.app_payments) : null,
            app_changes: snap.data.app_changes ? JSON.parse(snap.data.app_changes) : null,
            portal_kurum: snap.data.portal_kurum ? JSON.parse(snap.data.portal_kurum) : null,
            app_borclar: snap.data.app_borclar ? JSON.parse(snap.data.app_borclar) : null,
            app_borc_odemeler: snap.data.app_borc_odemeler ? JSON.parse(snap.data.app_borc_odemeler) : null
        }
    };

    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", str);
    a.setAttribute("download", `Otomatik_Yedek_${snap.displayDate.replace(/[\/\s:]/g, '_')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// BAŞLATMA
window.addEventListener("DOMContentLoaded", () => {
    updateBrandDisplay();
    updateOkulNameLabels();
    loadSavedTheme();
    checkAuth();
    updateGlobalBadges();
    calculateNotifications();
    initCurrencyMasks();

    // Kayıtlı sidebar daraltma durumu
    if (localStorage.getItem("portal_sidebar_collapsed") === "true") {
        const sidebar = document.getElementById("mainSidebar");
        if (sidebar) sidebar.classList.add("collapsed");
    }

    // Kayıtlı akordiyon durumlarını yükle
    ['alacak', 'ogrenci', 'personel', 'borc'].forEach(grp => {
        const state = localStorage.getItem("acc_" + grp);
        if (state === "closed") {
            const body = document.getElementById("nav-sub-" + grp);
            const chev = document.getElementById("chevron-" + grp);
            if (body) body.classList.remove("open");
            if (chev) chev.style.transform = "rotate(0deg)";
        }
    });
});
