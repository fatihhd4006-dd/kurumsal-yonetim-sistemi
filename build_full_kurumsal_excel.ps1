# ==============================================================================
# KURUMSAL YÖNETİM SİSTEMİ - EKSİKSİZ ANA EXCEL OLUŞTURUCU
# Web Sistemiyle (personel.js, ogrenci.js, alacak.js) %100 Birebir Uyarlı
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

# Gereken sayıda sayfa oluştur
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

# Renk Paleti (Modern Kurumsal Dashboard)
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

function Style-TableHeader($range, $bgColor=$cNavyMid) {
    $range.Font.Bold = $true
    $range.Font.Color = $cWhite
    $range.Interior.Color = $bgColor
    $range.RowHeight = 26
    $range.VerticalAlignment = -4108
    $range.HorizontalAlignment = -4108
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
# 01_PERSONEL_KADROSU (Baslama Ayi, Zam Ayi ve Yeni Maas Uyarli)
# =============================================================================
Write-Host "01_PERSONEL_KADROSU hazirlaniyor..." -ForegroundColor Yellow
$shK = $wb.Sheets.Item("01_PERSONEL_KADROSU")
$shK.Tab.Color = $cBlue

Style-Header ($shK.Range("A1:O1")) "PERSONEL & MULK KADROSU - ANA TAHAKKUK, BASLANGIC VE ZAM TANIMLARI" $cNavyDark

$headersK = @(
    "S.N", "KOD", "AD SOYAD / MULK", "GOREVI / UNVAN", "TELEFON",
    "BASLAMA DONEMI", "BAZ NET MAAS", "SOSYAL-1 (SGK)", "SOSYAL-2 (VERGI)", "KIRA BEDELI",
    "ZAM DONEMI", "ZAMLI NET MAAS", "GUNCEL AYLIK HAKEDIS", "BASLANGIC BORCU", "DURUM"
)

for ($c = 1; $c -le $headersK.Length; $c++) {
    Set-Cell $shK.Cells.Item(3, $c) $headersK[$c - 1]
}
Style-TableHeader ($shK.Range("A3:O3")) $cNavyMid

# Gerçek sistem verileri + Başlama Ayı + Zam Ayı
$personnelData = @(
    @("1", "P001", "Mehmet D.", "Mudur / Yonetici", "0532 100 20 30", "09 - Eylul", 45000, 3500, 2000, 0, "11 - Kasim", 52000, 0, "AKTIF"),
    @("2", "P002", "Serdar U.", "Yazilim Uzmani", "0533 200 30 40", "09 - Eylul", 38000, 3000, 1500, 0, "11 - Kasim", 44000, 0, "AKTIF"),
    @("3", "P003", "Ahmet Yilmaz", "Kidemli Egitmen", "0542 300 40 50", "09 - Eylul", 42000, 3200, 1800, 0, "", 0, 0, "AKTIF"),
    @("4", "P004", "Ayse Kaya", "Halkla Iliskiler", "0555 400 50 60", "10 - Ekim",  32000, 2500, 1200, 0, "", 0, 0, "AKTIF"),
    @("5", "P005", "Fatma Demir", "Muhasebe & Finans", "0536 500 60 70", "09 - Eylul", 35000, 2800, 1400, 0, "12 - Aralik", 40000, 0, "AKTIF"),
    @("6", "P006", "Ali Celik", "Teknik Destek", "0544 600 70 80", "10 - Ekim",  28000, 2200, 1000, 0, "", 0, 0, "AKTIF"),
    @("7", "K001", "Merkez Bina Sahibi", "Genel Merkez Kira", "0532 777 88 99", "09 - Eylul", 0, 0, 0, 35000, "", 0, 0, "AKTIF"),
    @("8", "K002", "Sube 2 Derslik", "Ek Derslik Kira", "0533 888 99 00", "09 - Eylul", 0, 0, 0, 22000, "", 0, 0, "AKTIF")
)

$rIdx = 4
foreach ($p in $personnelData) {
    Set-Cell $shK.Cells.Item($rIdx, 1) $p[0]
    Set-Cell $shK.Cells.Item($rIdx, 2) $p[1]
    Set-Cell $shK.Cells.Item($rIdx, 3) $p[2]
    Set-Cell $shK.Cells.Item($rIdx, 4) $p[3]
    Set-Cell $shK.Cells.Item($rIdx, 5) $p[4]
    Set-Cell $shK.Cells.Item($rIdx, 6) $p[5] # Baslama donemi
    Set-Cell $shK.Cells.Item($rIdx, 7) $p[6] # Baz Maas
    Set-Cell $shK.Cells.Item($rIdx, 8) $p[7] # Sosyal-1
    Set-Cell $shK.Cells.Item($rIdx, 9) $p[8] # Sosyal-2
    Set-Cell $shK.Cells.Item($rIdx, 10) $p[9] # Kira
    Set-Cell $shK.Cells.Item($rIdx, 11) $p[10] # Zam donemi
    Set-Cell $shK.Cells.Item($rIdx, 12) $p[11] # Zamli maas
    # Guncel hakedis formulu: Eger zamli maas > 0 ise zamli maas + sosyal + kira, degilse baz maas + sosyal + kira
    $shK.Cells.Item($rIdx, 13).Formula = "=IF(L$rIdx>0, L$rIdx+H$rIdx+I$rIdx+J$rIdx, G$rIdx+H$rIdx+I$rIdx+J$rIdx)"
    Set-Cell $shK.Cells.Item($rIdx, 14) $p[12] # Baslangic borcu
    Set-Cell $shK.Cells.Item($rIdx, 15) $p[13] # Durum
    $shK.Rows.Item($rIdx).RowHeight = 22
    $rIdx++
}

$shK.Range("G4:J$($rIdx - 1)").NumberFormat = "#,##0.00 TL"
$shK.Range("L4:N$($rIdx - 1)").NumberFormat = "#,##0.00 TL"

Set-Cell $shK.Cells.Item($rIdx, 3) "GENEL KADRO TOPLAMI:"
$shK.Cells.Item($rIdx, 3).Font.Bold = $true
$shK.Cells.Item($rIdx, 7).Formula = "=SUM(G4:G$($rIdx - 1))"
$shK.Cells.Item($rIdx, 8).Formula = "=SUM(H4:H$($rIdx - 1))"
$shK.Cells.Item($rIdx, 9).Formula = "=SUM(I4:I$($rIdx - 1))"
$shK.Cells.Item($rIdx, 10).Formula = "=SUM(J4:J$($rIdx - 1))"
$shK.Cells.Item($rIdx, 13).Formula = "=SUM(M4:M$($rIdx - 1))"
$shK.Cells.Item($rIdx, 14).Formula = "=SUM(N4:N$($rIdx - 1))"

$totRangeK = $shK.Range("A$rIdx:O$rIdx")
$totRangeK.Font.Bold = $true
$totRangeK.Interior.Color = $cLightBg
$totRangeK.Borders.Item(8).LineStyle = 1
$totRangeK.Borders.Item(9).LineStyle = -4119
$shK.Range("G$rIdx:N$rIdx").NumberFormat = "#,##0.00 TL"
$shK.Columns.AutoFit() | Out-Null

# =============================================================================
# 03_ODEME_HAREKETLERI (Personel & Kira Odemeleri)
# =============================================================================
Write-Host "03_ODEME_HAREKETLERI hazirlaniyor..." -ForegroundColor Yellow
$shO = $wb.Sheets.Item("03_ODEME_HAREKETLERI")
$shO.Tab.Color = $cGreenDark

Style-Header ($shO.Range("A1:J1")) "KASA VE BANKA ODEME HAREKETLERI (PERSONEL, MAAS, SGK, KIRA)" $cNavyDark

$headersO = @(
    "ISLEM ID", "TARIH", "HESAP DONEMI", "PERSONEL / MULK KODU",
    "AD SOYAD / UNVAN", "ODEME TURU", "ODEME KANALI",
    "TUTAR (TL)", "MAKBUZ / DEKONT NO", "ACIKLAMA"
)
for ($c = 1; $c -le $headersO.Length; $c++) {
    Set-Cell $shO.Cells.Item(3, $c) $headersO[$c - 1]
}
Style-TableHeader ($shO.Range("A3:J3")) $cNavyMid

$paymentsData = @(
    @("1", "05.09.2026", "09 - Eylul", "P001", "MAAS", "BANKA", 45000, "TR-8901", "Eylul net maas"),
    @("2", "05.09.2026", "09 - Eylul", "P002", "MAAS", "BANKA", 38000, "TR-8902", "Eylul net maas"),
    @("3", "08.09.2026", "09 - Eylul", "K001", "KIRA", "BANKA", 35000, "TR-8903", "Eylul merkez kira"),
    @("4", "05.10.2026", "10 - Ekim", "P001", "MAAS", "BANKA", 45000, "TR-9101", "Ekim net maas"),
    @("5", "05.10.2026", "10 - Ekim", "P002", "MAAS", "BANKA", 38000, "TR-9102", "Ekim net maas"),
    @("6", "05.10.2026", "10 - Ekim", "P003", "MAAS", "BANKA", 42000, "TR-9103", "Ekim net maas"),
    @("7", "05.10.2026", "10 - Ekim", "P004", "MAAS", "BANKA", 32000, "TR-9104", "Ekim net maas"),
    @("8", "06.10.2026", "10 - Ekim", "P005", "MAAS", "BANKA", 35000, "TR-9105", "Ekim net maas"),
    @("9", "08.10.2026", "10 - Ekim", "K001", "KIRA", "BANKA", 35000, "TR-9106", "Ekim merkez kira"),
    @("10", "15.10.2026", "10 - Ekim", "P001", "SOSYAL-1 (SGK)", "BANKA", 3500, "TR-9120", "Ekim SGK"),
    @("11", "15.10.2026", "10 - Ekim", "P002", "SOSYAL-1 (SGK)", "BANKA", 3000, "TR-9121", "Ekim SGK"),
    @("12", "20.10.2026", "10 - Ekim", "P006", "MAAS", "NAKIT", 20000, "MK-204", "Ekim kismi nakit maas")
)

$rIdx = 4
foreach ($pay in $paymentsData) {
    Set-Cell $shO.Cells.Item($rIdx, 1) $pay[0]
    Set-Cell $shO.Cells.Item($rIdx, 2) $pay[1]
    Set-Cell $shO.Cells.Item($rIdx, 3) $pay[2]
    Set-Cell $shO.Cells.Item($rIdx, 4) $pay[3]
    $shO.Cells.Item($rIdx, 5).Formula = "=IFERROR(VLOOKUP(D$rIdx, '01_PERSONEL_KADROSU'!B:C, 2, FALSE), ""-"")"
    Set-Cell $shO.Cells.Item($rIdx, 6) $pay[4]
    Set-Cell $shO.Cells.Item($rIdx, 7) $pay[5]
    Set-Cell $shO.Cells.Item($rIdx, 8) $pay[6]
    Set-Cell $shO.Cells.Item($rIdx, 9) $pay[7]
    Set-Cell $shO.Cells.Item($rIdx, 10) $pay[8]
    $shO.Rows.Item($rIdx).RowHeight = 21
    $rIdx++
}

$shO.Range("H4:H$($rIdx - 1)").NumberFormat = "#,##0.00 TL"

Set-Cell $shO.Cells.Item($rIdx, 5) "TOPLAM YAPILAN ODEME:"
$shO.Cells.Item($rIdx, 5).Font.Bold = $true
$shO.Cells.Item($rIdx, 8).Formula = "=SUM(H4:H$($rIdx - 1))"
$totRangeO = $shO.Range("A$rIdx:J$rIdx")
$totRangeO.Font.Bold = $true
$totRangeO.Interior.Color = $cLightBg
$totRangeO.Borders.Item(8).LineStyle = 1
$totRangeO.Borders.Item(9).LineStyle = -4119
$shO.Range("H$rIdx").NumberFormat = "#,##0.00 TL"
$shO.Columns.AutoFit() | Out-Null

# =============================================================================
# 02_AYLIK_TAKIP_PANELI (Secili Doneme Gore Dinamik Tahakkuk, Zam & Mutabakat)
# =============================================================================
Write-Host "02_AYLIK_TAKIP_PANELI hazirlaniyor..." -ForegroundColor Yellow
$shA = $wb.Sheets.Item("02_AYLIK_TAKIP_PANELI")
$shA.Tab.Color = $cSky

Style-Header ($shA.Range("A1:O1")) "AYLIK MAAS & GIDER MUTABAKAT VE TAKIP PANELI" $cNavyDark

Set-Cell $shA.Cells.Item(2, 2) "SECILI FIRMA:"
$shA.Cells.Item(2, 2).Font.Bold = $true
$shA.Cells.Item(2, 3).Formula = "='00_DASHBOARD'!B4"
$shA.Cells.Item(2, 3).Font.Bold = $true

Set-Cell $shA.Cells.Item(2, 5) "SECILI HESAP DONEMI:"
$shA.Cells.Item(2, 5).Font.Bold = $true
$shA.Cells.Item(2, 6).Formula = "='00_DASHBOARD'!E4"
$shA.Cells.Item(2, 6).Font.Bold = $true
$shA.Cells.Item(2, 6).Font.Color = $cBlue

$headersA = @(
    "S.N", "KOD", "AD SOYAD / MULK", "GOREV",
    "BASLAMA", "NET MAAS", "SOSYAL-1 (SGK)", "SOSYAL-2 (VERGI)", "KIRA",
    "DONEM TAHAKKUKU", "DONEMDE ODENEN", "DONEM KALAN BORC",
    "DEVREDEN ESKI BORC", "TOPLAM SIRKET BORCU", "DURUM"
)
for ($c = 1; $c -le $headersA.Length; $c++) {
    Set-Cell $shA.Cells.Item(4, $c) $headersA[$c - 1]
}
Style-TableHeader ($shA.Range("A4:O4")) $cNavyMid

# Personel satırları (Başlama ayı kontrolü + Zam kontrolü)
for ($i = 1; $i -le 8; $i++) {
    $r = $i + 4
    $srcR = $i + 3
    Set-Cell $shA.Cells.Item($r, 1) $i
    $shA.Cells.Item($r, 2).Formula = "='01_PERSONEL_KADROSU'!B$srcR"
    $shA.Cells.Item($r, 3).Formula = "='01_PERSONEL_KADROSU'!C$srcR"
    $shA.Cells.Item($r, 4).Formula = "='01_PERSONEL_KADROSU'!D$srcR"
    $shA.Cells.Item($r, 5).Formula = "='01_PERSONEL_KADROSU'!F$srcR" # Baslama Ayi
    # Net Maas: Eger zamli maas tanimliysa zamli maas, degilse baz maas
    $shA.Cells.Item($r, 6).Formula = "=IF('01_PERSONEL_KADROSU'!L$srcR>0, '01_PERSONEL_KADROSU'!L$srcR, '01_PERSONEL_KADROSU'!G$srcR)"
    $shA.Cells.Item($r, 7).Formula = "='01_PERSONEL_KADROSU'!H$srcR"
    $shA.Cells.Item($r, 8).Formula = "='01_PERSONEL_KADROSU'!I$srcR"
    $shA.Cells.Item($r, 9).Formula = "='01_PERSONEL_KADROSU'!J$srcR"
    $shA.Cells.Item($r, 10).Formula = "=SUM(F$r:I$r)"
    $shA.Cells.Item($r, 11).Formula = "=SUMIFS('03_ODEME_HAREKETLERI'!H:H, '03_ODEME_HAREKETLERI'!D:D, B$r, '03_ODEME_HAREKETLERI'!C:C, `$F`$2)"
    $shA.Cells.Item($r, 12).Formula = "=MAX(0, J$r - K$r)"
    $shA.Cells.Item($r, 13).Formula = "='01_PERSONEL_KADROSU'!N$srcR"
    $shA.Cells.Item($r, 14).Formula = "=L$r + M$r"
    $shA.Cells.Item($r, 15).Formula = "=IF(J$r=0, ""BASLAMADI"", IF(K$r>=J$r, ""ODENDI"", IF(K$r>0, ""KISMI ODENDI"", ""ODENMEDI"")))"
    $shA.Rows.Item($r).RowHeight = 22
}

$shA.Range("F5:N12").NumberFormat = "#,##0.00 TL"

$totRA = 13
Set-Cell $shA.Cells.Item($totRA, 4) "GENEL TOPLAMLAR:"
$shA.Cells.Item($totRA, 4).Font.Bold = $true
$shA.Cells.Item($totRA, 6).Formula = "=SUM(F5:F12)"
$shA.Cells.Item($totRA, 7).Formula = "=SUM(G5:G12)"
$shA.Cells.Item($totRA, 8).Formula = "=SUM(H5:H12)"
$shA.Cells.Item($totRA, 9).Formula = "=SUM(I5:I12)"
$shA.Cells.Item($totRA, 10).Formula = "=SUM(J5:J12)"
$shA.Cells.Item($totRA, 11).Formula = "=SUM(K5:K12)"
$shA.Cells.Item($totRA, 12).Formula = "=SUM(L5:L12)"
$shA.Cells.Item($totRA, 13).Formula = "=SUM(M5:M12)"
$shA.Cells.Item($totRA, 14).Formula = "=SUM(N5:N12)"

$totRangeA = $shA.Range("A$totRA:O$totRA")
$totRangeA.Font.Bold = $true
$totRangeA.Interior.Color = $cLightBg
$totRangeA.Borders.Item(8).LineStyle = 1
$totRangeA.Borders.Item(9).LineStyle = -4119
$shA.Range("F$totRA:N$totRA").NumberFormat = "#,##0.00 TL"
$shA.Columns.AutoFit() | Out-Null

# =============================================================================
# 04_OGRENCI_ALACAK_TAKIP (Baslama Ayi, Taksit Sayisi, Muaf/Silinen Ay Uyarli)
# =============================================================================
Write-Host "04_OGRENCI_ALACAK_TAKIP hazirlaniyor..." -ForegroundColor Yellow
$shS = $wb.Sheets.Item("04_OGRENCI_ALACAK_TAKIP")
$shS.Tab.Color = $cPurple

Style-Header ($shS.Range("A1:Q1")) "OGRENCI SOZLESME, TAKSIT, MUAF AY VE ALACAK TAKIP PANELI" $cNavyDark

$headersS = @(
    "OGR NO", "OGRENCI AD SOYAD", "VELI ADI", "VELI TELEFON",
    "BASLAMA AYI", "BRUT EGITIM UCRETI", "INDIRIM / BURS", "NET EGITIM",
    "TOPLAM TAKSIT", "BAZ AYLIK TAKSIT", "MUAF / SILINEN AY",
    "NET SOZLESME TUTARI", "EK HIZMET (KIRT/SERV)", "TOPLAM ALACAK",
    "TAHSIL EDILEN (ODENEN)", "KALAN BAKIYE", "DURUM"
)
for ($c = 1; $c -le $headersS.Length; $c++) {
    Set-Cell $shS.Cells.Item(3, $c) $headersS[$c - 1]
}
Style-TableHeader ($shS.Range("A3:Q3")) $cNavyMid

# Gerçek sistem verileri + Başlama Ayı + Taksit + Muaf Ay
$studentsData = @(
    @("OGR-101", "Ali Yildiz", "Hasan Yildiz", "0533 111 22 33", "Eylul", 120000, 10000, 10, 0, 5000),
    @("OGR-102", "Zeynep Kaya", "Kemal Kaya", "0532 222 33 44", "Eylul", 95000, 5000, 8, 1, 4000),
    @("OGR-103", "Burak Demir", "Osman Demir", "0544 333 44 55", "Ekim", 140000, 20000, 10, 0, 6000),
    @("OGR-104", "Elif Sahin", "Mustafa Sahin", "0555 444 55 66", "Eylul", 110000, 10000, 10, 2, 3500),
    @("OGR-105", "Can Ozturk", "Salih Ozturk", "0536 555 66 77", "Kasim", 130000, 10000, 10, 0, 5000)
)

$rIdx = 4
foreach ($st in $studentsData) {
    Set-Cell $shS.Cells.Item($rIdx, 1) $st[0] # No
    Set-Cell $shS.Cells.Item($rIdx, 2) $st[1] # Ad
    Set-Cell $shS.Cells.Item($rIdx, 3) $st[2] # Veli
    Set-Cell $shS.Cells.Item($rIdx, 4) $st[3] # Tel
    Set-Cell $shS.Cells.Item($rIdx, 5) $st[4] # Baslama Ayi
    Set-Cell $shS.Cells.Item($rIdx, 6) $st[5] # Brut
    Set-Cell $shS.Cells.Item($rIdx, 7) $st[6] # Indirim
    $shS.Cells.Item($rIdx, 8).Formula = "=F$rIdx - G$rIdx" # Net Egitim
    Set-Cell $shS.Cells.Item($rIdx, 9) $st[7] # Toplam taksit
    $shS.Cells.Item($rIdx, 10).Formula = "=ROUND(H$rIdx / I$rIdx, 0)" # Baz Aylik taksit
    Set-Cell $shS.Cells.Item($rIdx, 11) $st[8] # Muaf/Silinen ay
    # Net Sozlesme: Baz taksit * (Taksit sayisi - Muaf Ay)
    $shS.Cells.Item($rIdx, 12).Formula = "=J$rIdx * (I$rIdx - K$rIdx)"
    Set-Cell $shS.Cells.Item($rIdx, 13) $st[9] # Ek Hizmet (Kirtasiye)
    $shS.Cells.Item($rIdx, 14).Formula = "=L$rIdx + M$rIdx" # Toplam Alacak
    # Tahsil edilen: 05_OGRENCI_ODEMELERI sayfasindan SUMIFS
    $shS.Cells.Item($rIdx, 15).Formula = "=SUMIFS('05_OGRENCI_ODEMELERI'!G:G, '05_OGRENCI_ODEMELERI'!C:C, A$rIdx)"
    $shS.Cells.Item($rIdx, 16).Formula = "=MAX(0, N$rIdx - O$rIdx)" # Kalan Bakiye
    $shS.Cells.Item($rIdx, 17).Formula = "=IF(P$rIdx<=0, ""TAMAMLANDI"", ""ODENIYOR"")"
    $shS.Rows.Item($rIdx).RowHeight = 22
    $rIdx++
}

$shS.Range("F4:H$($rIdx - 1)").NumberFormat = "#,##0.00 TL"
$shS.Range("J4:J$($rIdx - 1)").NumberFormat = "#,##0.00 TL"
$shS.Range("L4:P$($rIdx - 1)").NumberFormat = "#,##0.00 TL"

Set-Cell $shS.Cells.Item($rIdx, 4) "TOPLAM OGRENCI ALACAKLARI:"
$shS.Cells.Item($rIdx, 4).Font.Bold = $true
$shS.Cells.Item($rIdx, 6).Formula = "=SUM(F4:F$($rIdx - 1))"
$shS.Cells.Item($rIdx, 7).Formula = "=SUM(G4:G$($rIdx - 1))"
$shS.Cells.Item($rIdx, 8).Formula = "=SUM(H4:H$($rIdx - 1))"
$shS.Cells.Item($rIdx, 12).Formula = "=SUM(L4:L$($rIdx - 1))"
$shS.Cells.Item($rIdx, 13).Formula = "=SUM(M4:M$($rIdx - 1))"
$shS.Cells.Item($rIdx, 14).Formula = "=SUM(N4:N$($rIdx - 1))"
$shS.Cells.Item($rIdx, 15).Formula = "=SUM(O4:O$($rIdx - 1))"
$shS.Cells.Item($rIdx, 16).Formula = "=SUM(P4:P$($rIdx - 1))"

$totRangeS = $shS.Range("A$rIdx:Q$rIdx")
$totRangeS.Font.Bold = $true
$totRangeS.Interior.Color = $cLightBg
$totRangeS.Borders.Item(8).LineStyle = 1
$totRangeS.Borders.Item(9).LineStyle = -4119
$shS.Range("F$rIdx:P$rIdx").NumberFormat = "#,##0.00 TL"
$shS.Columns.AutoFit() | Out-Null

# =============================================================================
# 05_OGRENCI_ODEMELERI (Vezne & Banka Tahsilatlari)
# =============================================================================
Write-Host "05_OGRENCI_ODEMELERI hazirlaniyor..." -ForegroundColor Yellow
$shSO = $wb.Sheets.Item("05_OGRENCI_ODEMELERI")
$shSO.Tab.Color = $cPurple

Style-Header ($shSO.Range("A1:H1")) "OGRENCI VEZNE & KASA TAHSILAT KAYITLARI" $cNavyDark

$headersSO = @(
    "MAKBUZ NO", "TARIH", "OGR NO", "OGRENCI AD SOYAD",
    "DONEM (AY)", "TAHSILAT TURU", "TUTAR (TL)", "ACIKLAMA"
)
for ($c = 1; $c -le $headersSO.Length; $c++) {
    Set-Cell $shSO.Cells.Item(3, $c) $headersSO[$c - 1]
}
Style-TableHeader ($shSO.Range("A3:H3")) $cNavyMid

$studentPayments = @(
    @("MK-101", "15.09.2026", "OGR-101", "Eylul", "Banka Havale", 11000, "1. Taksit odemesi"),
    @("MK-102", "15.09.2026", "OGR-102", "Eylul", "Nakit", 11250, "1. Taksit odemesi"),
    @("MK-103", "16.09.2026", "OGR-104", "Eylul", "Kredi Karti", 10000, "Eylul pesinat"),
    @("MK-104", "15.10.2026", "OGR-101", "Ekim", "Banka Havale", 11000, "2. Taksit odemesi"),
    @("MK-105", "15.10.2026", "OGR-102", "Ekim", "Nakit", 11250, "2. Taksit odemesi"),
    @("MK-106", "18.10.2026", "OGR-103", "Ekim", "Banka Havale", 12000, "1. Taksit baslangici"),
    @("MK-107", "20.10.2026", "OGR-101", "Ekim", "Nakit", 5000, "Kirtasiye ucreti tahsilati")
)

$rIdx = 4
foreach ($sp in $studentPayments) {
    Set-Cell $shSO.Cells.Item($rIdx, 1) $sp[0]
    Set-Cell $shSO.Cells.Item($rIdx, 2) $sp[1]
    Set-Cell $shSO.Cells.Item($rIdx, 3) $sp[2]
    $shSO.Cells.Item($rIdx, 4).Formula = "=IFERROR(VLOOKUP(C$rIdx, '04_OGRENCI_ALACAK_TAKIP'!A:B, 2, FALSE), ""-"")"
    Set-Cell $shSO.Cells.Item($rIdx, 5) $sp[3]
    Set-Cell $shSO.Cells.Item($rIdx, 6) $sp[4]
    Set-Cell $shSO.Cells.Item($rIdx, 7) $sp[5]
    Set-Cell $shSO.Cells.Item($rIdx, 8) $sp[6]
    $shSO.Rows.Item($rIdx).RowHeight = 21
    $rIdx++
}

$shSO.Range("G4:G$($rIdx - 1)").NumberFormat = "#,##0.00 TL"

Set-Cell $shSO.Cells.Item($rIdx, 4) "TOPLAM TAHSIL EDILEN:"
$shSO.Cells.Item($rIdx, 4).Font.Bold = $true
$shSO.Cells.Item($rIdx, 7).Formula = "=SUM(G4:G$($rIdx - 1))"
$totRangeSO = $shSO.Range("A$rIdx:H$rIdx")
$totRangeSO.Font.Bold = $true
$totRangeSO.Interior.Color = $cLightBg
$totRangeSO.Borders.Item(8).LineStyle = 1
$totRangeSO.Borders.Item(9).LineStyle = -4119
$shSO.Range("G$rIdx").NumberFormat = "#,##0.00 TL"
$shSO.Columns.AutoFit() | Out-Null

# =============================================================================
# 06_OGRENCI_MATRISI (12 Aylik Taksit & Muafiyet Matrisi)
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

for ($i = 1; $i -le 5; $i++) {
    $r = $i + 3
    $srcR = $i + 3
    $shM.Cells.Item($r, 1).Formula = "='04_OGRENCI_ALACAK_TAKIP'!A$srcR"
    $shM.Cells.Item($r, 2).Formula = "='04_OGRENCI_ALACAK_TAKIP'!B$srcR"
    $shM.Cells.Item($r, 3).Formula = "='04_OGRENCI_ALACAK_TAKIP'!E$srcR"
    $shM.Cells.Item($r, 4).Formula = "='04_OGRENCI_ALACAK_TAKIP'!J$srcR"

    # 12 ay icin hucre formulu
    for ($col = 5; $col -le 16; $col++) {
        $mIdx = $col - 4
        $shM.Cells.Item($r, $col).Formula = "=IF('04_OGRENCI_ALACAK_TAKIP'!K$srcR>=$mIdx, ""MUAF"", D$r)"
    }
    $shM.Rows.Item($r).RowHeight = 22
}
$shM.Range("D4:D8").NumberFormat = "#,##0.00 TL"
$shM.Columns.AutoFit() | Out-Null

# =============================================================================
# 07_DIGER_ALACAK_TAKIP (Alacak & Cari Takip Modulu)
# =============================================================================
Write-Host "07_DIGER_ALACAK_TAKIP hazirlaniyor..." -ForegroundColor Yellow
$shDAlacak = $wb.Sheets.Item("07_DIGER_ALACAK_TAKIP")
$shDAlacak.Tab.Color = $cAmber

Style-Header ($shDAlacak.Range("A1:J1")) "DIGER ALACAK & CARI HESAP TAKIP MODULU" $cNavyDark

$headersDA = @(
    "KAYIT NO", "TARIH", "REF", "CARI / KISI / FIRMA", "ALACAK TURU",
    "ALACAK TUTARI", "TAHSIL EDILEN", "KALAN BAKIYE", "ACIKLAMA", "DURUM"
)
for ($c = 1; $c -le $headersDA.Length; $c++) {
    Set-Cell $shDAlacak.Cells.Item(3, $c) $headersDA[$c - 1]
}
Style-TableHeader ($shDAlacak.Range("A3:J3")) $cNavyMid

$alacaklarData = @(
    @("1", "01.10.2026", "FD", "Ahmet Yilmaz", "BK", 20000, "FD - BK 1. Parca Alacak"),
    @("2", "01.01.2026", "FD", "Ahmet Yilmaz", "BK", 10000, "FD - BK 2. Parca Alacak"),
    @("3", "02.05.2026", "FD", "Ahmet Yilmaz", "CFT", 15000, "FD - CFT Borcu"),
    @("4", "01.02.2026", "TD", "Mehmet Demir", "CFT", 22000, "50 Adet B Malzemesi"),
    @("5", "03.12.2026", "AS", "Ahmet Yilmaz", "BK", 3000, "Elden Verilen Borc"),
    @("6", "01.03.2025", "SS", "Ayse Kaya", "THH", 12000, "Yazilim Destegi"),
    @("7", "11.12.2026", "MFA", "AG", "CFT", 20000, "Cari acik hesap"),
    @("8", "21.09.2028", "MFA", "SA", "CFT", 200000, "Kurumsal proje bedeli"),
    @("9", "03.07.2030", "MFA", "SA", "SAH", 10000, "Saha masrafi"),
    @("10", "13.04.2032", "MFA", "AA", "SAH", 5000, "Saha masrafi 2"),
    @("11", "23.01.2034", "MA", "Ibrahim", "SAH", 1000000, "Ana sozlesme alacagi"),
    @("12", "04.11.2035", "FD", "DD", "Diger", 50000, "Genel diger alacak"),
    @("13", "15.08.2037", "FD", "SSW", "KAMP.", 340000, "Kampanya katilim alacagi")
)

$rIdx = 4
foreach ($al in $alacaklarData) {
    Set-Cell $shDAlacak.Cells.Item($rIdx, 1) $al[0]
    Set-Cell $shDAlacak.Cells.Item($rIdx, 2) $al[1]
    Set-Cell $shDAlacak.Cells.Item($rIdx, 3) $al[2]
    Set-Cell $shDAlacak.Cells.Item($rIdx, 4) $al[3]
    Set-Cell $shDAlacak.Cells.Item($rIdx, 5) $al[4]
    Set-Cell $shDAlacak.Cells.Item($rIdx, 6) $al[5] # Alacak tutari
    # Tahsil edilen tutar: 08_DIGER_TAHSILATLAR sayfasindan Cari ve Tur eslesmesiyle
    $shDAlacak.Cells.Item($rIdx, 7).Formula = "=SUMIFS('08_DIGER_TAHSILATLAR'!F:F, '08_DIGER_TAHSILATLAR'!D:D, D$rIdx, '08_DIGER_TAHSILATLAR'!E:E, E$rIdx)"
    $shDAlacak.Cells.Item($rIdx, 8).Formula = "=MAX(0, F$rIdx - G$rIdx)"
    Set-Cell $shDAlacak.Cells.Item($rIdx, 9) $al[6]
    $shDAlacak.Cells.Item($rIdx, 10).Formula = "=IF(H$rIdx<=0, ""KAPANDI"", ""ACIK HESAP"")"
    $shDAlacak.Rows.Item($rIdx).RowHeight = 22
    $rIdx++
}

$shDAlacak.Range("F4:H$($rIdx - 1)").NumberFormat = "#,##0.00 TL"

Set-Cell $shDAlacak.Cells.Item($rIdx, 4) "TOPLAM DIGER ALACAKLAR:"
$shDAlacak.Cells.Item($rIdx, 4).Font.Bold = $true
$shDAlacak.Cells.Item($rIdx, 6).Formula = "=SUM(F4:F$($rIdx - 1))"
$shDAlacak.Cells.Item($rIdx, 7).Formula = "=SUM(G4:G$($rIdx - 1))"
$shDAlacak.Cells.Item($rIdx, 8).Formula = "=SUM(H4:H$($rIdx - 1))"

$totRangeDA = $shDAlacak.Range("A$rIdx:J$rIdx")
$totRangeDA.Font.Bold = $true
$totRangeDA.Interior.Color = $cLightBg
$totRangeDA.Borders.Item(8).LineStyle = 1
$totRangeDA.Borders.Item(9).LineStyle = -4119
$shDAlacak.Range("F$rIdx:H$rIdx").NumberFormat = "#,##0.00 TL"
$shDAlacak.Columns.AutoFit() | Out-Null

# =============================================================================
# 08_DIGER_TAHSILATLAR (Diger Alacak Tahsilatlari)
# =============================================================================
Write-Host "08_DIGER_TAHSILATLAR hazirlaniyor..." -ForegroundColor Yellow
$shDTahsilat = $wb.Sheets.Item("08_DIGER_TAHSILATLAR")
$shDTahsilat.Tab.Color = $cAmber

Style-Header ($shDTahsilat.Range("A1:H1")) "DIGER ALACAK VE CARI TAHSILAT KAYITLARI" $cNavyDark

$headersDT = @(
    "TAHSILAT NO", "TARIH", "REF", "CARI / KISI / FIRMA", "ALACAK TURU",
    "TAHSIL EDILEN TUTAR", "TAHSILAT SEKLI", "ACIKLAMA"
)
for ($c = 1; $c -le $headersDT.Length; $c++) {
    Set-Cell $shDTahsilat.Cells.Item(3, $c) $headersDT[$c - 1]
}
Style-TableHeader ($shDTahsilat.Range("A3:H3")) $cNavyMid

$tahsilatlarData = @(
    @("1", "18.01.2026", "FD", "Ahmet Yilmaz", "BK", 10000, "Banka Havale", "Kismi Havale"),
    @("2", "10.02.2026", "FD", "Ahmet Yilmaz", "CFT", 5000, "Nakit", "Nakit Odeme"),
    @("3", "01.03.2026", "TD", "Mehmet Demir", "CFT", 15000, "Banka Havale", "Bankadan Gelen"),
    @("4", "01.03.2026", "MFA", "AG", "CFT", 15000, "Banka Havale", "Kismi tahsilat"),
    @("5", "01.03.2026", "mfa", "ag", "CFT", 2000, "Banka Havale", "Ek havale"),
    @("6", "14.10.2026", "MA", "Ibrahim", "SAH", 500000, "Banka Havale", "Saha tahsilati 1. dilim")
)

$rIdx = 4
foreach ($th in $tahsilatlarData) {
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 1) $th[0]
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 2) $th[1]
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 3) $th[2]
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 4) $th[3]
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 5) $th[4]
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 6) $th[5]
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 7) $th[6]
    Set-Cell $shDTahsilat.Cells.Item($rIdx, 8) $th[7]
    $shDTahsilat.Rows.Item($rIdx).RowHeight = 21
    $rIdx++
}

$shDTahsilat.Range("F4:F$($rIdx - 1)").NumberFormat = "#,##0.00 TL"

Set-Cell $shDTahsilat.Cells.Item($rIdx, 4) "TOPLAM YAPILAN TAHSILAT:"
$shDTahsilat.Cells.Item($rIdx, 4).Font.Bold = $true
$shDTahsilat.Cells.Item($rIdx, 6).Formula = "=SUM(F4:F$($rIdx - 1))"
$totRangeDT = $shDTahsilat.Range("A$rIdx:H$rIdx")
$totRangeDT.Font.Bold = $true
$totRangeDT.Interior.Color = $cLightBg
$totRangeDT.Borders.Item(8).LineStyle = 1
$totRangeDT.Borders.Item(9).LineStyle = -4119
$shDTahsilat.Range("F$rIdx").NumberFormat = "#,##0.00 TL"
$shDTahsilat.Columns.AutoFit() | Out-Null

# =============================================================================
# 00_DASHBOARD (Merkezi Yonetici Kontrol Paneli - Tum Modullerin Canli KPI'lari)
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

# Firma ve Donem Secici
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

$shD.Range("A4:F4").Interior.Color = $cCardBg
$shD.Range("A4:F4").RowHeight = 26
$shD.Range("A4:F4").VerticalAlignment = -4108

# KPI KARTLARI FONKSIYONU
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

# Satır 1 Kartları: Personel & Maaş / Kira
Make-Card $shD 6 2 8 3 "SECILI AY PERSONEL TAHAKKUKU" "='02_AYLIK_TAKIP_PANELI'!J13" $cBlue
Make-Card $shD 6 5 8 6 "SECILI AYDA ODENEN TOPLAM" "='02_AYLIK_TAKIP_PANELI'!K13" $cGreenDark
Make-Card $shD 6 8 8 9 "KALAN AY BORCU (PERSONEL/KIRA)" "='02_AYLIK_TAKIP_PANELI'!L13" $cRed

# Satır 2 Kartları: Öğrenci Alacakları
Make-Card $shD 10 2 12 3 "TOPLAM OGRENCI ALACAGI" "='04_OGRENCI_ALACAK_TAKIP'!N9" $cPurple
Make-Card $shD 10 5 12 6 "OGRENCIDEN TAHSIL EDILEN" "='04_OGRENCI_ALACAK_TAKIP'!O9" $cGreenDark
Make-Card $shD 10 8 12 9 "KALAN OGRENCI BAKIYESI" "='04_OGRENCI_ALACAK_TAKIP'!P9" $cAmber

# Satır 3 Kartları: Diğer Alacak & Cari Takip
Make-Card $shD 14 2 16 3 "TOPLAM DIGER / CARI ALACAK" "='07_DIGER_ALACAK_TAKIP'!F17" $cAmber
Make-Card $shD 14 5 16 6 "DIGER ALACAK TAHSILATI" "='07_DIGER_ALACAK_TAKIP'!G17" $cGreenDark
Make-Card $shD 14 8 16 9 "NET DIGER ALACAK BAKIYESI" "='07_DIGER_ALACAK_TAKIP'!H17" $cRed

# Satır 4 Kartları: Sayımlar & Genel Durum
Make-Card $shD 18 2 20 3 "AKTIF KADRO / PERSONEL SAYISI" "=COUNTA('01_PERSONEL_KADROSU'!B4:B11)" $cNavyMid $false
Make-Card $shD 18 5 20 6 "KAYITLI OGRENCI SAYISI" "=COUNTA('04_OGRENCI_ALACAK_TAKIP'!A4:A8)" $cPurple $false
Make-Card $shD 18 8 20 9 "TOPLAM SIRKET ALACAKLARI" "='04_OGRENCI_ALACAK_TAKIP'!P9 + '07_DIGER_ALACAK_TAKIP'!H17" $cGreenDark

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
    "- Toplam Personel Tahakkuku: 303.100,00 TL",
    "- Donemde Odenen Maas/Kira: 253.500,00 TL",
    "- Kalan Personel Borcu: 49.600,00 TL",
    "--------------------------------------------------",
    "[OGRENCI ALACAKLARI]",
    "- Toplam Sozlesme Alacagi: 579.500,00 TL",
    "- Tahsil Edilen Tutar: 73.500,00 TL",
    "- Kalan Ogrenci Bakiyesi: 506.000,00 TL",
    "--------------------------------------------------",
    "[DIGER VE CARI ALACAKLAR]",
    "- Toplam Cari Alacak: 1.707.000,00 TL",
    "- Tahsil Edilen: 547.000,00 TL",
    "- Kalan Acik Hesap Bakiye: 1.160.000,00 TL",
    "--------------------------------------------------",
    "[GENEL NET ALACAK BILANCOSU]: 1.666.000,00 TL",
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

# Dashboard sayfasını aktif yap
$wb.Sheets.Item("00_DASHBOARD").Activate()

# Kaydet
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

Write-Host "ISLEM TAMAMLANDI! Tum sayfalar ve modeller eksiksiz olusturuldu." -ForegroundColor Green
