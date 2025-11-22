// pages/api/ai-playlist-recommendations.js - CLEAN VERSION
import aiMatchingService from '../../services/aiMatchingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, playlistIds } = req.body;

    console.log('🚨 API START - Clean version');

    // Validasi input
    if (!bookId || !playlistIds || !Array.isArray(playlistIds)) {
      return res.status(400).json({ error: 'bookId and playlistIds array are required' });
    }

    // STEP 1: Dapatkan data buku
    console.log('📚 Getting book data...');
    const bookData = await getBookData(bookId);
    if (!bookData) {
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('✅ Book:', bookData.judul);

    // STEP 2: Dapatkan data playlist
    console.log('🎯 Getting playlists...');
    const playlists = [];
    
    for (const playlistId of playlistIds) {
      try {
        const playlist = await getPlaylistData(playlistId);
        if (playlist) {
          playlists.push(playlist);
        }
      } catch (error) {
        console.log(`❌ Failed to get playlist ${playlistId}`);
        // Continue dengan playlist lainnya
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

    // STEP 3: Dapatkan rekomendasi dari aiMatchingService
    console.log('🎯 Getting AI recommendations...');
    let recommendations;
    
    try {
      recommendations = await aiMatchingService.getPlaylistRecommendations({
        book: bookData,
        playlists: playlists
      });
      
      console.log(`✅ AI recommendations: ${recommendations?.length || 0} items`);
      
    } catch (error) {
      console.error('❌ AI service failed:', error.message);
      
      // Fallback sederhana berdasarkan nama playlist
      recommendations = playlists.slice(0, 3).map((playlist, index) => ({
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: 60 - (index * 10), // 60, 50, 40
        confidence: 0.5,
        reasoning: 'Fallback: analisis sistem sederhana',
        improvementSuggestions: ['Gunakan analisis AI untuk hasil lebih akurat'],
        isFallback: true
      }));
    }

    // STEP 4: Return response
    res.json({
      success: true,
      data: { 
        recommendations: recommendations || [],
        totalPlaylists: playlists.length,
        analyzedPlaylists: recommendations?.length || 0,
        bookTitle: bookData.judul
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 API Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Helper function: Get book data
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
    console.error('Error getting book data:', error);
    return null;
  }
}

// Helper function: Get playlist data
async function getPlaylistData(playlistId) {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data, error } = await supabase
      .from('community_playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    return error ? null : data;
  } catch (error) {
    console.error('Error getting playlist data:', error);
    return null;
  }
}
