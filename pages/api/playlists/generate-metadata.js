// pages/api/playlists/generate-metadata.js - COMPLETE FIXED VERSION
import { playlistMetadataService } from '../../../services/playlistMetadataService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playlistId, generateAll = false, fillMissing = false, upgradeBasic = false } = req.body;

    console.log('🔄 Metadata generation request:', { 
      playlistId, 
      generateAll, 
      fillMissing, 
      upgradeBasic 
    });

    // 🆕 OPTION BARU: Upgrade Basic ke AI Enhanced
    if (upgradeBasic) {
      console.log('🚀 Starting UPGRADE BASIC process...');
      const { supabase } = await import('../../../lib/supabase');
      
      const { data: playlists, error } = await supabase
        .from('community_playlists')
        .select('id, name, ai_metadata')
        .not('metadata_generated_at', 'is', null)
        .not('ai_metadata', 'is', null);

      if (error) {
        console.error('❌ Supabase error in upgradeBasic:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Filter hanya yang is_fallback = true
      const basicPlaylists = playlists?.filter(p => 
        p.ai_metadata && p.ai_metadata.is_fallback
      ) || [];

      console.log(`🔄 Upgrading ${basicPlaylists.length} basic playlists to AI Enhanced...`);
      
      const results = [];
      for (const [index, playlist] of basicPlaylists.entries()) {
        try {
          console.log(`📝 Upgrading ${index + 1}/${basicPlaylists.length}: ${playlist.name}`);
          
          // 🆪 PASTIKAN SERVICE TERDEFINISI
          if (!playlistMetadataService || typeof playlistMetadataService.generateAndStorePlaylistMetadata !== 'function') {
            throw new Error('playlistMetadataService not properly imported');
          }

          const metadata = await playlistMetadataService.generateAndStorePlaylistMetadata(playlist.id);
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: true,
            upgraded: true
          });
          console.log(`✅ Upgraded: ${playlist.name}`);
        } catch (error) {
          console.error(`❌ Upgrade failed: ${playlist.name}`, error.message);
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: false, 
            error: error.message 
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('🎉 Upgrade Basic completed!');
      return res.json({
        success: true,
        message: `Upgraded ${results.filter(r => r.success).length} playlists to AI Enhanced`,
        data: results
      });
    }

    // 🆕 OPTION: Fill missing metadata untuk semua playlist yang belum punya
    if (fillMissing) {
      console.log('⚡ Starting FILL MISSING process...');
      const { supabase } = await import('../../../lib/supabase');
      
      const { data: playlists, error } = await supabase
        .from('community_playlists')
        .select('id, name, metadata_generated_at')
        .is('metadata_generated_at', null); // Hanya yang belum ada metadata

      if (error) {
        console.error('❌ Supabase error in fillMissing:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`🔄 Filling metadata for ${playlists?.length || 0} playlists...`);
      
      const results = [];
      for (const [index, playlist] of (playlists || []).entries()) {
        try {
          console.log(`📝 Processing ${index + 1}/${playlists.length}: ${playlist.name}`);
          
          if (!playlistMetadataService) {
            throw new Error('playlistMetadataService not available');
          }

          const metadata = await playlistMetadataService.generateAndStorePlaylistMetadata(playlist.id);
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: true 
          });
          console.log(`✅ Generated metadata for: ${playlist.name}`);
        } catch (error) {
          console.error(`❌ Failed for: ${playlist.name}`, error.message);
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: false, 
            error: error.message 
          });
        }
        
        // Delay untuk avoid rate limit
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      console.log('🎉 Fill Missing completed!');
      return res.json({
        success: true,
        message: `Filled metadata for ${results.filter(r => r.success).length} playlists`,
        data: results
      });
    }

    // 🆕 OPTION: Generate semua metadata (override existing)
    if (generateAll) {
      console.log('🔄 Starting REGENERATE ALL process...');
      const { supabase } = await import('../../../lib/supabase');
      
      const { data: playlists, error } = await supabase
        .from('community_playlists')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error in generateAll:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`🔄 Regenerating metadata for ${playlists?.length || 0} playlists...`);
      
      const results = [];
      for (const [index, playlist] of (playlists || []).entries()) {
        try {
          console.log(`📝 Processing ${index + 1}/${playlists.length}: ${playlist.name}`);
          
          if (!playlistMetadataService) {
            throw new Error('playlistMetadataService not available');
          }

          const metadata = await playlistMetadataService.generateAndStorePlaylistMetadata(playlist.id);
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: true 
          });
          console.log(`✅ Regenerated: ${playlist.name}`);
        } catch (error) {
          console.error(`❌ Regenerate failed: ${playlist.name}`, error.message);
          results.push({ 
            playlistId: playlist.id, 
            playlistName: playlist.name,
            success: false, 
            error: error.message 
          });
        }
        
        // Delay untuk avoid rate limit
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      console.log('🎉 Regenerate All completed!');
      return res.json({
        success: true,
        message: `Regenerated metadata for ${results.filter(r => r.success).length} playlists`,
        data: results
      });
    }

    // 🆕 OPTION: Generate untuk single playlist
    if (playlistId) {
      console.log(`🎯 Generating metadata for single playlist: ${playlistId}`);
      
      try {
        // 🆪 PASTIKAN SERVICE TERLOAD
        if (!playlistMetadataService) {
          throw new Error('playlistMetadataService not available');
        }

        const metadata = await playlistMetadataService.generateAndStorePlaylistMetadata(playlistId);
        
        console.log(`✅ Successfully generated metadata for playlist: ${playlistId}`);
        
        return res.json({
          success: true,
          data: metadata,
          message: 'Playlist metadata generated and saved to Supabase'
        });

      } catch (error) {
        console.error(`❌ Single playlist generation failed for ${playlistId}:`, error);
        return res.status(500).json({ 
          success: false,
          error: error.message,
          details: 'Failed to generate playlist metadata'
        });
      }
    }

    // Jika tidak ada parameter yang valid
    console.error('❌ No valid parameters provided');
    return res.status(400).json({
      success: false,
      error: 'No valid parameters provided. Use: playlistId, generateAll, fillMissing, or upgradeBasic'
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: 'Failed to generate playlist metadata',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}