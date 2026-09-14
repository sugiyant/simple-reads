import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { slugify } from "./lib/text.js";

function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

// Vietnamese -> Indonesian title mapping (manual, accurate)
const translations = {
  "Nghịch lý của sự tối giản trong lưu trữ ký ức": "Paradoks Minimalisme dalam Penyimpanan Memori: Mengapa Melupakan adalah Seni",
  "Nghịch lý của sự tự do tuyệt đối": "Paradoks Kebebasan Mutlak: Membatasi Diri demi Menemukan Makna",
  "Địa chính trị của các hệ sinh thái số": "Geopolitik Ekosistem Digital: Siapa yang Mengendalikan Arus Informasi",
  "Nghịch lý của sự hài lòng: Tại sao tiến bộ cần sự bất an": "Paradoks Kepuasan: Mengapa Kemajuan Membutuhkan Kegelisahan",
  "Nghịch lý của sự chuẩn bị": "Paradoks Persiapan: Ketika Persiapan Justru Menghalangi Tindakan",
  "Nghịch lý của sự lựa chọn trong chủ nghĩa khắc kỷ": "Paradoks Pilihan dalam Stoasisme: Kebijaksanaan Memilih yang Tidak Memilih",
  "Địa chính trị của sự chú ý": "Geopolitik Perhatian: Perang Memperebutkan Fokus Manusia",
  "Sự Hủy Diệt Cái Tôi: Nghịch Lý Của Sự Hiện Hữu": "Pemusnahan Ego: Paradoks Eksistensi dan Kehadiran Murni",
  "Nghịch lý của sự trừu tượng hóa": "Paradoks Abstraksi: Ketika Upaya Memahami Justru Menjauhkan Makna",
  "Cấu trúc im lặng trong thơ": "Struktur Keheningan dalam Puisi: Arsitektur Sunyi di Balik Kata",
  "Tâm thế 'Ihsan' trong thời đại thuật toán": "Sikap Ihsan di Era Algoritma: Spiritualitas dalam Dunia Digital",
  "Cấu trúc nghịch lý của sự kiên trì": "Struktur Paradoks Ketekunan: Mengapa Bertahan Seringkali Berarti Berubah",
  "Nghịch lý của sự tối ưu hóa": "Paradoks Optimasi: Ketika Efisiensi Merusak Esensi",
  "Sự sụp đổ của các đế chế tài chính: Bài học từ sự mất kết nối giữa giá trị thực và niềm tin": "Runtuhnya Kekaisaran Keuangan: Pelajaran dari Kehilangan Hubungan antara Nilai Nyata dan Kepercayaan",
  "Nghịch lý của sự hài lòng": "Paradoks Kepuasan: Mengapa Kita Jarang Merasa Cukup",
  "Địa chính trị của sự chú ý: Tài nguyên khan hiếm mới": "Geopolitik Perhatian: Sumber Daya Langka Abad ke-21",
  "Sự sụp đổ của các đế chế từ góc độ quản trị tri thức": "Runtuhnya Kekaisaran dari Perspektif Manajemen Pengetahuan",
  "Tâm lý học về 'Sự hài lòng nội tại' (Qana'ah)": "Psikologi Qana'ah: Kepuasan Batin sebagai Fondasi Kesejahteraan",
  "Sự sụp đổ của các nền văn minh bajo góc nhìn entropy": "Runtuhnya Peradaban melalui Lensa Entropi",
  "Sự sụp đổ của các đế chế từ góc độ quản trị tài nguyên": "Runtuhnya Kekaisaran dari Perspektif Manajemen Sumber Daya",
  "Nghịch lý sự trừu tượng hóa": "Paradoks Abstraksi: Ketika Konsep Menjauhkan Kebenaran",
  "Kênh Đào Vĩnh Cửu: Bài Học Từ Thất Bại Kỹ Thuật Dự Án Grand Canal": "Kanal Abadi: Pelajaran dari Kegagalan Teknis Proyek Grand Canal",
  "Neurologia của Sự Bỏ Cuộc: Tại Sao Não Bộ Ưu Tiên Thói Qu quen Hơn Mục Tiêu Dài Hạn": "Neurologi Menyerah: Mengapa Otak Lebih Memilih Kebiasaan daripada Tujuan Jangka Panjang",
  "Hệ quả của việc xóa bỏ ký ức tập thể": "Dampak Penghapusan Memori Kolektif: Ketika Sejarah Dihapus",
  "Địa chính trị của các tuyến cáp quang biển": "Geopolitik Kabel Bawah Laut: Arteri Digital yang Rapuh",
  "Tâm Tĩnh Lặng: Sự Phủ Định Bản Ngã": "Ketenangan Batin: Penafian Ego sebagai Jalan Kebijaksanaan",
  "Kinh tế học chú ý: Xây dựng hàng rào nhận thức chống lại sự bào hòa thông tin": "Ekonomi Perhatian: Membangun Benteng Kognitif melawan Informasi Berlebih",
  "Hệ thống lưu trữ và sự sụp đổ của các nền văn minh": "Sistem Penyimpanan dan Runtuhnya Peradaban",
  "Cấu trúc vĩnh cửu của im lặng trong thơ": "Struktur Abadi Keheningan dalam Puisi",
  "Nghịch lý của sự lựa chọn trong tự do cá nhân": "Paradoks Pilihan dalam Kebebasan Individu",
  "Sự im lặng của cái tôi: Giải mã nghịch lý hủy diệt bản ngã": "Keheningan Ego: Mengurai Paradoks Disolusi Diri"
};

async function run() {
  console.log("Fetching Vietnamese-titled articles...");
  
  const query = "SELECT slug, title FROM articles WHERE slug LIKE '%-cua-%' OR slug LIKE '%-trong-%' OR slug LIKE '%-su-%' OR slug LIKE '%-nghich-%' OR slug LIKE '%-thoi-%' OR slug LIKE '%-thuat-%' OR slug LIKE '%-thanh-%' OR slug LIKE '%-nhan-%' OR slug LIKE '%-trinh-%' OR slug LIKE '%-cach-%' OR slug LIKE '%-cho-%' OR slug LIKE '%-viec-%'";
  
  let res;
  try {
    res = execSync(`npx wrangler d1 execute simple-reads-db --remote --command "${query}"`, { encoding: 'utf8' });
  } catch (err) {
    console.error("Failed to fetch:", err.message);
    process.exit(1);
  }

  let articles = [];
  try {
    const jsonStart = res.indexOf('[');
    const jsonEnd = res.lastIndexOf(']') + 1;
    articles = JSON.parse(res.substring(jsonStart, jsonEnd))[0].results;
  } catch(e) {
    console.log("Parse error:", e.message);
    return;
  }

  console.log(`Found ${articles.length} articles to translate titles.\n`);

  let fixed = 0;
  let skipped = 0;

  for (const art of articles) {
    const newTitle = translations[art.title];
    
    if (!newTitle) {
      console.log(`[SKIP] No translation for: "${art.title}"`);
      skipped++;
      continue;
    }

    // Check if title is already Indonesian (no Vietnamese chars)
    const hasVietnamese = /[ăâđêôơưÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơẠ-ỹ]/.test(art.title);
    if (!hasVietnamese) {
      console.log(`[SKIP] Already Indonesian: "${art.title}"`);
      skipped++;
      continue;
    }

    const newSlug = slugify(newTitle);
    const now = new Date().toISOString();

    const sqlQueries = [
      `DELETE FROM articles WHERE slug = '${escapeSQL(art.slug)}';`,
      `INSERT INTO articles (slug, title, description, category, content, status, impact_score, created_at, published_at) SELECT '${newSlug}', '${escapeSQL(newTitle)}', description, category, content, status, impact_score, '${now}', published_at FROM articles WHERE slug = '${escapeSQL(art.slug)}' LIMIT 0;`
    ];

    // Simpler approach: just use two separate wrangler commands
    const delFile = path.join(process.cwd(), `tmp_del_${art.slug}.sql`);
    const insFile = path.join(process.cwd(), `tmp_ins_${art.slug}.sql`);
    
    // First delete the old one
    await fs.writeFile(delFile, `DELETE FROM articles WHERE slug = '${escapeSQL(art.slug)}';`, 'utf8');
    
    // Then read content and insert new one
    // We need to get the content first
    let contentRes;
    try {
      contentRes = execSync(`npx wrangler d1 execute simple-reads-db --remote --command "SELECT content, category, published_at FROM articles WHERE slug = '${escapeSQL(art.slug)}'"`, { encoding: 'utf8' });
    } catch(e) {
      console.error(`[FAIL] Could not read content for ${art.slug}: ${e.message}`);
      skipped++;
      await fs.unlink(delFile).catch(() => {});
      continue;
    }

    let contentData;
    try {
      const js = contentRes.indexOf('[');
      const je = contentRes.lastIndexOf(']') + 1;
      contentData = JSON.parse(contentRes.substring(js, je))[0].results[0];
    } catch(e) {
      console.error(`[FAIL] Parse error for ${art.slug}`);
      skipped++;
      await fs.unlink(delFile).catch(() => {});
      continue;
    }

    if (!contentData) {
      console.log(`[SKIP] Article already deleted or not found: ${art.slug}`);
      skipped++;
      await fs.unlink(delFile).catch(() => {});
      continue;
    }

    const insSQL = `INSERT INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES ('${newSlug}', '${escapeSQL(newTitle)}', '${contentData.category}', '${escapeSQL(contentData.content)}', 'published', 9, '${now}', '${contentData.published_at || now}');`;
    
    await fs.writeFile(insFile, insSQL, 'utf8');

    try {
      // Execute delete first
      execSync(`npx wrangler d1 execute simple-reads-db --remote --file="${delFile}"`, { stdio: 'ignore' });
      // Then insert
      execSync(`npx wrangler d1 execute simple-reads-db --remote --file="${insFile}"`, { stdio: 'ignore' });
      
      fixed++;
      console.log(`✓ [${fixed}/${articles.length}] "${art.title}" → "${newTitle}" (${newSlug})`);
    } catch(e) {
      console.error(`[FAIL] SQL exec for ${art.slug}: ${e.message}`);
    }

    await fs.unlink(delFile).catch(() => {});
    await fs.unlink(insFile).catch(() => {});

    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! Fixed: ${fixed}, Skipped: ${skipped}`);
}

run();
