// utils/ruleBasedDescriptions.js - ENHANCED TOPIC DETECTION

// Helper function untuk extract tahun
export const extractYearFromString = (yearStr) => {
  if (!yearStr) return null;
  
  const exactYearMatch = yearStr.match(/^(\d{4})$/);
  if (exactYearMatch) {
    const year = parseInt(exactYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const bracketYearMatch = yearStr.match(/\[(\d{4})\]/);
  if (bracketYearMatch) {
    const year = parseInt(bracketYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const rangeYearMatch = yearStr.match(/\[(\d{4})-\d{4}\]/);
  if (rangeYearMatch) {
    const year = parseInt(rangeYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const approxYearMatch = yearStr.match(/(\d{4})/);
  if (approxYearMatch) {
    const year = parseInt(approxYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const incompleteMatch = yearStr.match(/\[(\d{2})-\?\]/);
  if (incompleteMatch) {
    const century = incompleteMatch[1];
    return parseInt(century + '00');
  }
  
  return null;
};

// ENHANCED LANGUAGE DETECTION
export const detectLanguage = (text) => {
  if (!text) return 'unknown';
  
  const textLower = text.toLowerCase();
  
  // Expanded vocabulary untuk setiap bahasa
  const languagePatterns = {
    'id': [
      // Common Indonesian words
      'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu', 
      'tidak', 'akan', 'ada', 'atau', 'juga', 'dalam', 'dapat', 'saat', 'lebih',
      'orang', 'telah', 'oleh', 'karena', 'namun', 'untuk', 'sebagai', 'masih',
      'hadap', 'rata', 'sama', 'atas', 'bawah', 'depan', 'belakang', 'kiri', 'kanan',
      // Indonesian prefixes/suffixes
      'ber', 'ter', 'me', 'pe', 'di', 'ke', 'se', 'nya', 'kah', 'lah', 'pun', 'ku', 'mu'
    ],
    'en': [
      // Common English words
      'the', 'and', 'of', 'to', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was',
      'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have',
      'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we',
      'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which', 'she', 'do',
      'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them',
      'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has',
      'two', 'more', 'write', 'go', 'see', 'number', 'no', 'way', 'could', 'people',
      'my', 'than', 'first', 'water', 'been', 'call', 'who', 'oil', 'its', 'now', 'find',
      'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part', 'over', 'new'
    ],
    'nl': [
      // Dutch words common in old book titles
      'de', 'het', 'en', 'van', 'tot', 'voor', 'met', 'zijn', 'een', 'als', 'door',
      'over', 'onder', 'tussen', 'door', 'om', 'te', 'bij', 'naar', 'uit', 'zo', 'er',
      'maar', 'ook', 'dan', 'of', 'want', 'dus', 'toch', 'al', 'op', 'aan', 'in', 'dat',
      'die', 'dit', 'deze', 'die', 'wat', 'wie', 'waar', 'hoe', 'waarom', 'welke',
      // Common Dutch suffixes
      'heid', 'schap', 'ing', 'tie', 'atie', 'iteit', 'teit', 'nis', 'sel', 'ling'
    ],
    'jv': [
      // Javanese words
      'jawa', 'kawi', 'serat', 'babad', 'kraton', 'sastra', 'tembang', 'wayang',
      'gamelan', 'batik', 'sultan', 'pangeran', 'raden', 'mas', 'mbak', 'pak', 'bu',
      'ing', 'saka', 'kang', 'sing', 'iku', 'kabeh', 'ana', 'ora', 'wis', 'arep',
      'bakal', 'sampun', 'saged', 'boten', 'mriki', 'mrono', 'kene', 'kono'
    ],
    'ar': [
      // Arabic words common in religious texts
      'islam', 'quran', 'hadis', 'fiqh', 'tauhid', 'sharia', 'sufi', 'syariah',
      'allah', 'muhammad', 'nabi', 'rasul', 'iman', 'islam', 'muslim', 'shalat',
      'zakat', 'puasa', 'haji', 'sunni', 'syiah', 'tasawuf', 'tarikat', 'ulama'
    ]
  };

  // Hitung score untuk setiap bahasa
  const scores = {};
  Object.keys(languagePatterns).forEach(lang => {
    scores[lang] = 0;
  });

  // Split text into words and check against each language
  const words = textLower.split(/[\s\.,;:!?\(\)\[\]\-\–\—]+/).filter(word => word.length > 2);
  
  words.forEach(word => {
    Object.entries(languagePatterns).forEach(([lang, patterns]) => {
      if (patterns.includes(word)) {
        scores[lang] += 1;
      }
    });
  });

  // Special cases untuk judul buku
  if (textLower.includes('history') || textLower.includes('culture') || 
      textLower.includes('study') || textLower.includes('research') ||
      textLower.includes('analysis') || textLower.includes('development') ||
      textLower.includes('handbook') || textLower.includes('guide')) {
    scores['en'] += 3;
  }

  if (textLower.includes('sejarah') || textLower.includes('budaya') || 
      textLower.includes('studi') || textLower.includes('penelitian') ||
      textLower.includes('analisis') || textLower.includes('perkembangan') ||
      textLower.includes('panduan') || textLower.includes('buku')) {
    scores['id'] += 3;
  }

  // Cari bahasa dengan score tertinggi
  let bestLang = 'unknown';
  let bestScore = 0;

  Object.entries(scores).forEach(([lang, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  });

  // Minimum threshold untuk confidence
  if (bestScore < 2) {
    // Fallback: check for obvious patterns
    if (textLower.match(/\b(the|and|of|to|a|in|is|it)\b/)) {
      return 'en';
    }
    if (textLower.match(/\b(yang|dan|di|ke|dari|untuk)\b/)) {
      return 'id';
    }
    if (textLower.match(/\b(de|het|en|van|tot|voor)\b/)) {
      return 'nl';
    }
    
    return 'unknown';
  }

  return bestLang;
};

// Specialized function untuk judul buku
export const detectLanguageFromTitle = (title) => {
  if (!title) return 'unknown';
  
  const titleLower = title.toLowerCase();
  
  // Common patterns in book titles untuk setiap bahasa
  const titlePatterns = {
    'id': [
      // Indonesian title patterns
      'sejarah', 'budaya', 'sastra', 'hukum', 'politik', 'ekonomi', 'sosial',
      'pendidikan', 'kesehatan', 'pertanian', 'teknologi', 'lingkungan',
      'pengantar', 'dasar', 'teori', 'praktikum', 'studi', 'analisis',
      'perkembangan', 'perubahan', 'transformasi', 'modernisasi',
      'indonesia', 'jawa', 'sumatra', 'kalimantan', 'sulawesi', 'papua',
      'nusantara', 'nasional', 'daerah', 'lokal', 'tradisional'
    ],
    'en': [
      // English title patterns  
      'history', 'culture', 'literature', 'law', 'politics', 'economy', 'social',
      'education', 'health', 'agriculture', 'technology', 'environment',
      'introduction', 'basic', 'theory', 'practice', 'study', 'analysis',
      'development', 'change', 'transformation', 'modernization',
      'handbook', 'guide', 'manual', 'textbook', 'research', 'methodology',
      'perspective', 'approach', 'concept', 'principle', 'system'
    ],
    'nl': [
      // Dutch title patterns
      'geschiedenis', 'cultuur', 'literatuur', 'recht', 'politiek', 'economie',
      'onderwijs', 'gezondheid', 'landbouw', 'technologie', 'milieu',
      'inleiding', 'handleiding', 'studie', 'onderzoek', 'analyse',
      'ontwikkeling', 'verandering', 'transformatie', 'modernisering',
      'nederlands', 'indisch', 'koloniaal', 'inlandsch', 'beschaving'
    ],
    'jv': [
      // Javanese title patterns
      'serat', 'babad', 'sastra', 'tembang', 'wayang', 'gamelan', 'batik',
      'kraton', 'kasultanan', 'priyayi', 'abdi', 'dalem', 'kawula', 'gusti'
    ]
  };

  const scores = {};
  Object.keys(titlePatterns).forEach(lang => {
    scores[lang] = 0;
  });

  // Check untuk setiap pattern
  Object.entries(titlePatterns).forEach(([lang, patterns]) => {
    patterns.forEach(pattern => {
      if (titleLower.includes(pattern)) {
        scores[lang] += 2;
      }
    });
  });

  // Special case: colon structure
  if (title.includes(':')) {
    const parts = title.split(':');
    if (parts.length >= 2) {
      const firstPart = parts[0].toLowerCase().trim();
      const secondPart = parts[1].toLowerCase().trim();
      
      if (firstPart.length < 20 && secondPart.length > 30) {
        scores['nl'] += 1;
        scores['en'] += 1;
      }
    }
  }

  // Cari bahasa dengan score tertinggi
  let bestLang = 'unknown';
  let bestScore = 0;

  Object.entries(scores).forEach(([lang, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  });

  if (bestLang === 'unknown' || bestScore < 1) {
    return detectLanguage(title);
  }

  return bestLang;
};

// ENHANCED TOPIC DETECTION SYSTEM
export const extractTopicsFromTitle = (judul) => {
  if (!judul) return ['umum'];
  
  const judulLower = judul.toLowerCase();
  
  // Comprehensive topic taxonomy dengan weighted keywords
  const topicTaxonomy = {
    'sejarah': {
      keywords: [
        'sejarah', 'history', 'geschiedenis', 'tawarikh', 'historic', 
        'chronicle', 'annals', 'historical', 'sejarawan', 'histori',
        'masa lalu', 'zaman', 'era', 'period', 'abad', 'century',
        'kuno', 'ancient', 'old', 'tradisional', 'traditional'
      ],
      weight: 1.0
    },
    'hukum': {
      keywords: [
        'hukum', 'law', 'recht', 'undang-undang', 'legislation',
        'legal', 'peraturan', 'regulation', 'yurisprudensi', 'jurisprudence',
        'hakim', 'judge', 'pengadilan', 'court', 'peradilan', 'justice',
        'pidana', 'criminal', 'perdata', 'civil', 'tata negara', 'constitutional'
      ],
      weight: 1.0
    },
    'budaya': {
      keywords: [
        'budaya', 'culture', 'cultuur', 'adat', 'tradisi', 'traditions',
        'kebudayaan', 'cultural', 'kesenian', 'art', 'seni', 'artistic',
        'tarian', 'dance', 'musik', 'music', 'teater', 'theater',
        'folklor', 'folklore', 'warisan', 'heritage', 'cultural heritage'
      ],
      weight: 1.0
    },
    'agama': {
      keywords: [
        'islam', 'muslim', 'islamic', 'quran', 'koran', 'hadis', 'hadith',
        'fiqh', 'jurisprudence', 'tauhid', 'theology', 'sharia', 'syariah',
        'kristen', 'christian', 'protestan', 'protestant', 'katolik', 'catholic',
        'hindu', 'hinduism', 'buddha', 'buddhism', 'buddhist', 'agama', 'religion',
        'kepercayaan', 'belief', 'spiritual', 'spirituality', 'sufi', 'sufism'
      ],
      weight: 1.0
    },
    'bahasa': {
      keywords: [
        'bahasa', 'language', 'taal', 'kamus', 'dictionary', 'grammar',
        'tata bahasa', 'linguistik', 'linguistics', 'filologi', 'philology',
        'sastra', 'literature', 'sastrawan', 'writer', 'penulis', 'author',
        'puisi', 'poetry', 'prosa', 'prose', 'cerita', 'story', 'novel'
      ],
      weight: 1.0
    },
    'pendidikan': {
      keywords: [
        'pendidikan', 'education', 'onderwijs', 'sekolah', 'school',
        'pengajaran', 'teaching', 'belajar', 'learning', 'mengajar', 'teach',
        'guru', 'teacher', 'murid', 'student', 'pelajar', 'learner',
        'kurikulum', 'curriculum', 'pelajaran', 'lesson', 'bahan ajar'
      ],
      weight: 0.9
    },
    'ekonomi': {
      keywords: [
        'ekonomi', 'economy', 'economie', 'perekonomian', 'economic',
        'keuangan', 'finance', 'financial', 'bank', 'perbankan', 'banking',
        'bisnis', 'business', 'perdagangan', 'trade', 'commerce',
        'industri', 'industry', 'industrial', 'pembangunan', 'development'
      ],
      weight: 0.9
    },
    'politik': {
      keywords: [
        'politik', 'politics', 'politiek', 'pemerintah', 'government',
        'negara', 'state', 'nasional', 'national', 'internasional', 'international',
        'demokrasi', 'democracy', 'kekuasaan', 'power', 'otoritas', 'authority',
        'parlemen', 'parliament', 'pemilu', 'election', 'partai', 'party'
      ],
      weight: 0.9
    },
    'sains': {
      keywords: [
        'sains', 'science', 'wetenschap', 'ilmu', 'knowledge', 'pengetahuan',
        'fisika', 'physics', 'kimia', 'chemistry', 'biologi', 'biology',
        'matematika', 'mathematics', 'statistika', 'statistics',
        'riset', 'research', 'penelitian', 'study', 'studi'
      ],
      weight: 0.8
    },
    'teknik': {
      keywords: [
        'teknik', 'engineering', 'techniek', 'teknologi', 'technology',
        'rekayasa', 'engineer', 'mesin', 'machine', 'elektro', 'electrical',
        'sipil', 'civil', 'komputer', 'computer', 'informatika', 'informatics',
        'arsitektur', 'architecture', 'konstruksi', 'construction'
      ],
      weight: 0.8
    },
    'kesehatan': {
      keywords: [
        'kesehatan', 'health', 'gezondheid', 'medis', 'medical',
        'kedokteran', 'medicine', 'dokter', 'doctor', 'pasien', 'patient',
        'rumah sakit', 'hospital', 'klinik', 'clinic', 'pengobatan', 'treatment',
        'obat', 'drug', 'medicine', 'farmasi', 'pharmacy'
      ],
      weight: 0.8
    },
    'pertanian': {
      keywords: [
        'pertanian', 'agriculture', 'landbouw', 'petani', 'farmer',
        'tanaman', 'crop', 'padi', 'rice', 'sawah', 'field',
        'perkebunan', 'plantation', 'hortikultura', 'horticulture',
        'ternak', 'livestock', 'peternakan', 'animal husbandry'
      ],
      weight: 0.7
    },
    'filsafat': {
      keywords: [
        'filsafat', 'philosophy', 'filosofi', 'pemikiran', 'thought',
        'etika', 'ethics', 'moral', 'morality', 'logika', 'logic',
        'metafisika', 'metaphysics', 'epistemologi', 'epistemology',
        'pemikir', 'thinker', 'teori', 'theory'
      ],
      weight: 0.7
    },
    'sosiologi': {
      keywords: [
        'sosiologi', 'sociology', 'masyarakat', 'society', 'sosial', 'social',
        'komunitas', 'community', 'kelompok', 'group', 'organisasi', 'organization',
        'interaksi', 'interaction', 'struktur', 'structure', 'perubahan sosial'
      ],
      weight: 0.7
    },
    'antropologi': {
      keywords: [
        'antropologi', 'anthropology', 'manusia', 'human', 'kemanusiaan', 'humanity',
        'etnografi', 'ethnography', 'etnis', 'ethnic', 'suku', 'tribe',
        'kebudayaan', 'culture', 'tradisi', 'tradition', 'adat istiadat'
      ],
      weight: 0.7
    },
    'psikologi': {
      keywords: [
        'psikologi', 'psychology', 'kejiwaan', 'mental', 'psikis', 'psyche',
        'perilaku', 'behavior', 'kepribadian', 'personality', 'emosi', 'emotion',
        'kognitif', 'cognitive', 'perkembangan', 'development', 'terapi', 'therapy'
      ],
      weight: 0.7
    },
    'geografi': {
      keywords: [
        'geografi', 'geography', 'bumi', 'earth', 'peta', 'map',
        'wilayah', 'region', 'daerah', 'area', 'lingkungan', 'environment',
        'alam', 'nature', 'fisik', 'physical', 'manusia', 'human'
      ],
      weight: 0.6
    },
    'seni': {
      keywords: [
        'seni', 'art', 'kunst', 'lukisan', 'painting', 'gambar', 'drawing',
        'patung', 'sculpture', 'fotografi', 'photography', 'desain', 'design',
        'kriya', 'craft', 'kerajinan', 'handicraft', 'estetika', 'aesthetics'
      ],
      weight: 0.6
    },
    'musik': {
      keywords: [
        'musik', 'music', 'muziek', 'lagu', 'song', 'nada', 'tone',
        'instrumen', 'instrument', 'orkestra', 'orchestra', 'komposer', 'composer',
        'tembang', 'melody', 'irama', 'rhythm', 'harmoni', 'harmony'
      ],
      weight: 0.6
    }
  };

  // Scoring system untuk topics
  const topicScores = {};
  Object.keys(topicTaxonomy).forEach(topic => {
    topicScores[topic] = 0;
  });

  // Check setiap kata dalam judul terhadap taxonomy
  const words = judulLower.split(/[\s\.,;:!?\(\)\[\]\-\–\—]+/).filter(word => word.length > 2);
  
  words.forEach(word => {
    Object.entries(topicTaxonomy).forEach(([topic, data]) => {
      if (data.keywords.includes(word)) {
        topicScores[topic] += data.weight;
      }
    });
  });

  // Juga check untuk phrase matches (2-3 kata)
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + ' ' + words[i + 1]);
    if (i < words.length - 2) {
      phrases.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
    }
  }

  phrases.forEach(phrase => {
    Object.entries(topicTaxonomy).forEach(([topic, data]) => {
      if (data.keywords.includes(phrase)) {
        topicScores[topic] += data.weight * 2; // Higher weight untuk phrase matches
      }
    });
  });

  // Filter topics dengan score di atas threshold
  const threshold = 0.5;
  const detectedTopics = Object.entries(topicScores)
    .filter(([topic, score]) => score >= threshold)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([topic]) => topic);

  // Fallback: jika tidak ada topic terdeteksi, coba deteksi berdasarkan context
  if (detectedTopics.length === 0) {
    return detectTopicsFromContext(judulLower);
  }

  // Return maksimal 3 topics teratas
  return detectedTopics.slice(0, 3);
};

// Fallback topic detection berdasarkan context
const detectTopicsFromContext = (judulLower) => {
  const contextPatterns = {
    'sejarah': /(abad|tahun|masa|zaman|era|period|kuno|sejar)/,
    'bahasa': /(kata|kalimat|tata bahasa|linguistik|sastra|puisi|prosa)/,
    'budaya': /(tradisi|adat|kesenian|warisan|folklor|kebudayaan)/,
    'agama': /(doa|ibadah|ritual|kepercayaan|spiritual|iman)/,
    'pendidikan': /(sekolah|guru|murid|belajar|mengajar|pelajaran)/,
    'hukum': /(pengadilan|hakim|jaksa|polisi|undang|peraturan)/
  };

  const detected = [];
  Object.entries(contextPatterns).forEach(([topic, pattern]) => {
    if (pattern.test(judulLower)) {
      detected.push(topic);
    }
  });

  return detected.length > 0 ? detected : ['umum'];
};

// Get historical era
export const getHistoricalEra = (year) => {
  if (!year) return 'tidak diketahui';
  if (year < 1800) return 'pra-kolonial';
  if (year <= 1945) return 'kolonial';
  if (year <= 1965) return 'kemerdekaan awal';
  if (year <= 1998) return 'orde baru';
  return 'reformasi';
};

// Detect book characteristics
export const detectBookCharacteristics = (book) => {
  const year = extractYearFromString(book.tahun_terbit);
  
  // Gunakan specialized title detection first, fallback ke general
  const language = detectLanguageFromTitle(book.judul) !== 'unknown' 
    ? detectLanguageFromTitle(book.judul) 
    : detectLanguage(book.judul + ' ' + (book.pengarang || ''));
  
  const topics = extractTopicsFromTitle(book.judul);
  const era = getHistoricalEra(year);
  
  return {
    year,
    language,
    topics,
    era,
    isAncient: year < 1800,
    isColonial: year >= 1800 && year <= 1945,
    isPostIndependence: year > 1945,
    hasAuthor: book.pengarang && book.pengarang !== 'Tidak diketahui',
    isDutch: language === 'nl',
    isJavanese: language === 'jv',
    isEnglish: language === 'en',
    isIndonesian: language === 'id',
    hasPublisher: book.penerbit && book.penerbit !== 'Tidak diketahui',
    topicCount: topics.length
  };
};

// Confidence scoring - ENHANCED
export const calculateConfidence = (chars) => {
  let score = 0.5; // base confidence
  
  if (chars.year) score += 0.2;
  if (chars.hasAuthor) score += 0.15;
  if (chars.topicCount > 0) score += (chars.topicCount * 0.08); // 0.08 per topic
  if (chars.language !== 'unknown') score += 0.05;
  if (chars.hasPublisher) score += 0.05;
  if (chars.topicCount >= 2) score += 0.1; // bonus untuk multiple topics
  
  return Math.min(score, 1.0);
};

// ENHANCED TEMPLATE SYSTEM
const ancientManuscriptTemplate = (book, chars, topics) => {
  const eraDesc = chars.year ? `abad ke-${Math.floor(chars.year/100)}` : 'masa lalu';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Naskah kuno dari ${eraDesc} yang membahas ${topicDesc}. Merupakan bagian dari khazanah manuskrip Nusantara koleksi Perpustakaan Nasional.`,
    `Manuskrip langka era ${chars.era} tentang ${topicDesc}. Koleksi penting untuk studi filologi dan sejarah Nusantara.`,
    `Naskah tradisional yang mengupas ${topicDesc}. Ditulis pada periode ${chars.era}, merepresentasikan warisan intelektual Nusantara.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const dutchColonialTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis era kolonial';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Literatur kolonial Belanda ${authorPart} tentang ${topicDesc}. Terbit tahun ${chars.year}${publisherPart}, memberikan perspektif historis masa penjajahan.`,
    `Buku berbahasa Belanda dari era kolonial yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}, merekam kondisi sosial-budaya Nusantara.`,
    `Karya akademik era Hindia Belanda tentang ${topicDesc}. Ditulis dalam bahasa Belanda${publisherPart}, dokumentasi penting periode kolonial.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const englishAcademicTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `by ${book.pengarang}` : 'academic work';
  const publisherPart = chars.hasPublisher ? `, published by ${book.penerbit}` : '';
  const topicDesc = topics.join(' and ');
  
  const templates = [
    `English academic work on ${topicDesc}. ${authorPart}${publisherPart}, published in ${chars.year}. Important contribution to ${chars.era} scholarship.`,
    `Scholarly publication in English focusing on ${topicDesc}. ${authorPart}${publisherPart}, represents ${chars.era} academic research.`,
    `Academic literature in English about ${topicDesc}. ${authorPart}${publisherPart}, significant work in its field of study.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const colonialEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : '';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Buku dari era kolonial tentang ${topicDesc}. ${authorPart} terbit tahun ${chars.year}${publisherPart}, mencerminkan dinamika intelektual masa penjajahan.`,
    `Literatur periode kolonial yang membahas ${topicDesc}. ${authorPart}${publisherPart}, merupakan dokumen penting untuk studi sejarah Indonesia.`,
    `Karya ${chars.era} tentang ${topicDesc}. ${authorPart}${publisherPart}, memberikan insight tentang perkembangan pemikiran Nusantara sebelum kemerdekaan.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const modernEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis Indonesia';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Buku ${chars.era} tentang ${topicDesc}. ${authorPart}, terbit tahun ${chars.year}${publisherPart}. Kontribusi penting untuk perkembangan ilmu pengetahuan Indonesia.`,
    `Literatur modern Indonesia yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}, representasi perkembangan studi keindonesiaan.`,
    `Karya akademik ${chars.era} tentang ${topicDesc}. ${authorPart}${publisherPart}, perkembangan pemikiran Indonesia pasca kemerdekaan.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const defaultTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `Karya ${book.pengarang}. ` : '';
  const yearPart = chars.year ? `Terbit tahun ${chars.year}. ` : '';
  const publisherPart = chars.hasPublisher ? `Diterbitkan oleh ${book.penerbit}. ` : '';
  const topicDesc = topics.join(' dan ');
  
  return `Buku tentang ${topicDesc}. ${authorPart}${yearPart}${publisherPart}Koleksi Perpustakaan Nasional RI.`;
};

// Main template generator
export const generateRuleBasedDescription = (book) => {
  const chars = detectBookCharacteristics(book);
  
  // Format topics berdasarkan bahasa
  let topicsFormatted;
  if (chars.isEnglish) {
    topicsFormatted = chars.topics.join(' and ');
  } else {
    topicsFormatted = chars.topics.join(' dan ');
  }
  
  // Template selection logic
  let template;
  
  if (chars.isAncient) {
    template = ancientManuscriptTemplate(book, chars, topicsFormatted);
  } else if (chars.isDutch) {
    template = dutchColonialTemplate(book, chars, topicsFormatted);
  } else if (chars.isEnglish) {
    template = englishAcademicTemplate(book, chars, topicsFormatted);
  } else if (chars.isColonial) {
    template = colonialEraTemplate(book, chars, topicsFormatted);
  } else if (chars.isPostIndependence) {
    template = modernEraTemplate(book, chars, topicsFormatted);
  } else {
    template = defaultTemplate(book, chars, topicsFormatted);
  }
  
  return {
    description: template,
    confidence: calculateConfidence(chars),
    source: 'rule-based',
    characteristics: chars
  };
};
