// pages/api/ai-match-analysis.js - FIXED VERSION
import { aiMatchingService } from '../../services/aiMatchingService';
import { playlistService } from '../../services/playlistService';

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

    console.log('🤖 AI Match Analysis Request:', { bookId, playlistId });

    // STEP 1: Dapatkan data playlist
    const playlist = await playlistService.getPlaylistById(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // STEP 2: Dapatkan data buku + CEK DESKRIPSI
    let book = await getBookDataWithDescriptionCheck(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // STEP 3: ⚡ CEK APAKAH PERLU GENERATE AI DESCRIPTION
    book = await ensureAIDescription(book);

    console.log('📚 Data loaded for analysis:', {
      bookTitle: book.judul,
      hasAIDescription: !!book.deskripsi_buku,
      playlistName: playlist.name
    });

    // STEP 4: Lakukan analisis kecocokan
    const analysis = await aiMatchingService.analyzeBookPlaylistMatch(book, playlist);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Match Analysis API Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze match',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ⚡ FUNCTION BARU: Cek deskripsi + generate jika perlu
async function ensureAIDescription(book) {
  // Cek apakah buku sudah punya deskripsi AI
  const hasAIDescription = book.deskripsi_buku && 
                          book.deskripsi_source === 'ai-enhanced';

  if (hasAIDescription) {
    console.log('✅ Book already has AI description, skipping generation');
    return book;
  }

  console.log('🔄 Book needs AI description, generating...');
  
  try {
    // Panggil API generate AI description yang sudah ada
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
        console.log('✅ AI description generated and saved');
        // Update book data dengan deskripsi baru
        return { ...book, ...result.data };
      }
    }
    
    console.log('❌ AI description generation failed, using existing data');
    return book;
    
  } catch (error) {
    console.error('❌ Error generating AI description:', error);
    return book; // Return book as-is jika gagal
  }
}

// ⚡ FUNCTION: Get book data dengan semua field
async function getBookDataWithDescriptionCheck(bookId) {
  try {
    const { supabase } = await import('../../lib/supabase');
    
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('❌ Error fetching book:', error);
      return null;
    }

    return book;
    
  } catch (error) {
    console.error('❌ Error in getBookData:', error);
    return null;
  }
}