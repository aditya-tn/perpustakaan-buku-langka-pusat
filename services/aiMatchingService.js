// services/aiMatchingService.js - UPDATED METADATA-BASED MATCHING
import { generateAIResponse } from '../lib/gemini';

export const aiMatchingService = {

  // MAIN RECOMMENDATIONS FLOW - METADATA BASED
  async getPlaylistRecommendations({ book, playlists = [] }) {
    try {
      console.log('🎯 START: METADATA-BASED Playlist recommendations');
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

      // STEP 2: METADATA-BASED MATCHING
      console.log('🔍 Starting METADATA-BASED matching...');
      const scoredPlaylists = [];

      for (const playlist of availablePlaylists) {
        try {
          const score = this.calculateMetadataBasedMatch(book, playlist);
          scoredPlaylists.push({ playlist, score });
          console.log(`📊 "${playlist.name}": Score=${score}`);
        } catch (error) {
          console.error(`❌ Error scoring playlist "${playlist.name}":`, error);
          scoredPlaylists.push({ playlist, score: 0 });
        }
      }

      // STEP 3: Get top 3 playlists
      const sorted = scoredPlaylists.sort((a, b) => b.score - a.score);
      const topPlaylists = sorted.slice(0, 3);

      console.log('🏆 TOP PLAYLISTS FINAL RANKING:');
      topPlaylists.forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.playlist.name}": ${item.score}`);
      });

      // STEP 4: Convert to recommendations format
      const recommendations = topPlaylists.map(item => ({
        playlistId: item.playlist.id,
        playlistName: item.playlist.name,
        matchScore: item.score,
        confidence: this.calculateConfidence(item.score),
        reasoning: this.generateMatchReasoning(book, item.playlist, item.score),
        improvementSuggestions: this.getImprovementSuggestions(item.score),
        isFallback: false,
        metadataBased: true
      }));

      console.log('✅ METADATA recommendations generated:', recommendations.length);
      return recommendations;

    } catch (error) {
      console.error('💥 METADATA recommendation flow failed:', error);
      return this.getEmergencyFallback(book, playlists);
    }
  },

  // 🎯 CORE METADATA MATCHING ALGORITHM
  calculateMetadataBasedMatch(book, playlist) {
    console.log(`🎯 METADATA Matching: ${book.judul} ↔ ${playlist.name}`);
    
    const bookMeta = book.metadata_structured || this.extractBasicMetadata(book);
    const playlistMeta = playlist.ai_metadata || {};
    
    let score = 0;

    // 1. KEY THEMES MATCH (40 points)
    const themeScore = this.calculateThemesMatch(bookMeta.key_themes, playlistMeta.key_themes);
    score += themeScore;

    // 2. GEOGRAPHIC MATCH (30 points)
    const geoScore = this.calculateGeographicMatch(bookMeta.geographic_focus, playlistMeta.geographic_focus);
    score += geoScore;

    // 3. HISTORICAL MATCH (20 points)
    const historicalScore = this.calculateHistoricalMatch(bookMeta.historical_period, playlistMeta.historical_context);
    score += historicalScore;

    // 4. CONTENT TYPE MATCH (10 points)
    const contentScore = this.calculateContentTypeMatch(bookMeta.content_type, playlistMeta.content_characteristics);
    score += contentScore;

    console.log(`📊 Final Metadata Score: ${score}/100`);
    return Math.min(100, score);
  },

  // 🎨 THEME MATCHING
  calculateThemesMatch(bookThemes = [], playlistThemes = []) {
    if (!playlistThemes || !Array.isArray(playlistThemes)) return 0;
    
    const overlap = bookThemes.filter(theme => playlistThemes.includes(theme));
    const score = overlap.length * 10; // Max 40 points (4 themes match)
    console.log(`🎨 Theme Overlap: [${overlap.join(', ')}] → +${score}`);
    return Math.min(40, score);
  },

  // 🗺️ GEOGRAPHIC MATCHING
  calculateGeographicMatch(bookRegions = [], playlistRegions = []) {
    if (!playlistRegions || !Array.isArray(playlistRegions)) return 0;
    
    const overlap = bookRegions.filter(region => playlistRegions.includes(region));
    const score = overlap.length * 10; // Max 30 points (3 regions match)
    console.log(`🗺️ Geographic Overlap: [${overlap.join(', ')}] → +${score}`);
    return Math.min(30, score);
  },

  // 🏛️ HISTORICAL MATCHING
  calculateHistoricalMatch(bookPeriods = [], playlistContext = '') {
    if (!playlistContext) return 0;
    
    const contextLower = playlistContext.toLowerCase();
    const matches = bookPeriods.filter(period => contextLower.includes(period));
    const score = matches.length * 10; // Max 20 points (2 periods match)
    console.log(`🏛️ Historical Match: [${matches.join(', ')}] → +${score}`);
    return Math.min(20, score);
  },

  // 📚 CONTENT TYPE MATCHING
  calculateContentTypeMatch(bookContentType, playlistCharacteristics = []) {
    if (!bookContentType || !playlistCharacteristics || !Array.isArray(playlistCharacteristics)) return 0;
    
    const isMatch = playlistCharacteristics.includes(bookContentType);
    const score = isMatch ? 10 : 0;
    console.log(`📚 Content Type Match: ${bookContentType} ↔ ${playlistCharacteristics} → +${score}`);
    return score;
  },

  // 🎯 CONFIDENCE CALCULATION
  calculateConfidence(score) {
    if (score >= 80) return 0.9;
    if (score >= 60) return 0.7;
    if (score >= 40) return 0.5;
    return 0.3;
  },

  // 📝 MATCH REASONING GENERATION
  generateMatchReasoning(book, playlist, score) {
    const bookMeta = book.metadata_structured || {};
    const playlistMeta = playlist.ai_metadata || {};
    
    const themesOverlap = bookMeta.key_themes?.filter(theme => 
      playlistMeta.key_themes?.includes(theme)
    ) || [];
    
    const regionsOverlap = bookMeta.geographic_focus?.filter(region => 
      playlistMeta.geographic_focus?.includes(region)
    ) || [];

    if (score >= 80) {
      return `Kecocokan sangat tinggi: tema ${themesOverlap.join(', ')} dan wilayah ${regionsOverlap.join(', ')} sangat sesuai`;
    } else if (score >= 60) {
      return `Kecocokan tinggi: ${themesOverlap.length} tema dan ${regionsOverlap.length} wilayah sesuai`;
    } else if (score >= 40) {
      return `Kecocokan sedang: beberapa elemen tema dan wilayah sesuai`;
    } else {
      return `Kecocokan rendah: pertimbangkan review manual`;
    }
  },

  // 💡 IMPROVEMENT SUGGESTIONS
  getImprovementSuggestions(score) {
    if (score >= 80) return ['Pilihan yang excellent!'];
    if (score >= 60) return ['Pertimbangkan review konten lebih detail'];
    return ['Coba playlist dengan tema yang lebih spesifik'];
  },

  // 🔄 BASIC METADATA EXTRACTION FALLBACK
  extractBasicMetadata(book) {
    const text = `${book.judul} ${book.deskripsi_buku || ''}`.toLowerCase();
    
    // Theme detection
    const themes = [];
    if (text.includes('sejarah') || text.includes('geschiedenis')) themes.push('sejarah');
    if (text.includes('pendidikan') || text.includes('onderwijs')) themes.push('pendidikan');
    if (text.includes('sosial') || text.includes('maatschappij')) themes.push('sosial');
    
    // Geographic detection
    const regions = [];
    if (text.includes('padang') || text.includes('minangkabau')) regions.push('sumatra barat');
    if (text.includes('aceh') || text.includes('atjeh')) regions.push('aceh');
    if (text.includes('jawa')) regions.push('jawa');
    
    return {
      key_themes: themes.length > 0 ? themes : ['umum'],
      geographic_focus: regions.length > 0 ? regions : ['indonesia'],
      historical_period: ['kolonial'],
      content_type: 'akademik',
      subject_categories: themes.length > 0 ? themes : ['sejarah'],
      temporal_coverage: book.tahun_terbit || '1900-1950'
    };
  },

  // 🆘 EMERGENCY FALLBACK
  getEmergencyFallback(book, playlists) {
    try {
      console.log('🆘 Generating emergency fallback recommendations');
      
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      ).slice(0, 3);

      return availablePlaylists.map((playlist, index) => ({
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: 50 + (index * 10),
        confidence: 0.3,
        reasoning: 'Sistem dalam pemulihan - menggunakan fallback sederhana',
        improvementSuggestions: ['Coba lagi nanti'],
        isFallback: true,
        emergency: true
      }));

    } catch (error) {
      console.error('❌ Emergency fallback failed:', error);
      return [];
    }
  },

  // LEGACY METHODS - tetap ada untuk compatibility
  async analyzeBookPlaylistMatch(book, playlist) {
    // Fallback ke metadata matching
    const score = this.calculateMetadataBasedMatch(book, playlist);
    
    return {
      matchScore: score,
      confidence: this.calculateConfidence(score),
      reasoning: this.generateMatchReasoning(book, playlist, score),
      thematicAnalysis: 'Analisis berdasarkan metadata terstruktur',
      improvementSuggestions: this.getImprovementSuggestions(score),
      playlistId: playlist.id,
      bookId: book.id,
      isFallback: false
    };
  },

  isGeminiAvailable() {
    try {
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      const hasGeminiFunction = typeof generateAIResponse === 'function';
      return hasApiKey && hasGeminiFunction;
    } catch (error) {
      return false;
    }
  }

};

export default aiMatchingService;
