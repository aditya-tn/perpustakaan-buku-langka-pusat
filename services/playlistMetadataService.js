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
  // TENTUKAN JENIS KONTEN DULU
  const contentType = this.determineContentType(playlist);
  
  const prompt = this.getContextAwarePrompt(playlist, contentType);
  
  try {
    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.1,
      maxTokens: 600
    });
    
    return this.parseContextAwareMetadata(aiResponse, playlist, contentType);
  } catch (error) {
    return this.getContextAwareFallback(playlist, contentType);
  }
},

// TENTUKAN JENIS KONTEN
determineContentType(playlist) {
  const name = playlist.name.toLowerCase();
  const description = playlist.description?.toLowerCase() || '';
  const text = name + ' ' + description;
  
  if (text.includes('puisi') || text.includes('sastra') || text.includes('puisi')) {
    return 'literature';
  }
  if (text.includes('biografi') || text.includes('tokoh') || text.includes('pahlawan')) {
    return 'biography';
  }
  if (text.includes('seni') || text.includes('budaya') || text.includes('kesenian')) {
    return 'art_culture';
  }
  if (text.includes('sejarah') || text.includes('kolonial') || text.includes('perang')) {
    return 'history';
  }
  if (text.includes('militer') || text.includes('tni') || text.includes('knil')) {
    return 'military_history';
  }
  
  return 'general';
},

// PROMPT BERDASARKAN JENIS KONTEN
getContextAwarePrompt(playlist, contentType) {
  const basePrompt = `
PLAYLIST: "${playlist.name}"
DESCRIPTION: "${playlist.description || 'No description'}"
CONTENT TYPE: ${contentType}

INSTRUCTIONS: Provide metadata suitable for this content type.
  `;
  
  const typeSpecificPrompts = {
    literature: `
${basePrompt}
FOCUS ON: literary genres, themes, styles, authors
OUTPUT FIELDS:
- literary_genres: ["puisi", "prosa", "esai", etc.]
- key_themes: ["cinta", "perjuangan", "alam", etc.] 
- time_period: "sastrawan period"
- authors: ["relevant authors"]
- literary_movements: ["angkatan", "aliran"]
SKIP: historical_names, geographical_focus
    `,
    
    art_culture: `
${basePrompt}
FOCUS ON: art forms, cultural aspects, traditions
OUTPUT FIELDS:
- art_forms: ["seni rupa", "musik", "tari", etc.]
- cultural_themes: ["tradisi", "modern", "kontemporer"]
- regions: ["optional cultural regions"]
- time_period: "cultural period"
- cultural_movements: ["aliran seni"]
SKIP: historical_names, military_context
    `,
    
    biography: `
${basePrompt} 
FOCUS ON: person profiles, historical context, achievements
OUTPUT FIELDS:
- historical_names: ["person names", "organizations"]
- key_themes: ["perjuangan", "kepemimpinan", "prestasi"]
- time_period: "lifetime period"
- geographical_focus: ["birthplace", "work locations"]
- occupations: ["politician", "artist", "military"]
    `,
    
    military_history: `
${basePrompt}
FOCUS ON: military units, conflicts, historical context  
OUTPUT FIELDS:
- historical_names: ["KNIL", "VOC", "TNI", etc.]
- key_themes: ["militer", "perang", "strategi", "kolonial"]
- geographical_focus: ["battle locations", "regions"]
- time_period: "specific war/conflict period"
- military_units: ["specific units"]
- conflicts: ["war names"]
    `,
    
    history: `
${basePrompt}
FOCUS ON: historical events, periods, contexts
OUTPUT FIELDS:
- historical_names: ["Hindia Belanda", "VOC", etc.]
- key_themes: ["kolonial", "perjuangan", "politik"]
- geographical_focus: ["historical regions"] 
- time_period: "historical period"
- historical_events: ["relevant events"]
    `,
    
    general: `
${basePrompt}
OUTPUT FIELDS:
- key_themes: ["general themes"]
- content_category: "general category"
- relevance_tags: ["general tags"]
SKIP: historical_names, geographical_focus, time_period
    `
  };
  
  return (typeSpecificPrompts[contentType] || typeSpecificPrompts.general).trim();
},

// PARSING BERDASARKAN JENIS KONTEN
parseContextAwareMetadata(aiResponse, playlist, contentType) {
  try {
    const cleanResponse = aiResponse.trim().replace(/```json|```/g, '');
    const parsed = JSON.parse(cleanResponse);
    
    // BASE METADATA UNTUK SEMUA JENIS
    const baseMetadata = {
      content_type: contentType,
      generated_at: new Date().toISOString(),
      version: 1
    };
    
    // TAMBAH FIELD SPESIFIK BERDASARKAN JENIS
    const typeSpecificFields = {
      literature: {
        literary_genres: parsed.literary_genres || [],
        key_themes: parsed.key_themes || [],
        authors: parsed.authors || [],
        literary_movements: parsed.literary_movements || [],
        // JANGAN include historical/geographic fields
      },
      
      art_culture: {
        art_forms: parsed.art_forms || [],
        cultural_themes: parsed.cultural_themes || [],
        regions: parsed.regions || [],
        cultural_movements: parsed.cultural_movements || [],
        // JANGAN include historical names
      },
      
      biography: {
        historical_names: parsed.historical_names || [],
        key_themes: parsed.key_themes || [],
        time_period: parsed.time_period || '',
        geographical_focus: parsed.geographical_focus || [],
        occupations: parsed.occupations || []
      },
      
      military_history: {
        historical_names: parsed.historical_names || [],
        key_themes: parsed.key_themes || [],
        geographical_focus: parsed.geographical_focus || [],
        time_period: parsed.time_period || '',
        military_units: parsed.military_units || [],
        conflicts: parsed.conflicts || []
      },
      
      history: {
        historical_names: parsed.historical_names || [],
        key_themes: parsed.key_themes || [],
        geographical_focus: parsed.geographical_focus || [],
        time_period: parsed.time_period || '',
        historical_events: parsed.historical_events || []
      }
    };
    
    return {
      ...baseMetadata,
      ...(typeSpecificFields[contentType] || {}),
      // Fallback untuk field umum
      key_themes: parsed.key_themes || [],
      accuracy_reasoning: parsed.accuracy_reasoning || `Metadata untuk ${contentType}`
    };
    
  } catch (error) {
    console.error('Context-aware parse failed:', error);
    return this.getContextAwareFallback(playlist, contentType);
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