// utils/ruleBasedDescriptions.js - FIXED VERSION
// Helper function untuk extract tahun
export const extractYearFromString = (yearStr) => {
  if (!yearStr) return null;
  
  try {
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
  } catch (error) {
    console.error('Error extracting year:', error);
    return null;
  }
};

// SIMPLIFIED Language Detection - FIXED
export const detectLanguage = (text) => {
  if (!text) return 'unknown';
  
  try {
    const textLower = text.toLowerCase();
    
    // Simple pattern matching dulu
    if (textLower.match(/\b(the|and|of|to|a|in|is|it|you|that|he|was)\b/)) {
      return 'en';
    }
    if (textLower.match(/\b(yang|dan|di|ke|dari|untuk|pada|dengan|ini|itu)\b/)) {
      return 'id';
    }
    if (textLower.match(/\b(de|het|en|van|tot|voor|met|zijn|een)\b/)) {
      return 'nl';
    }
    if (textLower.match(/\b(serat|babad|jawa|kawi|sastra|tembang)\b/)) {
      return 'jv';
    }
    if (textLower.match(/\b(islam|quran|hadis|fiqh|tauhid|sharia|sufi)\b/)) {
      return 'ar';
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'unknown';
  }
};

// SIMPLIFIED Topic Detection - FIXED
export const extractTopicsFromTitle = (judul) => {
  if (!judul) return ['umum'];
  
  try {
    const judulLower = judul.toLowerCase();
    const topics = [];
    
    // Simple keyword matching
    const topicKeywords = {
      'sejarah': ['sejarah', 'history', 'geschiedenis', 'tawarikh'],
      'hukum': ['hukum', 'law', 'recht', 'undang-undang'],
      'budaya': ['budaya', 'culture', 'cultuur', 'adat'],
      'agama': ['islam', 'kristen', 'hindu', 'buddha', 'religion'],
      'bahasa': ['bahasa', 'language', 'taal', 'kamus'],
      'pendidikan': ['pendidikan', 'education', 'onderwijs'],
      'ekonomi': ['ekonomi', 'economy', 'economie'],
      'politik': ['politik', 'politics', 'politiek'],
      'sains': ['sains', 'science', 'wetenschap'],
      'kesehatan': ['kesehatan', 'health', 'gezondheid']
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => judulLower.includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics.length > 0 ? topics : ['umum'];
  } catch (error) {
    console.error('Error extracting topics:', error);
    return ['umum'];
  }
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

// Detect book characteristics - FIXED
export const detectBookCharacteristics = (book) => {
  try {
    const year = extractYearFromString(book.tahun_terbit);
    const language = detectLanguage(book.judul);
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
  } catch (error) {
    console.error('Error detecting book characteristics:', error);
    // Return safe default
    return {
      year: null,
      language: 'unknown',
      topics: ['umum'],
      era: 'tidak diketahui',
      isAncient: false,
      isColonial: false,
      isPostIndependence: false,
      hasAuthor: false,
      isDutch: false,
      isJavanese: false,
      isEnglish: false,
      isIndonesian: false,
      hasPublisher: false,
      topicCount: 1
    };
  }
};

// Confidence scoring - SIMPLIFIED
export const calculateConfidence = (chars) => {
  try {
    let score = 0.5;
    
    if (chars.year) score += 0.2;
    if (chars.hasAuthor) score += 0.15;
    if (chars.topicCount > 0) score += 0.1;
    if (chars.language !== 'unknown') score += 0.05;
    
    return Math.min(score, 1.0);
  } catch (error) {
    console.error('Error calculating confidence:', error);
    return 0.5;
  }
};

// SIMPLIFIED Templates - FIXED
const ancientManuscriptTemplate = (book, chars, topics) => {
  const templates = [
    `Naskah kuno dari ${chars.era} tentang ${topics.join(' dan ')}. Koleksi penting Perpustakaan Nasional.`,
    `Manuskrip langka era ${chars.era}. Membahas ${topics.join(' dan ')}. Warisan intelektual Nusantara.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const dutchColonialTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya era kolonial';
  const templates = [
    `Literatur kolonial Belanda ${authorPart} tentang ${topics.join(' dan ')}. Perspektif historis masa penjajahan.`,
    `Buku berbahasa Belanda dari era kolonial. ${authorPart}, membahas ${topics.join(' dan ')}.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const englishAcademicTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `by ${book.pengarang}` : 'academic work';
  const templates = [
    `English academic work on ${topics.join(' and ')}. ${authorPart}, published in ${chars.year}.`,
    `Scholarly publication in English. ${authorPart}, focuses on ${topics.join(' and ')}.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const colonialEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : '';
  const templates = [
    `Buku era kolonial tentang ${topics.join(' dan ')}. ${authorPart}, dokumen penting sejarah Indonesia.`,
    `Literatur periode kolonial. ${authorPart}, membahas ${topics.join(' dan ')}.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const modernEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis Indonesia';
  const templates = [
    `Buku ${chars.era} tentang ${topics.join(' dan ')}. ${authorPart}, kontribusi perkembangan ilmu pengetahuan.`,
    `Literatur modern Indonesia. ${authorPart}, mengkaji ${topics.join(' dan ')}.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const defaultTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `Karya ${book.pengarang}. ` : '';
  const yearPart = chars.year ? `Terbit tahun ${chars.year}. ` : '';
  return `Buku tentang ${topics.join(' dan ')}. ${authorPart}${yearPart}Koleksi Perpustakaan Nasional RI.`;
};

// Main template generator - FIXED dengan error handling
export const generateRuleBasedDescription = (book) => {
  try {
    console.log('📖 Processing book:', book.judul);
    
    const chars = detectBookCharacteristics(book);
    console.log('📊 Book characteristics:', chars);
    
    // Template selection
    let template;
    
    if (chars.isAncient) {
      template = ancientManuscriptTemplate(book, chars, chars.topics);
    } else if (chars.isDutch) {
      template = dutchColonialTemplate(book, chars, chars.topics);
    } else if (chars.isEnglish) {
      template = englishAcademicTemplate(book, chars, chars.topics);
    } else if (chars.isColonial) {
      template = colonialEraTemplate(book, chars, chars.topics);
    } else if (chars.isPostIndependence) {
      template = modernEraTemplate(book, chars, chars.topics);
    } else {
      template = defaultTemplate(book, chars, chars.topics);
    }
    
    const result = {
      description: template,
      confidence: calculateConfidence(chars),
      source: 'rule-based',
      characteristics: chars
    };
    
    console.log('✅ Final result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error in generateRuleBasedDescription:', error);
    
    // Return safe fallback
    return {
      description: `Buku tentang berbagai topik. Koleksi Perpustakaan Nasional RI.`,
      confidence: 0.3,
      source: 'rule-based-fallback',
      characteristics: {
        year: null,
        language: 'unknown',
        topics: ['umum'],
        era: 'tidak diketahui',
        topicCount: 1
      }
    };
  }
};
