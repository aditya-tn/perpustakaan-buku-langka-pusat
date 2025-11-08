// contexts/PlaylistContext.js - UPDATED WITH HYBRID APPROACH
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  playlistService, 
  analyticsService,
  serviceManager 
} from '../services/indexService'; // ⚡ UPDATED IMPORT

const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState('checking');

  // ========================
  // USER MANAGEMENT
  // ========================

  /**
   * Get or create anonymous user ID
   */
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    let userId = localStorage.getItem('playlistUserId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('playlistUserId', userId);
      console.log('🆕 New user session created:', userId);
    }
    return userId;
  };

  /**
   * Get backup code for data recovery
   */
  const getBackupCode = () => {
    const userId = getUserId();
    return userId ? btoa(userId).substr(0, 8).toUpperCase() : null;
  };

  // ========================
  // DATA SYNC & FALLBACK
  // ========================

  /**
   * Save to localStorage as backup
   */
  const saveToLocalStorage = (playlistsData) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('communityPlaylists', JSON.stringify(playlistsData));
      localStorage.setItem('playlistsLastUpdate', new Date().toISOString());
      console.log('💾 Saved to localStorage:', playlistsData.length, 'playlists');
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  };

  /**
   * Load from localStorage as fallback
   */
  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem('communityPlaylists');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
      return [];
    }
  };

  /**
   * Migrate localStorage data to Supabase
   */
  const migrateToSupabase = async () => {
    const localPlaylists = loadFromLocalStorage();
    if (localPlaylists.length === 0) return;

    console.log('🔄 Migrating', localPlaylists.length, 'playlists to Supabase...');
    
    const userId = getUserId();
    let migratedCount = 0;

    for (const playlist of localPlaylists) {
      try {
        // Skip if playlist already has proper ID (already in Supabase)
        if (playlist.id && playlist.id.length === 36) continue;

        // Create new playlist in Supabase
        await playlistService.createPlaylist({
          name: playlist.name,
          description: playlist.description,
          created_by: userId,
          is_public: true,
          books: playlist.books || []
        });
        
        migratedCount++;
      } catch (error) {
        console.error('❌ Migration failed for playlist:', playlist.name, error);
      }
    }

    if (migratedCount > 0) {
      console.log('✅ Migration complete:', migratedCount, 'playlists migrated');
      // Clear localStorage after successful migration
      localStorage.removeItem('communityPlaylists');
    }
  };

  // ========================
  // CORE OPERATIONS
  // ========================

  /**
   * Load playlists dengan hybrid approach
   */
  const fetchPlaylists = async () => {
    setLoading(true);
    setSupabaseStatus('checking');

    try {
      // First, try Supabase
      console.log('🔍 Fetching playlists from Supabase...');
      const supabaseData = await playlistService.getPlaylists();
      
      if (supabaseData && supabaseData.length > 0) {
        // Successfully got data from Supabase
        setPlaylists(supabaseData);
        setSupabaseStatus('connected');
        setLastSync(new Date().toISOString());
        saveToLocalStorage(supabaseData); // Sync to localStorage
        console.log('✅ Loaded from Supabase:', supabaseData.length, 'playlists');
        
        // Migrate any local data to Supabase
        await migrateToSupabase();
      } else {
        // No data in Supabase, try localStorage
        console.log('📦 No data in Supabase, trying localStorage...');
        const localData = loadFromLocalStorage();
        setPlaylists(localData);
        setSupabaseStatus('no-data');
        console.log('✅ Loaded from localStorage:', localData.length, 'playlists');
      }

    } catch (error) {
      // Supabase failed, fallback to localStorage
      console.error('❌ Supabase connection failed, using localStorage fallback:', error);
      const localData = loadFromLocalStorage();
      setPlaylists(localData);
      setSupabaseStatus('offline');
      console.log('✅ Fallback to localStorage:', localData.length, 'playlists');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create new playlist dengan hybrid approach
   */
  const createPlaylist = async (playlistData) => {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User session tidak tersedia');
    }

    setLoading(true);

    try {
      // Try Supabase first
      const newPlaylist = {
        name: playlistData.name,
        description: playlistData.description,
        created_by: userId,
        is_public: true,
        books: []
      };

      let createdPlaylist;

      try {
        createdPlaylist = await playlistService.createPlaylist(newPlaylist);
        console.log('✅ Playlist created in Supabase:', createdPlaylist.id);
      } catch (supabaseError) {
        console.error('❌ Supabase create failed, using localStorage:', supabaseError);
        
        // Fallback to localStorage
        createdPlaylist = {
          id: Date.now().toString(), // Temporary ID
          ...newPlaylist,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          view_count: 0,
          like_count: 0,
          report_count: 0
        };
      }

      // Update local state
      setPlaylists(prev => {
        const updated = [createdPlaylist, ...prev];
        saveToLocalStorage(updated); // Always backup to localStorage
        return updated;
      });

      return createdPlaylist;

    } catch (error) {
      console.error('❌ Error creating playlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add book to playlist dengan hybrid approach
   */
  const addToPlaylist = async (playlistId, book) => {
    setLoading(true);

    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) {
        throw new Error('Playlist tidak ditemukan');
      }

      // Check if book already exists
      const bookExists = playlist.books.some(b => b.id === book.id);
      if (bookExists) {
        throw new Error('Buku sudah ada dalam playlist ini');
      }

      const updatedBooks = [...playlist.books, {
        ...book,
        added_at: new Date().toISOString(),
        _denormalized: true // Mark as denormalized data
      }];

      let updatedPlaylist;

      try {
        // Try Supabase first
        if (playlistId.length === 36) { // UUID format = Supabase playlist
          updatedPlaylist = await playlistService.updatePlaylist(playlistId, { 
            books: updatedBooks 
          });
          console.log('✅ Book added in Supabase:', { playlistId, bookId: book.id });
        } else {
          throw new Error('Local playlist, skip Supabase');
        }
      } catch (supabaseError) {
        console.error('❌ Supabase update failed, using localStorage:', supabaseError);
        
        // Fallback: update locally
        updatedPlaylist = {
          ...playlist,
          books: updatedBooks,
          updated_at: new Date().toISOString()
        };
      }

      // Update local state
      setPlaylists(prev => {
        const updated = prev.map(p => 
          p.id === playlistId ? updatedPlaylist : p
        );
        saveToLocalStorage(updated);
        return updated;
      });

      return true;

    } catch (error) {
      console.error('❌ Error adding to playlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove book from playlist
   */
  const removeFromPlaylist = async (playlistId, bookId) => {
    setLoading(true);

    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) {
        throw new Error('Playlist tidak ditemukan');
      }

      const updatedBooks = playlist.books.filter(book => book.id !== bookId);

      try {
        // Try Supabase first
        if (playlistId.length === 36) {
          await playlistService.updatePlaylist(playlistId, { 
            books: updatedBooks 
          });
        }
      } catch (supabaseError) {
        console.error('❌ Supabase update failed, using localStorage:', supabaseError);
      }

      // Update local state
      setPlaylists(prev => {
        const updated = prev.map(p => 
          p.id === playlistId 
            ? { ...p, books: updatedBooks, updated_at: new Date().toISOString() }
            : p
        );
        saveToLocalStorage(updated);
        return updated;
      });

      return true;

    } catch (error) {
      console.error('❌ Error removing from playlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete playlist
   */
  const deletePlaylist = async (playlistId) => {
    setLoading(true);

    try {
      // Try Supabase first
      if (playlistId.length === 36) {
        try {
          await playlistService.deletePlaylist(playlistId);
          console.log('✅ Playlist deleted from Supabase:', playlistId);
        } catch (supabaseError) {
          console.error('❌ Supabase delete failed:', supabaseError);
        }
      }

      // Update local state
      setPlaylists(prev => {
        const updated = prev.filter(p => p.id !== playlistId);
        saveToLocalStorage(updated);
        return updated;
      });

      return true;

    } catch (error) {
      console.error('❌ Error deleting playlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // ENHANCED FEATURES
  // ========================

  /**
   * Like a playlist
   */
  const likePlaylist = async (playlistId) => {
    try {
      if (playlistId.length === 36) {
        await playlistService.likePlaylist(playlistId);
      }

      // Optimistic update
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId 
          ? { ...p, like_count: (p.like_count || 0) + 1 }
          : p
      ));

    } catch (error) {
      console.error('❌ Error liking playlist:', error);
    }
  };

  /**
   * Track playlist view
   */
    const trackView = async (playlistId) => {
      try {
        // Update local state optimistically
        setPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, view_count: (p.view_count || 0) + 1 }
            : p
        ));
    
        // Update Supabase jika playlist ada di database
        if (playlistId.length === 36) { // UUID format
          await playlistService.trackView(playlistId);
          console.log('✅ View tracked in Supabase:', playlistId);
        }
        
        return true;
      } catch (error) {
        console.error('❌ Error tracking view:', error);
        // Don't throw error for analytics
        return false;
      }
    };

  // ========================
  // INITIALIZATION
  // ========================

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // ========================
  // CONTEXT VALUE
  // ========================

  const value = {
    // State
    playlists,
    loading,
    lastSync,
    supabaseStatus,
    
    // User info
    userId: getUserId(),
    backupCode: getBackupCode(),
    
    // Core operations
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    refreshPlaylists: fetchPlaylists,
    
    // Enhanced features
    likePlaylist,
    trackView,
    
    // Utility functions
    getPlaylistById: (id) => playlists.find(p => p.id === id),
    getUserPlaylists: () => playlists.filter(p => p.created_by === getUserId())
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within PlaylistProvider');
  }
  return context;
};
