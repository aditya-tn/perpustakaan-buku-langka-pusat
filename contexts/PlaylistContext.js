// contexts/PlaylistContext.js - FIXED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PlaylistContext = createContext();

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null); // 🆕 TAMBAH INI

  // 🆕 FUNCTION UNTUK DAPATKAN/GENERATE USER ID
  const getOrCreateUserId = () => {
    // Coba dapatkan dari localStorage
    let storedUserId = localStorage.getItem('playlist_user_id');
    
    if (!storedUserId) {
      // Generate new user ID jika tidak ada
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('playlist_user_id', storedUserId);
    }
    
    return storedUserId;
  };

  // Load playlists dan setup user
  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading playlists from Supabase...');
      
      // 🆕 SET USER ID SEBELUM LOAD
      const currentUserId = getOrCreateUserId();
      setUserId(currentUserId);

      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log(`✅ Playlists loaded: ${data?.length || 0} playlists`);
      setPlaylists(data || []);
    } catch (err) {
      console.error('❌ Error loading playlists:', err);
      setError(err.message);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new playlist - PERBAIKI VALIDASI
  const createPlaylist = async (playlistData) => {
    try {
      // 🆕 GUNAKAN USER ID YANG SUDAH DISIAPKAN
      const currentUserId = getOrCreateUserId();
      
      console.log('🎯 Creating playlist with data:', {
        ...playlistData,
        created_by: currentUserId
      });

      const { data, error } = await supabase
        .from('community_playlists')
        .insert([{
          ...playlistData,
          created_by: currentUserId, // 🆕 PASTIKAN ADA
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ai_match_scores: {},
          is_public: true // 🆕 DEFAULT PUBLIC
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPlaylists(prev => [data, ...prev]);
      
      console.log('✅ Playlist created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating playlist:', error);
      return { success: false, error: error.message };
    }
  };

  // Load playlists ketika component mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Add book to playlist
  const addToPlaylist = async (playlistId, book) => {
    try {
      // First get current playlist
      const { data: playlist, error: fetchError } = await supabase
        .from('community_playlists')
        .select('books, ai_match_scores')
        .eq('id', playlistId)
        .single();

      if (fetchError) throw fetchError;

      // Check if book already exists
      const bookExists = playlist.books?.some(b => b.id === book.id);
      if (bookExists) {
        throw new Error('Buku sudah ada dalam playlist ini');
      }

      // Add book to playlist
      const updatedBooks = [...(playlist.books || []), {
        ...book,
        added_at: new Date().toISOString(),
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

      // Update local state
      setPlaylists(prev => prev.map(p =>
        p.id === playlistId ? data : p
      ));

      console.log('✅ Book added to playlist:', { playlistId, bookId: book.id });
      return { success: true, data };

    } catch (error) {
      console.error('Error adding to playlist:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove book from playlist - FIXED (TANPA NOTIFIKASI)
  const removeBookFromPlaylist = async (playlistId, bookId) => {
    try {
      // First get current playlist
      const { data: playlist, error: fetchError } = await supabase
        .from('community_playlists')
        .select('books, ai_match_scores')
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

      // Update local state
      setPlaylists(prev => prev.map(p =>
        p.id === playlistId ? data : p
      ));

      console.log('✅ Book removed from playlist:', { playlistId, bookId });
      return { success: true, data };

    } catch (error) {
      console.error('Error removing book from playlist:', error);
      return { success: false, error: error.message };
    }
  };

  // AI Score Management
  const saveAIMatchScore = async (playlistId, bookId, analysis) => {
    try {
      // Get current playlist
      const { data: playlist, error: fetchError } = await supabase
        .from('community_playlists')
        .select('ai_match_scores')
        .eq('id', playlistId)
        .single();

      if (fetchError) throw fetchError;

      // Update AI scores
      const currentScores = playlist.ai_match_scores || {};
      const updatedScores = {
        ...currentScores,
        [bookId]: {
          matchScore: analysis.matchScore,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          analyzedAt: new Date().toISOString()
        }
      };

      // Update database
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

      // Update local state
      setPlaylists(prev => prev.map(p =>
        p.id === playlistId ? data : p
      ));

      console.log('✅ AI match score saved:', { playlistId, bookId, score: analysis.matchScore });
      return { success: true, data };

    } catch (error) {
      console.error('❌ Error saving AI score:', error);
      return { success: false, error: error.message };
    }
  };

  const getAIMatchScore = (playlistId, bookId) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return null;

      const scores = playlist.ai_match_scores || {};
      return scores[bookId] || null;
    } catch (error) {
      console.error('❌ Error getting AI score from local state:', error);
      return null;
    }
  };

  // Social Features - FIXED (TANPA NOTIFIKASI)
  const trackView = async (playlistId) => {
    try {
      console.log('🎯 Tracking view for playlist:', playlistId);
      
      // 1. Optimistic update - update UI langsung
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              view_count: (playlist.view_count || 0) + 1 
            }
          : playlist
      ));

      // 2. Debounce mechanism - prevent rapid duplicate calls
      const now = Date.now();
      const lastTrackTime = window.lastTrackTimes?.[playlistId] || 0;
      
      // Skip jika track dalam 3 detik terakhir
      if (now - lastTrackTime < 3000) {
        console.log('⏩ Skipping duplicate track view (debounced):', playlistId);
        return { success: true, skipped: true };
      }
      
      // Update last track time
      if (!window.lastTrackTimes) window.lastTrackTimes = {};
      window.lastTrackTimes[playlistId] = now;

      // 3. Update database
      const { data, error } = await supabase.rpc('increment_view_count', {
        playlist_id: playlistId
      });

      if (error) {
        console.error('❌ Supabase RPC error:', error);
        // Fallback ke manual increment
        return await manualIncrement(playlistId, 'view_count');
      }

      console.log('✅ Playlist view tracked:', playlistId, 'New count:', data?.view_count);
      
      // 4. Sync dengan database (optional, untuk memastikan data terupdate)
      // Tapi JANGAN loadPlaylists() karena terlalu berat
      // Sebagai gantinya, update local state dengan data dari RPC
      if (data?.view_count) {
        setPlaylists(prev => prev.map(playlist => 
          playlist.id === playlistId 
            ? { ...playlist, view_count: data.view_count }
            : playlist
        ));
      }
      
      return { 
        success: true, 
        data,
        view_count: data?.view_count 
      };

    } catch (error) {
      console.error('❌ Error tracking view:', error);
      
      // Rollback optimistic update jika error
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              view_count: Math.max(0, (playlist.view_count || 1) - 1) 
            }
          : playlist
      ));
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // LIKE
  
  const likePlaylist = async (playlistId) => {
    try {
      console.log('❤️ Tracking like for playlist:', playlistId);
      
      // 1. Optimistic update
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              like_count: (playlist.like_count || 0) + 1 
            }
          : playlist
      ));

      // 2. Debounce mechanism
      const now = Date.now();
      const lastLikeTime = window.lastLikeTimes?.[playlistId] || 0;
      
      if (now - lastLikeTime < 3000) {
        console.log('⏩ Skipping duplicate like (debounced):', playlistId);
        return { success: true, skipped: true };
      }
      
      if (!window.lastLikeTimes) window.lastLikeTimes = {};
      window.lastLikeTimes[playlistId] = now;

      // 3. Update database
      const { data, error } = await supabase.rpc('increment_like_count', {
        playlist_id: playlistId
      });

      if (error) {
        console.error('❌ Supabase RPC error:', error);
        return await manualIncrement(playlistId, 'like_count');
      }

      console.log('✅ Playlist liked:', playlistId, 'New count:', data?.like_count);
      
      // 4. Sync dengan database
      if (data?.like_count) {
        setPlaylists(prev => prev.map(playlist => 
          playlist.id === playlistId 
            ? { ...playlist, like_count: data.like_count }
            : playlist
        ));
      }
      
      return { 
        success: true, 
        data,
        like_count: data?.like_count 
      };

    } catch (error) {
      console.error('❌ Error in likePlaylist:', error);
      
      // Rollback optimistic update
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              like_count: Math.max(0, (playlist.like_count || 1) - 1) 
            }
          : playlist
      ));
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const reportPlaylist = async (playlistId) => {
    try {
      const { data, error } = await supabase.rpc('increment_report_count', {
        playlist_id: playlistId
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return await manualIncrement(playlistId, 'report_count');
      }

      console.log('✅ Playlist reported:', playlistId);
      return data;
    } catch (error) {
      console.error('Error reporting playlist:', error);
      throw error;
    }
  };

  // Delete playlist - FIXED (TANPA NOTIFIKASI)
  const deletePlaylist = async (playlistId) => {
    try {
      const { error } = await supabase
        .from('community_playlists')
        .delete()
        .eq('id', playlistId);

      if (error) {
        throw error;
      }

      // Update local state
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      console.log('✅ Playlist deleted:', playlistId);
      return { success: true };

    } catch (error) {
      console.error('Error deleting playlist:', error);
      return { success: false, error: error.message };
    }
  };

  // Search & Discovery
  const searchPlaylists = async (query, options = {}) => {
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
      console.error('Error searching playlists:', error);
      throw error;
    }
  };

  const getPopularPlaylists = async (limit = 10) => {
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
      console.error('Error getting popular playlists:', error);
      throw error;
    }
  };

  const getUserPlaylists = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user playlists:', error);
      throw error;
    }
  };

  // Helper functions
  const manualIncrement = async (playlistId, field) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');

      const currentValue = playlist[field] || 0;
      const updates = { [field]: currentValue + 1 };

      const { data, error } = await supabase
        .from('community_playlists')
        .update(updates)
        .eq('id', playlistId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPlaylists(prev => prev.map(p =>
        p.id === playlistId ? data : p
      ));

      return data;
    } catch (error) {
      console.error('Manual increment error:', error);
      throw error;
    }
  };

  const refreshPlaylists = () => {
    loadPlaylists();
  };

  const healthCheck = async () => {
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
  };

  const value = {
    // State
    playlists,
    loading,
    error,
    userId,

    // Core Operations
    createPlaylist,
    addToPlaylist,
    removeBookFromPlaylist,

    // AI Score Management
    saveAIMatchScore,
    getAIMatchScore,

    // Social Features
    trackView,
    likePlaylist,
    reportPlaylist,

    // Delete
    deletePlaylist,

    // Search & Discovery
    searchPlaylists,
    getPopularPlaylists,
    getUserPlaylists,

    // Utilities
    refreshPlaylists,
    healthCheck,
    
    // 🆕 TAMBAH FUNCTION UNTUK REFRESH USER
    refreshUserId: () => {
      const newUserId = getOrCreateUserId();
      setUserId(newUserId);
      return newUserId;
    }
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};

