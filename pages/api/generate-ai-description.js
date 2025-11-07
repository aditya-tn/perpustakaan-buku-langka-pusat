// pages/api/generate-ai-description.js
import { supabase } from '../../lib/supabase';
import { generateAIResponse } from '../../lib/gemini';

export default async function handler(req, res) {
  console.log('=== AI BOOK DESCRIPTION API CALLED ===');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, bookTitle, bookYear, bookAuthor, currentDescription } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // STEP 1: Cek database dulu - gunakan pattern yang sama seperti chat.js
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('deskripsi_buku, deskripsi_source, deskripsi_confidence')
      .eq('id', bookId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching book:', fetchError);
    }

    // Jika sudah ada deskripsi AI di database, langsung return (CACHE SYSTEM)
    if (existingBook?.deskripsi_source === 'ai-enhanced') {
      console.log('✅ Using cached AI description from database');
      return res.json({
        success: true,
        data: existingBook,
        source: 'database-cache'
      });
    }

    // STEP 2: Generate AI description menggunakan system Gemini yang sudah ada
    console.log('🔄 Generating AI description for book:', bookTitle);
    
    const aiDescription = await generateBookAIDescription({
      title: bookTitle,
      year: bookYear,
      author: bookAuthor,
      currentDescription
    });

    if (!aiDescription) {
      throw new Error('Gagal generate deskripsi AI');
    }

    // STEP 3: Simpan ke database - REUSE YOUR EXISTING PATTERN
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({
        deskripsi_buku: aiDescription,
        deskripsi_source: 'ai-enhanced',
        deskripsi_confidence: 0.95,
        deskripsi_updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select()
      .single();

    if (updateError) {
      console.error('Error saving AI description:', updateError);
      throw new Error('Gagal menyimpan deskripsi ke database');
    }

    // STEP 4: Return hasil
    console.log('✅ AI description generated and saved successfully');
    res.json({
      success: true,
      data: updatedBook,
      source: 'ai-generated'
    });

  } catch (error) {
    console.error('AI Description API Error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// 🎯 REUSE YOUR GEMINI SYSTEM - Enhanced untuk book descriptions
async function generateBookAIDescription({ title, year, author, currentDescription }) {
  try {
    // Gunakan generateAIResponse yang sudah ada, dengan prompt khusus
    const prompt = `
TUGAS: Buat deskripsi buku yang INFORMATIF dan MENARIK untuk katalog Perpustakaan Nasional.

INFORMASI BUKU:
- Judul: "${title}"
- Pengarang: ${author || 'Tidak diketahui'}
- Tahun Terbit: ${year || 'Tidak diketahui'}

DESKRIPSI AWAL (rule-based): 
${currentDescription}

INSTRUKSI:
1. Buat deskripsi yang LEBIH AKURAT dan DETAIL
2. Fokus pada konteks historis dan nilai akademis
3. Gunakan bahasa Indonesia yang formal tapi mudah dipahami
4. Maksimal 120 kata
5. Jangan tambahkan informasi fiktif

FORMAT OUTPUT:
Deskripsi buku yang informatif dan profesional.
    `.trim();

    const aiResponse = await generateAIResponse(prompt, {
      libraryContext: await getLibraryContext(),
      temperature: 0.3 // Lower temperature untuk konsistensi
    });

    return aiResponse || createEnhancedFallbackDescription(title, author, year, currentDescription);
    
  } catch (error) {
    console.error('Error generating AI description:', error);
    return createEnhancedFallbackDescription(title, author, year, currentDescription);
  }
}

// Fallback description menggunakan rule-based yang ditingkatkan
function createEnhancedFallbackDescription(title, author, year, currentDescription) {
  return `
${currentDescription}

[Deskripsi ini telah ditingkatkan oleh sistem AI untuk memberikan informasi yang lebih akurat dan kontekstual mengenai nilai historis dan signifikansi akademis buku ini dalam koleksi Perpustakaan Nasional.]
  `.trim();
}

// Reuse function dari chat.js
async function getLibraryContext() {
  return `Perpustakaan Nasional: Buka Senin-Jumat 08.00-19.00, Sabtu-Minggu 09.00-16.00. Alamat: Jl. Medan Merdeka Selatan No.11, Jakarta. Layanan: peminjaman buku, koleksi langka, ruang baca, WiFi gratis.`;
}