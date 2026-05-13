const N_QUERIES = [
    {
        id: 'q1',
        title: 'Depo Bazlı Stok Bakiyeleri',
        module: 'stok',
        desc: 'Netsis - Depolardaki güncel stok miktarları ve depo isimleri.',
        sql: `SELECT S.STOK_KODU, S.STOK_ADI, D.DEPO_ADI, DP.BAKIYE 
FROM TBLSTSABIT S 
INNER JOIN TBLSTOKDP DP ON S.STOK_KODU = DP.STOK_KODU 
INNER JOIN TBLDEPO D ON DP.DEPO_KODU = D.DEPO_KODU 
WHERE DP.BAKIYE <> 0`
    },
    {
        id: 'q2',
        title: 'Cari Bakiye Listesi',
        module: 'cari',
        desc: 'Netsis - Cari hesapların borç/alacak bakiye durumu.',
        sql: `SELECT CARI_KODU, CARI_ISIM, 
SUM(CASE WHEN HAREKET_TIPI = 'B' THEN TUTAR ELSE -TUTAR END) AS BAKIYE 
FROM TBLCAHAR 
GROUP BY CARI_KODU, CARI_ISIM 
HAVING SUM(CASE WHEN HAREKET_TIPI = 'B' THEN TUTAR ELSE -TUTAR END) <> 0`
    },
    {
        id: 'q3',
        title: 'Son 10 Satış Faturası',
        module: 'fatura',
        desc: 'Netsis - En son kesilen satış faturaları ve genel toplamları.',
        sql: `SELECT TOP 10 FATIRS_NO, TARIH, CARI_ISIM, GENELTOPLAM 
FROM TBLFATUIRS 
WHERE FTIRSIP = '1' 
ORDER BY TARIH DESC`
    },
    {
        id: 'q4',
        title: 'Stok Hareket Analizi (Fiyatlı)',
        module: 'stok',
        desc: 'Netsis - Stok hareketlerinin birim fiyat ve tutar detayları.',
        sql: `SELECT STOK_KODU, STOK_ADI, STHAR_TARIH, STHAR_GCKOD, STHAR_GCMIK, STHAR_NF, STHAR_BF 
FROM TBLSTHAR 
ORDER BY STHAR_TARIH DESC`
    },
    {
        id: 'q5',
        title: 'Tiger - Ambar Bazlı Stok Bakiyeleri',
        module: 'stok',
        desc: 'Tiger - Malzeme kartlarının ambar bazlı mevcut miktarları.',
        sql: `SELECT ITM.CODE, ITM.NAME, INV.ONHAND, WH.NAME AS WHNAME
FROM LG_001_ITEMS ITM
INNER JOIN LG_001_01_GNTOTWH INV ON ITM.LOGICALREF = INV.STOCKREF
INNER JOIN L_CAPIWHOUSE WH ON INV.INVENNO = WH.NR
WHERE WH.FIRMNR = 1 AND INV.ONHAND <> 0`
    },
    {
        id: 'q6',
        title: 'Tiger - Cari Bakiye ve Risk',
        module: 'cari',
        desc: 'Tiger - Cari hesapların toplam borç, alacak ve risk limitleri.',
        sql: `SELECT CODE, DEFINITION_, 
(SELECT SUM(DEBIT - CREDIT) FROM LG_001_01_CLTOTFIL WHERE CLREF = CL.LOGICALREF) AS BALANCE
FROM LG_001_CLCARD CL`
    },
    {
        id: 'q7',
        title: 'Aylık Satış Trendi',
        module: 'fatura',
        desc: 'Netsis - Aylık bazda toplam satış tutarları.',
        sql: `SELECT MONTH(TARIH) AS AY, YEAR(TARIH) AS YIL, SUM(GENELTOPLAM) AS TOPLAM_SATIS
FROM TBLFATUIRS
WHERE FTIRSIP = '1'
GROUP BY YEAR(TARIH), MONTH(TARIH)
ORDER BY YIL DESC, AY DESC`
    }
];
