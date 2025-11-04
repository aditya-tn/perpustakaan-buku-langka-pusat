// utils/ruleBasedDescriptions.js

// Helper function untuk extract tahun (sudah ada di index.js, kita duplicate di sini)
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

// Enhanced language detection untuk buku langka
export const detectLanguage = (text) => {
  if (!text) return 'unknown';
  
  const textLower = text.toLowerCase();
  
  // Indonesian words
  const idWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu', 'tidak', 'akan', 'ada', 'atau'];
  // Dutch words common in old book titles
  const nlWords = ['de', 'het', 'en', 'van', 'tot', 'voor', 'met', 'zijn', 'een', 'als', 'door', 'over', 'onder', 'tussen'];
  // Javanese words
  const jvWords = ['jawa', 'kawi', 'serat', 'babad', 'kraton', 'sastra', 'tembang'];
  // Arabic words common in religious texts
  const arWords = ['islam', 'quran', 'hadis', 'fiqh', 'tauhid', 'sharia', 'sufi'];
  
  const idCount = idWords.filter(word => textLower.includes(word)).length;
  const nlCount = nlWords.filter(word => textLower.includes(word)).length;
  const jvCount = jvWords.filter(word => textLower.includes(word)).length;
  const arCount = arWords.filter(word => textLower.includes(word)).length;
  
  const scores = [
    { lang: 'id', count: idCount },
    { lang: 'nl', count: nlCount },
    { lang: 'jv', count: jvCount },
    { lang: 'ar', count: arCount }
  ];
  
  const maxScore = scores.reduce((max, curr) => curr.count > max.count ? curr : max, { lang: 'unknown', count: 0 });
  
  return maxScore.count > 1 ? maxScore.lang : 'unknown';
};

// Extract topics from title
export const extractTopicsFromTitle = (judul) => {
  if (!judul) return ['umum'];
  
  const judulLower = judul.toLowerCase();
  const topicKeywords = {
    'sejarah': ['sejarah', 'history', 'geschiedenis', 'tawarikh', 'historic'],
    'hukum': ['hukum', 'law', 'recht', 'undang-undang', 'legislation'],
    'budaya': ['budaya', 'culture', 'cultuur', 'adat', 'tradisi', 'traditions'],
    'agama': ['islam', 'kristen', 'hindu', 'buddha', 'religion', 'agama', 'kristen', 'christian'],
    'bahasa': ['bahasa', 'language', 'taal', 'kamus', 'grammar', 'linguistics'],
    'medis': ['obat', 'medis', 'health', 'geneeskunde', 'kesehatan', 'medical'],
    'pendidikan': ['pendidikan', 'education', 'onderwijs', 'sekolah', 'school'],
    'pertanian': ['pertanian', 'agriculture', 'landbouw', 'cocok tanam', 'farm'],
    'sastra': ['sastra', 'literature', 'puisi', 'poetry', 'novel', 'cerita'],
    'politik': ['politik', 'policy', 'government', 'pemerintah', 'state']
  };

  const foundTopics = [];
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => judulLower.includes(keyword))) {
      foundTopics.push(topic);
    }
  });

  return foundTopics.length > 0 ? foundTopics : ['umum'];
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
    hasPublisher: book.penerbit && book.penerbit !== 'Tidak diketahui'
  };
};

// Confidence scoring
export const calculateConfidence = (chars) => {
  let score = 0.5; // base confidence
  
  if (chars.year) score += 0.2;
  if (chars.hasAuthor) score += 0.15;
  if (chars.topics.length > 0) score += 0.1;
  if (chars.language !== 'unknown') score += 0.05;
  if (chars.hasPublisher) score += 0.05;
  
  return Math.min(score, 1.0);
};

// Template definitions
const ancientManuscriptTemplate = (book, chars, topics) => {
  const templates = [
    `Naskah kuno dari abad ke-${Math.floor(chars.year/100)} yang membahas ${topics}. Merupakan bagian dari khazanah manuskrip Nusantara koleksi Perpustakaan Nasional.`,
    `Manuskrip langka era ${chars.era} tentang ${topics}. Koleksi penting untuk studi filologi dan sejarah Nusantara.`,
    `Naskah tradisional yang mengupas ${topics}. Ditulis pada periode ${chars.era}, merepresentasikan warisan intelektual Nusantara.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const dutchColonialTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis era kolonial';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  
  const templates = [
    `Literatur kolonial Belanda ${authorPart} tentang ${topics}. Terbit tahun ${chars.year}${publisherPart}, memberikan perspektif historis masa penjajahan.`,
    `Buku berbahasa Belanda dari era kolonial yang mengkaji ${topics}. ${authorPart}${publisherPart}, merekam kondisi sosial-budaya Nusantara.`,
    `Karya akademik era Hindia Belanda tentang ${topics}. Ditulis dalam bahasa Belanda${publisherPart}, dokumentasi penting periode kolonial.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const colonialEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : '';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  
  const templates = [
    `Buku dari era kolonial tentang ${topics}. ${authorPart} terbit tahun ${chars.year}${publisherPart}, mencerminkan dinamika intelektual masa penjajahan.`,
    `Literatur periode kolonial yang membahas ${topics}. ${authorPart}${publisherPart}, merupakan dokumen penting untuk studi sejarah Indonesia.`,
    `Karya ${chars.era} tentang ${topics}. ${authorPart}${publisherPart}, memberikan insight tentang perkembangan pemikiran Nusantara sebelum kemerdekaan.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const modernEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis Indonesia';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  
  const templates = [
    `Buku ${chars.era} tentang ${topics}. ${authorPart}, terbit tahun ${chars.year}${publisherPart}. Kontribusi penting untuk perkembangan ilmu pengetahuan Indonesia.`,
    `Literatur modern Indonesia yang mengkaji ${topics}. ${authorPart}${publisherPart}, representasi perkembangan studi keindonesiaan.`,
    `Karya akademik ${chars.era} tentang ${topics}. ${authorPart}${publisherPart}, perkembangan pemikiran Indonesia pasca kemerdekaan.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const defaultTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `Karya ${book.pengarang}. ` : '';
  const yearPart = chars.year ? `Terbit tahun ${chars.year}. ` : '';
  const publisherPart = chars.hasPublisher ? `Diterbitkan oleh ${book.penerbit}. ` : '';
  
  return `Buku tentang ${topics}. ${authorPart}${yearPart}${publisherPart}Koleksi Perpustakaan Nasional RI.`;
};

// Main template generator
export const generateRuleBasedDescription = (book) => {
  const chars = detectBookCharacteristics(book);
  const topics = chars.topics.join(' dan ');
  
  // Template selection logic
  let template;
  
  if (chars.isAncient) {
    template = ancientManuscriptTemplate(book, chars, topics);
  } else if (chars.isDutch) {
    template = dutchColonialTemplate(book, chars, topics);
  } else if (chars.isColonial) {
    template = colonialEraTemplate(book, chars, topics);
  } else if (chars.isPostIndependence) {
    template = modernEraTemplate(book, chars, topics);
  } else {
    template = defaultTemplate(book, chars, topics);
  }
  
  return {
    description: template,
    confidence: calculateConfidence(chars),
    source: 'rule-based',
    characteristics: chars
  };
};
