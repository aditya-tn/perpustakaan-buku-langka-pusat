// utils/topicDetection.js - ENHANCED CONTEXTUAL VERSION
// Improved topic detection dengan contextual awareness dan stop words filtering

// Stop words untuk filter out kata umum yang bukan topic
const STOP_WORDS = new Set([
  // Indonesian common words
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu', 
  'tidak', 'akan', 'ada', 'atau', 'juga', 'dalam', 'dapat', 'saat', 'lebih',
  'orang', 'telah', 'oleh', 'karena', 'namun', 'sebagai', 'masih', 'sama',
  'atas', 'bawah', 'depan', 'belakang', 'kiri', 'kanan', 'sana', 'sini',
  'mari', 'pergi', 'datang', 'lihat', 'dengar', 'baca', 'tulis', 'buka',
  'tutup', 'besar', 'kecil', 'panjang', 'pendek', 'tinggi', 'rendah', 'baru',
  'lama', 'cepat', 'lambat', 'sangat', 'terlalu', 'agak', 'cukup', 'hanya',
  'pun', 'lah', 'kah', 'tah', 'per', 'antara', 'bagi', 'guna', 'oleh', 'sejak',
  'supaya', 'walau', 'meski', 'walaupun', 'sambil', 'seraya', 'selagi',
  'sementara', 'setelah', 'sebelum', 'ketika', 'sampai', 'hingga', 'agar',
  
  // Malay common words
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu',
  'tidak', 'akan', 'ada', 'atau', 'juga', 'dalam', 'boleh', 'apabila', 'lebih',
  'orang', 'telah', 'oleh', 'kerana', 'tetapi', 'sebagai', 'masih', 'sama',
  'atas', 'bawah', 'hadapan', 'belakang', 'kiri', 'kanan', 'sana', 'sini',
  
  // English common words
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
  'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'among', 'system', 'study', 'analysis',
  
  // General academic words (bukan topics)
  'studi', 'kajian', 'penelitian', 'analisis', 'studi', 'research', 'study',
  'analysis', 'kajian', 'penyelidikan', 'pengkajian', 'telaah', 'tinjauan',
  'pembahasan', 'diskusi', 'studi', 'studi', 'pengantar', 'dasar', 'teori',
  'praktikum', 'metode', 'metodologi', 'pendekatan', 'konsep', 'prinsip',
  'sistem', 'sistem', 'model', 'paradigma', 'framework', 'handbook', 'guide',
  'manual', 'textbook', 'buku', 'book', 'karya', 'work', 'tulisan', 'writing',
  'karangan', 'composition', 'makalah', 'paper', 'artikel', 'article', 'jurnal',
  'journal', 'terbitan', 'publication', 'edisi', 'edition', 'cetakan', 'print',
  'volume', 'jilid', 'bab', 'chapter', 'bagian', 'part', 'section'
]);

// Helper untuk extract meaningful words (filter stop words)
const extractMeaningfulWords = (judul) => {
  const words = judul.toLowerCase()
    .split(/[\s\/\-\:\(\)\,\.]+/) // Split by spaces, slashes, hyphens, etc.
    .filter(word => 
      word.length > 2 && 
      !STOP_WORDS.has(word) &&
      !word.match(/^\d+$/) // Exclude pure numbers
    );
  
  return [...new Set(words)]; // Remove duplicates
};

// Enhanced topic mapping dengan contextual patterns
const TOPIC_MAPPING = {
  'hukum': {
    keywords: [
      'hukum', 'law', 'recht', 'undang-undang', 'legislation', 'legal', 
      'peraturan', 'yurisprudensi', 'peradilan', 'justice', 'hakim',
      'pengadilan', 'advokat', 'notaris', 'jaksa', 'polisi', 'pidana',
      'perdata', 'tata', 'negara', 'administrasi', 'internasional',
      'adat', 'syariah', 'islam', 'kontrak', 'perjanjian', 'waris',
      'perkawinan', 'perceraian', 'kepailitan', 'korporasi', 'pajak',
      'perpajakan', 'pajak', 'tax', 'taxation', 'fiskal', 'fiscal',
      'bea', 'cukai', 'custom', 'excise', 'retribusi', 'pungutan'
    ],
    weight: 1.0,
    contextual: ['sistem', 'reformasi', 'kebijakan', 'politik']
  },
  
  'ekonomi': {
    keywords: [
      'ekonomi', 'economy', 'economie', 'keuangan', 'finance', 'bank',
      'bisnis', 'perdagangan', 'trade', 'perusahaan', 'company', 'korporasi',
      'pasar', 'market', 'investasi', 'investment', 'modal', 'capital',
      'bursa', 'stock', 'saham', 'share', 'valas', 'forex', 'moneter',
      'monetary', 'fiskal', 'fiscal', 'anggaran', 'budget', 'apbn', 'apbd',
      'pembangunan', 'development', 'pertumbuhan', 'growth', 'inflasi',
      'inflation', 'deflasi', 'deflation', 'krisis', 'crisis', 'resesi'
    ],
    weight: 1.0,
    contextual: ['makro', 'mikro', 'sistem', 'kebijakan', 'nasional']
  },
  
  'politik': {
    keywords: [
      'politik', 'politics', 'politiek', 'pemerintah', 'government', 
      'negara', 'nasional', 'demokrasi', 'democracy', 'pemilu', 'election',
      'partai', 'party', 'parlemen', 'parliament', 'legislatif', 'eksekutif',
      'yudikatif', 'presiden', 'president', 'perdana', 'menteri', 'gubernur',
      'bupati', 'walikota', 'lurah', 'camat', 'administrasi', 'birokrasi',
      'kebijakan', 'policy', 'strategi', 'strategy', 'kekuasaan', 'power',
      'otoritas', 'authority', 'hegemoni', 'hegemony', 'imperialisme'
    ],
    weight: 1.0,
    contextual: ['sistem', 'struktur', 'perubahan', 'reformasi']
  },
  
  'sejarah': {
    keywords: [
      'sejarah', 'history', 'geschiedenis', 'tawarikh', 'historic', 
      'chronicle', 'annals', 'masa', 'lalu', 'zaman', 'era', 'abad',
      'periode', 'period', 'tradisional', 'traditional', 'kuno', 'ancient',
      'klasik', 'classic', 'modern', 'kontemporer', 'contemporary',
      'revolusi', 'revolution', 'evolusi', 'evolution', 'perubahan',
      'change', 'transformasi', 'transformation', 'perkembangan'
    ],
    weight: 1.0,
    contextual: ['indonesia', 'nusantara', 'melayu', 'jawa', 'sumatra']
  },
  
  'budaya': {
    keywords: [
      'budaya', 'culture', 'cultuur', 'adat', 'tradisi', 'tradition',
      'kesenian', 'art', 'seni', 'warisan', 'heritage', 'folklor',
      'folklore', 'mitologi', 'mythology', 'legenda', 'legend', 'dongeng',
      'fable', 'ritus', 'ritual', 'upacara', 'ceremony', 'festival',
      'perayaan', 'celebration', 'identitas', 'identity', 'nasional',
      'lokal', 'local', 'etnis', 'ethnic', 'suku', 'tribe', 'ras'
    ],
    weight: 1.0,
    contextual: ['masyarakat', 'komunitas', 'kelompok', 'sosial']
  },
  
  'pendidikan': {
    keywords: [
      'pendidikan', 'education', 'onderwijs', 'sekolah', 'school',
      'guru', 'teacher', 'murid', 'student', 'belajar', 'learn',
      'pengajaran', 'teaching', 'kurikulum', 'curriculum', 'syllabus',
      'pelajaran', 'lesson', 'mata', 'pelajaran', 'subject', 'bidang',
      'study', 'universitas', 'university', 'college', 'akademi',
      'academy', 'institut', 'institute', 'fakultas', 'faculty',
      'jurusan', 'department', 'program', 'programme', 'studi'
    ],
    weight: 1.0,
    contextual: ['sistem', 'kebijakan', 'nasional', 'reformasi']
  },
  
  'agama': {
    keywords: [
      'islam', 'muslim', 'quran', 'hadis', 'fiqh', 'tauhid', 'sharia',
      'syariah', 'allah', 'muhammad', 'nabi', 'rasul', 'iman', 'shalat',
      'solat', 'zakat', 'sedekah', 'puasa', 'haji', 'sunni', 'syiah',
      'tasawuf', 'tarekat', 'tarikat', 'ulama', 'kyai', 'ustadz', 'ustaz',
      'pesantren', 'pondok', 'madrasah', 'masjid', 'musholla', 'surau',
      'kristen', 'christian', 'protestan', 'katolik', 'catholic', 'hindu',
      'buddha', 'buddhis', 'konghucu', 'confucius', 'kepercayaan'
    ],
    weight: 1.2, // Higher weight untuk religious terms
    contextual: ['masyarakat', 'komunitas', 'ajaran', 'pemikiran']
  },
  
  'bahasa': {
    keywords: [
      'bahasa', 'language', 'taal', 'kamus', 'dictionary', 'grammar',
      'linguistik', 'linguistics', 'sastra', 'literature', 'puisi',
      'poetry', 'prosa', 'prose', 'novel', 'cerpen', 'short', 'story',
      'drama', 'teater', 'theater', 'sandiwara', 'play', 'tembang',
      'pantun', 'pantoum', 'syair', 'poem', 'kata', 'word', 'kalimat',
      'sentence', 'tata', 'bahasa', 'grammar', 'fonologi', 'phonology',
      'morfologi', 'morphology', 'sintaksis', 'syntax', 'semantik'
    ],
    weight: 1.0,
    contextual: ['indonesia', 'melayu', 'jawa', 'daerah', 'lokal']
  },
  
  'sains': {
    keywords: [
      'sains', 'science', 'ilmu', 'pengetahuan', 'fisika', 'physics',
      'kimia', 'chemistry', 'biologi', 'biology', 'matematika', 'mathematics',
      'astronomi', 'astronomy', 'geologi', 'geology', 'meteorologi',
      'meteorology', 'arkeologi', 'archaeology', 'antropologi', 'anthropology',
      'psikologi', 'psychology', 'sosiologi', 'sociology', 'filsafat',
      'philosophy', 'logika', 'logic', 'etika', 'ethics', 'estetika'
    ],
    weight: 1.0,
    contextual: ['alam', 'empiris', 'teori', 'penelitian', 'eksperimen']
  },
  
  'teknik': {
    keywords: [
      'teknik', 'engineering', 'teknologi', 'technology', 'rekayasa',
      'mesin', 'machine', 'elektro', 'electrical', 'komputer', 'computer',
      'sipil', 'civil', 'arsitektur', 'architecture', 'industri', 'industrial',
      'kimia', 'chemical', 'pertambangan', 'mining', 'perminyakan', 'petroleum',
      'penerbangan', 'aviation', 'kelautan', 'marine', 'otomotif', 'automotive',
      'robotika', 'robotics', 'digital', 'programming', 'coding', 'software'
    ],
    weight: 1.0,
    contextual: ['sistem', 'aplikasi', 'implementasi', 'development']
  },
  
  'kesehatan': {
    keywords: [
      'kesehatan', 'health', 'medis', 'medical', 'kedokteran', 'medicine',
      'dokter', 'doctor', 'obat', 'medicine', 'drug', 'rumah', 'sakit',
      'hospital', 'klinik', 'clinic', 'puskesmas', 'farmasi', 'pharmacy',
      'keperawatan', 'nursing', 'kebidanan', 'midwifery', 'gizi', 'nutrition',
      'sanitasi', 'sanitation', 'epidemiologi', 'epidemiology', 'vaksin',
      'vaccine', 'pengobatan', 'treatment', 'terapi', 'therapy', 'rehabilitasi'
    ],
    weight: 1.0,
    contextual: ['masyarakat', 'publik', 'preventif', 'kuratif']
  },
  
  'pertanian': {
    keywords: [
      'pertanian', 'agriculture', 'petani', 'farmer', 'tanaman', 'crop',
      'padi', 'rice', 'sawah', 'field', 'ladang', 'farm', 'perkebunan',
      'plantation', 'hortikultura', 'horticulture', 'peternakan', 'livestock',
      'ikan', 'fish', 'perikanan', 'fishery', 'kehutanan', 'forestry',
      'hutan', 'forest', 'tanah', 'soil', 'irigasi', 'irrigation', 'pupuk',
      'fertilizer', 'pestisida', 'pesticide', 'organik', 'organic'
    ],
    weight: 1.0,
    contextual: ['sistem', 'modern', 'tradisional', 'berkelanjutan']
  },
  
  'lingkungan': {
    keywords: [
      'lingkungan', 'environment', 'ekologi', 'ecology', 'alam', 'nature',
      'konservasi', 'conservation', 'pelestarian', 'preservation', 'sustainable',
      'berkelanjutan', 'perubahan', 'iklim', 'climate', 'change', 'pemanasan',
      'global', 'warming', 'polusi', 'pollution', 'limbah', 'waste', 'sampah',
      'trash', 'daur', 'ulang', 'recycle', 'biodiversitas', 'biodiversity',
      'flora', 'fauna', 'satwa', 'wildlife', 'taman', 'nasional', 'park'
    ],
    weight: 1.0,
    contextual: ['hidup', 'alam', 'sumber', 'daya', 'management']
  },
  
  'seni': {
    keywords: [
      'seni', 'art', 'lukisan', 'painting', 'patung', 'sculpture', 
      'fotografi', 'photography', 'desain', 'design', 'grafis', 'graphic',
      'musik', 'music', 'lagu', 'song', 'nada', 'tone', 'instrumen',
      'instrument', 'tembang', 'gamelan', 'wayang', 'dance', 'tari',
      'teater', 'theater', 'film', 'cinema', 'sinematografi', 'cinematography',
      'sastra', 'literature', 'sastra', 'sastra', 'kriya', 'craft'
    ],
    weight: 1.0,
    contextual: ['kontemporer', 'tradisional', 'modern', 'klasik']
  },
  
  'sosiologi': {
    keywords: [
      'sosiologi', 'sociology', 'masyarakat', 'society', 'sosial', 'social',
      'komunitas', 'community', 'kelompok', 'group', 'kelas', 'class',
      'stratifikasi', 'stratification', 'mobilitas', 'mobility', 'konflik',
      'conflict', 'integrasi', 'integration', 'perubahan', 'social', 'change',
      'struktur', 'structure', 'fungsi', 'function', 'interaksi', 'interaction'
    ],
    weight: 1.0,
    contextual: ['urban', 'pedesaan', 'modern', 'tradisional']
  }
};

// Enhanced topic detection dengan contextual awareness
export const extractTopicsFromTitle = (judul) => {
  if (!judul || typeof judul !== 'string') return ['literatur'];
  
  try {
    const judulLower = judul.toLowerCase();
    const topicScores = {};
    const meaningfulWords = extractMeaningfulWords(judulLower);
    
    console.log('🔍 Meaningful words extracted:', meaningfulWords);
    
    // Initialize scores
    Object.keys(TOPIC_MAPPING).forEach(topic => {
      topicScores[topic] = 0;
    });
    
    // Score berdasarkan keyword matching
    meaningfulWords.forEach(word => {
      Object.entries(TOPIC_MAPPING).forEach(([topic, data]) => {
        if (data.keywords.includes(word)) {
          topicScores[topic] += data.weight;
          console.log(`✅ Word "${word}" matched topic "${topic}" (+${data.weight})`);
        }
      });
    });
    
    // Contextual boosting berdasarkan kombinasi kata
    Object.entries(TOPIC_MAPPING).forEach(([topic, data]) => {
      data.contextual.forEach(contextWord => {
        if (meaningfulWords.includes(contextWord)) {
          // Jika ada contextual word dan minimal 1 keyword match, beri bonus
          if (topicScores[topic] > 0) {
            topicScores[topic] += 0.5;
            console.log(`🎯 Contextual boost for "${topic}" from "${contextWord}" (+0.5)`);
          }
        }
      });
    });
    
    // SPECIAL CASE HANDLING untuk kasus spesifik
    
    // Case: "Sistem Perpajakan" → harusnya 'hukum' bukan 'bahasa'
    if (meaningfulWords.includes('perpajakan') || meaningfulWords.includes('pajak')) {
      topicScores['hukum'] += 2.0;
      topicScores['ekonomi'] += 1.0;
      topicScores['bahasa'] = 0; // Reset bahasa score
      console.log('💰 Special case: Taxation detected, boosting hukum/ekonomi');
    }
    
    // Case: "Dt. Rajo" → honorific, bukan topic
    if (judulLower.match(/\b(dt?\.?|datuk|rajo|raja)\b/)) {
      // Ini honorific, bukan topic - tidak perlu action
      console.log('👑 Honorific detected, ignoring as topic');
    }
    
    // Case: "dibahasa melayukan" → translation note, bukan topic bahasa
    if (judulLower.match(/di(bahasa|language)\w+kan/)) {
      topicScores['bahasa'] = Math.max(0, topicScores['bahasa'] - 1.0);
      console.log('🔄 Translation note detected, reducing bahasa score');
    }
    
    // Case: Religious terms dalam konteks budaya/hukum
    const religiousWords = meaningfulWords.filter(word => 
      TOPIC_MAPPING['agama'].keywords.includes(word)
    );
    if (religiousWords.length > 0) {
      // Jika ada kata agama tapi juga ada kata hukum/budaya, boost those
      if (topicScores['hukum'] > 0) {
        topicScores['hukum'] += 0.5;
        console.log('⚖️ Religious terms in legal context, boosting hukum');
      }
      if (topicScores['budaya'] > 0) {
        topicScores['budaya'] += 0.5;
        console.log('🎭 Religious terms in cultural context, boosting budaya');
      }
    }
    
    // Filter topics dengan score minimum dan sort
    const MINIMUM_SCORE = 0.8;
    const scoredTopics = Object.entries(topicScores)
      .filter(([_, score]) => score >= MINIMUM_SCORE)
      .sort(([,a], [,b]) => b - a)
      .map(([topic]) => topic);
    
    console.log('📊 Final topic scores:', topicScores);
    console.log('🎯 Selected topics:', scoredTopics);
    
    // Fallback logic
    if (scoredTopics.length === 0) {
      // Coba deteksi dari konteks umum
      if (judulLower.match(/(jawa|sumatra|kalimantan|sulawesi|papua|bali|nusantara)/)) {
        return ['budaya', 'sejarah'];
      } else if (judulLower.match(/(pemerintah|negara|politik|demokrasi)/)) {
        return ['politik'];
      } else if (judulLower.match(/(ekonomi|keuangan|bisnis|perdagangan)/)) {
        return ['ekonomi'];
      } else if (judulLower.match(/(pendidikan|sekolah|guru|belajar)/)) {
        return ['pendidikan'];
      } else {
        return ['literatur'];
      }
    }
    
    return scoredTopics.slice(0, 3); // Max 3 topics

  } catch (error) {
    console.error('❌ Error in extractTopicsFromTitle:', error);
    return ['literatur']; // Safe fallback
  }
};

// TEST FUNCTION untuk verifikasi improvement
export const testTopicDetection = () => {
  const testCases = [
    // Original problematic case
    "Sistem Perpajakan / dibahasa melayukan oleh Dt. Rajo",
    
    // Other test cases
    "Hukum Adat dan Peraturan Desa",
    "Sejarah Pendidikan di Indonesia",
    "Budaya Islam di Jawa",
    "Ekonomi Politik Pembangunan",
    "Sistem Pemerintahan Daerah",
    "Teknologi Pertanian Modern",
    "Kesehatan Masyarakat Perkotaan",
    "Linguistik Bahasa Melayu Klasik",
    "Sosiologi Pedesaan Indonesia",
    
    // Edge cases dengan stop words
    "Studi tentang Sistem Perpajakan di Indonesia",
    "Analisis Kebijakan Politik Ekonomi",
    "Buku Panduan Belajar Bahasa Inggris",
    
    // Cases dengan honorifics
    "Karya Datuk Rajo Mudo tentang Adat",
    "Pemikiran Dt. Sutan tentang Hukum",
    
    // Mixed cases
    "Sejarah Hukum Islam di Nusantara",
    "Budaya dan Politik Masyarakat Melayu",
    "Ekonomi Kreatif dan Teknologi Digital"
  ];

  console.log('🧪 TESTING TOPIC DETECTION IMPROVEMENT:');
  testCases.forEach((test, index) => {
    const topics = extractTopicsFromTitle(test);
    console.log(`${index + 1}. "${test}" → [${topics.join(', ')}]`);
  });

  return testCases.map(test => ({
    text: test,
    topics: extractTopicsFromTitle(test)
  }));
};