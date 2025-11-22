// pages/api/generate-ai-description.js - MULTI-STRATEGY APPROACH

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

    // STEP 2: Generate AI description DAN metadata dengan multiple strategies
    console.log('🔄 Generating AI description & metadata for book:', bookTitle);
    
    const generationResult = await generateBookAIDescriptionAndMetadata({
      title: bookTitle,
      year: bookYear,
      author: bookAuthor,
      currentDescription
    });

    // STEP 3: Simpan ke database
    const updateData = {
      deskripsi_buku: generationResult.description,
      deskripsi_source: 'ai-enhanced',
      deskripsi_confidence: generationResult.metadata.ai_failed ? 0.3 : 0.95,
      deskripsi_updated_at: new Date().toISOString(),
      metadata_structured: generationResult.metadata,
      metadata_generated_at: new Date().toISOString()
    };

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
      source: generationResult.metadata.ai_failed ? 'ai-failed-empty' : 'ai-generated-full',
      attempts_used: generationResult.attempts_used,
      metadata_quality: generationResult.metadata.ai_failed ? 'empty' : 'full'
    });

  } catch (error) {
    console.error('AI Description & Metadata API Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// SIMPLIFIED MAIN FUNCTION
async function generateBookAIDescriptionAndMetadata({ title, year, author, currentDescription }) {
  try {
    console.log('🎯 AI GENERATION WITH MANUAL EXTRACTION...');

    const result = await attemptTwoStepGeneration(title, year, author);
    
    if (result.success) {
      console.log('✅ Generation successful!');
      return { ...result.result, attempts_used: ['two_step_manual'] };
    }

    throw new Error('Generation failed');

  } catch (error) {
    console.error('❌ AI generation failed:', error);
    return {
      ...createEmptyOutput(title, author, year, currentDescription),
      attempts_used: ['failed'],
      all_failed: true
    };
  }
}

// STRATEGY 1: Very strict structured prompt
async function attemptStructuredPrompt(title, year, author) {
  const prompt = `
**FORMAT OUTPUT YANG WAJIB:**

DESKRIPSI_BUKU:[deskripsi 100-130 kata bahasa Indonesia]

METADATA_JSON:{
  "key_themes": ["tema1", "tema2"],
  "geographic_focus": ["lokasi1", "lokasi2"],
  "historical_period": ["periode1", "periode2"],
  "content_type": "jenis_konten",
  "subject_categories": ["kategori1", "kategori2"],
  "temporal_coverage": "TAHUN_AWAL-TAHUN_AKHIR"
}

**BUKU:** "${title}"
**PENGARANG:** ${author || 'Tidak diketahui'}
**TAHUN:** ${year || 'Tidak diketahui'}

**ATURAN:**
- Isi metadata berdasarkan analisis buku
- Jika informasi tidak ada, gunakan array kosong [] atau string kosong ""
- Jangan mengarang informasi

**HANYA KEMBALIKAN 2 BARIS:**
1. DESKRIPSI_BUKU:[...]
2. METADATA_JSON:{...}
`.trim();

  console.log('📤 Attempt 1 - Structured prompt');
  const response = await generateAIResponse(prompt, { 
    temperature: 0.1, 
    maxTokens: 1200 
  });
  
  console.log('📥 Attempt 1 Response:', response?.substring(0, 200) + '...');
  return parseStructuredResponse(response);
}

// STRATEGY 2: Conversational but explicit
async function attemptConversationalPrompt(title, year, author) {
  const prompt = `
Hai! Tolong bantu analisis buku ini dan berikan output dalam format spesifik.

BUKU: "${title}"
${author ? `PENGARANG: ${author}` : ''}
${year ? `TAHUN: ${year}` : ''}

Tolong berikan:
1. Deskripsi buku (100-130 kata, bahasa Indonesia)
2. Metadata JSON dengan field berikut:

--- METADATA_START ---
{
  "key_themes": ["analisis tema berdasarkan konten"],
  "geographic_focus": ["lokasi geografis yang relevan"],
  "historical_period": ["periode sejarah yang dibahas"],
  "content_type": "jenis konten berdasarkan analisis",
  "subject_categories": ["kategori subjek yang sesuai"],
  "temporal_coverage": "rentang tahun atau string kosong"
}
--- METADATA_END ---

FORMAT OUTPUT HARUS:
[Deskripsi buku di sini...]

--- METADATA_START ---
{ ... metadata JSON ... }
--- METADATA_END ---

Pastikan metadata JSON valid dan lengkap!
Jangan tambahkan teks lain.
`.trim();

  console.log('📤 Attempt 2 - Conversational prompt');
  const response = await generateAIResponse(prompt, { 
    temperature: 0.2, 
    maxTokens: 1500 
  });
  
  console.log('📥 Attempt 2 Response:', response?.substring(0, 200) + '...');
  return parseConversationalResponse(response);
}

// STRATEGY 3: Direct JSON generation
async function attemptDirectJSONPrompt(title, year, author) {
  const prompt = `
Generate JSON metadata for this book:

BOOK: "${title}"
AUTHOR: ${author || 'Unknown'}
YEAR: ${year || 'Unknown'}

First, write a 100-130 word description in Indonesian.

Then, generate this exact JSON structure:

{
  "description": "[the description you wrote]",
  "key_themes": ["theme1", "theme2"],
  "geographic_focus": ["location1", "location2"],
  "historical_period": ["period1", "period2"],
  "content_type": "content_type",
  "subject_categories": ["category1", "category2"],
  "temporal_coverage": "year_start-year_end"
}

Rules:
- Fill metadata based on actual book content
- Use empty arrays [] or empty strings "" if information is missing
- Do not invent information

Return ONLY the JSON object, nothing else.
`.trim();

  console.log('📤 Attempt 3 - Direct JSON prompt');
  const response = await generateAIResponse(prompt, { 
    temperature: 0.1, 
    maxTokens: 1300 
  });
  
  console.log('📥 Attempt 3 Response:', response?.substring(0, 200) + '...');
  return parseJSONResponse(response);
}

// STRATEGY 4: Two-step generation
async function attemptTwoStepGeneration(title, year, author) {
  try {
    console.log('📤 Two-step generation with manual extraction');
    
    // STEP 1: Generate description
    const descPrompt = `
Buat deskripsi buku 100-130 kata dalam bahasa Indonesia untuk buku berikut:

JUDUL: "${title}"
${author ? `PENGARANG: ${author}` : ''}
${year ? `TAHUN: ${year}` : ''}

Deskripsi harus:
- Berdasarkan informasi yang ada
- Jangan tambahkan informasi fiktif  
- Fokus pada konten aktual buku

Hanya kembalikan deskripsi saja, tanpa tambahan lain.
`.trim();

    const descResponse = await generateAIResponse(descPrompt, { 
      temperature: 0.1, 
      maxTokens: 800 
    });

    console.log('📥 Description generated:', descResponse?.substring(0, 100) + '...');

    // STEP 2: Generate metadata - gunakan prompt yang sama
    const metaPrompt = `
Berdasarkan deskripsi buku berikut, buat metadata JSON:

DESKRIPSI: "${descResponse}"

JUDUL: "${title}"
${author ? `PENGARANG: ${author}` : ''}
${year ? `TAHUN: ${year}` : ''}

Buat metadata JSON ini:

{
  "key_themes": [],
  "geographic_focus": [],
  "historical_period": [],
  "content_type": "",
  "subject_categories": [],
  "temporal_coverage": ""
}

Aturan:
- Isi berdasarkan deskripsi di atas
- Gunakan array kosong [] atau string kosong "" jika tidak ada informasi
- Jangan mengarang informasi

Hanya kembalikan JSON saja.
`.trim();

    const metaResponse = await generateAIResponse(metaPrompt, { 
      temperature: 0.1, 
      maxTokens: 800 
    });

    console.log('📥 Metadata response:', metaResponse);

    // LANGSUNG GUNAKAN MANUAL EXTRACTION - lebih reliable
    return attemptManualExtraction(metaResponse, descResponse);

  } catch (error) {
    console.error('Two-step generation failed:', error);
    return { success: false };
  }
}

// FUNCTION BARU: Robust metadata parsing
function parseMetadataResponse(metaResponse, descResponse) {
  try {
    console.log('🔍 Parsing metadata response...');
    
    // Bersihkan response secara agresif
    let cleanResponse = metaResponse.trim();
    
    // Hapus SEMUA markdown code blocks dan quotes
    cleanResponse = cleanResponse.replace(/```json|```|"|'/g, '');
    
    // Cari pattern JSON yang lebih spesifik
    const jsonMatch = cleanResponse.match(/\{\s*[\s\S]*?\}/);
    if (!jsonMatch) {
      console.log('❌ No JSON object found after cleaning');
      return { success: false };
    }
    
    let jsonText = jsonMatch[0].trim();
    console.log('📄 Clean JSON text:', jsonText);
    
    // Parse JSON langsung - tanpa fix tambahan
    const metadata = JSON.parse(jsonText);
    
    console.log('✅ JSON parsed successfully');
    return {
      success: true,
      result: {
        description: descResponse.trim(),
        metadata: normalizeEmptyMetadata(metadata)
      }
    };
    
  } catch (error) {
    console.error('❌ Metadata parsing failed:', error.message);
    console.log('📝 Raw metadata response:', metaResponse);
    
    // Coba approach terakhir: manual extraction
    return attemptManualExtraction(metaResponse, descResponse);
  }
}

// OPTIMIZED MANUAL EXTRACTION
function attemptManualExtraction(metaResponse, descResponse) {
  try {
    console.log('🔍 Manual extraction...');
    
    const metadata = {};
    const text = metaResponse;
    
    // Pattern matching yang lebih robust
    const patterns = {
      key_themes: /"key_themes"\s*:\s*\[([^\]]*)\]/,
      geographic_focus: /"geographic_focus"\s*:\s*\[([^\]]*)\]/,
      historical_period: /"historical_period"\s*:\s*\[([^\]]*)\]/,
      content_type: /"content_type"\s*:\s*"([^"]*)"/,
      subject_categories: /"subject_categories"\s*:\s*\[([^\]]*)\]/,
      temporal_coverage: /"temporal_coverage"\s*:\s*"([^"]*)"/
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        if (key.includes('_themes') || key.includes('_focus') || key.includes('_period') || key.includes('_categories')) {
          // Array fields
          const itemsText = match[1].replace(/"/g, '');
          metadata[key] = itemsText.split(',').map(item => item.trim()).filter(item => item);
        } else {
          // String fields
          metadata[key] = match[1].trim();
        }
        console.log(`✅ Extracted ${key}:`, metadata[key]);
      } else {
        // Set default empty value
        if (key.includes('_themes') || key.includes('_focus') || key.includes('_period') || key.includes('_categories')) {
          metadata[key] = [];
        } else {
          metadata[key] = '';
        }
        console.log(`⚠️  No ${key} found, using default`);
      }
    }
    
    console.log('✅ Manual extraction completed');
    return {
      success: true,
      result: {
        description: descResponse.trim(),
        metadata: normalizeEmptyMetadata(metadata)
      }
    };
    
  } catch (error) {
    console.error('❌ Manual extraction failed:', error);
    return { success: false };
  }
}

// FUNCTION BARU: Fix common JSON issues
function fixCommonJSONIssues(jsonText) {
  let fixed = jsonText;
  
  console.log('🔧 Fixing JSON issues...');
  
  // Issue 1: Missing closing brace (kasus yang terjadi)
  let openBraces = (fixed.match(/{/g) || []).length;
  let closeBraces = (fixed.match(/}/g) || []).length;
  
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
    console.log(`🔧 Added ${openBraces - closeBraces} missing closing braces`);
  }
  
  // Issue 2: Trailing commas
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  
  // Issue 3: Unclosed strings
  fixed = fixed.replace(/(["'])([^"']*)$/, '$1$2"');
  
  // Issue 4: Missing quotes around keys
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  console.log('🔧 Fixed JSON:', fixed);
  return fixed;
}

// PARSER FUNCTIONS
function parseStructuredResponse(response) {
  try {
    console.log('🔍 Parsing structured response...');
    
    const descMatch = response.match(/DESKRIPSI_BUKU:\s*([^\n]*)/);
    const jsonMatch = response.match(/METADATA_JSON:\s*(\{[\s\S]*\})/);
    
    if (descMatch && jsonMatch) {
      const description = descMatch[1].trim();
      let metadataText = jsonMatch[1].trim();
      
      // Fix JSON jika perlu
      metadataText = fixTruncatedJSON(metadataText);
      const metadata = JSON.parse(metadataText);
      
      console.log('✅ Structured parse successful');
      return {
        success: true,
        result: { 
          description, 
          metadata: normalizeEmptyMetadata(metadata) 
        }
      };
    }
    
    console.log('❌ Structured parse failed - pattern not found');
    return { success: false };
  } catch (error) {
    console.error('Structured parse failed:', error);
    return { success: false };
  }
}

function parseConversationalResponse(response) {
  try {
    console.log('🔍 Parsing conversational response...');
    
    // Cari bagian yang dipisahkan oleh ---
    const sections = response.split('---').filter(s => s.trim());
    
    if (sections.length >= 2) {
      const description = sections[0].trim();
      
      // Cari JSON di section metadata
      const jsonMatch = sections[1].match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let metadataText = jsonMatch[0].trim();
        metadataText = fixTruncatedJSON(metadataText);
        const metadata = JSON.parse(metadataText);
        
        console.log('✅ Conversational parse successful');
        return {
          success: true,
          result: { 
            description, 
            metadata: normalizeEmptyMetadata(metadata) 
          }
        };
      }
    }
    
    console.log('❌ Conversational parse failed - sections not found');
    return { success: false };
  } catch (error) {
    console.error('Conversational parse failed:', error);
    return { success: false };
  }
}

function parseJSONResponse(response) {
  try {
    console.log('🔍 Parsing direct JSON response...');
    
    // Cari JSON object
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonText = jsonMatch[0].trim();
      jsonText = fixTruncatedJSON(jsonText);
      const data = JSON.parse(jsonText);
      
      if (data.description && data.key_themes !== undefined) {
        const { description, ...metadata } = data;
        
        console.log('✅ Direct JSON parse successful');
        return {
          success: true, 
          result: { 
            description: description.trim(), 
            metadata: normalizeEmptyMetadata(metadata) 
          }
        };
      }
    }
    
    console.log('❌ Direct JSON parse failed - valid JSON not found');
    return { success: false };
  } catch (error) {
    console.error('JSON parse failed:', error);
    return { success: false };
  }
}

// UPDATE normalizeEmptyMetadata untuk handle case ini
function normalizeEmptyMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return createEmptyMetadata();
  }
  
  const normalized = {
    key_themes: Array.isArray(metadata.key_themes) ? metadata.key_themes : [],
    geographic_focus: Array.isArray(metadata.geographic_focus) ? metadata.geographic_focus : [],
    historical_period: Array.isArray(metadata.historical_period) ? metadata.historical_period : [],
    content_type: metadata.content_type && metadata.content_type !== '' ? metadata.content_type : '',
    subject_categories: Array.isArray(metadata.subject_categories) ? metadata.subject_categories : [],
    temporal_coverage: validateTemporalFormat(metadata.temporal_coverage),
    is_empty: false,
    ai_failed: false
  };
  
  return normalized;
}

// IMPROVE TEMPORAL COVERAGE HANDLING
function validateTemporalFormat(temporal) {
  if (!temporal || temporal === '') return '';
  
  const temporalLower = temporal.toLowerCase();
  
  // Handle various formats
  if (temporalLower.includes('pertengahan abad ke-19') || temporalLower.includes('mid-19th')) {
    return '1830-1870';
  }
  if (temporalLower.includes('awal abad ke-19') || temporalLower.includes('early 19th')) {
    return '1800-1830';
  }
  if (temporalLower.includes('akhir abad ke-19') || temporalLower.includes('late 19th')) {
    return '1870-1900';
  }
  if (temporalLower.includes('abad ke-19') || temporalLower.includes('19th century')) {
    return '1800-1899';
  }
  
  // Single year
  const singleYearPattern = /^\d{4}$/;
  if (singleYearPattern.test(temporal)) {
    return `${temporal}-${temporal}`;
  }
  
  // Year range
  const yearRangePattern = /^\d{4}-\d{4}$/;
  if (yearRangePattern.test(temporal)) {
    return temporal;
  }
  
  return ''; // Unknown format
}

function createEmptyMetadata() {
  return {
    key_themes: [],
    geographic_focus: [],
    historical_period: [],
    content_type: '',
    subject_categories: [],
    temporal_coverage: '',
    is_empty: true,
    ai_failed: true
  };
}

// EMPTY OUTPUT (when all attempts fail)
function createEmptyOutput(title, author, year, currentDescription) {
  return {
    description: currentDescription || `Buku "${title}" ${author ? `karya ${author}` : ''} ${year ? `(${year})` : ''}.`,
    metadata: createEmptyMetadata()
  };
}

// FIX TRUNCATED JSON
function fixTruncatedJSON(jsonText) {
  if (!jsonText) return '{}';
  
  let fixed = jsonText.trim();

  // Simple approach: add missing closing braces/brackets
  let openBraces = (fixed.match(/{/g) || []).length;
  let closeBraces = (fixed.match(/}/g) || []).length;
  let openBrackets = (fixed.match(/\[/g) || []).length;
  let closeBrackets = (fixed.match(/\]/g) || []).length;

  // Add missing closing braces
  while (openBraces > closeBraces) {
    fixed += '}';
    closeBraces++;
  }

  // Add missing closing brackets
  while (openBrackets > closeBrackets) {
    fixed += ']';
    closeBrackets++;
  }

  // Remove trailing commas
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');

  return fixed;
}