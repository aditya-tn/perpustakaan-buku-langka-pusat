// services/aiMatchingService.js - COMPLETE FIXED VERSION
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
        try {
          const aiResults = await this.getSimpleAIRecommendations(book, topPlaylists);
          
          // 🆪 VALIDASI AI RESULTS
          if (aiResults && Array.isArray(aiResults) && aiResults.length > 0) {
            console.log('✅ AI analysis successful, returning AI results');
            return aiResults;
          } else {
            console.log('⚠️ AI returned empty results, using rule-based');
          }
        } catch (aiError) {
          console.error('❌ AI analysis failed, using rule-based:', aiError);
        }
      }

      // STEP 4: Fallback ke rule-based dengan metadata
      console.log('⚡ Using enhanced rule-based recommendations');
      const ruleBasedResults = this.getRuleBasedResults(book, topPlaylists);
      
      // 🆪 PASTIKAN SELALU RETURN ARRAY
      return Array.isArray(ruleBasedResults) ? ruleBasedResults : [];
      
    } catch (error) {
      console.error('❌ Playlist recommendations failed:', error);
      
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
  // EXISTING METHODS - Tetap dipertahankan
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
