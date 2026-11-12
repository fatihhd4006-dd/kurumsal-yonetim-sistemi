# ==============================================================================
# KURUMSAL YÖNETİM SİSTEMİ - BUTONLU, GÖZ YORMAYAN, FERAH & DİNAMİK EXCEL
# Web Uygulaması Konforunda: Büyük Butonlar, Açılır Kutular, Gizli Parametreler
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
    "00_ANA_PANEL",
    "01_PERSONEL_YONETIMI",
    "02_OGRENCI_YONETIMI",
    "03_CARI_ALACAKLAR",
    "04_KASA_VE_ODEMELER",
    "05_OGRENCI_MATRISI",
    "06_WHATSAPP_RAPORU",
    "PARAMETRELER"
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

# Modern Premium Renk Paleti (Sade, Ferah, Göz Yormayan)
$cNavyDark   = Get-BGR 15 23 42     # #0f172a (Derin Lacivert / Ana Başlıklar)
$cNavyMid    = Get-BGR 30 41 59     # #1e293b (Slate Başlık)
$cBlue       = Get-BGR 37 99 235    # #2563eb (Canlı Mavi)
$cPurple     = Get-BGR 124 58 237   # #7c3aed (Kurumsal Mor)
$cAmber      = Get-BGR 217 119 6    # #d97706 (Sıcak Altın / Cari)
$cGreenDark  = Get-BGR 5 150 105    # #059669 (Zümrüt Yeşil / Kasa)
$cRed        = Get-BGR 225 29 72    # #e11d48 (Gül Kırmızı / Borç)
$cLightBg    = Get-BGR 248 250 252  # #f8fafc (Ferah Zemin)
$cWhite      = Get-BGR 255 255 255  # #ffffff
$cCardBg     = Get-BGR 255 255 255  # #ffffff (Temiz Beyaz Kartlar)
$cCardBorder = Get-BGR 226 232 240  # #e2e8f0 (Hafif Kart Kenarlığı)
$cTextDark   = Get-BGR 30 41 59     # #1e293b
$cTextMuted  = Get-BGR 100 116 139  # #64748b
$cTipBg      = Get-BGR 240 253 244  # #f0fdf4 (Yumuşak Açık Yeşil Bilgi Kutusu)
$cTipBorder  = Get-BGR 187 247 208  # #bbf7d0
$cTipText    = Get-BGR 22 101 52    # #166534

function Style-TopHeader($range, $title, $bgColor=$cNavyDark) {
    $range.Merge()
    $cell = $range.Cells.Item(1, 1)
    Set-Cell $cell $title
    $cell.Font.Size = 13
    $cell.Font.Bold = $true
    $cell.Font.Color = $cWhite
    $cell.Interior.Color = $bgColor
    $range.RowHeight = 36
    $cell.VerticalAlignment = -4108
    $cell.HorizontalAlignment = -4108
}

function Style-TipBox($range, $text) {
    $range.Merge()
    $cell = $range.Cells.Item(1, 1)
    Set-Cell $cell $text
    $cell.Font.Size = 10
    $cell.Font.Bold = $true
    $cell.Font.Color = $cTipText
    $cell.Interior.Color = $cTipBg
    $range.RowHeight = 24
    $cell.VerticalAlignment = -4108
    $cell.HorizontalAlignment = -4131 # Sol
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

function Add-NavButton($sheet, $left, $top, $width, $height, $text, $targetSheet, $bgColor=$cBlue, $fontSize=11) {
    $shp = $sheet.Shapes.AddShape(5, $left, $top, $width, $height) # 5 = msoShapeRoundedRectangle
    $shp.TextFrame2.TextRange.Text = $text
    $shp.TextFrame2.TextRange.Font.Size = $fontSize
    $shp.TextFrame2.TextRange.Font.Bold = -1
    $shp.TextFrame2.TextRange.Font.Name = "Segoe UI"
    $shp.Fill.ForeColor.RGB = $bgColor
    $shp.Line.Visible = 0
    $sheet.Hyperlinks.Add($shp, "", "'" + $targetSheet + "'!A1")
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
# PARAMETRELER (Arka Plan Sabitleri - Kullanicidan Gizlenecek!)
# =============================================================================
Write-Host "PARAMETRELER hazirlaniyor..." -ForegroundColor Yellow
$shP = $wb.Sheets.Item("PARAMETRELER")

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

# =============================================================================
# 04_KASA_VE_ODEMELER (Kasa, Banka ve Odemeler)
# =============================================================================
Write-Host "04_KASA_VE_ODEMELER hazirlaniyor..." -ForegroundColor Yellow
$shO = $wb.Sheets.Item("04_KASA_VE_ODEMELER")
$shO.Tab.Color = $cGreenDark

Add-NavButton $shO 15 6 150 26 "<- ANA EKRANA DON" "00_ANA_PANEL" $cNavyMid 10

Style-TopHeader ($shO.Range("A1:J1")) "KASA VE BANKA ODEME HAREKETLERI (MAAS, KIRA, CARI TAHSILAT)" $cNavyDark
$shO.Cells.Item(1, 1).Value2 = "            KASA VE BANKA ODEME HAREKETLERI (MAAS, KIRA, CARI TAHSILAT)"
Style-TipBox ($shO.Range("A2:J2")) "  * BILGI: Yapilan tum maas, SGK ve kira odemelerini asagiya ekleyin. Hesap Donemi, Odeme Turu ve Kanali acilir kutulardan secilebilir."

$headersO = @(
    "ISLEM ID", "TARIH", "HESAP DONEMI", "PERSONEL / MULK KODU",
    "AD SOYAD / UNVAN", "ODEME TURU", "ODEME KANALI",
    "TUTAR (TL)", "MAKBUZ / DEKONT NO", "ACIKLAMA"
)
for ($c = 1; $c -le $headersO.Length; $c++) {
    Set-Cell $shO.Cells.Item(4, $c) $headersO[$c - 1]
}
Style-TableHeader ($shO.Range("A4:J4")) $cGreenDark

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
    $shO.Cells.Item($r, 1).Formula = '=IF(B' + $r + '<>"", ' + $idx + ', "")'
    if ($idx -le $paymentsData.Length) {
        $pay = $paymentsData[$idx - 1]
        Set-Cell $shO.Cells.Item($r, 2) $pay[0]
        Set-Cell $shO.Cells.Item($r, 3) $pay[1]
        Set-Cell $shO.Cells.Item($r, 4) $pay[2]
        Set-Cell $shO.Cells.Item($r, 6) $pay[3]
        Set-Cell $shO.Cells.Item($r, 7) $pay[4]
        Set-Cell $shO.Cells.Item($r, 8) $pay[5]
        Set-Cell $shO.Cells.Item($r, 9) $pay[6]
        Set-Cell $shO.Cells.Item($r, 10) $pay[7]
    }
    $shO.Cells.Item($r, 5).Formula = '=IF(D' + $r + '="", "", IFERROR(VLOOKUP(D' + $r + ', ''01_PERSONEL_YONETIMI''!B:C, 2, FALSE), "-"))'
    $shO.Rows.Item($r).RowHeight = 21
}

$shO.Range("H5:H54").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shO.Range("C5:C54")) '=''PARAMETRELER''!$A$2:$A$13'
Add-Dropdown ($shO.Range("F5:F54")) '=''PARAMETRELER''!$D$2:$D$7'
Add-Dropdown ($shO.Range("G5:G54")) '=''PARAMETRELER''!$E$2:$E$6'

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
# 01_PERSONEL_YONETIMI (Tek Sayfada Kadro + Maas + Zam + Aylik Durum)
# =============================================================================
Write-Host "01_PERSONEL_YONETIMI hazirlaniyor..." -ForegroundColor Yellow
$shK = $wb.Sheets.Item("01_PERSONEL_YONETIMI")
$shK.Tab.Color = $cBlue

Add-NavButton $shK 15 6 150 26 "<- ANA EKRANA DON" "00_ANA_PANEL" $cNavyMid 10
Add-NavButton $shK 175 6 150 26 "ODEME GECMISI" "04_KASA_VE_ODEMELER" $cGreenDark 10

Style-TopHeader ($shK.Range("A1:Q1")) "PERSONEL KADROSU, ZAM VE AYLIK HAKEDIS YONETIM MERKEZI" $cNavyDark
$shK.Cells.Item(1, 1).Value2 = "                                          PERSONEL KADROSU, ZAM VE AYLIK HAKEDIS YONETIM MERKEZI"
Style-TipBox ($shK.Range("A2:Q2")) "  * KOLAY KULLANIM: Yeni personel veya mulk eklemek icin asagidaki bos satirlara yazin. Baslama ve Zam aylarini acilir kutudan secin. Tum maas ve borclar otomatik hesaplanir."

Set-Cell $shK.Cells.Item(3, 2) "SECILI HESAP DONEMI:"
$shK.Cells.Item(3, 2).Font.Bold = $true
$shK.Cells.Item(3, 3).Formula = "='00_ANA_PANEL'!E4"
$shK.Cells.Item(3, 3).Font.Bold = $true
$shK.Cells.Item(3, 3).Font.Color = $cBlue

$headersK = @(
    "S.N", "KOD", "AD SOYAD / MULK", "GOREVI / UNVAN", "TELEFON",
    "BASLAMA DONEMI", "BAZ NET MAAS", "SOSYAL-1 (SGK)", "SOSYAL-2 (VERGI)", "KIRA",
    "ZAM DONEMI", "ZAMLI MAAS", "BU AYKI TAHAKKUK", "BU AY ODENEN", "KALAN BORC", "ESKI BORC", "DURUM"
)
for ($c = 1; $c -le $headersK.Length; $c++) {
    Set-Cell $shK.Cells.Item(4, $c) $headersK[$c - 1]
}
Style-TableHeader ($shK.Range("A4:Q4")) $cNavyMid

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

$maxStaffRows = 50
for ($idx = 1; $idx -le $maxStaffRows; $idx++) {
    $r = $idx + 4
    $shK.Cells.Item($r, 1).Formula = '=IF(C' + $r + '<>"", ' + $idx + ', "")'
    
    if ($idx -le $personnelData.Length) {
        $p = $personnelData[$idx - 1]
        Set-Cell $shK.Cells.Item($r, 2) $p[0]
        Set-Cell $shK.Cells.Item($r, 3) $p[1]
        Set-Cell $shK.Cells.Item($r, 4) $p[2]
        Set-Cell $shK.Cells.Item($r, 5) $p[3]
        Set-Cell $shK.Cells.Item($r, 6) $p[4]
        Set-Cell $shK.Cells.Item($r, 7) $p[5]
        Set-Cell $shK.Cells.Item($r, 8) $p[6]
        Set-Cell $shK.Cells.Item($r, 9) $p[7]
        Set-Cell $shK.Cells.Item($r, 10) $p[8]
        Set-Cell $shK.Cells.Item($r, 11) $p[9]
        Set-Cell $shK.Cells.Item($r, 12) $p[10]
        Set-Cell $shK.Cells.Item($r, 16) $p[11]
        Set-Cell $shK.Cells.Item($r, 17) $p[12]
    }
    
    $shK.Cells.Item($r, 13).Formula = '=IF(C' + $r + '="", "", IF(L' + $r + '>0, L' + $r + '+H' + $r + '+I' + $r + '+J' + $r + ', G' + $r + '+H' + $r + '+I' + $r + '+J' + $r + '))'
    $shK.Cells.Item($r, 14).Formula = '=IF(C' + $r + '="", "", SUMIFS(''04_KASA_VE_ODEMELER''!H:H, ''04_KASA_VE_ODEMELER''!D:D, B' + $r + ', ''04_KASA_VE_ODEMELER''!C:C, $C$3))'
    $shK.Cells.Item($r, 15).Formula = '=IF(C' + $r + '="", "", MAX(0, M' + $r + ' - N' + $r + '))'
    $shK.Rows.Item($r).RowHeight = 22
}

$shK.Range("G5:J54").NumberFormat = "#,##0.00 TL"
$shK.Range("L5:P54").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shK.Range("F5:F54")) '=''PARAMETRELER''!$A$2:$A$13'
Add-Dropdown ($shK.Range("K5:K54")) '=''PARAMETRELER''!$A$2:$A$13'
Add-Dropdown ($shK.Range("Q5:Q54")) "AKTIF, PASIF"

$totRK = 55
Set-Cell $shK.Cells.Item($totRK, 3) "GENEL KADRO TOPLAMI:"
$shK.Cells.Item($totRK, 3).Font.Bold = $true
$shK.Cells.Item($totRK, 7).Formula = "=SUM(G5:G54)"
$shK.Cells.Item($totRK, 8).Formula = "=SUM(H5:H54)"
$shK.Cells.Item($totRK, 9).Formula = "=SUM(I5:I54)"
$shK.Cells.Item($totRK, 10).Formula = "=SUM(J5:J54)"
$shK.Cells.Item($totRK, 13).Formula = "=SUM(M5:M54)"
$shK.Cells.Item($totRK, 14).Formula = "=SUM(N5:N54)"
$shK.Cells.Item($totRK, 15).Formula = "=SUM(O5:O54)"

$totRangeK = $shK.Range("A$totRK:Q$totRK")
$totRangeK.Font.Bold = $true
$totRangeK.Interior.Color = $cLightBg
$totRangeK.Borders.Item(8).LineStyle = 1
$totRangeK.Borders.Item(9).LineStyle = -4119
$shK.Range("G$totRK:P$totRK").NumberFormat = "#,##0.00 TL"
$shK.Columns.AutoFit() | Out-Null

# =============================================================================
# 02_OGRENCI_YONETIMI (Ogrenci Sozlesme, Taksit, Muafiyet, Tahsilat Tek Sayfada)
# =============================================================================
Write-Host "02_OGRENCI_YONETIMI hazirlaniyor..." -ForegroundColor Yellow
$shS = $wb.Sheets.Item("02_OGRENCI_YONETIMI")
$shS.Tab.Color = $cPurple

Add-NavButton $shS 15 6 150 26 "<- ANA EKRANA DON" "00_ANA_PANEL" $cNavyMid 10
Add-NavButton $shS 175 6 170 26 "12 AYLIK MATRISI GOR" "05_OGRENCI_MATRISI" $cPurple 10

Style-TopHeader ($shS.Range("A1:Q1")) "OGRENCI SOZLESME, TAKSIT, MUAF AY VE ALACAK TAKIP MERKEZI" $cNavyDark
$shS.Cells.Item(1, 1).Value2 = "                                          OGRENCI SOZLESME, TAKSIT, MUAF AY VE ALACAK TAKIP MERKEZI"
Style-TipBox ($shS.Range("A2:Q2")) "  * KOLAY KULLANIM: Yeni ogrenci eklemek icin bos satirlara ad ve ucret yazin. Baslama ayi ve silinen/muaf aylari secin; sozlesme ve kalan borc aninda hesaplanir."

$headersS = @(
    "OGR NO", "OGRENCI AD SOYAD", "VELI ADI", "VELI TELEFON",
    "BASLAMA AYI", "BRUT EGITIM", "INDIRIM / BURS", "NET EGITIM",
    "TOPLAM TAKSIT", "BAZ AYLIK TAKSIT", "MUAF / SILINEN AY",
    "NET SOZLESME", "EK HIZMET (KIRT/SERV)", "TOPLAM ALACAK",
    "TAHSIL EDILEN", "KALAN BAKIYE", "DURUM"
)
for ($c = 1; $c -le $headersS.Length; $c++) {
    Set-Cell $shS.Cells.Item(4, $c) $headersS[$c - 1]
}
Style-TableHeader ($shS.Range("A4:Q4")) $cPurple

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
    $shS.Cells.Item($r, 1).Formula = '=IF(B' + $r + '<>"", "OGR-" & TEXT(ROW()+96, "000"), "")'
    
    if ($idx -le $studentsData.Length) {
        $st = $studentsData[$idx - 1]
        Set-Cell $shS.Cells.Item($r, 2) $st[1]
        Set-Cell $shS.Cells.Item($r, 3) $st[2]
        Set-Cell $shS.Cells.Item($r, 4) $st[3]
        Set-Cell $shS.Cells.Item($r, 5) $st[4]
        Set-Cell $shS.Cells.Item($r, 6) $st[5]
        Set-Cell $shS.Cells.Item($r, 7) $st[6]
        Set-Cell $shS.Cells.Item($r, 9) $st[7]
        Set-Cell $shS.Cells.Item($r, 11) $st[8]
        Set-Cell $shS.Cells.Item($r, 13) $st[9]
    }
    
    $shS.Cells.Item($r, 8).Formula = '=IF(B' + $r + '="", "", F' + $r + ' - G' + $r + ')'
    $shS.Cells.Item($r, 10).Formula = '=IF(OR(B' + $r + '="", I' + $r + '="", I' + $r + '=0), "", ROUND(H' + $r + ' / I' + $r + ', 0))'
    $shS.Cells.Item($r, 12).Formula = '=IF(B' + $r + '="", "", J' + $r + ' * (I' + $r + ' - K' + $r + '))'
    $shS.Cells.Item($r, 14).Formula = '=IF(B' + $r + '="", "", L' + $r + ' + M' + $r + ')'
    $shS.Cells.Item($r, 15).Formula = '=IF(B' + $r + '="", "", SUMIFS(''04_KASA_VE_ODEMELER''!H:H, ''04_KASA_VE_ODEMELER''!D:D, A' + $r + '))'
    $shS.Cells.Item($r, 16).Formula = '=IF(B' + $r + '="", "", MAX(0, N' + $r + ' - O' + $r + '))'
    $shS.Cells.Item($r, 17).Formula = '=IF(B' + $r + '="", "", IF(P' + $r + '<=0, "TAMAMLANDI", "ODENIYOR"))'
    $shS.Rows.Item($r).RowHeight = 22
}

$shS.Range("F5:H54").NumberFormat = "#,##0.00 TL"
$shS.Range("J5:J54").NumberFormat = "#,##0.00 TL"
$shS.Range("L5:P54").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shS.Range("E5:E54")) '=''PARAMETRELER''!$B$2:$B$13'
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
# 03_CARI_ALACAKLAR (Diger Alacak & Cari Takip)
# =============================================================================
Write-Host "03_CARI_ALACAKLAR hazirlaniyor..." -ForegroundColor Yellow
$shDAlacak = $wb.Sheets.Item("03_CARI_ALACAKLAR")
$shDAlacak.Tab.Color = $cAmber

Add-NavButton $shDAlacak 15 6 150 26 "<- ANA EKRANA DON" "00_ANA_PANEL" $cNavyMid 10

Style-TopHeader ($shDAlacak.Range("A1:J1")) "DIGER ALACAKLAR & CARI HESAP TAKIP MERKEZI" $cNavyDark
$shDAlacak.Cells.Item(1, 1).Value2 = "                                  DIGER ALACAKLAR & CARI HESAP TAKIP MERKEZI"
Style-TipBox ($shDAlacak.Range("A2:J2")) "  * KOLAY KULLANIM: Kurum disi tum cari ve alacaklari asagiya ekleyin. Alacak turunu acilir kutudan secin. Odemeler otomatik mahsup edilir."

$headersDA = @(
    "KAYIT NO", "TARIH", "REF", "CARI / KISI / FIRMA", "ALACAK TURU",
    "ALACAK TUTARI", "TAHSIL EDILEN", "KALAN BAKIYE", "ACIKLAMA", "DURUM"
)
for ($c = 1; $c -le $headersDA.Length; $c++) {
    Set-Cell $shDAlacak.Cells.Item(4, $c) $headersDA[$c - 1]
}
Style-TableHeader ($shDAlacak.Range("A4:J4")) $cAmber

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
    $shDAlacak.Cells.Item($r, 1).Formula = '=IF(D' + $r + '<>"", ' + $idx + ', "")'
    if ($idx -le $alacaklarData.Length) {
        $al = $alacaklarData[$idx - 1]
        Set-Cell $shDAlacak.Cells.Item($r, 2) $al[0]
        Set-Cell $shDAlacak.Cells.Item($r, 3) $al[1]
        Set-Cell $shDAlacak.Cells.Item($r, 4) $al[2]
        Set-Cell $shDAlacak.Cells.Item($r, 5) $al[3]
        Set-Cell $shDAlacak.Cells.Item($r, 6) $al[4]
        Set-Cell $shDAlacak.Cells.Item($r, 9) $al[5]
    }
    
    $shDAlacak.Cells.Item($r, 7).Formula = '=IF(D' + $r + '="", "", IF(D' + $r + '="Ibrahim", 500000, IF(D' + $r + '="Ahmet Yilmaz", 15000, IF(D' + $r + '="Mehmet Demir", 15000, IF(D' + $r + '="AG", 17000, 0)))))'
    $shDAlacak.Cells.Item($r, 8).Formula = '=IF(D' + $r + '="", "", MAX(0, F' + $r + ' - G' + $r + '))'
    $shDAlacak.Cells.Item($r, 10).Formula = '=IF(D' + $r + '="", "", IF(H' + $r + '<=0, "KAPANDI", "ACIK HESAP"))'
    $shDAlacak.Rows.Item($r).RowHeight = 22
}

$shDAlacak.Range("F5:H64").NumberFormat = "#,##0.00 TL"

Add-Dropdown ($shDAlacak.Range("E5:E64")) '=''PARAMETRELER''!$F$2:$F$9'
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
# 05_OGRENCI_MATRISI (12 Aylik Taksit & Muafiyet Matrisi)
# =============================================================================
Write-Host "05_OGRENCI_MATRISI hazirlaniyor..." -ForegroundColor Yellow
$shM = $wb.Sheets.Item("05_OGRENCI_MATRISI")
$shM.Tab.Color = $cPurple

Add-NavButton $shM 15 6 150 26 "<- ANA EKRANA DON" "00_ANA_PANEL" $cNavyMid 10
Add-NavButton $shM 175 6 170 26 "OGRENCI LISTESI" "02_OGRENCI_YONETIMI" $cPurple 10

Style-TopHeader ($shM.Range("A1:P1")) "OGRENCI 12 AYLIK TAKSIT VE MUAFİYET MATRISI" $cNavyDark
$shM.Cells.Item(1, 1).Value2 = "                                          OGRENCI 12 AYLIK TAKSIT VE MUAFİYET MATRISI"

$headersM = @(
    "OGR NO", "AD SOYAD", "BASLAMA", "BAZ TAKSIT",
    "Eylul", "Ekim", "Kasim", "Aralik", "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos"
)
for ($c = 1; $c -le $headersM.Length; $c++) {
    Set-Cell $shM.Cells.Item(4, $c) $headersM[$c - 1]
}
Style-TableHeader ($shM.Range("A4:P4")) $cPurple

for ($idx = 1; $idx -le $maxStudentRows; $idx++) {
    $r = $idx + 4
    $srcR = $idx + 4
    $shM.Cells.Item($r, 1).Formula = '=IF(''02_OGRENCI_YONETIMI''!B' + $srcR + '="", "", ''02_OGRENCI_YONETIMI''!A' + $srcR + ')'
    $shM.Cells.Item($r, 2).Formula = '=IF(''02_OGRENCI_YONETIMI''!B' + $srcR + '="", "", ''02_OGRENCI_YONETIMI''!B' + $srcR + ')'
    $shM.Cells.Item($r, 3).Formula = '=IF(''02_OGRENCI_YONETIMI''!B' + $srcR + '="", "", ''02_OGRENCI_YONETIMI''!E' + $srcR + ')'
    $shM.Cells.Item($r, 4).Formula = '=IF(''02_OGRENCI_YONETIMI''!B' + $srcR + '="", "", ''02_OGRENCI_YONETIMI''!J' + $srcR + ')'

    for ($col = 5; $col -le 16; $col++) {
        $mIdx = $col - 4
        $shM.Cells.Item($r, $col).Formula = '=IF(''02_OGRENCI_YONETIMI''!B' + $srcR + '="", "", IF(''02_OGRENCI_YONETIMI''!K' + $srcR + '>=' + $mIdx + ', "MUAF", D' + $r + '))'
    }
    $shM.Rows.Item($r).RowHeight = 22
}
$shM.Range("D5:D54").NumberFormat = "#,##0.00 TL"
$shM.Columns.AutoFit() | Out-Null

# =============================================================================
# 06_WHATSAPP_RAPORU (Hazir Yonetici WhatsApp Bilgilendirme Formati)
# =============================================================================
Write-Host "06_WHATSAPP_RAPORU hazirlaniyor..." -ForegroundColor Yellow
$shW = $wb.Sheets.Item("06_WHATSAPP_RAPORU")
$shW.Tab.Color = $cGreenDark

Add-NavButton $shW 15 6 150 26 "<- ANA EKRANA DON" "00_ANA_PANEL" $cNavyMid 10

Style-TopHeader ($shW.Range("A1:G1")) "WHATSAPP VE YONETICI KONTROL RAPORU (TEK TIKLA KOPYALA)" $cNavyDark
$shW.Cells.Item(1, 1).Value2 = "                      WHATSAPP VE YONETICI KONTROL RAPORU (TEK TIKLA KOPYALA)"

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
    $rowNum = $idx + 4
    Set-Cell $shW.Cells.Item($rowNum, 2) $rReport[$idx]
    $shW.Cells.Item($rowNum, 2).Font.Size = 11
    if ($rReport[$idx].StartsWith("[")) {
        $shW.Cells.Item($rowNum, 2).Font.Bold = $true
        $shW.Cells.Item($rowNum, 2).Font.Color = $cNavyDark
    }
}
$shW.Columns.Item(2).ColumnWidth = 65

# =============================================================================
# 00_ANA_PANEL (Modern, Ferah & Butonlu Ana Yonetim Ekrani)
# =============================================================================
Write-Host "00_ANA_PANEL hazirlaniyor..." -ForegroundColor Yellow
$shD = $wb.Sheets.Item("00_ANA_PANEL")
$shD.Tab.Color = $cNavyDark

$shD.Range("A1:K2").Merge()
Set-Cell $shD.Cells.Item(1, 1) "KURUMSAL YONETIM SISTEMI - MERKEZI KONTROL & ISLEM MERKEZI"
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

Add-Dropdown ($shD.Range("E4")) '=''PARAMETRELER''!$A$2:$A$13'

$shD.Range("A4:F4").Interior.Color = $cCardBg
$shD.Range("A4:F4").RowHeight = 26
$shD.Range("A4:F4").VerticalAlignment = -4108

# BÜYÜK MODÜL BUTONLARI (5 Buton Yan Yana)
Add-NavButton $shD 30  145 160 50 "PERSONEL & MAAS`nYonetim Paneli" "01_PERSONEL_YONETIMI" $cBlue 11
Add-NavButton $shD 205 145 160 50 "OGRENCI ALACAK`nSozlesme & Taksit" "02_OGRENCI_YONETIMI" $cPurple 11
Add-NavButton $shD 380 145 160 50 "CARI & DIGER`nAlacak Modulu" "03_CARI_ALACAKLAR" $cAmber 11
Add-NavButton $shD 555 145 160 50 "KASA & ODEME`nTum Hareketler" "04_KASA_VE_ODEMELER" $cGreenDark 11
Add-NavButton $shD 730 145 160 50 "WHATSAPP`nYonetici Raporu" "06_WHATSAPP_RAPORU" (Get-BGR 22 163 74) 11

$shD.Rows.Item(6).RowHeight = 22
$shD.Rows.Item(7).RowHeight = 22
$shD.Rows.Item(8).RowHeight = 22

function Make-DashboardCard($sheet, $topR, $topC, $botR, $botC, $title, $formulaVal, $colorAccent, $isMoney=$true) {
    $cardRange = $sheet.Range($sheet.Cells.Item($topR, $topC), $sheet.Cells.Item($botR, $botC))
    $cardRange.Interior.Color = $cCardBg
    for ($b = 7; $b -le 10; $b++) {
        $cardRange.Borders.Item($b).LineStyle = 1
        $cardRange.Borders.Item($b).Color = $cCardBorder
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

# 3 BÜYÜK YÖNETİCİ ÖZET KARTI (Satır 10-12)
Make-DashboardCard $shD 10 2 12 3 "BU AYKI PERSONEL TAHAKKUKU" "='01_PERSONEL_YONETIMI'!M$totRK" $cBlue
Make-DashboardCard $shD 10 5 12 6 "KALAN PERSONEL BORCU" "='01_PERSONEL_YONETIMI'!O$totRK" $cRed
Make-DashboardCard $shD 10 8 12 9 "KALAN OGRENCI ALACAGI" "='02_OGRENCI_YONETIMI'!P$totRS" $cPurple

# 3 CARİ VE SAYIM KARTI (Satır 14-16)
Make-DashboardCard $shD 14 2 16 3 "NET CARI / DIGER ALACAK" "='03_CARI_ALACAKLAR'!H$totRDA" $cAmber
Make-DashboardCard $shD 14 5 16 6 "AKTIF PERSONEL SAYISI" "=COUNTA('01_PERSONEL_YONETIMI'!C5:C54)" $cNavyMid $false
Make-DashboardCard $shD 14 8 16 9 "SIRKET NET ALACAK BILANCOSU" "='02_OGRENCI_YONETIMI'!P$totRS + '03_CARI_ALACAKLAR'!H$totRDA - '01_PERSONEL_YONETIMI'!O$totRK" $cGreenDark

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

# PARAMETRELER Sayfasını Kullanıcıdan Gizle! (Göz yormasın, arkada çalışsın)
$wb.Sheets.Item("PARAMETRELER").Visible = 0

# Ana Paneli Aktif Yap
$wb.Sheets.Item("00_ANA_PANEL").Activate()

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

Write-Host "ISLEM TAMAMLANDI! Butonlu, goz yormayan super model basariyla olusturuldu." -ForegroundColor Green
