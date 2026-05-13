# 🗄️ NetsisDB Veritabanı Sözlüğü

**Logo Netsis ERP** veritabanı yapısını, tablolarını ve ilişkilerini anlamak için geliştirilmiş, modern ve interaktif bir referans rehberidir. Geliştiriciler, veritabanı yöneticileri ve raporlama uzmanları için kritik bilgileri tek bir panelde toplar.

![NetsisDB Preview](https://via.placeholder.com/1200x600/1e1e2e/ffffff?text=NetsisDB+Interface+Preview)

## ✨ Özellikler

*   **📊 İnteraktif Dashboard:** Toplam tablo sayısı, modül dağılımı ve son eklenen veriler hakkında genel bakış.
*   **📂 Modüler Yapı:** Stok, Cari, Fatura, Finans, Muhasebe ve Üretim gibi temel Netsis modüllerine göre kategorize edilmiş tablolar.
*   **🔗 İlişki Haritası:** Veritabanı tabloları arasındaki karmaşık ilişkileri (Foreign Key mantığı) görselleştiren interaktif ağ grafiği (`vis-network` tabanlı).
*   **💻 SQL Sorgu Kütüphanesi:** Sık kullanılan ve karmaşık raporlama ihtiyaçları için hazır, optimize edilmiş SQL sorguları.
*   **🔍 Akıllı Arama (Ctrl+K):** Tablo adı, kolon adı veya açıklamalar içinde anlık arama yapabilen gelişmiş arama motoru.
*   **💎 Premium Tasarım:** Glassmorphism (cam tasarımı) estetiği, karanlık mod desteği ve Lucide ikonları ile modern kullanıcı deneyimi.
*   **📥 Veri Aktarımı:** Tüm sözlük verisini tek tıkla JSON formatında dışa aktarma imkanı.

## 🚀 Başlangıç

Projeyi yerel bilgisayarınızda çalıştırmak için herhangi bir kurulum veya bağımlılık gerekmez.

1.  Depoyu indirin veya klonlayın.
2.  `index.html` dosyasını herhangi bir modern tarayıcıda (Chrome, Edge, Firefox) açın.

## 📁 Proje Yapısı

```text
├── index.html          # Ana uygulama arayüzü
├── style.css           # Glassmorphism tasarım sistemi ve stiller
├── app.js              # Uygulama mantığı ve render motoru
├── data.js             # Veri birleştirici ve ana konfigürasyon
└── data/               # Modül bazlı veri dosyaları
    ├── stok.js         # Stok tabloları verisi
    ├── cari.js         # Cari tabloları verisi
    ├── muhasebe.js     # Muhasebe tabloları verisi
    └── ...             # Diğer modüller ve sorgular
```

## 🛠️ Kullanılan Teknolojiler

*   **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
*   **Görselleştirme:** [vis-network](https://visjs.github.io/vis-network/docs/network/) (İlişki Haritası için)
*   **İkonlar:** [Lucide Icons](https://lucide.dev/)
*   **Tipografi:** Google Fonts (Inter)

## 📝 Notlar

Bu proje, Netsis ERP kullanıcılarının veritabanı şemasına daha hızlı adapte olması ve raporlama süreçlerini hızlandırması amacıyla bir geliştirici aracı olarak tasarlanmıştır.

---