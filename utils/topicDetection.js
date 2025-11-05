// utils/topicDetection.js

// Comprehensive topic detection system
export const extractTopicsFromTitle = (judul) => {
  if (!judul) return ['umum'];
  
  try {
    const judulLower = judul.toLowerCase();
    
    // Comprehensive topic taxonomy dengan weighted keywords
    const topicTaxonomy = {
      'sejarah': {
        keywords: [
          'sejarah', 'history', 'geschiedenis', 'tawarikh', 'historic', 
          'chronicle', 'annals', 'historical', 'masa lalu', 'zaman', 'era'
        ],
        weight: 1.0
      },
      'hukum': {
        keywords: [
          'hukum', 'law', 'recht', 'undang-undang', 'legislation',
          'legal', 'peraturan', 'regulation', 'yurisprudensi'
        ],
        weight: 1.0
      },
      'budaya': {
        keywords: [
          'budaya', 'culture', 'cultuur', 'adat', 'tradisi', 'traditions',
          'kebudayaan', 'cultural', 'kesenian', 'art', 'seni'
        ],
        weight: 1.0
      },
      'agama': {
        keywords: [
          'islam', 'muslim', 'islamic', 'quran', 'koran', 'hadis', 'hadith',
          'fiqh', 'tauhid', 'theology', 'sharia', 'syariah',
          'kristen', 'christian', 'hindu', 'hinduism', 'buddha', 'buddhism'
        ],
        weight: 1.0
      },
      'bahasa': {
        keywords: [
          'bahasa', 'language', 'taal', 'kamus', 'dictionary', 'grammar',
          'tata bahasa', 'linguistik', 'linguistics', 'filologi'
        ],
        weight: 1.0
      },
      'pendidikan': {
        keywords: [
          'pendidikan', 'education', 'onderwijs', 'sekolah', 'school',
          'pengajaran', 'teaching', 'belajar', 'learning', 'mengajar'
        ],
        weight: 0.9
      },
      'ekonomi': {
        keywords: [
          'ekonomi', 'economy', 'economie', 'perekonomian', 'economic',
          'keuangan', 'finance', 'financial', 'bank', 'perbankan'
        ],
        weight: 0.9
      },
      'politik': {
        keywords: [
          'politik', 'politics', 'politiek', 'pemerintah', 'government',
          'negara', 'state', 'nasional', 'national', 'internasional'
        ],
        weight: 0.9
      },
      'sains': {
        keywords: [
          'sains', 'science', 'wetenschap', 'ilmu', 'knowledge', 'pengetahuan',
          'fisika', 'physics', 'kimia', 'chemistry', 'biologi', 'biology'
        ],
        weight: 0.8
      },
      'teknik': {
        keywords: [
          'teknik', 'engineering', 'techniek', 'teknologi', 'technology',
          'rekayasa', 'engineer', 'mesin', 'machine', 'elektro'
        ],
        weight: 0.8
      },
      'filsafat': {
        keywords: [
          'filsafat', 'philosophy', 'filosofi', 'pemikiran', 'thought',
          'etika', 'ethics', 'moral', 'morality', 'logika', 'logic'
        ],
        weight: 0.7
      },
      'sosiologi': {
        keywords: [
          'sosiologi', 'sociology', 'masyarakat', 'society', 'sosial', 'social',
          'komunitas', 'community', 'kelompok', 'group'
        ],
        weight: 0.7
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

    // Filter topics dengan score di atas threshold
    const threshold = 0.5;
    const detectedTopics = Object.entries(topicScores)
      .filter(([topic, score]) => score >= threshold)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([topic]) => topic);

    return detectedTopics.length > 0 ? detectedTopics.slice(0, 3) : ['umum'];
    
  } catch (error) {
    console.error('Error in extractTopicsFromTitle:', error);
    return ['umum'];
  }
};
