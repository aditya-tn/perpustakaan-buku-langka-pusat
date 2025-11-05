// utils/ruleBasedDescriptions.js - FIXED CHARACTERISTICS
import { detectLanguage, detectLanguageFromTitle } from './languageDetection';
import { extractTopicsFromTitle } from './topicDetection';

// ... (extractYearFromString dan getHistoricalEra tetap sama)

// Detect book characteristics - FIXED
export const detectBookCharacteristics = (book) => {
  try {
    const year = extractYearFromString(book.tahun_terbit);
    const language = detectLanguageFromTitle(book.judul);
    const topics = extractTopicsFromTitle(book.judul);
    const era = getHistoricalEra(year);
    
    // Pastikan topics selalu ada minimal 1
    const safeTopics = topics.length > 0 ? topics : ['literatur'];
    
    // Pastikan language label ada
    const getLanguageLabel = (lang) => {
      const labels = {
        'id': 'Indonesia',
        'en': 'English', 
        'nl': 'Belanda',
        'jv': 'Jawa',
        'ar': 'Arab'
      };
      return labels[lang] || 'Indonesia'; // Default to Indonesia
    };

    return {
      year,
      language,
      languageLabel: getLanguageLabel(language), // Add label here
      topics: safeTopics,
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
      topicCount: safeTopics.length
    };
  } catch (error) {
    console.error('Error detecting book characteristics:', error);
    return {
      year: null,
      language: 'id',
      languageLabel: 'Indonesia',
      topics: ['literatur'],
      era: 'tidak diketahui',
      isAncient: false,
      isColonial: false,
      isPostIndependence: false,
      hasAuthor: false,
      isDutch: false,
      isJavanese: false,
      isEnglish: false,
      isIndonesian: true,
      hasPublisher: false,
      topicCount: 1
    };
  }
};

// ... (templates dan generateRuleBasedDescription tetap sama)
