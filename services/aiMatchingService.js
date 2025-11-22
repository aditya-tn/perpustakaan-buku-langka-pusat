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

  // ===========================================================================
  // 🆕 MAIN RECOMMENDATIONS FLOW - UPDATED
  // ===========================================================================
  async getPlaylistRecommendations({ book, playlists = [] }) {
    try {
      console.log('🎯 START: Playlist recommendations flow');
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

      // STEP 2: Pure Metadata Matching
      console.log('🔍 Starting pure metadata matching...');
      const topPlaylists = await this.selectTopPlaylistsByPureMetadata(book, availablePlaylists, 3);
      console.log('✅ Top 3 selected:', topPlaylists.map(p => ({ 
        name: p.playlist.name, 
        score: p.score 
      })));

      // STEP 3: Check Gemini Availability
      const geminiAvailable = this.isGeminiAvailable();
      console.log('🤖 Gemini available:', geminiAvailable);

      if (topPlaylists.length > 0 && geminiAvailable) {
        console.log('🚀 Attempting AI final analysis...');
        try {
          const aiResults = await this.getAIFinalAnalysis(book, topPlaylists);
          console.log('✅ AI analysis successful:', aiResults);
          return aiResults;
        } catch (aiError) {
          console.error('❌ AI analysis failed:', aiError);
          console.log('🔄 Falling back to metadata-based results');
        }
      } else {
        console.log('⚠️ Gemini not available, using metadata-based');
      }

      // STEP 4: Fallback
      const metadataResults = this.getMetadataBasedResults(book, topPlaylists);
      console.log('📊 Metadata results:', metadataResults);
      return metadataResults;

    } catch (error) {
      console.error('💥 Recommendation flow failed:', error);
      return this.getEmergencyResults(book, playlists);
    }
  },

  // ===========================================================================
  // 🆕 UPDATED METADATA MATCHING METHODS
  // ===========================================================================
  async selectTopPlaylistsByPureMetadata(book, playlists, maxCount = 3) {
    console.log('🔍 Selecting top playlists by PURE METADATA...');
    
    const scoredPlaylists = [];

    for (const playlist of playlists) {
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

calculatePureMetadataMatch(book, playlist) {
  const bookTitle = book.judul.toLowerCase();
  const bookDesc = book.deskripsi_buku?.toLowerCase() || '';
  const playlistName = playlist.name.toLowerCase();
  const playlistDesc = playlist.description?.toLowerCase() || '';
  
  console.log(`\n🔍 ========== MATCHING DETAIL ==========`);
  console.log(`📚 BOOK: "${book.judul}"`);
  console.log(`📝 DESC: "${bookDesc.substring(0, 100)}..."`);
  console.log(`🎯 PLAYLIST: "${playlist.name}"`);
  console.log(`📋 PLAYLIST DESC: "${playlistDesc}"`);
  
  let score = 0;

  // 1. 🎯 SMART TITLE MATCHING (40%)
  const titleScore = this.calculateSmartTitleMatch(bookTitle, playlistName);
  score += titleScore * 0.4;
  console.log(`📖 Title Score: ${titleScore} → Total: ${score}`);

  // 2. 🎯 CONTENT THEME MATCHING (35%)
  const themeScore = this.calculateContentThemeMatch(bookTitle, bookDesc, playlistName, playlistDesc);
  score += themeScore * 0.35;
  console.log(`🎭 Theme Score: ${themeScore} → Total: ${score}`);

  // 3. 🎯 METADATA ENHANCED MATCHING (25%)
  const metadataScore = this.calculateMetadataEnhancedMatch(book, playlist);
  score += metadataScore * 0.25;
  console.log(`🤖 Metadata Score: ${metadataScore} → Total: ${score}`);

  const finalScore = Math.min(100, Math.round(score));
  console.log(`✅ FINAL SCORE: ${finalScore} for "${playlist.name}"`);
  console.log(`🔚 ========== END MATCHING ==========\n`);
  
  return finalScore;
},

calculateSmartTitleMatch(bookTitle, playlistName) {
  console.log(`\n📖 ANALYZING TITLE MATCH:`);
  console.log(`   Book: "${bookTitle}"`);
  console.log(`   Playlist: "${playlistName}"`);
  
  const bookWords = bookTitle.split(/\s+/).filter(word => word.length > 3);
  const playlistWords = playlistName.split(/\s+/).filter(word => word.length > 3);
  
  console.log(`   Book words: [${bookWords.join(', ')}]`);
  console.log(`   Playlist words: [${playlistWords.join(', ')}]`);
  
  if (bookWords.length === 0 || playlistWords.length === 0) {
    console.log(`   ⚠️  No meaningful words, return 30`);
    return 30;
  }

  let score = 0;
  let strongMatches = 0;

  const strongKeywords = ['sejarah', 'indonesia', 'militer', 'perang', 'kolonial', 'budaya', 'ekonomi', 'politik'];
  
  for (const bookWord of bookWords) {
    for (const playlistWord of playlistWords) {
      // Exact match untuk kata kunci penting
      if (strongKeywords.includes(bookWord) && bookWord === playlistWord) {
        score += 25;
        strongMatches++;
        console.log(`   💪 STRONG MATCH: "${bookWord}" = "${playlistWord}" → +25`);
      }
      // Partial match untuk kata umum
      else if (playlistWord.includes(bookWord) || bookWord.includes(playlistWord)) {
        score += 10;
        console.log(`   🔗 PARTIAL MATCH: "${bookWord}" ↔ "${playlistWord}" → +10`);
      }
    }
  }

  if (strongMatches >= 2) {
    score += 20;
    console.log(`   🏆 MULTIPLE STRONG MATCHES: ${strongMatches} → +20`);
  }

  console.log(`   📊 FINAL TITLE SCORE: ${Math.min(80, score)}`);
  return Math.min(80, score);
},

calculateContentThemeMatch(bookTitle, bookDesc, playlistName, playlistDesc) {
  console.log(`\n🎭 ANALYZING CONTENT THEME MATCH:`);
  
  const bookText = `${bookTitle} ${bookDesc}`;
  const playlistText = `${playlistName} ${playlistDesc}`;
  
  console.log(`   Book text: "${bookText.substring(0, 100)}..."`);
  console.log(`   Playlist text: "${playlistText}"`);
  
  let score = 0;

  const themeCategories = {
    'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'kolonial', 'penjajahan', 'kemerdekaan'],
    'indonesia': ['indonesia', 'nusantara', 'nasional', 'hindia belanda', 'belanda'],
    'militer': ['militer', 'tentara', 'perang', 'pertempuran', 'military'],
    'politik': ['politik', 'pemerintah', 'negara', 'kekuasaan', 'dekolonisasi'],
    'sosial': ['sosial', 'masyarakat', 'budaya', 'ekonomi', 'faktor']
  };

  let themeOverlap = 0;
  let totalThemes = 0;

  for (const [theme, keywords] of Object.entries(themeCategories)) {
    const bookHasTheme = keywords.some(keyword => bookText.includes(keyword));
    const playlistHasTheme = keywords.some(keyword => playlistText.includes(keyword));
    
    if (bookHasTheme) totalThemes++;
    if (bookHasTheme && playlistHasTheme) {
      themeOverlap++;
      score += 15;
      console.log(`   ✅ THEME MATCH: "${theme}" → +15`);
      console.log(`      Book keywords: ${keywords.filter(k => bookText.includes(k)).join(', ')}`);
      console.log(`      Playlist keywords: ${keywords.filter(k => playlistText.includes(k)).join(', ')}`);
    } else if (bookHasTheme) {
      console.log(`   ❌ THEME MISMATCH: "${theme}" - Book has but playlist doesn't`);
    }
  }

  if (totalThemes > 0) {
    const overlapRatio = themeOverlap / totalThemes;
    console.log(`   📊 THEME OVERLAP: ${themeOverlap}/${totalThemes} = ${Math.round(overlapRatio * 100)}%`);
    
    if (overlapRatio >= 0.5) {
      score += 25;
      console.log(`   🎯 HIGH OVERLAP BONUS: +25`);
    }
  }

  console.log(`   📊 FINAL THEME SCORE: ${Math.min(100, score)}`);
  return Math.min(100, score);
},

calculateMetadataEnhancedMatch(book, playlist) {
  console.log(`\n🤖 ANALYZING AI METADATA MATCH:`);
  
  let score = 0;

  if (playlist.ai_metadata) {
    const metadata = playlist.ai_metadata;
    console.log(`   📋 Playlist AI Metadata:`, metadata);
    
    if (metadata.key_themes && metadata.key_themes.length > 0) {
      const bookThemes = this.extractBookThemes(book);
      console.log(`   🏷️ Book themes: [${bookThemes.join(', ')}]`);
      console.log(`   🏷️ Playlist AI themes: [${metadata.key_themes.join(', ')}]`);
      
      const themeMatches = bookThemes.filter(theme => 
        metadata.key_themes.includes(theme)
      ).length;
      
      console.log(`   🔗 Theme matches: ${themeMatches}`);
      
      if (themeMatches > 0) {
        score += themeMatches * 10;
        console.log(`   ✅ AI THEME MATCHES: ${themeMatches} → +${themeMatches * 10}`);
      }
    }

    if (metadata.historical_names && metadata.historical_names.length > 0) {
      const bookText = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
      const hasHistoricalMatch = metadata.historical_names.some(name => 
        bookText.includes(name.toLowerCase())
      );
      
      if (hasHistoricalMatch) {
        score += 20;
        console.log(`   🏛️ AI HISTORICAL MATCH → +20`);
      }
    }
  } else {
    console.log(`   ⚠️  No AI metadata available`);
  }

  console.log(`   📊 FINAL METADATA SCORE: ${Math.min(50, score)}`);
  return Math.min(50, score);
},
  
  // 🆕 METHOD: Extract book themes dari judul + deskripsi
  extractBookThemes(book) {
    const text = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    const themes = [];

    const themeKeywords = {
      'sejarah': ['sejarah', 'historis', 'masa lalu', 'zaman', 'runtuhnya'],
      'indonesia': ['indonesia', 'nusantara', 'nasional', 'hindia belanda'],
      'kolonial': ['kolonial', 'belanda', 'dutch', 'penjajahan'],
      'militer': ['militer', 'perang', 'tentara', 'pertempuran'],
      'politik': ['politik', 'pemerintah', 'negara', 'kekuasaan'],
      'sosial': ['sosial', 'masyarakat', 'budaya', 'ekonomi'],
      'dekolonisasi': ['dekolonisasi', 'disintegrasi', 'keruntuhan']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['umum'];
  },

  // ===========================================================================
  // 🆕 AI FINAL ANALYSIS METHODS
  // ===========================================================================
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

parseFinalAIResponse(aiResponse, topPlaylists) {
  try {
    console.log('🔄 Parsing AI final response...');
    
    if (!aiResponse || aiResponse.length < 10) {
      throw new Error('AI response too short');
    }

    let cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
    
    // Cari JSON array
    const jsonMatch = cleanResponse.match(/\[\s*{[\s\S]*?}\s*\]/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }

    console.log('🧹 Cleaned response:', cleanResponse.substring(0, 200) + '...');

    const parsed = JSON.parse(cleanResponse);

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array');
    }

    return parsed.map((item, index) => {
      const playlist = topPlaylists[index]?.playlist || topPlaylists[0]?.playlist;
      
      if (!playlist) {
        console.warn('⚠️ No playlist found for index:', index);
        return null;
      }

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
    console.error('❌ Failed to parse AI final analysis:', error.message);
    console.log('📝 Raw AI response:', aiResponse?.substring(0, 300));
    
    // Return metadata fallback instead of throwing
    return this.getMetadataBasedResults(
      { judul: 'Unknown' }, // dummy book
      topPlaylists
    );
  }
},
  
  // ===========================================================================
  // FALLBACK AND UTILITY METHODS
  // ===========================================================================
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

  getMetadataBasedReasoning(score) {
    if (score >= 80) return 'Kecocokan sangat tinggi berdasarkan analisis metadata';
    if (score >= 60) return 'Kecocokan tinggi - tema dan konten sesuai';
    if (score >= 40) return 'Kecocokan sedang - beberapa elemen sesuai';
    return 'Kecocokan rendah - pertimbangkan review manual';
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
  },

  // ===========================================================================
  // EXISTING METHODS - TETAP SAMA
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
  }

};

export default aiMatchingService;


