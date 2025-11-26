// services/aiMatchingService.js - CLEAN VERSION
import { generateAIResponse } from '../lib/gemini';

export const aiMatchingService = {

  // ==================== EXPERT MODE ====================
  async expertDirectMatch(book, playlist) {
    console.log('⚡ EXPERT MODE: Starting Direct AI Matching');
    
    try {
      const geminiAvailable = this.isGeminiAvailable();
      
      if (!geminiAvailable) {
        return this.getEnhancedFallback(book, playlist);
      }

      const prompt = this.createOptimizedExpertPrompt(book, playlist);
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.1,
        maxTokens: 300,
        timeout: 15000
      });
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const result = this.parseExpertResponse(aiResponse, book, playlist);
      return result;
      
    } catch (error) {
      console.error('❌ EXPERT MODE FAILED:', error.message);
      return this.getEnhancedFallback(book, playlist);
    }
  },

  // 🆕 BETTER EXPERT PROMPT
  createOptimizedExpertPrompt(book, playlist) {
    const bookTitle = book.judul || 'Tidak ada judul';
    const playlistName = playlist.name || 'Tidak ada nama';
    
    const bookThemes = book.metadata_structured?.key_themes?.join(', ') || 'sejarah';
    const playlistThemes = playlist.ai_metadata?.key_themes?.join(', ') || 'umum';
    
    return `
BUKU: "${bookTitle}"
TEMA BUKU: ${bookThemes}

PLAYLIST: "${playlistName}" 
TEMA PLAYLIST: ${playlistThemes}

INSTRUKSI: Berikan score 0-100 berdasarkan kecocokan buku dengan playlist.
Berikan alasan singkat.

CONTOH: {"matchScore": 85, "reason": "Kecocokan tinggi karena tema sejarah Indonesia"}

OUTPUT: Hanya JSON.
`.trim();
  },

  // 🆕 IMPROVED PARSING WITH BETTER ERROR HANDLING
  parseExpertResponse(aiResponse, book, playlist) {
    try {
      let cleanResponse = aiResponse
        .replace(/```json|```|`/g, '')
        .trim();

      let jsonText = null;
      
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        const scoreMatch = cleanResponse.match(/"matchScore":\s*(\d+)/);
        const reasonMatch = cleanResponse.match(/"reason":\s*"([^"]*)"/);
        
        if (scoreMatch) {
          jsonText = `{
            "matchScore": ${scoreMatch[1]},
            "reason": "${reasonMatch ? reasonMatch[1] : 'Analisis AI'}"
          }`;
        }
      }
      
      if (!jsonText) {
        throw new Error('Tidak dapat mengekstrak JSON dari respons AI');
      }
      
      jsonText = this.fixCommonJSONErrors(jsonText);
      
      const parsed = JSON.parse(jsonText);
      
      let finalScore = parsed.matchScore;
      if (typeof finalScore !== 'number' || finalScore < 0 || finalScore > 100) {
        finalScore = parseInt(finalScore) || 50;
        if (finalScore < 0) finalScore = 0;
        if (finalScore > 100) finalScore = 100;
      }
      
      return {
        matchScore: finalScore,
        confidence: 0.9,
        reasoning: parsed.reason || 'Analisis kecocokan langsung oleh AI',
        keyFactors: ['expert_ai_analysis'],
        playlistId: playlist.id,
        bookId: book.id,
        isFallback: false,
        matchType: 'expert_direct_ai'
      };
      
    } catch (error) {
      console.error('❌ Expert parse failed:', error.message);
      throw new Error(`Gagal memproses hasil expert matching: ${error.message}`);
    }
  },

  // 🆕 IMPROVED FALLBACK WITH BETTER SCORING
  getEnhancedFallback(book, playlist) {
    const calculatedScore = this.calculateEnhancedExpertFallback(book, playlist);
    
    return {
      matchScore: calculatedScore.matchScore,
      confidence: calculatedScore.confidence,
      reasoning: calculatedScore.reasoning,
      keyFactors: calculatedScore.keyFactors,
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: true,
      matchType: 'enhanced_fallback'
    };
  },

  // 🆕 ENHANCED FALLBACK SCORING
  calculateEnhancedExpertFallback(book, playlist) {
    const bookTitle = book.judul?.toLowerCase() || '';
    const playlistName = playlist.name?.toLowerCase() || '';
    
    let score = 50;

    if (bookTitle.includes('sejarah') && playlistName.includes('sejarah')) {
      score += 30;
    }
    
    if (bookTitle.includes('indonesia') && playlistName.includes('indonesia')) {
      score += 20;
    }
    
    if (bookTitle.includes('kebangsaan') && playlistName.includes('sejarah')) {
      score += 15;
    }
    
    const bookThemes = book.metadata_structured?.key_themes || [];
    const playlistThemes = playlist.ai_metadata?.key_themes || [];
    
    const themeMatches = bookThemes.filter(theme => 
      playlistThemes.some(pTheme => 
        pTheme.toLowerCase().includes(theme.toLowerCase()) ||
        theme.toLowerCase().includes(pTheme.toLowerCase())
      )
    );
    
    if (themeMatches.length > 0) {
      score += themeMatches.length * 10;
    }
    
    score = Math.min(100, score);
    
    return {
      matchScore: score,
      confidence: 0.7,
      reasoning: `Analisis sistem: Kecocokan berdasarkan judul dan tema`,
      keyFactors: ['title_matching', 'theme_analysis']
    };
  },

  // ==================== NOVICE MODE ====================
  async noviceRecommendations({ book, playlists = [] }) {
    console.log('🤖 NOVICE MODE: AI-powered recommendations');
    
    try {
      const playlistsWithMetadata = await this.ensurePlaylistMetadata(playlists);
      const availablePlaylists = playlistsWithMetadata.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      if (availablePlaylists.length === 0) {
        return [];
      }

      const scoredPlaylists = await this.calculateEnhancedScores(book, availablePlaylists);
      
      const topPlaylists = scoredPlaylists
        .filter(item => item.score >= 10)
        .slice(0, 3);

      if (topPlaylists.length === 0) {
        const top3 = scoredPlaylists.slice(0, 3);
        return this.convertToAIFormat(top3);
      }

      let aiResults = [];
      try {
        aiResults = await this.getAIEnhancedRecommendations(book, topPlaylists);
      } catch (aiError) {
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
        const hasMetadata = playlist.ai_metadata || playlist.metadata_structured;
        const isEmpty = playlist.ai_metadata?.is_empty || playlist.ai_metadata?.is_fallback;
        
        if (!hasMetadata || isEmpty) {
          const metadata = await this.generatePlaylistMetadata(playlist);
          playlist.ai_metadata = metadata;
        }
        playlistsWithMetadata.push(playlist);
      } catch (error) {
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
        return this.createBasicPlaylistMetadata(playlist);
      }
    } catch (error) {
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
    let bookWithMetadata = book;
    if (!book.metadata_structured && !book.ai_metadata) {
      try {
        bookWithMetadata = await this.generateBookMetadata(book);
      } catch (error) {
        console.error('❌ Metadata generation failed, using fallback:', error.message);
        // FIX: Gunakan function langsung
        bookWithMetadata = {
          ...book,
          metadata_structured: generateBasicMetadataFromTitle(book)
        };
      }
    }
    
    const scoredPlaylists = [];
    
    for (const playlist of playlists) {
      try {
        const matchResult = this.calculateDirectMetadataMatch(bookWithMetadata, playlist);
        scoredPlaylists.push({
          playlist,
          score: matchResult.matchScore,
          matchData: matchResult
        });
      } catch (error) {
        scoredPlaylists.push({ playlist, score: 0 });
      }
    }
    
    return scoredPlaylists.sort((a, b) => b.score - a.score);
  },

  async generateBookMetadata(book) {
    try {
      // FIX: Handle production environment
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
      console.log('📞 Calling API:', `${baseUrl}/api/generate-ai-description`);
      
      const response = await fetch(`${baseUrl}/api/generate-ai-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          bookTitle: book.judul,
          bookYear: book.tahun_terbit,
          bookAuthor: book.pengarang,
          currentDescription: book.deskripsi_fisik || ''
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        return {
          ...book,
          metadata_structured: result.data.metadata_structured || result.data.ai_metadata,
          deskripsi_buku: result.data.deskripsi_buku || book.deskripsi_buku
        };
      } else {
        throw new Error(result.error || 'Failed to generate metadata');
      }
    } catch (error) {
      console.error('❌ generateBookMetadata failed:', error.message);
      throw error;
    }
  },

  calculateDirectMetadataMatch(book, playlist) {
    const bookMeta = book.metadata_structured || book.ai_metadata || book.metadata || {};
    const playlistMeta = playlist.ai_metadata || playlist.metadata_structured || {};

    let score = 0;
    const factors = [];

    const bookThemes = bookMeta.key_themes || bookMeta.subject_categories || [];
    const playlistThemes = playlistMeta.key_themes || playlistMeta.subject_categories || [];
    
    const themeScore = this.calculateThemeMatch(bookThemes, playlistThemes);
    score += themeScore * 0.4;
    if (themeScore > 0) factors.push('tema_sejalan');

    const bookGeo = bookMeta.geographic_focus || bookMeta.geographical_focus || [];
    const playlistGeo = playlistMeta.geographic_focus || playlistMeta.geographical_focus || [];
    
    const geoScore = this.calculateGeographicMatch(bookGeo, playlistGeo);
    score += geoScore * 0.3;
    if (geoScore > 0) factors.push('lokasi_serumpun');

    const bookType = bookMeta.content_type || '';
    const playlistType = playlistMeta.content_type || '';
    
    const contentTypeScore = this.calculateContentTypeMatch(bookType, playlistType);
    score += contentTypeScore * 0.2;
    if (contentTypeScore > 0) factors.push('jenis_konten_sesuai');

    const keywordScore = this.calculateEnhancedKeywordMatch(book, playlist);
    score += keywordScore * 0.1;
    if (keywordScore > 0) factors.push('kata_kunci_serupa');

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

  calculateEnhancedKeywordMatch(book, playlist) {
    const bookTitle = book.judul?.toLowerCase() || '';
    const playlistName = playlist.name?.toLowerCase() || '';
    
    const bookMeta = book.metadata_structured || book.ai_metadata || {};
    const playlistMeta = playlist.ai_metadata || {};
    
    const bookKeywords = bookMeta.keywords || bookMeta.key_themes || [];
    const playlistKeywords = playlistMeta.keywords || playlistMeta.key_themes || [];
    
    const bookText = (bookTitle + ' ' + bookKeywords.join(' ')).toLowerCase();
    const playlistText = (playlistName + ' ' + playlistKeywords.join(' ')).toLowerCase();
    
    const keywords = ['sejarah', 'indonesia', 'nasional', 'kebangsaan', 'militer', 'budaya', 'biografi', 'politik', 'sosial'];
    
    let matches = 0;
    keywords.forEach(keyword => {
      if (bookText.includes(keyword) && playlistText.includes(keyword)) {
        matches++;
      }
    });
    
    const score = matches > 0 ? Math.min(100, matches * 25) : 0;
    return score;
  },

  calculateThemeMatch(bookThemes = [], playlistThemes = []) {
    if (!bookThemes.length || !playlistThemes.length) {
      return 0;
    }

    const semanticThemeMapping = {
      'hindia belanda': ['sejarah', 'kolonial', 'belanda', 'sejarah indonesia', 'nusantara', 'masa kolonial', 'penjajahan', 'voc', 'knil'],
      'indie': ['hindia belanda', 'sejarah', 'kolonial', 'belanda', 'masa lalu'],
      'sejarah': ['historis', 'masa lalu', 'peristiwa', 'kolonial', 'nasionalisme', 'hindia belanda', 'perjuangan', 'revolusi'],
      'kolonial': ['penjajahan', 'belanda', 'hindia belanda', 'sejarah', 'voc', 'knil', 'imperialisme'],
      'penjajahan': ['kolonial', 'belanda', 'hindia belanda', 'sejarah', 'perlawanan'],
      'voc': ['hindia belanda', 'kolonial', 'belanda', 'perdagangan', 'sejarah'],
      'knil': ['militer', 'kolonial', 'belanda', 'hindia belanda', 'tentara', 'sejarah'],
      'seni': ['budaya', 'kesenian', 'tradisi', 'karya seni', 'visual', 'estetika', 'kreativitas'],
      'budaya': ['seni', 'tradisi', 'adat', 'kesenian', 'kebudayaan', 'sosial', 'warisan'],
      'kesenian': ['seni', 'budaya', 'tradisi', 'karya', 'estetika'],
      'tradisi': ['budaya', 'adat', 'kebiasaan', 'warisan', 'seni'],
      'adat': ['budaya', 'tradisi', 'kearifan lokal', 'custom', 'seni'],
      'visualisasi': ['seni', 'gambar', 'foto', 'ilustrasi', 'budaya visual', 'desain'],
      'gambar': ['seni', 'visual', 'foto', 'ilustrasi', 'budaya', 'lukisan'],
      'karya seni': ['seni', 'budaya', 'kesenian', 'tradisi', 'visual', 'kreasi'],
      'fotografi': ['gambar', 'visual', 'seni', 'foto', 'dokumentasi'],
      'lukisan': ['seni', 'gambar', 'visual', 'budaya', 'kesenian'],
      'sastra': ['literatur', 'kesusasteraan', 'puisi', 'prosa', 'cerita', 'budaya'],
      'puisi': ['sastra', 'syair', 'puisi', 'karya sastra', 'literatur'],
      'prosa': ['sastra', 'cerita', 'narasi', 'novel', 'cerpen'],
      'cerita': ['sastra', 'narasi', 'dongeng', 'hikayat', 'legenda'],
      'bahasa': ['linguistik', 'sastra', 'komunikasi', 'budaya', 'kata'],
      'linguistik': ['bahasa', 'sastra', 'grammar', 'kata', 'komunikasi'],
      'militer': ['tentara', 'perang', 'pertahanan', 'keamanan', 'angkatan bersenjata', 'militerisme'],
      'tentara': ['militer', 'perang', 'pertahanan', 'angkatan darat', 'prajurit'],
      'perang': ['militer', 'konflik', 'pertempuran', 'perjuangan', 'revolusi'],
      'pertahanan': ['militer', 'keamanan', 'tentara', 'strategi', 'perlindungan'],
      'keamanan': ['pertahanan', 'militer', 'proteksi', 'perlindungan', 'ketertiban'],
      'politik': ['pemerintahan', 'negara', 'kekuasaan', 'kebijakan', 'nasionalisme', 'demokrasi'],
      'pemerintahan': ['politik', 'negara', 'administrasi', 'birokrasi', 'kekuasaan'],
      'negara': ['politik', 'pemerintahan', 'nasional', 'republik', 'kedaulatan'],
      'nasionalisme': ['politik', 'kebangsaan', 'patriotisme', 'kemerdekaan', 'perjuangan'],
      'demokrasi': ['politik', 'pemerintahan', 'kebebasan', 'pemilu', 'partisipasi'],
      'sosial': ['masyarakat', 'komunitas', 'rakyat', 'budaya', 'kemasyarakatan', 'interaksi'],
      'masyarakat': ['sosial', 'komunitas', 'rakyat', 'penduduk', 'warga'],
      'komunitas': ['sosial', 'masyarakat', 'kelompok', 'komunal', 'gotong royong'],
      'rakyat': ['masyarakat', 'sosial', 'penduduk', 'warga', 'orang biasa'],
      'ekonomi': ['perdagangan', 'bisnis', 'keuangan', 'pembangunan', 'industri', 'perekonomian'],
      'perdagangan': ['ekonomi', 'bisnis', 'komersial', 'jual beli', 'ekspor impor'],
      'bisnis': ['ekonomi', 'perdagangan', 'usaha', 'komersial', 'perusahaan'],
      'keuangan': ['ekonomi', 'uang', 'bank', 'investasi', 'modal'],
      'industri': ['ekonomi', 'pabrik', 'manufaktur', 'produksi', 'perusahaan'],
      'pertanian': ['perkebunan', 'tanaman', 'pangan', 'agrikultur', 'petani', 'hasil bumi'],
      'perkebunan': ['pertanian', 'tanaman', 'agrikultur', 'estate', 'tebu', 'karet', 'kelapa sawit'],
      'tanaman': ['pertanian', 'perkebunan', 'pangan', 'hortikultura', 'flora'],
      'pangan': ['pertanian', 'makanan', 'bahan makanan', 'konsumsi', 'hasil bumi'],
      'agrikultur': ['pertanian', 'perkebunan', 'tanaman', 'budidaya', 'agraris'],
      'kesehatan': ['medis', 'kedokteran', 'pengobatan', 'klinis', 'rumah sakit', 'penyakit'],
      'medis': ['kesehatan', 'kedokteran', 'pengobatan', 'klinis', 'dokter'],
      'kedokteran': ['kesehatan', 'medis', 'pengobatan', 'dokter', 'rumah sakit'],
      'pengobatan': ['kesehatan', 'medis', 'terapi', 'obat', 'penyembuhan'],
      'penyakit': ['kesehatan', 'medis', 'sakit', 'infeksi', 'epidemi', 'pandemi'],
      'epidemi': ['penyakit', 'wabah', 'kesehatan', 'medis', 'pandemi'],
      'tumbuhan': ['tanaman', 'flora', 'botani', 'pohon', 'sayuran', 'buah'],
      'flora': ['tumbuhan', 'tanaman', 'botani', 'vegetasi', 'alam'],
      'botani': ['tumbuhan', 'flora', 'tanaman', 'ilmu tumbuhan', 'hortikultura'],
      'pohon': ['tumbuhan', 'flora', 'hutan', 'kayu', 'vegetasi'],
      'buah': ['tumbuhan', 'hortikultura', 'makanan', 'pertanian', 'kebun'],
      'sayuran': ['tumbuhan', 'pangan', 'pertanian', 'kebun', 'hortikultura'],
      'geografi': ['wilayah', 'region', 'lokasi', 'peta', 'spasial', 'alam'],
      'wilayah': ['geografi', 'region', 'area', 'lokasi', 'teritori'],
      'region': ['wilayah', 'geografi', 'area', 'kawasan', 'teritori'],
      'peta': ['geografi', 'wilayah', 'spasial', 'kartografi', 'navigasi'],
      'transportasi': ['angkutan', 'perhubungan', 'kendaraan', 'mobilitas', 'logistik'],
      'angkutan': ['transportasi', 'kendaraan', 'mobilitas', 'pengiriman', 'logistik'],
      'perhubungan': ['transportasi', 'komunikasi', 'koneksi', 'jaringan', 'infrastruktur'],
      'pelabuhan': ['transportasi', 'laut', 'perkapalan', 'ekspor impor', 'logistik'],
      'kereta api': ['transportasi', 'perkeretaapian', 'rel', 'stasiun', 'angkutan'],
      'pendidikan': ['pengajaran', 'sekolah', 'belajar', 'ilmu', 'pengetahuan', 'akademik'],
      'pengajaran': ['pendidikan', 'mengajar', 'guru', 'sekolah', 'belajar'],
      'sekolah': ['pendidikan', 'belajar', 'akademik', 'murid', 'guru'],
      'belajar': ['pendidikan', 'pengetahuan', 'ilmu', 'akademik', 'studi'],
      'ilmu': ['pengetahuan', 'sains', 'akademik', 'studi', 'edukasi'],
      'teknologi': ['sains', 'inovasi', 'digital', 'komputer', 'elektronik', 'modern'],
      'sains': ['ilmu', 'teknologi', 'pengetahuan', 'riset', 'saintifik'],
      'inovasi': ['teknologi', 'kreativitas', 'penemuan', 'modern', 'terobosan'],
      'digital': ['teknologi', 'komputer', 'internet', 'elektronik', 'modern'],
      'lingkungan': ['alam', 'ekologi', 'konservasi', 'sustainability', 'hijau', 'bumi'],
      'alam': ['lingkungan', 'ekologi', 'bumi', 'nature', 'konservasi'],
      'ekologi': ['lingkungan', 'alam', 'ekosistem', 'konservasi', 'biodiversity'],
      'konservasi': ['lingkungan', 'alam', 'pelestarian', 'proteksi', 'sustainability'],
      'hukum': ['legal', 'peraturan', 'undang-undang', 'peradilan', 'justice'],
      'legal': ['hukum', 'peraturan', 'undang-undang', 'peradilan', 'yuridis'],
      'peraturan': ['hukum', 'legal', 'undang-undang', 'regulasi', 'ketentuan'],
      'undang-undang': ['hukum', 'legal', 'peraturan', 'legislasi', 'statute'],
      'religi': ['agama', 'kepercayaan', 'spiritual', 'ibadah', 'keyakinan'],
      'agama': ['religi', 'kepercayaan', 'spiritual', 'ibadah', 'keyakinan'],
      'spiritual': ['religi', 'agama', 'kepercayaan', 'batin', 'transendental'],
      'kepercayaan': ['religi', 'agama', 'keyakinan', 'faith', 'spiritual'],
      'wisata': ['pariwisata', 'turisme', 'perjalanan', 'liburan', 'destinasi'],
      'pariwisata': ['wisata', 'turisme', 'perjalanan', 'liburan', 'destinasi'],
      'turisme': ['wisata', 'pariwisata', 'perjalanan', 'liburan', 'travel'],
      'perjalanan': ['wisata', 'pariwisata', 'travel', 'eksplorasi', 'petualangan'],
      'olahraga': ['sports', 'fitness', 'games', 'kompetisi', 'atletik'],
      'sports': ['olahraga', 'games', 'kompetisi', 'atletik', 'fitness'],
      'rekreasi': ['hiburan', 'wisata', 'leisure', 'refreshment', 'fun'],
      'hiburan': ['rekreasi', 'entertainment', 'fun', 'leisure', 'seni'],
      'sumatra': ['sumatera', 'pulau sumatra', 'region sumatra', 'bagian barat'],
      'jawa': ['pulau jawa', 'java', 'region jawa', 'bagian tengah'],
      'kalimantan': ['borneo', 'pulau kalimantan', 'region kalimantan'],
      'sulawesi': ['celebes', 'pulau sulawesi', 'region sulawesi'],
      'papua': ['irian', 'pulau papua', 'region papua', 'papua nugini'],
      'bali': ['pulau bali', 'region bali', 'pulau dewata'],
      'nusa tenggara': ['nusa tenggara barat', 'nusa tenggara timur', 'ntb', 'ntt'],
      'maluku': ['kepulauan maluku', 'molucas', 'region maluku'],
      'jakarta': ['dki jakarta', 'ibukota', 'batavia', 'kota jakarta'],
      'surabaya': ['kota surabaya', 'jawa timur', 'kota pahlawan'],
      'bandung': ['kota bandung', 'jawa barat', 'paris van java'],
      'yogyakarta': ['jogja', 'yogyakarta', 'jawa tengah', 'kota pelajar'],
      'medan': ['kota medan', 'sumatra utara', 'kota metropolitan'],
      'makassar': ['kota makassar', 'sulawesi selatan', 'ujung pandang'],
      'denpasar': ['kota denpasar', 'bali', 'ibukota bali']
    };

    let totalMatchScore = 0;
    let maxPossibleScore = bookThemes.length * 100;

    for (const bookTheme of bookThemes) {
      const bookThemeLower = bookTheme.toLowerCase();
      let bestMatchScore = 0;

      for (const playlistTheme of playlistThemes) {
        const playlistThemeLower = playlistTheme.toLowerCase();
        
        if (bookThemeLower === playlistThemeLower) {
          bestMatchScore = Math.max(bestMatchScore, 100);
          continue;
        }

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
          bestMatchScore = Math.max(bestMatchScore, 80);
          continue;
        }

        const hasDirectRelationship = 
          semanticThemeMapping[bookThemeLower]?.includes(playlistThemeLower) ||
          semanticThemeMapping[playlistThemeLower]?.includes(bookThemeLower);
        
        if (hasDirectRelationship) {
          bestMatchScore = Math.max(bestMatchScore, 70);
          continue;
        }

        const similarity = this.calculateStringSimilarity(bookThemeLower, playlistThemeLower);
        if (similarity > 0.6) {
          bestMatchScore = Math.max(bestMatchScore, Math.round(similarity * 100));
          continue;
        }
      }

      if (bestMatchScore === 0) {
        bestMatchScore = this.getContextualInferenceScore(bookThemeLower, playlistThemes);
      }

      totalMatchScore += bestMatchScore;
    }

    const finalScore = Math.min(100, Math.round(totalMatchScore / bookThemes.length));
    return finalScore;
  },

  getContextualInferenceScore(bookTheme, playlistThemes) {
    const contextualRules = [
      { 
        patterns: ['hindia', 'belanda', 'indie', 'kolonial', 'penjajahan'], 
        targets: ['sejarah', 'indonesia', 'politik', 'militer'],
        score: 70 
      },
      { 
        patterns: ['gambar', 'visual', 'seni', 'foto', 'lukisan', 'karya'], 
        targets: ['budaya', 'seni', 'tradisi', 'kesenian'],
        score: 60 
      },
      { 
        patterns: ['kesehatan', 'medis', 'penyakit', 'obat', 'dokter'], 
        targets: ['kesehatan', 'medis', 'pengobatan'],
        score: 80 
      },
      { 
        patterns: ['pertanian', 'perkebunan', 'tanaman', 'pangan', 'buah'], 
        targets: ['pertanian', 'perkebunan', 'ekonomi', 'sosial'],
        score: 70 
      },
      { 
        patterns: ['transportasi', 'pelabuhan', 'kereta', 'angkutan'], 
        targets: ['transportasi', 'infrastruktur', 'ekonomi'],
        score: 65 
      },
      { 
        patterns: ['sastra', 'puisi', 'prosa', 'cerita', 'bahasa'], 
        targets: ['sastra', 'budaya', 'seni', 'pendidikan'],
        score: 75 
      },
      { 
        patterns: ['sumatra', 'jawa', 'kalimantan', 'sulawesi', 'papua', 'bali'], 
        targets: ['sejarah', 'budaya', 'geografi', 'sosial'],
        score: 60 
      }
    ];

    for (const rule of contextualRules) {
      const hasBookPattern = rule.patterns.some(pattern => bookTheme.includes(pattern));
      const hasPlaylistTarget = rule.targets.some(target => 
        playlistThemes.some(theme => theme.toLowerCase().includes(target))
      );
      
      if (hasBookPattern && hasPlaylistTarget) {
        return rule.score;
      }
    }

    return 0;
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
    if (!bookLocations.length || !playlistLocations.length) {
      return 0;
    }

    const normalizedBookLocs = bookLocations.map(loc => loc.toLowerCase().trim());
    const normalizedPlaylistLocs = playlistLocations.map(loc => loc.toLowerCase().trim());

    const geographicHierarchy = {
      'indonesia': ['nusantara', 'asia tenggara', 'sumatra', 'jawa', 'bali', 'kalimantan', 'sulawesi', 'papua', 'aceh', 'sumatra utara', 'sumatra barat', 'jawa tengah', 'jawa timur', 'jawa barat', 'mentawai'],
      'nusantara': ['indonesia', 'asia tenggara', 'sumatra', 'jawa', 'bali', 'kalimantan', 'sulawesi', 'papua', 'mentawai'],
      'sumatra': ['indonesia', 'nusantara', 'asia tenggara', 'sumatra utara', 'sumatra barat', 'aceh', 'medan', 'padang', 'mentawai'],
      'sumatera barat': ['sumatra', 'indonesia', 'nusantara', 'asia tenggara', 'mentawai', 'padang'],
      'sumatra barat': ['sumatra', 'indonesia', 'nusantara', 'asia tenggara', 'mentawai', 'padang'],
      'mentawai': ['sumatra barat', 'sumatra', 'indonesia', 'nusantara', 'asia tenggara']
    };

    const manualEquivalents = {
      'indonesia': ['nusantara', 'hindia belanda', 'archipelago'],
      'nusantara': ['indonesia', 'hindia belanda'],
      'jawa': ['java'],
      'sumatra': ['sumatera'],
      'sumatera barat': ['sumatra barat', 'west sumatra'],
      'sumatra barat': ['sumatera barat', 'west sumatra'],
      'mentawai': ['mentawai islands', 'kepulauan mentawai']
    };

    const exactMatches = normalizedBookLocs.filter(bookLoc =>
      normalizedPlaylistLocs.includes(bookLoc)
    );
    if (exactMatches.length > 0) {
      return 100;
    }

    let equivalentScore = 0;
    for (const bookLoc of normalizedBookLocs) {
      for (const playlistLoc of normalizedPlaylistLocs) {
        const bookEquivalents = manualEquivalents[bookLoc] || [];
        const playlistEquivalents = manualEquivalents[playlistLoc] || [];
        
        if (bookEquivalents.includes(playlistLoc) || 
            playlistEquivalents.includes(bookLoc)) {
          equivalentScore = Math.max(equivalentScore, 95);
        }
        
        const hasEquivalent = bookEquivalents.some(eq => 
          normalizedPlaylistLocs.includes(eq)
        ) || playlistEquivalents.some(eq => 
          normalizedBookLocs.includes(eq)
        );
        
        if (hasEquivalent) {
          equivalentScore = Math.max(equivalentScore, 90);
        }
      }
    }
    if (equivalentScore > 0) return equivalentScore;

    let bestScore = 0;
    for (const bookLoc of normalizedBookLocs) {
      for (const playlistLoc of normalizedPlaylistLocs) {
        
        if (geographicHierarchy[bookLoc]?.includes(playlistLoc)) {
          bestScore = Math.max(bestScore, 90);
        }
        if (geographicHierarchy[playlistLoc]?.includes(bookLoc)) {
          bestScore = Math.max(bestScore, 90);
        }
        
        const bookParents = geographicHierarchy[bookLoc] || [];
        const playlistParents = geographicHierarchy[playlistLoc] || [];
        const commonParents = bookParents.filter(parent => playlistParents.includes(parent));
        if (commonParents.length > 0) {
          bestScore = Math.max(bestScore, 70);
        }
        
        if (bookLoc.includes(playlistLoc) || playlistLoc.includes(bookLoc)) {
          const inclusionScore = Math.max(
            bookLoc.includes(playlistLoc) ? 80 : 0,
            playlistLoc.includes(bookLoc) ? 80 : 0
          );
          if (inclusionScore > bestScore) {
            bestScore = inclusionScore;
          }
        }
        
        if ((bookLoc === 'mentawai' && playlistLoc === 'sumatra barat') ||
            (bookLoc === 'sumatra barat' && playlistLoc === 'mentawai')) {
          bestScore = Math.max(bestScore, 85);
        }
      }
    }

    return bestScore;
  },

  calculateContentTypeMatch(bookType = '', playlistType = '') {
    if (!bookType || !playlistType) return 0;
    
    const typeMapping = {
      'buku teks': ['sejarah', 'pendidikan', 'akademik', 'non-fiksi'],
      'gambar': ['seni', 'budaya', 'visual', 'foto', 'ilustrasi'],
      'sejarah': ['buku teks', 'non-fiksi', 'akademik', 'pendidikan'],
      'non-fiksi': ['buku teks', 'sejarah', 'akademik', 'pendidikan'],
      'seni': ['budaya', 'visual', 'gambar', 'foto', 'ilustrasi']
    };
    
    const bookVariants = typeMapping[bookType.toLowerCase()] || [bookType.toLowerCase()];
    const playlistVariants = typeMapping[playlistType.toLowerCase()] || [playlistType.toLowerCase()];
    
    const hasMatch = bookVariants.some(bv => 
      playlistVariants.some(pv => 
        bv.includes(pv) || pv.includes(bv) ||
        this.calculateStringSimilarity(bv, pv) > 0.7
      )
    );
    
    return hasMatch ? 100 : 0;
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

  // ==================== AI ENHANCED RECOMMENDATIONS (NOVICE MODE) ====================
  async getAIEnhancedRecommendations(book, topPlaylists) {
    try {
      if (!this.isGeminiAvailable()) {
        return this.createFallbackRecommendations(topPlaylists);
      }

      const prompt = this.createNoviceRecommendationPrompt(book, topPlaylists);
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.2,
        maxTokens: 500,
        timeout: 15000
      });
      
      if (!aiResponse) {
        throw new Error('Empty AI response');
      }
      
      if (aiResponse.length > 450) {
        if (!aiResponse.includes(']') || this.hasUnclosedQuotes(aiResponse)) {
          return this.smartExtractRecommendations(aiResponse, topPlaylists);
        }
      }
      
      return this.parseNoviceAIResponse(aiResponse, topPlaylists);
      
    } catch (error) {
      return this.createFallbackRecommendations(topPlaylists);
    }
  },

  hasUnclosedQuotes(text) {
    const quoteCount = (text.match(/"/g) || []).length;
    return quoteCount % 2 !== 0;
  },

  createNoviceRecommendationPrompt(book, topPlaylists) {
    const playlistsInfo = topPlaylists.map((item, index) => 
      `"${item.playlist.name}"`
    ).join(', ');

    return `
BUKU: "${book.judul}"
TEMA: ${book.metadata_structured?.key_themes?.join(', ') || 'Umum'}

PLAYLIST: ${playlistsInfo}

BERI SCORE 0-100 untuk setiap playlist.
HANYA JSON array:

[
  {"playlistName": "Nama1", "finalScore": 85, "reason": "Alasan singkat"},
  {"playlistName": "Nama2", "finalScore": 75, "reason": "Alasan singkat"},
  {"playlistName": "Nama3", "finalScore": 65, "reason": "Alasan singkat"}
]

Hanya JSON.
`.trim();
  },

  parseNoviceAIResponse(aiResponse, topPlaylists) {
    try {
      let cleanResponse = aiResponse
        .replace(/```json|```|`/g, '')
        .trim();

      cleanResponse = this.fixAllJSONIssues(cleanResponse);
      
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.smartExtractRecommendations(cleanResponse, topPlaylists);
      }

      let jsonText = jsonMatch[0];
      jsonText = this.validateAndFixJSON(jsonText);
      
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not an array');
      }

      return this.formatAIRecommendations(parsed, topPlaylists);

    } catch (error) {
      return this.smartExtractRecommendations(aiResponse, topPlaylists);
    }
  },

  fixAllJSONIssues(jsonString) {
    let fixed = jsonString.trim();
    
    if (fixed.includes('[') && !fixed.endsWith(']')) {
      fixed = this.fixTruncatedArray(fixed);
    }
    
    if (fixed.includes('{') && !fixed.includes('}]')) {
      fixed = this.fixTruncatedObjects(fixed);
    }
    
    fixed = this.fixUnclosedStrings(fixed);
    fixed = this.removeTrailingCommas(fixed);
    
    if (fixed.includes('[') && !fixed.endsWith(']')) {
      fixed += ']';
    }
    
    return fixed;
  },

  fixTruncatedArray(jsonString) {
    let fixed = jsonString;
    
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    if (!fixed.endsWith(']')) {
      const lastObjectMatch = fixed.match(/\{"playlistName":"[^"]*","finalScore":\d+,"reason":"[^"]*"\}/g);
      if (lastObjectMatch && lastObjectMatch.length > 0) {
        const lastCompleteObject = lastObjectMatch[lastObjectMatch.length - 1];
        const lastIndex = fixed.lastIndexOf(lastCompleteObject);
        if (lastIndex !== -1) {
          fixed = fixed.substring(0, lastIndex + lastCompleteObject.length) + ']';
        }
      } else {
        fixed += ']';
      }
    }
    
    return fixed;
  },

  fixTruncatedObjects(jsonString) {
    let fixed = jsonString;
    
    const incompleteObjectPattern = /\{"playlistName":"[^"]*","finalScore":\d+,"reason":"[^"]*$/;
    
    if (incompleteObjectPattern.test(fixed)) {
      const match = fixed.match(/\{"playlistName":"([^"]*)","finalScore":(\d+),"reason":"([^"]*)$/);
      if (match) {
        const [fullMatch, playlistName, finalScore, partialReason] = match;
        const completeObject = `{"playlistName":"${playlistName}","finalScore":${finalScore},"reason":"${partialReason}"}`;
        fixed = fixed.replace(fullMatch, completeObject);
      }
    }
    
    return fixed;
  },

  fixUnclosedStrings(jsonString) {
    let fixed = jsonString;
    
    const quoteCount = (fixed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      fixed += '"';
    }
    
    const unclosedReasonPattern = /"reason":\s*"([^"]*)$/;
    if (unclosedReasonPattern.test(fixed)) {
      fixed = fixed.replace(unclosedReasonPattern, '"reason": "$1"');
    }
    
    return fixed;
  },

  removeTrailingCommas(jsonString) {
    let fixed = jsonString;
    fixed = fixed.replace(/,\s*([\]}])/g, '$1');
    return fixed;
  },

  validateAndFixJSON(jsonString) {
    let fixed = jsonString;
    
    try {
      JSON.parse(fixed);
      return fixed;
    } catch (error) {
      fixed = this.fixCommonJSONErrors(fixed);
      
      try {
        JSON.parse(fixed);
        return fixed;
      } catch (secondError) {
        throw new Error('JSON cannot be fixed: ' + secondError.message);
      }
    }
  },

  smartExtractRecommendations(text, topPlaylists) {
    const recommendations = [];
    
    for (let i = 0; i < topPlaylists.length; i++) {
      const playlist = topPlaylists[i].playlist;
      const playlistName = this.escapeRegex(playlist.name);
      
      const extracted = this.extractPlaylistData(text, playlistName, playlist, i);
      recommendations.push(extracted);
    }
    
    return recommendations;
  },

  extractPlaylistData(text, playlistName, playlist, index) {
    const patterns = [
      new RegExp(`\\{"playlistName":\\s*"${playlistName}"[^}]*"finalScore":\\s*(\\d+)[^}]*"reason":\\s*"([^"]*)"`, 'i'),
      new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"finalScore":\\s*(\\d+)`, 'i'),
      new RegExp(`"${playlistName}"[^}]*?(\\d{1,3})`, 'i'),
      new RegExp(`${playlistName}.*?(\\d{1,3})(?=\\D|$)`, 'i')
    ];
    
    let score = 70 - (index * 10);
    let reason = 'Analisis berdasarkan konten playlist';
    let extracted = false;
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        score = parseInt(match[1]);
        
        const reasonPatterns = [
          new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"reason":\\s*"([^"]*)"`, 'i'),
          new RegExp(`"${playlistName}"[^}]*?"reason":\\s*"([^"]*)"`, 'i')
        ];
        
        for (const reasonPattern of reasonPatterns) {
          const reasonMatch = text.match(reasonPattern);
          if (reasonMatch) {
            reason = reasonMatch[1];
            break;
          }
        }
        
        extracted = true;
        break;
      }
    }
    
    return {
      playlistId: playlist.id,
      playlistName: playlist.name,
      matchScore: score,
      confidence: extracted ? 0.8 : 0.6,
      reasoning: reason,
      strengths: extracted ? ['Analisis AI'] : ['Analisis sistem'],
      considerations: [],
      improvementSuggestions: [],
      isFallback: !extracted,
      aiEnhanced: extracted
    };
  },

  formatAIRecommendations(parsedData, topPlaylists) {
    return parsedData.map((item, index) => {
      const playlist = topPlaylists[index]?.playlist;
      if (!playlist) {
        return null;
      }

      const finalScore = this.validateScore(item.finalScore || item.matchScore || 50);
      const reason = this.sanitizeReason(item.reason || item.reasoning || 'Analisis AI');

      return {
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: finalScore,
        confidence: 0.9,
        reasoning: reason,
        strengths: item.strengths || [],
        considerations: item.considerations || [],
        improvementSuggestions: [],
        isFallback: false,
        aiEnhanced: true
      };
    }).filter(Boolean);
  },

  validateScore(score) {
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return 50;
    }
    return numScore;
  },

  sanitizeReason(reason) {
    if (typeof reason !== 'string') {
      return 'Analisis AI';
    }
    
    return reason
      .replace(/[^\w\s.,!?\-()]/g, '')
      .substring(0, 200);
  },

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  createFallbackRecommendations(topPlaylists) {
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

  fixCommonJSONErrors(jsonString) {
    let fixed = jsonString;
    
    fixed = fixed.replace(/,\s*([\]}])/g, '$1');
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
    fixed = fixed.replace(/(:"[^"]*)$/g, '$1"');
    
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }
    
    return fixed;
  },

  // ==================== COMPATIBILITY FUNCTIONS ====================
  async getPlaylistRecommendations({ book, playlists = [] }) {
    return this.noviceRecommendations({ book, playlists });
  },

  // ==================== GEMINI AVAILABILITY ====================
  isGeminiAvailable() {
    try {
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      const hasGeminiFunction = typeof generateAIResponse === 'function';
      
      return hasApiKey && hasGeminiFunction;
    } catch (error) {
      return false;
    }
  },

  // Helper function di luar object
  function generateBasicMetadataFromTitle(book) {
    const title = book.judul?.toLowerCase() || '';
    
    const themes = [];
    if (title.includes('sejarah')) themes.push('sejarah');
    if (title.includes('militer') || title.includes('perang')) themes.push('militer');
    if (title.includes('budaya')) themes.push('budaya');
    if (title.includes('biografi')) themes.push('biografi');
    if (title.includes('politik')) themes.push('politik');
    
    if (themes.length === 0) themes.push('sejarah');
    
    return {
      key_themes: themes,
      geographic_focus: ['indonesia'],
      historical_period: ['kolonial'],
      content_type: 'buku teks',
      is_fallback: true
    };
  }

};

export default aiMatchingService;
