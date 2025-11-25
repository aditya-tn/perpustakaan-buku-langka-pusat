// services/aiMatchingService.js - COMPLETE FIXED VERSION
import { generateAIResponse } from '../lib/gemini';

export const aiMatchingService = {

  // ==================== EXPERT MODE ====================
  // Langsung matching metadata buku vs metadata playlist
  async expertDirectMatch(book, playlist) {
    console.log('⚡ EXPERT MODE: Direct metadata matching');
    try {
      // Jika kedua metadata ada, gunakan direct comparison
      if (book.metadata_structured && playlist.ai_metadata) {
        return this.calculateDirectMetadataMatch(book, playlist);
      }
      // Fallback ke AI analysis jika metadata tidak lengkap
      console.log('⚠️ Metadata tidak lengkap, fallback ke AI analysis');
      return this.analyzeBookPlaylistMatch(book, playlist);
    } catch (error) {
      console.error('❌ Expert mode failed:', error);
      return this.getEmergencyFallback(book, playlist);
    }
  },

  // ==================== METADATA MANAGEMENT ====================
  async ensurePlaylistMetadata(playlists) {
    const playlistsWithMetadata = [];
    for (const playlist of playlists) {
      try {
        // Jika playlist belum punya metadata, generate dulu
        if (!playlist.ai_metadata || playlist.ai_metadata.is_empty) {
          console.log(`🔄 Generating metadata for playlist: ${playlist.name}`);
          // Panggil API generate metadata playlist
          const metadata = await this.generatePlaylistMetadata(playlist);
          playlist.ai_metadata = metadata;
        }
        playlistsWithMetadata.push(playlist);
      } catch (error) {
        console.error(`❌ Failed to get metadata for ${playlist.name}:`, error);
        playlistsWithMetadata.push(playlist); // Tetap gunakan walau tanpa metadata
      }
    }
    return playlistsWithMetadata;
  },

  async generatePlaylistMetadata(playlist) {
    try {
      // Dynamic import untuk avoid circular dependencies
      const { playlistMetadataService } = await import('./playlistMetadataService.js');
      if (playlistMetadataService && typeof playlistMetadataService.generateAndStorePlaylistMetadata === 'function') {
        return await playlistMetadataService.generateAndStorePlaylistMetadata(playlist.id);
      } else {
        console.error('❌ playlistMetadataService not available');
        return this.createBasicPlaylistMetadata(playlist);
      }
    } catch (error) {
      console.error('❌ Failed to generate playlist metadata:', error);
      return this.createBasicPlaylistMetadata(playlist);
    }
  },

  createBasicPlaylistMetadata(playlist) {
    const name = playlist.name.toLowerCase();
    const description = playlist.description?.toLowerCase() || '';
    console.log(`🔍 Generating metadata for: ${playlist.name}`, { name, description });

    // Enhanced inference dengan context yang lebih baik
    const themes = this.inferThemesFromPlaylist(name, description);
    const locations = this.inferLocationsFromPlaylist(name, description);
    const periods = this.inferPeriodsFromPlaylist(name, description);
    const contentType = this.inferContentTypeFromPlaylist(name, description);

    const metadata = {
      key_themes: themes,
      geographic_focus: locations.length > 0 ? locations : ['indonesia'], // Default fallback
      historical_period: periods.length > 0 ? periods : ['kolonial'], // Default fallback
      content_type: contentType || 'koleksi',
      subject_categories: themes,
      temporal_coverage: this.inferTemporalCoverage(name, description),
      is_fallback: true,
      generated_at: new Date().toISOString()
    };

    console.log(`✅ Generated COMPLETE metadata for: ${playlist.name}`, metadata);
    return metadata;
  },

  inferThemesFromPlaylist(name, description) {
    const text = name + ' ' + description;
    const themes = new Set();

    // Enhanced theme detection dengan lebih banyak keywords
    const themeKeywords = {
      'militer': ['militer', 'perang', 'tni', 'knil', 'tentara', 'angkatan perang', 'pertahanan'],
      'sejarah': ['sejarah', 'historis', 'masa lalu', 'peristiwa'],
      'kolonial': ['kolonial', 'belanda', 'hindia belanda', 'penjajahan', 'kolonialisme'],
      'perjuangan': ['perjuangan', 'kemerdekaan', 'revolusi', 'nasionalisme', 'perlawanan'],
      'politik': ['politik', 'pemerintahan', 'negara', 'kekuasaan'],
      'budaya': ['budaya', 'seni', 'tradisi', 'adat', 'kesenian'],
      'biografi': ['biografi', 'tokoh', 'pahlawan', 'tokoh sejarah'],
      'transportasi': ['transportasi', 'kereta', 'perkeretaapian', 'ka'],
      'sosial': ['sosial', 'masyarakat', 'komunitas', 'rakyat'],
      'ekonomi': ['ekonomi', 'perdagangan', 'industri']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.add(theme);
        console.log(`✅ Detected theme "${theme}" for playlist`);
      }
    }

    // Fallback: infer from name patterns
    if (themes.size === 0) {
      if (name.includes('sejarah')) themes.add('sejarah');
      if (name.includes('militer')) themes.add('militer');
      if (name.includes('perang')) themes.add('militer');
      if (name.includes('budaya')) themes.add('budaya');
      if (name.includes('biografi')) themes.add('biografi');
    }

    return Array.from(themes).length > 0 ? Array.from(themes) : ['sejarah', 'indonesia'];
  },

  inferLocationsFromPlaylist(name, description) {
    const text = name + ' ' + description;
    const locations = new Set();

    const locationKeywords = {
      'indonesia': ['indonesia', 'nusantara', 'archipelago'],
      'sumatra': ['sumatra', 'sumatera', 'aceh', 'padang', 'medan', 'batak'],
      'jawa': ['jawa', 'java', 'jakarta', 'surabaya', 'yogyakarta', 'solo'],
      'sumatra utara': ['sumatra utara', 'north sumatra', 'medan'],
      'sumatra barat': ['sumatra barat', 'west sumatra', 'padang'],
      'bali': ['bali'],
      'kalimantan': ['kalimantan', 'borneo'],
      'sulawesi': ['sulawesi', 'celebes'],
      'papua': ['papua', 'irian']
    };

    for (const [location, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        locations.add(location);
        console.log(`✅ Detected location "${location}" for playlist`);
      }
    }

    // Auto-add Indonesia jika ada region tertentu
    if (locations.size > 0 && !locations.has('indonesia')) {
      const indonesianRegions = ['sumatra', 'jawa', 'bali', 'kalimantan', 'sulawesi', 'papua'];
      if (Array.from(locations).some(loc => indonesianRegions.includes(loc))) {
        locations.add('indonesia');
      }
    }

    return Array.from(locations);
  },

  inferPeriodsFromPlaylist(name, description) {
    const text = name + ' ' + description;
    const periods = new Set();

    const periodKeywords = {
      'kolonial': ['kolonial', 'belanda', 'hindia belanda', 'voc', 'knil', 'penjajahan'],
      'pra-kolonial': ['pra-kolonial', 'kerajaan', 'kesultanan', 'majapahit', 'sriwijaya'],
      'revolusi': ['revolusi', 'kemerdekaan', '1945', 'proklamasi'],
      'abad ke-19': ['abad ke-19', '19th', '1825', '1830', '1800'],
      'abad ke-20': ['abad ke-20', '20th', '1900', '1940'],
      'modern': ['modern', 'kontemporer', 'sekarang']
    };

    for (const [period, keywords] of Object.entries(periodKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        periods.add(period);
        console.log(`✅ Detected period "${period}" for playlist`);
      }
    }

    // Auto-infer dari tahun
    const yearMatch = text.match(/\b(1[0-9]{3}|2[0-9]{3})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year < 1800) periods.add('pra-kolonial');
      else if (year < 1900) periods.add('abad ke-19');
      else if (year < 2000) periods.add('abad ke-20');
      else periods.add('modern');
    }

    return Array.from(periods).length > 0 ? Array.from(periods) : ['kolonial'];
  },

  inferContentTypeFromPlaylist(name, description) {
    const text = name + ' ' + description;
    const contentTypeMap = {
      'biografi': ['biografi', 'tokoh', 'pahlawan'],
      'militer': ['militer', 'perang', 'pertahanan', 'tni', 'knil'],
      'sejarah': ['sejarah', 'historis', 'peristiwa'],
      'budaya': ['budaya', 'seni', 'tradisi', 'kesenian'],
      'transportasi': ['transportasi', 'kereta', 'perkeretaapian'],
      'politik': ['politik', 'pemerintahan'],
      'sosial': ['sosial', 'masyarakat']
    };

    for (const [type, keywords] of Object.entries(contentTypeMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        console.log(`✅ Detected content type "${type}" for playlist`);
        return type;
      }
    }

    return 'koleksi';
  },

  inferTemporalCoverage(name, description) {
    const text = name + ' ' + description;
    if (text.includes('1825-1830')) return '1825-1830';
    if (text.includes('abad ke-19')) return '1800-1899';
    if (text.includes('kolonial')) return '1800-1945';
    return '';
  },

  // ==================== ENHANCED NOVICE RECOMMENDATIONS ====================
async noviceRecommendations({ book, playlists = [] }) {
  console.log('🤖 ENHANCED NOVICE MODE: Starting colonial-aware recommendations...');
  
  try {
    // STEP 0: Pastikan playlist punya quality metadata
    const playlistsWithMetadata = await this.ensureQualityPlaylistMetadata(playlists);

    // STEP 1: Filter playlists yang available
    const availablePlaylists = playlistsWithMetadata.filter(playlist =>
      !playlist.books?.some(b => b.id === book.id)
    );

    console.log('🎯 Available playlists with metadata:', availablePlaylists.length);

    if (availablePlaylists.length === 0) {
      return [];
    }

    // STEP 2: Enhanced scoring dengan colonial context
    const scoredPlaylists = await this.calculateEnhancedScores(book, availablePlaylists);
    
    // STEP 3: 🎯 FLEXIBLE THRESHOLD STRATEGY
    let topPlaylists = [];
    
    // Strategy 1: Ambil yang score >= 15
    topPlaylists = scoredPlaylists.filter(item => item.score >= 15).slice(0, 3);
    
    // Strategy 2: Jika kurang dari 3, ambil yang score >= 10  
    if (topPlaylists.length < 3) {
      const additional = scoredPlaylists
        .filter(item => item.score >= 10 && !topPlaylists.includes(item))
        .slice(0, 3 - topPlaylists.length);
      topPlaylists = [...topPlaylists, ...additional];
    }
    
    // Strategy 3: Jika masih kurang dari 3, ambil top 3 teratas regardless
    if (topPlaylists.length < 3) {
      const remaining = scoredPlaylists
        .filter(item => !topPlaylists.includes(item))
        .slice(0, 3 - topPlaylists.length);
      topPlaylists = [...topPlaylists, ...remaining];
      console.log(`⚠️ Using top ${remaining.length} playlists regardless of score`);
    }

    console.log('📊 Final top playlists:', topPlaylists.map(p => ({
      name: p.playlist.name,
      score: p.score,
      usedFallback: p.score < 10
    })));

    if (topPlaylists.length === 0) {
      console.log('🔄 No playlists available, using emergency fallback');
      return this.getEmergencyResults(book, availablePlaylists);
    }

    // STEP 4: AI Enhancement dengan better error handling
    let aiResults = [];
    try {
      console.log('🚀 Calling AI enhancement...');
      aiResults = await this.getAIEnhancedRecommendations(book, topPlaylists);
      console.log('✅ AI enhancement successful:', aiResults.length, 'results');
    } catch (aiError) {
      console.error('❌ AI enhancement failed:', aiError);
      aiResults = this.convertToAIFormat(topPlaylists);
    }

    return aiResults;

  } catch (error) {
    console.error('💥 Enhanced novice mode failed:', error);
    return this.getEmergencyResults(book, playlists);
  }
},

  // NEW: Enhanced metadata quality check
  async ensureQualityPlaylistMetadata(playlists) {
    const results = [];
    
    for (const playlist of playlists) {
      try {
        // Check if playlist has basic or AI-generated metadata
        const hasQualityMetadata = playlist.ai_metadata && 
          !playlist.ai_metadata.is_fallback &&
          playlist.ai_metadata.key_themes?.length > 0;
        
        if (!hasQualityMetadata) {
          console.log(`🔄 Generating quality metadata for: ${playlist.name}`);
          const metadata = await this.generatePlaylistMetadata(playlist);
          playlist.ai_metadata = metadata;
        }
        
        results.push(playlist);
      } catch (error) {
        console.error(`❌ Failed to ensure metadata for ${playlist.name}:`, error);
        results.push(playlist); // Keep anyway
      }
    }
    
    return results;
  },

  // NEW: Enhanced scoring dengan colonial context
async calculateEnhancedScores(book, playlists) {
  const scoredPlaylists = [];
  
  for (const playlist of playlists) {
    try {
      const matchResult = this.calculateDirectMetadataMatch(book, playlist);
      
      // 🎯 DEBUG DETAILED SCORING
      console.log(`📊 SCORING DEBUG for "${playlist.name}":`, {
        themeScore: matchResult.matchScore,
        finalScore: matchResult.matchScore,
        factors: matchResult.keyFactors,
        reasoning: matchResult.reasoning
      });
      
      scoredPlaylists.push({
        playlist,
        score: matchResult.matchScore,
        matchData: matchResult
      });
    } catch (error) {
      console.error(`❌ Error scoring ${playlist.name}:`, error);
      scoredPlaylists.push({ playlist, score: 0 });
    }
  }
  
  const sorted = scoredPlaylists.sort((a, b) => b.score - a.score);
  
  // 🎯 DEBUG FINAL SCORES
  console.log('🏆 FINAL SCORES:', sorted.map(p => ({
    name: p.playlist.name,
    score: p.score,
    factors: p.matchData?.keyFactors || []
  })));
  
  return sorted;
},

  // NEW: Colonial-aware scoring algorithm
  async calculateColonialAwareScore(book, playlist) {
    const bookMeta = book.metadata_structured || {};
    const playlistMeta = playlist.ai_metadata || {};
    
    let totalScore = 0;
    const factors = [];
    
    // 1. Theme Matching (40%) - Enhanced
    const themeScore = this.calculateThemeMatch(bookMeta.key_themes, playlistMeta.key_themes);
    totalScore += themeScore * 0.4;
    if (themeScore > 0) factors.push('tema_kolonial_sejalan');
    
    // 2. Geographic Matching (25%) - Enhanced untuk region kolonial
    const geoScore = this.calculateColonialGeographicMatch(
      bookMeta.geographic_focus, 
      playlistMeta.geographic_focus
    );
    totalScore += geoScore * 0.25;
    if (geoScore > 0) factors.push('lokasi_kolonial_serumpun');
    
    // 3. Historical Period Matching (20%)
    const periodScore = this.calculatePeriodMatch(
      bookMeta.historical_period, 
      playlistMeta.historical_period
    );
    totalScore += periodScore * 0.2;
    if (periodScore > 0) factors.push('periode_kolonial_sezaman');
    
    // 4. Content Type Matching (15%)
    const contentTypeScore = this.calculateContentTypeMatch(
      bookMeta.content_type, 
      playlistMeta.content_type
    );
    totalScore += contentTypeScore * 0.15;
    if (contentTypeScore > 0) factors.push('jenis_konten_kolonial_sesuai');
    
    const finalScore = Math.min(100, Math.round(totalScore));
    
    return {
      finalScore,
      confidence: factors.length > 0 ? 0.8 : 0.3,
      reasoning: this.generateColonialMatchReasoning(finalScore, factors),
      keyFactors: factors,
      matchType: 'colonial_enhanced'
    };
  },

  // services/aiMatchingService.js - CONTEXT-AWARE MATCHING

calculateContextAwareMatch(book, playlist) {
  const bookMeta = book.metadata_structured || {};
  const playlistMeta = playlist.ai_metadata || {};
  
  const playlistType = playlistMeta.content_type || 'general';
  
  // MATCHING STRATEGY BERDASARKAN JENIS PLAYLIST
  const matchingStrategies = {
    literature: this.calculateLiteratureMatch.bind(this),
    art_culture: this.calculateArtCultureMatch.bind(this),
    biography: this.calculateBiographyMatch.bind(this),
    military_history: this.calculateMilitaryHistoryMatch.bind(this),
    history: this.calculateHistoryMatch.bind(this),
    general: this.calculateGeneralMatch.bind(this)
  };
  
  const matchFunction = matchingStrategies[playlistType] || matchingStrategies.general;
  return matchFunction(bookMeta, playlistMeta);
},

// MATCHING UNTUK SASTRA
calculateLiteratureMatch(bookMeta, playlistMeta) {
  let score = 0;
  const factors = [];
  
  // Theme matching untuk sastra
  if (bookMeta.key_themes && playlistMeta.key_themes) {
    const themeScore = this.calculateThemeMatch(bookMeta.key_themes, playlistMeta.key_themes);
    score += themeScore * 0.6;
    if (themeScore > 0) factors.push('tema_sastra_sejalan');
  }
  
  // Author matching (jika ada)
  if (bookMeta.authors && playlistMeta.authors) {
    const authorMatch = bookMeta.authors.some(author => 
      playlistMeta.authors.includes(author)
    );
    if (authorMatch) {
      score += 30;
      factors.push('penulis_sama');
    }
  }
  
  // Genre matching
  if (bookMeta.literary_genres && playlistMeta.literary_genres) {
    const genreMatch = bookMeta.literary_genres.some(genre =>
      playlistMeta.literary_genres.includes(genre)
    );
    if (genreMatch) {
      score += 10;
      factors.push('genre_sastra_sesuai');
    }
  }
  
  return {
    matchScore: Math.min(100, Math.round(score)),
    confidence: 0.7,
    reasoning: factors.length > 0 ? 
      `Kecocokan sastra: ${factors.join(', ')}` : 
      'Kecocokan rendah untuk konten sastra',
    keyFactors: factors
  };
},

// MATCHING UNTUK SEJARAH MILITER (spesifik)
calculateMilitaryHistoryMatch(bookMeta, playlistMeta) {
  let score = 0;
  const factors = [];
  
  // Military unit matching
  if (bookMeta.military_units && playlistMeta.military_units) {
    const unitMatch = bookMeta.military_units.some(unit =>
      playlistMeta.military_units.includes(unit)
    );
    if (unitMatch) {
      score += 40;
      factors.push('unit_militer_sama');
    }
  }
  
  // Conflict matching
  if (bookMeta.conflicts && playlistMeta.conflicts) {
    const conflictMatch = bookMeta.conflicts.some(conflict =>
      playlistMeta.conflicts.includes(conflict)
    );
    if (conflictMatch) {
      score += 30;
      factors.push('konflik_sejarah_sama');
    }
  }
  
  // Theme matching
  if (bookMeta.key_themes && playlistMeta.key_themes) {
    const themeScore = this.calculateThemeMatch(bookMeta.key_themes, playlistMeta.key_themes);
    score += themeScore * 0.3;
    if (themeScore > 0) factors.push('tema_militer_sejalan');
  }
  
  return {
    matchScore: Math.min(100, Math.round(score)),
    confidence: 0.9,
    reasoning: factors.length > 0 ?
      `Kecocokan sejarah militer: ${factors.join(', ')}` :
      'Tidak ada kecocokan sejarah militer',
    keyFactors: factors
  };
},

// MATCHING UMUM (fallback)
calculateGeneralMatch(bookMeta, playlistMeta) {
  // Hanya match berdasarkan tema umum
  if (bookMeta.key_themes && playlistMeta.key_themes) {
    const themeScore = this.calculateThemeMatch(bookMeta.key_themes, playlistMeta.key_themes);
    return {
      matchScore: themeScore,
      confidence: 0.5,
      reasoning: themeScore > 0 ? 'Kecocokan tema umum' : 'Tidak ada kecocokan',
      keyFactors: themeScore > 0 ? ['tema_umum'] : []
    };
  }
  
  return {
    matchScore: 0,
    confidence: 0.3,
    reasoning: 'Tidak ada metadata untuk matching',
    keyFactors: []
  };
},
  
  // NEW: Colonial geographic matching
  calculateColonialGeographicMatch(bookLocs = [], playlistLocs = []) {
    if (!bookLocs.length || !playlistLocs.length) return 0;
    
    // Colonial geographic hierarchy
    const colonialHierarchy = {
      'hindia belanda': ['indonesia', 'nusantara', 'asia tenggara'],
      'jawa': ['hindia belanda', 'indonesia', 'asia tenggara'],
      'sumatra': ['hindia belanda', 'indonesia', 'asia tenggara'],
      'batavia': ['jawa', 'hindia belanda', 'indonesia'],
      'surabaya': ['jawa', 'hindia belanda', 'indonesia'],
      'medan': ['sumatra', 'hindia belanda', 'indonesia'],
      'padang': ['sumatra', 'hindia belanda', 'indonesia']
    };
    
    // Exact match
    const exactMatches = bookLocs.filter(bookLoc =>
      playlistLocs.includes(bookLoc)
    );
    if (exactMatches.length > 0) return 100;
    
    // Colonial hierarchy match
    let bestScore = 0;
    for (const bookLoc of bookLocs) {
      for (const playlistLoc of playlistLocs) {
        // Direct colonial relationship
        if (colonialHierarchy[bookLoc]?.includes(playlistLoc)) {
          bestScore = Math.max(bestScore, 90);
        }
        if (colonialHierarchy[playlistLoc]?.includes(bookLoc)) {
          bestScore = Math.max(bestScore, 90);
        }
        
        // Shared colonial parent
        const bookParents = colonialHierarchy[bookLoc] || [];
        const playlistParents = colonialHierarchy[playlistLoc] || [];
        const commonParents = bookParents.filter(parent => 
          playlistParents.includes(parent)
        );
        if (commonParents.length > 0) {
          bestScore = Math.max(bestScore, 70);
        }
      }
    }
    
    return bestScore;
  },

  // NEW: Enhanced theme matching dengan colonial context
calculateThemeMatch(bookThemes = [], playlistThemes = []) {
  if (!bookThemes.length || !playlistThemes.length) return 0;

  console.log('🎯 ENHANCED THEME MATCHING:', { bookThemes, playlistThemes });

  // EXPANDED SEMANTIC MAPPING UNTUK KONTEKS KOLONIAL
  const semanticThemeMapping = {
    // HUKUM & PERADILAN
    'sistem peradilan': ['hukum', 'peradilan', 'keadilan', 'legal', 'pengadilan', 'yudikatif'],
    'hukum kolonial': ['kolonial', 'hukum', 'belanda', 'peraturan', 'undang-undang'],
    'administrasi keadilan': ['administrasi', 'keadilan', 'hukum', 'birokrasi'],
    
    // MILITER & KEAMANAN
    'disintegrasi knil': ['militer', 'knil', 'tentara', 'angkatan perang', 'keamanan'],
    'keruntuhan knil': ['militer', 'knil', 'sejarah', 'kolonial', 'keamanan'],
    'angkatan bersenjata kolonial': ['militer', 'tentara', 'kolonial', 'keamanan'],
    
    // KOLONIAL & SEJARAH
    'kolonialisme belanda': ['kolonial', 'belanda', 'sejarah', 'penjajahan'],
    'pendudukan jepang': ['jepang', 'sejarah', 'perang dunia', 'pendudukan'],
    
    // UMUM → SPESIFIK
    'sejarah': ['historis', 'masa lalu', 'peristiwa', 'kolonial', 'perang'],
    'budaya': ['seni', 'tradisi', 'adat', 'kesenian', 'sosial'],
    'politik': ['pemerintahan', 'negara', 'kekuasaan', 'kebijakan'],
    'sosial': ['masyarakat', 'komunitas', 'rakyat', 'budaya'],
    
    // SPESIFIK → UMUM
    'hukum': ['peradilan', 'legal', 'keadilan', 'politik'],
    'peradilan': ['hukum', 'keadilan', 'pengadilan', 'legal'],
    'administrasi': ['birokrasi', 'pemerintahan', 'manajemen', 'politik'],
    'keadilan': ['hukum', 'peradilan', 'legal', 'sosial']
  };

  let totalMatchScore = 0;
  let maxPossibleScore = bookThemes.length * 100;

  for (const bookTheme of bookThemes) {
    const bookThemeLower = bookTheme.toLowerCase();
    let bestMatchScore = 0;

    for (const playlistTheme of playlistThemes) {
      const playlistThemeLower = playlistTheme.toLowerCase();
      
      // 1. EXACT MATCH (100 points)
      if (bookThemeLower === playlistThemeLower) {
        bestMatchScore = Math.max(bestMatchScore, 100);
        console.log(`✅ Exact match: "${bookTheme}" = "${playlistTheme}"`);
        continue;
      }

      // 2. SEMANTIC MAPPING MATCH (80-100 points)
      const bookSemantic = semanticThemeMapping[bookThemeLower] || [bookThemeLower];
      const playlistSemantic = semanticThemeMapping[playlistThemeLower] || [playlistThemeLower];
      
      // Check semantic overlap
      const semanticOverlap = bookSemantic.some(bookTerm => 
        playlistSemantic.some(playlistTerm => 
          bookTerm === playlistTerm || 
          bookTerm.includes(playlistTerm) || 
          playlistTerm.includes(bookTerm)
        )
      );
      
      if (semanticOverlap) {
        bestMatchScore = Math.max(bestMatchScore, 90);
        console.log(`✅ Semantic mapping: "${bookTheme}" ↔ "${playlistTheme}"`);
        continue;
      }

      // 3. DIRECT SEMANTIC RELATIONSHIP (70-90 points)
      const hasDirectRelationship = 
        semanticThemeMapping[bookThemeLower]?.includes(playlistThemeLower) ||
        semanticThemeMapping[playlistThemeLower]?.includes(bookThemeLower);
      
      if (hasDirectRelationship) {
        bestMatchScore = Math.max(bestMatchScore, 85);
        console.log(`✅ Direct semantic: "${bookTheme}" → "${playlistTheme}"`);
        continue;
      }

      // 4. STRING SIMILARITY (50-80 points)
      const similarity = this.calculateStringSimilarity(bookThemeLower, playlistThemeLower);
      if (similarity > 0.6) {
        bestMatchScore = Math.max(bestMatchScore, Math.round(similarity * 100));
        console.log(`✅ Similarity: "${bookTheme}" ~ "${playlistTheme}" (${Math.round(similarity * 100)}%)`);
        continue;
      }

      // 5. KEYWORD INCLUSION (40-60 points)
      if (bookThemeLower.includes(playlistThemeLower) || playlistThemeLower.includes(bookThemeLower)) {
        bestMatchScore = Math.max(bestMatchScore, 50);
        console.log(`✅ Keyword inclusion: "${bookTheme}" ⊃ "${playlistTheme}"`);
        continue;
      }

      // 6. WORD-BY-WORD MATCH (30-50 points)
      const bookWords = bookThemeLower.split(' ');
      const playlistWords = playlistThemeLower.split(' ');
      const commonWords = bookWords.filter(word => 
        playlistWords.includes(word) && word.length > 3
      );
      
      if (commonWords.length > 0) {
        const wordScore = Math.min(50, commonWords.length * 25);
        bestMatchScore = Math.max(bestMatchScore, wordScore);
        console.log(`✅ Common words: "${bookTheme}" & "${playlistTheme}" = [${commonWords.join(', ')}]`);
      }
    }

    // 7. FALLBACK: CONTEXTUAL INFERENCE (20-40 points)
    if (bestMatchScore === 0) {
      // Jika buku tentang hukum kolonial dan playlist tentang sejarah, beri score dasar
      if ((bookThemeLower.includes('hukum') || bookThemeLower.includes('peradilan')) && 
          playlistThemes.some(theme => theme.includes('sejarah') || theme.includes('politik'))) {
        bestMatchScore = 30;
        console.log(`✅ Contextual inference: "${bookTheme}" dalam konteks sejarah`);
      }
    }

    totalMatchScore += bestMatchScore;
    console.log(`📊 Best match for "${bookTheme}": ${bestMatchScore}%`);
  }

  const finalScore = Math.min(100, Math.round(totalMatchScore / bookThemes.length));
  console.log(`🎯 Final theme match score: ${finalScore}%`);
  return finalScore;
},

// services/aiMatchingService.js - ADD EMERGENCY MATCHING

// Function baru untuk handle case dimana theme matching gagal
calculateEmergencyContextMatch(book, playlist) {
  console.log('🆘 Using emergency context matching');
  
  const bookThemes = book.metadata_structured?.key_themes || [];
  const playlistThemes = playlist.ai_metadata?.key_themes || [];
  const bookTitle = book.judul?.toLowerCase() || '';
  const playlistName = playlist.name?.toLowerCase() || '';
  
  let score = 0;
  const factors = [];

  // CONTEXTUAL KEYWORD MATCHING
  const contextualKeywords = {
    'kolonial': ['belanda', 'hindia', 'voc', 'knil', 'penjajahan'],
    'hukum': ['peradilan', 'keadilan', 'legal', 'pengadilan'],
    'sejarah': ['historis', 'masa lalu', 'peristiwa', 'kolonial'],
    'politik': ['pemerintahan', 'negara', 'kekuasaan']
  };

  // Check contextual relationships
  for (const [category, keywords] of Object.entries(contextualKeywords)) {
    const hasBookContext = bookThemes.some(theme => 
      keywords.some(keyword => theme.toLowerCase().includes(keyword))
    ) || keywords.some(keyword => bookTitle.includes(keyword));
    
    const hasPlaylistContext = playlistThemes.some(theme => 
      keywords.some(keyword => theme.toLowerCase().includes(keyword))
    ) || keywords.some(keyword => playlistName.includes(keyword));

    if (hasBookContext && hasPlaylistContext) {
      score += 25;
      factors.push(`konteks_${category}`);
      console.log(`✅ Contextual match: ${category}`);
    }
  }

  // TITLE-BASED FALLBACK MATCHING
  if (score === 0) {
    // Jika semua gagal, beri score berdasarkan common sense
    if ((bookTitle.includes('hukum') || bookTitle.includes('peradilan')) && 
        (playlistName.includes('sejarah') || playlistName.includes('kolonial'))) {
      score = 40;
      factors.push('common_sense_hukum_sejarah');
      console.log('✅ Common sense: buku hukum + playlist sejarah');
    }
  }

  return Math.min(100, score);
},

// UPDATE calculateDirectMetadataMatch untuk include emergency matching
calculateDirectMetadataMatch(book, playlist) {
  console.log('🔍 DIRECT METADATA MATCHING DEBUG');
  const bookMeta = book.metadata_structured || {};
  const playlistMeta = playlist.ai_metadata || {};

  let score = 0;
  const factors = [];
  const breakdown = {};

  // 1. THEME MATCHING (50%) - ⬆️ NAIKKAN WEIGHTING
  let themeScore = this.calculateThemeMatch(bookMeta.key_themes, playlistMeta.key_themes);
  
  // Jika theme matching gagal total, gunakan emergency matching
  if (themeScore === 0) {
    themeScore = this.calculateEmergencyContextMatch(book, playlist);
    if (themeScore > 0) {
      factors.push('emergency_context_match');
    }
  }
  
  score += themeScore * 0.5; // ⬅️ DARI 0.4 JADI 0.5
  breakdown.themeScore = themeScore;
  console.log(`🎯 Theme Score: ${themeScore}%`);
  if (themeScore > 0) factors.push('tema_sejalan');

  // 2. GEOGRAPHIC MATCHING (25%) - ⬇️ TURUNKAN WEIGHTING
  const geoScore = this.calculateGeographicMatch(bookMeta.geographic_focus, playlistMeta.geographic_focus);
  score += geoScore * 0.25; // ⬅️ DARI 0.3 JADI 0.25
  breakdown.geoScore = geoScore;
  console.log(`🗺️ Geographic Score: ${geoScore}%`);
  if (geoScore > 0) factors.push('lokasi_serumpun');

  // 3. HISTORICAL PERIOD MATCHING (15%) - ⬇️ TURUNKAN
  const periodScore = this.calculatePeriodMatch(bookMeta.historical_period, playlistMeta.historical_period);
  score += periodScore * 0.15; // ⬅️ DARI 0.2 JADI 0.15
  breakdown.periodScore = periodScore;
  console.log(`📅 Period Score: ${periodScore}%`);
  if (periodScore > 0) factors.push('periode_sezaman');

  // 4. CONTENT TYPE MATCHING (10%) - TETAP
  const contentTypeScore = this.calculateContentTypeMatch(bookMeta.content_type, playlistMeta.content_type);
  score += contentTypeScore * 0.1;
  breakdown.contentTypeScore = contentTypeScore;
  console.log(`📚 Content Type Score: ${contentTypeScore}%`);
  if (contentTypeScore > 0) factors.push('jenis_konten_sesuai');

  const finalScore = Math.min(100, Math.round(score));

  console.log(`✅ Final match score: ${finalScore}%`, { 
    factors, 
    breakdown 
  });

  return {
    matchScore: finalScore,
    confidence: factors.length > 0 ? 0.7 : 0.3,
    reasoning: this.generateMatchReasoning(finalScore, factors),
    keyFactors: factors,
    breakdown: breakdown, // 🎯 TAMBAH BREAKDOWN UNTUK DEBUG
    playlistId: playlist.id,
    bookId: book.id,
    isFallback: factors.includes('emergency_context_match'),
    matchType: factors.includes('emergency_context_match') ? 'emergency_context' : 'direct_metadata'
  };
},

// NEW: String similarity helper
calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = this.levenshteinDistance(longer, shorter);
  return (longer.length - distance) / parseFloat(longer.length);
},

levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i-1) === str1.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
},

  // NEW: Colonial match reasoning
  generateColonialMatchReasoning(score, factors) {
    if (score >= 85) return 'Kecocokan sangat tinggi berdasarkan tema dan konteks kolonial Belanda';
    if (score >= 70) return 'Kecocokan tinggi dengan kesamaan tema sejarah kolonial';
    if (score >= 50) return 'Kecocokan sedang dengan beberapa elemen kolonial yang relevan';
    if (score >= 30) return 'Kecocokan rendah namun masih memiliki sedikit kesamaan kolonial';
    return 'Kecocokan sangat rendah - pertimbangkan review manual untuk konteks kolonial';
  },

  // NEW: Convert to AI format
convertToAIFormat(topPlaylists) {
  return topPlaylists.map((item, index) => {
    const baseScore = item.score;
    const confidence = baseScore > 30 ? 0.7 : 
                      baseScore > 15 ? 0.5 : 0.3;
    
    return {
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: baseScore,
      confidence: confidence,
      reasoning: item.matchData?.reasoning || 
                `Rekomendasi berdasarkan analisis metadata (score: ${baseScore}%)`,
      strengths: item.matchData?.keyFactors || ['Analisis sistem'],
      considerations: baseScore < 20 ? ['Skor matching rendah'] : [],
      improvementSuggestions: [],
      isFallback: baseScore < 20,
      aiEnhanced: false,
      breakdown: item.matchData?.breakdown // 🎯 SERTAKAN BREAKDOWN
    };
  });
},

  // NEW: Enhanced fallback recommendations
  getFallbackRecommendations(book, availablePlaylists) {
    console.log('🔄 Using enhanced fallback recommendations');
    return availablePlaylists.slice(0, 3).map((playlist, index) => ({
      playlistId: playlist.id,
      playlistName: playlist.name,
      matchScore: Math.max(40, 80 - (index * 20)), // 80, 65, 50
      confidence: 0.5,
      reasoning: 'Rekomendasi fallback berdasarkan ketersediaan playlist',
      strengths: ['Playlist tersedia'],
      considerations: ['Skor matching rendah'],
      improvementSuggestions: ['Perlu analisis metadata yang lebih baik'],
      isFallback: true,
      aiEnhanced: false
    }));
  },

  // ==================== AI ENHANCED RECOMMENDATIONS ====================
async getAIEnhancedRecommendations(book, topPlaylists) {
  console.log('🚀 Starting AI enhancement with colonial context...');
  
  try {
    // Check Gemini availability dengan rate limit handling
    if (!this.isGeminiAvailable()) {
      console.log('❌ Gemini not available, using enhanced fallback');
      return this.createEnhancedFallback(book, topPlaylists);
    }

    // Check if we're likely to hit rate limits
    const shouldUseFallback = this.checkRateLimitRisk();
    if (shouldUseFallback) {
      console.log('⚠️ Rate limit risk detected, using enhanced fallback');
      return this.createEnhancedFallback(book, topPlaylists);
    }

    const prompt = this.createColonialAwarePrompt(book, topPlaylists);
    console.log('📝 AI Prompt length:', prompt.length);
    
    try {
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.3,
        maxTokens: 800, // Reduce tokens to avoid limits
        timeout: 15000  // 15 second timeout
      });
      
      if (!aiResponse) {
        throw new Error('Empty AI response');
      }
      
      console.log('✅ AI Response received, length:', aiResponse.length);
      return this.parseNoviceAIResponse(aiResponse, topPlaylists);
      
    } catch (aiError) {
      console.error('❌ AI enhancement failed:', aiError.message);
      
      // Handle specific rate limiting
      if (aiError.message.includes('429') || aiError.message.includes('Resource exhausted')) {
        console.log('🚫 Gemini rate limit hit, using enhanced fallback');
        this.markRateLimited();
      }
      
      return this.createEnhancedFallback(book, topPlaylists);
    }
    
  } catch (error) {
    console.error('❌ AI enhancement failed:', error);
    return this.createEnhancedFallback(book, topPlaylists);
  }
},

// NEW: Rate limit checking
checkRateLimitRisk() {
  // Simple rate limit tracking
  const now = Date.now();
  const lastCall = this.lastGeminiCall || 0;
  const timeSinceLastCall = now - lastCall;
  
  // If called too frequently, use fallback
  if (timeSinceLastCall < 2000) { // 2 second minimum between calls
    console.log('⚠️ Too frequent Gemini calls, using fallback');
    return true;
  }
  
  this.lastGeminiCall = now;
  return false;
},

markRateLimited() {
  this.rateLimitedUntil = Date.now() + 60000; // 1 minute cooldown
  console.log('⏰ Marked as rate limited for 1 minute');
},

  // NEW: Colonial-aware AI prompt
  createColonialAwarePrompt(book, topPlaylists) {
    const playlistsDetail = topPlaylists.map((item, index) => 
      `PLAYLIST ${index + 1}: "${item.playlist.name}"
       THEMES: ${item.playlist.ai_metadata?.key_themes?.join(', ') || 'Unknown'}
       REGIONS: ${item.playlist.ai_metadata?.geographic_focus?.join(', ') || 'Unknown'}
       PERIOD: ${item.playlist.ai_metadata?.time_period || 'Unknown'}
       METADATA SCORE: ${item.score}%`
    ).join('\n\n');

    return `
ANALISIS KECOCOKAN BUKU SEJARAH KOLONIAL

BUKU YANG DIANALISIS:
- Judul: "${book.judul}"
- Pengarang: "${book.pengarang || 'Tidak diketahui'}"
- Tahun: "${book.tahun_terbit || 'Tidak diketahui'}"
- Tema: ${book.metadata_structured?.key_themes?.join(', ') || 'Sejarah umum'}

PLAYLIST KANDIDAT:
${playlistsDetail}

INSTRUKSI:
1. Berikan score 0-100 untuk setiap playlist berdasarkan kecocokan dengan buku
2. Fokus pada konteks sejarah kolonial Belanda di Indonesia
3. Pertimbangkan: tema, periode sejarah, lokasi geografis, relevansi konten
4. Berikan alasan singkat dan spesifik untuk setiap score

FORMAT OUTPUT (JSON array):
[
  {
    "playlistName": "nama playlist exact",
    "finalScore": 85,
    "reason": "Kecocokan tinggi karena fokus pada sejarah militer KNIL di Jawa tahun 1920-1940",
    "strengths": ["tema militer kolonial", "lokasi Jawa", "periode relevan"],
    "considerations": ["buku lebih fokus pada aspek sosial"]
  }
]

Hanya kembalikan JSON array, tanpa text lain.
`.trim();
  },

  // NEW: Enhanced fallback
  createEnhancedFallback(book, topPlaylists) {
    console.log('🔄 Creating enhanced fallback with colonial context');
    return topPlaylists.map((item, index) => ({
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: Math.max(50, 85 - (index * 15)), // 85, 70, 55
      confidence: 0.6,
      reasoning: `Rekomendasi fallback: ${this.generateColonialMatchReasoning(item.score, item.matchData?.keyFactors || [])}`,
      strengths: item.matchData?.keyFactors || ['Konteks kolonial'],
      considerations: ['Analisis AI tidak tersedia'],
      improvementSuggestions: ['Perlu analisis AI untuk akurasi lebih tinggi'],
      isFallback: true,
      aiEnhanced: false,
      colonialContext: true
    }));
  },

  // ==================== COMPATIBILITY FUNCTIONS ====================
  // Untuk compatibility dengan code yang existing
  async getPlaylistRecommendations({ book, playlists = [] }) {
    console.log('🔄 LEGACY: getPlaylistRecommendations called - using novice mode');
    return this.noviceRecommendations({ book, playlists });
  },

  // Function lama untuk backward compatibility
  async selectTopPlaylistsByPureMetadata(book, playlists, maxCount = 3) {
    console.log('🔄 LEGACY: selectTopPlaylistsByPureMetadata - using new method');
    return this.selectTopPlaylistsByMetadata(book, playlists, maxCount);
  },

  // Function lama untuk backward compatibility
  calculateEnhancedMetadataMatch(book, playlist) {
    console.log('🔄 LEGACY: calculateEnhancedMetadataMatch - using direct match');
    const result = this.calculateDirectMetadataMatch(book, playlist);
    return result.matchScore;
  },

  // Function lama untuk backward compatibility
  getEnhancedMetadataResults(book, topPlaylists) {
    console.log('🔄 LEGACY: getEnhancedMetadataResults - converting format');
    return topPlaylists.map(item => ({
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: item.score,
      confidence: 0.7,
      reasoning: this.generateMatchReasoning(item.score, item.matchData?.keyFactors || []),
      improvementSuggestions: ['Menggunakan sistem metadata terbaru'],
      isFallback: false,
      metadataScore: item.score
    }));
  },

  // Function lama untuk backward compatibility
  getAIFinalAnalysis(book, topPlaylists) {
    console.log('🔄 LEGACY: getAIFinalAnalysis - using novice AI enhancement');
    return this.getAIEnhancedRecommendations(book, topPlaylists);
  },

  // ==================== DIRECT METADATA MATCHING ====================
  calculateDirectMetadataMatch(book, playlist) {
    console.log('🔍 DIRECT METADATA MATCHING DEBUG');
    const bookMeta = book.metadata_structured || {};
    const playlistMeta = playlist.ai_metadata || {};

    console.log('📘 Book Metadata:', {
      hasMetadata: !!book.metadata_structured,
      key_themes: bookMeta.key_themes,
      geographic_focus: bookMeta.geographic_focus,
      historical_period: bookMeta.historical_period,
      content_type: bookMeta.content_type
    });

    console.log('📗 Playlist Metadata:', {
      hasMetadata: !!playlist.ai_metadata,
      key_themes: playlistMeta.key_themes,
      geographic_focus: playlistMeta.geographic_focus,
      historical_period: playlistMeta.historical_period,
      content_type: playlistMeta.content_type
    });

    let score = 0;
    const factors = [];

    // 1. THEME MATCHING (40%)
    const themeScore = this.calculateThemeMatch(bookMeta.key_themes, playlistMeta.key_themes);
    score += themeScore * 0.4;
    console.log(`🎯 Theme Score: ${themeScore}`);
    if (themeScore > 0) factors.push('tema_sejalan');

    // 2. GEOGRAPHIC MATCHING (30%)
    const geoScore = this.calculateGeographicMatch(bookMeta.geographic_focus, playlistMeta.geographic_focus);
    score += geoScore * 0.3;
    console.log(`🗺️ Geographic Score: ${geoScore}`);
    if (geoScore > 0) factors.push('lokasi_serumpun');

    // 3. HISTORICAL PERIOD MATCHING (20%)
    const periodScore = this.calculatePeriodMatch(bookMeta.historical_period, playlistMeta.historical_period);
    score += periodScore * 0.2;
    console.log(`📅 Period Score: ${periodScore}`);
    if (periodScore > 0) factors.push('periode_sezaman');

    // 4. CONTENT TYPE MATCHING (10%)
    const contentTypeScore = this.calculateContentTypeMatch(bookMeta.content_type, playlistMeta.content_type);
    score += contentTypeScore * 0.1;
    console.log(`📚 Content Type Score: ${contentTypeScore}`);
    if (contentTypeScore > 0) factors.push('jenis_konten_sesuai');

    const finalScore = Math.min(100, Math.round(score));

    console.log(`✅ Final match score: ${finalScore}%`, { factors, breakdown: { themeScore, geoScore, periodScore, contentTypeScore } });

    return {
      matchScore: finalScore,
      confidence: 0.8,
      reasoning: this.generateMatchReasoning(finalScore, factors),
      keyFactors: factors,
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: false,
      matchType: 'direct_metadata'
    };
  },

  // ==================== METADATA MATCHING ALGORITHMS ====================
  calculateGeographicMatch(bookLocations = [], playlistLocations = []) {
    if (!bookLocations.length || !playlistLocations.length) return 0;

    console.log('🗺️ GEOGRAPHIC MATCHING:', { bookLocations, playlistLocations });

    // Exact match
    const exactMatches = bookLocations.filter(bookLoc =>
      playlistLocations.includes(bookLoc)
    );
    if (exactMatches.length > 0) {
      console.log(`✅ Exact geographic match: ${exactMatches.join(', ')}`);
      return 100;
    }

    // Regional hierarchy match
    const regionalMatches = this.calculateRegionalOverlap(bookLocations, playlistLocations);
    if (regionalMatches > 0) {
      console.log(`✅ Regional geographic match: ${regionalMatches}%`);
      return regionalMatches;
    }

    console.log('❌ No geographic match');
    return 0;
  },

  calculateRegionalOverlap(bookLocs, playlistLocs) {
    const regionalHierarchy = {
      // Indonesia hierarchy
      'indonesia': ['asia', 'asia tenggara'],
      'sumatra': ['indonesia', 'asia tenggara'],
      'jawa': ['indonesia', 'asia tenggara'],
      'bali': ['indonesia', 'asia tenggara'],
      'kalimantan': ['indonesia', 'asia tenggara'],
      'sulawesi': ['indonesia', 'asia tenggara'],
      'papua': ['indonesia', 'asia tenggara'],
      // Sumatra sub-regions
      'sumatra utara': ['sumatra', 'indonesia', 'asia tenggara'],
      'sumatra barat': ['sumatra', 'indonesia', 'asia tenggara'],
      'aceh': ['sumatra', 'indonesia', 'asia tenggara'],
      // Java sub-regions
      'jawa barat': ['jawa', 'indonesia', 'asia tenggara'],
      'jawa tengah': ['jawa', 'indonesia', 'asia tenggara'],
      'jawa timur': ['jawa', 'indonesia', 'asia tenggara']
    };

    let matchScore = 0;
    for (const bookLoc of bookLocs) {
      for (const playlistLoc of playlistLocs) {
        // Direct parent-child relationship
        if (regionalHierarchy[bookLoc]?.includes(playlistLoc)) {
          matchScore = Math.max(matchScore, 80); // Strong regional match
          console.log(`✅ Regional match: ${bookLoc} → ${playlistLoc}`);
        }
        if (regionalHierarchy[playlistLoc]?.includes(bookLoc)) {
          matchScore = Math.max(matchScore, 80);
          console.log(`✅ Regional match: ${playlistLoc} → ${bookLoc}`);
        }
        // Shared parent
        const bookParents = regionalHierarchy[bookLoc] || [];
        const playlistParents = regionalHierarchy[playlistLoc] || [];
        const commonParents = bookParents.filter(parent => playlistParents.includes(parent));
        if (commonParents.length > 0) {
          matchScore = Math.max(matchScore, 60); // Weak regional match
          console.log(`✅ Shared regional parent: ${commonParents.join(', ')}`);
        }
      }
    }
    return matchScore;
  },

  calculatePeriodMatch(bookPeriods = [], playlistPeriods = []) {
    if (!bookPeriods.length || !playlistPeriods.length) return 0;
    const overlappingPeriods = bookPeriods.filter(period =>
      playlistPeriods.includes(period)
    );
    return overlappingPeriods.length > 0 ? 100 : 0;
  },

  calculateContentTypeMatch(bookType = '', playlistType = '') {
    if (!bookType || !playlistType) return 0;
    const typeMap = {
      'akademik': ['akademik', 'studi', 'research'],
      'non-fiksi': ['non-fiksi', 'deskripsi', 'observasi'],
      'dokumen': ['dokumen', 'arsip', 'laporan']
    };
    for (const [category, keywords] of Object.entries(typeMap)) {
      if (keywords.some(kw => bookType.toLowerCase().includes(kw)) &&
        keywords.some(kw => playlistType.toLowerCase().includes(kw))) {
        return 100;
      }
    }
    return 0;
  },

  // ==================== TOP PLAYLISTS SELECTION ====================
  async selectTopPlaylistsByMetadata(book, playlists, maxCount = 3) {
    console.log('🔍 Selecting top playlists by metadata...');
    const scoredPlaylists = [];
    for (const playlist of playlists) {
      try {
        // Gunakan direct metadata matching untuk scoring
        const matchResult = this.calculateDirectMetadataMatch(book, playlist);
        scoredPlaylists.push({
          playlist,
          score: matchResult.matchScore,
          matchData: matchResult
        });
        console.log(`📊 "${playlist.name}": ${matchResult.matchScore}%`);
      } catch (error) {
        console.error(`❌ Error scoring playlist ${playlist.name}:`, error);
        scoredPlaylists.push({ playlist, score: 0 });
      }
    }
    // Sort dan ambil top N
    const sorted = scoredPlaylists.sort((a, b) => b.score - a.score);
    const topPlaylists = sorted.slice(0, maxCount);
    console.log('✅ Top playlists selected:', topPlaylists.map(p => p.playlist.name));
    return topPlaylists;
  },

  // ==================== AI RESPONSE PARSING ====================
  parseNoviceAIResponse(aiResponse, topPlaylists) {
    try {
      console.log('🔍 Parsing AI response...');
      
      // Clean response aggressively
      let cleanResponse = aiResponse
        .replace(/```json|```|`/g, '')
        .trim();
  
      console.log('🧹 Raw AI response:', cleanResponse);
  
      // 🎯 FIX UNCLOSED JSON OBJECTS
      cleanResponse = this.fixUnclosedJSONObjects(cleanResponse);
      
      // Extract JSON dengan pattern yang lebih flexible
      const jsonMatch = cleanResponse.match(/\[[^\]]*\]/);
      if (!jsonMatch) {
        console.log('❌ No JSON array found, trying object extraction...');
        return this.extractIndividualRecommendations(cleanResponse, topPlaylists);
      }
  
      let jsonText = jsonMatch[0];
      
      // 🎯 FIX COMMON JSON ERRORS
      jsonText = this.fixCommonJSONErrors(jsonText);
      
      console.log('🧹 Cleaned JSON:', jsonText);
  
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not an array');
      }
  
      console.log(`✅ Successfully parsed ${parsed.length} AI recommendations`);
      return parsed.map((item, index) => {
        const playlist = topPlaylists[index]?.playlist;
        if (!playlist) return null;
  
        return {
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: item.finalScore || item.matchScore || 50,
          confidence: 0.9,
          reasoning: item.reason || item.reasoning || 'Analisis AI',
          strengths: item.strengths || [],
          considerations: item.considerations || [],
          improvementSuggestions: [],
          isFallback: false,
          aiEnhanced: true
        };
      }).filter(Boolean);
  
    } catch (error) {
      console.error('❌ Novice AI parse failed:', error.message);
      console.log('📝 Failed response was:', aiResponse);
      return this.createFallbackRecommendations(topPlaylists);
    }
  },
  
  // 🎯 NEW: Fix unclosed JSON objects
  fixUnclosedJSONObjects(jsonString) {
    let fixed = jsonString;
    
    // Count opening vs closing braces to detect unclosed objects
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      // Add missing closing braces
      fixed += '}'.repeat(openBraces - closeBraces);
      console.log('🔧 Added missing closing braces');
    }
    
    return fixed;
  },
  
  // 🎯 NEW: Fix common JSON errors
  fixCommonJSONErrors(jsonString) {
    let fixed = jsonString;
    
    // 1. Fix missing commas between objects
    fixed = fixed.replace(/}\s*{/g, '},{');
    
    // 2. Fix trailing commas before closing bracket
    fixed = fixed.replace(/,\s*]/g, ']');
    
    // 3. Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
    
    // 4. Fix unclosed strings
    fixed = fixed.replace(/(:"[^"]*)$/g, '$1"');
    
    // 5. Fix missing closing brackets for arrays
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // 6. Fix specific case from your error - incomplete array in strengths
    fixed = fixed.replace(/"strengths":\s*\[[^\]]*$/g, (match) => {
      if (!match.endsWith(']')) {
        return match + ']';
      }
      return match;
    });
    
    return fixed;
  },
  
  // 🎯 UPDATE extractIndividualRecommendations untuk handle partial AI response
  extractIndividualRecommendations(text, topPlaylists) {
    console.log('🔍 Extracting individual recommendations from text...');
    const recommendations = [];
    
    for (let i = 0; i < topPlaylists.length; i++) {
      const playlist = topPlaylists[i].playlist;
      const playlistName = playlist.name;
      
      // Try to find this playlist in AI response
      let score = 50; // default fallback
      let reason = 'Analisis berdasarkan konten playlist';
      
      // Look for playlist name in response
      const playlistPattern = new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"finalScore":\\s*(\\d+)`, 'i');
      const scoreMatch = text.match(playlistPattern);
      
      if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
        // Try to extract reason
        const reasonPattern = new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"reason":\\s*"([^"]*)"`, 'i');
        const reasonMatch = text.match(reasonPattern);
        if (reasonMatch) {
          reason = reasonMatch[1];
        }
      } else {
        // Fallback scoring based on position
        score = Math.max(40, 70 - (i * 10));
      }
      
      recommendations.push({
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: score,
        confidence: 0.8,
        reasoning: reason,
        strengths: ['Analisis AI'],
        considerations: [],
        improvementSuggestions: [],
        isFallback: !scoreMatch, // Mark as fallback if not found in AI response
        aiEnhanced: true
      });
    }
    
    console.log(`✅ Extracted ${recommendations.length} recommendations`);
    return recommendations;
  },
  
  createFallbackRecommendations(topPlaylists) {
    console.log('🔄 Creating fallback recommendations');
    return topPlaylists.map((item, index) => ({
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: Math.max(40, 80 - (index * 15)), // 80, 65, 50
      confidence: 0.6,
      reasoning: 'Rekomendasi berdasarkan analisis sistem',
      strengths: ['Playlist tersedia'],
      considerations: ['Analisis AI tidak tersedia'],
      improvementSuggestions: [],
      isFallback: true,
      aiEnhanced: false
    }));
  },
  
  // ==================== HELPER FUNCTIONS ====================
  generateMatchReasoning(score, factors) {
    if (score >= 80) return 'Kecocokan sangat tinggi berdasarkan metadata';
    if (score >= 60) return 'Kecocokan tinggi dengan beberapa kesamaan tema';
    if (score >= 40) return 'Kecocokan sedang dengan sedikit kesamaan';
    return 'Kecocokan rendah - pertimbangkan review manual';
  },

  // ==================== COMPATIBILITY ====================
  // Untuk backward compatibility
  async analyzeBookPlaylistMatch(book, playlist) {
    console.log('🤖 LEGACY: Direct AI analysis');
    return this.expertDirectMatch(book, playlist);
  },

  getEmergencyFallback(book, playlist) {
    console.log('🆘 Using emergency fallback analysis');
    // Simple fallback berdasarkan judul saja
    const bookText = book.judul.toLowerCase();
    const playlistText = playlist.name.toLowerCase();
    let score = 50;
    if (bookText.includes('padang') && playlistText.includes('sumatra barat')) {
      score = 90;
    } else if (bookText.includes('sumatra') && playlistText.includes('sumatra barat')) {
      score = 75;
    }
    return {
      matchScore: score,
      confidence: 0.3,
      reasoning: `Fallback: Kecocokan ${score}% berdasarkan analisis judul`,
      keyFactors: ['judul_buku', 'nama_playlist'],
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: true
    };
  },

  getEmergencyResults(book, playlists) {
    console.log('🆘 Using emergency results');
    return playlists.slice(0, 3).map((playlist, index) => ({
      playlistId: playlist.id,
      playlistName: playlist.name,
      matchScore: 60 - (index * 10), // 60, 50, 40
      confidence: 0.2,
      reasoning: 'Emergency fallback - sistem mengalami gangguan',
      strengths: ['Playlist tersedia'],
      considerations: ['Analisis tidak optimal'],
      improvementSuggestions: ['Sistem perlu diperbaiki'],
      isFallback: true,
      aiEnhanced: false
    }));
  },

  // Untuk compatibility dengan code yang existing
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
  }

};


export default aiMatchingService;
