// utils/languageDetection.js

// Enhanced language detection dengan vocabulary yang comprehensive
export const detectLanguage = (text) => {
  if (!text) return 'unknown';
  
  try {
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
        'ber', 'ter', 'me', 'pe', 'di', 'ke', 'se', 'nya', 'kah', 'lah', 'pun'
      ],
      'en': [
        // Common English words
        'the', 'and', 'of', 'to', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was',
        'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have',
        'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we',
        'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which', 'she', 'do',
        'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them',
        'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has'
      ],
      'nl': [
        // Dutch words common in old book titles
        'de', 'het', 'en', 'van', 'tot', 'voor', 'met', 'zijn', 'een', 'als', 'door',
        'over', 'onder', 'tussen', 'door', 'om', 'te', 'bij', 'naar', 'uit', 'zo', 'er',
        'maar', 'ook', 'dan', 'of', 'want', 'dus', 'toch', 'al', 'op', 'aan', 'in', 'dat',
        'die', 'dit', 'deze', 'die', 'wat', 'wie', 'waar', 'hoe', 'waarom', 'welke'
      ],
      'jv': [
        // Javanese words
        'jawa', 'kawi', 'serat', 'babad', 'kraton', 'sastra', 'tembang', 'wayang',
        'gamelan', 'batik', 'sultan', 'pangeran', 'raden', 'mas', 'mbak', 'pak', 'bu'
      ],
      'ar': [
        // Arabic words common in religious texts
        'islam', 'quran', 'hadis', 'fiqh', 'tauhid', 'sharia', 'sufi', 'syariah',
        'allah', 'muhammad', 'nabi', 'rasul', 'iman', 'islam', 'muslim', 'shalat'
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
        textLower.includes('analysis') || textLower.includes('development')) {
      scores['en'] += 3;
    }

    if (textLower.includes('sejarah') || textLower.includes('budaya') || 
        textLower.includes('studi') || textLower.includes('penelitian') ||
        textLower.includes('analisis') || textLower.includes('perkembangan')) {
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
    }

    return bestLang;
  } catch (error) {
    console.error('Error in detectLanguage:', error);
    return 'unknown';
  }
};

// Specialized function untuk judul buku
export const detectLanguageFromTitle = (title) => {
  if (!title) return 'unknown';
  
  try {
    const titleLower = title.toLowerCase();
    
    // Common patterns in book titles untuk setiap bahasa
    const titlePatterns = {
      'id': [
        'sejarah', 'budaya', 'sastra', 'hukum', 'politik', 'ekonomi', 'sosial',
        'pendidikan', 'kesehatan', 'pertanian', 'teknologi', 'lingkungan',
        'pengantar', 'dasar', 'teori', 'praktikum', 'studi', 'analisis',
        'perkembangan', 'perubahan', 'transformasi', 'modernisasi'
      ],
      'en': [
        'history', 'culture', 'literature', 'law', 'politics', 'economy', 'social',
        'education', 'health', 'agriculture', 'technology', 'environment',
        'introduction', 'basic', 'theory', 'practice', 'study', 'analysis',
        'development', 'change', 'transformation', 'modernization'
      ],
      'nl': [
        'geschiedenis', 'cultuur', 'literatuur', 'recht', 'politiek', 'economie',
        'onderwijs', 'gezondheid', 'landbouw', 'technologie', 'milieu',
        'inleiding', 'handleiding', 'studie', 'onderzoek', 'analyse'
      ],
      'jv': [
        'serat', 'babad', 'sastra', 'tembang', 'wayang', 'gamelan', 'batik',
        'kraton', 'kasultanan', 'priyayi'
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
  } catch (error) {
    console.error('Error in detectLanguageFromTitle:', error);
    return 'unknown';
  }
};
