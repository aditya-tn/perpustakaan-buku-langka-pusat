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

// 🆕 METHOD: Semantic Theme Matching
calculateSemanticThemeMatch(book, playlist) {
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
    score = overlappingThemes.length * 20;
    console.log(`✅ THEME OVERLAP: [${overlappingThemes.join(', ')}] → +${score}`);
  }
  
  // Bonus for strong theme matches
  const strongThemes = ['sejarah', 'kolonial', 'budaya', 'politik', 'sosial'];
  const strongMatches = overlappingThemes.filter(theme => 
    strongThemes.includes(theme)
  ).length;
  
  if (strongMatches > 0) {
    score += strongMatches * 15;
    console.log(`💪 STRONG THEME MATCHES: ${strongMatches} → +${strongMatches * 15}`);
  }
  
  return Math.min(80, score);
},

// 🆕 METHOD: Extract Semantic Themes dari Buku
extractSemanticThemes(book) {
  const text = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
  const themes = [];
  
  // Dynamic theme detection berdasarkan konten
  const themePatterns = {
    'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'era', 'abad', 'tahun'],
    'kolonial': ['kolonial', 'belanda', 'dutch', 'penjajahan', 'hindia belanda', 'voc', 'colonial'],
    'politik': ['politik', 'pemerintahan', 'negara', 'kekuasaan', 'government', 'administration'],
    'sosial': ['sosial', 'masyarakat', 'community', 'masyarakatakat', 'struktur sosial'],
    'budaya': ['budaya', 'cultural', 'tradisi', 'adat', 'kesenian', 'kebudayaan'],
    'ekonomi': ['ekonomi', 'economic', 'perdagangan', 'commerce', 'industri'],
    'militer': ['militer', 'tentara', 'perang', 'pertempuran', 'military'],
    'geografi': ['geografi', 'wilayah', 'daerah', 'region', 'geographic'],
    'antropologi': ['antropologi', 'antropology', 'suku', 'etnis', 'ethnic'],
    'hukum': ['hukum', 'law', 'peraturan', 'legal', 'undang-undang']
  };
  
  for (const [theme, keywords] of Object.entries(themePatterns)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  // Fallback: jika tidak ada tema terdeteksi, coba infer dari judul
  if (themes.length === 0) {
    themes.push(...this.inferThemesFromTitle(book.judul));
  }
  
  return themes.length > 0 ? themes : ['umum'];
},

// 🆕 METHOD: Extract Semantic Themes dari Playlist
extractSemanticThemesFromPlaylist(playlist) {
  const text = `${playlist.name} ${playlist.description || ''}`.toLowerCase();
  const themes = [];
  
  const themePatterns = {
    'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman'],
    'kolonial': ['kolonial', 'belanda', 'penjajahan'],
    'politik': ['politik', 'pemerintahan', 'negara'],
    'sosial': ['sosial', 'masyarakat', 'community'],
    'budaya': ['budaya', 'cultural', 'tradisi', 'adat'],
    'ekonomi': ['ekonomi', 'economic', 'perdagangan'],
    'militer': ['militer', 'tentara', 'perang', 'military'],
    'geografi': ['geografi', 'wilayah', 'daerah'],
    'biografi': ['biografi', 'tokoh', 'pahlawan']
  };
  
  for (const [theme, keywords] of Object.entries(themePatterns)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  return themes.length > 0 ? themes : ['umum'];
},

// 🆕 COMPREHENSIVE HISTORICAL TO MODERN MAPPING
calculateGeographicMatch(book, playlist) {
  console.log(`\n🗺️ ANALYZING GEOGRAPHIC MATCH:`);
  
  const bookLocations = this.extractGeographicLocations(book);
  const playlistLocations = this.extractGeographicLocationsFromPlaylist(playlist);
  
  console.log(`📘 Book Locations: [${bookLocations.join(', ')}]`);
  console.log(`📗 Playlist Locations: [${playlistLocations.join(', ')}]`);
  
  let score = 0;
  
  // 1. Exact location matches
  const exactMatches = bookLocations.filter(location =>
    playlistLocations.includes(location)
  );
  
  if (exactMatches.length > 0) {
    score = exactMatches.length * 25;
    console.log(`📍 EXACT LOCATION MATCHES: [${exactMatches.join(', ')}] → +${score}`);
  }
  
  // 2. Historical to modern mapping
  const historicalMatches = this.calculateHistoricalToModernMapping(bookLocations, playlistLocations);
  score += historicalMatches;
  
  // 3. Regional hierarchy matches
  const regionalMatches = this.calculateRegionalHierarchy(bookLocations, playlistLocations);
  score += regionalMatches;
  
  return Math.min(80, score);
},

// 🆕 COMPREHENSIVE HISTORICAL TO MODERN MAPPING
calculateHistoricalToModernMapping(bookLocations, playlistLocations) {
  let score = 0;
  
  // 🏛️ COMPREHENSIVE MAPPING: Hindia Belanda → Indonesia Modern
  const historicalMappings = {
    // 🇮🇩 INDONESIA MODERN (Root Level)
    'hindia belanda': ['indonesia', 'sumatra', 'jawa', 'bali', 'sulawesi', 'kalimantan', 'papua', 'maluku', 'nusa tenggara'],
    'dutch east indies': ['indonesia', 'sumatra', 'jawa', 'bali', 'sulawesi', 'kalimantan', 'papua'],
    'netherlands east indies': ['indonesia', 'sumatra', 'jawa', 'bali', 'sulawesi', 'kalimantan', 'papua'],
    
    // 🏝️ SUMATRA REGION
    'sumatra\'s westkust': ['sumatra barat', 'sumatra', 'indonesia'],
    'sumatra\'s oostkust': ['sumatra utara', 'riau', 'sumatra', 'indonesia'],
    'sumatra\'s zuidkust': ['lampung', 'bengkulu', 'sumatra', 'indonesia'],
    'pantai barat sumatra': ['sumatra barat', 'aceh', 'sumatra', 'indonesia'],
    'pantai timur sumatra': ['sumatra utara', 'riau', 'sumatra', 'indonesia'],
    
    // 🗾 JAVA REGION  
    'java': ['jawa', 'indonesia'],
    'west java': ['jawa barat', 'jawa', 'indonesia'],
    'midden java': ['jawa tengah', 'jawa', 'indonesia'],
    'oost java': ['jawa timur', 'jawa', 'indonesia'],
    
    // 🏙️ JAVA CITIES (Historical → Modern)
    'batavia': ['jakarta', 'jawa barat', 'jawa', 'indonesia'],
    'buitenzorg': ['bogor', 'jawa barat', 'jawa', 'indonesia'],
    'bandoeng': ['bandung', 'jawa barat', 'jawa', 'indonesia'],
    'soerabaja': ['surabaya', 'jawa timur', 'jawa', 'indonesia'],
    'semarang': ['semarang', 'jawa tengah', 'jawa', 'indonesia'],
    'yogyakarta': ['yogyakarta', 'jawa tengah', 'jawa', 'indonesia'],
    'solo': ['surakarta', 'jawa tengah', 'jawa', 'indonesia'],
    
    // 🏔️ SUMATRA CITIES & REGIONS
    'padang': ['padang', 'sumatra barat', 'sumatra', 'indonesia'],
    'bukittinggi': ['bukittinggi', 'sumatra barat', 'sumatra', 'indonesia'],
    'payakumbuh': ['payakumbuh', 'sumatra barat', 'sumatra', 'indonesia'],
    'medan': ['medan', 'sumatra utara', 'sumatra', 'indonesia'],
    'pematang siantar': ['pematang siantar', 'sumatra utara', 'sumatra', 'indonesia'],
    'palembang': ['palembang', 'sumatra selatan', 'sumatra', 'indonesia'],
    'jambi': ['jambi', 'sumatra', 'indonesia'],
    'bengkulu': ['bengkulu', 'sumatra', 'indonesia'],
    'lampung': ['lampung', 'sumatra', 'indonesia'],
    
    // 🛶 ACEH REGION
    'aceh': ['aceh', 'sumatra', 'indonesia'],
    'atjeh': ['aceh', 'sumatra', 'indonesia'],
    'kutaraja': ['banda aceh', 'aceh', 'sumatra', 'indonesia'],
    
    // 🏝️ BORNEO/KALIMANTAN
    'borneo': ['kalimantan', 'indonesia'],
    'west borneo': ['kalimantan barat', 'kalimantan', 'indonesia'],
    'south borneo': ['kalimantan selatan', 'kalimantan', 'indonesia'],
    'east borneo': ['kalimantan timur', 'kalimantan', 'indonesia'],
    'pontianak': ['pontianak', 'kalimantan barat', 'kalimantan', 'indonesia'],
    'banjarmasin': ['banjarmasin', 'kalimantan selatan', 'kalimantan', 'indonesia'],
    'balikpapan': ['balikpapan', 'kalimantan timur', 'kalimantan', 'indonesia'],
    
    // 🏝️ SULAWESI/CELEBES
    'celebes': ['sulawesi', 'indonesia'],
    'sulawesi': ['sulawesi', 'indonesia'],
    'makassar': ['makassar', 'sulawesi selatan', 'sulawesi', 'indonesia'],
    'manado': ['manado', 'sulawesi utara', 'sulawesi', 'indonesia'],
    
    // 🏝️ BALI & NUSA TENGGARA
    'bali': ['bali', 'indonesia'],
    'lombok': ['lombok', 'nusa tenggara barat', 'indonesia'],
    'sumbawa': ['sumbawa', 'nusa tenggara barat', 'indonesia'],
    'flores': ['flores', 'nusa tenggara timur', 'indonesia'],
    'timor': ['timor', 'nusa tenggara timur', 'indonesia'],
    
    // 🏝️ MALUKU & PAPUA
    'molukken': ['maluku', 'indonesia'],
    'ambon': ['ambon', 'maluku', 'indonesia'],
    'ternate': ['ternate', 'maluku utara', 'maluku', 'indonesia'],
    'tidore': ['tidore', 'maluku utara', 'maluku', 'indonesia'],
    'nieuw guinea': ['papua', 'indonesia'],
    'west papua': ['papua barat', 'papua', 'indonesia'],
    
    // 🌏 CULTURAL & ETHNIC REGIONS
    'minangkabau': ['sumatra barat', 'sumatra', 'indonesia'],
    'minang': ['sumatra barat', 'sumatra', 'indonesia'],
    'batak': ['sumatra utara', 'sumatra', 'indonesia'],
    'malay': ['sumatra', 'kalimantan', 'indonesia', 'malaysia'],
    'javanese': ['jawa', 'indonesia'],
    'sundanese': ['jawa barat', 'jawa', 'indonesia'],
    'balinese': ['bali', 'indonesia'],
    'bugis': ['sulawesi selatan', 'sulawesi', 'indonesia'],
    'makassar': ['sulawesi selatan', 'sulawesi', 'indonesia'],
    
    // 🌍 INTERNATIONAL CONNECTIONS
    'malaya': ['malaysia'],
    'british malaya': ['malaysia'],
    'straits settlements': ['malaysia', 'singapore'],
    'singapore': ['singapore'],
    'negri sembilan': ['malaysia', 'sumatra barat'], // Cultural connection
    'negeri sembilan': ['malaysia', 'sumatra barat']
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

// 🆕 ENHANCED GEOGRAPHIC LOCATION EXTRACTION
extractGeographicLocations(book) {
  const text = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
  const locations = [];
  
  // COMPREHENSIVE LOCATION PATTERNS - Historical + Modern
  const locationPatterns = {
    // 🇮🇩 INDONESIA MODERN
    'indonesia': ['indonesia', 'nusantara'],
    'sumatra': ['sumatra', 'sumatera'],
    'jawa': ['jawa', 'java'],
    'bali': ['bali'],
    'sulawesi': ['sulawesi', 'celebes'],
    'kalimantan': ['kalimantan', 'borneo'],
    'papua': ['papua', 'nieuw guinea', 'west papua'],
    'maluku': ['maluku', 'molukken'],
    'nusa tenggara': ['nusa tenggara'],
    
    // 🏝️ SUMATRA PROVINCES
    'aceh': ['aceh', 'atjeh'],
    'sumatra utara': ['sumatra utara', 'north sumatra'],
    'sumatra barat': ['sumatra barat', 'west sumatra', 'minangkabau', 'minang'],
    'riau': ['riau'],
    'jambi': ['jambi'],
    'sumatra selatan': ['sumatra selatan', 'south sumatra'],
    'bengkulu': ['bengkulu'],
    'lampung': ['lampung'],
    
    // 🗾 JAVA PROVINCES
    'jakarta': ['jakarta', 'batavia'],
    'jawa barat': ['jawa barat', 'west java', 'bogor', 'buitenzorg', 'bandung', 'bandoeng'],
    'jawa tengah': ['jawa tengah', 'central java', 'semarang', 'yogyakarta', 'solo', 'surakarta'],
    'jawa timur': ['jawa timur', 'east java', 'surabaya', 'soerabaja'],
    'banten': ['banten'],
    
    // 🏝️ KALIMANTAN PROVINCES
    'kalimantan barat': ['kalimantan barat', 'west borneo', 'pontianak'],
    'kalimantan tengah': ['kalimantan tengah', 'central borneo'],
    'kalimantan selatan': ['kalimantan selatan', 'south borneo', 'banjarmasin'],
    'kalimantan timur': ['kalimantan timur', 'east borneo', 'balikpapan'],
    
    // 🏝️ SULAWESI PROVINCES
    'sulawesi utara': ['sulawesi utara', 'north celebes', 'manado'],
    'sulawesi tengah': ['sulawesi tengah', 'central celebes'],
    'sulawesi selatan': ['sulawesi selatan', 'south celebes', 'makassar'],
    
    // 🏛️ HISTORICAL DUTCH TERMS
    'hindia belanda': ['hindia belanda', 'dutch east indies', 'netherlands east indies'],
    'batavia': ['batavia'],
    'buitenzorg': ['buitenzorg'],
    'bandoeng': ['bandoeng'],
    'soerabaja': ['soerabaja'],
    
    // 🌏 INTERNATIONAL
    'malaysia': ['malaysia', 'malaya', 'british malaya'],
    'singapore': ['singapore', 'singapura'],
    'belanda': ['belanda', 'netherlands', 'holland', 'dutch']
  };
  
  for (const [location, patterns] of Object.entries(locationPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      locations.push(location);
    }
  }
  
  return [...new Set(locations)]; // Remove duplicates
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

// 🆕 METHOD: Infer Themes from Title (fallback)
inferThemesFromTitle(title) {
  const titleLower = title.toLowerCase();
  const inferredThemes = [];
  
  if (titleLower.includes('sejarah') || titleLower.includes('history')) {
    inferredThemes.push('sejarah');
  }
  
  if (titleLower.includes('politik') || titleLower.includes('political')) {
    inferredThemes.push('politik');
  }
  
  if (titleLower.includes('sosial') || titleLower.includes('social')) {
    inferredThemes.push('sosial');
  }
  
  if (titleLower.includes('budaya') || titleLower.includes('culture')) {
    inferredThemes.push('budaya');
  }
  
  if (titleLower.includes('ekonomi') || titleLower.includes('economy')) {
    inferredThemes.push('ekonomi');
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



