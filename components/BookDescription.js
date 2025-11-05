// utils/ruleBasedDescriptions.js - FULL UPDATED VERSION

// Helper function untuk extract tahun dari berbagai format
export const extractYearFromString = (yearStr) => {
  if (!yearStr) return null;
  
  try {
    // Handle string inputs
    const str = yearStr.toString().trim();
    
    // Exact year match: "1920"
    const exactYearMatch = str.match(/^(\d{4})$/);
    if (exactYearMatch) {
      const year = parseInt(exactYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
    // Bracket year match: "[1920]"
    const bracketYearMatch = str.match(/\[(\d{4})\]/);
    if (bracketYearMatch) {
      const year = parseInt(bracketYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
    // Range year match: "[1920-1930]"
    const rangeYearMatch = str.match(/\[(\d{4})-\d{4}\]/);
    if (rangeYearMatch) {
      const year = parseInt(rangeYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
    // Approximate year match: "circa 1920" or "c.1920"
    const approxYearMatch = str.match(/(\d{4})/);
    if (approxYearMatch) {
      const year = parseInt(approxYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
    // Incomplete match: "[19-?]"
    const incompleteMatch = str.match(/\[(\d{2})-\?\]/);
    if (incompleteMatch) {
      const century = incompleteMatch[1];
      return parseInt(century + '00');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting year from:', yearStr, error);
    return null;
  }
};

// Enhanced language detection untuk buku langka
export const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'id'; // Default to Indonesian
  
  try {
    const textLower = text.toLowerCase().trim();
    if (textLower.length < 2) return 'id';
    
    // Comprehensive pattern matching untuk semua bahasa
    const patterns = {
      'id': [
        /\b(yang|dan|di|ke|dari|untuk|pada|dengan|ini|itu|tidak|akan|ada|atau|juga|dalam|dapat|saat|lebih|orang|telah|oleh|karena|namun|sebagai|masih|sama|atas|bawah|depan|belakang|kiri|kanan|sejarah|budaya|sastra|hukum|politik|ekonomi|sosial|pendidikan|kesehatan|pertanian|teknologi|lingkungan|pengantar|dasar|teori|praktikum|studi|analisis|perkembangan|perubahan|transformasi|modernisasi|indonesia|jawa|sumatra|kalimantan|sulawesi|papua|nusantara|nasional|daerah|lokal|tradisional|adat|tradisi|kesenian|warisan|masyarakat|negara|pemerintah|rakyat|bangsa|bahasa|kata|kalimat|tulisan|buku|karya|penulis|pengarang|penerbit|terbit|tahun|abad|zaman|masa|periode|era|kuno|modern|kontemporer|masa\s+depan|masa\s+lalu)\b/gi
      ],
      'en': [
        /\b(the|and|of|to|a|in|is|it|you|that|he|was|for|on|are|as|with|his|they|i|at|be|this|have|from|or|one|had|by|word|but|not|what|all|were|we|when|your|can|said|there|use|an|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|him|into|time|has|two|more|write|go|see|number|no|way|could|people|my|than|first|water|been|call|who|oil|its|now|find|long|down|day|did|get|come|made|may|part|over|new|work|world|life|study|research|analysis|development|history|culture|literature|law|politics|economy|social|education|health|agriculture|technology|environment|introduction|basic|theory|practice|methodology|perspective|approach|concept|principle|system|handbook|guide|manual|textbook|academic|scholarly|publication|international|global|century|period|era|ancient|modern|contemporary|future|past)\b/gi
      ],
      'nl': [
        /\b(de|het|en|van|tot|voor|met|zijn|een|als|door|over|onder|tussen|om|te|bij|naar|uit|zo|er|maar|ook|dan|of|want|dus|toch|al|op|aan|in|dat|die|dit|deze|wat|wie|waar|hoe|waarom|welke|geschiedenis|cultuur|literatuur|recht|politiek|economie|onderwijs|gezondheid|landbouw|technologie|milieu|inleiding|handleiding|studie|onderzoek|analyse|ontwikkeling|verandering|transformatie|modernisering|nederlands|indisch|koloniaal|inlandsch|beschaving|nederlandsch|indie|java|sumatra|borneo|celebes|batavia|welvaart|bestuur|regeering|volk|taal|boek|schrijver|uitgever|jaar|eeuw|tijd|periode|oud|modern)\b/gi
      ],
      'jv': [
        /\b(jawa|kawi|serat|babad|kraton|sastra|tembang|wayang|gamelan|batik|sultan|pangeran|raden|mas|mbak|pak|bu|ing|saka|kang|sing|iku|kabeh|ana|ora|wis|arep|bakal|sampun|saged|boten|mriki|mrono|kene|kono|wong|tiyang|bocah|lare|kutha|desa|dhusun|alas|wana|gunung|segara|kali|banyu|pangan|turu|tindak|lampah|srawung|gawe|karya|tulis|mac|waca|pangan|ombe|ngombe|mangan|turu|sare|tindak|laku|lakon|crita|carita|layang|buku|panganggit|penerbit|taun|warsa|abad|jaman|jaman|masa|wektu|biyen|sapunika|mengk|sanes|sami|sedaya|kathah|sakedhik|langkung|kirang|sae|awon|ayu|bagus|apik|sae|awon|luwih|kurang|luwih|langkung|sakedhik|kathah|sedaya|sami|sanes|mengk|sapunika|biyen|wektu|masa|jaman|abad|warsa|taun|penerbit|panganggit|buku|layang|carita|crita|lakon|laku|tindak|sare|turu|mangan|ngombe|ombe|pangan|waca|mac|tulis|karya|gawe|srawung|lampah|tindak|turu|pangan|banyu|kali|segara|gunung|wana|alas|dhusun|desa|kutha|lare|bocah|tiyang|wong|kono|kene|mrono|mriki|boten|saged|sampun|bakal|arep|wis|ora|ana|kabeh|iku|sing|kang|saka|ing|bu|pak|mbak|mas|raden|pangeran|sultan|batik|gamelan|wayang|tembang|sastra|kraton|babad|serat|kawi|jawa)\b/gi
      ],
      'ar': [
        /\b(islam|quran|hadis|fiqh|tauhid|sharia|sufi|syariah|allah|muhammad|nabi|rasul|iman|muslim|shalat|zakat|puasa|haji|sunni|syiah|tasawuf|tarikat|ulama|kitab|surah|ayat|doa|ibadah|masjid|musholla|pesantren|santri|kyai|ustadz|dakwah|khutbah|tarbiyah|akidah|akhlak|muamalah|jinayah|waris|faraid|nikah|talak|rujuk|iddah|mahar|wasiat|hibah|wakaf|shadaqah|infaq|riba|bank|asuransi|bisnis|ekonomi|syariah|politik|negara|pemerintah|khalifah|imamah|baiat|jihad|amar\s+ma'ruf|nahi\s+munkar|ukhuwah|persaudaraan|ummah|masyarakat|keluarga|rumah\s+tangga|pendidikan|ilmu|pengetahuan|belajar|mengajar|guru|murid|sekolah|madrasah|universitas|kampus|perguruan\s+tinggi)\b/gi
      ]
    };

    const scores = { id: 0, en: 0, nl: 0, jv: 0, ar: 0 };
    
    // Count matches for each language dengan weighting
    Object.entries(patterns).forEach(([lang, regexes]) => {
      regexes.forEach(regex => {
        const matches = textLower.match(regex);
        if (matches) {
          scores[lang] += matches.length;
        }
      });
    });

    // Special boost untuk cases yang obvious
    if (textLower.includes('history') || textLower.includes('culture') || textLower.includes('study') || textLower.includes('research')) {
      scores['en'] += 10;
    }
    if (textLower.includes('sejarah') || textLower.includes('budaya') || textLower.includes('studi') || textLower.includes('penelitian')) {
      scores['id'] += 10;
    }
    if (textLower.includes('geschiedenis') || textLower.includes('cultuur') || textLower.includes('nederlands')) {
      scores['nl'] += 10;
    }
    if (textLower.includes('serat') || textLower.includes('babad') || textLower.includes('jawa') || textLower.includes('kraton')) {
      scores['jv'] += 10;
    }
    if (textLower.includes('islam') || textLower.includes('quran') || textLower.includes('fiqh') || textLower.includes('hadis')) {
      scores['ar'] += 10;
    }

    // Find best language
    let bestLang = 'id'; // Default to Indonesian
    let bestScore = 0;

    Object.entries(scores).forEach(([lang, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang;
      }
    });

    console.log(`Language detection for "${text.substring(0, 50)}...":`, { scores, bestLang, bestScore });

    return bestLang;

  } catch (error) {
    console.error('Error in detectLanguage:', error);
    return 'id'; // Fallback to Indonesian
  }
};

// Specialized function untuk judul buku
export const detectLanguageFromTitle = (title) => {
  if (!title || typeof title !== 'string') return 'id';
  
  try {
    const titleLower = title.toLowerCase();
    
    // Quick checks untuk obvious cases dengan priority
    if (titleLower.includes('geschiedenis') || titleLower.includes('cultuur') || 
        titleLower.includes('nederlands') || titleLower.includes('indisch')) {
      return 'nl';
    }
    if (titleLower.includes('serat') || titleLower.includes('babad') || 
        titleLower.includes('jawa') || titleLower.includes('kraton')) {
      return 'jv';
    }
    if (titleLower.includes('islam') || titleLower.includes('quran') || 
        titleLower.includes('fiqh') || titleLower.includes('hadis')) {
      return 'ar';
    }
    if ((titleLower.includes('history') || titleLower.includes('culture')) && 
        !titleLower.includes('sejarah') && !titleLower.includes('budaya')) {
      return 'en';
    }
    
    // Default ke general detection
    return detectLanguage(title);
  } catch (error) {
    console.error('Error in detectLanguageFromTitle:', error);
    return 'id';
  }
};

// Enhanced topic detection system
export const extractTopicsFromTitle = (judul) => {
  if (!judul || typeof judul !== 'string') return ['sastra'];
  
  try {
    const judulLower = judul.toLowerCase();
    const topics = [];
    
    // Comprehensive topic mapping dengan weighted approach
    const topicMapping = {
      'sejarah': {
        keywords: ['sejarah', 'history', 'geschiedenis', 'tawarikh', 'historic', 'chronicle', 'annals', 'masa lalu', 'zaman', 'era', 'abad', 'period', 'temporal'],
        weight: 2
      },
      'hukum': {
        keywords: ['hukum', 'law', 'recht', 'undang-undang', 'legislation', 'legal', 'peraturan', 'yurisprudensi', 'peradilan', 'justice', 'court', 'hakim', 'advokat'],
        weight: 2
      },
      'budaya': {
        keywords: ['budaya', 'culture', 'cultuur', 'adat', 'tradisi', 'kesenian', 'art', 'seni', 'warisan', 'heritage', 'folklor', 'kebudayaan', 'cultural'],
        weight: 2
      },
      'agama': {
        keywords: ['islam', 'muslim', 'quran', 'hadis', 'fiqh', 'tauhid', 'sharia', 'kristen', 'christian', 'hindu', 'buddha', 'religion', 'kepercayaan', 'spiritual', 'sufi'],
        weight: 2
      },
      'bahasa': {
        keywords: ['bahasa', 'language', 'taal', 'kamus', 'grammar', 'linguistik', 'sastra', 'literature', 'puisi', 'prosa', 'cerita', 'novel', 'tata bahasa'],
        weight: 2
      },
      'pendidikan': {
        keywords: ['pendidikan', 'education', 'onderwijs', 'sekolah', 'guru', 'murid', 'belajar', 'pengajaran', 'kurikulum', 'pelajaran', 'didik', 'mengajar'],
        weight: 1
      },
      'ekonomi': {
        keywords: ['ekonomi', 'economy', 'economie', 'keuangan', 'finance', 'bank', 'bisnis', 'perdagangan', 'commerce', 'pasar', 'modal', 'investasi'],
        weight: 1
      },
      'politik': {
        keywords: ['politik', 'politics', 'politiek', 'pemerintah', 'government', 'negara', 'nasional', 'demokrasi', 'kekuasaan', 'otoritas', 'parlemen', 'pemilu'],
        weight: 1
      },
      'sains': {
        keywords: ['sains', 'science', 'ilmu', 'pengetahuan', 'fisika', 'kimia', 'biologi', 'matematika', 'statistika', 'riset', 'penelitian', 'studi'],
        weight: 1
      },
      'teknik': {
        keywords: ['teknik', 'engineering', 'teknologi', 'rekayasa', 'mesin', 'elektro', 'komputer', 'informatika', 'arsitektur', 'konstruksi', 'sipil'],
        weight: 1
      },
      'kesehatan': {
        keywords: ['kesehatan', 'health', 'medis', 'kedokteran', 'dokter', 'obat', 'rumah sakit', 'klinik', 'pengobatan', 'farmasi', 'penyakit'],
        weight: 1
      },
      'pertanian': {
        keywords: ['pertanian', 'agriculture', 'petani', 'tanaman', 'padi', 'sawah', 'perkebunan', 'hortikultura', 'ternak', 'peternakan'],
        weight: 1
      },
      'filsafat': {
        keywords: ['filsafat', 'philosophy', 'pemikiran', 'etika', 'moral', 'logika', 'metafisika', 'epistemologi', 'filosofi', 'pemikir'],
        weight: 1
      },
      'sosiologi': {
        keywords: ['sosiologi', 'sociology', 'masyarakat', 'sosial', 'komunitas', 'kelompok', 'organisasi', 'interaksi', 'struktur sosial'],
        weight: 1
      },
      'antropologi': {
        keywords: ['antropologi', 'anthropology', 'manusia', 'etnis', 'suku', 'etnografi', 'kebudayaan', 'tradisi', 'adat istiadat'],
        weight: 1
      },
      'psikologi': {
        keywords: ['psikologi', 'psychology', 'kejiwaan', 'mental', 'psikis', 'perilaku', 'kepribadian', 'emosi', 'kognitif', 'terapi'],
        weight: 1
      },
      'seni': {
        keywords: ['seni', 'art', 'lukisan', 'patung', 'fotografi', 'desain', 'kriya', 'kerajinan', 'estetika', 'visual', 'rupa'],
        weight: 1
      },
      'musik': {
        keywords: ['musik', 'music', 'lagu', 'nada', 'instrumen', 'orkestra', 'komposer', 'tembang', 'melodi', 'irama', 'harmoni'],
        weight: 1
      },
      'geografi': {
        keywords: ['geografi', 'geography', 'bumi', 'peta', 'wilayah', 'daerah', 'lingkungan', 'alam', 'fisik', 'manusia', 'spasial'],
        weight: 1
      }
    };

    const topicScores = {};
    
    // Initialize scores
    Object.keys(topicMapping).forEach(topic => {
      topicScores[topic] = 0;
    });

    // Score each topic berdasarkan keyword matches
    Object.entries(topicMapping).forEach(([topic, data]) => {
      data.keywords.forEach(keyword => {
        if (judulLower.includes(keyword)) {
          topicScores[topic] += data.weight;
          
          // Bonus untuk exact matches
          if (judulLower === keyword || judulLower.startsWith(keyword + ' ') || judulLower.endsWith(' ' + keyword)) {
            topicScores[topic] += 2;
          }
        }
      });
    });

    // Filter topics dengan score di atas threshold
    const threshold = 1;
    const detectedTopics = Object.entries(topicScores)
      .filter(([topic, score]) => score >= threshold)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([topic]) => topic);

    // Fallback detection berdasarkan konteks
    if (detectedTopics.length === 0) {
      if (judulLower.match(/(jawa|sumatra|kalimantan|sulawesi|papua|bali|nusantara|indonesia)/)) {
        detectedTopics.push('budaya', 'sejarah');
      } else if (judulLower.match(/(pemerintah|negara|politik|demokrasi|kekuasaan)/)) {
        detectedTopics.push('politik');
      } else if (judulLower.match(/(ekonomi|keuangan|bisnis|perdagangan|pasar)/)) {
        detectedTopics.push('ekonomi');
      } else if (judulLower.match(/(pendidikan|sekolah|guru|belajar|mengajar)/)) {
        detectedTopics.push('pendidikan');
      } else if (judulLower.match(/(kesehatan|medis|dokter|obat|rumah sakit)/)) {
        detectedTopics.push('kesehatan');
      } else {
        detectedTopics.push('sastra');
      }
    }

    console.log(`Topic detection for "${judul}":`, { detectedTopics, scores: topicScores });

    return detectedTopics.slice(0, 3); // Max 3 topics

  } catch (error) {
    console.error('Error in extractTopicsFromTitle:', error);
    return ['sastra']; // Safe fallback
  }
};

// Get historical era dengan penjelasan yang lebih baik
export const getHistoricalEra = (year) => {
  if (!year) return 'tidak diketahui';
  
  if (year < 1800) return 'pra-kolonial';
  if (year <= 1945) return 'kolonial';
  if (year <= 1965) return 'kemerdekaan awal';
  if (year <= 1998) return 'orde baru';
  return 'reformasi';
};

// Detect book characteristics dengan comprehensive analysis
export const detectBookCharacteristics = (book) => {
  try {
    if (!book || !book.judul) {
      throw new Error('Invalid book data');
    }

    const year = extractYearFromString(book.tahun_terbit);
    
    // Gunakan specialized title detection first, fallback ke general
    const language = detectLanguageFromTitle(book.judul);
    const topics = extractTopicsFromTitle(book.judul);
    const era = getHistoricalEra(year);
    
    // Pastikan topics selalu ada minimal 1
    const safeTopics = topics && topics.length > 0 ? topics : ['sastra'];
    
    // Language label mapping
    const getLanguageLabel = (lang) => {
      const labels = {
        'id': 'Indonesia',
        'en': 'English', 
        'nl': 'Belanda',
        'jv': 'Jawa',
        'ar': 'Arab'
      };
      return labels[lang] || 'Indonesia';
    };

    const characteristics = {
      year,
      language,
      languageLabel: getLanguageLabel(language),
      topics: safeTopics,
      era,
      isAncient: year < 1800,
      isColonial: year >= 1800 && year <= 1945,
      isPostIndependence: year > 1945,
      hasAuthor: book.pengarang && book.pengarang !== 'Tidak diketahui' && book.pengarang.trim().length > 0,
      isDutch: language === 'nl',
      isJavanese: language === 'jv',
      isEnglish: language === 'en',
      isIndonesian: language === 'id',
      isArabic: language === 'ar',
      hasPublisher: book.penerbit && book.penerbit !== 'Tidak diketahui' && book.penerbit.trim().length > 0,
      topicCount: safeTopics.length,
      hasYear: year !== null,
      isModern: year > 1950,
      isRare: year < 1900
    };

    console.log('Book characteristics detected:', characteristics);
    return characteristics;

  } catch (error) {
    console.error('Error detecting book characteristics:', error, book);
    
    // Return comprehensive safe fallback
    return {
      year: null,
      language: 'id',
      languageLabel: 'Indonesia',
      topics: ['sastra'],
      era: 'tidak diketahui',
      isAncient: false,
      isColonial: false,
      isPostIndependence: false,
      hasAuthor: false,
      isDutch: false,
      isJavanese: false,
      isEnglish: false,
      isIndonesian: true,
      isArabic: false,
      hasPublisher: false,
      topicCount: 1,
      hasYear: false,
      isModern: false,
      isRare: false
    };
  }
};

// Enhanced confidence scoring system
export const calculateConfidence = (chars) => {
  try {
    let score = 0.3; // base confidence
    
    // Year contributes significantly
    if (chars.hasYear) score += 0.25;
    
    // Author information
    if (chars.hasAuthor) score += 0.15;
    
    // Topic analysis
    if (chars.topicCount > 0) score += (chars.topicCount * 0.08);
    if (chars.topicCount >= 2) score += 0.1; // bonus for multiple topics
    
    // Language detection
    if (chars.language !== 'id') score += 0.05; // bonus for non-Indonesian detection
    if (chars.language !== 'unknown') score += 0.05;
    
    // Publisher information
    if (chars.hasPublisher) score += 0.05;
    
    // Era and historical context
    if (chars.era !== 'tidak diketahui') score += 0.07;
    
    // Special bonuses
    if (chars.isRare) score += 0.05; // rare books often have better metadata
    if (chars.isModern) score += 0.03; // modern books have more complete data
    
    return Math.min(score, 0.95); // Cap at 95% untuk rule-based system

  } catch (error) {
    console.error('Error calculating confidence:', error);
    return 0.5; // Safe fallback
  }
};

// COMPREHENSIVE TEMPLATE SYSTEM

const ancientManuscriptTemplate = (book, chars, topics) => {
  const eraDesc = chars.year ? `abad ke-${Math.floor(chars.year/100)}` : 'masa lampau';
  const topicDesc = topics.join(' dan ');
  const materialContext = chars.isJavanese ? 'Biasanya ditulis pada lontar atau daluang' : 'Ditulis pada bahan tradisional';
  
  const templates = [
    `Naskah kuno dari ${eraDesc} yang membahas ${topicDesc}. ${materialContext}, merupakan khazanah manuskrip Nusantara koleksi Perpustakaan Nasional yang memberikan wawasan tentang warisan intelektual masa lampau.`,
    `Manuskrip langka era ${chars.era} tentang ${topicDesc}. Koleksi penting untuk studi filologi dan sejarah Nusantara ini merepresentasikan tradisi tulis masyarakat Indonesia sebelum pengaruh modern.`,
    `Naskah tradisional yang mengupas ${topicDesc}. Ditulis pada periode ${chars.era}, karya ini merepresentasikan warisan intelektual Nusantara yang perlu dilestarikan dan dipelajari untuk memahami akar budaya Indonesia.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const dutchColonialTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis era kolonial';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  const historicalContext = chars.year < 1900 ? 'era VOC dan pemerintahan Hindia Belanda' : 'masa politik etis dan kebangkitan nasional';
  
  const templates = [
    `Literatur kolonial Belanda ${authorPart} tentang ${topicDesc}. Terbit tahun ${chars.year}${publisherPart}, memberikan perspektif historis ${historicalContext} dan dokumentasi sosial-budaya Nusantara dari sudut pandang kolonial.`,
    `Buku berbahasa Belanda dari era kolonial yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}, merekam kondisi sosial-budaya Nusantara sekaligus merefleksikan pandangan dan kebijakan pemerintah kolonial pada masa itu.`,
    `Karya akademik era Hindia Belanda tentang ${topicDesc}. Ditulis dalam bahasa Belanda${publisherPart}, dokumentasi penting periode kolonial yang memberikan insight tentang administrasi, kebijakan, dan pandangan dunia kolonial terhadap masyarakat Nusantara.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const englishAcademicTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `by ${book.pengarang}` : 'academic work';
  const publisherPart = chars.hasPublisher ? `, published by ${book.penerbit}` : '';
  const topicDesc = topics.join(' and ');
  const academicContext = chars.isModern ? 'contemporary scholarly discourse' : 'historical academic research';
  
  const templates = [
    `English academic work on ${topicDesc}. ${authorPart}${publisherPart}, published in ${chars.year}. Important contribution to ${chars.era} scholarship, providing international perspective on Indonesian studies within ${academicContext}.`,
    `Scholarly publication in English focusing on ${topicDesc}. ${authorPart}${publisherPart}, represents ${chars.era} academic research methodology and contributes to global understanding of the subject through rigorous analysis and documentation.`,
    `Academic literature in English about ${topicDesc}. ${authorPart}${publisherPart}, significant work in its field of study that bridges local knowledge with international academic discourse, offering comparative insights and theoretical frameworks.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const colonialEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : '';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  const nationalContext = chars.year > 1920 ? 'semangat kebangkitan nasional' : 'masa awal pergerakan Indonesia';
  
  const templates = [
    `Buku dari era kolonial tentang ${topicDesc}. ${authorPart} terbit tahun ${chars.year}${publisherPart}, mencerminkan dinamika intelektual masa penjajahan dan perkembangan pemikiran Nusantara dalam konteks ${nationalContext}.`,
    `Literatur periode kolonial yang membahas ${topicDesc}. ${authorPart}${publisherPart}, merupakan dokumen penting untuk studi sejarah Indonesia dan transformasi sosial masyarakat menuju kemerdekaan.`,
    `Karya ${chars.era} tentang ${topicDesc}. ${authorPart}${publisherPart}, memberikan insight tentang perkembangan pemikiran Nusantara sebelum kemerdekaan dan respons intelektual terhadap sistem kolonial.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const modernEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis Indonesia';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  const developmentContext = chars.isModern ? 'tantangan kontemporer dan globalisasi' : 'pembangunan nasional pasca kemerdekaan';
  
  const templates = [
    `Buku ${chars.era} tentang ${topicDesc}. ${authorPart}, terbit tahun ${chars.year}${publisherPart}. Kontribusi penting untuk perkembangan ilmu pengetahuan Indonesia dan refleksi dinamika masyarakat menghadapi ${developmentContext}.`,
    `Literatur modern Indonesia yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}, representasi perkembangan studi keindonesiaan dan respons terhadap transformasi sosial, politik, dan budaya dalam konteks nation-building.`,
    `Karya akademik ${chars.era} tentang ${topicDesc}. ${authorPart}${publisherPart}, perkembangan pemikiran Indonesia pasca kemerdekaan yang menunjukkan maturitas intelektual bangsa dalam membangun tradisi keilmuan yang mandiri dan relevan.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const defaultTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `Karya ${book.pengarang}. ` : '';
  const yearPart = chars.year ? `Terbit tahun ${chars.year}. ` : '';
  const publisherPart = chars.hasPublisher ? `Diterbitkan oleh ${book.penerbit}. ` : '';
  const topicDesc = topics.join(' dan ');
  const collectionContext = chars.isRare ? 'koleksi langka' : 'koleksi penting';
  
  return `Buku tentang ${topicDesc}. ${authorPart}${yearPart}${publisherPart}${collectionContext} Perpustakaan Nasional RI yang merepresentasikan khazanah literatur Indonesia dan kontribusinya dalam perkembangan ilmu pengetahuan nasional.`;
};

// Main template generator dengan comprehensive error handling
export const generateRuleBasedDescription = (book) => {
  try {
    console.log('📖 Starting description generation for:', book?.judul);
    
    if (!book || !book.judul) {
      throw new Error('Invalid book data: missing title');
    }

    const chars = detectBookCharacteristics(book);
    console.log('📊 Characteristics analyzed:', chars);
    
    // Format topics berdasarkan bahasa
    let topicsFormatted;
    if (chars.isEnglish) {
      topicsFormatted = chars.topics.join(' and ');
    } else {
      topicsFormatted = chars.topics.join(' dan ');
    }
    
    // Template selection logic dengan priority
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
    
    const confidence = calculateConfidence(chars);
    
    const result = {
      description: template,
      confidence: confidence,
      source: 'rule-based',
      characteristics: chars,
      timestamp: new Date().toISOString(),
      wordCount: template.split(' ').length
    };
    
    console.log('✅ Description generated successfully:', {
      title: book.judul,
      confidence: confidence,
      language: chars.languageLabel,
      topics: chars.topics,
      era: chars.era
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Critical error in generateRuleBasedDescription:', error);
    
    // Comprehensive fallback dengan analisis yang masih meaningful
    const fallbackCharacteristics = {
      year: null,
      language: 'id',
      languageLabel: 'Indonesia',
      topics: ['sastra'],
      era: 'tidak diketahui',
      topicCount: 1,
      hasAuthor: false,
      hasPublisher: false,
      hasYear: false
    };
    
    return {
      description: `Buku ini merupakan bagian dari koleksi Perpustakaan Nasional RI yang merepresentasikan khazanah literatur Indonesia. Karya ini memberikan kontribusi penting dalam perkembangan ilmu pengetahuan dan kebudayaan nasional, serta menjadi saksi perkembangan intelektual bangsa.`,
      confidence: 0.3,
      source: 'rule-based-fallback',
      characteristics: fallbackCharacteristics,
      timestamp: new Date().toISOString(),
      wordCount: 28,
      error: error.message
    };
  }
};

// Utility function untuk debug
export const debugBookAnalysis = (book) => {
  const characteristics = detectBookCharacteristics(book);
  const confidence = calculateConfidence(characteristics);
  
  return {
    book: {
      judul: book.judul,
      pengarang: book.pengarang,
      tahun_terbit: book.tahun_terbit,
      penerbit: book.penerbit
    },
    characteristics,
    confidence,
    extractedYear: extractYearFromString(book.tahun_terbit),
    detectedLanguage: detectLanguageFromTitle(book.judul),
    detectedTopics: extractTopicsFromTitle(book.judul)
  };
};
