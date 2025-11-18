// contexts/PlaylistContext.js - COMPLETE VERSION WITH FIX

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

  // ========================
  // CORE PLAYLIST OPERATIONS
  // ========================

  // Load playlists dari Supabase - INCLUDE AI SCORES
  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading playlists from Supabase...');
      
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*') // ✅ SUDAH INCLUDING ai_match_scores!
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

  // Load playlists ketika component mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Create new playlist
  const createPlaylist = async (playlistData) => {
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .insert([{
          ...playlistData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ai_match_scores: {} // ✅ INIT AI SCORES EMPTY
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPlaylists(prev => [data, ...prev]);
      return { success: true, data };

    } catch (error) {
      console.error('Error creating playlist:', error);
      return { success: false, error: error.message };
    }
  };

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

  // Remove book from playlist
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

  // ========================
  // AI SCORE MANAGEMENT
  // ========================

  /**
   * Save AI match score untuk buku di playlist
   */
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

  /**
   * Get AI match score untuk buku di playlist - FROM LOCAL STATE
   */
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

  // ========================
  // SOCIAL FEATURES
  // ========================

  // Track playlist view
  const trackView = async (playlistId) => {
    try {
      const { data, error } = await supabase.rpc('increment_view_count', {
        playlist_id: playlistId
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        // Fallback manual update
        return await manualIncrement(playlistId, 'view_count');
      }

      console.log('✅ Playlist view tracked:', playlistId);
      return data;

    } catch (error) {
      console.error('Error tracking view:', error);
      return null;
    }
  };

  // Like playlist
  const likePlaylist = async (playlistId) => {
    try {
      const { data, error } = await supabase.rpc('increment_like_count', {
        playlist_id: playlistId
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return await manualIncrement(playlistId, 'like_count');
      }

      console.log('✅ Playlist liked:', playlistId);
      return data;

    } catch (error) {
      console.error('Error liking playlist:', error);
      throw error;
    }
  };

  // Report playlist
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

  // ========================
  // SEARCH & DISCOVERY
  // ========================

  // Search playlists by name or description
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

  // Get popular playlists
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

  // Get user's playlists
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

  // ========================
  // HELPER FUNCTIONS
  // ========================

  // Manual increment fallback
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

  // Refresh playlists
  const refreshPlaylists = () => {
    loadPlaylists();
  };

  // Health check
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
    
    // Search & Discovery
    searchPlaylists,
    getPopularPlaylists,
    getUserPlaylists,
    
    // Utilities
    refreshPlaylists,
    healthCheck
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};