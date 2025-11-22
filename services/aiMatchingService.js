// services/aiMatchingService.js - FIXED VERSION
import { generateAIResponse } from '../lib/gemini';

export const aiMatchingService = {
  async analyzeBookPlaylistMatch(book, playlist) {
    console.log('🤖 DIRECT AI ANALYSIS STARTED');
    
    try {
      // 1. Siapkan SEMUA data untuk AI
      const analysisData = {
        book: {
          judul: book.judul,
          pengarang: book.pengarang,
          tahun_terbit: book.tahun_terbit,
          deskripsi_buku: book.deskripsi_buku,
          kategori: book.kategori,
          metadata_structured: book.metadata_structured
        },
        playlist: {
          name: playlist.name,
          description: playlist.description,
          books_count: playlist.books?.length || 0,
          ai_metadata: playlist.ai_metadata
        }
      };

      console.log('📦 Data prepared for AI analysis:', {
        bookTitle: analysisData.book.judul,
        hasAIDescription: !!analysisData.book.deskripsi_buku,
        hasBookMetadata: !!analysisData.book.metadata_structured,
        hasPlaylistMetadata: !!analysisData.playlist.ai_metadata
      });

      // 2. Langsung kirim ke AI untuk analysis komprehensif
      const prompt = this.createDirectAnalysisPrompt(analysisData);
      console.log('📤 Sending comprehensive prompt to AI...');
      
      const aiResponse = await generateAIResponse(prompt, {
        temperature: 0.2,
        maxTokens: 150  // ⬅️ DIKURANGI untuk hindari memory error
      });
      
      if (!aiResponse) {
        throw new Error('AI returned empty response');
      }

      console.log('✅ AI Response received, length:', aiResponse.length);
      
      // 3. Parse hasil AI
      return this.parseAIResponse(aiResponse, book, playlist);
      
    } catch (error) {
      console.error('❌ Direct AI analysis failed:', error);
      // Fallback hanya jika AI benar-benar gagal
      return this.getEmergencyFallback(book, playlist);
    }
  },

  createDirectAnalysisPrompt(analysisData) {
    return `
BUKU: "${analysisData.book.judul}"
PLAYLIST: "${analysisData.playlist.name}"

ANALISIS: Berikan score 0-100 dan alasan singkat.

HASIL (JSON):
{
  "matchScore": 85,
  "confidence": 0.9,
  "reasoning": "Alasan singkat 5-10 kata",
  "keyFactors": ["faktor1", "faktor2"]
}

Hanya JSON.
`.trim();
  }, // ⬅️ INI YANG MISSING: KOMA SETELAH FUNCTION

  parseAIResponse(aiResponse, book, playlist) {
    try {
      console.log('🔄 Parsing AI response...');

      // Extract JSON saja, jangan process panjang
      const jsonMatch = aiResponse.match(/\{[^}]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const cleanResponse = jsonMatch[0];
      console.log('🧹 Cleaned JSON:', cleanResponse);

      const parsed = JSON.parse(cleanResponse);

      return {
        matchScore: parseInt(parsed.matchScore) || 50,
        confidence: parseFloat(parsed.confidence) || 0.5,
        reasoning: parsed.reasoning || 'Kecocokan berdasarkan analisis',
        keyFactors: parsed.keyFactors || [],
        playlistId: playlist.id,
        bookId: book.id,
        isFallback: false
      };
    } catch (error) {
      console.error('❌ Parse failed, using fallback');
      return this.getEmergencyFallback(book, playlist);
    }
  }, // ⬅️ KOMA SETELAH FUNCTION

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
  }, // ⬅️ KOMA SETELAH FUNCTION

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
  } // ⬅️ TIDAK PERLU KOMA UNTUK FUNCTION TERAKHIR
};

export default aiMatchingService;