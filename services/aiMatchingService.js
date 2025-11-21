// services/aiMatchingService.js - ENHANCED WITH PLAYLIST METADATA
import { generateAIResponse } from '../lib/gemini';
import { playlistMetadataService } from './playlistMetadataService';

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

  // 🆕 ENHANCED: Playlist recommendations dengan metadata
  async getPlaylistRecommendations({ book, playlists = [] }) {
    try {
      console.log('🎯 Getting playlist recommendations for book:', book.judul);
      console.log('📊 Total playlists available:', playlists.length);

      // STEP 1: Filter playlists yang available
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      if (availablePlaylists.length === 0) {
        console.log('⚠️ No available playlists for this book');
        return [];
      }

      // STEP 2: 🆕 Enhanced selection dengan playlist metadata
      const topPlaylists = await this.selectTopPlaylistsWithMetadata(book, availablePlaylists, 3);

      console.log('🎯 Top playlists selected:', topPlaylists.map(p => p.playlist.name));

      // STEP 3: Jika AI available, gunakan untuk analisis mendalam
      if (topPlaylists.length > 0 && this.isGeminiAvailable()) {
        console.log('🤖 Using AI for detailed analysis');
        const aiResults = await this.getSimpleAIRecommendations(book, topPlaylists);
        
        if (aiResults && aiResults.length > 0) {
          return aiResults;
        }
      }

      // STEP 4: Fallback ke rule-based dengan metadata
      console.log('⚡ Using enhanced rule-based recommendations');
      return this.getRuleBasedResults(book, topPlaylists);
      
    } catch (error) {
      console.error('❌ Playlist recommendations failed:', error);
      
      // Emergency fallback
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      ).slice(0, 3);
      
      return this.getEmergencyResults(book, availablePlaylists);
    }
  },

  // 🆕 METHOD: Enhanced selection dengan playlist metadata
  async selectTopPlaylistsWithMetadata(book, playlists, maxCount = 3) {
    console.log('🔍 Enhanced selection with playlist metadata:');
    console.log(` Book: "${book.judul}"`);

    const scoredPlaylists = [];

    for (const playlist of playlists) {
      // 🆕 GUNAKAN ENHANCED MATCHING DENGAN METADATA
      const score = await this.calculateEnhancedMatchScoreWithMetadata(book, playlist);
      
      console.log(` ${playlist.name}: ${score} points`);
      scoredPlaylists.push({ playlist, score });
    }

    // Sort by score descending
    const sorted = scoredPlaylists.sort((a, b) => b.score - a.score);

    console.log('📊 Enhanced sorted playlists:');
    sorted.forEach(item => {
      console.log(` ${item.playlist.name}: ${item.score}`);
    });

    // Ambil top N dengan threshold yang reasonable
    const filtered = sorted
      .slice(0, maxCount)
      .filter(item => item.score > 15); // Maintain quality threshold

    console.log(`🎯 Final enhanced selection: ${filtered.length} playlists`);
    return filtered;
  },

  // 🆕 METHOD: Enhanced matching dengan playlist metadata
  async calculateEnhancedMatchScoreWithMetadata(book, playlist) {
    try {
      // 🎯 GET ENHANCED PLAYLIST DENGAN METADATA
      const enhancedPlaylist = await playlistMetadataService.getEnhancedPlaylist(playlist.id);
      const metadata = enhancedPlaylist.ai_metadata || {};
      
      console.log(`🔍 Enhanced scoring for: "${enhancedPlaylist.name}"`);
      console.log(` Book: "${book.judul}"`);

      let score = 0;

      // 1. 🏛️ HISTORICAL CONTEXT MATCHING (40%)
      const historicalScore = await this.calculateHistoricalContextMatch(book, enhancedPlaylist, metadata);
      score += historicalScore * 0.4;

      // 2. 🎭 THEMATIC MATCHING (35%)
      const themeScore = this.calculateEnhancedThematicMatch(book, enhancedPlaylist, metadata);
      score += themeScore * 0.35;

      // 3. 🌏 GEOGRAPHICAL MATCHING (25%)
      const geoScore = this.calculateEnhancedGeographicalMatch(book, enhancedPlaylist, metadata);
      score += geoScore * 0.25;

      const finalScore = Math.min(100, Math.round(score));
      console.log(` ✅ Final enhanced score: ${finalScore}`);
      
      return finalScore;
      
    } catch (error) {
      console.error('❌ Enhanced matching failed, using basic score:', error);
      return await this.calculateEnhancedMatchScore(book, playlist); // Fallback ke original
    }
  },

  // 🆕 METHOD: Historical context matching dengan metadata
  async calculateHistoricalContextMatch(book, enhancedPlaylist, metadata) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    let score = 0;

    // 🎯 CHECK HISTORICAL NAMES MAPPING
    const historicalNames = metadata.historical_names || [];
    for (const historicalName of historicalNames) {
      if (bookText.includes(historicalName.toLowerCase())) {
        score += 30; // High score untuk historical match
        console.log(` 🏛️ Historical name match: "${historicalName}" +30`);
        break;
      }
    }

    // 🎯 CHECK MODERN EQUIVALENTS 
    const modernEquivalents = metadata.modern_equivalents || [];
    for (const modern of modernEquivalents) {
      if (bookText.includes(modern.toLowerCase())) {
        score += 20;
        console.log(` 🏛️ Modern equivalent match: "${modern}" +20`);
        break;
      }
    }

    // 🎯 CHECK KEYWORDS DARI METADATA
    const keywords = metadata.keywords || [];
    const keywordMatches = keywords.filter(keyword => 
      bookText.includes(keyword.toLowerCase())
    ).length;

    if (keywordMatches > 0) {
      score += keywordMatches * 10;
      console.log(` 🔑 Keyword matches: ${keywordMatches} → +${keywordMatches * 10}`);
    }

    // 🎯 TIME PERIOD MATCHING
    if (metadata.time_period && this.hasTimePeriodOverlap(book, metadata.time_period)) {
      score += 15;
      console.log(` ⏳ Time period match: "${metadata.time_period}" +15`);
    }

    return Math.min(100, score);
  },

  // 🆕 METHOD: Enhanced thematic matching dengan metadata
  calculateEnhancedThematicMatch(book, enhancedPlaylist, metadata) {
    const bookThemes = this.extractBookThemes(book);
    const playlistThemes = metadata.key_themes || [];
    
    let score = 0;
    let matches = 0;

    console.log(' 🎭 Theme matching:');
    console.log(`  Book themes: ${bookThemes.join(', ')}`);
    console.log(`  Playlist themes: ${playlistThemes.join(', ')}`);

    // 🎯 THEME-TO-THEME MATCHING
    for (const bookTheme of bookThemes) {
      for (const playlistTheme of playlistThemes) {
        if (this.areThemesRelated(bookTheme, playlistTheme)) {
          score += 15;
          matches++;
          console.log(`   Theme match: "${bookTheme}" ↔ "${playlistTheme}" +15`);
        }
      }
    }

    // 🎯 BONUS UNTUK MULTIPLE MATCHES
    if (matches >= 2) {
      score += 20;
      console.log(` 🎯 Multiple theme matches bonus: +20`);
    }

    return Math.min(100, score);
  },

  // 🆕 METHOD: Enhanced geographical matching dengan metadata
  calculateEnhancedGeographicalMatch(book, enhancedPlaylist, metadata) {
    const bookRegions = this.extractBookRegions(book);
    const playlistRegions = metadata.geographical_focus || [];
    
    let score = 0;

    console.log(' 🌏 Geographical matching:');
    console.log(`  Book regions: ${bookRegions.join(', ')}`);
    console.log(`  Playlist regions: ${playlistRegions.join(', ')}`);

    // 🎯 REGION MATCHING
    for (const bookRegion of bookRegions) {
      for (const playlistRegion of playlistRegions) {
        if (this.areRegionsRelated(bookRegion, playlistRegion)) {
          score += 20;
          console.log(`   Region match: "${bookRegion}" ↔ "${playlistRegion}" +20`);
          break;
        }
      }
    }

    // 🎯 BONUS UNTUK MULTIPLE REGION MATCHES
    const regionMatches = bookRegions.filter(bookRegion =>
      playlistRegions.some(playlistRegion => 
        this.areRegionsRelated(bookRegion, playlistRegion)
      )
    ).length;

    if (regionMatches >= 2) {
      score += 15;
      console.log(` 🗺️ Multiple region matches bonus: +15`);
    }

    return Math.min(100, score);
  },

  // 🆕 METHOD: Extract book themes
  extractBookThemes(book) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const themes = [];

    const themeKeywords = {
      'biografi': ['biografi', 'tokoh', 'pahlawan', 'riwayat', 'biographic'],
      'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'historical'],
      'militer': ['militer', 'tni', 'tentara', 'perang', 'pertempuran', 'military'],
      'budaya': ['budaya', 'adat', 'tradisi', 'kebudayaan', 'cultural', 'kesenian'],
      'geografi': ['geografi', 'geomorph', 'geomorf', 'geolog', 'ilmu bumi', 'geography'],
      'transportasi': ['kereta', 'transportasi', 'perhubungan', 'railway', 'transportation'],
      'kolonial': ['kolonial', 'belanda', 'dutch', 'hindia belanda', 'nederlandsch'],
      'ilmiah': ['ilmiah', 'akademik', 'studi', 'penelitian', 'laporan', 'report']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => bookText.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['umum'];
  },

  // 🆕 METHOD: Extract book regions
  extractBookRegions(book) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const regions = [];

    const regionKeywords = {
      'indonesia': ['indonesia', 'nusantara', 'hindia belanda', 'nederlandsch indie'],
      'sumatra': ['sumatra', 'sumatera', 'padang', 'minangkabau', 'bovenlanden'],
      'jawa': ['jawa', 'batavia', 'jakarta', 'sunda', 'priangan'],
      'bali': ['bali'],
      'kalimantan': ['kalimantan', 'borneo'],
      'sulawesi': ['sulawesi', 'celebes'],
      'papua': ['papua', 'new guinea']
    };

    for (const [region, keywords] of Object.entries(regionKeywords)) {
      if (keywords.some(keyword => bookText.includes(keyword))) {
        regions.push(region);
      }
    }

    return regions;
  },

  // 🆕 METHOD: Check theme relation
  areThemesRelated(theme1, theme2) {
    const relatedGroups = {
      'biografi': ['biografi', 'sejarah', 'tokoh'],
      'sejarah': ['sejarah', 'biografi', 'kolonial', 'militer'],
      'militer': ['militer', 'sejarah', 'perang'],
      'kolonial': ['kolonial', 'sejarah', 'belanda'],
      'geografi': ['geografi', 'transportasi', 'ilmiah'],
      'transportasi': ['transportasi', 'geografi', 'ilmiah']
    };

    const group1 = relatedGroups[theme1] || [theme1];
    const group2 = relatedGroups[theme2] || [theme2];
    
    return group1.some(t1 => group2.includes(t1));
  },

  // 🆕 METHOD: Check region relation
  areRegionsRelated(region1, region2) {
    const relatedGroups = {
      'indonesia': ['indonesia', 'sumatra', 'jawa', 'bali', 'kalimantan', 'sulawesi', 'papua'],
      'sumatra': ['sumatra', 'indonesia'],
      'jawa': ['jawa', 'indonesia'],
      'bali': ['bali', 'indonesia'],
      'kalimantan': ['kalimantan', 'indonesia'],
      'sulawesi': ['sulawesi', 'indonesia'],
      'papua': ['papua', 'indonesia']
    };

    const group1 = relatedGroups[region1] || [region1];
    const group2 = relatedGroups[region2] || [region2];
    
    return group1.some(r1 => group2.includes(r1));
  },

  // 🆕 METHOD: Check time period overlap
  hasTimePeriodOverlap(book, playlistTimePeriod) {
    // Simple implementation - bisa dienhance dengan extraction book publication year
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    
    if (playlistTimePeriod.includes('-')) {
      const [start, end] = playlistTimePeriod.split('-').map(Number);
      const bookYear = this.extractBookYear(book);
      
      if (bookYear && bookYear >= start && bookYear <= end) {
        return true;
      }
    }
    
    // Fallback: check keywords in time period
    const timeKeywords = {
      'kolonial': ['kolonial', 'belanda', 'hindia', 'nederlandsch'],
      'kemerdekaan': ['kemerdekaan', 'proklamasi', '1945'],
      'modern': ['modern', 'kontemporer', 'sekarang']
    };
    
    for (const [period, keywords] of Object.entries(timeKeywords)) {
      if (playlistTimePeriod.toLowerCase().includes(period) && 
          keywords.some(keyword => bookText.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  },

  // 🆕 METHOD: Extract book year
  extractBookYear(book) {
    if (book.tahun_terbit) {
      const yearMatch = book.tahun_terbit.match(/\b(1[0-9]{3}|2[0-9]{3})\b/);
      if (yearMatch) return parseInt(yearMatch[1]);
    }
    return null;
  },

  // ===========================================================================
  // EXISTING METHODS - Tetap dipertahankan dengan enhancement
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

  // ... (ALL THE EXISTING METHODS REMAIN THE SAME)
  // calculateDynamicRegionMatch, calculateEnhancedSemanticMatch, 
  // calculateThemeAndContextMatch, findSmartRegionMatches,
  // getAllIndonesianRegions, extractAllRegionsFromText,
  // extractRegionsWithAI, mapSpecificRegions, findRelatedRegionMatches,
  // getSimpleAIRecommendations, createSimplePrompt, parseSimpleAIResponse,
  // extractJSONFromText, createManualJSON, mapParsedToRecommendations,
  // findMatchingPlaylist, getRuleBasedResults, getEmergencyResults,
  // getRuleBasedReasoning, isGeminiAvailable, createAnalysisPrompt,
  // parseAIResponse, fixUnterminatedJSON, validateScore, validateConfidence,
  // getFallbackAnalysis, calculateKeywordMatch

  // ===========================================================================
  // EXISTING METHODS CONTINUED...
  // ===========================================================================

  calculateDynamicRegionMatch(book, playlistText) {
    let score = 0;
    const bookRegions = this.extractBookRegions(book); // 🆕 Use new method
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

  // ... (REST OF THE EXISTING METHODS REMAIN EXACTLY THE SAME)

  getAllIndonesianRegions() {
    // ... existing implementation
  },

  extractAllRegionsFromText(text) {
    // ... existing implementation  
  },

  async extractRegionsWithAI(book) {
    // ... existing implementation
  },

  mapSpecificRegions(regions) {
    // ... existing implementation
  },

  findRelatedRegionMatches(bookRegions, playlistRegions) {
    // ... existing implementation
  },

  calculateThemeAndContextMatch(book, playlist) {
    // ... existing implementation
  },

  findSmartRegionMatches(bookRegions, playlistRegions) {
    // ... existing implementation
  },

  async getSimpleAIRecommendations(book, topPlaylists) {
    // ... existing implementation
  },

  createSimplePrompt(book, topPlaylists) {
    // ... existing implementation
  },

  parseSimpleAIResponse(aiResponse, book, topPlaylists) {
    // ... existing implementation
  },

  extractJSONFromText(text) {
    // ... existing implementation
  },

  createManualJSON(book, topPlaylists) {
    // ... existing implementation
  },

  mapParsedToRecommendations(parsed, topPlaylists) {
    // ... existing implementation
  },

  findMatchingPlaylist(aiPlaylistName, topPlaylists, index) {
    // ... existing implementation
  },

  getRuleBasedResults(book, topPlaylists) {
    // ... existing implementation
  },

  getEmergencyResults(book, playlists) {
    // ... existing implementation
  },

  getRuleBasedReasoning(score) {
    // ... existing implementation
  },

  isGeminiAvailable() {
    // ... existing implementation
  },

  createAnalysisPrompt(book, playlist) {
    // ... existing implementation
  },

  parseAIResponse(aiResponse, book, playlist) {
    // ... existing implementation
  },

  fixUnterminatedJSON(jsonString) {
    // ... existing implementation
  },

  validateScore(score) {
    // ... existing implementation
  },

  validateConfidence(confidence) {
    // ... existing implementation
  },

  getFallbackAnalysis(book, playlist) {
    // ... existing implementation
  },

  calculateKeywordMatch(book, playlist) {
    // ... existing implementation
  }
};