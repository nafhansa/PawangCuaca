require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { pool } = require('./src/db/pool');
const geoHash = require('./src/utils/geoHash');
const ipHasher = require('./src/utils/ipHasher');

const SALT_ROUNDS = 12;

// ─── DATA DEFINITIONS ─────────────────────────────────────────────────────────

const LOCATIONS_DATA = [
  { lat: -6.2088,  lon: 106.8456, label: 'Gambir, Jakarta Pusat, DKI Jakarta' },
  { lat: -6.9175,  lon: 107.6191, label: 'Coblong, Bandung, Jawa Barat' },
  { lat: -7.7975,  lon: 110.3695, label: 'Gondokusuman, Yogyakarta, DIY' },
  { lat: -7.2575,  lon: 112.7521, label: 'Gubeng, Surabaya, Jawa Timur' },
  { lat: -6.9932,  lon: 110.4203, label: 'Semarang Tengah, Semarang, Jawa Tengah' },
  { lat:  3.5952,  lon:  98.6722, label: 'Medan Kota, Medan, Sumatera Utara' },
  { lat: -5.1477,  lon: 119.4327, label: 'Ujung Pandang, Makassar, Sulawesi Selatan' },
  { lat: -2.9761,  lon: 104.7754, label: 'Ilir Barat, Palembang, Sumatera Selatan' },
  { lat: -8.6500,  lon: 115.2167, label: 'Denpasar Utara, Denpasar, Bali' },
  { lat: -7.9666,  lon: 112.6326, label: 'Klojen, Malang, Jawa Timur' },
];

const USERS_DATA = [
  { username: 'budi_prasetyo', email: 'budi@mail.com',      role: 'produsen',  status: 'approved', bio: 'Pengamat cuaca independen dari Jakarta. Sudah 5 tahun memantau pola cuaca Jabodetabek.' },
  { username: 'siti_rahayu',   email: 'siti@mail.com',      role: 'produsen',  status: 'approved', bio: 'Pawang cuaca amatir dari Bandung. Suka hiking dan selalu cek cuaca sebelum naik gunung.' },
  { username: 'ahmad_fauzi',   email: 'ahmad@mail.com',     role: 'produsen',  status: 'approved', bio: 'Petani dari Yogyakarta yang sangat bergantung pada cuaca.' },
  { username: 'konsumen1',     email: 'konsumen1@mail.com', role: 'konsumen',  status: 'approved', bio: null },
  { username: 'rina_dewi',     email: 'rina@mail.com',      role: 'konsumen',  status: 'approved', bio: 'Ibu rumah tangga di Surabaya.' },
  { username: 'joko_santoso',  email: 'joko@mail.com',      role: 'konsumen',  status: 'approved', bio: 'Driver ojol Semarang.' },
  { username: 'maya_putri',    email: 'maya@mail.com',      role: 'konsumen',  status: 'pending',  bio: null },
];

const CONDITIONS = ['Hujan Lebat', 'Hujan Ringan', 'Cerah', 'Berawan', 'Berkabut', 'Panas Terik', 'Gerimis', 'Mendung'];

const REPORT_TITLES = [
  'Hujan deras sejak subuh, jalanan banjir',
  'Cerah sepanjang hari, cocok untuk aktivitas outdoor',
  'Kabut tebal pagi ini, jarak pandang sangat terbatas',
  'Angin kencang disertai hujan lebat',
  'Cuaca panas menyengat, suhu terasa 38°C',
  'Hujan ringan sore hari, udara jadi segar',
  'Mendung tebal tapi belum hujan',
  'Gerimis sejak tengah malam',
  'Cerah berawan, angin sepoi-sepoi',
  'Badai petir malam ini sangat keras',
  'Pagi cerah tapi siang langsung hujan',
  'Cuaca ekstrem, banjir di beberapa titik',
  'Suhu turun drastis, bawa jaket',
  'Langit biru bersih, tidak ada awan',
  'Hujan lebat disertai kilat dan petir',
  'Angin kencang dari utara, waspada pohon tumbang',
  'Embun pagi tebal, jalan licin',
  'Siang terik, malam berawan',
  'Cuaca berubah-ubah sepanjang hari',
  'Hujan lokal di beberapa kecamatan',
  'Suhu paling panas bulan ini',
  'Awan mendung menutupi langit sejak pagi',
  'Drizzle ringan tidak mengganggu aktivitas',
  'Matahari terik sejak pagi hingga sore',
  'Cuaca normal, tidak ada yang perlu dikhawatirkan',
];

const REPORT_DESCRIPTIONS = [
  'Kondisi cuaca hari ini cukup ekstrem. Disarankan untuk tidak berkendara jika tidak urgent.',
  'Cuaca sangat mendukung untuk aktivitas luar ruangan. Nikmati hari yang cerah!',
  'Visibilitas sangat rendah. Hati-hati saat berkendara, nyalakan lampu kendaraan.',
  'Angin mencapai 40 km/jam. Waspada bagi pengendara motor dan pengguna sepeda.',
  'Pastikan selalu bawa air minum yang cukup dan hindari paparan sinar matahari langsung.',
  'Meski hanya gerimis, disarankan tetap bawa payung atau jas hujan.',
  'Kemungkinan hujan dalam beberapa jam ke depan. Siapkan payung.',
  'Sedikit berbeda dari prakiraan BMKG. Share juga pengalamanmu!',
  null,
  null,
];

const THREAD_TITLES = [
  'Gimana cuaca Jakarta hari ini? Share dong!',
  'Prakiraan cuaca Bandung minggu ini, akurat ga nih?',
  'Cuaca ekstrem Yogyakarta — warga harus waspada!',
  'Diskusi: BMKG vs kenyataan di lapangan Surabaya',
  'Cuaca Bali untuk liburan akhir tahun, worth it ga?',
];

const THREAD_POSTS_CONTENT = [
  [
    'Jakarta pagi ini mendung tebal, kayaknya mau hujan deh.',
    'Iya bener, tadi jam 9 udah mulai gerimis di Sudirman.',
    'Di Tangerang masih cerah nih, semoga ga kena hujan.',
    'Update: sekarang jam 2 siang udah hujan lebat di Jakarta Selatan!',
    'Semoga cepet reda, banjir kemarin belum surut semua.',
  ],
  [
    'Minggu ini BMKG bilang akan ada hujan hampir setiap hari.',
    'Beneran nih? Kemarin seharian cerah tuh di Lembang.',
    'Tergantung area sih, Bandung bawah sama atas beda banget cuacanya.',
    'Pengalaman saya, prediksi BMKG cukup akurat untuk cuaca 1-2 hari ke depan.',
  ],
  [
    'Semalam ada angin kencang banget di Sleman, pohon pada tumbang.',
    'Di Kota Jogja juga kena, beberapa ruas jalan sempat tertutup.',
    'BPBD sudah siaga, warga diimbau tidak beraktivitas di luar malam hari.',
    'Update pagi: sudah mulai kondusif, petugas sedang bersihkan jalan.',
    'Semoga tidak ada korban jiwa. Tetap waspada ya!',
  ],
  [
    'BMKG prediksi cerah, kenyataannya hujan sejak pagi. Gimana nih?',
    'Sudah biasa sih, microclimate Surabaya emang susah diprediksi.',
    'Saya malah ngandalin aplikasi ini daripada BMKG belakangan ini hehe.',
    'Data crowd-sourced memang lebih real-time, salut buat yang udah vote!',
  ],
  [
    'Mau ke Bali Desember, kira-kira cuaca gimana ya?',
    'Desember masuk musim hujan di Bali, tapi biasanya hujan cuma sebentar sore hari.',
    'Saran saya tetap bawa jas hujan tipis, jangan takut untuk datang.',
    'Tahun lalu saya ke Bali Desember, hujan hanya 1-2 jam per hari, sisanya cerah.',
    'Kuta dan Seminyak lebih sering hujan daripada Ubud. Tergantung itinerary juga.',
  ],
];

// ─── HELPER ───────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 3600 * 1000);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── SEED FUNCTIONS ───────────────────────────────────────────────────────────

async function seedLocations() {
  let inserted = 0;
  const ids = {};

  for (const loc of LOCATIONS_DATA) {
    const gh = geoHash.encode(loc.lat, loc.lon, 5);
    const existing = await pool.query('SELECT id FROM locations WHERE geohash = $1', [gh]);
    if (existing.rows.length > 0) {
      ids[loc.label] = existing.rows[0].id;
      continue;
    }
    const res = await pool.query(
      'INSERT INTO locations (geohash, lat, lon, label) VALUES ($1, $2, $3, $4) RETURNING id',
      [gh, loc.lat, loc.lon, loc.label]
    );
    ids[loc.label] = res.rows[0].id;
    inserted++;
  }

  console.log(`  Locations: ${inserted} inserted, ${LOCATIONS_DATA.length - inserted} skipped`);
  return ids;
}

async function seedUsers() {
  let inserted = 0;
  const ids = {};

  // Admin — pakai seed.js logic
  const existingAdmin = await pool.query("SELECT id FROM users WHERE email = 'admin@pawangcuaca.space'");
  if (existingAdmin.rows.length > 0) {
    ids['admin'] = existingAdmin.rows[0].id;
    console.log(`  Users: admin sudah ada (skip)`);
  } else {
    const hash = await bcrypt.hash('admin123', SALT_ROUNDS);
    const res = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, status, pawang_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['admin', 'admin@pawangcuaca.space', hash, 'superadmin', 'approved', 'legenda']
    );
    ids['admin'] = res.rows[0].id;
    inserted++;
  }

  for (const u of USERS_DATA) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length > 0) {
      ids[u.username] = existing.rows[0].id;
      continue;
    }
    const hash = await bcrypt.hash(u.username, SALT_ROUNDS);
    const res = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, status, bio)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [u.username, u.email, hash, u.role, u.status, u.bio]
    );
    ids[u.username] = res.rows[0].id;
    inserted++;
  }

  console.log(`  Users: ${inserted} inserted`);
  return ids;
}

async function seedReports(userIds, locationIds) {
  const locArr = Object.values(locationIds);
  const producers = ['budi_prasetyo', 'siti_rahayu', 'ahmad_fauzi'];
  // distribution: budi ~25, siti ~15, ahmad ~10
  const assignments = [
    ...Array(25).fill('budi_prasetyo'),
    ...Array(15).fill('siti_rahayu'),
    ...Array(10).fill('ahmad_fauzi'),
  ];

  let inserted = 0;
  const reportIds = [];

  for (let i = 0; i < 50; i++) {
    const username = assignments[i];
    const userId = userIds[username];
    const locationId = locArr[i % locArr.length];
    const title = REPORT_TITLES[i % REPORT_TITLES.length];
    const description = pick(REPORT_DESCRIPTIONS);
    const condition = CONDITIONS[i % CONDITIONS.length];
    const temp = (24 + (i * 0.37) % 11).toFixed(1);
    const createdAt = daysAgo(randInt(0, 30));

    const existing = await pool.query(
      'SELECT id FROM reports WHERE user_id = $1 AND title = $2',
      [userId, title]
    );
    if (existing.rows.length > 0) {
      reportIds.push({ id: existing.rows[0].id, userId });
      continue;
    }

    const res = await pool.query(
      `INSERT INTO reports (user_id, location_id, title, description, weather_condition, temperature, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, locationId, title, description, condition, temp, createdAt]
    );
    reportIds.push({ id: res.rows[0].id, userId });
    inserted++;
  }

  console.log(`  Reports: ${inserted} inserted, ${50 - inserted} skipped`);
  return reportIds;
}

async function seedReportVotes(userIds, reportIds) {
  const voters = ['konsumen1', 'rina_dewi', 'joko_santoso'];
  let inserted = 0;

  // Setiap voter memberikan vote pada ~15 laporan acak
  for (const voter of voters) {
    const voterId = userIds[voter];
    const subset = [...reportIds].sort(() => Math.random() - 0.5).slice(0, 15);

    for (const report of subset) {
      if (report.userId === voterId) continue; // tidak bisa vote laporan sendiri
      const voteType = Math.random() > 0.25 ? 'upvote' : 'downvote';
      const existing = await pool.query(
        'SELECT id FROM report_votes WHERE report_id = $1 AND user_id = $2',
        [report.id, voterId]
      );
      if (existing.rows.length > 0) continue;

      await pool.query(
        'INSERT INTO report_votes (report_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [report.id, voterId, voteType]
      );
      inserted++;
    }
  }

  // Update upvotes, downvotes, accuracy_pct di tabel reports
  await pool.query(`
    UPDATE reports r SET
      upvotes   = (SELECT COUNT(*) FROM report_votes rv WHERE rv.report_id = r.id AND rv.vote_type = 'upvote'),
      downvotes = (SELECT COUNT(*) FROM report_votes rv WHERE rv.report_id = r.id AND rv.vote_type = 'downvote'),
      accuracy_pct = CASE
        WHEN (
          (SELECT COUNT(*) FROM report_votes rv WHERE rv.report_id = r.id AND rv.vote_type = 'upvote') +
          (SELECT COUNT(*) FROM report_votes rv WHERE rv.report_id = r.id AND rv.vote_type = 'downvote')
        ) = 0 THEN NULL
        ELSE ROUND(
          (SELECT COUNT(*) FROM report_votes rv WHERE rv.report_id = r.id AND rv.vote_type = 'upvote')::DECIMAL /
          (
            (SELECT COUNT(*) FROM report_votes rv WHERE rv.report_id = r.id AND rv.vote_type = 'upvote') +
            (SELECT COUNT(*) FROM report_votes rv WHERE rv.report_id = r.id AND rv.vote_type = 'downvote')
          ) * 100, 2)
      END
  `);

  console.log(`  Report votes: ${inserted} inserted`);
}

async function seedThreads(userIds, locationIds) {
  const locArr = Object.values(locationIds);
  const producers = ['budi_prasetyo', 'siti_rahayu', 'ahmad_fauzi'];
  let inserted = 0;
  const threadIds = [];

  for (let i = 0; i < THREAD_TITLES.length; i++) {
    const username = producers[i % producers.length];
    const userId = userIds[username];
    const locationId = locArr[i % locArr.length];
    const title = THREAD_TITLES[i];
    const createdAt = daysAgo(randInt(1, 20));

    const existing = await pool.query(
      'SELECT id FROM threads WHERE title = $1',
      [title]
    );
    if (existing.rows.length > 0) {
      threadIds.push(existing.rows[0].id);
      continue;
    }

    const res = await pool.query(
      `INSERT INTO threads (user_id, location_id, title, created_at)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, locationId, title, createdAt]
    );
    threadIds.push(res.rows[0].id);
    inserted++;
  }

  console.log(`  Threads: ${inserted} inserted, ${THREAD_TITLES.length - inserted} skipped`);
  return threadIds;
}

async function seedThreadPosts(userIds, threadIds) {
  const allUsers = ['budi_prasetyo', 'siti_rahayu', 'ahmad_fauzi', 'konsumen1', 'rina_dewi', 'joko_santoso'];
  let inserted = 0;

  for (let t = 0; t < threadIds.length; t++) {
    const threadId = threadIds[t];
    const posts = THREAD_POSTS_CONTENT[t] || THREAD_POSTS_CONTENT[0];

    // Cek berapa post sudah ada di thread ini
    const existingCount = await pool.query(
      'SELECT COUNT(*) FROM thread_posts WHERE thread_id = $1',
      [threadId]
    );
    if (parseInt(existingCount.rows[0].count) >= posts.length) continue;

    for (let p = 0; p < posts.length; p++) {
      const username = allUsers[(t + p) % allUsers.length];
      const userId = userIds[username];
      const condition = p % 3 === 0 ? pick(CONDITIONS) : null;
      const temp = p % 3 === 0 ? (24 + randInt(0, 11)).toFixed(1) : null;
      const postTime = new Date(Date.now() - (posts.length - p) * 3600 * 1000 * randInt(1, 6));

      const alreadyExists = await pool.query(
        'SELECT id FROM thread_posts WHERE thread_id = $1 AND user_id = $2 AND position = $3',
        [threadId, userId, p]
      );
      if (alreadyExists.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO thread_posts (thread_id, user_id, content, weather_condition, temperature, position, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [threadId, userId, posts[p], condition, temp, p, postTime]
      );
      inserted++;
    }
  }

  console.log(`  Thread posts: ${inserted} inserted`);
}

async function seedWeatherVotes(userIds, locationIds) {
  const locArr = Object.values(locationIds).slice(0, 5); // 5 lokasi pertama
  const loggedUsers = ['konsumen1', 'rina_dewi', 'joko_santoso', 'budi_prasetyo'];
  let votesInserted = 0;
  let aggregatesUpserted = 0;

  // Generate forecast_hours: setiap 3 jam, 4 hari ke belakang
  const forecastHours = [];
  for (let d = 0; d < 4; d++) {
    for (let h = 0; h < 24; h += 3) {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      dt.setHours(h, 0, 0, 0);
      forecastHours.push(new Date(dt));
    }
  }

  for (const locationId of locArr) {
    // Ambil subset forecast hours untuk tiap lokasi (tidak semua jam)
    const hoursSubset = forecastHours.filter((_, i) => i % 3 === locArr.indexOf(locationId) % 3 || i % 5 === 0);

    for (const forecastHour of hoursSubset.slice(0, 8)) {
      const upvoteCount = randInt(2, 8);
      const downvoteCount = randInt(0, 4);
      const totalVotes = upvoteCount + downvoteCount;

      for (let v = 0; v < totalVotes; v++) {
        const voteType = v < upvoteCount ? 'upvote' : 'downvote';
        const fakeIp = `10.${randInt(0, 255)}.${randInt(0, 255)}.${v + 1}`;
        const fakeFingerprint = `seed_fp_${locationId}_${forecastHour.getTime()}_${v}`;
        const dateStr = forecastHour.toISOString().split('T')[0];
        const voterHash = ipHasher.generateVoterHash(fakeIp, fakeFingerprint, dateStr);
        const ipHash = ipHasher.hashIP(fakeIp);

        // Beberapa vote dengan user_id (logged in)
        const userId = v < loggedUsers.length ? (userIds[loggedUsers[v]] || null) : null;

        const existing = await pool.query(
          'SELECT id FROM votes WHERE location_id = $1 AND forecast_hour = $2 AND voter_hash = $3',
          [locationId, forecastHour, voterHash]
        );
        if (existing.rows.length > 0) continue;

        await pool.query(
          `INSERT INTO votes (location_id, forecast_hour, vote_type, voter_hash, ip_hash, user_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [locationId, forecastHour, voteType, voterHash, ipHash, userId, hoursAgo(randInt(1, 72))]
        );
        votesInserted++;
      }

      // Upsert vote_aggregates
      const aggUpvotes = await pool.query(
        `SELECT COUNT(*) FROM votes WHERE location_id = $1 AND forecast_hour = $2 AND vote_type = 'upvote'`,
        [locationId, forecastHour]
      );
      const aggDownvotes = await pool.query(
        `SELECT COUNT(*) FROM votes WHERE location_id = $1 AND forecast_hour = $2 AND vote_type = 'downvote'`,
        [locationId, forecastHour]
      );

      await pool.query(
        `INSERT INTO vote_aggregates (location_id, forecast_hour, upvotes, downvotes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (location_id, forecast_hour) DO UPDATE SET
           upvotes   = EXCLUDED.upvotes,
           downvotes = EXCLUDED.downvotes,
           updated_at = NOW()`,
        [locationId, forecastHour, parseInt(aggUpvotes.rows[0].count), parseInt(aggDownvotes.rows[0].count)]
      );
      aggregatesUpserted++;
    }
  }

  console.log(`  Weather votes: ${votesInserted} inserted`);
  console.log(`  Vote aggregates: ${aggregatesUpserted} upserted`);
}

async function updateUserStats(userIds) {
  const producerIds = [userIds['budi_prasetyo'], userIds['siti_rahayu'], userIds['ahmad_fauzi']].filter(Boolean);

  for (const userId of producerIds) {
    // Hitung report_count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM reports WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const reportCount = parseInt(countRes.rows[0].count);

    // Hitung accuracy_score
    const accRes = await pool.query(
      `SELECT COALESCE(AVG(accuracy_pct), 0) as avg_acc FROM reports WHERE user_id = $1 AND accuracy_pct IS NOT NULL`,
      [userId]
    );
    const accuracyScore = parseFloat(accRes.rows[0].avg_acc) || 0;

    // Tentukan pawang_level
    let pawangLevel = 'pemula';
    if (reportCount >= 100 && accuracyScore >= 85) pawangLevel = 'legenda';
    else if (reportCount >= 30 && accuracyScore >= 75) pawangLevel = 'elite';
    else if (reportCount >= 10 && accuracyScore >= 60) pawangLevel = 'andal';

    await pool.query(
      `UPDATE users SET report_count = $1, accuracy_score = $2, pawang_level = $3, updated_at = NOW()
       WHERE id = $4`,
      [reportCount, accuracyScore.toFixed(2), pawangLevel, userId]
    );
  }

  console.log(`  User stats updated for ${producerIds.length} producers`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function seedData() {
  try {
    console.log('\n🌱 PawangCuaca — Seed Data\n');

    console.log('📍 Seeding locations...');
    const locationIds = await seedLocations();

    console.log('👤 Seeding users...');
    const userIds = await seedUsers();

    console.log('📝 Seeding reports...');
    const reportIds = await seedReports(userIds, locationIds);

    console.log('👍 Seeding report votes...');
    await seedReportVotes(userIds, reportIds);

    console.log('💬 Seeding threads...');
    const threadIds = await seedThreads(userIds, locationIds);

    console.log('💭 Seeding thread posts...');
    await seedThreadPosts(userIds, threadIds);

    console.log('🗳️  Seeding weather votes...');
    await seedWeatherVotes(userIds, locationIds);

    console.log('📊 Updating user stats...');
    await updateUserStats(userIds);

    console.log('\n✅ Seeding selesai!\n');
    console.log('Akun yang bisa dipakai:');
    console.log('  admin          / admin123       (superadmin)');
    console.log('  budi_prasetyo  / budi_prasetyo  (produsen)');
    console.log('  siti_rahayu    / siti_rahayu    (produsen)');
    console.log('  ahmad_fauzi    / ahmad_fauzi    (produsen)');
    console.log('  konsumen1      / konsumen1      (konsumen)');
    console.log('  rina_dewi      / rina_dewi      (konsumen)');
    console.log('  joko_santoso   / joko_santoso   (konsumen)');
    console.log('  maya_putri     / maya_putri     (konsumen, status pending)\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed gagal:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seedData();
