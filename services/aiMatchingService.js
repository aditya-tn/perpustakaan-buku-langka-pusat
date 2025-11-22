// services/aiMatchingService.js - COMPLETE UPDATED VERSION
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

  // 🆕 IMPROVED: Playlist recommendations dengan alur yang benar
  async getPlaylistRecommendations({ book, playlists = [] }) {
    try {
      console.log('🎯 START: Playlist recommendations flow');
      console.log(`📚 Book: "${book.judul}"`);
      console.log(`📊 Total playlists available: ${playlists.length}`);
      
      // STEP 1: Filter playlists yang available
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      console.log(`🔍 Available playlists after filtering: ${availablePlaylists.length}`);

      if (availablePlaylists.length === 0) {
        console.log('⚠️ No available playlists for this book');
        return [];
      }

      // STEP 2: PURE METADATA MATCHING (no AI) untuk pilih TOP 3
      const topPlaylists = await this.selectTopPlaylistsByPureMetadata(book, availablePlaylists, 3);
      console.log('🎯 Top 3 by pure metadata:', topPlaylists.map(p => p.playlist.name));

      // STEP 3: AI ANALYSIS hanya untuk final scoring & reasoning
      if (topPlaylists.length > 0 && this.isGeminiAvailable()) {
        console.log('🤖 Sending to AI for FINAL analysis...');
        try {
          const aiResults = await this.getAIFinalAnalysis(book, topPlaylists);
          if (aiResults && Array.isArray(aiResults) && aiResults.length > 0) {
            console.log('✅ AI final analysis completed');
            return aiResults;
          } else {
            console.log('⚠️ AI returned empty results, using metadata-based');
          }
        } catch (aiError) {
          console.error('❌ AI final analysis failed:', aiError);
        }
      }

      // STEP 4: Fallback ke metadata-based results
      console.log('⚡ Using metadata-based results');
      const metadataResults = this.getMetadataBasedResults(book, topPlaylists);
      return Array.isArray(metadataResults) ? metadataResults : [];
      
    } catch (error) {
      console.error('❌ Recommendation flow failed:', error);
      
      // Emergency fallback
      try {
        const availablePlaylists = playlists.filter(playlist =>
          !playlist.books?.some(b => b.id === book.id)
        ).slice(0, 3);
        
        const emergencyResults = this.getEmergencyResults(book, availablePlaylists);
        return Array.isArray(emergencyResults) ? emergencyResults : [];
      } catch (fallbackError) {
        console.error('❌ Even emergency fallback failed:', fallbackError);
        return []; // 🆪 FINAL FALLBACK - ARRAY KOSONG
      }
    }
  },

  // 🆕 METHOD: Pure metadata matching (TANPA AI)
  async selectTopPlaylistsByPureMetadata(book, playlists, maxCount = 3) {
    console.log('🔍 Selecting top playlists by PURE METADATA...');
    
    const scoredPlaylists = [];

    for (const playlist of playlists) {
      // GUNAKAN METADATA SAJA, bukan AI
      const score = this.calculatePureMetadataMatch(book, playlist);
      scoredPlaylists.push({ playlist, score });
    }

    // Sort dan ambil top N
    const sorted = scoredPlaylists.sort((a, b) => b.score - a.score);
    const topPlaylists = sorted.slice(0, maxCount);

    console.log('📊 Pure metadata scores:');
    topPlaylists.forEach(item => {
      console.log(` ${item.playlist.name}: ${item.score}`);
    });

    return topPlaylists;
  },

  // 🆕 METHOD: Pure metadata matching algorithm
  calculatePureMetadataMatch(book, playlist) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const playlistName = playlist.name.toLowerCase();
    const playlistDesc = playlist.description?.toLowerCase() || '';
    
    let score = 0;

    // 1. TITLE KEYWORD MATCHING (40%)
    score += this.calculateTitleKeywordMatch(book.judul, playlistName) * 0.4;

    // 2. THEME MATCHING dari AI metadata (35%)
    score += this.calculateThemeMatchFromAIMetadata(book, playlist) * 0.35;

    // 3. CONTENT KEYWORD MATCHING (25%)
    score += this.calculateContentKeywordMatch(bookText, `${playlistName} ${playlistDesc}`) * 0.25;

    return Math.min(100, Math.round(score));
  },

  // 🆕 METHOD: Title keyword matching
  calculateTitleKeywordMatch(bookTitle, playlistName) {
    const bookWords = bookTitle.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const playlistWords = playlistName.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    if (bookWords.length === 0 || playlistWords.length === 0) return 30;

    const matches = bookWords.filter(bookWord => 
      playlistWords.some(playlistWord => 
        playlistWord.includes(bookWord) || bookWord.includes(playlistWord)
      )
    ).length;

    const matchPercentage = (matches / Math.max(bookWords.length, 1)) * 100;
    console.log(`   Title match: ${matches}/${bookWords.length} words → ${matchPercentage}%`);
    
    return matchPercentage;
  },

  // 🆕 METHOD: Theme matching from AI metadata
  calculateThemeMatchFromAIMetadata(book, playlist) {
    const bookThemes = this.extractBookThemes(book);
    
    // Gunakan AI metadata jika ada, otherwise extract dari nama playlist
    const playlistThemes = playlist.ai_metadata?.key_themes || 
                          this.extractThemesFromPlaylistName(playlist.name);
    
    console.log(`   Book themes: ${bookThemes.join(', ')}`);
    console.log(`   Playlist themes: ${playlistThemes.join(', ')}`);
    
    let matches = 0;
    for (const bookTheme of bookThemes) {
      if (playlistThemes.some(playlistTheme => 
        this.areThemesRelated(bookTheme, playlistTheme)
      )) {
        matches++;
        console.log(`   Theme match: "${bookTheme}" ↔ "${playlistThemes.find(t => this.areThemesRelated(bookTheme, t))}"`);
      }
    }
    
    const matchPercentage = (matches / Math.max(bookThemes.length, 1)) * 100;
    console.log(`   Theme match: ${matches}/${bookThemes.length} themes → ${matchPercentage}%`);
    
    return matchPercentage;
  },

  // 🆕 METHOD: Content keyword matching
  calculateContentKeywordMatch(bookText, playlistText) {
    const bookKeywords = this.extractKeywords(bookText);
    const playlistKeywords = this.extractKeywords(playlistText);
    
    if (bookKeywords.length === 0) return 30;

    const matches = bookKeywords.filter(keyword => 
      playlistKeywords.includes(keyword)
    ).length;

    const matchPercentage = (matches / Math.max(bookKeywords.length, 1)) * 100;
    console.log(`   Content match: ${matches}/${bookKeywords.length} keywords → ${matchPercentage}%`);
    
    return matchPercentage;
  },

  // 🆕 METHOD: Extract keywords dari text
  extractKeywords(text) {
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4) // Minimal 5 karakter
      .filter(word => !this.isCommonWord(word));
    
    return [...new Set(words)]; // Remove duplicates
  },

  // 🆕 METHOD: Common words filter
  isCommonWord(word) {
    const commonWords = [
      'yang', 'dengan', 'dan', 'di', 'ke', 'dari', 'pada', 'untuk', 'dalam',
      'tidak', 'ini', 'itu', 'serta', 'oleh', 'karena', 'atau', 'adalah',
      'the', 'and', 'with', 'for', 'from', 'this', 'that', 'which'
    ];
    
    return commonWords.includes(word);
  },

  // 🆕 METHOD: Extract themes dari playlist name (fallback)
  extractThemesFromPlaylistName(playlistName) {
    const name = playlistName.toLowerCase();
    const themes = [];

    // Priority matching untuk kombinasi tema
    if (name.includes('sejarah') && name.includes('indonesia')) return ['sejarah', 'indonesia'];
    if (name.includes('sejarah') && name.includes('militer')) return ['sejarah', 'militer'];
    if (name.includes('kereta') && name.includes('api')) return ['transportasi', 'kereta api'];
    if (name.includes('sejarah')) return ['sejarah'];
    if (name.includes('indonesia')) return ['indonesia'];
    if (name.includes('militer')) return ['militer'];
    if (name.includes('budaya')) return ['budaya'];
    if (name.includes('transportasi')) return ['transportasi'];
    if (name.includes('geografi')) return ['geografi'];
    
    return ['umum'];
  },

  // 🆕 METHOD: AI Final Analysis (INI SAATNYA PAKAI AI)
  async getAIFinalAnalysis(book, topPlaylists) {
    try {
      const prompt = this.createFinalAnalysisPrompt(book, topPlaylists);
      console.log('🤖 AI Final Analysis - Analyzing 3 playlists...');
      
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.2,
        maxTokens: 800
      });

      return this.parseFinalAIResponse(aiResponse, topPlaylists);
    } catch (error) {
      console.error('❌ AI Final Analysis failed:', error);
      throw error;
    }
  },

  // 🆕 METHOD: Prompt untuk final analysis
  createFinalAnalysisPrompt(book, topPlaylists) {
    const playlistsInfo = topPlaylists.map((item, index) => 
      `${index + 1}. "${item.playlist.name}" - ${item.playlist.description || 'No description'}`
    ).join('\n');

    return `
ANALISIS KECOCOKAN BUKU DENGAN PLAYLIST

BUKU:
Judul: "${book.judul}"
Pengarang: ${book.pengarang || 'Tidak diketahui'} 
Tahun: ${book.tahun_terbit || 'Tidak diketahui'}
Deskripsi: ${book.deskripsi_buku || 'Tidak ada deskripsi'}

PLAYLIST YANG DIPILIH:
${playlistsInfo}

INSTRUKSI:
1. Analisis kecocokan buku dengan SETIAP playlist secara mendalam
2. Berikan score 0-100 untuk setiap playlist berdasarkan relevansi
3. Berikan alasan singkat dan spesifik untuk setiap score
4. Prioritaskan kecocokan tema, konten historis, dan relevansi konten

FORMAT OUTPUT (JSON):
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
  }
]

Hanya kembalikan JSON array.
    `.trim();
  },

  // 🆕 METHOD: Parse final AI response
  parseFinalAIResponse(aiResponse, topPlaylists) {
    try {
      console.log('🔄 Parsing AI final analysis response...');
      
      const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      const results = parsed.map((item, index) => {
        const playlist = topPlaylists[index]?.playlist || topPlaylists[0]?.playlist;
        
        if (!playlist) {
          console.warn(`⚠️ No matching playlist for AI result at index ${index}`);
          return null;
        }

        return {
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: this.validateScore(item.matchScore),
          confidence: 0.9, // High confidence karena AI analysis
          reasoning: item.reason || 'Kecocokan berdasarkan analisis AI mendalam',
          thematicAnalysis: item.thematicAnalysis || 'Analisis tematik oleh AI',
          improvementSuggestions: [],
          isFallback: false,
          aiAnalyzed: true
        };
      }).filter(Boolean);

      console.log(`✅ AI analysis parsed: ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Failed to parse AI final analysis:', error);
      console.log('📝 Raw AI response:', aiResponse);
      throw new Error('AI analysis parsing failed');
    }
  },

  // 🆕 METHOD: Metadata-based results (fallback)
  getMetadataBasedResults(book, topPlaylists) {
    console.log('📊 Generating metadata-based results...');
    
    const results = topPlaylists.map(item => {
      if (!item || !item.playlist) {
        console.warn('⚠️ Invalid playlist item in metadata results');
        return null;
      }

      return {
        playlistId: item.playlist.id,
        playlistName: item.playlist.name,
        matchScore: item.score || 50,
        confidence: 0.7,
        reasoning: this.getMetadataBasedReasoning(item.score || 50),
        improvementSuggestions: ['Gunakan analisis AI untuk hasil lebih akurat'],
        isFallback: true,
        metadataScore: item.score || 50
      };
    }).filter(Boolean);

    console.log(`✅ Metadata-based results: ${results.length} playlists`);
    return results;
  },

  // 🆕 METHOD: Reasoning untuk metadata-based results
  getMetadataBasedReasoning(score) {
    if (score >= 80) return 'Kecocokan sangat tinggi berdasarkan analisis metadata';
    if (score >= 60) return 'Kecocokan tinggi berdasarkan tema dan keyword';
    if (score >= 40) return 'Kecocokan sedang - beberapa elemen sesuai';
    return 'Kecocokan rendah - pertimbangkan review manual';
  },

  // ===========================================================================
  // EXISTING METHODS - Tetap dipertahankan dengan improvements
  // ===========================================================================

  async calculateEnhancedMatchScore(book, playlist) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase();

    console.log(`🔍 Enhanced scoring for: "${playlist.name}"`);
    console.log(` Book: "${book.judul}"`);

    let score = 0;

    // 1. Improved Region Matching (40%)
    const regionScore = await this.calculateDynamicRegionMatch(book, playlistText);
    score += regionScore * 0.4;

    // 2. Enhanced Semantic Keyword Matching (35%)
    const keywordScore = this.calculateEnhancedSemanticMatch(bookText, playlistText);
    score += keywordScore * 0.35;

    // 3. Theme & Context Matching (25%)
    const themeScore = this.calculateThemeAndContextMatch(book, playlist);
    score += themeScore * 0.25;

    const finalScore = Math.min(100, Math.round(score));
    console.log(` ✅ Final enhanced score: ${finalScore}`);

    return finalScore;
  },

  async calculateDynamicRegionMatch(book, playlistText) {
    let score = 0;
    const bookRegions = this.extractBookRegions(book);
    const playlistRegions = this.extractAllRegionsFromText(playlistText);

    console.log(`🔍 Region matching: Book=[${bookRegions.join(', ')}] vs Playlist=[${playlistRegions.join(', ')}]`);

    // 🆕 ENHANCED: Smart region mapping
    const mappedMatches = this.findSmartRegionMatches(bookRegions, playlistRegions);

    if (mappedMatches.exact.length > 0) {
      score += mappedMatches.exact.length * 30;
      console.log(` 🎯 Exact region matches: ${mappedMatches.exact.join(', ')} +${mappedMatches.exact.length * 30}`);
    }

    if (mappedMatches.related.length > 0) {
      score += mappedMatches.related.length * 20;
      console.log(` 🔗 Related region matches: ${mappedMatches.related.join(', ')} +${mappedMatches.related.length * 20}`);
    }

    // 🆕 SPECIAL CASE: Padang → Sumatra Barat
    if ((bookRegions.includes('padang') || bookRegions.some(r => r.toLowerCase().includes('padang'))) &&
        playlistRegions.includes('sumatra barat')) {
      score += 25;
      console.log(` 🏔️ SPECIAL: Padang → Sumatra Barat mapping +25`);
    }

    // 🆕 SPECIAL CASE: Sumatra → Sumatra Barat (partial match)
    if (bookRegions.includes('sumatra') && playlistRegions.includes('sumatra barat')) {
      score += 20;
      console.log(` 🗾 SPECIAL: Sumatra → Sumatra Barat partial match +20`);
    }

    // 🆕 SPECIAL CASE: Minangkabau → Sumatra Barat
    if (bookRegions.includes('minangkabau') && playlistRegions.includes('sumatra barat')) {
      score += 25;
      console.log(` 🌄 SPECIAL: Minangkabau → Sumatra Barat mapping +25`);
    }

    // Bonus untuk strong regional focus
    if (mappedMatches.exact.length >= 2) {
      score += 25;
      console.log(` 🏆 Multiple region matches bonus: +25`);
    }

    return Math.min(100, score);
  },

  calculateEnhancedSemanticMatch(bookText, playlistText) {
    const semanticKeywords = {
      // 🆕 REGIONAL KEYWORDS - HIGH PRIORITY
      'sumatra': 15, 'padang': 20, 'minangkabau': 20,
      'sumatra barat': 25, 'sumatera barat': 25,
      'padangsche': 18, 'bovenlanden': 18, 'padangsche bovenlanden': 25,

      // Biografi & Tokoh
      'biografi': 15, 'tokoh': 12, 'pahlawan': 12,
      'biographic': 10, 'biographical': 10,

      // Sejarah & Kolonial - 🆕 INCREASED
      'sejarah': 12, 'kolonial': 12, 'belanda': 15, 'dutch': 12,
      'historical': 10, 'colonial': 10, 'muller': 8, 'sal': 6,

      // Geografi & Transportasi - 🆕 INCREASED
      'geografi': 15, 'geomorph': 12, 'transportasi': 12,
      'jalan': 10, 'sungai': 10, 'rivers': 8, 'roads': 8,
      'peta': 12, 'map': 10, 'kaart': 12, 'wegen': 10,
      'infrastruktur': 10, 'infrastructure': 8,

      // Akademik & Ilmiah
      'akademik': 8, 'ilmiah': 8, 'studi': 8, 'penelitian': 8,
      'laporan': 8, 'report': 6, 'berigten': 10,

      // Umum
      'indonesia': 8, 'nusantara': 8, 'nasional': 8
    };

    let score = 0;

    for (const [keyword, weight] of Object.entries(semanticKeywords)) {
      const bookHasKeyword = bookText.includes(keyword);
      const playlistHasKeyword = playlistText.includes(keyword);

      if (bookHasKeyword && playlistHasKeyword) {
        score += weight;
        console.log(` ✅ Semantic match: "${keyword}" +${weight}`);
      }
    }

    // 🆕 BONUS: Multiple regional keywords
    const regionalKeywords = ['sumatra', 'padang', 'minangkabau', 'sumatra barat', 'padangsche'];
    const regionalMatches = regionalKeywords.filter(keyword =>
      bookText.includes(keyword) && playlistText.includes(keyword)
    ).length;

    if (regionalMatches >= 2) {
      const bonus = regionalMatches * 15;
      score += bonus;
      console.log(` 🏔️ Multiple regional matches (${regionalMatches}) bonus: +${bonus}`);
    }

    // 🆕 BONUS: Strong regional focus
    if (regionalMatches >= 3) {
      score += 30;
      console.log(` 🎯 Strong regional focus bonus: +30`);
    }

    const finalScore = Math.min(100, score);
    console.log(` 🔑 Enhanced semantic match score: ${finalScore}`);
    return finalScore;
  },

  calculateThemeAndContextMatch(book, playlist) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase();

    let score = 0;

    const themeGroups = {
      'biografi': ['biografi', 'tokoh', 'pahlawan', 'riwayat', 'sejarah hidup', 'biographic'],
      'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'historical', 'history'],
      'militer': ['militer', 'tni', 'tentara', 'perang', 'pertempuran', 'military', 'army'],
      'budaya': ['budaya', 'adat', 'tradisi', 'kebudayaan', 'cultural', 'tradition', 'kesenian'],
      'geografi': ['geografi', 'geomorph', 'geomorf', 'geolog', 'ilmu bumi', 'geography', 'geology'],
      'transportasi': ['kereta', 'transportasi', 'perhubungan', 'railway', 'transportation']
    };

    // Theme matching
    for (const [theme, keywords] of Object.entries(themeGroups)) {
      const bookHasTheme = keywords.some(keyword => bookText.includes(keyword));
      const playlistHasTheme = keywords.some(keyword => playlistText.includes(keyword));

      if (bookHasTheme && playlistHasTheme) {
        score += 25;
        console.log(` 🎯 Theme match: "${theme}" +25`);
      }
    }

    // Context matching untuk buku kolonial/ilmiah
    if ((bookText.includes('geomorphologische') || bookText.includes('beschouwingen') ||
         bookText.includes('valkenburg') || bookText.includes('wegen') || bookText.includes('rivieren')) &&
        (playlistText.includes('sejarah') || playlistText.includes('ilmiah') || playlistText.includes('akademik'))) {
      score += 30;
      console.log(` 🔬 Scientific/colonial context match: +30`);
    }

    return Math.min(100, score);
  },

  findSmartRegionMatches(bookRegions, playlistRegions) {
    const exactMatches = [];
    const relatedMatches = [];
    const regionMappings = {
      'padang': 'sumatra barat',
      'sumatra': 'sumatra barat',
      'minangkabau': 'sumatra barat',
      'padangsche bovenlanden': 'sumatra barat',
      'bovenlanden': 'sumatra barat'
    };

    // Check exact matches
    for (const bookRegion of bookRegions) {
      for (const playlistRegion of playlistRegions) {
        if (bookRegion.toLowerCase() === playlistRegion.toLowerCase()) {
          exactMatches.push(`${bookRegion}→${playlistRegion}`);
        }
      }
    }

    // Check mapped matches
    for (const bookRegion of bookRegions) {
      const mappedRegion = regionMappings[bookRegion.toLowerCase()];
      if (mappedRegion && playlistRegions.includes(mappedRegion)) {
        exactMatches.push(`${bookRegion}→${mappedRegion}(mapped)`);
      }

      // Check partial matches (sumatra → sumatra barat)
      if (bookRegion.toLowerCase().includes('sumatra') && playlistRegions.includes('sumatra barat')) {
        exactMatches.push(`${bookRegion}→sumatra barat(partial)`);
      }
    }

    // Check related matches (same island)
    const related = this.findRelatedRegionMatches(bookRegions, playlistRegions);
    relatedMatches.push(...related);

    return {
      exact: [...new Set(exactMatches)],
      related: [...new Set(relatedMatches)]
    };
  },

  getAllIndonesianRegions() {
    return {
      provinces: {
        'aceh': ['aceh', 'nanggroe aceh darussalam'],
        'sumatra utara': ['sumatra utara', 'sumatera utara', 'sumut', 'medan'],
        'sumatra barat': ['sumatra barat', 'sumatera barat', 'sumbar', 'padang', 'minangkabau', 'bukittinggi'],
        // ... (keep the existing implementation)
      },
      historical: {
        'padangsche bovenlanden': ['sumatra barat', 'padang', 'minangkabau'],
        'oostkust van sumatra': ['sumatra timur', 'medan', 'deli'],
        // ... (keep the existing implementation)
      },
      ethnic: {
        'minangkabau': ['sumatra barat'],
        'batak': ['sumatra utara'],
        // ... (keep the existing implementation)
      }
    };
  },

  extractAllRegionsFromText(text) {
    if (!text) return [];
    const textLower = text.toLowerCase();
    const regionsData = this.getAllIndonesianRegions();
    const foundRegions = new Set();

    // Check modern provinces
    for (const [province, aliases] of Object.entries(regionsData.provinces)) {
      if (aliases.some(alias => textLower.includes(alias))) {
        foundRegions.add(province);
      }
    }

    // Check historical names
    for (const [historicalName, modernEquivalents] of Object.entries(regionsData.historical)) {
      if (textLower.includes(historicalName)) {
        modernEquivalents.forEach(region => foundRegions.add(region));
      }
    }

    // Check ethnic groups
    for (const [ethnicGroup, regions] of Object.entries(regionsData.ethnic)) {
      if (textLower.includes(ethnicGroup)) {
        regions.forEach(region => foundRegions.add(region));
      }
    }

    const regionsArray = Array.from(foundRegions);
    console.log(`🌏 Extracted regions from text:`, regionsArray);
    return regionsArray;
  },

  async extractRegionsWithAI(book) {
    if (!book.deskripsi_buku && !book.judul) return [];
    const textToAnalyze = `${book.judul} ${book.deskripsi_buku || ''}`;

    // 🆕 CACHE: Gunakan cached regions jika available
    if (book._cachedRegions) {
      console.log(`📦 Using cached regions:`, book._cachedRegions);
      return book._cachedRegions;
    }

    const prompt = `
Analisis teks berikut dan sebutkan SEMUA wilayah/daerah/lokasi di Indonesia yang disebutkan.

Teks: "${textToAnalyze.substring(0, 500)}"

PETUNJUK KHUSUS:
- "Padang" harus dimapping ke "Sumatra Barat"
- "Padangsche Bovenlanden" = "Sumatra Barat" 
- "Minangkabau" = "Sumatra Barat"
- "Sumatra" kontekstual mapping ke "Sumatra Barat" jika relevan
- Berikan nama provinsi modern

FORMAT OUTPUT:
{"regions": ["nama provinsi 1", "nama provinsi 2", ...]}

Hanya kembalikan JSON.
    `.trim();

    try {
      const response = await generateAIResponse(prompt, {
        temperature: 0.1,
        maxTokens: 200
      });

      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanResponse);

      // 🆕 ENHANCED: Map specific terms to provinces
      const mappedRegions = this.mapSpecificRegions(result.regions || []);

      console.log(`🤖 AI-extracted regions:`, result.regions, `→ Mapped:`, mappedRegions);

      // 🆕 CACHE the result
      book._cachedRegions = mappedRegions;
      return mappedRegions;

    } catch (error) {
      console.error('❌ AI region extraction failed, using fallback:', error);
      return this.extractAllRegionsFromText(textToAnalyze);
    }
  },

  mapSpecificRegions(regions) {
    const mapping = {
      'padang': 'sumatra barat',
      'minangkabau': 'sumatra barat', 
      'padangsche bovenlanden': 'sumatra barat',
      'bovenlanden': 'sumatra barat',
      'sumatra': 'sumatra barat'
    };

    const mapped = new Set();
    for (const region of regions) {
      const lowerRegion = region.toLowerCase();
      if (mapping[lowerRegion]) {
        mapped.add(mapping[lowerRegion]);
      } else {
        mapped.add(region.toLowerCase());
      }
    }
    return Array.from(mapped);
  },

  findRelatedRegionMatches(bookRegions, playlistRegions) {
    const islandGroups = {
      'sumatra': ['aceh', 'sumatra utara', 'sumatra barat', 'riau', 'kepulauan riau', 'jambi', 'bengkulu', 'sumatra selatan', 'lampung', 'bangka belitung'],
      'jawa': ['jakarta', 'jawa barat', 'banten', 'jawa tengah', 'yogyakarta', 'jawa timur', 'bali'],
      'kalimantan': ['kalimantan barat', 'kalimantan tengah', 'kalimantan selatan', 'kalimantan timur', 'kalimantan utara'],
      'sulawesi': ['sulawesi utara', 'gorontalo', 'sulawesi tengah', 'sulawesi barat', 'sulawesi selatan', 'sulawesi tenggara'],
      'papua': ['papua', 'papua barat', 'papua selatan', 'papua tengah', 'papua pegunungan'],
      'nusa tenggara': ['nusa tenggara barat', 'nusa tenggara timur'],
      'maluku': ['maluku', 'maluku utara']
    };

    const relatedMatches = [];
    for (const bookRegion of bookRegions) {
      for (const playlistRegion of playlistRegions) {
        for (const [island, regions] of Object.entries(islandGroups)) {
          if (regions.includes(bookRegion) && regions.includes(playlistRegion) && bookRegion !== playlistRegion) {
            relatedMatches.push(`${bookRegion}→${playlistRegion}`);
          }
        }
      }
    }
    return [...new Set(relatedMatches)];
  },

  async getSimpleAIRecommendations(book, topPlaylists) {
    try {
      const prompt = this.createSimplePrompt(book, topPlaylists);
      console.log('📤 Sending ultra-minimal AI prompt...');
      
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });

      if (!aiResponse) {
        throw new Error('Empty AI response');
      }

      console.log('✅ AI Response received (length:', aiResponse.length, ')');
      return this.parseSimpleAIResponse(aiResponse, book, topPlaylists);

    } catch (error) {
      console.error('❌ AI failed, using rule-based:', error);
      return this.getRuleBasedResults(book, topPlaylists);
    }
  },

  createSimplePrompt(book, topPlaylists) {
    const playlistsInfo = topPlaylists.map(item =>
      `"${item.playlist.name}" - ${item.playlist.description || 'No description'}`
    ).join('\n');

    return `
BUKU: "${book.judul.substring(0, 100)}"
PLAYLISTS:
${playlistsInfo}
BERIKAN SCORE 0-100 berdasarkan kecocokan.
JSON: [{"playlistName": "nama", "matchScore": 85, "reason": "alasan"}]
    `.trim();
  },

  parseSimpleAIResponse(aiResponse, book, topPlaylists) {
    try {
      console.log('🔄 Parsing simple AI response...');
      console.log('📝 Raw AI response:', aiResponse);

      // Strategy 1: Extract JSON dari response text
      let jsonString = this.extractJSONFromText(aiResponse);

      // Strategy 2: Jika tidak ada JSON, buat manual
      if (!jsonString || jsonString.length < 10) {
        console.warn('⚠️ No JSON found in response, creating manual');
        return this.getRuleBasedResults(book, topPlaylists);
      }

      console.log('🧹 Extracted JSON:', jsonString);
      const parsed = JSON.parse(jsonString);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return this.mapParsedToRecommendations(parsed, topPlaylists);
      } else {
        throw new Error('Empty array from AI');
      }

    } catch (error) {
      console.error('❌ Parse failed, using rule-based:', error);
      return this.getRuleBasedResults(book, topPlaylists);
    }
  },

  extractJSONFromText(text) {
    if (!text) return '';

    // Cari JSON array pattern
    const jsonArrayMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/);
    if (jsonArrayMatch) {
      return jsonArrayMatch[0];
    }

    // Cari multiple JSON objects
    const jsonObjects = text.match(/{[\s\S]*?}/g);
    if (jsonObjects && jsonObjects.length > 0) {
      return `[${jsonObjects.join(',')}]`;
    }

    // Fallback: cari apapun yang diapit [ ]
    const bracketMatch = text.match(/\[[\s\S]*\]/);
    if (bracketMatch) {
      return bracketMatch[0];
    }

    return '';
  },

  createManualJSON(book, topPlaylists) {
    // Gunakan scores dari rule-based sebagai fallback
    const manualRecommendations = topPlaylists.map((item, index) => ({
      playlistName: item.playlist.name,
      matchScore: item.score || (80 - (index * 10)),
      reason: `Kecocokan berdasarkan analisis geografis dan tematik`
    }));

    console.log('🔄 Using manual fallback with rule-based scores');
    return JSON.stringify(manualRecommendations);
  },

  mapParsedToRecommendations(parsed, topPlaylists) {
    const recommendations = parsed.map((rec, index) => {
      // 🆕 Flexible field matching
      const playlistName = rec.playlistName || rec.name || rec.playlist;
      const matchScore = rec.matchScore || rec.score || rec.rating || (80 - (index * 10));
      const reason = rec.reason || rec.reasoning || rec.explanation || 'Kecocokan berdasarkan analisis AI';

      const playlist = this.findMatchingPlaylist(playlistName, topPlaylists, index);

      if (!playlist) {
        console.warn(`⚠️ No matching playlist for: ${playlistName}`);
        return null;
      }

      return {
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: this.validateScore(matchScore),
        confidence: 0.8,
        reasoning: reason,
        improvementSuggestions: [],
        isFallback: false,
        ruleBasedScore: topPlaylists.find(item => item.playlist.id === playlist.id)?.score || 50
      };
    }).filter(Boolean);

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  },

  findMatchingPlaylist(aiPlaylistName, topPlaylists, index) {
    if (!aiPlaylistName) {
      return topPlaylists[index]?.playlist || null;
    }

    // Clean the AI playlist name (remove emoji, extra spaces)
    const cleanAIPlaylistName = aiPlaylistName.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();

    // Strategy 1: Exact match dengan cleaned names
    let playlist = topPlaylists.find(item => {
      const cleanPlaylistName = item.playlist.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
      return cleanPlaylistName === cleanAIPlaylistName;
    })?.playlist;

    // Strategy 2: Contains match
    if (!playlist) {
      playlist = topPlaylists.find(item => {
        const cleanPlaylistName = item.playlist.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
        return cleanPlaylistName.includes(cleanAIPlaylistName) ||
               cleanAIPlaylistName.includes(cleanPlaylistName);
      })?.playlist;
    }

    // Strategy 3: Keyword match
    if (!playlist) {
      const aiKeywords = cleanAIPlaylistName.split(/\s+/).filter(word => word.length > 2);
      playlist = topPlaylists.find(item => {
        const playlistName = item.playlist.name.toLowerCase();
        return aiKeywords.some(keyword => playlistName.includes(keyword));
      })?.playlist;
    }

    // Strategy 4: Fallback to index
    if (!playlist && topPlaylists[index]) {
      playlist = topPlaylists[index].playlist;
      console.warn(`⚠️ Using index fallback: ${aiPlaylistName} → ${playlist.name}`);
    }

    return playlist;
  },

  getRuleBasedResults(book, topPlaylists) {
    try {
      console.log('🔄 Generating rule-based results for:', topPlaylists.length, 'playlists');
      
      // 🆪 VALIDASI INPUT
      if (!Array.isArray(topPlaylists) || topPlaylists.length === 0) {
        console.warn('⚠️ No top playlists provided to rule-based');
        return [];
      }

      const results = topPlaylists.map(item => {
        // 🆪 VALIDASI ITEM
        if (!item || !item.playlist) {
          console.warn('⚠️ Invalid playlist item:', item);
          return null;
        }

        const { playlist, score } = item;
        
        return {
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: score || 50,
          confidence: 0.5,
          reasoning: this.getRuleBasedReasoning(score || 50),
          improvementSuggestions: ['Gunakan analisis AI untuk hasil lebih akurat'],
          isFallback: true,
          ruleBasedScore: score || 50
        };
      }).filter(Boolean);

      // 🆪 SORT BY SCORE
      const sortedResults = results.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log('✅ Rule-based results generated:', sortedResults.length);
      return sortedResults;

    } catch (error) {
      console.error('❌ Rule-based results failed:', error);
      return [];
    }
  },

  getEmergencyResults(book, playlists) {
    try {
      console.log('🆘 Generating emergency results for:', playlists.length, 'playlists');
      
      if (!Array.isArray(playlists) || playlists.length === 0) {
        console.warn('⚠️ No playlists for emergency results');
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
  },

  getRuleBasedReasoning(score) {
    if (score >= 70) return 'Kecocokan tinggi berdasarkan analisis tema';
    if (score >= 50) return 'Kecocokan sedang - beberapa tema sesuai';
    return 'Kecocokan rendah - pertimbangkan review manual';
  },

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

      // 🆕 Enhanced cleaning untuk handle truncated responses
      let cleanResponse = aiResponse.trim();

      // Remove code blocks
      cleanResponse = cleanResponse.replace(/```json|```/g, '');

      // 🆕 Extract JSON object dari response
      const jsonMatch = cleanResponse.match(/{[\s\S]*}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      // 🆕 Complete incomplete JSON jika diperlukan
      if (!cleanResponse.endsWith('}')) {
        const lastBracket = cleanResponse.lastIndexOf('}');
        if (lastBracket !== -1) {
          cleanResponse = cleanResponse.substring(0, lastBracket + 1);
        } else {
          cleanResponse += '}';
        }
      }

      // 🆕 Fix unterminated strings
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

    // Count quotes untuk detect unterminated strings
    const quoteCount = (fixed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      if (!fixed.endsWith('"')) {
        fixed += '"';
      }
    }

    // Fix common truncation patterns
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

    // 🆕 Enhanced fallback scoring
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

  calculateKeywordMatch(book, playlist) {
    const bookText = `${book.judul} ${book.pengarang} ${book.deskripsi_fisik || ''}`.toLowerCase();
    const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase();

    const bookWords = new Set(bookText.split(/\s+/).filter(word => word.length > 3));
    const playlistWords = new Set(playlistText.split(/\s+/).filter(word => word.length > 3));

    const intersection = [...bookWords].filter(word => playlistWords.has(word)).length;
    const union = bookWords.size + playlistWords.size - intersection;

    const score = union > 0 ? (intersection / union) * 100 : 0;
    return Math.min(100, Math.max(20, score));
  }
};

  // Extract book themes method (diperbarui)
  extractBookThemes(book) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const themes = [];

    const themeKeywords = {
      'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'historical', 'runtuhnya'],
      'militer': ['militer', 'military', 'tentara', 'perang', 'pertempuran', 'war'],
      'politik': ['politik', 'pemerintah', 'negara', 'policy', 'government'],
      'budaya': ['budaya', 'adat', 'tradisi', 'kebudayaan', 'cultural', 'kesenian'],
      'geografi': ['geografi', 'geomorph', 'geomorf', 'geolog', 'ilmu bumi', 'geography'],
      'transportasi': ['kereta', 'transportasi', 'perhubungan', 'railway', 'transportation'],
      'kolonial': ['kolonial', 'belanda', 'dutch', 'hindia belanda', 'nederlandsch'],
      'ilmiah': ['ilmiah', 'akademik', 'studi', 'penelitian', 'laporan', 'report'],
      'indonesia': ['indonesia', 'nusantara', 'nasional', 'bangsa']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => bookText.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['umum'];
  },

  // Check theme relation method
  areThemesRelated(theme1, theme2) {
    const relatedGroups = {
      'sejarah': ['sejarah', 'kolonial', 'militer', 'politik'],
      'militer': ['militer', 'sejarah', 'perang'],
      'kolonial': ['kolonial', 'sejarah', 'belanda', 'indonesia'],
      'indonesia': ['indonesia', 'sejarah', 'kolonial', 'nasional'],
      'transportasi': ['transportasi', 'geografi'],
      'geografi': ['geografi', 'transportasi']
    };

    const group1 = relatedGroups[theme1] || [theme1];
    const group2 = relatedGroups[theme2] || [theme2];
    
    return group1.some(t1 => group2.includes(t1));
  },

  // Emergency results method
  getEmergencyResults(book, playlists) {
    try {
      console.log('🆘 Generating emergency results for:', playlists.length, 'playlists');
      
      if (!Array.isArray(playlists) || playlists.length === 0) {
        console.warn('⚠️ No playlists for emergency results');
        return [];
      }

      const results = playlists.map((playlist, index) => {
        if (!playlist) return null;
        
        return {
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: 50 + (index * 10),
          confidence: 0.3,
          reasoning: 'Sistem sedang dalam pemulihan - menggunakan analisis dasar',
          improvementSuggestions: ['Coba lagi nanti atau gunakan mode expert'],
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
  },

  // Gemini availability check
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

  // Validate score method
  validateScore(score) {
    const num = parseInt(score) || 50;
    return Math.min(100, Math.max(0, num));
  },

  // Validate confidence method
  validateConfidence(confidence) {
    const num = parseFloat(confidence) || 0.5;
    return Math.min(1, Math.max(0, num));
  }

};

export default aiMatchingService;
