import fs from 'fs';
import path from 'path';

const categories = [
  'mind', 'islam', 'philosophy', 'history', 'science', 
  'technology', 'world', 'story', 'uplift', 'poetry'
];

const topics = {
  'mind': [
    "Seni Menjaga Kewarasan di Tengah Arus Informasi 24 Jam",
    "Anatomi Kecemasan Modern: Mengapa Kita Merasa Lelah Tanpa Bekerja Fisik",
    "Membangun Ruang Sunyi di Dalam Kepala: Praktik Kontemplasi Harian"
  ],
  'islam': [
    "Tafakkur sebagai Metode Pembersihan Akal dan Jiwa",
    "Relevansi Tasawuf di Era Disrupsi Digital dan Materialisme",
    "Menemukan Ketenangan Melalui Konsep Tawakkal yang Proporsional"
  ],
  'philosophy': [
    "Pelajaran dari Epictetus: Memilah Apa yang Bisa dan Tidak Bisa Dikontrol",
    "Eksistensialisme Praktis: Menemukan Makna Hidup Tanpa Panduan Mutlak",
    "Stoikisme dan Keseimbangan Emosi di Dunia yang Serba Cepat"
  ],
  'history': [
    "Pelajaran dari House of Wisdom: Mengelola Ledakan Informasi di Masa Lalu",
    "Bagaimana Peradaban Islam Kuno Membangun Budaya Literasi yang Kuat",
    "Meneliti Runtuhnya Perpustakaan Besar Dunia dan Pelajarannya untuk Kita"
  ],
  'science': [
    "Neuroplastisitas: Bagaimana Pikiran Kita Membentuk Ulang Struktur Otak",
    "Sains di Balik Perhatian Manusia dan Mengapa Fokus Menjadi Barang Langka",
    "Biologi Ketenangan: Apa yang Terjadi pada Tubuh Saat Kita Berzikir atau Meditasi"
  ],
  'technology': [
    "Algoritma dan Erosi Kehendak Bebas: Meninjau Etika Teknologi Modern",
    "Gerakan Minimalisme Digital: Memilih Hidup Sadar Tanpa Budak Layar",
    "Masa Depan Perangkat Lunak Lokal-Pertama untuk Privasi Manusia"
  ],
  'world': [
    "Solitude Perkotaan: Kesepian di Tengah Keramaian Kota Metropolitan",
    "Perubahan Lanskap Sosial Manusia Menghadapi Otomasi Global",
    "Mencari Akar Komunitas yang Hilang di Dunia yang Hyper-Connected"
  ],
  'story': [
    "Sebuah Pagi di Kota Tua: Perjalanan Mencari Alasan untuk Tetap Tenang",
    "Kisah Pembuat Jam Tua yang Menolak Kecepatan Zaman",
    "Surat dari Seseorang yang Memilih Berhenti Mengejar Validasi Sosial"
  ],
  'uplift': [
    "Merangkul Ketidaksempurnaan: Seni Berdamai dengan Diri Sendiri",
    "Kekuatan Kecil dari Konsistensi Tanpa Tepuk Tangan",
    "Menemukan Kembali Keberanian untuk Memulai dari Titik Nol"
  ],
  'poetry': [
    "Gema Sunyi di Ruang Antara Asa dan Realita",
    "Nyanyian Daun Kering di Musim Gugur Pikiran",
    "Jejak Langkah yang Hilang di Kabut Pagi"
  ]
};

async function generate() {
  let createdCount = 0;
  for (const cat of categories) {
    const list = topics[cat] || [];
    for (let i = 0; i < list.length; i++) {
      const title = list[i];
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const filePath = path.join('/home/sugiyanto/projects/simple-reads/src/content/articles', `2026-09-14-${slug}.md`);

      const content = `---
title: "${title}"
description: "Sebuah esai reflektif mengenai ${title.toLowerCase()}, menggali makna mendalam untuk ketenangan batin dan kejernihan pikiran."
pubDate: 2026-09-14
category: "${cat}"
author: "Redaksi Simple Reads"
---

# ${title}

Di tengah deru kehidupan modern yang menuntut kecepatan tanpa henti, manusia sering kali kehilangan jangkar dirinya. Kita berlari mengejar sesuatu yang sering kali tidak jelas ujungnya, terhanyut dalam arus informasi yang datang silih berganti setiap detik.

## Menemukan Kembali Titik Fokus

Ketenangan bukan hadiah yang datang begitu saja, melainkan hasil dari pilihan sadar untuk menarik diri sejenak dari kebisingan. Ketika pikiran mulai penuh oleh ekspektasi luar, saatnya kembali ke dalam diri.

> "Ketenangan sejati lahir ketika seseorang berhenti memperebutkan hal-hal yang berada di luar kendalinya."

Praktik kontemplasi harian atau *tafakkur* mengajarkan kita untuk melihat melampaui permukaan. Bahwa hidup ini bukan sekadar tentang seberapa banyak pencapaian yang diraih, tetapi seberapa jernih hati menjalaninya.

## Melangkah dengan Kesadaran Penuh

Dengan memperlambat langkah dan menyaring apa yang benar-benar esensial, kita mulai menemukan kembali makna di balik setiap hal kecil yang sering terabaikan. 

Bagaimana cara Anda menjaga kewarasan dan kejernihan pikiran di tengah dunia yang bising hari ini?
`;

      fs.writeFileSync(filePath, content, 'utf8');
      createdCount++;
      console.log(`Created [${cat}]: ${title}`);
    }
  }
  console.log(`Total created: ${createdCount} articles.`);
}

generate();
