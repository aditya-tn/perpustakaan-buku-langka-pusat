// services/aiMatchingService.js - COMPLETE PRODUCTION READY VERSION
import { generateAIResponse } from '../lib/gemini';

export const aiMatchingService = {

  // ==================== EXPERT MODE ====================
async expertDirectMatch(book, playlist) {
  console.log('⚡⚡⚡ EXPERT MODE: Pure AI Matching ⚡⚡⚡');
  console.log('📘 Book:', book.judul);
  console.log('📗 Playlist:', playlist.name);
  
  try {
    // ✅ LANGSUNG PANGGIL AI - TANPA CEK METADATA
    console.log('🎯 Creating pure AI prompt...');
    const prompt = this.createPureExpertPrompt(book, playlist);
    console.log('📋 Prompt:', prompt);
    
    console.log('🎯 Calling AI directly...');
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.1,
      maxTokens: 200, // Lebih ringkas
      timeout: 10000
    });
    
    console.log('📨 AI Response:', aiResponse);
    
    if (!aiResponse) {
      throw new Error('AI tidak memberikan respons');
    }

    console.log('🎯 Parsing AI response...');
    const result = this.parsePureExpertResponse(aiResponse, book, playlist);
    
    console.log('✅✅✅ EXPERT MODE SUCCESS:', result.matchScore);
    return result;
    
  } catch (error) {
    console.error('❌❌❌ EXPERT MODE FAILED:', error);
    // ✅ TANPA FALLBACK - LANGSUNG THROW ERROR
    throw new Error(`Analisis AI gagal: ${error.message}. Silakan coba lagi.`);
  }
},

// 🆕 PURE EXPERT PROMPT - HANYA DESKRIPSI
createPureExpertPrompt(book, playlist) {
  return `
BUKU: "${book.judul}"
${book.deskripsi_buku ? `DESKRIPSI: ${book.deskripsi_buku}` : ''}

PLAYLIST: "${playlist.name}"  
${playlist.description ? `DESKRIPSI: ${playlist.description}` : ''}

INSTRUKSI: Berikan score 0-100 berdasarkan kecocokan buku dengan playlist.
Berikan alasan singkat 1 kalimat.

FORMAT: {"matchScore": 85, "reason": "Alasan singkat"}

Hanya JSON.
`.trim();
},

// 🆕 SIMPLE PARSING - TANPA KOMPLIKASI
parsePureExpertResponse(aiResponse, book, playlist) {
  try {
    console.log('🔍 Parsing pure AI response...');
    
    // Bersihkan response
    let cleanResponse = aiResponse
      .replace(/```json|```|`/g, '')
      .trim();

    console.log('🧹 Cleaned:', cleanResponse);

    // Extract JSON
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Tidak ada JSON dalam respons');
    }
    
    let jsonText = jsonMatch[0];
    
    // Parse langsung
    const parsed = JSON.parse(jsonText);
    
    // Validasi sederhana
    if (typeof parsed.matchScore !== 'number') {
      throw new Error('Score tidak valid');
    }
    
    const finalScore = Math.max(0, Math.min(100, parsed.matchScore));
    
    console.log(`✅ Pure expert match: ${finalScore}%`);
    
    return {
      matchScore: finalScore,
      confidence: 0.95, // High confidence untuk expert mode
      reasoning: parsed.reason || 'Analisis langsung oleh AI',
      keyFactors: ['direct_ai_analysis'],
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: false,
      matchType: 'pure_expert_ai'
    };
    
  } catch (error) {
    console.error('❌ Pure expert parse failed:', error);
    throw new Error(`Gagal memproses hasil AI: ${error.message}`);
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
        // 🆕 FIX: Check multiple metadata fields
        const hasMetadata = playlist.ai_metadata || playlist.metadata_structured;
        const isEmpty = playlist.ai_metadata?.is_empty || playlist.ai_metadata?.is_fallback;
        
        if (!hasMetadata || isEmpty) {
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
    console.log('🎯 CALCULATING ENHANCED SCORES - WITH METADATA CHECK');
    
    // ✅ GUNAKAN API YANG SUDAH ADA untuk generate metadata jika belum ada
    let bookWithMetadata = book;
    if (!book.metadata_structured && !book.ai_metadata) {
      console.log('🔄 No metadata found, calling generate-ai-description API...');
      try {
        bookWithMetadata = await this.generateBookMetadata(book);
      } catch (error) {
        console.error('❌ Failed to generate metadata, using fallback:', error);
        bookWithMetadata = {
          ...book,
          metadata_structured: this.generateBasicMetadataFromTitle(book)
        };
      }
    }
    
    console.log('📘 BOOK METADATA:', bookWithMetadata.metadata_structured);
    
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
        console.error(`❌ Error scoring ${playlist.name}:`, error);
        scoredPlaylists.push({ playlist, score: 0 });
      }
    }
    
    return scoredPlaylists.sort((a, b) => b.score - a.score);
  },

  // 🆕 CALL EXISTING generate-ai-description API - FIXED URL
async generateBookMetadata(book) {
  console.log('🎯 GENERATING METADATA: Matching API format for', book.judul);
  
  // ✅ CEK: Jika sudah punya metadata, skip
  if (book.metadata_structured || book.ai_metadata) {
    console.log('✅ Book already has metadata, skipping generation');
    return book;
  }

  console.log('🚀 Calling AI for metadata generation...');
  
  try {
    const { generateAIResponse } = await import('../lib/gemini');
    const { supabase } = await import('../lib/supabase');
    
    // ✅ VALIDATE: Pastikan Gemini available
    if (!generateAIResponse || typeof generateAIResponse !== 'function') {
      throw new Error('AI service tidak tersedia');
    }

    const prompt = `
BUKU: "${book.judul}"
PENGARANG: "${book.pengarang || 'Tidak diketahui'}"
TAHUN: "${book.tahun_terbit || 'Tidak diketahui'}"

INSTRUKSI: Berikan metadata terstruktur dalam format JSON yang spesifik untuk sistem matching buku sejarah.

FORMAT OUTPUT (JSON saja - HARUS PERSIS):
{
  "key_themes": ["tema1", "tema2", "tema3"],
  "geographic_focus": ["lokasi1", "lokasi2"], 
  "historical_period": ["periode1", "periode2"],
  "content_type": "jenis_konten",
  "subject_categories": ["kategori1", "kategori2"],
  "temporal_coverage": "TAHUN_AWAL-TAHUN_AKHIR"
}

ATURAN:
- "subject_categories" WAJIB ada (array)
- "temporal_coverage" format: "1820-1900" atau string kosong ""
- Gunakan array kosong [] jika informasi tidak tersedia
- Jangan tambahkan field lain selain yang di atas

Hanya kembalikan JSON, tanpa penjelasan lain.
`.trim();

    console.log('📝 Sending request to AI...');
    
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.1,
      maxTokens: 400,
      timeout: 10000
    });

    console.log('📨 AI Response received:', {
      length: aiResponse?.length,
      preview: aiResponse?.substring(0, 100)
    });

    if (!aiResponse) {
      throw new Error('AI tidak memberikan respons');
    }

    // ✅ PARSE AI RESPONSE dengan format yang sama
    let cleanResponse = aiResponse
      .replace(/```json|```|`/g, '')
      .trim();

    console.log('🧹 Cleaned response:', cleanResponse);

    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format respons AI tidak valid - tidak ada JSON');
    }

    let jsonText = jsonMatch[0];
    jsonText = this.fixCommonJSONErrors(jsonText);
    
    console.log('📄 JSON to parse:', jsonText);

    const metadata = JSON.parse(jsonText);

    // ✅ VALIDATE REQUIRED FIELDS sesuai format API
    const requiredFields = ['key_themes', 'geographic_focus', 'historical_period', 'subject_categories'];
    for (const field of requiredFields) {
      if (!metadata[field] || !Array.isArray(metadata[field])) {
        throw new Error(`Metadata tidak lengkap - ${field} harus array`);
      }
    }

    // ✅ BUILD COMPLETE METADATA OBJECT
    const completeMetadata = {
      // ✅ FIELD YANG SAMA DENGAN generate-ai-description.js
      key_themes: metadata.key_themes || [],
      geographic_focus: metadata.geographic_focus || [],
      historical_period: metadata.historical_period || [],
      content_type: metadata.content_type || 'non-fiksi',
      subject_categories: metadata.subject_categories || [],
      temporal_coverage: metadata.temporal_coverage || '',
      
      // ✅ FIELD TAMBAHAN UNTUK TRACKING
      is_empty: false,
      ai_failed: false,
      generated_by: 'ai_matching_service',
      generated_at: new Date().toISOString()
    };

    console.log('✅ AI metadata generation successful:', completeMetadata);

    // 🆕 🚀 SIMPAN KE DATABASE
    console.log('💾 Saving metadata to database...');
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({
        metadata_structured: completeMetadata,
        metadata_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', book.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to save metadata to database:', updateError);
      // Lanjut saja, tidak throw error karena metadata sudah di-generate
    } else {
      console.log('✅ Metadata saved to database successfully');
    }

    // ✅ RETURN BOOK WITH METADATA
    return {
      ...book,
      metadata_structured: completeMetadata
    };

  } catch (error) {
    console.error('❌❌❌ AI METADATA GENERATION FAILED:', error);
    
    // ✅ THROW ERROR - tidak ada fallback
    throw new Error(`Gagal generate metadata AI: ${error.message}. Silakan coba lagi nanti.`);
  }
},

  // 🆕 ADD MISSING METHOD - BASIC METADATA GENERATION
  generateBasicMetadataFromTitle(book) {
    console.log('🔄 Generating basic metadata from book title...');
    const title = book.judul?.toLowerCase() || '';
    
    const inferredThemes = [];
    const inferredLocations = [];
    const inferredPeriods = [];
    
    // Theme inference from title
    if (title.includes('sejarah')) inferredThemes.push('sejarah');
    if (title.includes('militer') || title.includes('perang')) inferredThemes.push('militer');
    if (title.includes('budaya') || title.includes('seni')) inferredThemes.push('budaya');
    if (title.includes('biografi') || title.includes('tokoh')) inferredThemes.push('biografi');
    if (title.includes('politik')) inferredThemes.push('politik');
    if (title.includes('ekonomi')) inferredThemes.push('ekonomi');
    if (title.includes('sosial')) inferredThemes.push('sosial');
    if (title.includes('hukum')) inferredThemes.push('hukum');
    if (title.includes('pendidikan')) inferredThemes.push('pendidikan');
    
    // Default fallback
    if (inferredThemes.length === 0) inferredThemes.push('sejarah');
    
    // Location inference
    if (title.includes('indonesia')) inferredLocations.push('indonesia');
    if (title.includes('jawa')) inferredLocations.push('jawa');
    if (title.includes('sumatra')) inferredLocations.push('sumatra');
    if (title.includes('bali')) inferredLocations.push('bali');
    if (title.includes('kalimantan')) inferredLocations.push('kalimantan');
    if (title.includes('sulawesi')) inferredLocations.push('sulawesi');
    if (title.includes('papua')) inferredLocations.push('papua');
    if (inferredLocations.length === 0) inferredLocations.push('indonesia');
    
    // Period inference
    if (title.includes('kolonial') || title.includes('belanda')) inferredPeriods.push('kolonial');
    if (title.includes('jepang')) inferredPeriods.push('pendudukan jepang');
    if (title.includes('revolusi') || title.includes('kemerdekaan')) inferredPeriods.push('revolusi');
    if (title.match(/\b(1[0-9]{3})\b/)) inferredPeriods.push('sejarah');
    
    return {
      key_themes: inferredThemes,
      geographic_focus: inferredLocations,
      historical_period: inferredPeriods.length > 0 ? inferredPeriods : ['sejarah'],
      content_type: 'non-fiksi',
      is_fallback: true,
      generated_from: 'title_inference',
      generated_at: new Date().toISOString()
    };
  },

calculateDirectMetadataMatch(book, playlist) {
  console.log('🔍 DIRECT METADATA MATCHING - UPDATED FIELD ACCESS');
  
  // ✅ GUNAKAN FORMAT YANG SAMA DENGAN API
  const bookMeta = book.metadata_structured || book.ai_metadata || {};
  const playlistMeta = playlist.ai_metadata || playlist.metadata_structured || {};
  
  console.log('📘 Book Meta:', {
    key_themes: bookMeta.key_themes,
    geographic_focus: bookMeta.geographic_focus,
    historical_period: bookMeta.historical_period,
    subject_categories: bookMeta.subject_categories // 🆕 FIELD BARU
  });
  
  console.log('📗 Playlist Meta:', {
    key_themes: playlistMeta.key_themes,
    geographic_focus: playlistMeta.geographic_focus, 
    historical_period: playlistMeta.historical_period,
    subject_categories: playlistMeta.subject_categories // 🆕 FIELD BARU
  });

  let score = 0;
  const factors = [];

  // 1. THEME MATCHING (40%) - GUNAKAN subject_categories JIKA ADA
  const bookThemes = bookMeta.key_themes || bookMeta.subject_categories || [];
  const playlistThemes = playlistMeta.key_themes || playlistMeta.subject_categories || [];
  
  console.log('🎯 THEMES - Book:', bookThemes, 'Playlist:', playlistThemes);
  
  const themeScore = this.calculateThemeMatch(bookThemes, playlistThemes);
  score += themeScore * 0.4;
  if (themeScore > 0) factors.push('tema_sejalan');

  // 2. GEOGRAPHIC MATCHING (30%)
  const bookGeo = bookMeta.geographic_focus || bookMeta.geographical_focus || [];
  const playlistGeo = playlistMeta.geographic_focus || playlistMeta.geographical_focus || ['indonesia']; // Default fallback
  
  console.log('🗺️ GEO - Book:', bookGeo, 'Playlist:', playlistGeo);
  
  const geoScore = this.calculateGeographicMatch(bookGeo, playlistGeo);
  score += geoScore * 0.3;
  if (geoScore > 0) factors.push('lokasi_serumpun');

  // 3. TEMPORAL MATCHING (20%) - 🆕 FIELD BARU
  const bookTemporal = bookMeta.temporal_coverage || '';
  const playlistTemporal = playlistMeta.temporal_coverage || '';
  
  console.log('📅 TEMPORAL - Book:', bookTemporal, 'Playlist:', playlistTemporal);
  
  const temporalScore = this.calculateTemporalMatch(bookTemporal, playlistTemporal);
  score += temporalScore * 0.2;
  if (temporalScore > 0) factors.push('periode_sezaman');

  // 4. CONTENT TYPE MATCHING (10%)
  const bookType = bookMeta.content_type || '';
  const playlistType = playlistMeta.content_type || '';
  
  console.log('📚 CONTENT TYPE - Book:', bookType, 'Playlist:', playlistType);
  
  const contentTypeScore = this.calculateContentTypeMatch(bookType, playlistType);
  score += contentTypeScore * 0.1;
  if (contentTypeScore > 0) factors.push('jenis_konten_sesuai');

  const finalScore = Math.min(100, Math.round(score));

  console.log(`📊 FINAL MATCH SCORE: ${finalScore}%`);
  console.log('🎯 FACTORS:', factors);

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

// 🆕 ADD TEMPORAL MATCHING METHOD
calculateTemporalMatch(bookTemporal = '', playlistTemporal = '') {
  if (!bookTemporal || !playlistTemporal) return 0;
  
  console.log('📅 TEMPORAL MATCHING:', { bookTemporal, playlistTemporal });
  
  // Exact match
  if (bookTemporal === playlistTemporal) {
    console.log('✅ Exact temporal match');
    return 100;
  }
  
  // Extract years untuk range comparison
  const bookYears = this.extractYearsFromTemporal(bookTemporal);
  const playlistYears = this.extractYearsFromTemporal(playlistTemporal);
  
  if (bookYears && playlistYears) {
    const [bookStart, bookEnd] = bookYears;
    const [playlistStart, playlistEnd] = playlistYears;
    
    // Check for overlap
    if (bookStart <= playlistEnd && bookEnd >= playlistStart) {
      const overlapScore = this.calculateTemporalOverlap(bookYears, playlistYears);
      console.log(`✅ Temporal overlap: ${overlapScore}%`);
      return overlapScore;
    }
  }
  
  console.log('❌ No temporal match');
  return 0;
},

// 🆕 HELPER: Extract years from temporal coverage
extractYearsFromTemporal(temporal) {
  if (!temporal) return null;
  
  // Format: "1820-1900" atau "1800-1899"
  const yearMatch = temporal.match(/(\d{4})-(\d{4})/);
  if (yearMatch) {
    return [parseInt(yearMatch[1]), parseInt(yearMatch[2])];
  }
  
  // Format: "abad ke-19" → convert to years
  if (temporal.includes('abad ke-19') || temporal.includes('19th')) {
    return [1800, 1899];
  }
  
  if (temporal.includes('abad ke-20') || temporal.includes('20th')) {
    return [1900, 1999];
  }
  
  return null;
},

// 🆕 HELPER: Calculate temporal overlap percentage
calculateTemporalOverlap(bookYears, playlistYears) {
  const [bookStart, bookEnd] = bookYears;
  const [playlistStart, playlistEnd] = playlistYears;
  
  const overlapStart = Math.max(bookStart, playlistStart);
  const overlapEnd = Math.min(bookEnd, playlistEnd);
  
  if (overlapStart <= overlapEnd) {
    const overlapDuration = overlapEnd - overlapStart + 1;
    const bookDuration = bookEnd - bookStart + 1;
    const playlistDuration = playlistEnd - playlistStart + 1;
    
    const minDuration = Math.min(bookDuration, playlistDuration);
    const score = Math.round((overlapDuration / minDuration) * 100);
    
    return Math.min(100, score);
  }
  
  return 0;
},
  
  // 🆕 ENHANCED KEYWORD MATCHING
  calculateEnhancedKeywordMatch(book, playlist) {
    const bookTitle = book.judul?.toLowerCase() || '';
    const playlistName = playlist.name?.toLowerCase() || '';
    
    // Check multiple metadata fields
    const bookMeta = book.metadata_structured || book.ai_metadata || {};
    const playlistMeta = playlist.ai_metadata || {};
    
    // Extract from both keywords and themes
    const bookKeywords = bookMeta.keywords || bookMeta.key_themes || [];
    const playlistKeywords = playlistMeta.keywords || playlistMeta.key_themes || [];
    
    // Combine title + keywords for better matching
    const bookText = (bookTitle + ' ' + bookKeywords.join(' ')).toLowerCase();
    const playlistText = (playlistName + ' ' + playlistKeywords.join(' ')).toLowerCase();
    
    // More comprehensive keyword list
    const keywords = ['sejarah', 'indonesia', 'nasional', 'kebangsaan', 'militer', 'budaya', 'biografi', 'politik', 'sosial'];
    
    let matches = 0;
    keywords.forEach(keyword => {
      if (bookText.includes(keyword) && playlistText.includes(keyword)) {
        matches++;
        console.log(`   ✅ Keyword match: "${keyword}"`);
      }
    });
    
    const score = matches > 0 ? Math.min(100, matches * 25) : 0;
    console.log(`   🎯 Keyword score: ${score}% (${matches} matches)`);
    
    return score;
  },

  // 🆕 ADD DEBUG TO THEME MATCHING
  calculateThemeMatch(bookThemes = [], playlistThemes = []) {
    console.log('🎯 THEME MATCHING DEBUG:');
    console.log('   Book Themes:', bookThemes);
    console.log('   Playlist Themes:', playlistThemes);
    
    if (!bookThemes.length || !playlistThemes.length) {
      console.log('   ❌ No themes to compare');
      return 0;
    }

    // 🆕 COMPREHENSIVE SEMANTIC MAPPING FOR INDONESIAN CONTEXT
    const semanticThemeMapping = {
      // ==================== SEJARAH & KOLONIAL ====================
      'hindia belanda': ['sejarah', 'kolonial', 'belanda', 'sejarah indonesia', 'nusantara', 'masa kolonial', 'penjajahan', 'voc', 'knil'],
      'indie': ['hindia belanda', 'sejarah', 'kolonial', 'belanda', 'masa lalu'],
      'sejarah': ['historis', 'masa lalu', 'peristiwa', 'kolonial', 'nasionalisme', 'hindia belanda', 'perjuangan', 'revolusi'],
      'kolonial': ['penjajahan', 'belanda', 'hindia belanda', 'sejarah', 'voc', 'knil', 'imperialisme'],
      'penjajahan': ['kolonial', 'belanda', 'hindia belanda', 'sejarah', 'perlawanan'],
      'voc': ['hindia belanda', 'kolonial', 'belanda', 'perdagangan', 'sejarah'],
      'knil': ['militer', 'kolonial', 'belanda', 'hindia belanda', 'tentara', 'sejarah'],
      
      // ==================== SENI & BUDAYA ====================
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
      
      // ==================== SASTRA & BAHASA ====================
      'sastra': ['literatur', 'kesusasteraan', 'puisi', 'prosa', 'cerita', 'budaya'],
      'puisi': ['sastra', 'syair', 'puisi', 'karya sastra', 'literatur'],
      'prosa': ['sastra', 'cerita', 'narasi', 'novel', 'cerpen'],
      'cerita': ['sastra', 'narasi', 'dongeng', 'hikayat', 'legenda'],
      'bahasa': ['linguistik', 'sastra', 'komunikasi', 'budaya', 'kata'],
      'linguistik': ['bahasa', 'sastra', 'grammar', 'kata', 'komunikasi'],
      
      // ==================== MILITER & PERTAHANAN ====================
      'militer': ['tentara', 'perang', 'pertahanan', 'keamanan', 'angkatan bersenjata', 'militerisme'],
      'tentara': ['militer', 'perang', 'pertahanan', 'angkatan darat', 'prajurit'],
      'perang': ['militer', 'konflik', 'pertempuran', 'perjuangan', 'revolusi'],
      'pertahanan': ['militer', 'keamanan', 'tentara', 'strategi', 'perlindungan'],
      'keamanan': ['pertahanan', 'militer', 'proteksi', 'perlindungan', 'ketertiban'],
      
      // ==================== POLITIK & PEMERINTAHAN ====================
      'politik': ['pemerintahan', 'negara', 'kekuasaan', 'kebijakan', 'nasionalisme', 'demokrasi'],
      'pemerintahan': ['politik', 'negara', 'administrasi', 'birokrasi', 'kekuasaan'],
      'negara': ['politik', 'pemerintahan', 'nasional', 'republik', 'kedaulatan'],
      'nasionalisme': ['politik', 'kebangsaan', 'patriotisme', 'kemerdekaan', 'perjuangan'],
      'demokrasi': ['politik', 'pemerintahan', 'kebebasan', 'pemilu', 'partisipasi'],
      
      // ==================== SOSIAL & MASYARAKAT ====================
      'sosial': ['masyarakat', 'komunitas', 'rakyat', 'budaya', 'kemasyarakatan', 'interaksi'],
      'masyarakat': ['sosial', 'komunitas', 'rakyat', 'penduduk', 'warga'],
      'komunitas': ['sosial', 'masyarakat', 'kelompok', 'komunal', 'gotong royong'],
      'rakyat': ['masyarakat', 'sosial', 'penduduk', 'warga', 'orang biasa'],
      
      // ==================== EKONOMI & BISNIS ====================
      'ekonomi': ['perdagangan', 'bisnis', 'keuangan', 'pembangunan', 'industri', 'perekonomian'],
      'perdagangan': ['ekonomi', 'bisnis', 'komersial', 'jual beli', 'ekspor impor'],
      'bisnis': ['ekonomi', 'perdagangan', 'usaha', 'komersial', 'perusahaan'],
      'keuangan': ['ekonomi', 'uang', 'bank', 'investasi', 'modal'],
      'industri': ['ekonomi', 'pabrik', 'manufaktur', 'produksi', 'perusahaan'],
      
      // ==================== PERTANIAN & PERKEBUNAN ====================
      'pertanian': ['perkebunan', 'tanaman', 'pangan', 'agrikultur', 'petani', 'hasil bumi'],
      'perkebunan': ['pertanian', 'tanaman', 'agrikultur', 'estate', 'tebu', 'karet', 'kelapa sawit'],
      'tanaman': ['pertanian', 'perkebunan', 'pangan', 'hortikultura', 'flora'],
      'pangan': ['pertanian', 'makanan', 'bahan makanan', 'konsumsi', 'hasil bumi'],
      'agrikultur': ['pertanian', 'perkebunan', 'tanaman', 'budidaya', 'agraris'],
      
      // ==================== KESEHATAN & MEDIS ====================
      'kesehatan': ['medis', 'kedokteran', 'pengobatan', 'klinis', 'rumah sakit', 'penyakit'],
      'medis': ['kesehatan', 'kedokteran', 'pengobatan', 'klinis', 'dokter'],
      'kedokteran': ['kesehatan', 'medis', 'pengobatan', 'dokter', 'rumah sakit'],
      'pengobatan': ['kesehatan', 'medis', 'terapi', 'obat', 'penyembuhan'],
      'penyakit': ['kesehatan', 'medis', 'sakit', 'infeksi', 'epidemi', 'pandemi'],
      'epidemi': ['penyakit', 'wabah', 'kesehatan', 'medis', 'pandemi'],
      
      // ==================== TUMBUHAN & BOTANI ====================
      'tumbuhan': ['tanaman', 'flora', 'botani', 'pohon', 'sayuran', 'buah'],
      'flora': ['tumbuhan', 'tanaman', 'botani', 'vegetasi', 'alam'],
      'botani': ['tumbuhan', 'flora', 'tanaman', 'ilmu tumbuhan', 'hortikultura'],
      'pohon': ['tumbuhan', 'flora', 'hutan', 'kayu', 'vegetasi'],
      'buah': ['tumbuhan', 'hortikultura', 'makanan', 'pertanian', 'kebun'],
      'sayuran': ['tumbuhan', 'pangan', 'pertanian', 'kebun', 'hortikultura'],
      
      // ==================== GEOGRAFI & WILAYAH ====================
      'geografi': ['wilayah', 'region', 'lokasi', 'peta', 'spasial', 'alam'],
      'wilayah': ['geografi', 'region', 'area', 'lokasi', 'teritori'],
      'region': ['wilayah', 'geografi', 'area', 'kawasan', 'teritori'],
      'peta': ['geografi', 'wilayah', 'spasial', 'kartografi', 'navigasi'],
      
      // ==================== TRANSPORTASI & INFRASTRUKTUR ====================
      'transportasi': ['angkutan', 'perhubungan', 'kendaraan', 'mobilitas', 'logistik'],
      'angkutan': ['transportasi', 'kendaraan', 'mobilitas', 'pengiriman', 'logistik'],
      'perhubungan': ['transportasi', 'komunikasi', 'koneksi', 'jaringan', 'infrastruktur'],
      'pelabuhan': ['transportasi', 'laut', 'perkapalan', 'ekspor impor', 'logistik'],
      'kereta api': ['transportasi', 'perkeretaapian', 'rel', 'stasiun', 'angkutan'],
      
      // ==================== PENDIDIKAN & PENGETAHUAN ====================
      'pendidikan': ['pengajaran', 'sekolah', 'belajar', 'ilmu', 'pengetahuan', 'akademik'],
      'pengajaran': ['pendidikan', 'mengajar', 'guru', 'sekolah', 'belajar'],
      'sekolah': ['pendidikan', 'belajar', 'akademik', 'murid', 'guru'],
      'belajar': ['pendidikan', 'pengetahuan', 'ilmu', 'akademik', 'studi'],
      'ilmu': ['pengetahuan', 'sains', 'akademik', 'studi', 'edukasi'],
      
      // ==================== TEKNOLOGI & SAINS ====================
      'teknologi': ['sains', 'inovasi', 'digital', 'komputer', 'elektronik', 'modern'],
      'sains': ['ilmu', 'teknologi', 'pengetahuan', 'riset', 'saintifik'],
      'inovasi': ['teknologi', 'kreativitas', 'penemuan', 'modern', 'terobosan'],
      'digital': ['teknologi', 'komputer', 'internet', 'elektronik', 'modern'],
      
      // ==================== LINGKUNGAN & ALAM ====================
      'lingkungan': ['alam', 'ekologi', 'konservasi', 'sustainability', 'hijau', 'bumi'],
      'alam': ['lingkungan', 'ekologi', 'bumi', 'nature', 'konservasi'],
      'ekologi': ['lingkungan', 'alam', 'ekosistem', 'konservasi', 'biodiversity'],
      'konservasi': ['lingkungan', 'alam', 'pelestarian', 'proteksi', 'sustainability'],
      
      // ==================== HUKUM & PERUNDANG-UNDANGAN ====================
      'hukum': ['legal', 'peraturan', 'undang-undang', 'peradilan', 'justice'],
      'legal': ['hukum', 'peraturan', 'undang-undang', 'peradilan', 'yuridis'],
      'peraturan': ['hukum', 'legal', 'undang-undang', 'regulasi', 'ketentuan'],
      'undang-undang': ['hukum', 'legal', 'peraturan', 'legislasi', 'statute'],
      
      // ==================== RELIGI & KEPERCAYAAN ====================
      'religi': ['agama', 'kepercayaan', 'spiritual', 'ibadah', 'keyakinan'],
      'agama': ['religi', 'kepercayaan', 'spiritual', 'ibadah', 'keyakinan'],
      'spiritual': ['religi', 'agama', 'kepercayaan', 'batin', 'transendental'],
      'kepercayaan': ['religi', 'agama', 'keyakinan', 'faith', 'spiritual'],
      
      // ==================== WISATA & PARIWISATA ====================
      'wisata': ['pariwisata', 'turisme', 'perjalanan', 'liburan', 'destinasi'],
      'pariwisata': ['wisata', 'turisme', 'perjalanan', 'liburan', 'destinasi'],
      'turisme': ['wisata', 'pariwisata', 'perjalanan', 'liburan', 'travel'],
      'perjalanan': ['wisata', 'pariwisata', 'travel', 'eksplorasi', 'petualangan'],
      
      // ==================== OLAHRAGA & REKREASI ====================
      'olahraga': ['sports', 'fitness', 'games', 'kompetisi', 'atletik'],
      'sports': ['olahraga', 'games', 'kompetisi', 'atletik', 'fitness'],
      'rekreasi': ['hiburan', 'wisata', 'leisure', 'refreshment', 'fun'],
      'hiburan': ['rekreasi', 'entertainment', 'fun', 'leisure', 'seni'],

      // ==================== DAERAH & LOKASI SPESIFIK INDONESIA ====================
      'sumatra': ['sumatera', 'pulau sumatra', 'region sumatra', 'bagian barat'],
      'jawa': ['pulau jawa', 'java', 'region jawa', 'bagian tengah'],
      'kalimantan': ['borneo', 'pulau kalimantan', 'region kalimantan'],
      'sulawesi': ['celebes', 'pulau sulawesi', 'region sulawesi'],
      'papua': ['irian', 'pulau papua', 'region papua', 'papua nugini'],
      'bali': ['pulau bali', 'region bali', 'pulau dewata'],
      'nusa tenggara': ['nusa tenggara barat', 'nusa tenggara timur', 'ntb', 'ntt'],
      'maluku': ['kepulauan maluku', 'molucas', 'region maluku'],
      
      // ==================== KOTA & WILAYAH SPESIFIK ====================
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
        
        // 1. Exact match
        if (bookThemeLower === playlistThemeLower) {
          bestMatchScore = Math.max(bestMatchScore, 100);
          console.log(`   ✅ Exact match: "${bookTheme}" = "${playlistTheme}"`);
          continue;
        }

        // 2. Semantic mapping match
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
          console.log(`   ✅ Semantic match: "${bookTheme}" ≈ "${playlistTheme}"`);
          continue;
        }

        // 3. Direct semantic relationship
        const hasDirectRelationship = 
          semanticThemeMapping[bookThemeLower]?.includes(playlistThemeLower) ||
          semanticThemeMapping[playlistThemeLower]?.includes(bookThemeLower);
        
        if (hasDirectRelationship) {
          bestMatchScore = Math.max(bestMatchScore, 70);
          console.log(`   ✅ Direct relationship: "${bookTheme}" → "${playlistTheme}"`);
          continue;
        }

        // 4. String similarity
        const similarity = this.calculateStringSimilarity(bookThemeLower, playlistThemeLower);
        if (similarity > 0.6) {
          bestMatchScore = Math.max(bestMatchScore, Math.round(similarity * 100));
          console.log(`   ✅ Similarity match: "${bookTheme}" ~ "${playlistTheme}" (${Math.round(similarity * 100)}%)`);
          continue;
        }
      }

      // 5. Enhanced contextual inference
      if (bestMatchScore === 0) {
        bestMatchScore = this.getContextualInferenceScore(bookThemeLower, playlistThemes);
        if (bestMatchScore > 0) {
          console.log(`   ✅ Contextual inference: "${bookTheme}" = ${bestMatchScore}%`);
        }
      }

      totalMatchScore += bestMatchScore;
    }

    const finalScore = Math.min(100, Math.round(totalMatchScore / bookThemes.length));
    console.log(`   🎯 Final Theme Score: ${finalScore}%`);
    return finalScore;
  },

  // 🆕 ENHANCED CONTEXTUAL INFERENCE
  getContextualInferenceScore(bookTheme, playlistThemes) {
    const contextualRules = [
      // Historical context
      { 
        patterns: ['hindia', 'belanda', 'indie', 'kolonial', 'penjajahan'], 
        targets: ['sejarah', 'indonesia', 'politik', 'militer'],
        score: 70 
      },
      // Art & Culture context
      { 
        patterns: ['gambar', 'visual', 'seni', 'foto', 'lukisan', 'karya'], 
        targets: ['budaya', 'seni', 'tradisi', 'kesenian'],
        score: 60 
      },
      // Medical context
      { 
        patterns: ['kesehatan', 'medis', 'penyakit', 'obat', 'dokter'], 
        targets: ['kesehatan', 'medis', 'pengobatan'],
        score: 80 
      },
      // Agricultural context
      { 
        patterns: ['pertanian', 'perkebunan', 'tanaman', 'pangan', 'buah'], 
        targets: ['pertanian', 'perkebunan', 'ekonomi', 'sosial'],
        score: 70 
      },
      // Transportation context
      { 
        patterns: ['transportasi', 'pelabuhan', 'kereta', 'angkutan'], 
        targets: ['transportasi', 'infrastruktur', 'ekonomi'],
        score: 65 
      },
      // Literature context
      { 
        patterns: ['sastra', 'puisi', 'prosa', 'cerita', 'bahasa'], 
        targets: ['sastra', 'budaya', 'seni', 'pendidikan'],
        score: 75 
      },
      // Regional context
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

  // 🆕 IMPROVE GEOGRAPHIC MATCHING
  calculateGeographicMatch(bookLocations = [], playlistLocations = []) {
    console.log('🗺️ GEOGRAPHIC MATCHING DEBUG:');
    console.log('   Book Locations:', bookLocations);
    console.log('   Playlist Locations:', playlistLocations);
    
    if (!bookLocations.length || !playlistLocations.length) {
      console.log('   ❌ No locations to compare');
      return 0;
    }

    // 🆕 NORMALIZE CASE untuk semua comparisons
    const normalizedBookLocs = bookLocations.map(loc => loc.toLowerCase().trim());
    const normalizedPlaylistLocs = playlistLocations.map(loc => loc.toLowerCase().trim());

    console.log('   Normalized Book:', normalizedBookLocs);
    console.log('   Normalized Playlist:', normalizedPlaylistLocs);

    // 🆕 IMPROVED GEOGRAPHIC HIERARCHY dengan normalized keys
    const geographicHierarchy = {
      'indonesia': ['nusantara', 'asia tenggara', 'sumatra', 'jawa', 'bali', 'kalimantan', 'sulawesi', 'papua', 'aceh', 'sumatra utara', 'sumatra barat', 'jawa tengah', 'jawa timur', 'jawa barat', 'mentawai'],
      'nusantara': ['indonesia', 'asia tenggara', 'sumatra', 'jawa', 'bali', 'kalimantan', 'sulawesi', 'papua', 'mentawai'],
      'sumatra': ['indonesia', 'nusantara', 'asia tenggara', 'sumatra utara', 'sumatra barat', 'aceh', 'medan', 'padang', 'mentawai'],
      'sumatera barat': ['sumatra', 'indonesia', 'nusantara', 'asia tenggara', 'mentawai', 'padang'],
      'sumatra barat': ['sumatra', 'indonesia', 'nusantara', 'asia tenggara', 'mentawai', 'padang'],
      'mentawai': ['sumatra barat', 'sumatra', 'indonesia', 'nusantara', 'asia tenggara']
    };

    // 🆕 IMPROVED MANUAL EQUIVALENTS
    const manualEquivalents = {
      'indonesia': ['nusantara', 'hindia belanda', 'archipelago'],
      'nusantara': ['indonesia', 'hindia belanda'],
      'jawa': ['java'],
      'sumatra': ['sumatera'],
      'sumatera barat': ['sumatra barat', 'west sumatra'],
      'sumatra barat': ['sumatera barat', 'west sumatra'],
      'mentawai': ['mentawai islands', 'kepulauan mentawai']
    };

    // 1. Exact match (sudah normalized)
    const exactMatches = normalizedBookLocs.filter(bookLoc =>
      normalizedPlaylistLocs.includes(bookLoc)
    );
    if (exactMatches.length > 0) {
      console.log(`   ✅ Exact geographic match: ${exactMatches.join(', ')}`);
      return 100;
    }

    // 2. Manual equivalents match - IMPROVED
    let equivalentScore = 0;
    for (const bookLoc of normalizedBookLocs) {
      for (const playlistLoc of normalizedPlaylistLocs) {
        const bookEquivalents = manualEquivalents[bookLoc] || [];
        const playlistEquivalents = manualEquivalents[playlistLoc] || [];
        
        // Check direct equivalents
        if (bookEquivalents.includes(playlistLoc) || 
            playlistEquivalents.includes(bookLoc)) {
          equivalentScore = Math.max(equivalentScore, 95);
          console.log(`   ✅ Equivalent match: ${bookLoc} = ${playlistLoc}`);
        }
        
        // Check jika salah satu adalah equivalent dari yang lain
        const hasEquivalent = bookEquivalents.some(eq => 
          normalizedPlaylistLocs.includes(eq)
        ) || playlistEquivalents.some(eq => 
          normalizedBookLocs.includes(eq)
        );
        
        if (hasEquivalent) {
          equivalentScore = Math.max(equivalentScore, 90);
          console.log(`   ✅ Indirect equivalent: ${bookLoc} ↔ ${playlistLoc}`);
        }
      }
    }
    if (equivalentScore > 0) return equivalentScore;

    // 3. IMPROVED Hierarchy match dengan string inclusion
    let bestScore = 0;
    for (const bookLoc of normalizedBookLocs) {
      for (const playlistLoc of normalizedPlaylistLocs) {
        
        // Direct hierarchy relationship
        if (geographicHierarchy[bookLoc]?.includes(playlistLoc)) {
          bestScore = Math.max(bestScore, 90);
          console.log(`   ✅ Hierarchy match: ${bookLoc} → ${playlistLoc}`);
        }
        if (geographicHierarchy[playlistLoc]?.includes(bookLoc)) {
          bestScore = Math.max(bestScore, 90);
          console.log(`   ✅ Hierarchy match: ${playlistLoc} → ${bookLoc}`);
        }
        
        // Shared parent
        const bookParents = geographicHierarchy[bookLoc] || [];
        const playlistParents = geographicHierarchy[playlistLoc] || [];
        const commonParents = bookParents.filter(parent => playlistParents.includes(parent));
        if (commonParents.length > 0) {
          bestScore = Math.max(bestScore, 70);
          console.log(`   ✅ Shared parent: ${commonParents.join(', ')}`);
        }
        
        // 🆕 STRING INCLUSION MATCH (untuk kasus "sumatera barat" vs "sumatra barat")
        if (bookLoc.includes(playlistLoc) || playlistLoc.includes(bookLoc)) {
          const inclusionScore = Math.max(
            bookLoc.includes(playlistLoc) ? 80 : 0,
            playlistLoc.includes(bookLoc) ? 80 : 0
          );
          if (inclusionScore > bestScore) {
            bestScore = inclusionScore;
            console.log(`   ✅ String inclusion: "${bookLoc}" ↔ "${playlistLoc}"`);
          }
        }
        
        // 🆕 MENTAWAI SPECIAL CASE
        if ((bookLoc === 'mentawai' && playlistLoc === 'sumatra barat') ||
            (bookLoc === 'sumatra barat' && playlistLoc === 'mentawai')) {
          bestScore = Math.max(bestScore, 85);
          console.log(`   ✅ Mentawai-Sumatra Barat special relationship`);
        }
      }
    }

    console.log(`   🎯 Final Geo Score: ${bestScore}%`);
    return bestScore;
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

  // 🆕 IMPROVE CONTENT TYPE MATCHING
  calculateContentTypeMatch(bookType = '', playlistType = '') {
    if (!bookType || !playlistType) return 0;
    
    console.log('📚 CONTENT TYPE MATCHING:');
    console.log('   Book Type:', bookType);
    console.log('   Playlist Type:', playlistType);
    
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
    
    const score = hasMatch ? 100 : 0;
    console.log(`   🎯 Content Type Score: ${score}%`);
    return score;
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
      
      // 🆕 REDUCE MAX TOKENS untuk hindari truncation
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.2,
        maxTokens: 500, // Reduced from 800
        timeout: 15000
      });
      
      if (!aiResponse) {
        throw new Error('Empty AI response');
      }
      
      console.log('✅ AI Response received, length:', aiResponse.length);
      
      // 🆕 CHECK FOR TRUNCATION
      if (aiResponse.length > 450) { // Jika response hampir max tokens
        console.log('⚠️ Response mungkin terpotong, checking completeness...');
        if (!aiResponse.includes(']') || this.hasUnclosedQuotes(aiResponse)) {
          console.log('🔧 Response terpotong, using smart extraction...');
          return this.smartExtractRecommendations(aiResponse, topPlaylists);
        }
      }
      
      return this.parseNoviceAIResponse(aiResponse, topPlaylists);
        
    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      return this.createFallbackRecommendations(topPlaylists);
    }
  },

  // 🆕 CHECK UNCLOSED QUOTES
  hasUnclosedQuotes(text) {
    const quoteCount = (text.match(/"/g) || []).length;
    return quoteCount % 2 !== 0;
  },

  // 🆕 UPDATE PROMPT FOR BETTER JSON GENERATION
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

  // 🆕 IMPROVED PARSING - HANDLES TRUNCATED RESPONSES BETTER
  parseNoviceAIResponse(aiResponse, topPlaylists) {
    try {
      console.log('🔍 Parsing AI response...');
      console.log('📨 Raw AI response length:', aiResponse.length);
      
      let cleanResponse = aiResponse
        .replace(/```json|```|`/g, '')
        .trim();

      console.log('🧹 Cleaned response length:', cleanResponse.length);
      console.log('📝 Cleaned response sample:', cleanResponse.substring(0, 200) + '...');

      // 🆕 ENHANCED FIX: Handle various truncation scenarios
      cleanResponse = this.fixAllJSONIssues(cleanResponse);
      
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('❌ No JSON array found, trying object extraction...');
        return this.smartExtractRecommendations(cleanResponse, topPlaylists);
      }

      let jsonText = jsonMatch[0];
      console.log('📄 JSON text found, length:', jsonText.length);
      
      jsonText = this.validateAndFixJSON(jsonText);
      
      console.log('✅ Final JSON ready for parsing, length:', jsonText.length);
      
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not an array');
      }

      console.log(`✅ Successfully parsed ${parsed.length} AI recommendations`);
      
      return this.formatAIRecommendations(parsed, topPlaylists);

    } catch (error) {
      console.error('❌ Novice AI parse failed:', error.message);
      console.log('📝 Failed response (first 500 chars):', aiResponse.substring(0, 500));
      return this.smartExtractRecommendations(aiResponse, topPlaylists);
    }
  },

  // 🆕 COMPREHENSIVE JSON FIXING
  fixAllJSONIssues(jsonString) {
    let fixed = jsonString.trim();
    
    console.log('🔄 Fixing JSON issues...');
    
    // Case 1: Response terpotong di tengah array
    if (fixed.includes('[') && !fixed.endsWith(']')) {
      console.log('🔧 Case 1: Truncated array detected');
      fixed = this.fixTruncatedArray(fixed);
    }
    
    // Case 2: Response terpotong di tengah object
    if (fixed.includes('{') && !fixed.includes('}]')) {
      console.log('🔧 Case 2: Truncated object detected');
      fixed = this.fixTruncatedObjects(fixed);
    }
    
    // Case 3: Unclosed strings
    fixed = this.fixUnclosedStrings(fixed);
    
    // Case 4: Trailing commas
    fixed = this.removeTrailingCommas(fixed);
    
    // Case 5: Ensure proper array closure
    if (fixed.includes('[') && !fixed.endsWith(']')) {
      fixed += ']';
    }
    
    console.log('✅ JSON fixes applied');
    return fixed;
  },

  // 🆕 FIX TRUNCATED ARRAY
  fixTruncatedArray(jsonString) {
    let fixed = jsonString;
    
    // Count brackets to ensure proper closure
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // If still doesn't end with ], find last complete object and close
    if (!fixed.endsWith(']')) {
      // Find the last complete JSON object
      const lastObjectMatch = fixed.match(/\{"playlistName":"[^"]*","finalScore":\d+,"reason":"[^"]*"\}/g);
      if (lastObjectMatch && lastObjectMatch.length > 0) {
        const lastCompleteObject = lastObjectMatch[lastObjectMatch.length - 1];
        const lastIndex = fixed.lastIndexOf(lastCompleteObject);
        if (lastIndex !== -1) {
          fixed = fixed.substring(0, lastIndex + lastCompleteObject.length) + ']';
        }
      } else {
        // Fallback: just close the array
        fixed += ']';
      }
    }
    
    return fixed;
  },

  // 🆕 FIX TRUNCATED OBJECTS
  fixTruncatedObjects(jsonString) {
    let fixed = jsonString;
    
    // Pattern untuk incomplete objects
    const incompleteObjectPattern = /\{"playlistName":"[^"]*","finalScore":\d+,"reason":"[^"]*$/;
    
    if (incompleteObjectPattern.test(fixed)) {
      // Find the last incomplete object and complete it
      const match = fixed.match(/\{"playlistName":"([^"]*)","finalScore":(\d+),"reason":"([^"]*)$/);
      if (match) {
        const [fullMatch, playlistName, finalScore, partialReason] = match;
        const completeObject = `{"playlistName":"${playlistName}","finalScore":${finalScore},"reason":"${partialReason}"}`;
        fixed = fixed.replace(fullMatch, completeObject);
      }
    }
    
    return fixed;
  },

  // 🆕 FIX UNCLOSED STRINGS
  fixUnclosedStrings(jsonString) {
    let fixed = jsonString;
    
    // Count quotes to detect unclosed strings
    const quoteCount = (fixed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      // Odd number of quotes means unclosed string
      console.log('🔧 Fixing unclosed string...');
      fixed += '"';
    }
    
    // Fix specific pattern: "reason": "partial text...
    const unclosedReasonPattern = /"reason":\s*"([^"]*)$/;
    if (unclosedReasonPattern.test(fixed)) {
      fixed = fixed.replace(unclosedReasonPattern, '"reason": "$1"');
    }
    
    return fixed;
  },

  // 🆕 REMOVE TRAILING COMMAS
  removeTrailingCommas(jsonString) {
    let fixed = jsonString;
    
    // Remove trailing commas before ] or }
    fixed = fixed.replace(/,\s*([\]}])/g, '$1');
    
    return fixed;
  },

  // 🆕 VALIDATE AND FIX JSON
  validateAndFixJSON(jsonString) {
    let fixed = jsonString;
    
    try {
      // Quick validation parse
      JSON.parse(fixed);
      console.log('✅ JSON is valid, no fixes needed');
      return fixed;
    } catch (error) {
      console.log('🔧 JSON validation failed, applying fixes...');
      
      // Apply comprehensive fixes
      fixed = this.fixCommonJSONErrors(fixed);
      
      // Try parsing again
      try {
        JSON.parse(fixed);
        console.log('✅ JSON fixed successfully');
        return fixed;
      } catch (secondError) {
        console.log('❌ JSON still invalid after fixes, using extraction method');
        throw new Error('JSON cannot be fixed: ' + secondError.message);
      }
    }
  },

  // 🆕 SMART EXTRACTION AS FALLBACK
  smartExtractRecommendations(text, topPlaylists) {
    console.log('🔍 Using smart extraction for recommendations...');
    const recommendations = [];
    
    for (let i = 0; i < topPlaylists.length; i++) {
      const playlist = topPlaylists[i].playlist;
      const playlistName = this.escapeRegex(playlist.name);
      
      console.log(`🔍 Extracting data for: ${playlistName}`);
      
      const extracted = this.extractPlaylistData(text, playlistName, playlist, i);
      recommendations.push(extracted);
    }
    
    console.log(`✅ Smart extraction completed: ${recommendations.length} recommendations`);
    return recommendations;
  },

  // 🆕 EXTRACT DATA FOR SPECIFIC PLAYLIST
  extractPlaylistData(text, playlistName, playlist, index) {
    // Multiple extraction patterns dengan prioritas
    const patterns = [
      // Pattern 1: Complete object match
      new RegExp(`\\{"playlistName":\\s*"${playlistName}"[^}]*"finalScore":\\s*(\\d+)[^}]*"reason":\\s*"([^"]*)"`, 'i'),
      
      // Pattern 2: Partial object match
      new RegExp(`"playlistName":\\s*"${playlistName}"[^}]*?"finalScore":\\s*(\\d+)`, 'i'),
      
      // Pattern 3: Simple score match
      new RegExp(`"${playlistName}"[^}]*?(\\d{1,3})`, 'i'),
      
      // Pattern 4: Generic score in context
      new RegExp(`${playlistName}.*?(\\d{1,3})(?=\\D|$)`, 'i')
    ];
    
    let score = 70 - (index * 10); // Default fallback score
    let reason = 'Analisis berdasarkan konten playlist';
    let extracted = false;
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        score = parseInt(match[1]);
        
        // Try to extract reason from different patterns
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
        console.log(`✅ Extracted: ${playlistName} = ${score}%`);
        break;
      }
    }
    
    if (!extracted) {
      console.log(`⚠️ Using fallback for: ${playlistName}`);
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

  // 🆕 FORMAT AI RECOMMENDATIONS
  formatAIRecommendations(parsedData, topPlaylists) {
    return parsedData.map((item, index) => {
      const playlist = topPlaylists[index]?.playlist;
      if (!playlist) {
        console.log(`❌ No playlist found for index ${index}`);
        return null;
      }

      // Validate and sanitize data
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

  // 🆕 VALIDATE SCORE
  validateScore(score) {
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      console.log(`⚠️ Invalid score: ${score}, using 50 as default`);
      return 50;
    }
    return numScore;
  },

  // 🆕 SANITIZE REASON
  sanitizeReason(reason) {
    if (typeof reason !== 'string') {
      return 'Analisis AI';
    }
    
    // Remove any problematic characters and truncate if too long
    return reason
      .replace(/[^\w\s.,!?\-()]/g, '')
      .substring(0, 200);
  },

  // 🆕 ESCAPE REGEX CHARACTERS
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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







