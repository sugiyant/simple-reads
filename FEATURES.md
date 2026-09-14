# Simple Reads — Daftar Fitur Lengkap

> Dokumentasi fitur proyek Simple Reads (Mental Nutrition Platform).
> Terakhir diperbarui: 2026-09-12

---

## I. Arsitektur & Backend

| Fitur | Deskripsi |
|:------|:----------|
| **Cloudflare Pages + Workers SSR** | Aplikasi Astro berbasis serverless Cloudflare |
| **Cloudflare D1 (Database SQL)** | Penyimpanan data artikel, status publikasi, dan statistik |
| **API `/api/get-articles`** | Fetch seluruh data artikel untuk navigasi, random, dan RSS |
| **API `/api/view`** | Increment view counter asinkron per artikel |
| **API `/api/admin`** | CRUD artikel terproteksi (create, update, delete, publish) |
| **Cloudflare Access (Zero Trust)** | Proteksi admin panel di tingkat edge Cloudflare |

---

## II. Fitur Utama Pembaca (User-Facing)

### Navigasi
| Fitur | Deskripsi |
|:------|:----------|
| **Bottom Navigation (MD3)** | Navigasi mobile standar: Beranda, Jelajah, Acak, Tampilan |
| **Top App Bar** | Akses cepat ke Arsip, Tentang, dan Preferensi Tampilan |

### Typography & Theme Engine
| Fitur | Deskripsi |
|:------|:----------|
| **Tema Warna** | Terang (Light), Sepia (Kertas Klasik), Gelap (OLED/Dark) |
| **Ukuran Font** | Kecil (A-), Normal, Besar (A+) |
| **Pilihan Font** | Classic (Literata) dan Modern (Inter) |
| **Mood Presets** | 🌿 Tenang, ⚡ Fokus, 🕊️ Reflektif — mengatur spacing, line-height, dan gaya baca |

### Navigasi Artikel
| Fitur | Deskripsi |
|:------|:----------|
| **Tombol Acak (Random)** | Navigasi ke artikel acak dengan double randomization (anti-loop) |
| **Daftar Isi Otomatis (TOC)** | Auto-generate TOC dari heading h2/h3 untuk artikel panjang |
| **Filter Kategori & Suasana** | Eksplorasi berdasarkan 10+ kategori atau kelompok suasana (Ketenangan, Analitis, Hikmah & Sejarah) |

### Interaksi & Aksesibilitas
| Fitur | Deskripsi |
|:------|:----------|
| **Text-to-Speech (TTS)** | Artikel dibacakan otomatis oleh browser (Bahasa Indonesia) |
| **Share Artikel** | Native share sheet atau copy link |
| **View Counter** | Jumlah pembaca terlihat di setiap artikel |

---

## III. Panel Admin

| Fitur | Deskripsi |
|:------|:----------|
| **Dashboard Reviewer** | Tab Draf AI dan Terbit terpisah |
| **Edit Artikel** | Modal edit judul, kategori, dan konten (Markdown) |
| **Delete Artikel** | Hapus artikel langsung dari panel admin |
| **Create Artikel Manual** | Tulis artikel baru di panel admin dengan format Markdown |
| **Auto Bypass Login** | Password dihapus — keamanan di-handle Cloudflare Access |
| **AI Content Pipeline** | Generasi otomatis dengan semantic deduplication |
| **Editorial Constitution** | Anti-toxic-positivity, 750-900 kata, truth-first, reflective question |

---

## IV. Fitur Pendukung & Otomatisasi

| Fitur | Deskripsi |
|:------|:----------|
| **PWA (Progressive Web App)** | Installable via Service Worker (`sw.js`) + `manifest.json`, offline-first |
| **SEO** | RSS feed (`/rss.xml`), Sitemap XML, Pagefind search (client-side) |
| **Language Guardrail** | Deteksi otomatis karakter diakritik asing untuk mencegah language leakage |
| **Quality Check Script** | Validasi konten: panjang kata, fakta, anti-hallucination |
| **D1 Sync Script** | Sinkronisasi batch dari `articles.json` lokal ke D1 remote |
| **Mobile Optimization** | Responsif di perangkat mobile, viewport fixed, bottom nav |
| **Dark/Light/Sepia Mode** | Persistensi tema di `localStorage` |

---

## V. AI Content Pipeline

| Komponen | Deskripsi |
|:---------|:----------|
| **Generasi Artikel** | 200+ artikel via LLM lokal, target 750-900 kata, Bahasa Indonesia |
| **Distribusi Kategori** | 50% Islam, 50% dibagi rata ke 9 kategori lain |
| **10 Kategori Aktif** | mind, islam, philosophy, history, science, technology, world, story, uplift, poetry |
| **Semantic Deduplication** | Cek bigram overlap dengan judul yang sudah ada sebelum insert |
| **Batch Generation** | Mode batch 2-3 artikel dengan jeda 5 detik (ramah PC tua) |
| **Quality Gate** | Review otomatis: publish hanya jika skor ≥ 8/10 |
