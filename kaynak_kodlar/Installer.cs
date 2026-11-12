using System;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;
using System.Diagnostics;

namespace KurumsalYonetim {
    public class InstallerForm : Form {
        private TextBox txtPath;
        private CheckBox chkShortcut;
        private CheckBox chkLaunch;
        private Button btnBrowse;
        private Button btnInstall;
        private ProgressBar prgBar;
        private Label lblStatus;

        public InstallerForm() {
            InitializeComponent();
        }

        private void InitializeComponent() {
            this.Text = "Kurumsal Yönetim Sistemi - Kurulum Sihirbazı";
            this.Size = new Size(520, 360);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);

            // Üst Header Panel
            Panel pnlHeader = new Panel();
            pnlHeader.Dock = DockStyle.Top;
            pnlHeader.Height = 75;
            pnlHeader.BackColor = Color.FromArgb(15, 23, 42);

            Label lblTitle = new Label();
            lblTitle.Text = "Kurumsal Yönetim Sistemi";
            lblTitle.Font = new Font("Segoe UI", 13F, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(20, 14);
            lblTitle.AutoSize = true;

            Label lblSub = new Label();
            lblSub.Text = "Masaüstü & Taşınabilir Kurulum Sihirbazı";
            lblSub.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            lblSub.ForeColor = Color.FromArgb(148, 163, 184);
            lblSub.Location = new Point(22, 42);
            lblSub.AutoSize = true;

            pnlHeader.Controls.Add(lblTitle);
            pnlHeader.Controls.Add(lblSub);
            this.Controls.Add(pnlHeader);

            // Kurulum Yeri Etiketi
            Label lblPathTitle = new Label();
            lblPathTitle.Text = "Kurulum Konumu (Bilgisayar veya Flash Bellek):";
            lblPathTitle.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblPathTitle.ForeColor = Color.FromArgb(30, 41, 59);
            lblPathTitle.Location = new Point(24, 95);
            lblPathTitle.AutoSize = true;
            this.Controls.Add(lblPathTitle);

            // Varsayılan Kurulum Yolu: %LocalAppData%\Kurumsal_Yonetim_Sistemi
            string defaultPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Kurumsal_Yonetim_Sistemi");
            txtPath = new TextBox();
            txtPath.Text = defaultPath;
            txtPath.Location = new Point(24, 120);
            txtPath.Size = new Size(365, 25);
            txtPath.Font = new Font("Segoe UI", 9F);
            this.Controls.Add(txtPath);

            btnBrowse = new Button();
            btnBrowse.Text = "Gözat...";
            btnBrowse.Location = new Point(398, 118);
            btnBrowse.Size = new Size(85, 29);
            btnBrowse.Cursor = Cursors.Hand;
            btnBrowse.Click += (s, e) => {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog()) {
                    fbd.Description = "Kurumsal Yönetim Sisteminin kurulacağı klasörü veya Flash Belleği seçin:";
                    if (fbd.ShowDialog() == DialogResult.OK) {
                        txtPath.Text = Path.Combine(fbd.SelectedPath, "Kurumsal_Yonetim_Sistemi");
                    }
                }
            };
            this.Controls.Add(btnBrowse);

            // Seçenekler
            chkShortcut = new CheckBox();
            chkShortcut.Text = "Masaüstüne kısayol oluştur";
            chkShortcut.Checked = true;
            chkShortcut.Location = new Point(26, 160);
            chkShortcut.AutoSize = true;
            this.Controls.Add(chkShortcut);

            chkLaunch = new CheckBox();
            chkLaunch.Text = "Kurulum tamamlandığında programı hemen başlat";
            chkLaunch.Checked = true;
            chkLaunch.Location = new Point(26, 185);
            chkLaunch.AutoSize = true;
            this.Controls.Add(chkLaunch);

            // İlerleme ve Durum
            prgBar = new ProgressBar();
            prgBar.Location = new Point(26, 220);
            prgBar.Size = new Size(457, 18);
            prgBar.Visible = false;
            this.Controls.Add(prgBar);

            lblStatus = new Label();
            lblStatus.Location = new Point(26, 245);
            lblStatus.Size = new Size(340, 35);
            lblStatus.ForeColor = Color.FromArgb(71, 85, 105);
            lblStatus.Font = new Font("Segoe UI", 8.5F);
            this.Controls.Add(lblStatus);

            // Kurulum Butonu
            btnInstall = new Button();
            btnInstall.Text = "🚀 Kurulumu Başlat";
            btnInstall.Location = new Point(335, 275);
            btnInstall.Size = new Size(148, 36);
            btnInstall.BackColor = Color.FromArgb(37, 99, 235);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);
        }

        private void BtnInstall_Click(object sender, EventArgs e) {
            string targetDir = txtPath.Text.Trim();
            if (string.IsNullOrEmpty(targetDir)) {
                MessageBox.Show("Lütfen geçerli bir kurulum konumu seçin.", "Uyarı", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnInstall.Enabled = false;
            btnBrowse.Enabled = false;
            txtPath.Enabled = false;
            prgBar.Visible = true;
            prgBar.Style = ProgressBarStyle.Marquee;
            lblStatus.Text = "Dosyalar hazırlanıyor ve ayıklanıyor...";

            try {
                if (!Directory.Exists(targetDir)) {
                    Directory.CreateDirectory(targetDir);
                }

                // Gömülü zip dosyasını çıkar
                Assembly assembly = Assembly.GetExecutingAssembly();
                using (Stream stream = assembly.GetManifestResourceStream("KurumsalPackage")) {
                    if (stream == null) {
                        MessageBox.Show("Kurulum paketi verisi bulunamadı!", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }
                    using (ZipArchive archive = new ZipArchive(stream)) {
                        foreach (ZipArchiveEntry entry in archive.Entries) {
                            string completeFileName = Path.Combine(targetDir, entry.FullName);
                            string directory = Path.GetDirectoryName(completeFileName);
                            if (!Directory.Exists(directory)) {
                                Directory.CreateDirectory(directory);
                            }
                            if (!string.IsNullOrEmpty(entry.Name)) {
                                entry.ExtractToFile(completeFileName, true);
                            }
                        }
                    }
                }

                // Otomatik Yedekler klasörü
                string backupDir = Path.Combine(targetDir, "Otomatik_Yedekler");
                if (!Directory.Exists(backupDir)) {
                    Directory.CreateDirectory(backupDir);
                }

                string exePath = Path.Combine(targetDir, "Kurumsal_Yonetim_Paneli.exe");

                // Kısayol oluştur
                if (chkShortcut.Checked && File.Exists(exePath)) {
                    lblStatus.Text = "Masaüstü kısayolu oluşturuluyor...";
                    CreateShortcut(exePath, targetDir);
                }

                lblStatus.Text = "Kurulum başarıyla tamamlandı!";
                prgBar.Style = ProgressBarStyle.Blocks;
                prgBar.Value = 100;

                MessageBox.Show(
                    "Kurumsal Yönetim Sistemi başarıyla kuruldu!\n\nKonum: " + targetDir,
                    "Kurulum Tamamlandı",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );

                if (chkLaunch.Checked && File.Exists(exePath)) {
                    ProcessStartInfo psi = new ProcessStartInfo(exePath);
                    psi.WorkingDirectory = targetDir;
                    Process.Start(psi);
                }

                this.Close();
            } catch (Exception ex) {
                MessageBox.Show("Kurulum sırasında bir hata oluştu:\n" + ex.Message, "Kurulum Hatası", MessageBoxButtons.OK, MessageBoxIcon.Error);
                btnInstall.Enabled = true;
                btnBrowse.Enabled = true;
                txtPath.Enabled = true;
                prgBar.Visible = false;
                lblStatus.Text = "Hata oluştu.";
            }
        }

        private void CreateShortcut(string targetExe, string workingDir) {
            try {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktop, "Kurumsal Yönetim Paneli.lnk");

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null) {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = targetExe;
                    shortcut.WorkingDirectory = workingDir;
                    shortcut.Description = "Kurumsal Yönetim Sistemi Masaüstü Paneli";
                    shortcut.Save();
                }
            } catch {
                // Kısayol hatası durumunda kurulumu aksatma
            }
        }

        [STAThread]
        static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
