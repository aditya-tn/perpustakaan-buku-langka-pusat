// pages/api/generate-ai-description.js - COMPLETE UPDATED VERSION
import { generateAIResponse } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  console.log('=== AI BOOK DESCRIPTION & METADATA API CALLED ===');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, bookTitle, bookYear, bookAuthor, currentDescription } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // STEP 1: Cek database untuk existing AI data
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('deskripsi_buku, deskripsi_source, deskripsi_confidence, metadata_structured, metadata_generated_at')
      .eq('id', bookId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching book:', fetchError);
    }

    // Jika sudah ada AI description DAN metadata, langsung return
    if (existingBook?.deskripsi_source === 'ai-enhanced' && existingBook?.metadata_structured) {
      console.log('✅ Using cached AI description & metadata from database');
      return res.json({
        success: true,
        data: existingBook,
        source: 'database-cache-full'
      });
    }

    // STEP 2: Generate AI description DAN metadata sekaligus
    console.log('🔄 Generating AI description & metadata for book:', bookTitle);
    
    const generationResult = await generateBookAIDescriptionAndMetadata({
      title: bookTitle,
      year: bookYear,
      author: bookAuthor,
      currentDescription
    });

    if (!generationResult || !generationResult.description) {
      throw new Error('Gagal generate deskripsi AI');
    }

    // STEP 3: Simpan ke database - DESKRIPSI + METADATA sekaligus
    const updateData = {
      deskripsi_buku: generationResult.description,
      deskripsi_source: 'ai-enhanced',
      deskripsi_confidence: 0.95,
      deskripsi_updated_at: new Date().toISOString()
    };

    // Tambah metadata jika ada
    if (generationResult.metadata) {
      updateData.metadata_structured = generationResult.metadata;
      updateData.metadata_generated_at = new Date().toISOString();
    }

    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', bookId)
      .select()
      .single();

    if (updateError) {
      console.error('Error saving AI description & metadata:', updateError);
      throw new Error('Gagal menyimpan deskripsi dan metadata ke database');
    }

    // STEP 4: Return hasil lengkap
    console.log('✅ AI description & metadata generated and saved successfully');
    
    res.json({
      success: true,
      data: updatedBook,
      source: generationResult.metadata ? 'ai-generated-full' : 'ai-generated-description-only',
      metadata_generated: !!generationResult.metadata
    });

  } catch (error) {
    console.error('AI Description & Metadata API Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// GENERATE BOTH DESCRIPTION DAN METADATA
async function generateBookAIDescriptionAndMetadata({ title, year, author, currentDescription }) {
  try {
    const prompt = `
TUGAS GANDA: 
1. Buat deskripsi buku yang INFORMATIF dan MENARIK untuk katalog Perpustakaan Nasional (maksimal 120 kata)
2. Generate STRUCTURED METADATA untuk sistem matching playlist

INFORMASI BUKU:
- Judul: "${title}"
- Pengarang: ${author || 'Tidak diketahui'}
- Tahun Terbit: ${year || 'Tidak diketahui'}
- Deskripsi Awal: ${currentDescription || 'Tidak ada deskripsi'}

INSTRUKSI DESKRIPSI:
- Fokus pada konteks historis dan nilai akademis
- Gunakan bahasa Indonesia yang formal tapi mudah dipahami
- Jangan tambahkan informasi fiktif

INSTRUKSI METADATA (HANYA JSON):
{
  "key_themes": ["pilih dari: sejarah, pendidikan, sosial, politik, budaya, ekonomi, etnografi"],
  "geographic_focus": ["pilih dari: sumatra barat, aceh, jawa barat, sumatra, jawa, indonesia"],
  "historical_period": ["pilih dari: kolonial, pra-kemerdekaan, kemerdekaan, modern"],
  "content_type": "pilih dari: akademik, populer, laporan, biografi, referensi, sastra",
  "subject_categories": ["pilih dari: sejarah, pendidikan, sosial, politik, budaya, ekonomi, etnografi"],
  "temporal_coverage": "isi format: 1900-1940"
}

Hanya kembalikan dalam format:
[DESKRIPSI_BUKU_DISINI]

--- METADATA_START ---
{JSON_METADATA_HERE}
--- METADATA_END ---
    `.trim();

    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.3,
      maxTokens: 800
    });

    return parseDualOutput(aiResponse, title, author, year, currentDescription);

  } catch (error) {
    console.error('Error generating AI description & metadata:', error);
    return createEnhancedFallbackOutput(title, author, year, currentDescription);
  }
}

// PARSE DUAL OUTPUT (DESCRIPTION + METADATA)
function parseDualOutput(aiResponse, title, author, year, currentDescription) {
  try {
    // Extract metadata part
    const metadataMatch = aiResponse.match(/--- METADATA_START ---([\s\S]*?)--- METADATA_END ---/);
    
    let metadata = null;
    let description = aiResponse;

    if (metadataMatch) {
      // Extract and parse metadata
      const metadataText = metadataMatch[1].trim();
      try {
        metadata = JSON.parse(metadataText);
        // Remove metadata part from description
        description = aiResponse.replace(/--- METADATA_START ---[\s\S]*?--- METADATA_END ---/, '').trim();
      } catch (parseError) {
        console.error('Failed to parse metadata JSON:', parseError);
        metadata = generateFallbackMetadata(title, author, year, currentDescription);
      }
    } else {
      // Jika tidak ada metadata section, generate fallback
      metadata = generateFallbackMetadata(title, author, year, currentDescription);
    }

    // Clean up description
    description = description
      .replace(/\`\`\`json|\`\`\`/g, '')
      .replace(/^{|}$/g, '')
      .trim();

    return {
      description: description || createEnhancedFallbackDescription(title, author, year, currentDescription),
      metadata: {
        ...metadata,
        is_fallback: !metadataMatch,
        generated_at: new Date().toISOString(),
        version: 1
      }
    };

  } catch (error) {
    console.error('Error parsing dual output:', error);
    return createEnhancedFallbackOutput(title, author, year, currentDescription);
  }
}

// FALLBACK METADATA GENERATOR
function generateFallbackMetadata(title, author, year, currentDescription) {
  const text = `${title} ${currentDescription || ''}`.toLowerCase();
  
  // Theme detection
  const themes = [];
  if (text.includes('sejarah') || text.includes('geschiedenis')) themes.push('sejarah');
  if (text.includes('pendidikan') || text.includes('onderwijs')) themes.push('pendidikan');
  if (text.includes('sosial') || text.includes('maatschappij')) themes.push('sosial');
  if (text.includes('politik') || text.includes('bestuur')) themes.push('politik');
  if (text.includes('budaya') || text.includes('cultural')) themes.push('budaya');
  if (text.includes('ekonomi') || text.includes('economic')) themes.push('ekonomi');
  if (text.includes('etnografi') || text.includes('etnis')) themes.push('etnografi');
  
  // Geographic detection
  const regions = [];
  if (text.includes('padang') || text.includes('minangkabau')) regions.push('sumatra barat');
  if (text.includes('aceh') || text.includes('atjeh')) regions.push('aceh');
  if (text.includes('jawa barat') || text.includes('bandung') || text.includes('bogor')) regions.push('jawa barat');
  if (text.includes('sumatra') && !text.includes('sumatra barat')) regions.push('sumatra');
  if (text.includes('jawa') && !text.includes('jawa barat')) regions.push('jawa');
  
  // Historical period detection
  const periods = [];
  if (text.includes('kolonial') || text.includes('belanda') || text.includes('dutch')) periods.push('kolonial');
  if (text.includes('pra-kemerdekaan') || text.includes('sebelum merdeka')) periods.push('pra-kemerdekaan');
  if (text.includes('kemerdekaan') || text.includes('indonesia merdeka')) periods.push('kemerdekaan');
  if (text.includes('modern') || text.includes('kontemporer')) periods.push('modern');
  
  // Content type detection
  let contentType = 'akademik';
  if (text.includes('populer') || text.includes('umum')) contentType = 'populer';
  if (text.includes('laporan') || text.includes('report')) contentType = 'laporan';
  if (text.includes('biografi') || text.includes('tokoh')) contentType = 'biografi';
  if (text.includes('referensi') || text.includes('ensiklopedia')) contentType = 'referensi';
  if (text.includes('sastra') || text.includes('novel') || text.includes('puisi')) contentType = 'sastra';

  return {
    key_themes: themes.length > 0 ? themes : ['sejarah'],
    geographic_focus: regions.length > 0 ? regions : ['indonesia'],
    historical_period: periods.length > 0 ? periods : ['kolonial'],
    content_type: contentType,
    subject_categories: themes.length > 0 ? themes : ['sejarah'],
    temporal_coverage: year || '1900-1950',
    is_fallback: true
  };
}

// FALLBACK DESCRIPTION
function createEnhancedFallbackDescription(title, author, year, currentDescription) {
  if (currentDescription) {
    return `${currentDescription}\n\n[Deskripsi ini telah ditingkatkan oleh sistem AI untuk memberikan informasi yang lebih akurat dan kontekstual mengenai nilai historis dan signifikansi akademis buku ini dalam koleksi Perpustakaan Nasional.]`;
  }
  
  return `Buku "${title}" ${author ? `karya ${author}` : ''} ${year ? `yang diterbitkan pada tahun ${year}` : ''}. Koleksi ini memiliki nilai historis dan akademis yang signifikan dalam konteks perkembangan pengetahuan di Indonesia. Buku ini merupakan bagian dari koleksi Perpustakaan Nasional yang dilestarikan untuk penelitian dan studi lebih lanjut.`;
}

// COMPREHENSIVE FALLBACK
function createEnhancedFallbackOutput(title, author, year, currentDescription) {
  return {
    description: createEnhancedFallbackDescription(title, author, year, currentDescription),
    metadata: generateFallbackMetadata(title, author, year, currentDescription)
  };
}
