using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace KurumsalYonetim {
    public class TimeoutWebClient : WebClient {
        private int _timeout;
        public TimeoutWebClient(int timeoutMs) {
            _timeout = timeoutMs;
        }
        protected override WebRequest GetWebRequest(Uri address) {
            WebRequest req = base.GetWebRequest(address);
            if (req != null) req.Timeout = _timeout;
            return req;
        }
    }

    static class Program {
        private const string GITHUB_USER = "fatihhd4006-dd";
        private const string GITHUB_REPO = "kurumsal-yonetim-sistemi";
        private const string GITHUB_BRANCH = "main";

        [STAThread]
        static void Main() {
            try {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string htmlPath = Path.Combine(baseDir, "index.html");

                // 1. Buluttan (GitHub) Tam Otomatik Güncelleme Çekme (Arka Planda Sessiz, 3 sn Timeout)
                CheckAndApplyCloudUpdates(baseDir);

                if (!File.Exists(htmlPath)) {
                    System.Windows.Forms.MessageBox.Show(
                        "index.html dosyası bulunamadı!\nKonum: " + htmlPath,
                        "Hata - Kurumsal Yönetim Sistemi",
                        System.Windows.Forms.MessageBoxButtons.OK,
                        System.Windows.Forms.MessageBoxIcon.Error
                    );
                    return;
                }

                // Otomatik Yedekler klasörünü oluştur
                string backupDir = Path.Combine(baseDir, "Otomatik_Yedekler");
                if (!Directory.Exists(backupDir)) {
                    Directory.CreateDirectory(backupDir);
                }

                // Taşınabilir İzole Veri Profili klasörü (Verilerin flash'tan gelmesi ve çerez temizliğinden etkilenmemesi için)
                string profileDir = Path.Combine(baseDir, "Veri_Profili");
                if (!Directory.Exists(profileDir)) {
                    Directory.CreateDirectory(profileDir);
                }

                Uri fileUri = new Uri(htmlPath);
                string url = fileUri.AbsoluteUri;

                string[] candidateBrowsers = new string[] {
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Mozilla Firefox\firefox.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Mozilla Firefox\firefox.exe")
                };

                string foundBrowser = null;
                foreach (string b in candidateBrowsers) {
                    if (File.Exists(b)) {
                        foundBrowser = b;
                        break;
                    }
                }

                if (foundBrowser != null) {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = foundBrowser;
                    if (foundBrowser.ToLower().Contains("firefox")) {
                        psi.Arguments = string.Format("-new-window \"{0}\"", htmlPath);
                    } else {
                        psi.Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check", url, profileDir);
                    }
                    psi.UseShellExecute = false;
                    Process.Start(psi);
                } else {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = htmlPath;
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                }
            } catch (Exception ex) {
                System.Windows.Forms.MessageBox.Show(
                    "Uygulama başlatılırken bir sorun oluştu:\n" + ex.Message,
                    "Başlatma Hatası",
                    System.Windows.Forms.MessageBoxButtons.OK,
                    System.Windows.Forms.MessageBoxIcon.Error
                );
            }
        }

        static void CheckAndApplyCloudUpdates(string baseDir) {
            try {
                // TLS 1.2
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;

                string rawBase = string.Format("https://raw.githubusercontent.com/{0}/{1}/{2}/", GITHUB_USER, GITHUB_REPO, GITHUB_BRANCH);
                string manifestUrl = rawBase + "version.json";

                string localVerFile = Path.Combine(baseDir, "version.json");
                string localVer = "1.0.0";
                if (File.Exists(localVerFile)) {
                    string localJson = File.ReadAllText(localVerFile, Encoding.UTF8);
                    localVer = ExtractJsonVal(localJson, "version") ?? "1.0.0";
                }

                using (var client = new TimeoutWebClient(3000)) {
                    client.Encoding = Encoding.UTF8;
                    client.Headers.Add("User-Agent", "KurumsalYonetimLauncher");
                    string remoteJson = client.DownloadString(manifestUrl);
                    string remoteVer = ExtractJsonVal(remoteJson, "version");

                    if (!string.IsNullOrEmpty(remoteVer) && IsNewerVersion(remoteVer, localVer)) {
                        // Yeni sürüm bulundu: Çekirdek dosyaları buluttan indir ve güncelle
                        string[] filesToUpdate = new string[] {
                            "index.html",
                            "css/style.css",
                            "js/app.js",
                            "js/personel.js",
                            "js/ogrenci.js",
                            "js/alacak.js",
                            "js/borc.js",
                            "js/updater.js",
                            "Sistemi_Baslat.bat",
                            "Beni_Oku.txt",
                            "kaynak_kodlar/AutoUpdate.ps1",
                            "kaynak_kodlar/LocalUpdateBridge.ps1",
                            "kaynak_kodlar/BuildCloudPackage.ps1",
                            "moduller/ogrenci_yonetimi.html",
                            "version.json"
                        };

                        foreach (string relFile in filesToUpdate) {
                            try {
                                string fileUrl = rawBase + relFile;
                                string localPath = Path.Combine(baseDir, relFile.Replace('/', Path.DirectorySeparatorChar));
                                string dir = Path.GetDirectoryName(localPath);
                                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                                string tempPath = localPath + ".tmp";
                                client.DownloadFile(fileUrl, tempPath);
                                if (File.Exists(tempPath) && new FileInfo(tempPath).Length > 0) {
                                    if (File.Exists(localPath)) File.Delete(localPath);
                                    File.Move(tempPath, localPath);
                                }
                            } catch {
                                // Tekil dosya hatası olursa diğerlerine devam et
                            }
                        }
                    }
                }
            } catch {
                // Çevrimdışıysa, sunucuya ulaşılamazsa veya repo henüz açılmamışsa hiç bekletmeden paneli başlat
            }
        }

        static string ExtractJsonVal(string json, string key) {
            if (string.IsNullOrEmpty(json)) return null;
            Match m = Regex.Match(json, "\"" + key + "\"\\s*:\\s*\"([^\"]+)\"");
            return m.Success ? m.Groups[1].Value : null;
        }

        static bool IsNewerVersion(string remote, string local) {
            if (string.IsNullOrEmpty(remote)) return false;
            if (string.IsNullOrEmpty(local)) return true;

            string[] rParts = remote.TrimStart('v', 'V').Split('.');
            string[] lParts = local.TrimStart('v', 'V').Split('.');
            int max = Math.Max(rParts.Length, lParts.Length);

            for (int i = 0; i < max; i++) {
                int r = 0, l = 0;
                if (i < rParts.Length) int.TryParse(rParts[i], out r);
                if (i < lParts.Length) int.TryParse(lParts[i], out l);
                if (r > l) return true;
                if (r < l) return false;
            }
            return false;
        }
    }
}
