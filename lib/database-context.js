// lib/database-context.js
import { supabase } from './supabase';

// 🎯 **GET ENHANCED BOOK CONTEXT**
export async function getEnhancedBookContext(searchTerm) {
  try {
    console.log('🔍 Getting enhanced context for:', searchTerm);
    
    if (!searchTerm || searchTerm.length < 2) {
      return getDefaultLibraryStats();
    }

    const [books, categories, authors, relatedTopics] = await Promise.all([
      searchBooksWithScore(searchTerm),
      getRelatedCategories(searchTerm),
      getRelatedAuthors(searchTerm),
      getRelatedTopics(searchTerm)
    ]);

    return {
      books: books.slice(0, 5),
      categories: categories.slice(0, 3),
      authors: authors.slice(0, 3),
      relatedTopics: relatedTopics.slice(0, 3),
      totalBooks: books.length,
      hasResults: books.length > 0,
      searchTerm
    };
    
  } catch (error) {
    console.error('Database context error:', error);
    return getDefaultLibraryStats();
  }
}

// 🎯 **SEARCH BOOKS WITH RELEVANCE SCORING**
async function searchBooksWithScore(searchTerm) {
  const { data, error } = await supabase
    .from('books')
    .select('id, judul, pengarang, penerbit, tahun_terbit, deskripsi_fisik, nomor_panggil')
    .or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%,penerbit.ilike.%${searchTerm}%`)
    .limit(10);

  if (error || !data) return [];

  // Add relevance scoring
  return data.map(book => ({
    ...book,
    relevance: calculateRelevance(book, searchTerm),
    hasPhysicalDesc: !!book.deskripsi_fisik,
    hasCallNumber: !!book.nomor_panggil
  })).sort((a, b) => b.relevance - a.relevance);
}

// 🎯 **CALCULATE RELEVANCE SCORE**
function calculateRelevance(book, searchTerm) {
  let score = 0;
  const terms = searchTerm.toLowerCase().split(' ');
  const judul = book.judul?.toLowerCase() || '';
  const pengarang = book.pengarang?.toLowerCase() || '';
  const penerbit = book.penerbit?.toLowerCase() || '';

  terms.forEach(term => {
    if (judul.includes(term)) score += 3;
    if (pengarang.includes(term)) score += 2;
    if (penerbit.includes(term)) score += 1;
    if (book.deskripsi_fisik?.toLowerCase().includes(term)) score += 1;
  });

  return score;
}

// 🎯 **GET RELATED CATEGORIES**
async function getRelatedCategories(searchTerm) {
  // Ini contoh - Anda bisa extend dengan table categories jika ada
  const categories = {
    'sejarah': ['Sejarah Indonesia', 'Sejarah Dunia', 'Arkeologi', 'Antropologi'],
    'sastra': ['Sastra Indonesia', 'Sastra Dunia', 'Puisi', 'Novel', 'Cerpen'],
    'sains': ['Fisika', 'Kimia', 'Biologi', 'Matematika', 'Teknologi'],
    'seni': ['Seni Rupa', 'Musik', 'Tari', 'Teater', 'Fotografi'],
    'filsafat': ['Filsafat Barat', 'Filsafat Timur', 'Etika', 'Logika']
  };

  const found = [];
  for (const [category, subcategories] of Object.entries(categories)) {
    if (searchTerm.toLowerCase().includes(category)) {
      found.push({
        category,
        subcategories: subcategories.slice(0, 3)
      });
    }
  }

  return found.slice(0, 2);
}

// 🎯 **GET RELATED AUTHORS**
async function getRelatedAuthors(searchTerm) {
  const { data, error } = await supabase
    .from('books')
    .select('pengarang')
    .ilike('pengarang', `%${searchTerm}%`)
    .limit(5);

  if (error || !data) return [];

  // Remove duplicates and nulls
  return [...new Set(data.map(item => item.pengarang).filter(Boolean))];
}

// 🎯 **GET RELATED TOPICS**
async function getRelatedTopics(searchTerm) {
  // Simple topic extraction based on common patterns
  const topicPatterns = {
    'sejarah': ['periode', 'era', 'zaman', 'kerajaan', 'kolonial'],
    'sains': ['penelitian', 'eksperimen', 'teori', 'ilmiah'],
    'teknologi': ['digital', 'komputer', 'internet', 'programming'],
    'pendidikan': ['belajar', 'mengajar', 'kurikulum', 'sekolah'],
    'budaya': ['tradisi', 'adat', 'kebiasaan', 'festival']
  };

  const topics = [];
  for (const [topic, keywords] of Object.entries(topicPatterns)) {
    if (keywords.some(keyword => searchTerm.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics;
}

// 🎯 **GET DEFAULT LIBRARY STATS**
async function getDefaultLibraryStats() {
  const { data, error } = await supabase
    .from('books')
    .select('id', { count: 'exact' });

  const totalBooks = error ? 0 : data.length;

  return {
    books: [],
    categories: [],
    authors: [],
    relatedTopics: [],
    totalBooks,
    hasResults: false,
    libraryStats: {
      totalBooks,
      estimatedTitles: 10000, // Adjust based on your data
      yearsCovered: '1800-2024',
      mainCollections: ['Sejarah', 'Sastra', 'Sains', 'Seni', 'Filsafat']
    }
  };
}

// 🎯 **GET SMART CONTEXT BERDASARKAN INTENT**
export async function getSmartContextByIntent(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('buku terbaru') || lowerMsg.includes('terbitan terbaru')) {
    return await getNewestBooksContext();
  }
  else if (lowerMsg.includes('buku populer') || lowerMsg.includes('sering dipinjam')) {
    return await getPopularBooksContext();
  }
  else if (lowerMsg.includes('koleksi langka') || lowerMsg.includes('buku kuno')) {
    return await getRareBooksContext();
  }
  else if (lowerMsg.includes('sejarah')) {
    return await getCategoryContext('sejarah');
  }
  else if (lowerMsg.includes('sastra') || lowerMsg.includes('novel') || lowerMsg.includes('puisi')) {
    return await getCategoryContext('sastra');
  }
  else if (lowerMsg.includes('sains') || lowerMsg.includes('ilmu')) {
    return await getCategoryContext('sains');
  }
  else {
    const keywords = extractKeywordsFromMessage(message);
    return await getEnhancedBookContext(keywords);
  }
}

// 🎯 **GET NEWEST BOOKS CONTEXT**
async function getNewestBooksContext() {
  const { data, error } = await supabase
    .from('books')
    .select('id, judul, pengarang, penerbit, tahun_terbit')
    .not('tahun_terbit', 'is', null)
    .order('tahun_terbit', { ascending: false })
    .limit(5);

  return {
    contextType: 'newest_books',
    books: data || [],
    description: 'Buku-buku terbaru dalam koleksi perpustakaan',
    timeframe: '5 tahun terakhir'
  };
}

// 🎯 **EXTRACT KEYWORDS FROM MESSAGE**
function extractKeywordsFromMessage(message) {
  const stopWords = ['buku', 'judul', 'mengenai', 'tentang', 'apa', 'ini', 'itu', 'yang', 'di', 'ke', 'dari', 'dengan', 'oleh'];
  const words = message.toLowerCase().split(' ');
  
  return words
    .filter(word => !stopWords.includes(word) && word.length > 2)
    .slice(0, 3)
    .join(' ');
}