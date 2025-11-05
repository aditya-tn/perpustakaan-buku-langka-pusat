// utils/ruleBasedDescriptions.js - MAIN FILE
import { detectLanguage, detectLanguageFromTitle } from './languageDetection';
import { extractTopicsFromTitle } from './topicDetection';

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
    
    return null;
  } catch (error) {
    console.error('Error extracting year:', error);
    return null;
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

// Detect book characteristics
export const detectBookCharacteristics = (book) => {
  try {
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
  } catch (error) {
    console.error('Error detecting book characteristics:', error, book);
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

// Confidence scoring - ENHANCED
export const calculateConfidence = (chars) => {
  try {
    let score = 0.5; // base confidence
    
    if (chars.year) score += 0.2;
    if (chars.hasAuthor) score += 0.15;
    if (chars.topicCount > 0) score += (chars.topicCount * 0.08);
    if (chars.language !== 'unknown') score += 0.05;
    if (chars.hasPublisher) score += 0.05;
    if (chars.topicCount >= 2) score += 0.1;
    
    return Math.min(score, 1.0);
  } catch (error) {
    console.error('Error calculating confidence:', error);
    return 0.5;
  }
};

// ENHANCED TEMPLATE SYSTEM
const ancientManuscriptTemplate = (book, chars, topics) => {
  const eraDesc = chars.year ? `abad ke-${Math.floor(chars.year/100)}` : 'masa lalu';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Naskah kuno dari ${eraDesc} yang membahas ${topicDesc}. Merupakan bagian dari khazanah manuskrip Nusantara koleksi Perpustakaan Nasional, memberikan wawasan tentang warisan intelektual masa lampau.`,
    `Manuskrip langka era ${chars.era} tentang ${topicDesc}. Koleksi penting untuk studi filologi dan sejarah Nusantara, merepresentasikan tradisi tulis masyarakat Indonesia.`,
    `Naskah tradisional yang mengupas ${topicDesc}. Ditulis pada periode ${chars.era}, karya ini merepresentasikan warisan intelektual Nusantara yang perlu dilestarikan.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const dutchColonialTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis era kolonial';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Literatur kolonial Belanda ${authorPart} tentang ${topicDesc}. Terbit tahun ${chars.year}${publisherPart}, memberikan perspektif historis masa penjajahan dan dokumentasi sosial-budaya Nusantara.`,
    `Buku berbahasa Belanda dari era kolonial yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}, merekam kondisi sosial-budaya Nusantara sekaligus merefleksikan pandangan kolonial.`,
    `Karya akademik era Hindia Belanda tentang ${topicDesc}. Ditulis dalam bahasa Belanda${publisherPart}, dokumentasi penting periode kolonial yang memberikan insight tentang administrasi dan kebijakan pemerintah kolonial.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const englishAcademicTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `by ${book.pengarang}` : 'academic work';
  const publisherPart = chars.hasPublisher ? `, published by ${book.penerbit}` : '';
  const topicDesc = topics.join(' and ');
  
  const templates = [
    `English academic work on ${topicDesc}. ${authorPart}${publisherPart}, published in ${chars.year}. Important contribution to ${chars.era} scholarship, providing international perspective on Indonesian studies.`,
    `Scholarly publication in English focusing on ${topicDesc}. ${authorPart}${publisherPart}, represents ${chars.era} academic research methodology and contributes to global understanding of the subject.`,
    `Academic literature in English about ${topicDesc}. ${authorPart}${publisherPart}, significant work in its field of study that bridges local knowledge with international academic discourse.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const colonialEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : '';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Buku dari era kolonial tentang ${topicDesc}. ${authorPart} terbit tahun ${chars.year}${publisherPart}, mencerminkan dinamika intelektual masa penjajahan dan perkembangan pemikiran Nusantara.`,
    `Literatur periode kolonial yang membahas ${topicDesc}. ${authorPart}${publisherPart}, merupakan dokumen penting untuk studi sejarah Indonesia dan transformasi sosial masyarakat.`,
    `Karya ${chars.era} tentang ${topicDesc}. ${authorPart}${publisherPart}, memberikan insight tentang perkembangan pemikiran Nusantara sebelum kemerdekaan dalam konteks pergerakan nasional.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const modernEraTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis Indonesia';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const topicDesc = topics.join(' dan ');
  
  const templates = [
    `Buku ${chars.era} tentang ${topicDesc}. ${authorPart}, terbit tahun ${chars.year}${publisherPart}. Kontribusi penting untuk perkembangan ilmu pengetahuan Indonesia dan refleksi dinamika masyarakat kontemporer.`,
    `Literatur modern Indonesia yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}, representasi perkembangan studi keindonesiaan dan respons terhadap tantangan zaman.`,
    `Karya akademik ${chars.era} tentang ${topicDesc}. ${authorPart}${publisherPart}, perkembangan pemikiran Indonesia pasca kemerdekaan yang menunjukkan maturitas intelektual bangsa.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const defaultTemplate = (book, chars, topics) => {
  const authorPart = chars.hasAuthor ? `Karya ${book.pengarang}. ` : '';
  const yearPart = chars.year ? `Terbit tahun ${chars.year}. ` : '';
  const publisherPart = chars.hasPublisher ? `Diterbitkan oleh ${book.penerbit}. ` : '';
  const topicDesc = topics.join(' dan ');
  
  return `Buku tentang ${topicDesc}. ${authorPart}${yearPart}${publisherPart}Koleksi Perpustakaan Nasional RI yang merepresentasikan khazanah literatur Indonesia.`;
};

// Main template generator
export const generateRuleBasedDescription = (book) => {
  try {
    console.log('📖 Processing book:', book?.judul);
    
    if (!book || !book.judul) {
      throw new Error('Invalid book data');
    }
    
    const chars = detectBookCharacteristics(book);
    console.log('📊 Book characteristics:', chars);
    
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
    
    // Return safe fallback dengan analisis mendalam
    return {
      description: `Buku ini merupakan bagian dari koleksi Perpustakaan Nasional RI yang merepresentasikan khazanah literatur Indonesia. Karya ini memberikan kontribusi penting dalam perkembangan ilmu pengetahuan dan kebudayaan nasional.`,
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
