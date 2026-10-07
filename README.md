# Toko Online ISPARMO 🚀

> **Menyediakan Buku PDF (Ebook), Aplikasi berbasis AI, dan Pelatihan Online. Tersedia affiliate melalui Lynk.id.**

Official Landing Page untuk katalog produk digital [@kangmasis di Lynk.id](https://lynk.id/kangmasis). Dibangun dengan arsitektur modern yang ringan, responsif, SEO & AEO/GEO Friendly, mendukung Dark & Light Mode, serta dilengkapi sistem **otomatisasi sinkronisasi produk** menggunakan GitHub Actions.

---

## 🌟 Fitur Utama

- 🎨 **Tema Modern Clean (Putih, Hitam & Oranye)**: Tampilan visual elegan dengan aksen oranye energik, typography modern (*Plus Jakarta Sans*), dan dukungan **Mode Terang (Light)** & **Mode Gelap (Dark)** dengan switch instan.
- 📱 **100% Responsif & Mobile-First**: Sempurna diakses dari smartphone, tablet, maupun layar desktop.
- ⚡ **SEO & AEO/GEO Friendly**:
  - Semantic HTML5 lengkap sesuai pedoman Google Search Central.
  - JSON-LD Schema.org terintegrasi (`Store`, `ItemList`, `Product`, `WebSite`, dan `FAQPage`) untuk mendukung Google Rich Snippets, Google AI Overview, Perplexity, Gemini, dan ChatGPT Search citations.
  - OpenGraph & Twitter Card terpasang lengkap dengan gambar banner preview.
- 🔍 **Katalog Cerdas & Filter Interaktif**:
  - Live Search instan (pencarian judul, kata kunci, tag).
  - Filter kategori: **Semua Produk**, **Aplikasi Web AI**, **Buku PDF (Ebook)**, dan **Pelatihan Online**.
  - Pengurutan harga (Paling Populer, Termurah, Termahal, Nama A-Z).
- 🤝 **Integrasi Program Affiliate Lynk.id**:
  - Callout dan panduan modal interaktif bagi calon affiliate untuk menghasilkan komisi dari produk ISPARMO.
- 🔄 **Auto-Sync Otomatis dari Lynk.id**:
  - Menggunakan GitHub Actions workflow terjadwal (2x sehari) dan tombol *Run workflow* manual.
  - Begitu Anda menambahkan produk baru di Lynk.id, sistem otomatis mengambil produk terbaru dan mengupdate landing page tanpa perlu edit kode!

---

## 📁 Struktur Direktori

```text
├── .github/
│   └── workflows/
│       └── sync-products.yml   # Workflow GitHub Actions untuk auto-sync
├── assets/
│   ├── css/
│   │   └── style.css           # Desain modern, responsive, light/dark mode
│   ├── js/
│   │   └── app.js              # Logika filter, live search, tema & hydration
│   └── images/
│       ├── og-banner.jpg       # Banner preview media sosial
│       └── favicon.svg         # Icon favicon modern
├── data/
│   └── products.json           # Database JSON produk tersinkronisasi
├── scripts/
│   └── sync_products.py        # Python scraper untuk mengambil produk Lynk.id
├── index.html                  # Halaman utama dengan Schema.org AEO/GEO
├── robots.txt                  # Petunjuk perayap mesin pencari
├── sitemap.xml                 # XML Sitemap untuk Google Search Console
└── README.md                   # Dokumentasi proyek
```

---

## ⚙️ Cara Mengaktifkan GitHub Pages

1. Buka repository Anda di GitHub: [https://github.com/masisparmo/landingpage-lynk.id](https://github.com/masisparmo/landingpage-lynk.id)
2. Klik tab **Settings** (Pengaturan).
3. Di menu sidebar kiri, klik **Pages**.
4. Di bagian **Build and deployment**:
   - **Source**: Pilih `Deploy from a branch`
   - **Branch**: Pilih `main` dan folder `/ (root)`
   - Klik tombol **Save**.
5. Tunggu sekitar 1–2 menit, landing page Anda akan aktif dan dapat diakses di:
   👉 **`https://masisparmo.github.io/landingpage-lynk.id/`**

---

## 🔄 Cara Menjalankan Sinkronisasi Produk Baru

### 1. Otomatis Terjadwal (Scheduled)
GitHub Actions akan berjalan otomatis setiap hari pada jam 09:00 WIB dan 21:00 WIB untuk memeriksa apakah ada produk baru di `lynk.id/kangmasis`.

### 2. Manual Seketika (On-Demand) via Browser / HP
Jika Anda baru saja meng-upload produk baru di Lynk.id dan ingin langsung muncul saat itu juga:
1. Buka tab **Actions** di repo GitHub Anda: `https://github.com/masisparmo/landingpage-lynk.id/actions`
2. Klik workflow **Auto Sync Lynk.id Products** di menu sebelah kiri.
3. Klik tombol **Run workflow** -> pilih branch `main` -> klik **Run workflow**.
4. Dalam ~30 detik, GitHub Actions akan menyedot produk baru Anda dan langsung mengupdate katalog di landing page!

---

## 💻 Menjalankan / Menguji Secara Lokal

Untuk menguji perubahan atau menjalankan scraper di laptop Anda:

1. **Jalankan scraper lokal**:
   ```bash
   python scripts/sync_products.py
   ```
2. **Buka landing page secara lokal**:
   Cukup buka file `index.html` menggunakan browser Anda, atau gunakan live server bawaan:
   ```bash
   python -m http.server 8000
   ```
   Lalu buka `http://localhost:8000` di browser.

---

&copy; 2026 **ISPARMO** - Trainer AI & Vibe Coder untuk Produktifitas dan Bisnis.
