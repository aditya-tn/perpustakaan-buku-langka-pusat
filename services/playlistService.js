// services/playlistService.js - CORE DATABASE OPERATIONS
import { supabase } from '../lib/supabase';

export const playlistService = {
  // ========================
  // BASIC CRUD OPERATIONS
  // ========================
  
  /**
   * Create new playlist di Supabase
   */
  createPlaylist: async (playlistData) => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .insert([{
          ...playlistData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase create error:', error);
        throw new Error(`Gagal membuat playlist: ${error.message}`);
      }

      console.log('✅ Playlist created in Supabase:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error in createPlaylist:', error);
      throw error;
    }
  },

  /**
   * Get all playlists dari Supabase
   */
  getPlaylists: async (options = {}) => {
    try {
      const { limit = 100, offset = 0, userId = null, onlyPublic = true } = options;
      
      let query = supabase
        .from('community_playlists')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by user jika provided
      if (userId) {
        query = query.eq('created_by', userId);
      }

      // Filter public only jika needed
      if (onlyPublic) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        throw new Error(`Gagal mengambil playlist: ${error.message}`);
      }

      console.log('✅ Playlists fetched from Supabase:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getPlaylists:', error);
      throw error;
    }
  },

  /**
   * Get single playlist by ID
   */
  getPlaylistById: async (playlistId) => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        throw new Error(`Gagal mengambil playlist: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in getPlaylistById:', error);
      throw error;
    }
  },

  /**
   * Update playlist di Supabase
   */
  updatePlaylist: async (playlistId, updates) => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', playlistId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw new Error(`Gagal update playlist: ${error.message}`);
      }

      console.log('✅ Playlist updated in Supabase:', playlistId);
      return data;
    } catch (error) {
      console.error('❌ Error in updatePlaylist:', error);
      throw error;
    }
  },

  /**
   * Delete playlist dari Supabase
   */
  deletePlaylist: async (playlistId) => {
    try {
      const { error } = await supabase
        .from('community_playlists')
        .delete()
        .eq('id', playlistId);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw new Error(`Gagal menghapus playlist: ${error.message}`);
      }

      console.log('✅ Playlist deleted from Supabase:', playlistId);
      return true;
    } catch (error) {
      console.error('❌ Error in deletePlaylist:', error);
      throw error;
    }
  },

    // ========================
    // AI SCORE MANAGEMENT
    // ========================
  
    /**
     * Save AI match score untuk buku di playlist
     */
    saveAIMatchScore: async (playlistId, bookId, analysis) => {
      try {
        const { data, error } = await supabase.rpc('update_ai_match_score', {
          playlist_id: playlistId,
          book_id: bookId,
          match_score: analysis.matchScore,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning
        });
  
        if (error) {
          console.error('❌ Supabase RPC error for AI score:', error);
          // Fallback: manual update
          return await playlistService._manualAIScoreUpdate(playlistId, bookId, analysis);
        }
  
        console.log('✅ AI match score saved:', { playlistId, bookId, score: analysis.matchScore });
        return data;
  
      } catch (error) {
        console.error('❌ Error saving AI score:', error);
        throw error;
      }
    },
  
    /**
     * Manual fallback untuk AI score update
     */
    _manualAIScoreUpdate: async (playlistId, bookId, analysis) => {
      try {
        // Get current playlist
        const playlist = await playlistService.getPlaylistById(playlistId);
        const currentScores = playlist.ai_match_scores || {};
  
        // Update scores
        const updatedScores = {
          ...currentScores,
          [bookId]: {
            matchScore: analysis.matchScore,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            analyzedAt: new Date().toISOString()
          }
        };
  
        // Update playlist
        const { data, error } = await supabase
          .from('community_playlists')
          .update({ 
            ai_match_scores: updatedScores,
            updated_at: new Date().toISOString()
          })
          .eq('id', playlistId)
          .select()
          .single();
  
        if (error) throw error;
        return data;
  
      } catch (error) {
        console.error('❌ Manual AI score update failed:', error);
        throw error;
      }
    },
  
    /**
     * Get AI match score untuk buku di playlist
     */
    getAIMatchScore: async (playlistId, bookId) => {
      try {
        const playlist = await playlistService.getPlaylistById(playlistId);
        const scores = playlist.ai_match_scores || {};
        return scores[bookId] || null;
      } catch (error) {
        console.error('❌ Error getting AI score:', error);
        return null;
      }
    },
  
    /**
     * Get all AI scores untuk playlist
     */
    getAllAIScores: async (playlistId) => {
      try {
        const playlist = await playlistService.getPlaylistById(playlistId);
        return playlist.ai_match_scores || {};
      } catch (error) {
        console.error('❌ Error getting all AI scores:', error);
        return {};
      }
    }
  };
  
  // ========================
  // BOOK MANAGEMENT
  // ========================

  /**
   * Add book to playlist
   */
  addBookToPlaylist: async (playlistId, book) => {
    try {
      // First get current playlist
      const { data: playlist, error: fetchError } = await supabase
        .from('community_playlists')
        .select('books')
        .eq('id', playlistId)
        .single();

      if (fetchError) throw fetchError;

      // Check if book already exists
      const bookExists = playlist.books.some(b => b.id === book.id);
      if (bookExists) {
        throw new Error('Buku sudah ada dalam playlist ini');
      }

      // Add book to playlist
      const updatedBooks = [...playlist.books, {
        ...book,
        added_at: new Date().toISOString(),
        // Denormalized data untuk performance
        _denormalized: true
      }];

      // Update playlist
      const { data, error } = await supabase
        .from('community_playlists')
        .update({ 
          books: updatedBooks,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Book added to playlist:', { playlistId, bookId: book.id });
      return data;
    } catch (error) {
      console.error('❌ Error in addBookToPlaylist:', error);
      throw error;
    }
  },

  /**
   * Remove book from playlist
   */
  removeBookFromPlaylist: async (playlistId, bookId) => {
    try {
      // First get current playlist
      const { data: playlist, error: fetchError } = await supabase
        .from('community_playlists')
        .select('books')
        .eq('id', playlistId)
        .single();

      if (fetchError) throw fetchError;

      // Filter out the book
      const updatedBooks = playlist.books.filter(book => book.id !== bookId);

      // Update playlist
      const { data, error } = await supabase
        .from('community_playlists')
        .update({ 
          books: updatedBooks,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Book removed from playlist:', { playlistId, bookId });
      return data;
    } catch (error) {
      console.error('❌ Error in removeBookFromPlaylist:', error);
      throw error;
    }
  },

  // ========================
  // ENHANCED FEATURES
  // ========================

  /**
   * Like a playlist
   */
likePlaylist: async (playlistId) => {
  try {
    const { data, error } = await supabase.rpc('increment_like_count', {
      playlist_id: playlistId
    });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      // Fallback: manual update
      return await playlistService._manualIncrement(playlistId, 'like_count');
    }

    console.log('✅ Playlist liked:', playlistId, 'New count:', data?.like_count);
    return data;
  } catch (error) {
    console.error('❌ Error in likePlaylist:', error);
    throw error;
  }
},

/**
 * Track playlist view - UPDATED FOR NEW RPC
 */
trackView: async (playlistId) => {
  try {
    const { data, error } = await supabase.rpc('increment_view_count', {
      playlist_id: playlistId
    });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      // Fallback: manual update
      return await playlistService._manualIncrement(playlistId, 'view_count');
    }

    console.log('✅ Playlist view tracked:', playlistId, 'New count:', data?.view_count);
    return data;
  } catch (error) {
    console.error('❌ Error in trackView:', error);
    // Don't throw error for analytics tracking
    return null;
  }
},

/**
 * Report playlist - UPDATED FOR NEW RPC
 */
reportPlaylist: async (playlistId) => {
  try {
    const { data, error } = await supabase.rpc('increment_report_count', {
      playlist_id: playlistId
    });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      // Fallback: manual update
      return await playlistService._manualIncrement(playlistId, 'report_count');
    }

    console.log('✅ Playlist reported:', playlistId, 'New count:', data?.report_count);
    return data;
  } catch (error) {
    console.error('❌ Error in reportPlaylist:', error);
    throw error;
  }
},

  // ========================
  // SEARCH & DISCOVERY
  // ========================

  /**
   * Search playlists by name or description
   */
  searchPlaylists: async (query, options = {}) => {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error in searchPlaylists:', error);
      throw error;
    }
  },

  /**
   * Get popular playlists
   */
  getPopularPlaylists: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('is_public', true)
        .order('like_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error in getPopularPlaylists:', error);
      throw error;
    }
  },

  /**
   * Get user's playlists
   */
  getUserPlaylists: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserPlaylists:', error);
      throw error;
    }
  },

  // ========================
  // HELPER FUNCTIONS
  // ========================

  /**
   * Manual increment fallback jika RPC tidak ada
   */
  _manualIncrement: async (playlistId, field) => {
    try {
      // Get current value
      const { data: playlist } = await playlistService.getPlaylistById(playlistId);
      const currentValue = playlist[field] || 0;
      
      // Increment manually
      const updates = { [field]: currentValue + 1 };
      return await playlistService.updatePlaylist(playlistId, updates);
    } catch (error) {
      console.error('❌ Error in manual increment:', error);
      throw error;
    }
  },

  /**
   * Health check - test connection to Supabase
   */
  healthCheck: async () => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .select('count')
        .limit(1);

      return {
        healthy: !error,
        message: error ? `Database error: ${error.message}` : 'Database connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Connection failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
};
