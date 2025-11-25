// pages/api/ai-playlist-recommendations.js - ENHANCED VERSION
import aiMatchingService from '../../services/aiMatchingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, playlistIds, mode = 'novice' } = req.body;

    console.log('🚀 ENHANCED API - Colonial-aware matching');
    
    // Validasi
    if (!bookId || !playlistIds || !Array.isArray(playlistIds)) {
      return res.status(400).json({ 
        error: 'bookId and playlistIds array are required',
        received: { bookId, playlistIds }
      });
    }

    // STEP 1: Dapatkan data buku dengan metadata
    const bookData = await getEnhancedBookData(bookId);
    if (!bookData) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // STEP 2: Dapatkan & enhance playlist data
    const playlists = await getEnhancedPlaylistsData(playlistIds);
    
    console.log(`✅ Loaded ${playlists.length} enhanced playlists`);

    if (playlists.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          totalPlaylists: 0,
          message: 'No playlists available after enhancement'
        }
      });
    }

    // STEP 3: Pilih mode matching
    let recommendations;
    if (mode === 'expert') {
      recommendations = await aiMatchingService.expertDirectMatch(bookData, playlists[0]);
      recommendations = [recommendations];
    } else {
      // NOVICE MODE dengan enhanced pipeline
      recommendations = await aiMatchingService.noviceRecommendations({
        book: bookData,
        playlists: playlists
      });
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
        mode: mode,
        colonialContext: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Enhanced API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper function untuk enhanced book data
async function getEnhancedBookData(bookId) {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) return null;

    // Ensure book has basic metadata structure
    if (!data.metadata_structured) {
      data.metadata_structured = {
        key_themes: ['sejarah'], // default fallback
        geographic_focus: ['indonesia'],
        historical_period: ['kolonial'],
        content_type: 'non-fiksi'
      };
    }

    return data;
  } catch (error) {
    console.error('Error getting enhanced book data:', error);
    return null;
  }
}

// Helper function untuk enhanced playlist data
async function getEnhancedPlaylistsData(playlistIds) {
  const playlists = [];
  
  for (const playlistId of playlistIds) {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (error) continue;

      // Ensure playlist has quality metadata
      if (!data.ai_metadata || data.ai_metadata.is_fallback) {
        // Trigger metadata generation untuk playlist ini
        console.log(`🔄 Generating metadata for playlist: ${data.name}`);
        try {
          const metadataResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/playlists/generate-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlistId: data.id })
          });
          
          if (metadataResponse.ok) {
            const result = await metadataResponse.json();
            if (result.success) {
              data.ai_metadata = result.data;
            }
          }
        } catch (metadataError) {
          console.error('Metadata generation failed:', metadataError);
        }
      }

      playlists.push(data);
    } catch (error) {
      console.error(`❌ Failed to enhance playlist ${playlistId}:`, error);
    }
  }
  
  return playlists;
}