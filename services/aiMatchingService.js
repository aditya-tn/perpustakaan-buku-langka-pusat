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

// 🆕 ENHANCED SEMANTIC MATCHING SYSTEM
calculateEnhancedMetadataMatch(book, playlist) {
  console.log(`🔍 SEMANTIC Matching: "${book.judul}" vs "${playlist.name}"`);
  
  const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
  const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase();
  
  let score = 0;

  // 1. 🎯 SEMANTIC THEME MATCHING (40%) - PALING PENTING
  const semanticScore = this.calculateSemanticThemeMatch(book, playlist);
  score += semanticScore * 0.4;
  console.log(`🎯 Semantic Theme Score: ${semanticScore} → Total: ${score}`);

  // 2. 🎯 GEOGRAPHIC MATCHING (30%) - SANGAT PENTING
  const geographicScore = this.calculateGeographicMatch(book, playlist);
  score += geographicScore * 0.3;
  console.log(`🗺️ Geographic Score: ${geographicScore} → Total: ${score}`);

  // 3. 🎯 AI METADATA MATCHING (20%) - LEVERAGE AI METADATA
  const aiMetadataScore = this.calculateAIMetadataSemanticMatch(book, playlist);
  score += aiMetadataScore * 0.2;
  console.log(`🤖 AI Metadata Score: ${aiMetadataScore} → Total: ${score}`);

  // 4. 🎯 CONTEXTUAL MATCHING (10%) - TAMBAHAN
  const contextualScore = this.calculateContextualMatch(book, playlist);
  score += contextualScore * 0.1;
  console.log(`📚 Contextual Score: ${contextualScore} → Total: ${score}`);

  const finalScore = Math.min(100, Math.round(score));
  console.log(`✅ FINAL SEMANTIC SCORE: ${finalScore} for "${playlist.name}"`);
  
  return finalScore;
},

// 🆕 IMPROVED SEMANTIC THEME MATCHING dengan better error handling
calculateSemanticThemeMatch(book, playlist) {
  try {
    console.log(`\n🎯 ANALYZING SEMANTIC THEMES:`);
    
    const bookThemes = this.extractSemanticThemes(book);
    const playlistThemes = this.extractSemanticThemesFromPlaylist(playlist);
    
    console.log(`📘 Book Themes: [${bookThemes.join(', ')}]`);
    console.log(`📗 Playlist Themes: [${playlistThemes.join(', ')}]`);
    
    let score = 0;
    
    // Calculate theme overlap
    const overlappingThemes = bookThemes.filter(theme => 
      playlistThemes.includes(theme)
    );
    
    if (overlappingThemes.length > 0) {
      score = overlappingThemes.length * 25;
      console.log(`✅ THEME OVERLAP: [${overlappingThemes.join(', ')}] → +${score}`);
    }
    
    // Bonus untuk pendidikan theme (karena buku tentang onderwijs)
    if (bookThemes.includes('pendidikan') && playlistThemes.includes('sejarah')) {
      score += 20;
      console.log(`📚 PENDIDIKAN-SEJARAH BONUS: +20`);
    }
    
    return Math.min(80, score);
    
  } catch (error) {
    console.error(`❌ Error in calculateSemanticThemeMatch:`, error);
    return 0; // Safe fallback
  }
},

// 🆕 METHOD: Extract Semantic Themes dari Buku
extractSemanticThemes(book) {
  const text = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
  const themes = [];
  
  const themePatterns = {
    'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'tijd', 'geschiedenis'],
    'pendidikan': ['onderwijs', 'pendidikan', 'education', 'school', 'sekolah', 'pelajaran'],
    'kolonial': ['kolonial', 'belanda', 'dutch', 'nederlands', 'colonial', 'hindia'],
    'budaya': ['budaya', 'cultural', 'tradisi', 'adat', 'custom', 'gebruik'],
    'sosial': ['sosial', 'masyarakat', 'community', 'maatschappij', 'samenleving'],
    'politik': ['politik', 'pemerintahan', 'government', 'bestuur', 'beleid'],
    'etnografi': ['etnografi', 'etnology', 'volk', 'volken', 'suku', 'etnis'],
    'geografi': ['geografi', 'wilayah', 'daerah', 'region', 'streek', 'land']
  };
  
  for (const [theme, keywords] of Object.entries(themePatterns)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  // Fallback: infer from title jika tidak ada tema terdeteksi
  if (themes.length === 0) {
    themes.push(...this.inferThemesFromTitle(book.judul));
  }
  
  console.log(`   🎯 Extracted themes: [${themes.join(', ')}]`);
  return themes.length > 0 ? themes : ['umum'];
},

// 🆕 METHOD: Extract Semantic Themes dari Playlist
extractSemanticThemesFromPlaylist(playlist) {
  const text = `${playlist.name} ${playlist.description || ''}`.toLowerCase();
  const themes = [];
  
  const themePatterns = {
    'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman'],
    'budaya': ['budaya', 'cultural', 'tradisi', 'adat'],
    'politik': ['politik', 'pemerintahan', 'negara'],
    'sosial': ['sosial', 'masyarakat', 'community'],
    'militer': ['militer', 'tentara', 'perang', 'military'],
    'geografi': ['geografi', 'wilayah', 'daerah'],
    'biografi': ['biografi', 'tokoh', 'pahlawan'],
    'kolonial': ['kolonial', 'belanda', 'penjajahan']
  };
  
  for (const [theme, keywords] of Object.entries(themePatterns)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  return themes.length > 0 ? themes : ['umum'];
},
  
// 🆕 IMPROVED ERROR HANDLING di calculateGeographicMatch
calculateGeographicMatch(book, playlist) {
  try {
    console.log(`\n🗺️ ANALYZING GEOGRAPHIC MATCH:`);
    
    const bookLocations = this.extractGeographicLocations(book);
    const playlistLocations = this.extractGeographicLocationsFromPlaylist(playlist);
    
    console.log(`📘 Book Locations: [${bookLocations.join(', ')}]`);
    console.log(`📗 Playlist Locations: [${playlistLocations.join(', ')}]`);
    
    let score = 0;

    // 🎯 1. EXACT REGIONAL MATCHES - PALING PENTING
    const exactMatches = bookLocations.filter(location =>
      playlistLocations.includes(location)
    );
    
    if (exactMatches.length > 0) {
      score = exactMatches.length * 40;
      console.log(`🎯 CRITICAL EXACT MATCHES: [${exactMatches.join(', ')}] → +${score}`);
      
      // Bonus untuk exact regional matches
      const regionalKeywords = ['sumatra barat', 'aceh', 'jawa barat'];
      const regionalExactMatches = exactMatches.filter(match => 
        regionalKeywords.some(keyword => match.includes(keyword))
      );
      
      if (regionalExactMatches.length > 0) {
        score += 25;
        console.log(`🏆 REGIONAL EXACT MATCH BONUS: +25`);
      }
    }
    
    // 🗺️ 2. HISTORICAL TO MODERN MAPPING
    const historicalMatches = this.calculateHistoricalToModernMapping(bookLocations, playlistLocations);
    score += historicalMatches;
    
    // 🏞️ 3. REGIONAL HIERARCHY
    const regionalMatches = this.calculateRegionalHierarchy(bookLocations, playlistLocations);
    score += regionalMatches;
    
    return Math.min(100, score);
    
  } catch (error) {
    console.error(`❌ Error in calculateGeographicMatch:`, error);
    return 0; // Safe fallback
  }
},

// 🆕 ADD MISSING METHOD: Extract Geographic Locations from Playlist
extractGeographicLocationsFromPlaylist(playlist) {
  const text = `${playlist.name} ${playlist.description || ''}`.toLowerCase();
  const locations = [];
  
  const locationPatterns = {
    'indonesia': ['indonesia', 'nusantara'],
    'sumatra': ['sumatra', 'sumatera'],
    'jawa': ['jawa'],
    'bali': ['bali'],
    'sulawesi': ['sulawesi'],
    'kalimantan': ['kalimantan'],
    'papua': ['papua'],
    'sumatra barat': ['sumatra barat', 'sumatera barat', 'west sumatra'],
    'aceh': ['aceh'],
    'sumatra utara': ['sumatra utara', 'north sumatra'],
    'sumatra selatan': ['sumatra selatan', 'south sumatra'],
    'riau': ['riau'],
    'jambi': ['jambi'],
    'bengkulu': ['bengkulu'],
    'lampung': ['lampung'],
    'jawa barat': ['jawa barat', 'west java'],
    'jawa tengah': ['jawa tengah', 'central java'],
    'jawa timur': ['jawa timur', 'east java'],
    'malaysia': ['malaysia'],
    'singapore': ['singapore', 'singapura'],
    'belanda': ['belanda', 'netherlands']
  };
  
  for (const [location, patterns] of Object.entries(locationPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      locations.push(location);
    }
  }
  
  return locations;
},
  
// 🆕 ENHANCED HISTORICAL MAPPING dengan Residensi
calculateHistoricalToModernMapping(bookLocations, playlistLocations) {
  let score = 0;
  
  const historicalMappings = {
    // 🏛️ RESIDENSI PADANG REGION
    'padangsche bovenlanden': ['sumatra barat', 'sumatra', 'indonesia'],
    'padangse bovenlanden': ['sumatra barat', 'sumatra', 'indonesia'],
    'padangsche benedenlanden': ['sumatra barat', 'sumatra', 'indonesia'],
    'agam': ['sumatra barat', 'sumatra', 'indonesia'],
    'tanah datar': ['sumatra barat', 'sumatra', 'indonesia'],
    'lima puluh kota': ['sumatra barat', 'sumatra', 'indonesia'],
    'solok': ['sumatra barat', 'sumatra', 'indonesia'],
    'pariaman': ['sumatra barat', 'sumatra', 'indonesia'],
    'painan': ['sumatra barat', 'sumatra', 'indonesia'],
    
    // 🏛️ RESIDENSI ACEH REGION
    'groot atjeh': ['aceh', 'sumatra', 'indonesia'],
    'groot-atjeh': ['aceh', 'sumatra', 'indonesia'],
    'noordkust van atjeh': ['aceh', 'sumatra', 'indonesia'],
    'oostkust van atjeh': ['aceh', 'sumatra', 'indonesia'],
    'westkust van atjeh': ['aceh', 'sumatra', 'indonesia'],
    'bengkulen': ['bengkulu', 'sumatra', 'indonesia'],
    
    // 🏛️ RESIDENSI SUMATRA TIMUR
    'oostkust van sumatra': ['sumatra utara', 'sumatra', 'indonesia'],
    'sumatra\'s oostkust': ['sumatra utara', 'sumatra', 'indonesia'],
    'deli': ['sumatra utara', 'sumatra', 'indonesia'],
    'serdang': ['sumatra utara', 'sumatra', 'indonesia'],
    'langkat': ['sumatra utara', 'sumatra', 'indonesia'],
    'tapanuli': ['sumatra utara', 'sumatra', 'indonesia'],
    
    // 🏛️ RESIDENSI SUMATRA SELATAN
    'palembangsche bovenlanden': ['sumatra selatan', 'sumatra', 'indonesia'],
    'palembangsche benedenlanden': ['sumatra selatan', 'sumatra', 'indonesia'],
    'lampongsche districten': ['lampung', 'sumatra', 'indonesia'],
    
    // 🏛️ RESIDENSI RIAU-JAMBI
    'riouw-lingga archipel': ['riau', 'sumatra', 'indonesia'],
    'indragiri': ['riau', 'sumatra', 'indonesia'],
    'jambische bovenlanden': ['jambi', 'sumatra', 'indonesia'],
    
    // 🗾 RESIDENSI JAVA BARAT
    'batavia en omstreken': ['jawa barat', 'jawa', 'indonesia'],
    'preanger regentschappen': ['jawa barat', 'jawa', 'indonesia'],
    'preanger': ['jawa barat', 'jawa', 'indonesia'],
    'priangan': ['jawa barat', 'jawa', 'indonesia'],
    'buitenzorg': ['jawa barat', 'jawa', 'indonesia'],
    'cheribon': ['jawa barat', 'jawa', 'indonesia'],
    
    // 🗾 RESIDENSI JAVA TENGAH
    'semarangsche residentie': ['jawa tengah', 'jawa', 'indonesia'],
    'kedoe': ['jawa tengah', 'jawa', 'indonesia'],
    'bagelen': ['jawa tengah', 'jawa', 'indonesia'],
    'banjoemas': ['jawa tengah', 'jawa', 'indonesia'],
    
    // 🗾 RESIDENSI JAVA TIMUR  
    'soerabajasche residentie': ['jawa timur', 'jawa', 'indonesia'],
    'madoera': ['jawa timur', 'jawa', 'indonesia'],
    'pasoeroean': ['jawa timur', 'jawa', 'indonesia'],
    
    // 🏝️ LAIN-LAIN
    'bali en lombok': ['bali', 'indonesia'],
    'manado residentie': ['sulawesi utara', 'sulawesi', 'indonesia'],
    'amboinsche residentie': ['maluku', 'indonesia'],
    
    // 🇮🇩 HINDIA BELANDA
    'hindia belanda': ['indonesia', 'sumatra', 'jawa', 'bali', 'sulawesi', 'kalimantan', 'papua'],
    'nederlandsch-indie': ['indonesia', 'sumatra', 'jawa', 'bali', 'sulawesi', 'kalimantan', 'papua']
  };
  
  for (const bookLocation of bookLocations) {
    const modernRegions = historicalMappings[bookLocation];
    if (modernRegions) {
      const matches = modernRegions.filter(region =>
        playlistLocations.includes(region)
      );
      
      if (matches.length > 0) {
        score += matches.length * 20;
        console.log(`🏛️ HISTORICAL MAPPING: "${bookLocation}" → [${matches.join(', ')}] → +${matches.length * 20}`);
      }
    }
  }
  
  return score;
},

// 🆕 REGIONAL HIERARCHY MATCHING
calculateRegionalHierarchy(bookLocations, playlistLocations) {
  let score = 0;
  
  // Regional hierarchy: Province → Island → Country
  const regionalHierarchy = {
    // Sumatra Hierarchy
    'aceh': ['sumatra', 'indonesia'],
    'sumatra utara': ['sumatra', 'indonesia'],
    'sumatra barat': ['sumatra', 'indonesia'],
    'riau': ['sumatra', 'indonesia'],
    'jambi': ['sumatra', 'indonesia'],
    'sumatra selatan': ['sumatra', 'indonesia'],
    'bengkulu': ['sumatra', 'indonesia'],
    'lampung': ['sumatra', 'indonesia'],
    
    // Java Hierarchy
    'jakarta': ['jawa', 'indonesia'],
    'jawa barat': ['jawa', 'indonesia'],
    'jawa tengah': ['jawa', 'indonesia'],
    'yogyakarta': ['jawa', 'indonesia'],
    'jawa timur': ['jawa', 'indonesia'],
    'banten': ['jawa', 'indonesia'],
    
    // Kalimantan Hierarchy
    'kalimantan barat': ['kalimantan', 'indonesia'],
    'kalimantan tengah': ['kalimantan', 'indonesia'],
    'kalimantan selatan': ['kalimantan', 'indonesia'],
    'kalimantan timur': ['kalimantan', 'indonesia'],
    'kalimantan utara': ['kalimantan', 'indonesia'],
    
    // Sulawesi Hierarchy
    'sulawesi utara': ['sulawesi', 'indonesia'],
    'sulawesi tengah': ['sulawesi', 'indonesia'],
    'sulawesi selatan': ['sulawesi', 'indonesia'],
    'sulawesi tenggara': ['sulawesi', 'indonesia'],
    'gorontalo': ['sulawesi', 'indonesia'],
    
    // Other Islands
    'bali': ['indonesia'],
    'nusa tenggara barat': ['indonesia'],
    'nusa tenggara timur': ['indonesia'],
    'maluku': ['indonesia'],
    'maluku utara': ['indonesia'],
    'papua': ['indonesia'],
    'papua barat': ['indonesia']
  };
  
  // Check if book locations are in the hierarchy of playlist locations
  for (const bookLocation of bookLocations) {
    const hierarchy = regionalHierarchy[bookLocation];
    if (hierarchy) {
      const hierarchyMatches = hierarchy.filter(region =>
        playlistLocations.includes(region)
      );
      
      if (hierarchyMatches.length > 0) {
        score += hierarchyMatches.length * 15;
        console.log(`🏞️ REGIONAL HIERARCHY: "${bookLocation}" ∈ [${hierarchyMatches.join(', ')}] → +${hierarchyMatches.length * 15}`);
      }
    }
  }
  
  // Also check reverse: if playlist locations are in hierarchy of book locations
  for (const playlistLocation of playlistLocations) {
    const hierarchy = regionalHierarchy[playlistLocation];
    if (hierarchy) {
      const hierarchyMatches = hierarchy.filter(region =>
        bookLocations.includes(region)
      );
      
      if (hierarchyMatches.length > 0) {
        score += hierarchyMatches.length * 15;
        console.log(`🏞️ REVERSE HIERARCHY: "${playlistLocation}" ∈ [${hierarchyMatches.join(', ')}] → +${hierarchyMatches.length * 15}`);
      }
    }
  }
  
  return score;
},

// 🆕 ENHANCED LOCATION EXTRACTION dengan Residensi Kolonial
extractGeographicLocations(book) {
  const text = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
  const locations = [];
  
  // 🎯 SUMATRA REGION - HIGH PRIORITY
  const locationPatterns = {
    // 🏛️ RESIDENSI SUMATRA BARAT (PADANG REGION)
    'sumatra barat': [
      'sumatra barat', 'sumatera barat', 'west sumatra', 
      'minangkabau', 'minang', 'padang', 'bukittinggi', 'payakumbuh',
      // 🆕 RESIDENSI KOLONIAL
      'padangsche bovenlanden', 'padangse bovenlanden', 'padang highlands',
      'padangsche benedenlanden', 'padang lowlands',
      'agam', 'tanah datar', 'lima puluh kota', 'solok',
      'pariaman', 'painan', 'padang panjang', 'padang panjang'
    ],
    
    // 🏛️ RESIDENSI ACEH
    'aceh': [
      'aceh', 'atjeh', 
      // 🆕 RESIDENSI KOLONIAL
      'groot atjeh', 'groot-atjeh', 'great aceh',
      'noordkust van atjeh', 'aceh north coast',
      'oostkust van atjeh', 'aceh east coast',
      'westkust van atjeh', 'aceh west coast',
      'bengkulen', 'bengkulu', 'benkoelen'
    ],
    
    // 🏛️ RESIDENSI SUMATRA UTARA
    'sumatra utara': [
      'sumatra utara', 'north sumatra', 'medan', 'batak',
      // 🆕 RESIDENSI KOLONIAL  
      'oostkust van sumatra', 'east coast of sumatra',
      'sumatra\'s oostkust', 'sumatra east coast',
      'deli', 'serdang', 'langkat', 'simalungun',
      'tapanuli', 'toba', 'karo'
    ],
    
    // 🏛️ RESIDENSI SUMATRA SELATAN
    'sumatra selatan': [
      'sumatra selatan', 'south sumatra', 'palembang',
      // 🆕 RESIDENSI KOLONIAL
      'palembangsche bovenlanden', 'palembang highlands',
      'palembangsche benedenlanden', 'palembang lowlands',
      'lampongsche districten', 'lampung districts'
    ],
    
    // 🏛️ RESIDENSI RIAU & JAMBI
    'riau': [
      'riau', 'riouw',
      // 🆕 RESIDENSI KOLONIAL
      'riouw-lingga archipel', 'riau-lingga archipelago',
      'indragiri', 'kampar', 'siak'
    ],
    
    'jambi': [
      'jambi', 'djambi',
      // 🆕 RESIDENSI KOLONIAL
      'jambische bovenlanden', 'jambi highlands'
    ],
    
    // 🗾 RESIDENSI JAVA BARAT
    'jawa barat': [
      'jawa barat', 'west java', 'bandung', 'bogor', 'batavia', 'jakarta',
      // 🆕 RESIDENSI KOLONIAL
      'batavia en omstreken', 'batavia and surroundings',
      'preanger regentschappen', 'preanger regencies',
      'preanger', 'priangan', 'cianjur', 'sukabumi',
      'buitenzorg', 'bogor', 'krawang', 'karawang',
      'cheribon', 'cirebon', 'indra maju', 'indramayu'
    ],
    
    // 🗾 RESIDENSI JAVA TENGAH
    'jawa tengah': [
      'jawa tengah', 'central java', 'semarang', 'yogyakarta', 'solo',
      // 🆕 RESIDENSI KOLONIAL
      'semarangsche residentie', 'semarang residency',
      'kedoe', 'kedu', 'bagelen', 'banjoemas', 'banyumas',
      'pekalongan', 'tegal', 'rembang', 'japara', 'jepara'
    ],
    
    // 🗾 RESIDENSI JAVA TIMUR
    'jawa timur': [
      'jawa timur', 'east java', 'surabaya', 'soerabaja',
      // 🆕 RESIDENSI KOLONIAL
      'soerabajasche residentie', 'surabaya residency',
      'madoera', 'madura', 'pasoeroean', 'pasuruan',
      'probolinggo', 'besuki', 'banjoewangi', 'banyuwangi'
    ],
    
    // 🏝️ RESIDENSI BALI & LOMBOK
    'bali': [
      'bali', 
      // 🆕 RESIDENSI KOLONIAL
      'bali en lombok', 'bali and lombok',
      'zuid-bali', 'south bali', 'noord-bali', 'north bali'
    ],
    
    // 🏝️ RESIDENSI SULAWESI
    'sulawesi': [
      'sulawesi', 'celebes', 'makassar', 'manado',
      // 🆕 RESIDENSI KOLONIAL
      'manado residentie', 'manado residency',
      'gouvernement celebes', 'celebes government',
      'zuider-en oosterafdeeling', 'south and east division'
    ],
    
    // 🏝️ RESIDENSI KALIMANTAN
    'kalimantan': [
      'kalimantan', 'borneo',
      // 🆕 RESIDENSI KOLONIAL
      'zuider-en oosterafdeeling van borneo', 
      'south and east division of borneo',
      'westerafdeeling van borneo', 'west division of borneo'
    ],
    
    // 🏝️ RESIDENSI MALUKU
    'maluku': [
      'maluku', 'molukken',
      // 🆕 RESIDENSI KOLONIAL
      'amboinsche residentie', 'ambon residency',
      'ternate', 'tidore', 'banda-eilanden', 'banda islands'
    ],
    
    // 🇮🇩 INDONESIA UMUM
    'sumatra': ['sumatra', 'sumatera'],
    'jawa': ['jawa', 'java'],
    'indonesia': ['indonesia', 'nusantara'],
    
    // 🏛️ HINDIA BELANDA
    'hindia belanda': [
      'hindia belanda', 'dutch east indies', 
      'netherlands east indies', 'nederlandsch-indie'
    ],
    
    // 🌏 INTERNASIONAL
    'malaysia': ['malaysia', 'malaya', 'british malaya', 'negri sembilan']
  };
  
  for (const [location, patterns] of Object.entries(locationPatterns)) {
    const matchedPatterns = patterns.filter(pattern => text.includes(pattern));
    if (matchedPatterns.length > 0) {
      locations.push(location);
      console.log(`   📍 Detected "${location}" via: [${matchedPatterns.join(', ')}]`);
    }
  }
  
  return [...new Set(locations)];
},
  
// 🆕 METHOD: AI Metadata Semantic Match
calculateAIMetadataSemanticMatch(book, playlist) {
  console.log(`\n🤖 ANALYZING AI METADATA SEMANTIC MATCH:`);
  
  let score = 0;
  
  if (playlist.ai_metadata && !playlist.ai_metadata.is_fallback) {
    console.log(`📋 Using AI Metadata for semantic matching`);
    const metadata = playlist.ai_metadata;
    
    // Gunakan AI metadata themes untuk semantic matching
    if (metadata.key_themes && metadata.key_themes.length > 0) {
      const bookThemes = this.extractSemanticThemes(book);
      const aiThemeMatches = bookThemes.filter(theme =>
        metadata.key_themes.includes(theme)
      ).length;
      
      if (aiThemeMatches > 0) {
        score += aiThemeMatches * 15;
        console.log(`✅ AI THEME MATCHES: ${aiThemeMatches} → +${aiThemeMatches * 15}`);
      }
    }
    
    // Gunakan historical context dari AI metadata
    if (metadata.historical_context) {
      const historicalMatch = this.evaluateHistoricalContextMatch(book, metadata.historical_context);
      score += historicalMatch;
    }
    
  } else {
    console.log(`⚠️ No AI metadata available for semantic matching`);
  }
  
  return Math.min(50, score);
},

// 🆕 METHOD: Contextual Match
calculateContextualMatch(book, playlist) {
  let score = 0;
  
  // Contextual factors
  if (playlist.books && playlist.books.length > 5) {
    score += 10; // Established playlist
    console.log(`📚 ESTABLISHED PLAYLIST: +10`);
  }
  
  if (book.tahun_terbit && playlist.created_at) {
    const bookYear = parseInt(book.tahun_terbit);
    if (!isNaN(bookYear) && bookYear < 1945) {
      score += 15; // Historical book bonus
      console.log(`🏛️ HISTORICAL BOOK BONUS: +15`);
    }
  }
  
  return Math.min(25, score);
},

// 🆕 IMPROVED THEME INFERENCE FROM TITLE
inferThemesFromTitle(title) {
  const titleLower = title.toLowerCase();
  const inferredThemes = [];
  
  // Dutch language patterns
  if (titleLower.includes('onderwijs') || titleLower.includes('opvoeding')) {
    inferredThemes.push('pendidikan');
  }
  
  if (titleLower.includes('inlandsch') || titleLower.includes('binnenlands')) {
    inferredThemes.push('sosial');
  }
  
  if (titleLower.includes('volk') || titleLower.includes('stam')) {
    inferredThemes.push('etnografi');
  }
  
  if (titleLower.includes('bovenlanden') || titleLower.includes('benedenlanden')) {
    inferredThemes.push('geografi');
  }
  
  if (titleLower.includes('geschiedenis') || titleLower.includes('historie')) {
    inferredThemes.push('sejarah');
  }
  
  return inferredThemes;
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





