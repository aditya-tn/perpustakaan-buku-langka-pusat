// pages/api/ai-playlist-recommendations.js - PASTIKAN FILE INI ADA
import { aiMatchingService } from '../../services/aiMatchingService';
import { playlistService } from '../../services/playlistService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, playlistIds } = req.body;

    console.log('🚨 API CALLED: ai-playlist-recommendations');
    console.log('📦 Request data:', { bookId, playlistCount: playlistIds?.length });

    if (!bookId || !playlistIds || !Array.isArray(playlistIds)) {
      return res.status(400).json({
        error: 'bookId and playlistIds array are required'
      });
    }

    // STEP 1: Dapatkan data buku
    let bookData = await getBookData(bookId);
    if (!bookData) {
      console.log('❌ Book not found:', bookId);
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('✅ Book found:', bookData.judul);

    // STEP 2: Ensure AI description
    bookData = await ensureAIDescription(bookData);
    console.log('✅ Book description ready');

    // STEP 3: Dapatkan SEMUA data playlist
    const playlists = [];
    for (const playlistId of playlistIds) {
      try {
        const playlist = await playlistService.getPlaylistById(playlistId);
        if (playlist) {
          playlists.push(playlist);
        }
      } catch (error) {
        console.error(`Error fetching playlist ${playlistId}:`, error);
      }
    }

    console.log('✅ Playlists loaded:', playlists.length);
    console.log('📋 Playlist names:', playlists.map(p => p.name));

    // STEP 4: Panggai AI Matching Service
    console.log('🎯 Calling aiMatchingService.getPlaylistRecommendations...');
    let recommendations;
    
    try {
      recommendations = await aiMatchingService.getPlaylistRecommendations({
        book: bookData,
        playlists: playlists
      });
      console.log('✅ AI recommendations received:', recommendations?.length);
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

// REUSE FUNCTIONS
async function ensureAIDescription(book) {
  const hasAIDescription = book.deskripsi_buku && 
                          book.deskripsi_source === 'ai-enhanced';
  
  if (hasAIDescription) {
    console.log('✅ Book already has AI description');
    return book;
  }

  console.log('🔄 Book needs AI description, generating...');
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-ai-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: book.id,
        bookTitle: book.judul,
        bookYear: book.tahun_terbit,
        bookAuthor: book.pengarang,
        currentDescription: book.deskripsi_fisik || ''
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('✅ AI description generated for recommendations');
        return { ...book, ...result.data };
      }
    }
    
    return book;
  } catch (error) {
    console.error('❌ Error generating AI description:', error);
    return book;
  }
}

async function getBookData(bookId) {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return null;
    }
    return book;
  } catch (error) {
    console.error('❌ Error in getBookData:', error);
    return null;
  }
}
