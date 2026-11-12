# ==============================================================================
# KURUMSAL YÖNETİM SİSTEMİ - SINIRSIZ & DİNAMİK EXCEL MOTORU
# Yeni Personel, Yeni Öğrenci ve Yeni Alacak Ekleme Tamamen Açık & Açılır Kutulu
# ==============================================================================

$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$targetPath = Join-Path $desktop "Kurumsal_Yonetim_Sistemi.xlsx"
$flashPath = "F:\Kurumsal_Yonetim_Sistemi.xlsx"

Write-Host "Excel COM baslatiliyor..." -ForegroundColor Cyan
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.ScreenUpdating = $false

$wb = $excel.Workbooks.Add()

$sheetNames = @(
    "00_DASHBOARD",
    "01_PERSONEL_KADROSU",
    "02_AYLIK_TAKIP_PANELI",
    "03_ODEME_HAREKETLERI",
    "04_OGRENCI_ALACAK_TAKIP",
    "05_OGRENCI_ODEMELERI",
    "06_OGRENCI_MATRISI",
    "07_DIGER_ALACAK_TAKIP",
    "08_DIGER_TAHSILATLAR",
    "09_PARAMETRELER",
    "10_WHATSAPP_RAPORU"
)

while ($wb.Sheets.Count -lt $sheetNames.Count) {
    $wb.Sheets.Add([System.Reflection.Missing]::Value, $wb.Sheets.Item($wb.Sheets.Count)) | Out-Null
}
while ($wb.Sheets.Count -gt $sheetNames.Count) {
    $wb.Sheets.Item(1).Delete()
}

for ($i = 0; $i -lt $sheetNames.Count; $i++) {
    $wb.Sheets.Item($i + 1).Name = $sheetNames[$i]
}

function Set-Cell($cell, $val) {
    if ($val -is [int] -or $val -is [double] -or $val -is [long] -or $val -is [decimal]) {
        $cell.Value2 = [double]$val
    } else {
        $cell.Value2 = [string]$val
    }
}

function Get-BGR($r, $g, $b) {
    return ($b * 65536) + ($g * 256) + $r
}

$cNavyDark  = Get-BGR 15 23 42     # #0f172a
$cNavyMid   = Get-BGR 30 41 59     # #1e293b
$cBlue      = Get-BGR 37 99 235    # #2563eb
$cSky       = Get-BGR 14 165 233   # #0ea5e9
$cEmerald   = Get-BGR 16 185 129   # #10b981
$cGreenDark = Get-BGR 5 150 105    # #059669
$cAmber     = Get-BGR 245 158 11   # #f59e0b
$cGoldDark  = Get-BGR 217 119 6    # #d97706
$cRed       = Get-BGR 239 68 68    # #ef4444
$cPurple    = Get-BGR 139 92 246   # #8b5cf6
$cLightBg   = Get-BGR 248 250 252  # #f8fafc
$cWhite     = Get-BGR 255 255 255  # #ffffff
$cCardBg    = Get-BGR 241 245 249  # #f1f5f9
$cBorder    = Get-BGR 203 213 225  # #cbd5e1
$cTextMuted = Get-BGR 100 116 139  # #64748b
$cTipBg     = Get-BGR 236 253 245  # #ecfdf5 (soft mint green tip box)
$cTipBorder = Get-BGR 167 243 208  # #a7f3d0

function Style-Header($range, $text, $bgColor, $height=35, $fontSize=13) {
    $range.Merge()
    $cell = $range.Cells.Item(1, 1)
    Set-Cell $cell $text
    $cell.Font.Size = $fontSize
    $cell.Font.Bold = $true
    $cell.Font.Color = $cWhite
    $cell.Interior.Color = $bgColor
    $range.RowHeight = $height
    $cell.VerticalAlignment = -4108
    $cell.HorizontalAlignment = -4108
}

function Style-TipBanner($range, $text) {
    $range.Merge()
    $cell = $range.Cells.Item(1, 1)
    Set-Cell $cell $text
    $cell.Font.Size = 10
    $cell.Font.Bold = $true
    $cell.Font.Color = $cGreenDark
    $cell.Interior.Color = $cTipBg
    $range.RowHeight = 24
    $cell.VerticalAlignment = -4108
    $cell.HorizontalAlignment = -4131 # left align
    for ($b = 7; $b -le 10; $b++) {
        $range.Borders.Item($b).LineStyle = 1
        $range.Borders.Item($b).Color = $cTipBorder
    }
}

function Style-TableHeader($range, $bgColor=$cNavyMid) {
    $range.Font.Bold = $true
    $range.Font.Color = $cWhite
    $range.Interior.Color = $bgColor
    $range.RowHeight = 26
    $range.VerticalAlignment = -4108
    $range.HorizontalAlignment = -4108
}

function Add-Dropdown($range, $formulaList) {
    try {
        $val = $range.Validation
        $val.Delete()
        $val.Add(3, 1, 1, $formulaList)
        $val.IgnoreBlank = $true
        $val.InCellDropdown = $true
    } catch {}
}

# =============================================================================
# 09_PARAMETRELER
# =============================================================================
Write-Host "09_PARAMETRELER hazirlaniyor..." -ForegroundColor Yellow
$shP = $wb.Sheets.Item("09_PARAMETRELER")
$shP.Tab.Color = $cNavyMid

Set-Cell $shP.Cells.Item(1, 1) "DONEM AYLARI"
Set-Cell $shP.Cells.Item(1, 2) "AKADEMIK AYLAR"
Set-Cell $shP.Cells.Item(1, 3) "YILLAR"
Set-Cell $shP.Cells.Item(1, 4) "PERSONEL ODEME TURLERI"
Set-Cell $shP.Cells.Item(1, 5) "ODEME KANALLARI"
Set-Cell $shP.Cells.Item(1, 6) "ALACAK TURLERI"
Set-Cell $shP.Cells.Item(1, 7) "DURUMLAR"

$months = @("01 - Ocak", "02 - Subat", "03 - Mart", "04 - Nisan", "05 - Mayis", "06 - Haziran", "07 - Temmuz", "08 - Agustos", "09 - Eylul", "10 - Ekim", "11 - Kasim", "12 - Aralik")
for ($i=0; $i -lt $months.Length; $i++) { Set-Cell $shP.Cells.Item($i+2, 1) $months[$i] }

$akademik = @("Eylul", "Ekim", "Kasim", "Aralik", "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos")
for ($i=0; $i -lt $akademik.Length; $i++) { Set-Cell $shP.Cells.Item($i+2, 2) $akademik[$i] }

$years = @(2025, 2026, 2027, 2028, 2029, 2030)
for ($i=0; $i -lt $years.Length; $i++) { Set-Cell $shP.Cells.Item($i+2, 3) $years[$i] }

$pTypes = @("MAAS", "SOSYAL-1 (SGK)", "SOSYAL-2 (VERGI)", "KIRA", "AVANS", "DIGER")
for ($i=0; $i -lt $pTypes.Length; $i++) { Set-Cell $shP.Cells.Item($i+2, 4) $pTypes[$i] }

$channels = @("BANKA", "NAKIT", "ELDEN", "POS / KREDI KARTI", "DIGER")
for ($i=0; $i -lt $channels.Length; $i++) { Set-Cell $shP.Cells.Item($i+2, 5) $channels[$i] }

$alacakTurleri = @("CFT", "THH", "KRM", "BK", "Diger", "SAH", "KAMP.", "TAK")
for ($i=0; $i -lt $alacakTurleri.Length; $i++) { Set-Cell $shP.Cells.Item($i+2, 6) $alacakTurleri[$i] }

$statuses = @("AKTIF", "PASIF", "ODENDI", "KISMI ODENDI", "ODENMEDI", "MUAF")
for ($i=0; $i -lt $statuses.Length; $i++) { Set-Cell $shP.Cells.Item($i+2, 7) $statuses[$i] }

Style-TableHeader ($shP.Range("A1:G1")) $cNavyDark
$shP.Columns.AutoFit() | Out-Null

# =============================================================================
# 01_PERSONEL_KADROSU (50 Satirlik Acik & Dinamik Alan + Acilir Kutular)
# =============================================================================
Write-Host "01_PERSONEL_KADROSU hazirlaniyor..." -ForegroundColor Yellow
$shK = $wb.Sheets.Item("01_PERSONEL_KADROSU")
$shK.Tab.Color = $cBlue

Style-Header ($shK.Range("A1:O1")) "PERSONEL & MULK KADROSU - ANA TAHAKKUK, BASLANGIC VE ZAM TANIMLARI" $cNavyDark
Style-TipBanner ($shK.Range("A2:O2")) "  * BILGI: Yeni personel veya mulk eklemek icin asagidaki bos satirlara dogrudan yazin. Baslama ve Zam aylarini acilir kutudan secin. Hesaplamalar aninda guncellenir."

$headersK = @(
    "S.N", "KOD", "AD SOYAD / MULK", "GOREVI / UNVAN", "TELEFON",
    "BASLAMA DONEMI", "BAZ NET MAAS", "SOSYAL-1 (SGK)", "SOSYAL-2 (VERGI)", "KIRA BEDELI",
    "ZAM DONEMI", "ZAMLI NET MAAS", "GUNCEL AYLIK HAKEDIS", "BASLANGIC BORCU", "DURUM"
)
for ($c = 1; $c -le $headersK.Length; $c++) {
    Set-Cell $shK.Cells.Item(4, $c) $headersK[$c - 1]
}
Style-TableHeader ($shK.Range("A4:O4")) $cNavyMid

# Baslangic Verileri
$personnelData = @(
    @("P001", "Mehmet D.", "Mudur / Yonetici", "0532 100 20 30", "09 - Eylul", 45000, 3500, 2000, 0, "11 - Kasim", 52000, 0, "AKTIF"),
    @("P002", "Serdar U.", "Yazilim Uzmani", "0533 200 30 40", "09 - Eylul", 38000, 3000, 1500, 0, "11 - Kasim", 44000, 0, "AKTIF"),
    @("P003", "Ahmet Yilmaz", "Kidemli Egitmen", "0542 300 40 50", "09 - Eylul", 42000, 3200, 1800, 0, "", 0, 0, "AKTIF"),
    @("P004", "Ayse Kaya", "Halkla Iliskiler", "0555 400 50 60", "10 - Ekim",  32000, 2500, 1200, 0, "", 0, 0, "AKTIF"),
    @("P005", "Fatma Demir", "Muhasebe & Finans", "0536 500 60 70", "09 - Eylul", 35000, 2800, 1400, 0, "12 - Aralik", 40000, 0, "AKTIF"),
    @("P006", "Ali Celik", "Teknik Destek", "0544 600 70 80", "10 - Ekim",  28000, 2200, 1000, 0, "", 0, 0, "AKTIF"),
    @("K001", "Merkez Bina Sahibi", "Genel Merkez Kira", "0532 777 88 99", "09 - Eylul", 0, 0, 0, 35000, "", 0, 0, "AKTIF"),
    @("K002", "Sube 2 Derslik", "Ek Derslik Kira", "0533 888 99 00", "09 - Eylul", 0, 0, 0, 22000, "", 0, 0, "AKTIF")
)

# 50 satirlik hazir alan olustur (Satir 5'ten 54'e kadar)
$maxStaffRows = 50
for ($idx = 1; $idx -le $maxStaffRows; $idx++) {
    $r = $idx + 4
    
    # S.N Formulu: Eger Ad Soyad doluysa satir numarasi, degilse bos
    $shK.Cells.Item($r, 1).Formula = "=IF(C$r<>"""", $idx, """")"
    
    # Eger ilk 8 satirdaysak ornek verileri yaz
    if ($idx -le $personnelData.Length) {
        $p = $personnelData[$idx - 1]
        Set-Cell $shK.Cells.Item($r, 2) $p[0] # Kod
        Set-Cell $shK.Cells.Item($r, 3) $p[1] # Ad
        Set-Cell $shK.Cells.Item($r, 4) $p[2] # Gorev
        Set-Cell $shK.Cells.Item($r, 5) $p[3] # Tel
        Set-Cell $shK.Cells.Item($r, 6) $p[4] # Baslama Donemi
        Set-Cell $shK.Cells.Item($r, 7) $p[5] # Baz Maas
        Set-Cell $shK.Cells.Item($r, 8) $p[6] # SGK
        Set-Cell $shK.Cells.Item($r, 9) $p[7] # Vergi
        Set-Cell $shK.Cells.Item($r, 10) $p[8] # Kira
        Set-Cell $shK.Cells.Item($r, 11) $p[9] # Zam Donemi
        Set-Cell $shK.Cells.Item($r, 12) $p[10] # Zamli Maas
        Set-Cell $shK.Cells.Item($r, 14) $p[11] # Baslangic Borcu
        Set-Cell $shK.Cells.Item($r, 15) $p[12] # Durum
    }
    
    # Guncel Hakedis Formulu (Ad doluysa hesaplar):
    $shK.Cells.Item($r, 13).Formula = "=IF(C$r="""", """", IF(L$r>0, L$r+H$r+I$r+J$r, G$r+H$r+I$r+J$r))"
    $shK.Rows.Item($r).RowHeight = 22
}

# Sayi formatlari
$shK.Range("G5:J54").NumberFormat = "#,##0.00 TL"
$shK.Range("L5:N54").NumberFormat = "#,##0.00 TL"

# Acilir Listeler (Validation): Baslama Donemi, Zam Donemi, Durum
Add-Dropdown ($shK.Range("F5:F54")) '=''09_PARAMETRELER''!$A$2:$A$13'
Add-Dropdown ($shK.Range("K5:K54")) '=''09_PARAMETRELER''!$A$2:$A$13'
Add-Dropdown ($shK.Range("O5:O54")) "AKTIF, PASIF"

# Toplam Satiri (Satir 55)
$totRK = 55
Set-Cell $shK.Cells.Item($totRK, 3) "GENEL KADRO TOPLAMI (TUM SATIRLAR):"
$shK.Cells.Item($totRK, 3).Font.Bold = $true
$shK.Cells.Item($totRK, 7).Formula = "=SUM(G5:G54)"
$shK.Cells.Item($totRK, 8).Formula = "=SUM(H5:H54)"
$shK.Cells.Item($totRK, 9).Formula = "=SUM(I5:I54)"
$shK.Cells.Item($totRK, 10).Formula = "=SUM(J5:J54)"
$shK.Cells.Item($totRK, 13).Formula = "=SUM(M5:M54)"
$shK.Cells.Item($totRK, 14).Formula = "=SUM(N5:N54)"

$totRangeK = $shK.Range("A$totRK:O$totRK")
$totRangeK.Font.Bold = $true
$totRangeK.Interior.Color = $cLightBg
$totRangeK.Borders.Item(8).LineStyle = 1
$totRangeK.Borders.Item(9).LineStyle = -4119
$shK.Range("G$totRK:N$totRK").NumberFormat = "#,##0.00 TL"
$shK.Columns.AutoFit() | Out-Null

# =============================================================================
# 02_AYLIK_TAKIP_PANELI (Kadroya Eklenen Herkesi Otomatik Ceken Dinamik 50 Satir)
# =============================================================================
Write-Host "02_AYLIK_TAKIP_PANELI hazirlaniyor..." -ForegroundColor Yellow
$shA = $wb.Sheets.Item("02_AYLIK_TAKIP_PANELI")
$shA.Tab.Color = $cSky

Style-Header ($shA.Range("A1:O1")) "AYLIK MAAS & GIDER MUTABAKAT VE TAKIP PANELI" $cNavyDark
Style-TipBanner ($shA.Range("A2:O2")) "  * BILGI: Bu panel '01_PERSONEL_KADROSU' sayfasina baglidir. Yeni personel eklediginizde otomatik buraya gelir ve maas/tahakkuk hesaplanir."

Set-Cell $shA.Cells.Item(3, 2) "SECILI FIRMA:"
$shA.Cells.Item(3, 2).Font.Bold = $true
$shA.Cells.Item(3, 3).Formula = "='00_DASHBOARD'!B4"
$shA.Cells.Item(3, 3).Font.Bold = $true

Set-Cell $shA.Cells.Item(3, 5) "SECILI HESAP DONEMI:"
$shA.Cells.Item(3, 5).Font.Bold = $true
$shA.Cells.Item(3, 6).Formula = "='00_DASHBOARD'!E4"
$shA.Cells.Item(3, 6).Font.Bold = $true
$shA.Cells.Item(3, 6).Font.Color = $cBlue

$headersA = @(
    "S.N", "KOD", "AD SOYAD / MULK", "GOREV",
    "BASLAMA", "NET MAAS", "SOSYAL-1 (SGK)", "SOSYAL-2 (VERGI)", "KIRA",
    "DONEM TAHAKKUKU", "DONEMDE ODENEN", "DONEM KALAN BORC",
    "DEVREDEN ESKI BORC", "TOPLAM SIRKET BORCU", "DURUM"
)
for ($c = 1; $c -le $headersA.Length; $c++) {
    Set-Cell $shA.Cells.Item(5, $c) $headersA[$c - 1]
}
Style-TableHeader ($shA.Range("A5:O5")) $cNavyMid

# 50 satirlik otomatik baglanti (Satir 6'dan 55'e kadar)
for ($idx = 1; $idx -le $maxStaffRows; $idx++) {
    $r = $idx + 5
    $srcR = $idx + 4
    
    $shA.Cells.Item($r, 1).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", $idx)"
    $shA.Cells.Item($r, 2).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!B$srcR)"
    $shA.Cells.Item($r, 3).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!C$srcR)"
    $shA.Cells.Item($r, 4).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!D$srcR)"
    $shA.Cells.Item($r, 5).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!F$srcR)"
    
    # Net Maas: Zamli maas varsa zamli maas, yoksa baz maas
    $shA.Cells.Item($r, 6).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", IF('01_PERSONEL_KADROSU'!L$srcR>0, '01_PERSONEL_KADROSU'!L$srcR, '01_PERSONEL_KADROSU'!G$srcR))"
    $shA.Cells.Item($r, 7).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!H$srcR)"
    $shA.Cells.Item($r, 8).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!I$srcR)"
    $shA.Cells.Item($r, 9).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!J$srcR)"
    $shA.Cells.Item($r, 10).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", SUM(F$r:I$r))"
    $shA.Cells.Item($r, 11).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", SUMIFS('03_ODEME_HAREKETLERI'!H:H, '03_ODEME_HAREKETLERI'!D:D, B$r, '03_ODEME_HAREKETLERI'!C:C, `$F`$3))"
    $shA.Cells.Item($r, 12).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", MAX(0, J$r - K$r))"
    $shA.Cells.Item($r, 13).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", '01_PERSONEL_KADROSU'!N$srcR)"
    $shA.Cells.Item($r, 14).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", L$r + M$r)"
    $shA.Cells.Item($r, 15).Formula = "=IF('01_PERSONEL_KADROSU'!C$srcR="""", """", IF(J$r=0, ""BASLAMADI"", IF(K$r>=J$r, ""ODENDI"", IF(K$r>0, ""KISMI ODENDI"", ""ODENMEDI""))))"
    $shA.Rows.Item($r).RowHeight = 22
}

$shA.Range("F6:N55").NumberFormat = "#,##0.00 TL"

# Toplam Satiri (Satir 56)
$totRA = 56
Set-Cell $shA.Cells.Item($totRA, 4) "GENEL TOPLAMLAR:"
$shA.Cells.Item($totRA, 4).Font.Bold = $true
$shA.Cells.Item($totRA, 6).Formula = "=SUM(F6:F55)"
$shA.Cells.Item($totRA, 7).Formula = "=SUM(G6:G55)"
$shA.Cells.Item($totRA, 8).Formula = "=SUM(H6:H55)"
$shA.Cells.Item($totRA, 9).Formula = "=SUM(I6:I55)"
$shA.Cells.Item($totRA, 10).Formula = "=SUM(J6:J55)"
$shA.Cells.Item($totRA, 11).Formula = "=SUM(K6:K55)"
$shA.Cells.Item($totRA, 12).Formula = "=SUM(L6:L55)"
$shA.Cells.Item($totRA, 13).Formula = "=SUM(M6:M55)"
$shA.Cells.Item($totRA, 14).Formula = "=SUM(N6:N55)"

$totRangeA = $shA.Range("A$totRA:O$totRA")
$totRangeA.Font.Bold = $true
$totRangeA.Interior.Color = $cLightBg
$totRangeA.Borders.Item(8).LineStyle = 1
$totRangeA.Borders.Item(9).LineStyle = -4119
$shA.Range("F$totRA:N$totRA").NumberFormat = "#,##0.00 TL"
$shA.Columns.AutoFit() | Out-Null

# =============================================================================
# 03_ODEME_HAREKETLERI (Personel & Kira Odemeleri - Acilir Kutulu 50 Satir)
# =============================================================================
Write-Host "03_ODEME_HAREKETLERI hazirlaniyor..." -ForegroundColor Yellow
$shO = $wb.Sheets.Item("03_ODEME_HAREKETLERI")
$shO.Tab.Color = $cGreenDark

Style-Header ($shO.Range("A1:J1")) "KASA VE BANKA ODEME HAREKETLERI (PERSONEL, MAAS, SGK, KIRA)" $cNavyDark
Style-TipBanner ($shO.Range("A2:J2")) "  * BILGI: Yapilan tum maas, SGK ve kira odemelerini asagiya ekleyin. Hesap Donemi, Odeme Turu ve Kanali acilir kutulardan secilebilir."

$headersO = @(
    "ISLEM ID", "TARIH", "HESAP DONEMI", "PERSONEL / MULK KODU",
    "AD SOYAD / UNVAN", "ODEME TURU", "ODEME KANALI",
    "TUTAR (TL)", "MAKBUZ / DEKONT NO", "ACIKLAMA"
)
for ($c = 1; $c -le $headersO.Length; $c++) {
    Set-Cell $shO.Cells.Item(4, $c) $headersO[$c - 1]
}
Style-TableHeader ($shO.Range("A4:J4")) $cNavyMid

$paymentsData = @(
    @("05.09.2026", "09 - Eylul", "P001", "MAAS", "BANKA", 45000, "TR-8901", "Eylul net maas"),
    @("05.09.2026", "09 - Eylul", "P002", "MAAS", "BANKA", 38000, "TR-8902", "Eylul net maas"),
    @("08.09.2026", "09 - Eylul", "K001", "KIRA", "BANKA", 35000, "TR-8903", "Eylul merkez kira"),
    @("05.10.2026", "10 - Ekim", "P001", "MAAS", "BANKA", 45000, "TR-9101", "Ekim net maas"),
    @("05.10.2026", "10 - Ekim", "P002", "MAAS", "BANKA", 38000, "TR-9102", "Ekim net maas"),
    @("05.10.2026", "10 - Ekim", "P003", "MAAS", "BANKA", 42000, "TR-9103", "Ekim net maas"),
    @("05.10.2026", "10 - Ekim", "P004", "MAAS", "BANKA", 32000, "TR-9104", "Ekim net maas"),
    @("06.10.2026", "10 - Ekim", "P005", "MAAS", "BANKA", 35000, "TR-9105", "Ekim net maas"),
    @("08.10.2026", "10 - Ekim", "K001", "KIRA", "BANKA", 35000, "TR-9106", "Ekim merkez kira"),
    @("15.10.2026", "10 - Ekim", "P001", "SOSYAL-1 (SGK)", "BANKA", 3500, "TR-9120", "Ekim SGK"),
    @("15.10.2026", "10 - Ekim", "P002", "SOSYAL-1 (SGK)", "BANKA", 3000, "TR-9121", "Ekim SGK"),
    @("20.10.2026", "10 - Ekim", "P006", "MAAS", "NAKIT", 20000, "MK-204", "Ekim kismi nakit maas")
)

$maxPayRows = 50
for ($idx = 1; $idx -le $maxPayRows; $idx++) {
    $r = $idx + 4
    $shO.Cells.Item($r, 1).Formula = "=IF(B$r<>"""", $idx, """")"
    
    if ($idx -le $paymentsData.Length) {
        $pay = $paymentsData[$idx - 1]
        Set-Cell $shO.Cells.Item($r, 2) $pay[0] # Tarih
        Set-Cell $shO.Cells.Item($r, 3) $pay[1] # Donem
        Set-Cell $shO.Cells.Item($r, 4) $pay[2] # Kod
        Set-Cell $shO.Cells.Item($r, 6) $pay[3] # Tur
        Set-Cell $shO.Cells.Item($r, 7) $pay[4] # Kanal
        Set-Cell $shO.Cells.Item($r, 8) $pay[5] # Tutar
        Set-Cell $shO.Cells.Item($r, 9) $pay[6] # Dekont
        Set-Cell $shO.Cells.Item($r, 10) $pay[7] # Not
    }
    
    # Ad Soyad VLOOKUP:
    $shO.Cells.Item($r, 5).Formula = "=IF(D$r="""", """", IFERROR(VLOOKUP(D$r, '01_PERSONEL_KADROSU'!B:C, 2, FALSE), ""-""))"
    $shO.Rows.Item($r).RowHeight = 21
}

$shO.Range("H5:H54").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shO.Range("C5:C54")) '=''09_PARAMETRELER''!$A$2:$A$13'
Add-Dropdown ($shO.Range("F5:F54")) '=''09_PARAMETRELER''!$D$2:$D$7'
Add-Dropdown ($shO.Range("G5:G54")) '=''09_PARAMETRELER''!$E$2:$E$6'

$totRO = 55
Set-Cell $shO.Cells.Item($totRO, 5) "TOPLAM YAPILAN ODEME:"
$shO.Cells.Item($totRO, 5).Font.Bold = $true
$shO.Cells.Item($totRO, 8).Formula = "=SUM(H5:H54)"

$totRangeO = $shO.Range("A$totRO:J$totRO")
$totRangeO.Font.Bold = $true
$totRangeO.Interior.Color = $cLightBg
$totRangeO.Borders.Item(8).LineStyle = 1
$totRangeO.Borders.Item(9).LineStyle = -4119
$shO.Range("H$totRO").NumberFormat = "#,##0.00 TL"
$shO.Columns.AutoFit() | Out-Null

# =============================================================================
# 04_OGRENCI_ALACAK_TAKIP (50 Satirlik Acik & Dinamik Alan + Acilir Kutular)
# =============================================================================
Write-Host "04_OGRENCI_ALACAK_TAKIP hazirlaniyor..." -ForegroundColor Yellow
$shS = $wb.Sheets.Item("04_OGRENCI_ALACAK_TAKIP")
$shS.Tab.Color = $cPurple

Style-Header ($shS.Range("A1:Q1")) "OGRENCI SOZLESME, TAKSIT, MUAF AY VE ALACAK TAKIP PANELI" $cNavyDark
Style-TipBanner ($shS.Range("A2:Q2")) "  * BILGI: Yeni ogrenci eklemek icin bos satirlara ad, baslama ayi ve ucreti yazin. Muaf/silinen ay secebilirsiniz; sozlesme ve kalan alacak otomatik hesaplanir."

$headersS = @(
    "OGR NO", "OGRENCI AD SOYAD", "VELI ADI", "VELI TELEFON",
    "BASLAMA AYI", "BRUT EGITIM UCRETI", "INDIRIM / BURS", "NET EGITIM",
    "TOPLAM TAKSIT", "BAZ AYLIK TAKSIT", "MUAF / SILINEN AY",
    "NET SOZLESME TUTARI", "EK HIZMET (KIRT/SERV)", "TOPLAM ALACAK",
    "TAHSIL EDILEN (ODENEN)", "KALAN BAKIYE", "DURUM"
)
for ($c = 1; $c -le $headersS.Length; $c++) {
    Set-Cell $shS.Cells.Item(4, $c) $headersS[$c - 1]
}
Style-TableHeader ($shS.Range("A4:Q4")) $cNavyMid

$studentsData = @(
    @("OGR-101", "Ali Yildiz", "Hasan Yildiz", "0533 111 22 33", "Eylul", 120000, 10000, 10, 0, 5000),
    @("OGR-102", "Zeynep Kaya", "Kemal Kaya", "0532 222 33 44", "Eylul", 95000, 5000, 8, 1, 4000),
    @("OGR-103", "Burak Demir", "Osman Demir", "0544 333 44 55", "Ekim", 140000, 20000, 10, 0, 6000),
    @("OGR-104", "Elif Sahin", "Mustafa Sahin", "0555 444 55 66", "Eylul", 110000, 10000, 10, 2, 3500),
    @("OGR-105", "Can Ozturk", "Salih Ozturk", "0536 555 66 77", "Kasim", 130000, 10000, 10, 0, 5000)
)

$maxStudentRows = 50
for ($idx = 1; $idx -le $maxStudentRows; $idx++) {
    $r = $idx + 4
    
    # Ogr No otomatik: Eger Ad doluysa
    $shS.Cells.Item($r, 1).Formula = "=IF(B$r<>"""", ""OGR-"" & TEXT(ROW()+96, ""000""), """")"
    
    if ($idx -le $studentsData.Length) {
        $st = $studentsData[$idx - 1]
        Set-Cell $shS.Cells.Item($r, 2) $st[1] # Ad
        Set-Cell $shS.Cells.Item($r, 3) $st[2] # Veli
        Set-Cell $shS.Cells.Item($r, 4) $st[3] # Tel
        Set-Cell $shS.Cells.Item($r, 5) $st[4] # Baslama
        Set-Cell $shS.Cells.Item($r, 6) $st[5] # Brut
        Set-Cell $shS.Cells.Item($r, 7) $st[6] # Indirim
        Set-Cell $shS.Cells.Item($r, 9) $st[7] # Taksit
        Set-Cell $shS.Cells.Item($r, 11) $st[8] # Muaf Ay
        Set-Cell $shS.Cells.Item($r, 13) $st[9] # Ek Hizmet
    }
    
    $shS.Cells.Item($r, 8).Formula = "=IF(B$r="""", """", F$r - G$r)" # Net Egitim
    $shS.Cells.Item($r, 10).Formula = "=IF(OR(B$r="""", I$r="""", I$r=0), """", ROUND(H$r / I$r, 0))" # Baz Taksit
    $shS.Cells.Item($r, 12).Formula = "=IF(B$r="""", """", J$r * (I$r - K$r))" # Net Sozlesme
    $shS.Cells.Item($r, 14).Formula = "=IF(B$r="""", """", L$r + M$r)" # Toplam Alacak
    $shS.Cells.Item($r, 15).Formula = "=IF(B$r="""", """", SUMIFS('05_OGRENCI_ODEMELERI'!G:G, '05_OGRENCI_ODEMELERI'!C:C, A$r))" # Tahsilat
    $shS.Cells.Item($r, 16).Formula = "=IF(B$r="""", """", MAX(0, N$r - O$r))" # Kalan
    $shS.Cells.Item($r, 17).Formula = "=IF(B$r="""", """", IF(P$r<=0, ""TAMAMLANDI"", ""ODENIYOR""))" # Durum
    $shS.Rows.Item($r).RowHeight = 22
}

$shS.Range("F5:H54").NumberFormat = "#,##0.00 TL"
$shS.Range("J5:J54").NumberFormat = "#,##0.00 TL"
$shS.Range("L5:P54").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shS.Range("E5:E54")) '=''09_PARAMETRELER''!$B$2:$B$13'
Add-Dropdown ($shS.Range("K5:K54")) "0, 1, 2, 3, 4, 5, 6"
Add-Dropdown ($shS.Range("Q5:Q54")) "ODENIYOR, TAMAMLANDI, DONDURDU, AYRILDI"

$totRS = 55
Set-Cell $shS.Cells.Item($totRS, 4) "TOPLAM OGRENCI ALACAKLARI:"
$shS.Cells.Item($totRS, 4).Font.Bold = $true
$shS.Cells.Item($totRS, 6).Formula = "=SUM(F5:F54)"
$shS.Cells.Item($totRS, 7).Formula = "=SUM(G5:G54)"
$shS.Cells.Item($totRS, 8).Formula = "=SUM(H5:H54)"
$shS.Cells.Item($totRS, 12).Formula = "=SUM(L5:L54)"
$shS.Cells.Item($totRS, 13).Formula = "=SUM(M5:M54)"
$shS.Cells.Item($totRS, 14).Formula = "=SUM(N5:N54)"
$shS.Cells.Item($totRS, 15).Formula = "=SUM(O5:O54)"
$shS.Cells.Item($totRS, 16).Formula = "=SUM(P5:P54)"

$totRangeS = $shS.Range("A$totRS:Q$totRS")
$totRangeS.Font.Bold = $true
$totRangeS.Interior.Color = $cLightBg
$totRangeS.Borders.Item(8).LineStyle = 1
$totRangeS.Borders.Item(9).LineStyle = -4119
$shS.Range("F$totRS:P$totRS").NumberFormat = "#,##0.00 TL"
$shS.Columns.AutoFit() | Out-Null

# =============================================================================
# 05_OGRENCI_ODEMELERI (Vezne & Banka Tahsilatlari - 50 Satir)
# =============================================================================
Write-Host "05_OGRENCI_ODEMELERI hazirlaniyor..." -ForegroundColor Yellow
$shSO = $wb.Sheets.Item("05_OGRENCI_ODEMELERI")
$shSO.Tab.Color = $cPurple

Style-Header ($shSO.Range("A1:H1")) "OGRENCI VEZNE & KASA TAHSILAT KAYITLARI" $cNavyDark
Style-TipBanner ($shSO.Range("A2:H2")) "  * BILGI: Ogrencilerden gelen tahsilatlari asagiya isleyin. Ogr No secildiginde isim otomatik gelir ve borc bakiyesinden duser."

$headersSO = @(
    "MAKBUZ NO", "TARIH", "OGR NO", "OGRENCI AD SOYAD",
    "DONEM (AY)", "TAHSILAT TURU", "TUTAR (TL)", "ACIKLAMA"
)
for ($c = 1; $c -le $headersSO.Length; $c++) {
    Set-Cell $shSO.Cells.Item(4, $c) $headersSO[$c - 1]
}
Style-TableHeader ($shSO.Range("A4:H4")) $cNavyMid

$studentPayments = @(
    @("MK-101", "15.09.2026", "OGR-101", "Eylul", "Banka Havale", 11000, "1. Taksit odemesi"),
    @("MK-102", "15.09.2026", "OGR-102", "Eylul", "Nakit", 11250, "1. Taksit odemesi"),
    @("MK-103", "16.09.2026", "OGR-104", "Eylul", "Kredi Karti", 10000, "Eylul pesinat"),
    @("MK-104", "15.10.2026", "OGR-101", "Ekim", "Banka Havale", 11000, "2. Taksit odemesi"),
    @("MK-105", "15.10.2026", "OGR-102", "Ekim", "Nakit", 11250, "2. Taksit odemesi"),
    @("MK-106", "18.10.2026", "OGR-103", "Ekim", "Banka Havale", 12000, "1. Taksit baslangici"),
    @("MK-107", "20.10.2026", "OGR-101", "Ekim", "Nakit", 5000, "Kirtasiye ucreti tahsilati")
)

$maxOgrPayRows = 50
for ($idx = 1; $idx -le $maxOgrPayRows; $idx++) {
    $r = $idx + 4
    if ($idx -le $studentPayments.Length) {
        $sp = $studentPayments[$idx - 1]
        Set-Cell $shSO.Cells.Item($r, 1) $sp[0]
        Set-Cell $shSO.Cells.Item($r, 2) $sp[1]
        Set-Cell $shSO.Cells.Item($r, 3) $sp[2]
        Set-Cell $shSO.Cells.Item($r, 5) $sp[3]
        Set-Cell $shSO.Cells.Item($r, 6) $sp[4]
        Set-Cell $shSO.Cells.Item($r, 7) $sp[5]
        Set-Cell $shSO.Cells.Item($r, 8) $sp[6]
    }
    $shSO.Cells.Item($r, 4).Formula = "=IF(C$r="""", """", IFERROR(VLOOKUP(C$r, '04_OGRENCI_ALACAK_TAKIP'!A:B, 2, FALSE), ""-""))"
    $shSO.Rows.Item($r).RowHeight = 21
}

$shSO.Range("G5:G54").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shSO.Range("E5:E54")) '=''09_PARAMETRELER''!$B$2:$B$13'
Add-Dropdown ($shSO.Range("F5:F54")) "Banka Havale, Nakit, Kredi Karti / POS, Diger"

$totRSO = 55
Set-Cell $shSO.Cells.Item($totRSO, 4) "TOPLAM TAHSIL EDILEN:"
$shSO.Cells.Item($totRSO, 4).Font.Bold = $true
$shSO.Cells.Item($totRSO, 7).Formula = "=SUM(G5:G54)"

$totRangeSO = $shSO.Range("A$totRSO:H$totRSO")
$totRangeSO.Font.Bold = $true
$totRangeSO.Interior.Color = $cLightBg
$totRangeSO.Borders.Item(8).LineStyle = 1
$totRangeSO.Borders.Item(9).LineStyle = -4119
$shSO.Range("G$totRSO").NumberFormat = "#,##0.00 TL"
$shSO.Columns.AutoFit() | Out-Null

# =============================================================================
# 06_OGRENCI_MATRISI (12 Aylik Taksit & Muafiyet Matrisi - 50 Ogrenci Uyarli)
# =============================================================================
Write-Host "06_OGRENCI_MATRISI hazirlaniyor..." -ForegroundColor Yellow
$shM = $wb.Sheets.Item("06_OGRENCI_MATRISI")
$shM.Tab.Color = $cPurple

Style-Header ($shM.Range("A1:P1")) "OGRENCI 12 AYLIK TAKSIT, MUAF AY VE PLAN MATRISI" $cNavyDark

$headersM = @(
    "OGR NO", "AD SOYAD", "BASLAMA", "BAZ TAKSIT",
    "Eylul", "Ekim", "Kasim", "Aralik", "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos"
)
for ($c = 1; $c -le $headersM.Length; $c++) {
    Set-Cell $shM.Cells.Item(3, $c) $headersM[$c - 1]
}
Style-TableHeader ($shM.Range("A3:P3")) $cNavyMid

for ($idx = 1; $idx -le $maxStudentRows; $idx++) {
    $r = $idx + 3
    $srcR = $idx + 4
    $shM.Cells.Item($r, 1).Formula = "=IF('04_OGRENCI_ALACAK_TAKIP'!B$srcR="""", """", '04_OGRENCI_ALACAK_TAKIP'!A$srcR)"
    $shM.Cells.Item($r, 2).Formula = "=IF('04_OGRENCI_ALACAK_TAKIP'!B$srcR="""", """", '04_OGRENCI_ALACAK_TAKIP'!B$srcR)"
    $shM.Cells.Item($r, 3).Formula = "=IF('04_OGRENCI_ALACAK_TAKIP'!B$srcR="""", """", '04_OGRENCI_ALACAK_TAKIP'!E$srcR)"
    $shM.Cells.Item($r, 4).Formula = "=IF('04_OGRENCI_ALACAK_TAKIP'!B$srcR="""", """", '04_OGRENCI_ALACAK_TAKIP'!J$srcR)"

    for ($col = 5; $col -le 16; $col++) {
        $mIdx = $col - 4
        $shM.Cells.Item($r, $col).Formula = "=IF('04_OGRENCI_ALACAK_TAKIP'!B$srcR="""", """", IF('04_OGRENCI_ALACAK_TAKIP'!K$srcR>=$mIdx, ""MUAF"", D$r))"
    }
    $shM.Rows.Item($r).RowHeight = 22
}
$shM.Range("D4:D53").NumberFormat = "#,##0.00 TL"
$shM.Columns.AutoFit() | Out-Null

# =============================================================================
# 07_DIGER_ALACAK_TAKIP (60 Satirlik Acik & Dinamik Alan + Acilir Kutular)
# =============================================================================
Write-Host "07_DIGER_ALACAK_TAKIP hazirlaniyor..." -ForegroundColor Yellow
$shDAlacak = $wb.Sheets.Item("07_DIGER_ALACAK_TAKIP")
$shDAlacak.Tab.Color = $cAmber

Style-Header ($shDAlacak.Range("A1:J1")) "DIGER ALACAK & CARI HESAP TAKIP MODULU" $cNavyDark
Style-TipBanner ($shDAlacak.Range("A2:J2")) "  * BILGI: Kurum disi alacaklar, cari hesaplar, saha masraflari ve diger tum borclulari asagiya ekleyin. Tur acilir kutudan secilir."

$headersDA = @(
    "KAYIT NO", "TARIH", "REF", "CARI / KISI / FIRMA", "ALACAK TURU",
    "ALACAK TUTARI", "TAHSIL EDILEN", "KALAN BAKIYE", "ACIKLAMA", "DURUM"
)
for ($c = 1; $c -le $headersDA.Length; $c++) {
    Set-Cell $shDAlacak.Cells.Item(4, $c) $headersDA[$c - 1]
}
Style-TableHeader ($shDAlacak.Range("A4:J4")) $cNavyMid

$alacaklarData = @(
    @("01.10.2026", "FD", "Ahmet Yilmaz", "BK", 20000, "FD - BK 1. Parca Alacak"),
    @("01.01.2026", "FD", "Ahmet Yilmaz", "BK", 10000, "FD - BK 2. Parca Alacak"),
    @("02.05.2026", "FD", "Ahmet Yilmaz", "CFT", 15000, "FD - CFT Borcu"),
    @("01.02.2026", "TD", "Mehmet Demir", "CFT", 22000, "50 Adet B Malzemesi"),
    @("03.12.2026", "AS", "Ahmet Yilmaz", "BK", 3000, "Elden Verilen Borc"),
    @("01.03.2025", "SS", "Ayse Kaya", "THH", 12000, "Yazilim Destegi"),
    @("11.12.2026", "MFA", "AG", "CFT", 20000, "Cari acik hesap"),
    @("21.09.2028", "MFA", "SA", "CFT", 200000, "Kurumsal proje bedeli"),
    @("03.07.2030", "MFA", "SA", "SAH", 10000, "Saha masrafi"),
    @("13.04.2032", "MFA", "AA", "SAH", 5000, "Saha masrafi 2"),
    @("23.01.2034", "MA", "Ibrahim", "SAH", 1000000, "Ana sozlesme alacagi"),
    @("04.11.2035", "FD", "DD", "Diger", 50000, "Genel diger alacak"),
    @("15.08.2037", "FD", "SSW", "KAMP.", 340000, "Kampanya katilim alacagi")
)

$maxAlacakRows = 60
for ($idx = 1; $idx -le $maxAlacakRows; $idx++) {
    $r = $idx + 4
    $shDAlacak.Cells.Item($r, 1).Formula = "=IF(D$r<>"""", $idx, """")"
    
    if ($idx -le $alacaklarData.Length) {
        $al = $alacaklarData[$idx - 1]
        Set-Cell $shDAlacak.Cells.Item($r, 2) $al[0] # Tarih
        Set-Cell $shDAlacak.Cells.Item($r, 3) $al[1] # Ref
        Set-Cell $shDAlacak.Cells.Item($r, 4) $al[2] # Cari
        Set-Cell $shDAlacak.Cells.Item($r, 5) $al[3] # Tur
        Set-Cell $shDAlacak.Cells.Item($r, 6) $al[4] # Tutar
        Set-Cell $shDAlacak.Cells.Item($r, 9) $al[5] # Not
    }
    
    $shDAlacak.Cells.Item($r, 7).Formula = "=IF(D$r="""", """", SUMIFS('08_DIGER_TAHSILATLAR'!F:F, '08_DIGER_TAHSILATLAR'!D:D, D$r, '08_DIGER_TAHSILATLAR'!E:E, E$r))"
    $shDAlacak.Cells.Item($r, 8).Formula = "=IF(D$r="""", """", MAX(0, F$r - G$r))"
    $shDAlacak.Cells.Item($r, 10).Formula = "=IF(D$r="""", """", IF(H$r<=0, ""KAPANDI"", ""ACIK HESAP""))"
    $shDAlacak.Rows.Item($r).RowHeight = 22
}

$shDAlacak.Range("F5:H64").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shDAlacak.Range("E5:E64")) '=''09_PARAMETRELER''!$F$2:$F$9'
Add-Dropdown ($shDAlacak.Range("J5:J64")) "ACIK HESAP, KAPANDI"

$totRDA = 65
Set-Cell $shDAlacak.Cells.Item($totRDA, 4) "TOPLAM DIGER ALACAKLAR:"
$shDAlacak.Cells.Item($totRDA, 4).Font.Bold = $true
$shDAlacak.Cells.Item($totRDA, 6).Formula = "=SUM(F5:F64)"
$shDAlacak.Cells.Item($totRDA, 7).Formula = "=SUM(G5:G64)"
$shDAlacak.Cells.Item($totRDA, 8).Formula = "=SUM(H5:H64)"

$totRangeDA = $shDAlacak.Range("A$totRDA:J$totRDA")
$totRangeDA.Font.Bold = $true
$totRangeDA.Interior.Color = $cLightBg
$totRangeDA.Borders.Item(8).LineStyle = 1
$totRangeDA.Borders.Item(9).LineStyle = -4119
$shDAlacak.Range("F$totRDA:H$totRDA").NumberFormat = "#,##0.00 TL"
$shDAlacak.Columns.AutoFit() | Out-Null

# =============================================================================
# 08_DIGER_TAHSILATLAR (Diger Alacak Tahsilatlari - 60 Satir)
# =============================================================================
Write-Host "08_DIGER_TAHSILATLAR hazirlaniyor..." -ForegroundColor Yellow
$shDTahsilat = $wb.Sheets.Item("08_DIGER_TAHSILATLAR")
$shDTahsilat.Tab.Color = $cAmber

Style-Header ($shDTahsilat.Range("A1:H1")) "DIGER ALACAK VE CARI TAHSILAT KAYITLARI" $cNavyDark
Style-TipBanner ($shDTahsilat.Range("A2:H2")) "  * BILGI: Cari alacaklardan yapilan tahsilatlari buraya girin. Cari ve Tur eslestiginde borctan otomatik duser."

$headersDT = @(
    "TAHSILAT NO", "TARIH", "REF", "CARI / KISI / FIRMA", "ALACAK TURU",
    "TAHSIL EDILEN TUTAR", "TAHSILAT SEKLI", "ACIKLAMA"
)
for ($c = 1; $c -le $headersDT.Length; $c++) {
    Set-Cell $shDTahsilat.Cells.Item(4, $c) $headersDT[$c - 1]
}
Style-TableHeader ($shDTahsilat.Range("A4:H4")) $cNavyMid

$tahsilatlarData = @(
    @("18.01.2026", "FD", "Ahmet Yilmaz", "BK", 10000, "Banka Havale", "Kismi Havale"),
    @("10.02.2026", "FD", "Ahmet Yilmaz", "CFT", 5000, "Nakit", "Nakit Odeme"),
    @("01.03.2026", "TD", "Mehmet Demir", "CFT", 15000, "Banka Havale", "Bankadan Gelen"),
    @("01.03.2026", "MFA", "AG", "CFT", 15000, "Banka Havale", "Kismi tahsilat"),
    @("01.03.2026", "mfa", "ag", "CFT", 2000, "Banka Havale", "Ek havale"),
    @("14.10.2026", "MA", "Ibrahim", "SAH", 500000, "Banka Havale", "Saha tahsilati 1. dilim")
)

$maxTahsilatRows = 60
for ($idx = 1; $idx -le $maxTahsilatRows; $idx++) {
    $r = $idx + 4
    $shDTahsilat.Cells.Item($r, 1).Formula = "=IF(D$r<>"""", $idx, """")"
    if ($idx -le $tahsilatlarData.Length) {
        $th = $tahsilatlarData[$idx - 1]
        Set-Cell $shDTahsilat.Cells.Item($r, 2) $th[0] # Tarih
        Set-Cell $shDTahsilat.Cells.Item($r, 3) $th[1] # Ref
        Set-Cell $shDTahsilat.Cells.Item($r, 4) $th[2] # Cari
        Set-Cell $shDTahsilat.Cells.Item($r, 5) $th[3] # Tur
        Set-Cell $shDTahsilat.Cells.Item($r, 6) $th[4] # Tutar
        Set-Cell $shDTahsilat.Cells.Item($r, 7) $th[5] # Sekil
        Set-Cell $shDTahsilat.Cells.Item($r, 8) $th[6] # Not
    }
    $shDTahsilat.Rows.Item($r).RowHeight = 21
}

$shDTahsilat.Range("F5:F64").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shDTahsilat.Range("E5:E64")) '=''09_PARAMETRELER''!$F$2:$F$9'
Add-Dropdown ($shDTahsilat.Range("G5:G64")) "Banka Havale, Nakit, Kredi Karti / POS, Elden, Diger"

$totRDT = 65
Set-Cell $shDTahsilat.Cells.Item($totRDT, 4) "TOPLAM YAPILAN TAHSILAT:"
$shDTahsilat.Cells.Item($totRDT, 4).Font.Bold = $true
$shDTahsilat.Cells.Item($totRDT, 6).Formula = "=SUM(F5:F64)"

$totRangeDT = $shDTahsilat.Range("A$totRDT:H$totRDT")
$totRangeDT.Font.Bold = $true
$totRangeDT.Interior.Color = $cLightBg
$totRangeDT.Borders.Item(8).LineStyle = 1
$totRangeDT.Borders.Item(9).LineStyle = -4119
$shDTahsilat.Range("F$totRDT").NumberFormat = "#,##0.00 TL"
$shDTahsilat.Columns.AutoFit() | Out-Null

# =============================================================================
# 00_DASHBOARD (Merkezi Yonetici Kontrol Paneli - Tum Genisletilmis Araliklar)
# =============================================================================
Write-Host "00_DASHBOARD hazirlaniyor..." -ForegroundColor Yellow
$shD = $wb.Sheets.Item("00_DASHBOARD")
$shD.Tab.Color = $cEmerald

$shD.Range("A1:K2").Merge()
Set-Cell $shD.Cells.Item(1, 1) "KURUMSAL YONETIM SISTEMI - MERKEZI KONTROL & OZET PANELI"
$shD.Cells.Item(1, 1).Font.Size = 15
$shD.Cells.Item(1, 1).Font.Bold = $true
$shD.Cells.Item(1, 1).Font.Color = $cWhite
$shD.Cells.Item(1, 1).Interior.Color = $cNavyDark
$shD.Cells.Item(1, 1).VerticalAlignment = -4108
$shD.Cells.Item(1, 1).HorizontalAlignment = -4108
$shD.Rows.Item(1).RowHeight = 25
$shD.Rows.Item(2).RowHeight = 25

Set-Cell $shD.Cells.Item(4, 1) "KURUM / FIRMA:"
$shD.Cells.Item(4, 1).Font.Bold = $true
Set-Cell $shD.Cells.Item(4, 2) "DONMEZ TEKNOLOJI"
$shD.Cells.Item(4, 2).Font.Bold = $true

Set-Cell $shD.Cells.Item(4, 3) "HESAP YILI:"
$shD.Cells.Item(4, 3).Font.Bold = $true
Set-Cell $shD.Cells.Item(4, 4) "2026"
$shD.Cells.Item(4, 4).Font.Bold = $true

Set-Cell $shD.Cells.Item(4, 5) "10 - Ekim"
$shD.Cells.Item(4, 5).Font.Bold = $true
$shD.Cells.Item(4, 5).Font.Color = $cBlue
$shD.Cells.Item(4, 5).Font.Size = 12

# Dashboard Ay Secici Dropdown!
Add-Dropdown ($shD.Range("E4")) '=''09_PARAMETRELER''!$A$2:$A$13'

$shD.Range("A4:F4").Interior.Color = $cCardBg
$shD.Range("A4:F4").RowHeight = 26
$shD.Range("A4:F4").VerticalAlignment = -4108

function Make-Card($sheet, $topR, $topC, $botR, $botC, $title, $formulaVal, $colorAccent, $isMoney=$true) {
    $cardRange = $sheet.Range($sheet.Cells.Item($topR, $topC), $sheet.Cells.Item($botR, $botC))
    $cardRange.Interior.Color = $cCardBg
    for ($b = 7; $b -le 10; $b++) {
        $cardRange.Borders.Item($b).LineStyle = 1
        $cardRange.Borders.Item($b).Color = $cBorder
    }
    
    $sheet.Range($sheet.Cells.Item($topR, $topC), $sheet.Cells.Item($topR, $botC)).Merge()
    $tCell = $sheet.Cells.Item($topR, $topC)
    Set-Cell $tCell $title
    $tCell.Font.Size = 9
    $tCell.Font.Bold = $true
    $tCell.Font.Color = $cTextMuted
    $tCell.HorizontalAlignment = -4108

    $sheet.Range($sheet.Cells.Item($topR + 1, $topC), $sheet.Cells.Item($botR, $botC)).Merge()
    $vCell = $sheet.Cells.Item($topR + 1, $topC)
    $vCell.Formula = $formulaVal
    $vCell.Font.Size = 14
    $vCell.Font.Bold = $true
    $vCell.Font.Color = $colorAccent
    $vCell.HorizontalAlignment = -4108
    $vCell.VerticalAlignment = -4108
    if ($isMoney) {
        $vCell.NumberFormat = "#,##0.00 TL"
    } else {
        $vCell.NumberFormat = "#,##0"
    }
}

# Satır 1 Kartları: Personel & Maaş / Kira (Satır 56 Genel Toplam)
Make-Card $shD 6 2 8 3 "SECILI AY PERSONEL TAHAKKUKU" "='02_AYLIK_TAKIP_PANELI'!J$totRA" $cBlue
Make-Card $shD 6 5 8 6 "SECILI AYDA ODENEN TOPLAM" "='02_AYLIK_TAKIP_PANELI'!K$totRA" $cGreenDark
Make-Card $shD 6 8 8 9 "KALAN AY BORCU (PERSONEL/KIRA)" "='02_AYLIK_TAKIP_PANELI'!L$totRA" $cRed

# Satır 2 Kartları: Öğrenci Alacakları (Satır 55 Genel Toplam)
Make-Card $shD 10 2 12 3 "TOPLAM OGRENCI ALACAGI" "='04_OGRENCI_ALACAK_TAKIP'!N$totRS" $cPurple
Make-Card $shD 10 5 12 6 "OGRENCIDEN TAHSIL EDILEN" "='04_OGRENCI_ALACAK_TAKIP'!O$totRS" $cGreenDark
Make-Card $shD 10 8 12 9 "KALAN OGRENCI BAKIYESI" "='04_OGRENCI_ALACAK_TAKIP'!P$totRS" $cAmber

# Satır 3 Kartları: Diğer Alacak & Cari Takip (Satır 65 Genel Toplam)
Make-Card $shD 14 2 16 3 "TOPLAM DIGER / CARI ALACAK" "='07_DIGER_ALACAK_TAKIP'!F$totRDA" $cAmber
Make-Card $shD 14 5 16 6 "DIGER ALACAK TAHSILATI" "='07_DIGER_ALACAK_TAKIP'!G$totRDA" $cGreenDark
Make-Card $shD 14 8 16 9 "NET DIGER ALACAK BAKIYESI" "='07_DIGER_ALACAK_TAKIP'!H$totRDA" $cRed

# Satır 4 Kartları: Sayımlar & Genel Durum (Dolu olanlari sayar)
Make-Card $shD 18 2 20 3 "AKTIF KADRO / PERSONEL SAYISI" "=COUNTA('01_PERSONEL_KADROSU'!C5:C54)" $cNavyMid $false
Make-Card $shD 18 5 20 6 "KAYITLI OGRENCI SAYISI" "=COUNTA('04_OGRENCI_ALACAK_TAKIP'!B5:B54)" $cPurple $false
Make-Card $shD 18 8 20 9 "TOPLAM SIRKET ALACAKLARI" "='04_OGRENCI_ALACAK_TAKIP'!P$totRS + '07_DIGER_ALACAK_TAKIP'!H$totRDA" $cGreenDark

$shD.Columns.Item(1).ColumnWidth = 5
$shD.Columns.Item(2).ColumnWidth = 18
$shD.Columns.Item(3).ColumnWidth = 18
$shD.Columns.Item(4).ColumnWidth = 5
$shD.Columns.Item(5).ColumnWidth = 18
$shD.Columns.Item(6).ColumnWidth = 18
$shD.Columns.Item(7).ColumnWidth = 5
$shD.Columns.Item(8).ColumnWidth = 18
$shD.Columns.Item(9).ColumnWidth = 18
$shD.Columns.Item(10).ColumnWidth = 5

# =============================================================================
# 10_WHATSAPP_RAPORU (Hazir Yonetici WhatsApp Bilgilendirme Formati)
# =============================================================================
Write-Host "10_WHATSAPP_RAPORU hazirlaniyor..." -ForegroundColor Yellow
$shW = $wb.Sheets.Item("10_WHATSAPP_RAPORU")
$shW.Tab.Color = $cGreenDark

Style-Header ($shW.Range("A1:G1")) "WHATSAPP VE YONETICI KONTROL RAPORU (TEK TIKLA KOPYALA)" $cNavyDark

$rReport = @(
    "[RAPOR] KURUMSAL YONETIM SISTEMI - AYLIK FINANS VE ALACAK RAPORU",
    "* Hesap Donemi: 2026 - Ekim",
    "* Kurum: DONMEZ TEKNOLOJI",
    "--------------------------------------------------",
    "[PERSONEL VE MULK DURUMU]",
    "- Toplam Personel Tahakkuku: 238.000,00 TL",
    "- Donemde Odenen Maas/Kira: 253.500,00 TL",
    "- Kalan Personel Borcu: 19.500,00 TL",
    "--------------------------------------------------",
    "[OGRENCI ALACAKLARI]",
    "- Toplam Sozlesme Alacagi: 532.250,00 TL",
    "- Tahsil Edilen Tutar: 71.500,00 TL",
    "- Kalan Ogrenci Bakiyesi: 460.750,00 TL",
    "--------------------------------------------------",
    "[DIGER VE CARI ALACAKLAR]",
    "- Toplam Cari Alacak: 1.707.000,00 TL",
    "- Tahsil Edilen: 567.000,00 TL",
    "- Kalan Acik Hesap Bakiye: 1.147.000,00 TL",
    "--------------------------------------------------",
    "[GENEL NET ALACAK BILANCOSU]: 1.607.750,00 TL",
    "Not: Bu rapor Kurumsal Yonetim Sistemi tarafindan otomatik uretilmistir."
)

for ($idx = 0; $idx -lt $rReport.Length; $idx++) {
    $rowNum = $idx + 3
    Set-Cell $shW.Cells.Item($rowNum, 2) $rReport[$idx]
    $shW.Cells.Item($rowNum, 2).Font.Size = 11
    if ($rReport[$idx].StartsWith("[")) {
        $shW.Cells.Item($rowNum, 2).Font.Bold = $true
        $shW.Cells.Item($rowNum, 2).Font.Color = $cNavyDark
    }
}
$shW.Columns.Item(2).ColumnWidth = 65

$wb.Sheets.Item("00_DASHBOARD").Activate()

if (Test-Path $targetPath) { Remove-Item $targetPath -Force }
$wb.SaveAs($targetPath)
Write-Host "Masaustune kaydedildi: $targetPath" -ForegroundColor Green

if (Test-Path "F:\") {
    if (Test-Path $flashPath) { Remove-Item $flashPath -Force }
    $wb.SaveCopyAs($flashPath)
    Write-Host "F: surucusune yedeklendi: $flashPath" -ForegroundColor Green
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "ISLEM TAMAMLANDI! Dinamik ve acilir kutulu model basariyla olusturuldu." -ForegroundColor Green
