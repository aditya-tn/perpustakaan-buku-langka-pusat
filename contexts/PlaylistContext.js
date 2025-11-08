// contexts/PlaylistContext.js - UPDATED FOR SUPABASE
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get or create user session ID
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    let userId = localStorage.getItem('playlistUserId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('playlistUserId', userId);
    }
    return userId;
  };

  // Load playlists dari Supabase
  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      // Fallback ke localStorage jika error
      const localPlaylists = localStorage.getItem('communityPlaylists');
      if (localPlaylists) {
        setPlaylists(JSON.parse(localPlaylists));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load playlists on mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Create playlist di Supabase
  const createPlaylist = async (playlistData) => {
    const userId = getUserId();
    if (!userId) return null;

    try {
      const newPlaylist = {
        name: playlistData.name,
        description: playlistData.description,
        created_by: userId,
        is_public: true,
        books: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('community_playlists')
        .insert([newPlaylist])
        .select()
        .single();

      if (error) throw error;
      
      setPlaylists(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      
      // Fallback: simpan di localStorage
      const localPlaylist = {
        id: Date.now().toString(),
        ...playlistData,
        books: [],
        created_by: userId,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const updatedPlaylists = [localPlaylist, ...playlists];
      setPlaylists(updatedPlaylists);
      localStorage.setItem('communityPlaylists', JSON.stringify(updatedPlaylists));
      
      return localPlaylist;
    }
  };

  // Add book to playlist di Supabase
  const addToPlaylist = async (playlistId, book) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');

      // Cek apakah buku sudah ada
      const bookExists = playlist.books.some(b => b.id === book.id);
      if (bookExists) {
        throw new Error('Buku sudah ada dalam playlist ini');
      }

      const updatedBooks = [...playlist.books, {
        ...book,
        added_at: new Date().toISOString()
      }];

      // Update di Supabase
      const { error } = await supabase
        .from('community_playlists')
        .update({
          books: updatedBooks,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId);

      if (error) throw error;

      // Update local state
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId 
          ? { ...p, books: updatedBooks, updated_at: new Date().toISOString() }
          : p
      ));

      return true;
    } catch (error) {
      console.error('Error adding to playlist:', error);
      
      // Fallback: update localStorage
      const updatedPlaylists = playlists.map(p => {
        if (p.id === playlistId) {
          const bookExists = p.books.some(b => b.id === book.id);
          if (!bookExists) {
            return {
              ...p,
              books: [...p.books, {
                ...book,
                added_at: new Date().toISOString()
              }],
              updated_at: new Date().toISOString()
            };
          }
        }
        return p;
      });
      
      setPlaylists(updatedPlaylists);
      localStorage.setItem('communityPlaylists', JSON.stringify(updatedPlaylists));
      
      throw error;
    }
  };

  const value = {
    playlists,
    loading,
    createPlaylist,
    addToPlaylist,
    refreshPlaylists: fetchPlaylists
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
