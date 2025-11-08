import { createContext, useContext, useState, useEffect } from 'react';

// 1. Buat Context
const PlaylistContext = createContext();

// 2. Buat Provider
export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load playlists dari localStorage saat pertama kali
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('communityPlaylists');
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists));
    }
  }, []);

  // Save ke localStorage setiap kali playlists berubah
  useEffect(() => {
    localStorage.setItem('communityPlaylists', JSON.stringify(playlists));
  }, [playlists]);

  // 3. Fungsi Create Playlist
  const createPlaylist = (playlistData) => {
    const newPlaylist = {
      id: Date.now().toString(), // Simple ID
      name: playlistData.name,
      description: playlistData.description,
      books: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true, // SELALU public untuk komunitas
      reportCount: 0, // Untuk reporting system
      createdBy: 'anonymous' // Untuk tahap awal
    };

    setPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist;
  };

  // 4. Fungsi Add Book to Playlist
const addToPlaylist = (playlistId, book) => {
  setPlaylists(prev => prev.map(playlist => {
    if (playlist.id === playlistId) {
      // Cek apakah buku sudah ada
      const bookExists = playlist.books.some(b => b.id === book.id);
      if (bookExists) {
        throw new Error('Buku sudah ada dalam playlist ini');
      }

      return {
        ...playlist,
        books: [...playlist.books, {
          ...book,
          addedAt: new Date().toISOString()
        }],
        updatedAt: new Date().toISOString()
      };
    }
    return playlist;
  }));
  
  return true; // Return success
};

  const value = {
    playlists,
    loading,
    createPlaylist,
    addToPlaylist
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};

// 5. Custom Hook untuk menggunakan Context
export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within PlaylistProvider');
  }
  return context;
};