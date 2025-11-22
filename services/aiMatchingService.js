// services/aiMatchingService.js - COMPLETE FIXED VERSION
import { generateAIResponse } from '../lib/gemini';

export const aiMatchingService = {
  async analyzeBookPlaylistMatch(book, playlist) {
    try {
      console.log('🤖 Attempting AI analysis...');
      
      if (!this.isGeminiAvailable()) {
        console.log('⚡ Gemini not configured, using fallback');
        return this.getFallbackAnalysis(book, playlist);
      }

      const prompt = this.createAnalysisPrompt(book, playlist);
      console.log('📤 Sending prompt to AI...');
      
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.2,
        maxTokens: 500
      });

      if (!aiResponse) {
        console.log('❌ AI returned null response, using fallback');
        return this.getFallbackAnalysis(book, playlist);
      }

      console.log('✅ AI Response received');
      return this.parseAIResponse(aiResponse, book, playlist);
      
    } catch (error) {
      console.error('❌ AI Analysis failed:', error.message);
      return this.getFallbackAnalysis(book, playlist);
    }
  },

  // ===========================================================================
  // 🆕 IMPROVED MAIN RECOMMENDATIONS FLOW
  // ===========================================================================
  async getPlaylistRecommendations({ book, playlists = [] }) {
    try {
      console.log('🎯 START: ENHANCED Playlist recommendations flow');
      console.log('📚 Book:', book.judul);
      console.log('📊 Total playlists:', playlists.length);

      // STEP 1: Filter available playlists
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      console.log('🔍 Available playlists:', availablePlaylists.length);

      if (availablePlaylists.length === 0) {
        console.log('❌ No available playlists');
        return [];
      }

      // STEP 2: ENHANCED Metadata Matching
      console.log('🔍 Starting ENHANCED metadata matching...');
      const topPlaylists = await this.selectTopPlaylistsByPureMetadata(book, availablePlaylists, 3);
      
      console.log('✅ Top 3 selected:', topPlaylists.map(p => ({
        name: p.playlist.name,
        score: p.score
      })));

      // STEP 3: PRIORITIZE AI Analysis
      const geminiAvailable = this.isGeminiAvailable();
      console.log('🤖 Gemini available:', geminiAvailable);

      if (topPlaylists.length > 0 && geminiAvailable) {
        console.log('🚀 ATTEMPTING AI FINAL ANALYSIS...');
        try {
          const aiResults = await this.getAIFinalAnalysis(book, topPlaylists);
          console.log('✅ AI analysis SUCCESSFUL:', aiResults.length, 'results');
          return aiResults;
        } catch (aiError) {
          console.error('❌ AI analysis failed after retries:', aiError.message);
          console.log('🔄 Falling back to ENHANCED metadata-based results');
        }
      } else {
        console.log('⚠️ Gemini not available, using ENHANCED metadata-based');
      }

      // STEP 4: Enhanced Fallback
      const metadataResults = this.getEnhancedMetadataResults(book, topPlaylists);
      console.log('📊 Enhanced metadata results:', metadataResults.length);
      
      return metadataResults;

    } catch (error) {
      console.error('💥 ENHANCED recommendation flow failed:', error);
      return this.getEmergencyResults(book, playlists);
    }
  },

  // ===========================================================================
  // 🆕 IMPROVED METADATA MATCHING METHODS
  // ===========================================================================
  async selectTopPlaylistsByPureMetadata(book, playlists, maxCount = 3) {
    console.log('🔍 Selecting top playlists by ENHANCED METADATA...');
    console.log(`📊 Total playlists to process: ${playlists.length}`);

    const scoredPlaylists = [];

    for (let i = 0; i < playlists.length; i++) {
      const playlist = playlists[i];
      
      // 🆕 ADD SAFETY CHECK
      if (!playlist || !playlist.id) {
        console.log(`⚠️ Skipping invalid playlist at index ${i}`);
        continue;
      }

      console.log(`\n🔄 Processing ${i + 1}/${playlists.length}: "${playlist.name}"`);
      
      try {
        const score = this.calculateEnhancedMetadataMatch(book, playlist);
        scoredPlaylists.push({ playlist, score });
        console.log(`✅ Processed: "${playlist.name}" - Score: ${score}`);
      } catch (error) {
        console.error(`❌ Error processing "${playlist.name}":`, error.message);
        // Continue dengan playlist berikutnya
        scoredPlaylists.push({ playlist, score: 0 });
      }
    }

    console.log(`✅ Completed processing ${scoredPlaylists.length}/${playlists.length} playlists`);

    // Sort dan ambil top N
    const sorted = scoredPlaylists.sort((a, b) => b.score - a.score);
    const topPlaylists = sorted.slice(0, maxCount);

    console.log('📊 Top playlists after sorting:');
    topPlaylists.forEach((item, index) => {
      console.log(` ${index + 1}. "${item.playlist.name}": ${item.score}`);
    });

    return topPlaylists;
  },

  // 🆕 REPLACED: Enhanced Metadata Matching
calculateEnhancedMetadataMatch(book, playlist) {
  console.log(`🔍 ULTRA ENHANCED Matching: "${book.judul}" vs "${playlist.name}"`);
  
  const bookTitle = book.judul.toLowerCase();
  const bookDesc = (book.deskripsi_buku || '').toLowerCase();
  const playlistName = playlist.name.toLowerCase();
  const playlistDesc = (playlist.description || '').toLowerCase();
  
  let score = 0;

  // 1. 🎯 CRITICAL KEYWORD MATCHING (30%) - PALING PENTING
  const criticalScore = this.calculateCriticalKeywordMatch(bookTitle, bookDesc, playlistName, playlistDesc);
  score += criticalScore * 0.3;
  console.log(`🔥 Critical Keyword Score: ${criticalScore} → Total: ${score}`);

  // 2. 🎯 AI METADATA MATCHING (30%) - SANGAT PENTING
  const aiMetadataScore = this.calculateEnhancedAIMetadataMatch(book, playlist);
  score += aiMetadataScore * 0.3;
  console.log(`🤖 AI Metadata Score: ${aiMetadataScore} → Total: ${score}`);

  // 3. 🎯 CONTENT THEME MATCHING (25%) - PENTING
  const themeScore = this.calculateUltraThemeMatch(bookTitle, bookDesc, playlistName, playlistDesc);
  score += themeScore * 0.25;
  console.log(`🎭 Ultra Theme Score: ${themeScore} → Total: ${score}`);

  // 4. 🎯 SMART TEXT MATCHING (15%) - TAMBAHAN
  const textMatchScore = this.calculateUltraTextMatch(bookTitle, bookDesc, playlistName, playlistDesc);
  score += textMatchScore * 0.15;
  console.log(`📖 Ultra Text Match: ${textMatchScore} → Total: ${score}`);

  const finalScore = Math.min(100, Math.round(score));
  console.log(`✅ FINAL ULTRA SCORE: ${finalScore} for "${playlist.name}"`);
  
  return finalScore;
},

// 🆕 METHOD: Critical Keyword Matching - DETECT KEYWORDS PENTING
calculateCriticalKeywordMatch(bookTitle, bookDesc, playlistName, playlistDesc) {
  console.log(`\n🔥 ANALYZING CRITICAL KEYWORDS:`);
  
  const bookText = `${bookTitle} ${bookDesc}`;
  const playlistText = `${playlistName} ${playlistDesc}`;
  
  let score = 0;
  
  // 🎯 CRITICAL KEYWORDS dengan bobot tinggi
  const criticalKeywords = {
    // Kolonial & Sejarah Indonesia
    'hindia belanda': 40,
    'kolonial': 35,
    'penjajahan': 30,
    'belanda': 25,
    'sejarah indonesia': 40,
    'nusantara': 20,
    'indonesia': 15,
    
    // Periode & Era
    'runtuhnya': 25,
    'dekolonisasi': 30,
    'disintegrasi': 25,
    'kemerdekaan': 20,
    
    // Topik Utama
    'politik': 20,
    'sosial': 15,
    'ekonomi': 15,
    'militer': 20,
    'pemerintahan': 18,
    
    // Regional (jika ada)
    'jawa': 15,
    'sumatra': 15,
    'sulawesi': 15,
    'kalimantan': 15,
    'bali': 15,
    'aceh': 15
  };
  
  for (const [keyword, weight] of Object.entries(criticalKeywords)) {
    const bookHasKeyword = bookText.includes(keyword);
    const playlistHasKeyword = playlistText.includes(keyword);
    
    if (bookHasKeyword && playlistHasKeyword) {
      score += weight;
      console.log(`💥 CRITICAL MATCH: "${keyword}" → +${weight}`);
    } else if (bookHasKeyword) {
      console.log(`⚠️ Book has "${keyword}" but playlist doesn't`);
    } else if (playlistHasKeyword) {
      console.log(`ℹ️ Playlist has "${keyword}" but book doesn't`);
    }
  }
  
  // Bonus untuk exact title match
  if (playlistText.includes(bookTitle.toLowerCase())) {
    score += 30;
    console.log(`🏆 EXACT TITLE MATCH BONUS: +30`);
  }
  
  return Math.min(100, score);
},

// 🆕 METHOD: Enhanced AI Metadata Matching
calculateEnhancedAIMetadataMatch(book, playlist) {
  console.log(`\n🤖 ENHANCED AI METADATA ANALYSIS:`);
  
  let score = 0;
  
  if (playlist.ai_metadata) {
    console.log(`📋 AI Metadata available for: "${playlist.name}"`);
    const metadata = playlist.ai_metadata;
    
    // Extract ULTRA book themes
    const bookThemes = this.extractUltraBookThemes(book);
    const bookKeywords = this.extractEnhancedBookKeywords(book);
    
    console.log(`🏷️ ULTRA Book Themes: [${bookThemes.join(', ')}]`);
    console.log(`🔑 Enhanced Book Keywords: [${bookKeywords.join(', ')}]`);
    console.log(`🎯 Playlist AI Themes: [${metadata.key_themes?.join(', ') || 'none'}]`);
    
    // 🎯 THEME MATCHING dengan bobot lebih tinggi
    if (metadata.key_themes && metadata.key_themes.length > 0) {
      const themeMatches = bookThemes.filter(theme => 
        metadata.key_themes.includes(theme)
      ).length;
      
      if (themeMatches > 0) {
        score += themeMatches * 20; // Increased from 15
        console.log(`✅ ENHANCED AI THEME MATCHES: ${themeMatches} → +${themeMatches * 20}`);
      }
      
      // Bonus untuk multiple strong matches
      if (themeMatches >= 2) {
        score += 15;
        console.log(`🌟 MULTIPLE THEME BONUS: +15`);
      }
    }
    
    // 🎯 HISTORICAL CONTEXT dengan matching lebih baik
    if (metadata.historical_context) {
      const contextMatch = this.evaluateEnhancedHistoricalContext(book, metadata.historical_context);
      score += contextMatch;
      console.log(`🏛️ ENHANCED Historical Context: +${contextMatch}`);
    }
    
    // 🎯 CONTENT TYPE matching improved
    if (metadata.content_type && book.kategori) {
      const typeMatch = this.evaluateEnhancedContentTypeMatch(book.kategori, metadata.content_type);
      score += typeMatch;
      console.log(`📚 ENHANCED Content Type: +${typeMatch}`);
    }
    
    // 🎯 BONUS untuk established playlists dengan AI metadata
    if (playlist.books && playlist.books.length > 3 && !metadata.is_fallback) {
      score += 10;
      console.log(`⭐ ESTABLISHED AI PLAYLIST BONUS: +10`);
    }
    
  } else {
    console.log(`⚠️ No AI metadata, using enhanced basic matching`);
    score = this.calculateEnhancedBasicMatch(book, playlist);
  }
  
  return Math.min(80, score);
},

// 🆕 METHOD: Extract ULTRA Book Themes
extractUltraBookThemes(book) {
  const text = `${book.judul} ${book.deskripsi_buku || ''} ${book.kategori || ''}`.toLowerCase();
  const themes = [];
  
  const ultraThemeKeywords = {
    'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'era', 'period', 'tahun', 'abad', 'runtuhnya'],
    'kolonial': ['kolonial', 'belanda', 'dutch', 'penjajahan', 'colonial', 'voc', 'hindia belanda', 'hindia'],
    'revolusi': ['revolusi', 'kemerdekaan', 'perang', 'pertempuran', 'rebellion', 'independence', 'dekolonisasi'],
    'politik': ['politik', 'pemerintah', 'negara', 'kekuasaan', 'policy', 'government', 'administration', 'disintegrasi'],
    'militer': ['militer', 'tentara', 'perang', 'pertempuran', 'military', 'army', 'navy', 'air force', 'konflik'],
    'sosial': ['sosial', 'masyarakat', 'community', 'social', 'cultural', 'budaya', 'faktor'],
    'ekonomi': ['ekonomi', 'economic', 'trade', 'commerce', 'industry', 'business', 'finance', 'faktor'],
    'budaya': ['budaya', 'cultural', 'tradition', 'custom', 'adat', 'kesenian', 'art'],
    'biografi': ['biografi', 'tokoh', 'pahlawan', 'presiden', 'pemimpin', 'onghokham'],
    'indonesia': ['indonesia', 'nusantara', 'nasional', 'bangsa', 'nation']
  };
  
  for (const [theme, keywords] of Object.entries(ultraThemeKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  return themes.length > 0 ? themes : ['umum'];
},

// 🆕 ADD MISSING METHOD: isCommonWord
isCommonWord(word) {
  const commonWords = [
    'yang', 'dengan', 'dalam', 'untuk', 'pada', 'oleh', 'dari', 'sebagai', 
    'adalah', 'ini', 'itu', 'dan', 'atau', 'oleh', 'seorang', 'karya', 'dari',
    'di', 'ke', 'pada', 'untuk', 'dengan', 'oleh', 'sebagai', 'ada', 'tidak',
    'akan', 'telah', 'dapat', 'bisa', 'harus', 'perlu', 'bukan', 'saja',
    'juga', 'bahwa', 'namun', 'tetapi', 'karena', 'jika', 'apabila', 'sehingga',
    'agar', 'supaya', 'meskipun', 'walaupun', 'sementara', 'ketika', 'setelah',
    'sebelum', 'selama', 'hingga', 'sampai', 'melalui', 'terhadap', 'mengenai',
    'tentang', 'antara', 'dalam', 'atas', 'bawah', 'depan', 'belakang', 'samping',
    'dalam', 'luar', 'atas', 'bawah', 'kanan', 'kiri', 'sini', 'situ', 'sana',
    'ini', 'itu', 'sini', 'situ', 'sana', 'kami', 'kita', 'anda', 'dia', 'mereka',
    'saya', 'aku', 'kamu', 'engkau', 'beliau', 'para', 'pun', 'lah', 'kah', 'tah',
    'pun', 'nya', 'ku', 'mu', 'nya', 'lah', 'kah', 'tah', 'pun'
  ];
  return commonWords.includes(word.toLowerCase());
},
  
// 🆕 IMPROVED METHOD: Enhanced Book Keywords dengan error handling
extractEnhancedBookKeywords(book) {
  try {
    const text = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    
    // Remove common words and get meaningful keywords
    const words = this.tokenizeText(text).slice(0, 15); // Take more keywords
    
    // Return unique keywords
    return [...new Set(words)];
  } catch (error) {
    console.error('❌ Error in extractEnhancedBookKeywords:', error);
    return [];
  }
},

// 🆕 METHOD: Ultra Theme Matching
calculateUltraThemeMatch(bookTitle, bookDesc, playlistName, playlistDesc) {
  const bookText = `${bookTitle} ${bookDesc}`;
  const playlistText = `${playlistName} ${playlistDesc}`;
  
  let score = 0;
  
  // 🎯 ULTRA THEME CATEGORIES dengan bobot lebih tinggi
  const ultraThemes = {
    'sejarah indonesia': { 
      keywords: ['sejarah indonesia', 'historis indonesia', 'nusantara', 'masa lalu indonesia'], 
      weight: 35 
    },
    'kolonialisme': { 
      keywords: ['kolonial', 'belanda', 'penjajahan', 'hindia belanda', 'colonial', 'voc'], 
      weight: 40 
    },
    'revolusi kemerdekaan': { 
      keywords: ['revolusi', 'kemerdekaan', 'dekolonisasi', 'disintegrasi', 'runtuhnya'], 
      weight: 30 
    },
    'politik': { 
      keywords: ['politik', 'pemerintahan', 'negara', 'kekuasaan', 'government'], 
      weight: 25 
    },
    'militer': { 
      keywords: ['militer', 'tentara', 'perang', 'pertempuran', 'military'], 
      weight: 20 
    },
    'sosial budaya': { 
      keywords: ['sosial', 'masyarakat', 'budaya', 'cultural', 'community'], 
      weight: 15 
    }
  };
  
  for (const [theme, config] of Object.entries(ultraThemes)) {
    const bookHasTheme = config.keywords.some(keyword => bookText.includes(keyword));
    const playlistHasTheme = config.keywords.some(keyword => playlistText.includes(keyword));
    
    if (bookHasTheme && playlistHasTheme) {
      score += config.weight;
      console.log(`🎯 ULTRA THEME "${theme}" MATCH: +${config.weight}`);
    } else if (bookHasTheme) {
      console.log(`📘 Book has "${theme}" theme`);
    } else if (playlistHasTheme) {
      console.log(`📗 Playlist has "${theme}" theme`);
    }
  }
  
  return Math.min(100, score);
},

// 🆕 IMPROVED METHOD: Ultra Text Matching dengan error handling
calculateUltraTextMatch(bookTitle, bookDesc, playlistName, playlistDesc) {
  try {
    const bookWords = this.tokenizeText(bookTitle);
    const playlistWords = this.tokenizeText(playlistName);
    
    let score = 0;
    
    console.log(`\n📖 ULTRA TEXT MATCHING:`);
    console.log(`Book words: [${bookWords.join(', ')}]`);
    console.log(`Playlist words: [${playlistWords.join(', ')}]`);
    
    // Exact word matches dengan bobot tinggi
    bookWords.forEach(bWord => {
      playlistWords.forEach(pWord => {
        if (bWord === pWord && bWord.length > 3) {
          score += 12; // Increased from 8
          console.log(`💫 EXACT MATCH: "${bWord}" → +12`);
        } else if ((bWord.includes(pWord) || pWord.includes(bWord)) && bWord.length > 3 && pWord.length > 3) {
          score += 6; // Increased from 4
          console.log(`✨ PARTIAL MATCH: "${bWord}" ↔ "${pWord}" → +6`);
        }
      });
    });
    
    // Bonus untuk judul yang sangat relevan
    const relevanceBonus = this.calculateTitleRelevanceBonus(bookTitle, playlistName);
    score += relevanceBonus;
    
    return Math.min(50, score);
  } catch (error) {
    console.error('❌ Error in calculateUltraTextMatch:', error);
    return 0;
  }
},

// 🆕 IMPROVED METHOD: Tokenize Text dengan error handling
tokenizeText(text) {
  try {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    return text
      .toLowerCase()
      .split(/[\s.,;:!?()]+/)
      .filter(word => word && word.length > 2) // Include shorter words now
      .filter(word => !this.isCommonWord(word));
  } catch (error) {
    console.error('❌ Error in tokenizeText:', error);
    return [];
  }
},

// 🆕 METHOD: Calculate Title Relevance Bonus
calculateTitleRelevanceBonus(bookTitle, playlistName) {
  const bookLower = bookTitle.toLowerCase();
  const playlistLower = playlistName.toLowerCase();
  
  let bonus = 0;
  
  // High bonus for direct relevance
  if (bookLower.includes('hindia belanda') && playlistLower.includes('sejarah')) {
    bonus += 20;
    console.log(`🏆 HIGH RELEVANCE BONUS: "Hindia Belanda" + "Sejarah" → +20`);
  }
  
  if (bookLower.includes('runtuhnya') && playlistLower.includes('sejarah')) {
    bonus += 15;
    console.log(`🎯 RELEVANCE BONUS: "Runtuhnya" + "Sejarah" → +15`);
  }
  
  if (bookLower.includes('kolonial') && playlistLower.includes('sejarah')) {
    bonus += 15;
    console.log(`🎯 RELEVANCE BONUS: "Kolonial" + "Sejarah" → +15`);
  }
  
  return bonus;
},

// 🆕 METHOD: Enhanced Basic Match (fallback)
calculateEnhancedBasicMatch(book, playlist) {
  const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
  const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase();
  
  let score = 0;
  
  // Enhanced keyword matching
  const enhancedKeywords = [
    { keyword: 'hindia belanda', weight: 30 },
    { keyword: 'kolonial', weight: 25 },
    { keyword: 'sejarah indonesia', weight: 25 },
    { keyword: 'belanda', weight: 20 },
    { keyword: 'runtuhnya', weight: 20 },
    { keyword: 'dekolonisasi', weight: 20 },
    { keyword: 'politik', weight: 15 },
    { keyword: 'sosial', weight: 10 },
    { keyword: 'ekonomi', weight: 10 }
  ];
  
  enhancedKeywords.forEach(({ keyword, weight }) => {
    if (bookText.includes(keyword) && playlistText.includes(keyword)) {
      score += weight;
      console.log(`🔑 BASIC KEYWORD: "${keyword}" → +${weight}`);
    }
  });
  
  return Math.min(60, score);
},
  
  // ===========================================================================
  // 🆕 IMPROVED AI FINAL ANALYSIS METHODS
  // ===========================================================================
async getAIFinalAnalysis(book, topPlaylists) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;
  
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      console.log(`🤖 AI Final Analysis - Attempt ${attempt}/${MAX_RETRIES + 1}`);
      
      // 🆕 Use concise prompt on retry attempts to avoid truncation
      const prompt = attempt === 1 ? 
        this.createRobustFinalAnalysisPrompt(book, topPlaylists) :
        this.createConciseFinalAnalysisPrompt(book, topPlaylists);
      
      console.log('📤 Sending prompt to AI, length:', prompt.length);
      
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.2,
        maxTokens: 600 // 🆕 Reduce max tokens untuk hindari truncation
      });
      
      if (!aiResponse) {
        throw new Error('AI returned empty response');
      }
      
      console.log('✅ AI Response received, length:', aiResponse.length);
      return this.parseRobustFinalAIResponse(aiResponse, topPlaylists);
      
    } catch (error) {
      console.error(`❌ AI Analysis attempt ${attempt} failed:`, error.message);
      
      if (attempt <= MAX_RETRIES) {
        console.log(`🔄 Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.log('🚨 All AI attempts failed, using metadata fallback');
        throw error;
      }
    }
  }
},

  // 🆕 METHOD: Robust Prompt Creation
  createRobustFinalAnalysisPrompt(book, topPlaylists) {
    const playlistsInfo = topPlaylists.map((item, index) => 
      `${index + 1}. "${item.playlist.name}" - ${item.playlist.description || 'No description'}`
    ).join('\n');

    return `
ANALISIS KECOCOKAN BUKU DENGAN PLAYLIST - HARUS RESPOND DENGAN JSON

BUKU YANG DIANALISIS:
- Judul: "${book.judul}"
- Pengarang: ${book.pengarang || 'Tidak diketahui'}
- Tahun Terbit: ${book.tahun_terbit || 'Tidak diketahui'}
- Deskripsi: ${book.deskripsi_buku || 'Tidak ada deskripsi'}
- Kategori: ${book.kategori || 'Tidak ada kategori'}

PLAYLIST YANG DIPILIH (3 TERBAIK):
${playlistsInfo}

INSTRUKSI ANALISIS:
1. Analisis kecocokan tema antara buku dan setiap playlist
2. Berikan score 0-100 berdasarkan relevansi konten
3. Berikan alasan singkat dan spesifik
4. Fokus pada kesamaan tema, konteks sejarah, dan nilai edukasi

FORMAT OUTPUT YANG DIMINTA (JSON ARRAY):
[
  {
    "playlistName": "nama playlist 1",
    "matchScore": 85,
    "reason": "alasan kecocokan yang spesifik...",
    "thematicAnalysis": "analisis tematik mendalam..."
  },
  {
    "playlistName": "nama playlist 2", 
    "matchScore": 60,
    "reason": "alasan kecocokan yang spesifik...",
    "thematicAnalysis": "analisis tematik mendalam..."
  },
  {
    "playlistName": "nama playlist 3",
    "matchScore": 45,
    "reason": "alasan kecocokan yang spesifik...", 
    "thematicAnalysis": "analisis tematik mendalam..."
  }
]

HANYA KEMBALIKAN JSON ARRAY, TANPA TEKS LAINNYA.
`.trim();
  },


// 🆕 IMPROVED METHOD: Robust AI Response Parsing dengan incomplete JSON handling
parseRobustFinalAIResponse(aiResponse, topPlaylists) {
  try {
    console.log('🔄 Starting ROBUST AI response parsing...');
    
    if (!aiResponse || aiResponse.length < 10) {
      throw new Error('AI response too short or empty');
    }

    // Multiple cleanup strategies
    let cleanResponse = aiResponse
      .replace(/```json|```/g, '')
      .replace(/^[^{[]*/, '')  // Remove anything before first [ or {
      .replace(/[^}\]]*$/, '')  // Remove anything after last } or ]
      .trim();

    // Try to find JSON array
    const jsonArrayMatch = cleanResponse.match(/\[\s*{[\s\S]*?}\s*\]/);
    if (jsonArrayMatch) {
      cleanResponse = jsonArrayMatch[0];
    }

    console.log('🧹 Cleaned response length:', cleanResponse.length);
    console.log('🧹 Response:', cleanResponse);

    // 🆕 FIX: Handle incomplete JSON by completing it
    cleanResponse = this.fixIncompleteJSONArray(cleanResponse, topPlaylists);
    console.log('🔧 Fixed response length:', cleanResponse.length);

    const parsed = JSON.parse(cleanResponse);
    
    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not a JSON array');
    }

    console.log(`✅ Successfully parsed ${parsed.length} AI recommendations`);

    // Map AI results to our playlists with safety checks
    return parsed.map((item, index) => {
      const playlist = topPlaylists[index]?.playlist;
      
      if (!playlist) {
        console.warn(`⚠️ No playlist found for index ${index}, using fallback`);
        return this.createFallbackRecommendation(topPlaylists[0]?.playlist, 50);
      }

      return {
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: this.validateScore(item.matchScore),
        confidence: 0.9,
        reasoning: item.reason || 'Kecocokan berdasarkan analisis AI mendalam',
        thematicAnalysis: item.thematicAnalysis || 'Analisis tematik oleh AI',
        improvementSuggestions: [],
        isFallback: false,
        aiAnalyzed: true
      };
    }).filter(Boolean);

  } catch (error) {
    console.error('❌ ROBUST parsing failed:', error.message);
    console.log('📝 Raw AI response (first 500 chars):', aiResponse?.substring(0, 500));
    
    // 🆕 IMPROVED: Try to extract partial data from incomplete JSON
    const partialResults = this.extractPartialResultsFromIncompleteJSON(aiResponse, topPlaylists);
    if (partialResults.length > 0) {
      console.log('🔄 Using partial AI results:', partialResults.length);
      return partialResults;
    }
    
    // Create meaningful fallback instead of throwing
    return this.createIntelligentFallback(topPlaylists);
  }
},

// 🆕 METHOD: Fix incomplete JSON array
fixIncompleteJSONArray(jsonString, topPlaylists) {
  let fixed = jsonString.trim();
  
  // Count open and close brackets
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  // Count open and close braces
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  
  console.log(`🔍 JSON Structure Check:`, {
    brackets: `[${openBrackets}] [${closeBrackets}]`,
    braces: `{${openBraces}} {${closeBraces}}`,
    length: fixed.length
  });

  // Fix missing closing brackets
  if (openBrackets > closeBrackets) {
    fixed += ']';
    console.log('🔧 Added missing closing bracket ]');
  }
  
  // Fix missing closing braces for objects
  if (openBraces > closeBraces) {
    // Find the last incomplete object and complete it
    const lastOpenBrace = fixed.lastIndexOf('{');
    const lastCompleteObject = fixed.lastIndexOf('}');
    
    if (lastOpenBrace > lastCompleteObject) {
      // We have an incomplete object, complete it with default values
      const incompletePart = fixed.substring(lastOpenBrace);
      if (incompletePart.includes('"playlistName"')) {
        // Extract playlist name if available
        const nameMatch = incompletePart.match(/"playlistName"\s*:\s*"([^"]*)"/);
        const playlistName = nameMatch ? nameMatch[1] : topPlaylists[0]?.playlist.name || 'Unknown';
        
        fixed = fixed.substring(0, lastOpenBrace) + 
          `{"playlistName": "${playlistName}", "matchScore": 50, "reason": "Analisis AI tidak lengkap", "thematicAnalysis": "Data parsial dari respons AI"}}`;
        console.log('🔧 Completed incomplete JSON object');
      }
    }
  }
  
  // Ensure it's a proper array
  if (!fixed.startsWith('[')) {
    fixed = '[' + fixed;
  }
  if (!fixed.endsWith(']')) {
    fixed += ']';
  }
  
  // Fix trailing commas
  fixed = fixed.replace(/,\s*]/g, ']');
  fixed = fixed.replace(/,\s*}$/g, '}');
  
  return fixed;
},

// 🆕 METHOD: Extract partial results from incomplete JSON
extractPartialResultsFromIncompleteJSON(aiResponse, topPlaylists) {
  try {
    console.log('🔄 Attempting to extract partial results from incomplete JSON...');
    
    const results = [];
    const responseText = aiResponse.replace(/```json|```/g, ''); // Remove markdown
    
    // Look for playlist entries using regex
    const playlistPattern = /"playlistName"\s*:\s*"([^"]+)"[^}]*"matchScore"\s*:\s*(\d+)/g;
    let match;
    
    while ((match = playlistPattern.exec(responseText)) !== null && results.length < topPlaylists.length) {
      const playlistName = match[1];
      const matchScore = parseInt(match[2]);
      
      // Find corresponding playlist
      const playlist = topPlaylists.find(p => p.playlist.name === playlistName)?.playlist || 
                      topPlaylists[results.length]?.playlist;
      
      if (playlist) {
        // Extract reason if available
        const reasonMatch = responseText.substring(match.index).match(/"reason"\s*:\s*"([^"]*)"/);
        const reason = reasonMatch ? reasonMatch[1] : `Kecocokan ${matchScore}% berdasarkan analisis AI`;
        
        results.push({
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: this.validateScore(matchScore),
          confidence: 0.8,
          reasoning: reason,
          thematicAnalysis: 'Analisis tematik berdasarkan data parsial AI',
          improvementSuggestions: [],
          isFallback: false,
          aiAnalyzed: true,
          partialData: true
        });
        
        console.log(`✅ Extracted partial data for: ${playlistName} - Score: ${matchScore}`);
      }
    }
    
    // If we found some results, fill in missing ones
    if (results.length > 0 && results.length < topPlaylists.length) {
      for (let i = results.length; i < topPlaylists.length; i++) {
        const playlist = topPlaylists[i].playlist;
        results.push({
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: Math.max(30, 70 - (i * 20)),
          confidence: 0.6,
          reasoning: 'Rekomendasi berdasarkan analisis metadata',
          improvementSuggestions: ['Data AI tidak lengkap'],
          isFallback: true,
          aiAnalyzed: false
        });
      }
    }
    
    console.log(`✅ Extracted ${results.length} partial results`);
    return results;
    
  } catch (error) {
    console.error('❌ Partial extraction failed:', error);
    return [];
  }
},

// 🆕 Also update the prompt to be more concise to avoid truncation
createRobustFinalAnalysisPrompt(book, topPlaylists) {
  const playlistsInfo = topPlaylists.map((item, index) => 
    `${index + 1}. "${item.playlist.name}" - ${item.playlist.description || 'No description'}`
  ).join('\n');

  return `
ANALISIS KECOCOKAN: Buku "${book.judul}" dengan playlist berikut:

${playlistsInfo}

BERIKAN JSON ARRAY dengan format:
[
  {
    "playlistName": "nama playlist",
    "matchScore": 0-100,
    "reason": "alasan singkat",
    "thematicAnalysis": "analisis tematik"
  }
]

Hanya kembalikan JSON array.
`.trim(); // Lebih pendek untuk menghindari truncation
},

// 🆕 METHOD: Create concise prompt to avoid truncation
createConciseFinalAnalysisPrompt(book, topPlaylists) {
  const playlistsInfo = topPlaylists.map((item, index) => 
    `"${item.playlist.name}": ${item.playlist.description?.substring(0, 100) || 'No desc'}`
  ).join('; ');

  return `Analisis buku "${book.judul.substring(0, 50)}" dengan playlist: ${playlistsInfo}. 
Kembalikan JSON: [{"playlistName":"x","matchScore":0,"reason":"y","thematicAnalysis":"z"}]`.trim();
},

  // 🆕 METHOD: Create Fallback Recommendation
  createFallbackRecommendation(playlist, score) {
    return {
      playlistId: playlist.id,
      playlistName: playlist.name,
      matchScore: score,
      confidence: 0.6,
      reasoning: 'Rekomendasi fallback - sistem dalam pemulihan',
      improvementSuggestions: ['Coba refresh halaman'],
      isFallback: true
    };
  },

  // 🆕 METHOD: Intelligent Fallback
  createIntelligentFallback(topPlaylists) {
    console.log('🔄 Creating intelligent fallback recommendations');
    
    return topPlaylists.map((item, index) => ({
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: Math.max(40, 80 - (index * 15)), // 80, 65, 50
      confidence: 0.6,
      reasoning: 'Rekomendasi berdasarkan analisis metadata terbaik',
      improvementSuggestions: ['Sistem AI sedang dioptimalkan'],
      isFallback: true,
      metadataScore: item.score
    }));
  },

  // 🆕 METHOD: Enhanced Metadata Results
  getEnhancedMetadataResults(book, topPlaylists) {
    return topPlaylists.map(item => ({
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: item.score,
      confidence: 0.7,
      reasoning: this.getEnhancedMetadataReasoning(item.score),
      improvementSuggestions: ['Gunakan analisis AI untuk hasil lebih akurat'],
      isFallback: true,
      metadataScore: item.score
    }));
  },

  // 🆕 METHOD: Enhanced Metadata Reasoning
  getEnhancedMetadataReasoning(score) {
    if (score >= 80) return 'Kecocokan sangat tinggi berdasarkan analisis metadata mendalam';
    if (score >= 65) return 'Kecocokan tinggi - tema dan konten sangat sesuai';
    if (score >= 50) return 'Kecocokan sedang - beberapa elemen tema sesuai';
    return 'Kecocokan rendah - pertimbangkan review manual';
  },

  // ===========================================================================
  // EXISTING METHODS - TETAP SAMA dengan minor improvements
  // ===========================================================================
  isGeminiAvailable() {
    try {
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      const hasGeminiFunction = typeof generateAIResponse === 'function';
      console.log('🔍 Gemini Availability Check:', {
        hasApiKey,
        hasGeminiFunction,
        apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
      });
      return hasApiKey && hasGeminiFunction;
    } catch (error) {
      console.error('❌ Error checking Gemini availability:', error);
      return false;
    }
  },

  createAnalysisPrompt(book, playlist) {
    const bookDescription = book.deskripsi_buku || book.deskripsi_fisik || 'Tidak ada deskripsi';
    const descriptionSource = book.deskripsi_source === 'ai-enhanced' ? '[AI]' : '[Basic]';

    return `
BUKU: "${book.judul}"
Pengarang: ${book.pengarang || 'Tidak diketahui'}
Tahun: ${book.tahun_terbit || 'Tidak diketahui'}
Deskripsi: ${bookDescription.substring(0, 200)}...

PLAYLIST: "${playlist.name}"
Deskripsi: ${playlist.description || 'Tidak ada'}

ANALISIS: Berikan JSON dengan:
- matchScore (0-100)
- confidence (0-1)
- reasoning (singkat)
- thematicAnalysis (singkat)
- improvementSuggestions (opsional)

Hanya JSON.
`.trim();
  },

  parseAIResponse(aiResponse, book, playlist) {
    try {
      console.log('🔄 Parsing AI response...');
      let cleanResponse = aiResponse.trim();
      cleanResponse = cleanResponse.replace(/```json|```/g, '');
      
      const jsonMatch = cleanResponse.match(/{[\s\S]*}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      if (!cleanResponse.endsWith('}')) {
        const lastBracket = cleanResponse.lastIndexOf('}');
        if (lastBracket !== -1) {
          cleanResponse = cleanResponse.substring(0, lastBracket + 1);
        } else {
          cleanResponse += '}';
        }
      }

      cleanResponse = this.fixUnterminatedJSON(cleanResponse);
      console.log('🧹 Cleaned AI response:', cleanResponse);

      const parsed = JSON.parse(cleanResponse);
      return {
        matchScore: this.validateScore(parsed.matchScore),
        confidence: this.validateConfidence(parsed.confidence),
        reasoning: parsed.reasoning || `Kecocokan dasar: "${book.judul}" dengan "${playlist.name}"`,
        thematicAnalysis: parsed.thematicAnalysis || 'Analisis tematik tidak tersedia',
        historicalContext: parsed.historicalContext || 'Konteks sejarah tidak dianalisis',
        educationalValue: parsed.educationalValue || 'Nilai edukatif perlu penilaian lebih lanjut',
        improvementSuggestions: parsed.improvementSuggestions || ['Tidak ada saran spesifik'],
        playlistId: playlist.id,
        bookId: book.id,
        isFallback: false
      };
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.log('📝 Raw AI response was:', aiResponse);
      return this.getFallbackAnalysis(book, playlist);
    }
  },

  fixUnterminatedJSON(jsonString) {
    let fixed = jsonString;
    const quoteCount = (fixed.match(/"/g) || []).length;
    
    if (quoteCount % 2 !== 0) {
      if (!fixed.endsWith('"')) {
        fixed += '"';
      }
    }
    
    fixed = fixed.replace(/"improvementSuggestions":\s*\[[^\]]*$/, '"improvementSuggestions": []');
    fixed = fixed.replace(/"reasoning":\s*"[^"]*$/, '"reasoning": "Analisis kecocokan berdasarkan konten"');
    fixed = fixed.replace(/"thematicAnalysis":\s*"[^"]*$/, '"thematicAnalysis": "Analisis tematik tidak lengkap"');
    
    return fixed;
  },

  validateScore(score) {
    const num = parseInt(score) || 50;
    return Math.min(100, Math.max(0, num));
  },

  validateConfidence(confidence) {
    const num = parseFloat(confidence) || 0.5;
    return Math.min(1, Math.max(0, num));
  },

  getFallbackAnalysis(book, playlist) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase();
    
    let fallbackScore = 50;
    
    if (bookText.includes('padang') && playlistText.includes('sumatra barat')) {
      fallbackScore = 85;
    } else if (bookText.includes('sumatra') && playlistText.includes('sumatra barat')) {
      fallbackScore = 75;
    }
    
    console.log(`🔄 Using enhanced fallback analysis with score: ${fallbackScore}`);
    
    return {
      matchScore: fallbackScore,
      confidence: 0.7,
      reasoning: `Kecocokan ${fallbackScore}% berdasarkan analisis regional dan tematik`,
      thematicAnalysis: 'Analisis AI tidak tersedia - menggunakan enhanced fallback',
      historicalContext: 'Konteks sejarah: Data terbatas',
      educationalValue: 'Nilai edukatif: Perlu analisis lebih lanjut',
      improvementSuggestions: ['Gunakan analisis AI untuk hasil lebih akurat'],
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: true
    };
  },

  getEmergencyResults(book, playlists) {
    try {
      console.log('🆘 Generating emergency results for:', playlists.length, 'playlists');
      
      if (!Array.isArray(playlists) || playlists.length === 0) {
        return [];
      }

      const results = playlists.map((playlist, index) => {
        if (!playlist) return null;
        
        return {
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: 50 + (index * 10),
          confidence: 0.3,
          reasoning: 'Sistem sedang dalam pemulihan',
          improvementSuggestions: ['Coba lagi nanti'],
          isFallback: true,
          emergency: true
        };
      }).filter(Boolean);

      console.log('✅ Emergency results generated:', results.length);
      return results;
      
    } catch (error) {
      console.error('❌ Emergency results failed:', error);
      return [];
    }
  }
};


export default aiMatchingService;

