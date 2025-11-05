// utils/ruleBasedDescriptions.js - BUG FIXED VERSION
import { detectLanguage, detectLanguageFromTitle } from './languageDetection';
import { extractTopicsFromTitle } from './topicDetection';

// Helper function untuk extract tahun dari berbagai format
export const extractYearFromString = (yearStr) => {
  if (!yearStr) return null;
  
  try {
    // Handle string input
    const str = yearStr.toString().trim();
    
    const exactYearMatch = str.match(/^(\d{4})$/);
    if (exactYearMatch) {
      const year = parseInt(exactYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
    const bracketYearMatch = str.match(/\[(\d{4})\]/);
    if (bracketYearMatch) {
      const year = parseInt(bracketYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
    const rangeYearMatch = str.match(/\[(\d{4})-\d{4}\]/);
    if (rangeYearMatch) {
      const year = parseInt(rangeYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
    const approxYearMatch = str.match(/(\d{4})/);
    if (approxYearMatch) {
      const year = parseInt(approxYearMatch[1]);
      return (year >= 1000 && year <= 2999) ? year : null;
    }
    
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

// Get historical era dengan deskripsi yang lebih detail
export const getHistoricalEra = (year) => {
  if (!year) return 'tidak diketahui';
  if (year < 1800) return 'pra-kolonial';
  if (year <= 1945) return 'kolonial';
  if (year <= 1965) return 'kemerdekaan awal';
  if (year <= 1998) return 'orde baru';
  return 'reformasi';
};

// Get detailed era description untuk template
export const getEraDescription = (year) => {
  if (!year) return 'periode tidak diketahui';
  if (year < 1800) return `era pra-kolonial (abad ke-${Math.floor(year/100)})`;
  if (year <= 1945) return `era kolonial Hindia Belanda`;
  if (year <= 1965) return `era kemerdekaan awal Indonesia`;
  if (year <= 1998) return `era Orde Baru`;
  return `era Reformasi`;
};

// ENHANCED TOPIC JOINING dengan natural language - OPSI 1
const safeJoinTopics = (topics, language = 'id') => {
  try {
    if (!topics) return language === 'en' ? 'general topics' : 'topik umum';
    
    // Handle non-array inputs
    if (!Array.isArray(topics)) {
      if (typeof topics === 'string') return topics;
      return language === 'en' ? 'general topics' : 'topik umum';
    }
    
    // Filter hanya string yang valid
    const safeTopics = topics.filter(topic => 
      typeof topic === 'string' && topic.trim().length > 0
    );
    
    if (safeTopics.length === 0) {
      return language === 'en' ? 'general topics' : 'topik umum';
    }
    
    // Remove duplicates
    const uniqueTopics = [...new Set(safeTopics)];
    
    // Natural language joining berdasarkan jumlah topics
    if (uniqueTopics.length === 1) {
      return uniqueTopics[0];
    }
    
    if (uniqueTopics.length === 2) {
      const separator = language === 'en' ? ' and ' : ' dan ';
      return uniqueTopics.join(separator);
    }
    
    // Untuk 3 atau lebih topics: "sejarah, hukum, dan budaya"
    if (language === 'en') {
      return uniqueTopics.slice(0, -1).join(', ') + ', and ' + uniqueTopics[uniqueTopics.length - 1];
    } else {
      return uniqueTopics.slice(0, -1).join(', ') + ', dan ' + uniqueTopics[uniqueTopics.length - 1];
    }
    
  } catch (error) {
    console.error('Error in safeJoinTopics:', error);
    return language === 'en' ? 'general topics' : 'topik umum';
  }
};

// Detect book characteristics dengan enhanced analysis
export const detectBookCharacteristics = (book) => {
  try {
    if (!book || !book.judul) {
      throw new Error('Book data atau judul tidak valid');
    }

    const year = extractYearFromString(book.tahun_terbit);
    
    // Gunakan specialized title detection first, fallback ke general
    const language = detectLanguageFromTitle(book.judul) !== 'unknown' 
      ? detectLanguageFromTitle(book.judul) 
      : detectLanguage(book.judul + ' ' + (book.pengarang || ''));
    
    const topics = extractTopicsFromTitle(book.judul);
    const era = getHistoricalEra(year);
    const eraDescription = getEraDescription(year);
    
    // SAFE TOPICS HANDLING - FIXED
    let safeTopics;
    try {
      if (!topics) {
        safeTopics = ['literatur'];
      } else if (!Array.isArray(topics)) {
        safeTopics = ['literatur'];
      } else {
        safeTopics = topics.length > 0 ? topics : ['literatur'];
      }
    } catch (error) {
      console.error('Error processing topics:', error);
      safeTopics = ['literatur'];
    }

    // Language label mapping
    const getLanguageLabel = (lang) => {
      const labels = {
        'id': 'Indonesia',
        'en': 'English', 
        'nl': 'Belanda',
        'jv': 'Jawa',
        'ar': 'Arab',
        'unknown': 'Tidak diketahui'
      };
      return labels[lang] || 'Indonesia';
    };

    const characteristics = {
      year,
      language,
      languageLabel: getLanguageLabel(language),
      topics: safeTopics,
      era,
      eraDescription,
      isAncient: year < 1800,
      isColonial: year >= 1800 && year <= 1945,
      isPostIndependence: year > 1945,
      hasAuthor: book.pengarang && book.pengarang !== 'Tidak diketahui' && book.pengarang !== '-',
      isDutch: language === 'nl',
      isJavanese: language === 'jv',
      isEnglish: language === 'en',
      isIndonesian: language === 'id',
      hasPublisher: book.penerbit && book.penerbit !== 'Tidak diketahui' && book.penerbit !== '-',
      topicCount: safeTopics.length,
      // Additional metadata
      hasYear: !!year,
      hasPhysicalDescription: !!book.deskripsi_fisik,
      hasOPACLink: !!(book.lihat_opac && book.lihat_opac !== 'null'),
      hasCollectionLink: !!(book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null')
    };

    console.log('📊 Detected characteristics:', characteristics);
    return characteristics;

  } catch (error) {
    console.error('Error detecting book characteristics:', error, book);
    
    // Safe fallback dengan default values
    return {
      year: null,
      language: 'id',
      languageLabel: 'Indonesia',
      topics: ['literatur'],
      era: 'tidak diketahui',
      eraDescription: 'periode tidak diketahui',
      isAncient: false,
      isColonial: false,
      isPostIndependence: false,
      hasAuthor: false,
      isDutch: false,
      isJavanese: false,
      isEnglish: false,
      isIndonesian: true,
      hasPublisher: false,
      topicCount: 1,
      hasYear: false,
      hasPhysicalDescription: false,
      hasOPACLink: false,
      hasCollectionLink: false
    };
  }
};

// Enhanced confidence scoring dengan lebih banyak factors
export const calculateConfidence = (chars) => {
  try {
    let score = 0.5; // base confidence
    
    // Year information
    if (chars.year) score += 0.2;
    
    // Author information
    if (chars.hasAuthor) score += 0.15;
    
    // Topic analysis
    if (chars.topicCount > 0) score += (chars.topicCount * 0.08);
    if (chars.topicCount >= 2) score += 0.1; // bonus untuk multiple topics
    
    // Language detection
    if (chars.language !== 'unknown') score += 0.05;
    
    // Publisher information
    if (chars.hasPublisher) score += 0.05;
    
    // Era classification
    if (chars.era !== 'tidak diketahui') score += 0.05;
    
    // Additional metadata
    if (chars.hasPhysicalDescription) score += 0.03;
    if (chars.hasOPACLink || chars.hasCollectionLink) score += 0.02;

    // Special bonus untuk buku dengan karakteristik jelas
    if (chars.isDutch && chars.isColonial) score += 0.1;
    if (chars.isAncient) score += 0.15;
    if (chars.isEnglish && chars.hasAuthor) score += 0.08;

    return Math.min(score, 1.0);

  } catch (error) {
    console.error('Error calculating confidence:', error);
    return 0.5;
  }
};

// ENHANCED TEMPLATE SYSTEM dengan SAFE TOPIC HANDLING
const ancientManuscriptTemplate = (book, chars, topicDesc) => {
  const eraDesc = chars.eraDescription;
  const physicalDesc = book.deskripsi_fisik ? ` ${book.deskripsi_fisik}.` : '';
  
  const templates = [
    `Naskah kuno dari ${eraDesc} yang membahas ${topicDesc}.${physicalDesc} Merupakan bagian dari khazanah manuskrip Nusantara koleksi Perpustakaan Nasional, memberikan wawasan mendalam tentang warisan intelektual dan tradisi tulis masyarakat Indonesia masa lampau.`,
    
    `Manuskrip langka ${eraDesc} tentang ${topicDesc}.${physicalDesc} Koleksi penting untuk studi filologi, sejarah, dan kebudayaan Nusantara ini merepresentasikan tradisi tulis masyarakat Indonesia dengan nilai historis dan kultural yang tinggi.`,
    
    `Naskah tradisional yang mengupas ${topicDesc}. Ditulis pada ${eraDesc}, karya ini${physicalDesc} merepresentasikan warisan intelektual Nusantara yang perlu dilestarikan sebagai bukti peradaban masyarakat Indonesia masa lalu.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const dutchColonialTemplate = (book, chars, topicDesc) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis era kolonial';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const yearInfo = chars.year ? ` pada tahun ${chars.year}` : '';
  
  const templates = [
    `Literatur kolonial Belanda ${authorPart} tentang ${topicDesc}. Terbit${yearInfo}${publisherPart}, memberikan perspektif historis masa penjajahan dan dokumentasi sosial-budaya Nusantara yang merekam dinamika masyarakat Indonesia di bawah administrasi kolonial.`,
    
    `Buku berbahasa Belanda dari era kolonial yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}, merekam kondisi sosial-budaya Nusantara sekaligus merefleksikan pandangan kolonial terhadap masyarakat dan kebudayaan lokal pada masa itu.`,
    
    `Karya akademik era Hindia Belanda tentang ${topicDesc}. Ditulis dalam bahasa Belanda oleh ${authorPart}${publisherPart}${yearInfo}, dokumentasi penting periode kolonial yang memberikan insight tentang administrasi, kebijakan pemerintah kolonial, dan kehidupan masyarakat Nusantara.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const englishAcademicTemplate = (book, chars, topicDesc) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya akademik';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const yearInfo = chars.year ? ` pada tahun ${chars.year}` : '';
  
  const templates = [
    `Karya akademik berbahasa Inggris tentang ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}. Kontribusi penting untuk studi ${chars.era} yang memberikan perspektif internasional tentang kajian Indonesia.`,
    
    `Publikasi ilmiah dalam bahasa Inggris yang fokus pada ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}, merepresentasikan metodologi penelitian akademik ${chars.era} dan berkontribusi pada pemahaman global tentang masyarakat dan budaya Indonesia.`,
    
    `Literatur akademik berbahasa Inggris mengenai ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}, karya signifikan dalam bidang studinya yang menunjukkan pendekatan penelitian yang rigor dan menambah wawasan berharga bagi pengetahuan internasional tentang Indonesia.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const colonialEraTemplate = (book, chars, topicDesc) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : '';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const yearInfo = chars.year ? ` pada tahun ${chars.year}` : '';
  
  const templates = [
    `Buku dari era kolonial tentang ${topicDesc}. ${authorPart} terbit${yearInfo}${publisherPart}, mencerminkan dinamika intelektual masa penjajahan dan perkembangan pemikiran Nusantara dalam konteks transformasi sosial dan politik yang terjadi.`,
    
    `Literatur periode kolonial yang membahas ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}, merupakan dokumen penting untuk studi sejarah Indonesia dan transformasi sosial masyarakat yang merekam jejak perubahan menuju kemerdekaan.`,
    
    `Karya ${chars.eraDescription} tentang ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}, memberikan insight tentang perkembangan pemikiran Nusantara sebelum kemerdekaan dalam konteks pergerakan nasional dan pembentukan identitas kebangsaan.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const modernEraTemplate = (book, chars, topicDesc) => {
  const authorPart = chars.hasAuthor ? `karya ${book.pengarang}` : 'karya penulis Indonesia';
  const publisherPart = chars.hasPublisher ? `, terbitan ${book.penerbit}` : '';
  const yearInfo = chars.year ? ` pada tahun ${chars.year}` : '';
  
  const templates = [
    `Buku ${chars.eraDescription} tentang ${topicDesc}. ${authorPart}, terbit${yearInfo}${publisherPart}. Kontribusi penting untuk perkembangan ilmu pengetahuan Indonesia dan refleksi dinamika masyarakat kontemporer yang menangkap semangat zaman.`,
    
    `Literatur modern Indonesia yang mengkaji ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}, representasi perkembangan studi keindonesiaan dan respons terhadap tantangan zaman, menunjukkan kedewasaan berpikir bangsa Indonesia.`,
    
    `Karya akademik ${chars.eraDescription} tentang ${topicDesc}. ${authorPart}${publisherPart}${yearInfo}, perkembangan pemikiran Indonesia pasca kemerdekaan yang menunjukkan maturitas intelektual bangsa dalam menjawab persoalan kebangsaan dan global.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const defaultTemplate = (book, chars, topicDesc) => {
  const authorPart = chars.hasAuthor ? `Karya ${book.pengarang}. ` : '';
  const yearPart = chars.year ? `Terbit tahun ${chars.year}. ` : '';
  const publisherPart = chars.hasPublisher ? `Diterbitkan oleh ${book.penerbit}. ` : '';
  const physicalDesc = book.deskripsi_fisik ? ` ${book.deskripsi_fisik}.` : '';
  
  return `Buku tentang ${topicDesc}.${physicalDesc} ${authorPart}${yearPart}${publisherPart}Koleksi Perpustakaan Nasional RI yang merepresentasikan khazanah literatur Indonesia dan kontribusi terhadap perkembangan ilmu pengetahuan nasional.`;
};

// Main template generator dengan enhanced logic dan IMPROVED TOPIC JOINING
export const generateRuleBasedDescription = (book) => {
  try {
    console.log('📖 Processing book:', book?.judul);
    
    if (!book || !book.judul) {
      throw new Error('Data buku tidak valid - judul tidak tersedia');
    }

    const chars = detectBookCharacteristics(book);
    console.log('📊 Book characteristics detected:', chars);
    
    // IMPROVED TOPIC FORMATTING - OPSI 1
    const topicDesc = safeJoinTopics(chars.topics, chars.language);
    console.log('🎯 Formatted topic description:', topicDesc);
    
    // Template selection logic dengan priority
    let template;
    
    if (chars.isAncient) {
      template = ancientManuscriptTemplate(book, chars, topicDesc);
    } else if (chars.isDutch) {
      template = dutchColonialTemplate(book, chars, topicDesc);
    } else if (chars.isEnglish) {
      template = englishAcademicTemplate(book, chars, topicDesc);
    } else if (chars.isColonial) {
      template = colonialEraTemplate(book, chars, topicDesc);
    } else if (chars.isPostIndependence) {
      template = modernEraTemplate(book, chars, topicDesc);
    } else {
      template = defaultTemplate(book, chars, topicDesc);
    }
    
    const result = {
      description: template,
      confidence: calculateConfidence(chars),
      source: 'enhanced-rule-based',
      characteristics: chars,
      metadata: {
        processedAt: new Date().toISOString(),
        wordCount: template.split(' ').length,
        hasDetailedAnalysis: chars.topicCount > 1 || chars.hasAuthor
      }
    };
    
    console.log('✅ Description generated successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error in generateRuleBasedDescription:', error);
    
    // Enhanced fallback dengan analisis dasar
    const safeChars = {
      year: null,
      language: 'id',
      languageLabel: 'Indonesia',
      topics: ['literatur'],
      era: 'tidak diketahui',
      eraDescription: 'periode tidak diketahui',
      topicCount: 1
    };
    
    return {
      description: `Buku ini merupakan bagian dari koleksi Perpustakaan Nasional RI yang merepresentasikan khazanah literatur Indonesia. Karya ini memberikan kontribusi penting dalam perkembangan ilmu pengetahuan dan kebudayaan nasional, serta menjadi saksi sejarah perjalanan intelektual bangsa.`,
      confidence: 0.3,
      source: 'rule-based-fallback',
      characteristics: safeChars,
      metadata: {
        processedAt: new Date().toISOString(),
        wordCount: 0,
        hasDetailedAnalysis: false,
        error: error.message
      }
    };
  }
};

// Utility function untuk batch processing
export const generateDescriptionsForBooks = (books) => {
  return books.map(book => ({
    ...book,
    aiDescription: generateRuleBasedDescription(book)
  }));
};

// Export untuk testing
export const __test__ = {
  extractYearFromString,
  getHistoricalEra,
  detectBookCharacteristics,
  calculateConfidence,
  safeJoinTopics
};
