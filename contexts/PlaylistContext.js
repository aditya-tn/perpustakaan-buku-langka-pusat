// contexts/PlaylistContext.js - COMPLETE FIXED VERSION WITH NOTIFICATIONS
import { createContext, useContext, useState, useEffect } from 'react';
import {
  playlistService,
  analyticsService,
  serviceManager
} from '../services/indexService';

// Buat context terpisah untuk notification untuk avoid circular dependencies
const PlaylistContext = createContext();

// Custom hook untuk notification yang aman
const useNotificationSafe = () => {
  try {
    const { useNotification } = require('./NotificationContext');
    return useNotification();
  } catch (error) {
    // Fallback jika NotificationContext belum ada
    return {
      addNotification: (notification) => {
        console.log('📢 Notification:', notification);
        // Fallback ke console log atau browser notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, { 
            body: notification.message,
            icon: '/icon.png'
          });
        }
      }
    };
  }
};

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState('checking');
  
  // Gunakan notification safe hook
  const { addNotification } = useNotificationSafe();

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
  // DATA VALIDATION & UTILITIES
  // ========================

  /**
   * Validate and standardize book structure
   */
  const validateBookStructure = (book) => {
    return {
      id: book.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      judul: book.judul || book.title || 'Judul tidak tersedia',
      pengarang: book.pengarang || book.author || '',
      tahun_terbit: book.tahun_terbit || book.year || '',
      penerbit: book.penerbit || book.publisher || '',
      deskripsi_fisik: book.deskripsi_fisik || book.description || '',
      added_at: book.added_at || new Date().toISOString(),
      _denormalized: true,
      _validated: true
    };
  };

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
      const playlists = saved ? JSON.parse(saved) : [];
      
      // Validate and fix playlist structure
      return playlists.map(playlist => ({
        ...playlist,
        books: (playlist.books || []).map(book => validateBookStructure(book))
      }));
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

        // Validate books structure before migration
        const validatedBooks = (playlist.books || []).map(book => validateBookStructure(book));

        // Create new playlist in Supabase
        await playlistService.createPlaylist({
          name: playlist.name,
          description: playlist.description,
          created_by: userId,
          is_public: true,
          books: validatedBooks
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
        const validatedData = supabaseData.map(playlist => ({
          ...playlist,
          books: (playlist.books || []).map(book => validateBookStructure(book))
        }));

        setPlaylists(validatedData);
        setSupabaseStatus('connected');
        setLastSync(new Date().toISOString());
        saveToLocalStorage(validatedData); // Sync to localStorage
        console.log('✅ Loaded from Supabase:', validatedData.length, 'playlists');

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
      // Prepare playlist data
      const newPlaylist = {
        name: playlistData.name.trim(),
        description: playlistData.description?.trim() || '',
        created_by: userId,
        is_public: true,
        books: []
      };

      let createdPlaylist;

      try {
        // Try Supabase first
        createdPlaylist = await playlistService.createPlaylist(newPlaylist);
        console.log('✅ Playlist created in Supabase:', createdPlaylist.id);
        
        // NOTIFICATION SUCCESS
        addNotification({
          type: 'success',
          title: 'Playlist Dibuat! 🎉',
          message: `"${newPlaylist.name}" berhasil dibuat`,
          icon: '📚'
        });
      } catch (supabaseError) {
        console.error('❌ Supabase create failed, using localStorage:', supabaseError);
        // Fallback to localStorage
        createdPlaylist = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...newPlaylist,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          view_count: 0,
          like_count: 0,
          report_count: 0
        };
        
        // NOTIFICATION WARNING
        addNotification({
          type: 'warning',
          title: 'Playlist Dibuat (Lokal)',
          message: `"${newPlaylist.name}" disimpan secara lokal`,
          icon: '💾'
        });
      }

      // Update local state
      setPlaylists(prev => {
        const updated = [createdPlaylist, ...prev];
        saveToLocalStorage(updated);
        return updated;
      });

      return createdPlaylist;
    } catch (error) {
      console.error('❌ Error creating playlist:', error);
      
      // NOTIFICATION ERROR
      addNotification({
        type: 'error',
        title: 'Gagal Membuat Playlist',
        message: error.message,
        icon: '❌'
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add book to playlist dengan hybrid approach - DENGAN NOTIFICATION
   */
  const addToPlaylist = async (playlistId, book) => {
    setLoading(true);
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) {
        throw new Error('Playlist tidak ditemukan');
      }

      // Validate and standardize book structure
      const bookToAdd = validateBookStructure(book);
      console.log('📦 Adding book to playlist:', { playlistId, book: bookToAdd });

      // Check if book already exists
      const bookExists = playlist.books?.some(b => b.id === bookToAdd.id);
      if (bookExists) {
        throw new Error('Buku sudah ada dalam playlist ini');
      }

      // Add book to playlist
      const updatedBooks = [...(playlist.books || []), bookToAdd];

      let updatedPlaylist;
      let supabaseSuccess = false;

      try {
        // Try Supabase first only if it's a Supabase playlist (UUID)
        if (playlistId.length === 36 && playlistId.startsWith('local_') === false) {
          console.log('🔄 Attempting to update Supabase...');
          
          updatedPlaylist = await playlistService.updatePlaylist(playlistId, {
            books: updatedBooks
          });
          
          supabaseSuccess = true;
          console.log('✅ Book added in Supabase:', { playlistId, bookId: bookToAdd.id });
        } else {
          console.log('📱 Local playlist, skipping Supabase');
          throw new Error('Local playlist');
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

      // NOTIFICATION SUCCESS - DENGAN ANIMASI
      addNotification({
        type: 'success',
        title: 'Buku Ditambahkan! 🎉',
        message: `"${bookToAdd.judul}" berhasil ditambahkan ke "${playlist.name}"`,
        icon: '📚',
        action: supabaseSuccess ? {
          label: 'Lihat Playlist',
          onClick: () => window.open(`/playlists/${playlistId}`, '_blank')
        } : {
          label: 'Hanya Lokal',
          onClick: () => console.log('Data tersimpan lokal')
        }
      });

      return { 
        success: true, 
        storedInSupabase: supabaseSuccess,
        message: 'Buku berhasil ditambahkan' 
      };
    } catch (error) {
      console.error('❌ Error adding to playlist:', error);
      
      // NOTIFICATION ERROR
      addNotification({
        type: 'error',
        title: 'Gagal Menambahkan Buku',
        message: error.message,
        icon: '❌'
      });
      
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

      const bookToRemove = playlist.books?.find(b => b.id === bookId);
      const updatedBooks = (playlist.books || []).filter(book => book.id !== bookId);

      try {
        // Try Supabase first only for Supabase playlists
        if (playlistId.length === 36 && !playlistId.startsWith('local_')) {
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

      // NOTIFICATION SUCCESS
      if (bookToRemove) {
        addNotification({
          type: 'info',
          title: 'Buku Dihapus',
          message: `"${bookToRemove.judul}" dihapus dari playlist`,
          icon: '🗑️'
        });
      }

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
      const playlistToDelete = playlists.find(p => p.id === playlistId);
      
      // Try Supabase first only for Supabase playlists
      if (playlistId.length === 36 && !playlistId.startsWith('local_')) {
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

      // NOTIFICATION SUCCESS
      if (playlistToDelete) {
        addNotification({
          type: 'info',
          title: 'Playlist Dihapus',
          message: `"${playlistToDelete.name}" berhasil dihapus`,
          icon: '🗑️'
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting playlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // ENHANCED FEATURES - DENGAN NOTIFICATION
  // ========================

  /**
   * Like a playlist - DENGAN ANIMASI & NOTIFICATION
   */
  const likePlaylist = async (playlistId) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      // Optimistic update immediate
      const newLikeCount = (playlist.like_count || 0) + 1;
      const updatedPlaylist = {
        ...playlist,
        like_count: newLikeCount,
        updated_at: new Date().toISOString()
      };

      // Update local state immediately
      setPlaylists(prev => {
        const updated = prev.map(p => p.id === playlistId ? updatedPlaylist : p);
        saveToLocalStorage(updated);
        return updated;
      });

      // NOTIFICATION LIKE - DENGAN ANIMASI SPECIAL
      addNotification({
        type: 'like',
        title: 'Liked! ❤️',
        message: `Kamu menyukai "${playlist.name}"`,
        icon: '❤️',
        action: {
          label: 'Lihat Playlist', 
          onClick: () => window.open(`/playlists/${playlistId}`, '_blank')
        }
      });

      // Try to update Supabase for persistent storage
      if (playlistId.length === 36 && !playlistId.startsWith('local_')) {
        try {
          await playlistService.likePlaylist(playlistId);
          console.log('✅ Like saved to Supabase:', playlistId);
        } catch (supabaseError) {
          console.error('❌ Supabase like failed, keeping in localStorage:', supabaseError);
          // Don't revert - keep in localStorage
        }
      }

    } catch (error) {
      console.error('❌ Error liking playlist:', error);
      // Revert optimistic update on error
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId 
          ? { ...p, like_count: Math.max(0, (p.like_count || 0) - 1) }
          : p
      ));
    }
  };

  /**
   * Track playlist view
   */
  const trackView = async (playlistId) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return false;

      // Update local state immediately
      const newViewCount = (playlist.view_count || 0) + 1;
      const updatedPlaylist = {
        ...playlist,
        view_count: newViewCount,
        updated_at: new Date().toISOString()
      };

      setPlaylists(prev => {
        const updated = prev.map(p => p.id === playlistId ? updatedPlaylist : p);
        saveToLocalStorage(updated);
        return updated;
      });

      // Update Supabase untuk persistent storage
      if (playlistId.length === 36 && !playlistId.startsWith('local_')) {
        try {
          await playlistService.trackView(playlistId);
          console.log('✅ View tracked in Supabase:', playlistId);
        } catch (supabaseError) {
          console.error('❌ Supabase view tracking failed, keeping in localStorage:', supabaseError);
          // Don't revert - keep in localStorage
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error tracking view:', error);
      return false;
    }
  };

  /**
   * Report playlist
   */
  const reportPlaylist = async (playlistId) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      
      // Update local state
      setPlaylists(prev => prev.map(p =>
        p.id === playlistId
          ? { ...p, report_count: (p.report_count || 0) + 1 }
          : p
      ));

      // NOTIFICATION REPORT
      if (playlist) {
        addNotification({
          type: 'warning',
          title: 'Playlist Dilaporkan',
          message: `Laporan untuk "${playlist.name}" telah dikirim`,
          icon: '🚨'
        });
      }

      // Update Supabase jika online
      if (playlistId.length === 36 && !playlistId.startsWith('local_')) {
        try {
          await playlistService.reportPlaylist(playlistId);
        } catch (supabaseError) {
          console.error('❌ Supabase report failed:', supabaseError);
        }
      }
    } catch (error) {
      console.error('❌ Error reporting playlist:', error);
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
    reportPlaylist,

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