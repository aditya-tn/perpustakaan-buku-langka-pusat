// services/playlistMetadataService.js
import { supabase } from '../lib/supabase';
import { generateAIResponse } from '../lib/gemini'; // Pastikan ini ada

export const playlistMetadataService = {
  
  async generateAndStorePlaylistMetadata(playlistId) {
    try {
      console.log(`🔄 Generating AI metadata for playlist: ${playlistId}`);
      
      // 1. Get playlist data dari Supabase
      const { data: playlist, error: fetchError } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (fetchError) throw new Error(`Failed to fetch playlist: ${fetchError.message}`);
      if (!playlist) throw new Error('Playlist not found');

      // 2. Generate AI metadata
      const metadata = await this.generateAIMetadata(playlist);
      
      // 3. Save langsung ke Supabase
      const { error: updateError } = await supabase
        .from('community_playlists')
        .update({
          ai_metadata: metadata,
          historical_names: metadata.historical_names,
          key_themes: metadata.key_themes,
          geographical_focus: metadata.geographical_focus,
          time_period: metadata.time_period,
          accuracy_reasoning: metadata.accuracy_reasoning,
          metadata_generated_at: new Date().toISOString(),
          metadata_version: (playlist.metadata_version || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId);

      if (updateError) throw new Error(`Failed to save metadata: ${updateError.message}`);
      
      console.log(`✅ AI metadata saved for playlist: ${playlist.name}`);
      return metadata;
      
    } catch (error) {
      console.error('❌ Failed to generate playlist metadata:', error);
      throw error;
    }
  },

// services/playlistMetadataService.js - UPDATE prompt
async generateAIMetadata(playlist) {
  const prompt = `
ANALISIS PLAYLIST: "${playlist.name}"
DESKRIPSI: "${playlist.description || 'Tidak ada deskripsi'}"

INSTRUKSI: Berikan metadata JSON untuk matching buku sejarah.
FORMAT:
{
  "historical_names": ["max 3 nama"],
  "modern_equivalents": ["max 2 nama"], 
  "key_themes": ["max 3 tema"],
  "geographical_focus": ["max 2 region"],
  "time_period": "singkat",
  "keywords": ["max 5 kata kunci"],
  "accuracy_reasoning": "1 kalimat singkat"
}

CONTOH:
{
  "historical_names": ["Hindia Belanda", "VOC"],
  "modern_equivalents": ["Indonesia"],
  "key_themes": ["sejarah", "kolonial"],
  "geographical_focus": ["Jawa", "Sumatra"],
  "time_period": "1800-1945",
  "keywords": ["sejarah", "kolonial", "belanda"],
  "accuracy_reasoning": "Relevan untuk buku sejarah Indonesia masa kolonial"
}

Hanya JSON.
  `.trim();

  try {
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.1,
      maxTokens: 400 // 🆪 KURANGI TOKENS
    });

    console.log('✅ AI Response received (length:', aiResponse?.length, ')');
    return this.parseAIMetadata(aiResponse, playlist);
    
  } catch (error) {
    console.error('❌ AI metadata generation failed:', error);
    return this.getFallbackMetadata(playlist);
  }
},

// services/playlistMetadataService.js - PERBAIKI parseAIMetadata method
parseAIMetadata(aiResponse, playlist) {
  try {
    console.log('📝 Raw AI response:', aiResponse);
    
    // 🆪 ENHANCED CLEANING untuk handle truncated responses
    let cleanResponse = aiResponse.trim();
    
    // Remove code blocks
    cleanResponse = cleanResponse.replace(/```json|```/g, '');
    
    // 🆪 EXTRACT JSON object dari response yang terpotong
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }
    
    // 🆪 COMPLETE INCOMPLETE JSON jika diperlukan
    if (!cleanResponse.endsWith('}')) {
      // Cari closing bracket terakhir
      const lastBracket = cleanResponse.lastIndexOf('}');
      if (lastBracket !== -1) {
        cleanResponse = cleanResponse.substring(0, lastBracket + 1);
      } else {
        // Jika tidak ada closing bracket, tambahkan
        cleanResponse += '}';
      }
    }
    
    // 🆪 FIX UNTERMINATED STRINGS
    cleanResponse = this.fixUnterminatedJSON(cleanResponse);
    
    console.log('🧹 Cleaned AI response:', cleanResponse);
    
    const parsed = JSON.parse(cleanResponse);
    
    // 🆪 VALIDATE REQUIRED FIELDS
    return {
      historical_names: this.sanitizeArray(parsed.historical_names || []),
      modern_equivalents: this.sanitizeArray(parsed.modern_equivalents || []),
      key_themes: this.sanitizeArray(parsed.key_themes || []),
      geographical_focus: this.sanitizeArray(parsed.geographical_focus || []),
      time_period: parsed.time_period?.toString() || '',
      keywords: this.sanitizeArray(parsed.keywords || []),
      accuracy_reasoning: parsed.accuracy_reasoning?.toString() || 
        `AI-enhanced metadata untuk "${playlist.name}"`,
      generated_at: new Date().toISOString(),
      version: 1
    };
    
  } catch (error) {
    console.error('❌ Failed to parse AI metadata:', error);
    console.log('📝 Failed response was:', aiResponse);
    
    // 🆪 FALLBACK: Extract data dari truncated response
    return this.extractFromTruncatedResponse(aiResponse, playlist);
  }
},

// 🆪 METHOD BARU: Fix unterminated JSON strings
fixUnterminatedJSON(jsonString) {
  let fixed = jsonString;
  
  // Count quotes untuk detect unterminated strings
  const quoteCount = (fixed.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // Jika jumlah quote ganjil, tambahkan closing quote di akhir
    if (!fixed.endsWith('"')) {
      fixed += '"';
    }
  }
  
  // Fix common truncation patterns
  fixed = fixed.replace(/"keywords":\s*\[[^\]]*$/, '"keywords": []');
  fixed = fixed.replace(/"historical_names":\s*\[[^\]]*$/, '"historical_names": []');
  fixed = fixed.replace(/"key_themes":\s*\[[^\]]*$/, '"key_themes": []');
  fixed = fixed.replace(/"accuracy_reasoning":\s*"[^"]*$/, '"accuracy_reasoning": "AI analysis completed"');
  
  return fixed;
},

// 🆪 METHOD BARU: Extract data dari truncated response
extractFromTruncatedResponse(aiResponse, playlist) {
  console.log('🔄 Attempting to extract from truncated response...');
  
  const extracted = {
    historical_names: [],
    modern_equivalents: [],
    key_themes: [],
    geographical_focus: [],
    time_period: '',
    keywords: [],
    accuracy_reasoning: `Partial AI metadata untuk "${playlist.name}" - response terpotong`,
    generated_at: new Date().toISOString(),
    version: 1,
    is_partial: true
  };
  
  try {
    // Extract dari response yang terpotong
    const response = aiResponse.toLowerCase();
    
    // Extract historical names
    const historicalMatch = response.match(/"historical_names":\s*\[([^\]]*)/);
    if (historicalMatch) {
      const names = historicalMatch[1].split(',').map(name => 
        name.replace(/"/g, '').trim()
      ).filter(name => name.length > 0);
      extracted.historical_names = names;
    }
    
    // Extract key themes
    const themesMatch = response.match(/"key_themes":\s*\[([^\]]*)/);
    if (themesMatch) {
      const themes = themesMatch[1].split(',').map(theme => 
        theme.replace(/"/g, '').trim()
      ).filter(theme => theme.length > 0);
      extracted.key_themes = themes;
    }
    
    // Extract keywords
    const keywordsMatch = response.match(/"keywords":\s*\[([^\]]*)/);
    if (keywordsMatch) {
      const keywords = keywordsMatch[1].split(',').map(keyword => 
        keyword.replace(/"/g, '').trim()
      ).filter(keyword => keyword.length > 0);
      extracted.keywords = keywords;
    }
    
    console.log('✅ Extracted from truncated response:', extracted);
    
  } catch (extractError) {
    console.error('❌ Extraction failed:', extractError);
  }
  
  return extracted;
},

  sanitizeArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => 
      item && typeof item === 'string' && item.trim().length > 0
    ).map(item => item.trim().toLowerCase());
  },

// Di services/playlistMetadataService.js - getFallbackMetadata()
getFallbackMetadata(playlist) {
  // Fallback berdasarkan nama playlist
  const name = playlist.name.toLowerCase();
  
  const fallbackThemes = {
    'sejarah': ['sejarah', 'historis', 'masa lalu'],
    'biografi': ['biografi', 'tokoh', 'riwayat hidup'],
    'sumatra': ['sumatra', 'sumatera', 'regional'],
    'tni': ['militer', 'tentara', 'perang'],
    'kereta': ['transportasi', 'kereta', 'perhubungan'],
    'budaya': ['budaya', 'seni', 'tradisi']
  };

  const themes = [];
  for (const [key, theme] of Object.entries(fallbackThemes)) {
    if (name.includes(key)) themes.push(...theme);
  }

  return {
    historical_names: [],
    modern_equivalents: [],
    key_themes: themes.length > 0 ? themes : ['umum'],
    geographical_focus: [],
    time_period: '',
    keywords: themes,
    accuracy_reasoning: `Basic metadata - akan ditingkatkan dengan AI analysis`, // 🆪 PERBAIKAN WORDING
    generated_at: new Date().toISOString(),
    version: 0,
    is_fallback: true // 🆪 TANDAI SEBAGAI FALLBACK
  };
},

  // 🎯 GET playlist dengan metadata (jika belum ada, generate)
  async getEnhancedPlaylist(playlistId) {
    try {
      const { data: playlist, error } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (error) throw error;
      
      // Jika metadata belum ada atau outdated, generate baru
      const shouldRegenerate = !playlist.ai_metadata || 
                              !playlist.metadata_generated_at ||
                              Object.keys(playlist.ai_metadata).length === 0;

      if (shouldRegenerate) {
        console.log(`🔄 Generating missing metadata for: ${playlist.name}`);
        await this.generateAndStorePlaylistMetadata(playlistId);
        
        // Get fresh data setelah update
        const { data: updatedPlaylist } = await supabase
          .from('community_playlists')
          .select('*')
          .eq('id', playlistId)
          .single();
          
        return updatedPlaylist;
      }
      
      return playlist;
      
    } catch (error) {
      console.error('❌ Error getting enhanced playlist:', error);
      throw error;
    }
  },

  // 🎯 BATCH generate untuk semua playlist
  async generateAllPlaylistsMetadata() {
    try {
      const { data: playlists, error } = await supabase
        .from('community_playlists')
        .select('id, name, description, metadata_generated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`🔄 Generating metadata for ${playlists.length} playlists...`);
      
      const results = [];
      for (const playlist of playlists) {
        try {
          const metadata = await this.generateAndStorePlaylistMetadata(playlist.id);
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: true, 
            metadata 
          });
          console.log(`✅ Generated metadata for: ${playlist.name}`);
        } catch (error) {
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: false, 
            error: error.message 
          });
          console.error(`❌ Failed for: ${playlist.name}`, error.message);
        }
        
        // Delay untuk avoid rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error in batch generation:', error);
      throw error;
    }
  },

  // 🎯 GET semua playlist dengan metadata
  async getAllEnhancedPlaylists() {
    try {
      const { data: playlists, error } = await supabase
        .from('community_playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check jika ada yang perlu metadata
      const needsMetadata = playlists.filter(p => 
        !p.ai_metadata || !p.metadata_generated_at
      );

      if (needsMetadata.length > 0) {
        console.log(`🔄 ${needsMetadata.length} playlists need metadata generation`);
      }

      return playlists;
    } catch (error) {
      console.error('❌ Error getting enhanced playlists:', error);
      throw error;
    }
  }
};