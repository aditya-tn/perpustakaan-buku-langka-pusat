// pages/api/ai-playlist-recommendations.js - ADD DETAILED LOGGING
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, playlistIds } = req.body;

    console.log('🚨 ========== API CALL START ==========');
    console.log('📦 Request body:', { 
      bookId: bookId?.substring(0, 20) + '...',
      playlistIdsCount: playlistIds?.length 
    });

    if (!bookId || !playlistIds || !Array.isArray(playlistIds)) {
      console.log('❌ Invalid request data');
      return res.status(400).json({
        error: 'bookId and playlistIds array are required'
      });
    }

    // STEP 1: Dapatkan data buku
    console.log('📚 Fetching book data...');
    let bookData = await getBookData(bookId);
    if (!bookData) {
      console.log('❌ Book not found in database');
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('✅ Book data:', {
      judul: bookData.judul,
      hasDescription: !!bookData.deskripsi_buku,
      descriptionSource: bookData.deskripsi_source
    });

    // STEP 2: Ensure AI description
    console.log('🔄 Checking AI description...');
    bookData = await ensureAIDescription(bookData);
    
    console.log('✅ After AI description check:', {
      hasDescription: !!bookData.deskripsi_buku,
      descriptionLength: bookData.deskripsi_buku?.length
    });

    // STEP 3: Dapatkan SEMUA data playlist
    console.log('🎯 Fetching playlists...');
    const playlists = [];
    for (const playlistId of playlistIds) {
      try {
        const playlist = await playlistService.getPlaylistById(playlistId);
        if (playlist) {
          playlists.push(playlist);
          console.log(`   📋 Playlist: "${playlist.name}"`);
        }
      } catch (error) {
        console.error(`   ❌ Error fetching playlist ${playlistId}:`, error);
      }
    }

    console.log(`✅ Total playlists loaded: ${playlists.length}`);

    // STEP 4: Panggai AI Matching Service
    console.log('🎯 Calling aiMatchingService.getPlaylistRecommendations...');
    let recommendations;
    
    try {
      recommendations = await aiMatchingService.getPlaylistRecommendations({
        book: bookData,
        playlists: playlists
      });
      console.log('✅ AI recommendations completed:', recommendations?.length);
      
      // LOG DETAILED RESULTS
      if (recommendations && recommendations.length > 0) {
        console.log('📊 RECOMMENDATION RESULTS:');
        recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. "${rec.playlistName}" - Score: ${rec.matchScore} - ${rec.reasoning}`);
        });
      }
      
    } catch (aiError) {
      console.error('❌ AI analysis failed:', aiError);
      
      // Emergency fallback
      const availablePlaylists = playlists.slice(0, 3);
      recommendations = availablePlaylists.map((playlist, index) => ({
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: 60 + (index * 10),
        confidence: 0.4,
        reasoning: 'Analisis darurat - sistem AI sedang mengalami masalah',
        improvementSuggestions: ['Coba lagi nanti atau gunakan mode expert'],
        isFallback: true,
        emergency: true
      }));
    }

    console.log('🚨 ========== API CALL END ==========');

    res.json({
      success: true,
      data: { 
        recommendations: recommendations,
        totalPlaylists: playlists.length,
        analyzedPlaylists: recommendations.length,
        usingFallback: recommendations.some(r => r.isFallback)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 API Error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
