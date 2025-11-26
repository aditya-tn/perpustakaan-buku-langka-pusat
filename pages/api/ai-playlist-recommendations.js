// pages/api/ai-playlist-recommendations.js - FIXED VERSION
import aiMatchingService from '../../services/aiMatchingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, playlistIds, mode = 'novice' } = req.body;

    console.log('🚀 API START - Fixed version');
    console.log('📦 Request data:', { bookId, playlistCount: playlistIds?.length, mode });
    
    // Validasi input
    if (!bookId || !playlistIds || !Array.isArray(playlistIds)) {
      return res.status(400).json({ 
        error: 'bookId and playlistIds array are required',
        received: { bookId, playlistIds }
      });
    }

    // STEP 1: Dapatkan data buku
    console.log('📚 Getting book data...');
    const bookData = await getBookData(bookId);
    if (!bookData) {
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('✅ Book loaded:', bookData.judul);

    // STEP 2: Dapatkan data playlist
    console.log('🎯 Getting playlists...');
    const playlists = [];
    for (const playlistId of playlistIds) {
      try {
        const playlist = await getPlaylistData(playlistId);
        if (playlist) {
          playlists.push(playlist);
        } else {
          console.log(`⚠️ Playlist ${playlistId} not found`);
        }
      } catch (error) {
        console.log(`❌ Failed to get playlist ${playlistId}:`, error.message);
      }
    }

    console.log(`✅ Loaded ${playlists.length} playlists`);

    if (playlists.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          totalPlaylists: 0,
          message: 'No playlists available'
        }
      });
    }

    // STEP 3: Pilih mode matching
    let recommendations;
    if (mode === 'expert' && playlists.length === 1) {
      // Expert mode untuk single playlist
      console.log('🎯 Using EXPERT mode for single playlist');
      try {
        const expertResult = await aiMatchingService.expertDirectMatch(bookData, playlists[0]);
        recommendations = [expertResult];
      } catch (expertError) {
        console.error('❌ Expert mode failed:', expertError);
        recommendations = [];
      }
    } else {
      // NOVICE mode untuk multiple playlists
      console.log('🤖 Using NOVICE mode for multiple playlists');
      try {
        recommendations = await aiMatchingService.noviceRecommendations({
          book: bookData,
          playlists: playlists
        });
        console.log(`✅ Novice recommendations: ${recommendations?.length || 0} items`);
      } catch (noviceError) {
        console.error('❌ Novice mode failed:', noviceError);
        // Fallback: basic scoring
        recommendations = playlists.slice(0, 3).map((playlist, index) => ({
          playlistId: playlist.id,
          playlistName: playlist.name,
          matchScore: 70 - (index * 10),
          confidence: 0.3,
          reasoning: 'Fallback scoring',
          isFallback: true
        }));
      }
    }

    console.log(`🎯 Final recommendations: ${recommendations?.length || 0} items`);

    // STEP 4: Return response
    res.json({
      success: true,
      data: {
        recommendations: recommendations || [],
        totalPlaylists: playlists.length,
        analyzedPlaylists: recommendations?.length || 0,
        bookTitle: bookData.judul,
        mode: mode
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 API Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper functions
async function getBookData(bookId) {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('❌ Error fetching book:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting book data:', error);
    return null;
  }
}

async function getPlaylistData(playlistId) {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data, error } = await supabase
      .from('community_playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    if (error) {
      console.error('❌ Error fetching playlist:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting playlist data:', error);
    return null;
  }
}
