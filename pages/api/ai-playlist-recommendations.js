// pages/api/ai-playlist-recommendations.js - FIX LOGGING
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, playlistIds } = req.body;

    // FIX: Jangan pakai substring pada non-string
    console.log('🚨 API START');
    console.log('📦 Request:', { 
      bookId: typeof bookId === 'string' ? bookId.substring(0, 20) : bookId,
      playlistIdsCount: playlistIds?.length 
    });

    if (!bookId || !playlistIds || !Array.isArray(playlistIds)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // STEP 1: Get book data
    console.log('📚 Getting book data...');
    let bookData = await getBookData(bookId);
    if (!bookData) {
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('✅ Book:', bookData.judul);

    // STEP 2: Get playlists dengan error handling
    console.log('🎯 Getting playlists...');
    const playlists = [];
    
    for (const playlistId of playlistIds) {
      try {
        const playlist = await getPlaylistWithFallback(playlistId);
        if (playlist) {
          playlists.push(playlist);
          console.log(`   ✅ ${playlist.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Skip playlist ${playlistId}`);
        // Continue dengan playlist lain
      }
      
      // Batasi untuk testing
      if (playlists.length >= 5) break;
    }

    console.log(`✅ Got ${playlists.length} playlists`);

    if (playlists.length === 0) {
      return res.json({
        success: true,
        data: { recommendations: [], totalPlaylists: 0, error: 'No playlists available' }
      });
    }

    // STEP 3: Get recommendations dengan robust error handling
    console.log('🎯 Getting recommendations...');
    let recommendations;
    
    try {
      recommendations = await aiMatchingService.getPlaylistRecommendations({
        book: bookData,
        playlists: playlists
      });
      
      console.log('✅ Recommendations success:', recommendations?.length);
      
    } catch (error) {
      console.error('❌ Recommendations failed:', error);
      
      // Fallback sederhana
      recommendations = playlists.slice(0, 3).map((playlist, index) => ({
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: 70 - (index * 15), // 70, 55, 40
        confidence: 0.6,
        reasoning: 'Kecocokan berdasarkan tema umum',
        isFallback: true
      }));
    }

    res.json({
      success: true,
      data: { 
        recommendations: recommendations || [],
        totalPlaylists: playlists.length
      }
    });

  } catch (error) {
    console.error('💥 API Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 🆕 Robust playlist fetcher
async function getPlaylistWithFallback(playlistId) {
  try {
    // Coba service dulu
    return await playlistService.getPlaylistById(playlistId);
  } catch (error) {
    console.log(`   ⚠️ Service failed for ${playlistId}, trying direct fetch`);
    
    try {
      // Fallback: direct Supabase query
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (fallbackError) {
      console.log(`   💥 Both methods failed for ${playlistId}`);
      return null;
    }
  }
}

// Simple getBookData
async function getBookData(bookId) {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    return error ? null : data;
  } catch (error) {
    return null;
  }
}
