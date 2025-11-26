// pages/api/ai-match-analysis.js - FIXED VERSION
import { aiMatchingService } from '../../services/aiMatchingService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, playlistId } = req.body;

    if (!bookId || !playlistId) {
      return res.status(400).json({
        error: 'bookId and playlistId are required'
      });
    }

    console.log('🤖 AI Match Analysis Request - EXPERT MODE:', { bookId, playlistId });

    // STEP 1: Dapatkan data playlist
    const { supabase } = await import('../../lib/supabase');
    const { data: playlist, error: playlistError } = await supabase
      .from('community_playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    if (playlistError || !playlist) {
      console.error('❌ Playlist not found:', playlistError);
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // STEP 2: Dapatkan data buku
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      console.error('❌ Book not found:', bookError);
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('✅ Data loaded:', {
      bookTitle: book.judul,
      playlistName: playlist.name
    });

    // STEP 3: Lakukan analisis EXPERT MODE
    console.log('🎯 Starting EXPERT mode analysis...');
    const analysis = await aiMatchingService.expertDirectMatch(book, playlist);

    console.log('✅ Expert analysis completed:', {
      score: analysis.matchScore,
      isFallback: analysis.isFallback,
      matchType: analysis.matchType
    });

    // STEP 4: Simpan score ke database
    try {
      await aiMatchingService.saveAIMatchScore(playlistId, bookId, analysis);
      console.log('💾 AI score saved successfully');
    } catch (saveError) {
      console.error('❌ Failed to save AI score:', saveError);
      // Continue anyway - don't fail the whole request
    }

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Match Analysis API Error:', error);
    res.status(500).json({
      error: 'Failed to analyze match',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      isFallback: true
    });
  }
}