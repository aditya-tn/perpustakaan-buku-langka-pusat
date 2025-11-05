// utils/languageDetection.js - IMPROVED VERSION

// Enhanced language detection dengan fallback yang lebih baik
export const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'id'; // Default to Indonesian
  
  try {
    const textLower = text.toLowerCase().trim();
    if (textLower.length < 3) return 'id';
    
    // Simple but effective pattern matching
    const patterns = {
      'id': [
        /\b(yang|dan|di|ke|dari|untuk|pada|dengan|ini|itu|tidak|akan|ada|atau|juga|dalam|dapat|saat|lebih|orang|telah|oleh|karena|namun|sebagai|masih|sama|atas|bawah|depan|belakang|kiri|kanan|sejarah|budaya|sastra|hukum|politik|ekonomi|sosial|pendidikan|kesehatan|pertanian|teknologi|lingkungan|pengantar|dasar|teori|praktikum|studi|analisis|perkembangan|perubahan|transformasi|modernisasi|indonesia|jawa|sumatra|kalimantan|sulawesi|papua|nusantara|nasional|daerah|lokal|tradisional|adat|tradisi|kesenian|warisan|masyarakat|negara|pemerintah|rakyat|bangsa|bahasa|kata|kalimat|tulisan|buku|karya|penulis|pengarang|penerbit|terbit|tahun|abad|zaman|masa|periode|era)\b/gi
      ],
      'en': [
        /\b(the|and|of|to|a|in|is|it|you|that|he|was|for|on|are|as|with|his|they|i|at|be|this|have|from|or|one|had|by|word|but|not|what|all|were|we|when|your|can|said|there|use|an|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|him|into|time|has|two|more|write|go|see|number|no|way|could|people|my|than|first|water|been|call|who|oil|its|now|find|long|down|day|did|get|come|made|may|part|over|new|work|world|life|study|research|analysis|development|history|culture|literature|law|politics|economy|social|education|health|agriculture|technology|environment|introduction|basic|theory|practice|methodology|perspective|approach|concept|principle|system|handbook|guide|manual|textbook)\b/gi
      ],
      'nl': [
        /\b(de|het|en|van|tot|voor|met|zijn|een|als|door|over|onder|tussen|om|te|bij|naar|uit|zo|er|maar|ook|dan|of|want|dus|toch|al|op|aan|in|dat|die|dit|deze|wat|wie|waar|hoe|waarom|welke|geschiedenis|cultuur|literatuur|recht|politiek|economie|onderwijs|gezondheid|landbouw|technologie|milieu|inleiding|handleiding|studie|onderzoek|analyse|ontwikkeling|verandering|transformatie|modernisering|nederlands|indisch|koloniaal|inlandsch|beschaving)\b/gi
      ],
      'jv': [
        /\b(jawa|kawi|serat|babad|kraton|sastra|tembang|wayang|gamelan|batik|sultan|pangeran|raden|mas|mbak|pak|bu|ing|saka|kang|sing|iku|kabeh|ana|ora|wis|arep|bakal|sampun|saged|boten|mriki|mrono|kene|kono)\b/gi
      ],
      'ar': [
        /\b(islam|quran|hadis|fiqh|tauhid|sharia|sufi|syariah|allah|muhammad|nabi|rasul|iman|muslim|shalat|zakat|puasa|haji|sunni|syiah|tasawuf|tarikat|ulama)\b/gi
      ]
    };

    const scores = { id: 0, en: 0, nl: 0, jv: 0, ar: 0 };
    
    // Count matches for each language
    Object.entries(patterns).forEach(([lang, regexes]) => {
      regexes.forEach(regex => {
        const matches = textLower.match(regex);
        if (matches) {
          scores[lang] += matches.length;
        }
      });
    });

    // Special boost for obvious cases
    if (textLower.includes('history') || textLower.includes('culture') || textLower.includes('study')) {
      scores['en'] += 5;
    }
    if (textLower.includes('sejarah') || textLower.includes('budaya') || textLower.includes('studi')) {
      scores['id'] += 5;
    }
    if (textLower.includes('geschiedenis') || textLower.includes('cultuur')) {
      scores['nl'] += 5;
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

    // If no strong signal, use word length analysis
    if (bestScore < 2) {
      const words = textLower.split(/\s+/);
      const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
      
      // Indonesian tends to have longer words, English shorter
      if (avgWordLength > 6) return 'id';
      if (avgWordLength < 5) return 'en';
    }

    return bestLang;

  } catch (error) {
    console.error('Error in detectLanguage:', error);
    return 'id'; // Fallback to Indonesian
  }
};

// Simplified title detection
export const detectLanguageFromTitle = (title) => {
  if (!title || typeof title !== 'string') return 'id';
  
  try {
    const titleLower = title.toLowerCase();
    
    // Quick checks for obvious cases
    if (titleLower.includes('geschiedenis') || titleLower.includes('cultuur') || titleLower.includes('nederlands')) {
      return 'nl';
    }
    if (titleLower.includes('history') || titleLower.includes('culture') || titleLower.includes('study')) {
      return 'en';
    }
    if (titleLower.includes('serat') || titleLower.includes('babad') || titleLower.includes('jawa')) {
      return 'jv';
    }
    if (titleLower.includes('islam') || titleLower.includes('quran') || titleLower.includes('fiqh')) {
      return 'ar';
    }
    
    // Default to general detection
    return detectLanguage(title);
  } catch (error) {
    console.error('Error in detectLanguageFromTitle:', error);
    return 'id';
  }
};
