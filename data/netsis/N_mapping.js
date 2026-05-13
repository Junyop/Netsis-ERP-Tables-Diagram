const N_MAPPING = [
    // Stok Modülü Eşleşmeleri
    { netsis: 'TBLSTSABIT', tiger: 'LG_FFF_ITEMS', desc: 'Stok Kartları' },
    { netsis: 'TBLSTHAR', tiger: 'LG_FFF_SS_STLINE', desc: 'Stok Hareketleri' },
    { netsis: 'TBLSTOKDP', tiger: 'LG_FFF_SS_GNTOTST', desc: 'Stok Bakiyeleri (Tiger\'da GNTOTST tablosu veya STLINE üzerinden hesaplanır)' },
    { netsis: 'TBLDEPO', tiger: 'L_CAPIWHOUSE', desc: 'Depo/Ambar Tanımları' },
    { netsis: 'TBLSTGRP', tiger: 'LG_FFF_SPECODES (CODETYPE=1)', desc: 'Stok Grupları' },
    { netsis: 'TBLSTFIYAT', tiger: 'LG_FFF_PRCLIST', desc: 'Fiyat Listeleri' },
    { netsis: 'TBLSTBARKOD', tiger: 'LG_FFF_UNITBARCODE', desc: 'Barkod Tanımları' },
    
    // Cari Modülü Eşleşmeleri
    { netsis: 'TBLCASABIT', tiger: 'LG_FFF_CLCARD', desc: 'Cari Kartlar' },
    { netsis: 'TBLCAHAR', tiger: 'LG_FFF_SS_CLFLINE', desc: 'Cari Hareketler' },
    { netsis: 'TBLCABNKSABIT', tiger: 'LG_FFF_CLPBNACC', desc: 'Cari Banka Hesapları' },
    
    // Fatura Modülü Eşleşmeleri
    { netsis: 'TBLFATUIRS', tiger: 'LG_FFF_SS_INVOICE', desc: 'Fatura Başlıkları' },
    { netsis: 'TBLSTHAR (FTIRSIP=1,2)', tiger: 'LG_FFF_SS_STLINE (LINETYPE=0)', desc: 'Fatura Satırları' },
    
    // Sipariş Modülü Eşleşmeleri
    { netsis: 'TBLSIPAMAS', tiger: 'LG_FFF_SS_ORFICHE', desc: 'Sipariş Başlıkları' },
    { netsis: 'TBLSIPATRA', tiger: 'LG_FFF_SS_ORLINE', desc: 'Sipariş Satırları' },
    
    // Finans Modülü Eşleşmeleri
    { netsis: 'TBLBNKSABIT', tiger: 'L_CAPIBANK', desc: 'Banka Tanımları' },
    { netsis: 'TBLBNKHESSABIT', tiger: 'LG_FFF_BANKACC', desc: 'Banka Hesapları' },
    { netsis: 'TBLBNKHESTRA', tiger: 'LG_FFF_BNFLINE', desc: 'Banka Hareketleri' },
    { netsis: 'TBLKASAMAS', tiger: 'LG_FFF_KSCARD', desc: 'Kasa Tanımları' },
    { netsis: 'TBLKASA', tiger: 'LG_FFF_KSLINES', desc: 'Kasa Hareketleri' },
    
    // Muhasebe Modülü Eşleşmeleri
    { netsis: 'TBLHESAPPLANI', tiger: 'LG_FFF_EMUHACC', desc: 'Hesap Planı' },
    { netsis: 'TBLMUHFIIS', tiger: 'LG_FFF_EMFICHE', desc: 'Muhasebe Fiş Başlıkları' },
    { netsis: 'TBLMUHFIISTRA', tiger: 'LG_FFF_EMFLINE', desc: 'Muhasebe Fiş Satırları' },
    { netsis: 'TBLESNSTMAS', tiger: 'LG_FFF_CRSAFP', desc: 'Muhasebe Entegrasyon Kodları' },
    { netsis: 'TBLCASABITRA', tiger: 'LG_FFF_CRSAFP', desc: 'Cari Muhasebe Kodları' },
    { netsis: 'TBLBNSABITRA', tiger: 'LG_FFF_CRSAFP', desc: 'Banka Muhasebe Kodları' },
    { netsis: 'TBLKASABITRA', tiger: 'LG_FFF_CRSAFP', desc: 'Kasa Muhasebe Kodları' },

    // Üretim Modülü Eşleşmeleri
    { netsis: 'TBLPRDRECETE', tiger: 'LG_FFF_BOMASTER', desc: 'Reçete Başlıkları' },
    { netsis: 'TBLPRDRECETEDET', tiger: 'LG_FFF_BOMLINE', desc: 'Reçete Satırları' },
    { netsis: 'TBLPRDEMIR', tiger: 'LG_FFF_PRODORD', desc: 'Üretim Emirleri' },
    { netsis: 'TBLPRDISMERKEZI', tiger: 'LG_FFF_WORKSTAT', desc: 'İş İstasyonları' },
    
    // Diğer
    { netsis: 'TBLPROJE', tiger: 'LG_FFF_PROJECT', desc: 'Proje Kartları' },
    { netsis: 'TBLPLASIYER', tiger: 'LG_SLSMAN', desc: 'Satış Elemanları' },
    { netsis: 'TBLSUBE', tiger: 'L_CAPIDIV', desc: 'Şubeler / İşyerleri' }
];
