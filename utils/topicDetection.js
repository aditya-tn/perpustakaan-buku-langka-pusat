// utils/topicDetection.js - IMPROVED VERSION

// Enhanced topic detection dengan fallback yang lebih baik
export const extractTopicsFromTitle = (judul) => {
  if (!judul || typeof judul !== 'string') return ['literatur'];
  
  try {
    const judulLower = judul.toLowerCase();
    const topics = [];
    
    // Enhanced topic mapping dengan lebih banyak keywords
    const topicMapping = {
      'sejarah': ['sejarah', 'history', 'geschiedenis', 'tawarikh', 'historic', 'chronicle', 'annals', 'masa lalu', 'zaman', 'era', 'abad'],
      'hukum': ['hukum', 'law', 'recht', 'undang-undang', 'legislation', 'legal', 'peraturan', 'yurisprudensi', 'peradilan', 'justice'],
      'budaya': ['budaya', 'culture', 'cultuur', 'adat', 'tradisi', 'kesenian', 'art', 'seni', 'warisan', 'heritage', 'folklor'],
      'agama': ['islam', 'muslim', 'quran', 'hadis', 'fiqh', 'tauhid', 'sharia', 'kristen', 'christian', 'hindu', 'buddha', 'religion', 'kepercayaan'],
      'bahasa': ['bahasa', 'language', 'taal', 'kamus', 'grammar', 'linguistik', 'sastra', 'literature', 'puisi', 'prosa'],
      'pendidikan': ['pendidikan', 'education', 'onderwijs', 'sekolah', 'guru', 'murid', 'belajar', 'pengajaran'],
      'ekonomi': ['ekonomi', 'economy', 'economie', 'keuangan', 'finance', 'bank', 'bisnis', 'perdagangan'],
      'politik': ['politik', 'politics', 'politiek', 'pemerintah', 'government', 'negara', 'nasional', 'demokrasi'],
      'sains': ['sains', 'science', 'ilmu', 'pengetahuan', 'fisika', 'kimia', 'biologi', 'matematika'],
      'teknik': ['teknik', 'engineering', 'teknologi', 'rekayasa', 'mesin', 'elektro', 'komputer'],
      'kesehatan': ['kesehatan', 'health', 'medis', 'kedokteran', 'dokter', 'obat', 'rumah sakit'],
      'pertanian': ['pertanian', 'agriculture', 'petani', 'tanaman', 'padi', 'sawah'],
      'filsafat': ['filsafat', 'philosophy', 'pemikiran', 'etika', 'moral', 'logika'],
      'sosiologi': ['sosiologi', 'sociology', 'masyarakat', 'sosial', 'komunitas'],
      'antropologi': ['antropologi', 'anthropology', 'manusia', 'etnis', 'suku'],
      'seni': ['seni', 'art', 'lukisan', 'patung', 'fotografi', 'desain'],
      'musik': ['musik', 'music', 'lagu', 'nada', 'instrumen', 'tembang']
    };

    // Check each topic
    Object.entries(topicMapping).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => judulLower.includes(keyword))) {
        topics.push(topic);
      }
    });

    // Fallback: jika tidak ada topic terdeteksi, coba deteksi dari konteks
    if (topics.length === 0) {
      if (judulLower.match(/(jawa|sumatra|kalimantan|sulawesi|papua|bali|nusantara)/)) {
        topics.push('budaya', 'sejarah');
      } else if (judulLower.match(/(pemerintah|negara|politik|demokrasi)/)) {
        topics.push('politik');
      } else if (judulLower.match(/(ekonomi|keuangan|bisnis|perdagangan)/)) {
        topics.push('ekonomi');
      } else if (judulLower.match(/(pendidikan|sekolah|guru|belajar)/)) {
        topics.push('pendidikan');
      } else {
        topics.push('literatur');
      }
    }

    return topics.slice(0, 3); // Max 3 topics

  } catch (error) {
    console.error('Error in extractTopicsFromTitle:', error);
    return ['literatur']; // Safe fallback
  }
};
