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
      console.log('📊 Total playlists available:', playlists.length);

      // STEP 1: Filter playlists yang available
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      if (availablePlaylists.length === 0) {
        console.log('⚠️ No available playlists for this book');
        return [];
      }

      console.log('🔍 Available playlists after filtering:', availablePlaylists.length);

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
        return [];
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

    return (matches / Math.max(bookWords.length, 1)) * 100;
  },

  // 🆕 METHOD: Theme matching from AI metadata
  calculateThemeMatchFromAIMetadata(book, playlist) {
    const bookThemes = this.extractBookThemes(book);
    
    // Gunakan AI metadata jika ada, otherwise extract dari nama playlist
    const playlistThemes = playlist.ai_metadata?.key_themes || 
                          this.extractThemesFromPlaylistName(playlist.name);
    
    if (bookThemes.length === 0 || playlistThemes.length === 0) return 40;

    let matches = 0;
    for (const bookTheme of bookThemes) {
      if (playlistThemes.some(playlistTheme => 
        this.areThemesRelated(bookTheme, playlistTheme)
      )) {
        matches++;
      }
    }
    
    return (matches / Math.max(bookThemes.length, 1)) * 100;
  },

  // 🆕 METHOD: Content keyword matching
  calculateContentKeywordMatch(bookText, playlistText) {
    const bookKeywords = this.extractKeywords(bookText);
    const playlistKeywords = this.extractKeywords(playlistText);
    
    if (bookKeywords.length === 0 || playlistKeywords.length === 0) return 25;

    const matches = bookKeywords.filter(keyword => 
      playlistKeywords.includes(keyword)
    ).length;

    return (matches / Math.max(bookKeywords.length, 1)) * 100;
  },

  // 🆕 METHOD: Extract themes dari playlist name (fallback)
  extractThemesFromPlaylistName(playlistName) {
    const name = playlistName.toLowerCase();
    const themes = [];

    if (name.includes('sejarah') && name.includes('indonesia')) return ['sejarah', 'indonesia'];
    if (name.includes('sejarah') && name.includes('militer')) return ['sejarah', 'militer'];
    if (name.includes('kereta')) return ['transportasi'];
    if (name.includes('sejarah')) return ['sejarah'];
    if (name.includes('indonesia')) return ['indonesia'];
    
    return ['umum'];
  },

  // 🆕 METHOD: Extract keywords dari text
  extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      word.length > 4 && 
      !['yang', 'dengan', 'dari', 'pada', 'untuk', 'dalam'].includes(word)
    );
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
1. Analisis kecocokan buku dengan SETIAP playlist
2. Berikan score 0-100 untuk setiap playlist
3. Berikan alasan singkat untuk setiap score
4. Prioritaskan kecocokan tema, konten, dan relevansi

FORMAT OUTPUT (JSON):
[
  {
    "playlistName": "nama playlist 1",
    "matchScore": 85,
    "reason": "alasan kecocokan...",
    "thematicAnalysis": "analisis tematik..."
  },
  {
    "playlistName": "nama playlist 2", 
    "matchScore": 60,
    "reason": "alasan kecocokan...",
    "thematicAnalysis": "analisis tematik..."
  }
]

Hanya kembalikan JSON array.
    `.trim();
  },

  // 🆕 METHOD: Parse final AI response
  parseFinalAIResponse(aiResponse, topPlaylists) {
    try {
      const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      return parsed.map((item, index) => {
        const playlist = topPlaylists[index]?.playlist || topPlaylists[0]?.playlist;
        
        return {
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: this.validateScore(item.matchScore),
          confidence: 0.9,
          reasoning: item.reason || 'Kecocokan berdasarkan analisis AI',
          thematicAnalysis: item.thematicAnalysis || 'Analisis tematik oleh AI',
          improvementSuggestions: [],
          isFallback: false,
          aiAnalyzed: true
        };
      }).filter(Boolean);

    } catch (error) {
      console.error('❌ Failed to parse AI final analysis:', error);
      throw new Error('AI analysis parsing failed');
    }
  },

  // 🆕 METHOD: Metadata-based results (fallback)
  getMetadataBasedResults(book, topPlaylists) {
    return topPlaylists.map(item => ({
      playlistId: item.playlist.id,
      playlistName: item.playlist.name,
      matchScore: item.score,
      confidence: 0.7,
      reasoning: this.getMetadataBasedReasoning(item.score),
      improvementSuggestions: ['Gunakan analisis AI untuk hasil lebih akurat'],
      isFallback: true,
      metadataScore: item.score
    }));
  },

  // 🆕 METHOD: Metadata based reasoning
  getMetadataBasedReasoning(score) {
    if (score >= 80) return 'Kecocokan sangat tinggi berdasarkan analisis metadata';
    if (score >= 60) return 'Kecocokan tinggi - tema dan konten sesuai';
    if (score >= 40) return 'Kecocokan sedang - beberapa elemen sesuai';
    return 'Kecocokan rendah - pertimbangkan review manual';
  },

  // ===========================================================================
  // EXISTING METHODS - Tetap dipertahankan
  // ===========================================================================

  // Extract book themes
  extractBookThemes(book) {
    const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const themes = [];

    const themeKeywords = {
      'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'historical', 'runtuhnya'],
      'militer': ['militer', 'tni', 'tentara', 'perang', 'pertempuran', 'military'],
      'politik': ['politik', 'pemerintah', 'negara', 'policy'],
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

  // Check theme relation
  areThemesRelated(theme1, theme2) {
    const relatedGroups = {
      'sejarah': ['sejarah', 'kolonial', 'militer', 'politik'],
      'militer': ['militer', 'sejarah', 'perang'],
      'kolonial': ['kolonial', 'sejarah', 'belanda'],
      'indonesia': ['indonesia', 'sejarah', 'nasional'],
      'transportasi': ['transportasi', 'geografi'],
      'geografi': ['geografi', 'transportasi']
    };

    const group1 = relatedGroups[theme1] || [theme1];
    const group2 = relatedGroups[theme2] || [theme2];
    
    return group1.some(t1 => group2.includes(t1));
  },

  // Emergency results
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

  // Existing analysis prompt (untuk single playlist analysis)
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

  // Parse AI response untuk single analysis
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

  // Helper methods
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
  }

};

export default aiMatchingService;
