import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

async function fixForeignArticles() {
  console.log("Fetching all articles from remote D1...");
  const rawD1 = execSync('set -a; [ -f ~/.env ] && . ~/.env; npx wrangler d1 execute simple-reads-db --remote --command="SELECT slug, title, content, category FROM articles;"', { encoding: "utf8" });
  
  const jsonMatch = rawD1.match(/\[\s*\{\s*"results":[\s\S]*\}\s*\]/);
  if (!jsonMatch) {
    console.error("Failed to parse D1 response.");
    process.exit(1);
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  const articles = parsed[0].results;
  console.log(`Total articles in D1: ${articles.length}`);

  // Definitions of articles to fix/replace with proper Indonesian content
  const replacements = {
    "kien-truc-su-tinh-lang": {
      title: "Arsitektur Ketenangan: Mengapa Jeda Adalah Bagian dari Desain Pikiran",
      category: "uplift",
      description: "Mengkaji bagaimana Default Mode Network di otak membutuhkan ruang kosong dan keheningan untuk pemulihan mental yang optimal.",
      content: `# Arsitektur Ketenangan: Mengapa Jeda Adalah Bagian dari Desain Pikiran

Kita hidup dalam era yang menghukum ketiadaan aktivitas. Setiap detik kosong dianggap sebagai produktivitas yang hilang. Jeda antar pesan harus segera diisi. Waktu tunggu harus dimanfaatkan sepenuhnya. Bahkan waktu tidur pun kerap diukur dan dioptimalkan secara ketat.

Padahal, otak manusia tidak dirancang untuk bekerja tanpa henti. Ia dirancang untuk berhenti sejenak—lalu memproses, menyusun ulang, dan memulihkan diri. Ketiadaan aktivitas bukanlah kelemahan sistem, melainkan bagian fundamental dari desainnya.

## Apa yang Sebenarnya Terjadi Saat Pikiran \"Kosong\"?

Neurosains memiliki istilah khusus untuk fenomena ini: **Default Mode Network (DMN)**. Jaringan saraf ini aktif justru saat kita tidak sedang berfokus pada tugas eksternal—seperti saat kita melamun, berjalan santai tanpa tujuan, atau menatap ke luar jendela.

DMN tidak sedang menganggur. Ia menjalankan tiga fungsi krusial bagi kesehatan mental:

1. **Konsolidasi Memori:** Pengalaman hari ini dipindahkan dari memori kerja ke penyimpanan jangka panjang. Tanpa jeda ini, informasi mudah terlupa dan kelelahan kognitif menumpuk.
2. **Integrasi Lintas Domain:** Otak menghubungkan ide-ide yang tampak tidak berhubungan. Inilah akar dari momen \"aha!\" yang sering muncul secara tiba-tiba saat mandi atau berjalan kaki.
3. **Regulasi Emosi:** DMN memproses ulang pengalaman emosional yang intens. Tanpa jeda, emosi tertumpuk tanpa terurai, memicu kecemasan dan iritabilitas kronis.

## Keliru Kaprah: Diam Dianggap Tidak Produktif

Kita terjebak dalam asumsi bahwa nilai hanya dihasilkan dari aktivitas yang terlihat. Menulis, membaca, atau merespons pesan secara simultan dianggap sangat produktif. Namun, otak bukanlah pabrik dengan jalur perakitan linier. Ia bekerja menyerupai ekosistem alami yang memiliki siklus musim panen dan musim pemulihan.

Tanpa ruang istirahat, tanah kehilangan kesuburannya. Begitu pula dengan pikiran manusia. Riset psikologi menunjukkan bahwa individu sering kali merasa gelisah ketika dihadapkan pada kesunyian total tanpa gawai, sebuah indikasi bahwa kapasitas kita untuk menikmati keheningan mulai terkikis.

## Membangun Keterampilan Ketenangan

Ketenangan bukanlah kondisi pasif yang datang dengan sendirinya, melainkan keterampilan yang harus dilatih:

- **Jeda Mikro Tanpa Layar:** Luangkan lima menit setiap hari tanpa gawai atau suara latar untuk membiarkan pikiran mengalir bebas.
- **Ketenangan Aktif:** Lakukan aktivitas fisik berulang yang ringan seperti merawat tanaman atau merapikan meja tanpa gangguan informasi digital.

Ketenangan sejati bukanlah kemewahan, melainkan infrastruktur dasar bagi kewarasan di dunia yang bising.

Kapan terakhir kali Anda membiarkan pikiran Anda benar-benar tanpa arahan selama beberapa menit saja?`
    },
    "kraljevina-svedska-uvela-cetverodnevni-radni-tjedan": {
      title: "Eksperimen Jam Kerja Pendek: Pelajaran dari Swedia untuk Pemulihan Jiwa",
      category: "world",
      description: "Menganalisis dampak pengurangan jam kerja terhadap kesehatan mental, produktivitas, dan keseimbangan hidup di era modern.",
      content: `# Eksperimen Jam Kerja Pendek: Pelajaran dari Swedia untuk Pemulihan Jiwa

Jam kerja panjang sering kali diagungkan sebagai tolok ukur utama produktivitas dan dedikasi di dunia modern. Padahal, kelelahan mental kronis akibat tekanan pekerjaan terus menggerogoti kesejahteraan psikologis individu secara sistematis. Berbagai eksperimen di negara-negara maju membuktikan bahwa batas waktu kerja yang lebih manusiawi justru mendongkrak kualitas hidup dan efisiensi kerja.

Kebijakan pengurangan jam kerja atau penerapan pekan kerja yang lebih fleksibel menarik perhatian global. Meskipun wacana ini sering diasosiasikan dengan model kesejahteraan Nordik, substansinya bersifat universal: bagaimana penataan ulang struktur kerja memengaruhi psikologi manusia secara mendalam.

## Beban Mental dari Kultur \"Selalu Terhubung\"

Otak manusia bukan mesin industri yang dapat beroperasi tanpa batas. Ketika jam kerja mendominasi seluruh waktu terjaga, ruang untuk pemulihan psikologis menyusut drastis. Fenomena ini memicu sindrom kelelahan kerja (*burnout*), kecemasan berkepanjangan, dan alienasi sosial.

Struktur kerja tradisional kerap memaksa individu meredụng identitas mereka semata-mata sebagai pekerja. Akibatnya, hubungan interpersonal yang bermakna, hobi, dan waktu hening (*idle time*) terkorbankan demi target kuantitatif. Padahal, jeda mental adalah prasyarat mutlak untuk memelihara kreativitas dan stabilitas emosional.

## Fleksibilitas dan Penataan Ulang Prioritas

Penerapan jam kerja yang lebih singkat bukan sekadar tentang bersantai lebih lama, melainkan latihan disiplin prioritas. Ketika batas waktu diperketat, efisiensi melonjak karena birokrasi internal dan gangguan kerja yang tidak perlu dipangkas secara alami.

Dari sudut pandang gizi mental, waktu luang yang berkualitas memberikan nutrisi esensial bagi jiwa:
1. **Otonomi Waktu:** Mengembalikan kendali hidup kepada individu, yang terbukti menurunkan hormon stres seperti kortisol.
2. **Koneksi Sosial yang Sehat:** Menyediakan ruang untuk interaksi bermakna dengan keluarga dan komunitas.
3. **Pemulihan Kognitif:** Memberikan kesempatan bagi otak untuk mengaktifkan sistem pemrosesan bawah sadar yang penting bagi pemecahan masalah kompleks.

## Produktivitas Tanpa Eksploitasi

Produktivitas sejati diukur dari ketajaman hasil, bukan dari durasi seseorang duduk di depan layar. Masyarakat modern mulai menyadari bahwa pekerja yang beristirahat cukup terbukti lebih fokus, memiliki tingkat absensi yang rendah, dan mampu menghasilkan inovasi yang lebih berkelanjutan.

Nutrisi mental menuntut keseimbangan asupan. Jika informasi dan tuntutan pekerjaan adalah beban yang terus-menerus masuk, maka struktur kerja yang longgar adalah penawar utamanya.

Bagaimana Anda menata batasan antara tuntutan pekerjaan dan hak atas ketenangan batin Anda sendiri hari ini?`
    },
    "kraljevina-tajland-usvaja-prvu-zakonodavnu-zastitu-autohtonih-biljaka": {
      title: "Perlindungan Flora Lokal: Menjaga Warisan Ekologis dan Ketahanan Hayati",
      category: "world",
      description: "Mengkaji pentingnya regulasi perlindungan tanaman endemik dan pengetahuan lokal untuk menjaga keseimbangan ekosistem global.",
      content: `# Perlindungan Flora Lokal: Menjaga Warisan Ekologis dan Ketahanan Hayati

Keanekaragaman hayati bukan hanya aset biologis, melainkan fondasi bagi ketahanan ekologis dan budaya suatu bangsa. Di tengah tekanan industrialisasi global dan eksploitasi komersial, perlindungan terhadap flora endemik dan pengetahuan tradisional menjadi semakin mendesak.

Langkah-langkah legislatif yang diambil berbagai negara di Asia Tenggara dalam melindungi tanaman asli menunjukkan kesadaran baru bahwa kekayaan alam bukanlah sumber daya tanpa batas yang bisa dieksploitasi sepihak.

## Hubungan Timbal Balik Manusia dan Tanaman

Sejak ribuan tahun lalu, masyarakat lokal telah hidup berdampingan dengan flora endemik, memanfaatkannya tidak hanya sebagai bahan pangan atau obat tradisional, tetapi juga merajutnya dalam sistem filosofi dan kebudayaan mereka. Ketika tanaman asli terancam punah akibat alih fungsi lahan atau komersialisasi monokultur, warisan pengetahuan turun-temurun ikut terkikis.

Pelestarian flora lokal bukan sekadar urusan botani, melainkan upaya menjaga kedaulatan ekologis dari cengkeraman eksploitasi korporasi multinasional yang kerap mengabaikan hak-hak komunitas lokal.

## Kedaulatan Ekologis di Tengah Disrupsi

Regulasi perlindungan tanaman asli mencakup pembatasan paten genetik ilegal dan pengakuan atas hak komunal masyarakat adat. Ini adalah bentuk koreksi terhadap model ekonomi ekstraktif yang kerap mengabaikan keseimbangan jangka panjang demi keuntungan instan.

Dengan memperkuat ekosistem lokal, suatu wilayah tidak hanya menyelamatkan spesies langka dari kepunahan, tetapi juga memperkuat ketahanan pangan dan adaptasi terhadap perubahan iklim.

Bagaimana kita dapat menghargai hubungan kita dengan alam di tengah kecepatan modernisasi yang sering kali mengabaikan akar ekologis kita?`
    }
  };

  const sqlStatements = [];
  for (const [slug, data] of Object.entries(replacements)) {
    const safeTitle = data.title.replace(/'/g, "''");
    const safeCategory = data.category.replace(/'/g, "''");
    const safeContent = data.content.replace(/'/g, "''");
    
    sqlStatements.push(`UPDATE articles SET title = '${safeTitle}', category = '${safeCategory}', content = '${safeContent}' WHERE slug = '${slug}';`);
    console.log(`Prepared update for slug: ${slug}`);
  }

  const batchFile = path.join(process.cwd(), "tmp_fix_articles.sql");
  await fs.writeFile(batchFile, sqlStatements.join("\n"), "utf8");
  console.log(`Wrote fix SQL to ${batchFile}. Executing via Wrangler...`);

  execSync(`set -a; [ -f ~/.env ] && . ~/.env; npx wrangler d1 execute simple-reads-db --remote --file="${batchFile}"`, { stdio: "inherit" });
  
  await fs.unlink(batchFile);
  console.log("Successfully fixed and updated all foreign/broken articles in remote D1!");
}

fixForeignArticles().catch(e => {
  console.error("Fix script failed:", e);
  process.exit(1);
});
