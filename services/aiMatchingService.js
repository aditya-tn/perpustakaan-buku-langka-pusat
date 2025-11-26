// services/aiMatchingService.js - COMPLETE FIXED VERSION
import { generateAIResponse } from '../lib/gemini';

export const aiMatchingService = {

  // ==================== EXPERT MODE ====================
  async expertDirectMatch(book, playlist) {
    console.log('⚡⚡⚡ EXPERT MODE: Starting Direct AI Matching ⚡⚡⚡');
    console.log('📘 Book:', { 
      id: book.id, 
      judul: book.judul,
      hasMetadata: !!book.metadata_structured,
      themes: book.metadata_structured?.key_themes 
    });
    console.log('📗 Playlist:', { 
      id: playlist.id, 
      name: playlist.name,
      hasMetadata: !!playlist.ai_metadata,
      themes: playlist.ai_metadata?.key_themes 
    });
    
    try {
      console.log('🎯 Step 1: Checking AI service...');
      if (!this.isGeminiAvailable()) {
        throw new Error('AI service not available');
      }
      console.log('✅ AI service available');

      console.log('🎯 Step 2: Creating prompt...');
      const prompt = this.createDirectMatchPrompt(book, playlist);
      console.log('📋 Prompt length:', prompt.length);
      
      console.log('🎯 Step 3: Calling AI...');
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.1,
        maxTokens: 500,
        timeout: 15000
      });
      
      console.log('📨 AI Response status:', {
        hasResponse: !!aiResponse,
        length: aiResponse?.length,
        first100Chars: aiResponse?.substring(0, 100)
      });
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      console.log('🎯 Step 4: Parsing response...');
      const result = this.parseDirectMatchResponse(aiResponse, book, playlist);
      
      console.log('✅✅✅ EXPERT MODE SUCCESS:', result.matchScore);
      return result;
      
    } catch (error) {
      console.error('❌❌❌ EXPERT MODE FAILED:', error);
      return this.getEmergencyFallback(book, playlist);
    }
  },

  // ==================== NOVICE MODE ====================
  async noviceRecommendations({ book, playlists = [] }) {
    console.log('🤖 NOVICE MODE: AI-powered recommendations');
    
    try {
      // STEP 1: Pastikan playlist punya metadata
      const playlistsWithMetadata = await this.ensurePlaylistMetadata(playlists);

      // STEP 2: Filter playlists yang available
      const availablePlaylists = playlistsWithMetadata.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      console.log('🎯 Available playlists with metadata:', availablePlaylists.length);

      if (availablePlaylists.length === 0) {
        return [];
      }

      // STEP 3: Pilih 3 playlist terbaik berdasarkan rule-base scoring
      const scoredPlaylists = await this.calculateEnhancedScores(book, availablePlaylists);
      
      // STEP 4: Ambil top 3 dengan threshold minimum
      const topPlaylists = scoredPlaylists
        .filter(item => item.score >= 10) // Lower threshold untuk testing
        .slice(0, 3);

      console.log('📊 Top playlists after filtering:', topPlaylists.map(p => ({
        name: p.playlist.name,
        score: p.score
      })));

      if (topPlaylists.length === 0) {
        console.log('⚠️ No playlists meet threshold, taking top 3 anyway');
        const top3 = scoredPlaylists.slice(0, 3);
        return this.convertToAIFormat(top3);
      }

      // STEP 5: AI enhancement untuk 3 playlist terpilih
      let aiResults = [];
      try {
        console.log('🚀 Calling AI enhancement for final scoring...');
        aiResults = await this.getAIEnhancedRecommendations(book, topPlaylists);
        console.log('✅ AI enhancement successful:', aiResults.length, 'results');
      } catch (aiError) {
        console.error('❌ AI enhancement failed, using metadata scores:', aiError);
        aiResults = this.convertToAIFormat(topPlaylists);
      }

      return aiResults;

    } catch (error) {
      console.error('💥 Enhanced novice mode failed:', error);
      return this.getEmergencyResults(book, playlists);
    }
  },

  // ==================== RULE-BASE FOR NOVICE MODE ====================
  async ensurePlaylistMetadata(playlists) {
    const playlistsWithMetadata = [];
    for (const playlist of playlists) {
      try {
        if (!playlist.ai_metadata || playlist.ai_metadata.is_empty) {
          console.log(`🔄 Generating metadata for playlist: ${playlist.name}`);
          const metadata = await this.generatePlaylistMetadata(playlist);
          playlist.ai_metadata = metadata;
        }
        playlistsWithMetadata.push(playlist);
      } catch (error) {
        console.error(`❌ Failed to get metadata for ${playlist.name}:`, error);
        playlistsWithMetadata.push(playlist);
      }
    }
    return playlistsWithMetadata;
  },

  async generatePlaylistMetadata(playlist) {
    try {
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

    const themes = this.inferThemesFromPlaylist(name, description);
    const locations = this.inferLocationsFromPlaylist(name, description);
    const periods = this.inferPeriodsFromPlaylist(name, description);
    const contentType = this.inferContentTypeFromPlaylist(name, description);

    const metadata = {
      key_themes: themes,
      geographic_focus: locations.length > 0 ? locations : ['indonesia'],
      historical_period: periods.length > 0 ? periods : ['kolonial'],
      content_type: contentType || 'koleksi',
      subject_categories: themes,
      temporal_coverage: this.inferTemporalCoverage(name, description),
      is_fallback: true,
      generated_at: new Date().toISOString()
    };

    return metadata;
  },

  inferThemesFromPlaylist(name, description) {
    const text = name + ' ' + description;
    const themes = new Set();

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
      }
    }

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
      }
    }

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
      }
    }

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

  // ==================== SCORING FOR NOVICE MODE ====================
  async calculateEnhancedScores(book, playlists) {
    const scoredPlaylists = [];
    
    for (const playlist of playlists) {
      try {
        const matchResult = this.calculateDirectMetadataMatch(book, playlist);
        
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
    
    console.log('🏆 FINAL SCORES:', sorted.map(p => ({
      name: p.playlist.name,
      score: p.score,
      factors: p.matchData?.keyFactors || []
    })));
    
    return sorted;
  },

  calculateDirectMetadataMatch(book, playlist) {
    const bookMeta = book.metadata_structured || {};
    const playlistMeta = playlist.ai_metadata || {};

    let score = 0;
    const factors = [];

    // 1. THEME MATCHING (40%)
    const themeScore = this.calculateThemeMatch(bookMeta.key_themes, playlistMeta.key_themes);
    score += themeScore * 0.4;
    if (themeScore > 0) factors.push('tema_sejalan');

    // 2. GEOGRAPHIC MATCHING (30%)
    const geoScore = this.calculateGeographicMatch(bookMeta.geographic_focus, playlistMeta.geographic_focus);
    score += geoScore * 0.3;
    if (geoScore > 0) factors.push('lokasi_serumpun');

    // 3. HISTORICAL PERIOD MATCHING (20%)
    const periodScore = this.calculatePeriodMatch(bookMeta.historical_period, playlistMeta.historical_period);
    score += periodScore * 0.2;
    if (periodScore > 0) factors.push('periode_sezaman');

    // 4. CONTENT TYPE MATCHING (10%)
    const contentTypeScore = this.calculateContentTypeMatch(bookMeta.content_type, playlistMeta.content_type);
    score += contentTypeScore * 0.1;
    if (contentTypeScore > 0) factors.push('jenis_konten_sesuai');

    const finalScore = Math.min(100, Math.round(score));

    return {
      matchScore: finalScore,
      confidence: factors.length > 0 ? 0.7 : 0.3,
      reasoning: this.generateMatchReasoning(finalScore, factors),
      keyFactors: factors,
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: false,
      matchType: 'direct_metadata'
    };
  },

  calculateThemeMatch(bookThemes = [], playlistThemes = []) {
    if (!bookThemes.length || !playlistThemes.length) return 0;

    const semanticThemeMapping = {
      'sistem peradilan': ['hukum', 'peradilan', 'keadilan', 'legal', 'pengadilan', 'yudikatif'],
      'hukum kolonial': ['kolonial', 'hukum', 'belanda', 'peraturan', 'undang-undang'],
      'administrasi keadilan': ['administrasi', 'keadilan', 'hukum', 'birokrasi'],
      'disintegrasi knil': ['militer', 'knil', 'tentara', 'angkatan perang', 'keamanan'],
      'keruntuhan knil': ['militer', 'knil', 'sejarah', 'kolonial', 'keamanan'],
      'angkatan bersenjata kolonial': ['militer', 'tentara', 'kolonial', 'keamanan'],
      'kolonialisme belanda': ['kolonial', 'belanda', 'sejarah', 'penjajahan'],
      'pendudukan jepang': ['jepang', 'sejarah', 'perang dunia', 'pendudukan'],
      'sejarah': ['historis', 'masa lalu', 'peristiwa', 'kolonial', 'perang'],
      'budaya': ['seni', 'tradisi', 'adat', 'kesenian', 'sosial'],
      'politik': ['pemerintahan', 'negara', 'kekuasaan', 'kebijakan'],
      'sosial': ['masyarakat', 'komunitas', 'rakyat', 'budaya'],
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
        
        // Exact match
        if (bookThemeLower === playlistThemeLower) {
          bestMatchScore = Math.max(bestMatchScore, 100);
          continue;
        }

        // Semantic mapping match
        const bookSemantic = semanticThemeMapping[bookThemeLower] || [bookThemeLower];
        const playlistSemantic = semanticThemeMapping[playlistThemeLower] || [playlistThemeLower];
        
        const semanticOverlap = bookSemantic.some(bookTerm => 
          playlistSemantic.some(playlistTerm => 
            bookTerm === playlistTerm || 
            bookTerm.includes(playlistTerm) || 
            playlistTerm.includes(bookTerm)
          )
        );
        
        if (semanticOverlap) {
          bestMatchScore = Math.max(bestMatchScore, 90);
          continue;
        }

        // Direct semantic relationship
        const hasDirectRelationship = 
          semanticThemeMapping[bookThemeLower]?.includes(playlistThemeLower) ||
          semanticThemeMapping[playlistThemeLower]?.includes(bookThemeLower);
        
        if (hasDirectRelationship) {
          bestMatchScore = Math.max(bestMatchScore, 85);
          continue;
        }

        // String similarity
        const similarity = this.calculateStringSimilarity(bookThemeLower, playlistThemeLower);
        if (similarity > 0.6) {
          bestMatchScore = Math.max(bestMatchScore, Math.round(similarity * 100));
          continue;
        }

        // Keyword inclusion
        if (bookThemeLower.includes(playlistThemeLower) || playlistThemeLower.includes(bookThemeLower)) {
          bestMatchScore = Math.max(bestMatchScore, 50);
          continue;
        }
      }

      // Contextual inference fallback
      if (bestMatchScore === 0) {
        if ((bookThemeLower.includes('hukum') || bookThemeLower.includes('peradilan')) && 
            playlistThemes.some(theme => theme.includes('sejarah') || theme.includes('politik'))) {
          bestMatchScore = 30;
        }
      }

      totalMatchScore += bestMatchScore;
    }

    const finalScore = Math.min(100, Math.round(totalMatchScore / bookThemes.length));
    return finalScore;
  },

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

  calculateGeographicMatch(bookLocations = [], playlistLocations = []) {
    if (!bookLocations.length || !playlistLocations.length) return 0;

    const exactMatches = bookLocations.filter(bookLoc =>
      playlistLocations.includes(bookLoc)
    );
    if (exactMatches.length > 0) return 100;

    const regionalMatches = this.calculateRegionalOverlap(bookLocations, playlistLocations);
    if (regionalMatches > 0) return regionalMatches;

    return 0;
  },

  calculateRegionalOverlap(bookLocs, playlistLocs) {
    const regionalHierarchy = {
      'indonesia': ['asia', 'asia tenggara'],
      'sumatra': ['indonesia', 'asia tenggara'],
      'jawa': ['indonesia', 'asia tenggara'],
      'bali': ['indonesia', 'asia tenggara'],
      'kalimantan': ['indonesia', 'asia tenggara'],
      'sulawesi': ['indonesia', 'asia tenggara'],
      'papua': ['indonesia', 'asia tenggara'],
      'sumatra utara': ['sumatra', 'indonesia', 'asia tenggara'],
      'sumatra barat': ['sumatra', 'indonesia', 'asia tenggara'],
      'aceh': ['sumatra', 'indonesia', 'asia tenggara'],
      'jawa barat': ['jawa', 'indonesia', 'asia tenggara'],
      'jawa tengah': ['jawa', 'indonesia', 'asia tenggara'],
      'jawa timur': ['jawa', 'indonesia', 'asia tenggara']
    };

    let matchScore = 0;
    for (const bookLoc of bookLocs) {
      for (const playlistLoc of playlistLocs) {
        if (regionalHierarchy[bookLoc]?.includes(playlistLoc)) {
          matchScore = Math.max(matchScore, 80);
        }
        if (regionalHierarchy[playlistLoc]?.includes(bookLoc)) {
          matchScore = Math.max(matchScore, 80);
        }
        const bookParents = regionalHierarchy[bookLoc] || [];
        const playlistParents = regionalHierarchy[playlistLoc] || [];
        const commonParents = bookParents.filter(parent => playlistParents.includes(parent));
        if (commonParents.length > 0) {
          matchScore = Math.max(matchScore, 60);
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

  generateMatchReasoning(score, factors) {
    if (score >= 80) return 'Kecocokan sangat tinggi berdasarkan metadata';
    if (score >= 60) return 'Kecocokan tinggi dengan beberapa kesamaan tema';
    if (score >= 40) return 'Kecocokan sedang dengan sedikit kesamaan';
    return 'Kecocokan rendah - pertimbangkan review manual';
  },

  convertToAIFormat(topPlaylists) {
    return topPlaylists.map((item, index) => ({
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: item.score,
      confidence: 0.7,
      reasoning: `Rekomendasi berdasarkan analisis metadata: ${item.matchData?.reasoning || 'Kecocokan tema dan lokasi'}`,
      strengths: ['Analisis metadata'],
      considerations: ['Analisis AI tidak tersedia'],
      improvementSuggestions: [],
      isFallback: true,
      aiEnhanced: false
    }));
  },

  // ==================== DIRECT AI MATCHING (EXPERT MODE) ====================
  createDirectMatchPrompt(book, playlist) {
    return `
BUKU: 
Judul: "${book.judul}"
Tema: ${book.metadata_structured?.key_themes?.join(', ') || 'Umum'}
Lokasi: ${book.metadata_structured?.geographic_focus?.join(', ') || 'Tidak diketahui'}
Periode: ${book.metadata_structured?.historical_period?.join(', ') || 'Tidak diketahui'}

PLAYLIST:
Nama: "${playlist.name}" 
Tema: ${playlist.ai_metadata?.key_themes?.join(', ') || 'Umum'}
Lokasi: ${playlist.ai_metadata?.geographic_focus?.join(', ') || 'Tidak diketahui'}
Periode: ${playlist.ai_metadata?.historical_period?.join(', ') || 'Tidak diketahui'}

INSTRUKSI:
Bandingkan metadata buku dan playlist. Berikan score 0-100 berdasarkan kecocokan.

FORMAT OUTPUT (JSON):
{
  "matchScore": 85,
  "reason": "Penjelasan singkat kecocokan"
}

Hanya JSON.
`.trim();
  },

  parseDirectMatchResponse(aiResponse, book, playlist) {
    try {
      console.log('🔍 Parsing direct match response...');
      
      let cleanResponse = aiResponse
        .replace(/```json|```|`/g, '')
        .trim();

      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Tidak ada JSON dalam respons AI');
      }
      
      let jsonText = jsonMatch[0];
      jsonText = this.fixCommonJSONErrors(jsonText);
      
      const parsed = JSON.parse(jsonText);
      
      if (typeof parsed.matchScore !== 'number' || parsed.matchScore < 0 || parsed.matchScore > 100) {
        throw new Error('Score tidak valid dari AI');
      }
      
      console.log(`✅ Direct match successful: ${parsed.matchScore}%`);
      
      return {
        matchScore: parsed.matchScore,
        confidence: 0.9,
        reasoning: parsed.reason || 'Analisis matching langsung',
        keyFactors: ['direct_ai_match'],
        playlistId: playlist.id,
        bookId: book.id,
        isFallback: false,
        matchType: 'expert_direct_ai'
      };
      
    } catch (error) {
      console.error('❌ Direct match parse failed:', error);
      throw new Error(`Gagal memproses hasil matching: ${error.message}`);
    }
  },

  // ==================== AI ENHANCED RECOMMENDATIONS (NOVICE MODE) ====================
  async getAIEnhancedRecommendations(book, topPlaylists) {
    console.log('🚀 Starting AI enhancement for novice mode...');
    
    try {
      if (!this.isGeminiAvailable()) {
        console.log('❌ Gemini not available, using fallback');
        return this.createFallbackRecommendations(topPlaylists);
      }

      const prompt = this.createNoviceRecommendationPrompt(book, topPlaylists);
      console.log('📝 AI Prompt created, length:', prompt.length);
      
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.2,
        maxTokens: 800, // Increased for complete responses
        timeout: 20000
      });
      
      if (!aiResponse) {
        throw new Error('Empty AI response');
      }
      
      console.log('✅ AI Response received, length:', aiResponse.length);
      return this.parseNoviceAIResponse(aiResponse, topPlaylists);
      
    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      return this.createFallbackRecommendations(topPlaylists);
    }
  },

  createNoviceRecommendationPrompt(book, topPlaylists) {
    const playlistsInfo = topPlaylists.map((item, index) => 
      `PLAYLIST ${index + 1}: "${item.playlist.name}"`
    ).join('\n');

    return `
BUKU: "${book.judul}"
TEMA: ${book.metadata_structured?.key_themes?.join(', ') || 'Umum'}

PLAYLIST YANG DIANALISIS:
${playlistsInfo}

INSTRUKSI:
Berikan score 0-100 untuk setiap playlist berdasarkan kecocokan dengan buku.
Format output HARUS JSON array seperti contoh:

[
  {
    "playlistName": "Kereta Api di Indonesia",
    "finalScore": 85,
    "reason": "alasan singkat kenapa cocok"
  },
  {
    "playlistName": "Koleksi Sejarah Indonesia", 
    "finalScore": 75,
    "reason": "alasan singkat kenapa cocok"
  }
]

Hanya kembalikan JSON array, tanpa teks lain.
Pastikan semua string ditutup dengan quote.
`.trim();
  },

  // 🆕 FIXED PARSING METHOD - HANDLES TRUNCATED RESPONSES
  parseNoviceAIResponse(aiResponse, topPlaylists) {
    try {
      console.log('🔍 Parsing AI response...');
      console.log('📨 Raw AI response length:', aiResponse.length);
      
      let cleanResponse = aiResponse
        .replace(/```json|```|`/g, '')
        .trim();

      console.log('🧹 Cleaned response length:', cleanResponse.length);

      // 🆕 FIX: Handle truncated JSON responses
      cleanResponse = this.fixTruncatedJSON(cleanResponse);
      
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('❌ No JSON array found, trying object extraction...');
        return this.extractIndividualRecommendations(cleanResponse, topPlaylists);
      }

      let jsonText = jsonMatch[0];
      console.log('📄 JSON text found, length:', jsonText.length);
      
      jsonText = this.fixCommonJSONErrors(jsonText);
      
      console.log('🧹 Final JSON length:', jsonText.length);
      
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not an array');
      }

      console.log(`✅ Successfully parsed ${parsed.length} AI recommendations`);
      
      return parsed.map((item, index) => {
        const playlist = topPlaylists[index]?.playlist;
        if (!playlist) {
          console.log(`❌ No playlist found for index ${index}`);
          return null;
        }

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
      console.log('📝 Failed response (first 500 chars):', aiResponse.substring(0, 500));
      return this.createFallbackRecommendations(topPlaylists);
    }
  },

  // 🆕 FIX: Handle truncated JSON responses
  fixTruncatedJSON(jsonString) {
    let fixed = jsonString.trim();
    
    // If response is clearly truncated, complete it
    if (!fixed.endsWith(']') && fixed.includes('[')) {
      console.log('🔄 Fixing truncated JSON array...');
      
      // Count open and close brackets
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      
      // Add missing closing brackets
      if (openBrackets > closeBrackets) {
        fixed += ']'.repeat(openBrackets - closeBrackets);
      }
      
      // Fix truncated objects within array
      fixed = fixed.replace(/,?\s*{\s*"[^"]*"\s*:\s*"[^"]*$/g, (match) => {
        if (!match.endsWith('"')) {
          return match + '"}';
        }
        return match;
      });
      
      // Ensure array ends properly
      if (!fixed.endsWith(']')) {
        // Find the last complete object and close the array
        const lastCompleteObject = fixed.match(/\{[^}]*\}(?=\s*,?\s*$)/);
        if (lastCompleteObject) {
          fixed = fixed.substring(0, fixed.lastIndexOf(lastCompleteObject[0]) + lastCompleteObject[0].length) + ']';
        } else {
          fixed += ']';
        }
      }
    }
    
    return fixed;
  },

  extractIndividualRecommendations(text, topPlaylists) {
    console.log('🔍 Extracting individual recommendations from text...');
    const recommendations = [];
    
    for (let i = 0; i < topPlaylists.length; i++) {
      const playlist = topPlaylists[i].playlist;
      const playlistName = playlist.name;
      
      let score = 50;
      let reason = 'Analisis berdasarkan konten playlist';
      
      // Multiple patterns to find scores
      const patterns = [
        new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"finalScore":\\s*(\\d+)`, 'i'),
        new RegExp(`"${playlistName}"[^}]*?"finalScore":\\s*(\\d+)`, 'i'),
        new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"score":\\s*(\\d+)`, 'i'),
        new RegExp(`${playlistName}.*?(\\d{1,3})(?=\\D|$)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          score = parseInt(match[1]);
          // Try to extract reason
          const reasonPattern = new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"reason":\\s*"([^"]*)"`, 'i');
          const reasonMatch = text.match(reasonPattern);
          if (reasonMatch) {
            reason = reasonMatch[1];
          }
          break;
        }
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
        isFallback: false,
        aiEnhanced: true
      });
    }
    
    console.log(`✅ Extracted ${recommendations.length} recommendations`);
    return recommendations;
  },

  createFallbackRecommendations(topPlaylists) {
    console.log('🔄 Creating fallback recommendations');
    return topPlaylists.map((item, index) => {
      const playlist = item.playlist;
      return {
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: Math.max(40, 80 - (index * 15)),
        confidence: 0.6,
        reasoning: 'Rekomendasi berdasarkan analisis sistem',
        strengths: ['Playlist tersedia'],
        considerations: ['Analisis AI tidak tersedia'],
        improvementSuggestions: [],
        isFallback: true,
        aiEnhanced: false
      };
    });
  },

  getEmergencyResults(book, playlists) {
    console.log('🆘 Using emergency results');
    return playlists.slice(0, 3).map((playlist, index) => ({
      playlistId: playlist.id,
      playlistName: playlist.name,
      matchScore: 60 - (index * 10),
      confidence: 0.2,
      reasoning: 'Emergency fallback - sistem mengalami gangguan',
      strengths: ['Playlist tersedia'],
      considerations: ['Analisis tidak optimal'],
      improvementSuggestions: ['Sistem perlu diperbaiki'],
      isFallback: true,
      aiEnhanced: false
    }));
  },

  getEmergencyFallback(book, playlist) {
    console.log('🆘 Using emergency fallback for expert mode');
    return {
      matchScore: 50,
      confidence: 0.1,
      reasoning: 'Fallback - sistem AI mengalami gangguan',
      keyFactors: ['emergency_fallback'],
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: true,
      matchType: 'emergency'
    };
  },

  fixCommonJSONErrors(jsonString) {
    let fixed = jsonString;
    
    // Fix trailing commas before closing brackets/braces
    fixed = fixed.replace(/,\s*([\]}])/g, '$1');
    
    // Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
    
    // Fix unclosed strings
    fixed = fixed.replace(/(:"[^"]*)$/g, '$1"');
    
    // Fix missing closing braces
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }
    
    return fixed;
  },

  // ==================== COMPATIBILITY FUNCTIONS ====================
  async getPlaylistRecommendations({ book, playlists = [] }) {
    console.log('🔄 LEGACY: getPlaylistRecommendations called - using novice mode');
    return this.noviceRecommendations({ book, playlists });
  },

  // ==================== GEMINI AVAILABILITY ====================
  isGeminiAvailable() {
    try {
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      const hasGeminiFunction = typeof generateAIResponse === 'function';
      
      console.log('🔍 Gemini Availability:', {
        hasApiKey: !!hasApiKey,
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
