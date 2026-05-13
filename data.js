// Ana veri birleştirici - tüm modül dosyalarından gelen verileri birleştirir
const NETSIS_DATA = {
    modules: [
        { id: 'stok', name: 'Stok Yönetimi', icon: 'package', color: '#38bdf8', desc: 'Stok kartları, hareketler, depo, birim, barkod, fiyat, sayım' },
        { id: 'cari', name: 'Cari Hesaplar', icon: 'users', color: '#a855f7', desc: 'Müşteri/satıcı kartları, hareketler, banka, grup' },
        { id: 'fatura', name: 'Fatura / İrsaliye', icon: 'file-text', color: '#22c55e', desc: 'Alış/satış fatura ve irsaliyeleri, KDV, ek bilgi' },
        { id: 'siparis', name: 'Sipariş / Teklif', icon: 'shopping-cart', color: '#f59e0b', desc: 'Müşteri/satıcı siparişleri, teklif yönetimi' },
        { id: 'finans', name: 'Finans / Banka / Çek', icon: 'credit-card', color: '#ef4444', desc: 'Banka, kasa, çek, senet portföy takibi' },
        { id: 'muhasebe', name: 'Muhasebe', icon: 'book-open', color: '#06b6d4', desc: 'Hesap planı, muhasebe fişleri, mizan' },
        { id: 'uretim', name: 'Üretim / MRP', icon: 'factory', color: '#ec4899', desc: 'Reçete, üretim emri, operasyon, iş merkezi' },
        { id: 'diger', name: 'Diğer Modüller', icon: 'grid-3x3', color: '#64748b', desc: 'Demirbaş, personel, plasiyer, proje, döviz, ihracat/ithalat' }
    ],
    tables: [
        ...(typeof N_STOK_TABLES !== 'undefined' ? N_STOK_TABLES : []),
        ...(typeof N_CARI_TABLES !== 'undefined' ? N_CARI_TABLES : []),
        ...(typeof N_FATURA_TABLES !== 'undefined' ? N_FATURA_TABLES : []),
        ...(typeof N_SIPARIS_TABLES !== 'undefined' ? N_SIPARIS_TABLES : []),
        ...(typeof N_FINANS_TABLES !== 'undefined' ? N_FINANS_TABLES : []),
        ...(typeof N_MUHASEBE_TABLES !== 'undefined' ? N_MUHASEBE_TABLES : []),
        ...(typeof N_URETIM_TABLES !== 'undefined' ? N_URETIM_TABLES : []),
        ...(typeof N_DIGER_TABLES !== 'undefined' ? N_DIGER_TABLES : []),
        ...(typeof T_STOK_TABLES !== 'undefined' ? T_STOK_TABLES : []),
        ...(typeof T_CARI_TABLES !== 'undefined' ? T_CARI_TABLES : []),
        ...(typeof T_FATURA_TABLES !== 'undefined' ? T_FATURA_TABLES : []),
        ...(typeof T_SIPARIS_TABLES !== 'undefined' ? T_SIPARIS_TABLES : []),
        ...(typeof T_FINANS_TABLES !== 'undefined' ? T_FINANS_TABLES : []),
        ...(typeof T_MUHASEBE_TABLES !== 'undefined' ? T_MUHASEBE_TABLES : []),
        ...(typeof T_URETIM_TABLES !== 'undefined' ? T_URETIM_TABLES : []),
        ...(typeof T_DIGER_TABLES !== 'undefined' ? T_DIGER_TABLES : [])
    ],
    queries: [...(typeof N_QUERIES !== 'undefined' ? N_QUERIES : [])]
};

const NETSIS_TIGER_MAP = [...(typeof N_MAPPING !== 'undefined' ? N_MAPPING : [])];
