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

  // 🆕 METHOD: Simple playlist recommendations dengan rule-based first
  async getPlaylistRecommendations({ book, playlists = [] }) {
    try {
      console.log('🎯 Getting playlist recommendations for book:', book.judul);
      console.log('📊 Total playlists available:', playlists.length);

      // STEP 1: Filter playlists yang available (tidak mengandung buku ini)
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      if (availablePlaylists.length === 0) {
        console.log('⚠️ No available playlists for this book');
        return [];
      }

      // STEP 2: Pilih max 3 playlist dengan rule-based scoring
      const topPlaylists = this.selectTopPlaylists(book, availablePlaylists, 3);
      console.log('🎯 Top playlists selected:', topPlaylists.map(p => p.playlist.name));

      // STEP 3: Jika AI available, gunakan untuk analisis mendalam
      if (topPlaylists.length > 0 && this.isGeminiAvailable()) {
        console.log('🤖 Using AI for detailed analysis');
        try {
          const aiResults = await this.getSimpleAIRecommendations(book, topPlaylists);
          return aiResults;
        } catch (aiError) {
          console.error('❌ AI analysis failed, using rule-based:', aiError);
          return this.getRuleBasedResults(book, topPlaylists);
        }
      }

      // STEP 4: Fallback ke rule-based saja
      console.log('⚡ Using rule-based recommendations only');
      return this.getRuleBasedResults(book, topPlaylists);
      
    } catch (error) {
      console.error('❌ Playlist recommendations failed:', error.message);
      // Emergency fallback
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      ).slice(0, 3);
      
      return this.getEmergencyResults(book, availablePlaylists);
    }
  },

  // 🆕 METHOD: Simple rule-based playlist selection
  selectTopPlaylists(book, playlists, maxCount = 3) {
    const scoredPlaylists = playlists.map(playlist => {
      const score = this.calculateSimpleMatchScore(book, playlist);
      return { playlist, score };
    });

    // Sort by score descending dan ambil top N
    return scoredPlaylists
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount)
      .filter(item => item.score > 10); // Minimum threshold
  },

  // 🆕 METHOD: Simple match scoring
  calculateSimpleMatchScore(book, playlist) {
    let score = 0;
    
    const bookText = `${book.judul} ${book.pengarang} ${book.deskripsi_buku || ''} ${book.deskripsi_fisik || ''}`.toLowerCase();
    const playlistText = `${playlist.name} ${playlist.description || ''}`.toLowerCase();

    // 1. Keyword matching (60%)
    const bookWords = new Set(bookText.split(/\s+/).filter(word => word.length > 3));
    const playlistWords = new Set(playlistText.split(/\s+/).filter(word => word.length > 3));
    const intersection = [...bookWords].filter(word => playlistWords.has(word)).length;
    const union = bookWords.size + playlistWords.size - intersection;
    const keywordScore = union > 0 ? (intersection / union) * 100 : 0;
    score += keywordScore * 0.6;

    // 2. Theme matching (40%)
    const themes = this.getCommonThemes(bookText, playlistText);
    score += (themes.length * 20); // 20 points per matching theme

    return Math.min(100, Math.round(score));
  },

  // 🆕 METHOD: Get common themes
  getCommonThemes(bookText, playlistText) {
    const themes = [
      'sejarah', 'militer', 'medis', 'pendidikan', 'kolonial', 
      'indonesia', 'belanda', 'kesehatan', 'tentara', 'perang',
      'hukum', 'undang', 'disiplin', 'nasional', 'indonesia'
    ];
    
    return themes.filter(theme => 
      bookText.includes(theme) && playlistText.includes(theme)
    );
  },

  // 🆕 METHOD: Simple AI recommendations dengan prompt yang lebih pendek
  async getSimpleAIRecommendations(book, topPlaylists) {
    const prompt = this.createSimplePrompt(book, topPlaylists);
    console.log('📤 Sending simple AI prompt...');
    
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.3,
      maxTokens: 400 // Lebih pendek untuk hindari truncation
    });

    if (!aiResponse) {
      throw new Error('AI returned empty response');
    }

    console.log('✅ Simple AI Response received');
    return this.parseSimpleAIResponse(aiResponse, book, topPlaylists);
  },

  // 🆕 METHOD: Create simple prompt
  createSimplePrompt(book, topPlaylists) {
    const playlistsInfo = topPlaylists.map((item, index) => 
      `Playlist ${index + 1}: "${item.playlist.name}" - ${item.playlist.description || 'No description'}`
    ).join('\n');

    return `
Buku: "${book.judul}"
Pengarang: ${book.pengarang || 'Tidak diketahui'}
Tahun: ${book.tahun_terbit || 'Tidak diketahui'}

Playlists untuk dianalisis:
${playlistsInfo}

Beri score match (0-100) untuk setiap playlist. Format JSON:

[
  {"playlistName": "nama", "matchScore": 75, "reason": "alasan singkat"},
  {"playlistName": "nama", "matchScore": 50, "reason": "alasan singkat"}
]

Hanya JSON array.
`.trim();
  },

  // 🆕 METHOD: Parse simple AI response - ENHANCED MATCHING LOGIC
  parseSimpleAIResponse(aiResponse, book, topPlaylists) {
    try {
      console.log('🔄 Parsing simple AI response...');
      
      // Clean response aggressively
      let cleanResponse = aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^[]*/, '') // Remove everything before first [
        .replace(/[^\]]*$/, '') // Remove everything after last ]
        .trim();

      // Basic JSON validation and completion
      if (!cleanResponse.startsWith('[')) cleanResponse = '[' + cleanResponse;
      if (!cleanResponse.endsWith(']')) cleanResponse = cleanResponse + ']';
      
      console.log('🧹 Cleaned response:', cleanResponse);

      const parsed = JSON.parse(cleanResponse);

      if (Array.isArray(parsed)) {
        // 🆕 ENHANCED: Better playlist matching dengan multiple strategies
        const recommendations = parsed.map((rec, index) => {
          const playlist = this.findMatchingPlaylist(rec.playlistName, topPlaylists, index);
          
          if (!playlist) {
            console.warn(`⚠️ No matching playlist found for: ${rec.playlistName}`);
            console.log('Available playlists:', topPlaylists.map(p => p.playlist.name));
            return null;
          }

          return {
            playlistId: playlist.id,
            playlistName: playlist.name,
            matchScore: this.validateScore(rec.matchScore),
            confidence: 0.8,
            reasoning: rec.reason || rec.reasoning || `Kecocokan dengan "${playlist.name}"`,
            improvementSuggestions: [],
            isFallback: false,
            ruleBasedScore: topPlaylists.find(item => item.playlist.id === playlist.id)?.score || 50
          };
        }).filter(Boolean); // Remove null entries

        // Sort by matchScore descending
        return recommendations.sort((a, b) => b.matchScore - a.matchScore);
      }

      throw new Error('Response is not an array');
      
    } catch (error) {
      console.error('❌ Failed to parse simple AI response:', error);
      console.log('📝 Raw response:', aiResponse);
      throw error;
    }
  },

  // 🆕 METHOD: Enhanced playlist matching dengan multiple strategies
  findMatchingPlaylist(aiPlaylistName, topPlaylists, index) {
    // Strategy 1: Exact match
    let playlist = topPlaylists.find(item => 
      item.playlist.name === aiPlaylistName
    )?.playlist;

    // Strategy 2: Case insensitive match
    if (!playlist) {
      playlist = topPlaylists.find(item => 
        item.playlist.name.toLowerCase() === aiPlaylistName.toLowerCase()
      )?.playlist;
    }

    // Strategy 3: Remove emoji and compare
    if (!playlist) {
      const cleanAIPlaylistName = aiPlaylistName.replace(/[^\w\s]/g, '').trim();
      playlist = topPlaylists.find(item => {
        const cleanPlaylistName = item.playlist.name.replace(/[^\w\s]/g, '').trim();
        return cleanPlaylistName === cleanAIPlaylistName;
      })?.playlist;
    }

    // Strategy 4: Contains match (partial)
    if (!playlist) {
      const cleanAIPlaylistName = aiPlaylistName.replace(/[^\w\s]/g, '').trim().toLowerCase();
      playlist = topPlaylists.find(item => {
        const cleanPlaylistName = item.playlist.name.replace(/[^\w\s]/g, '').trim().toLowerCase();
        return cleanPlaylistName.includes(cleanAIPlaylistName) || 
               cleanAIPlaylistName.includes(cleanPlaylistName);
      })?.playlist;
    }

    // Strategy 5: Match by keywords
    if (!playlist) {
      const aiKeywords = aiPlaylistName.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      playlist = topPlaylists.find(item => {
        const playlistKeywords = item.playlist.name.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        return aiKeywords.some(keyword => playlistKeywords.includes(keyword));
      })?.playlist;
    }

    // Strategy 6: Fallback to index
    if (!playlist && topPlaylists[index]) {
      playlist = topPlaylists[index].playlist;
      console.warn(`⚠️ Using index fallback for playlist matching: ${aiPlaylistName} → ${playlist.name}`);
    }

    return playlist;
  },

  // 🆕 METHOD: Rule-based results
  getRuleBasedResults(book, topPlaylists) {
    return topPlaylists.map(item => {
      const { playlist, score } = item;
      return {
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: score,
        confidence: 0.5,
        reasoning: this.getRuleBasedReasoning(score),
        improvementSuggestions: ['Gunakan analisis AI untuk hasil lebih akurat'],
        isFallback: true,
        ruleBasedScore: score
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  },

  // 🆕 METHOD: Emergency results
  getEmergencyResults(book, playlists) {
    return playlists.map((playlist, index) => ({
      playlistId: playlist.id,
      playlistName: playlist.name,
      matchScore: 50 + (index * 10), // 50, 60, 70
      confidence: 0.3,
      reasoning: 'Sistem sedang dalam pemulihan',
      improvementSuggestions: ['Coba lagi nanti'],
      isFallback: true,
      emergency: true
    }));
  },

  // 🆕 METHOD: Get rule-based reasoning
  getRuleBasedReasoning(score) {
    if (score >= 70) return 'Kecocokan tinggi berdasarkan analisis tema';
    if (score >= 50) return 'Kecocokan sedang - beberapa tema sesuai';
    return 'Kecocokan rendah - pertimbangkan review manual';
  },

  // 🆕 METHOD: Gemini availability check
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

  // EXISTING METHODS - PASTIKAN SEMUA ADA
  createAnalysisPrompt(book, playlist) {
    const bookDescription = book.deskripsi_buku || book.deskripsi_fisik || 'Tidak ada deskripsi';
    const descriptionSource = book.deskripsi_source === 'ai-enhanced' ? '[Deskripsi AI]' : '[Deskripsi Basic]';

    return `
ANALISIS KECOCOKAN BUKU-PLAYLIST:

BUKU: "${book.judul}"
- Pengarang: ${book.pengarang || 'Tidak diketahui'}
- Tahun: ${book.tahun_terbit || 'Tidak diketahui'}
- ${descriptionSource}: ${bookDescription}

PLAYLIST: "${playlist.name}"
- Deskripsi: ${playlist.description || 'Tidak ada'}

INSTRUKSI: Berikan analisis JSON dengan:
1. matchScore (0-100) - berdasarkan kecocokan konten
2. confidence (0-1) - keyakinan analisis  
3. reasoning (1-2 kalimat) - penjelasan kecocokan
4. thematicAnalysis (singkat) - analisis tematik
5. improvementSuggestions (opsional) - saran perbaikan

FORMAT: JSON saja.
`.trim();
  },

  parseAIResponse(aiResponse, book, playlist) {
    try {
      console.log('🔄 Parsing AI response...');
      
      const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
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

  validateScore(score) {
    const num = parseInt(score) || 50;
    return Math.min(100, Math.max(0, num));
  },

  validateConfidence(confidence) {
    const num = parseFloat(confidence) || 0.5;
    return Math.min(1, Math.max(0, num));
  },

  getFallbackAnalysis(book, playlist) {
    const keywordScore = this.calculateKeywordMatch(book, playlist);
    return {
      matchScore: keywordScore,
      confidence: 0.3,
      reasoning: `Analisis fallback: Kecocokan ${keywordScore}% berdasarkan kata kunci`,
      thematicAnalysis: 'Analisis AI tidak tersedia - menggunakan fallback',
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