// components/PlaylistButton/PlaylistButton.js - UPDATED WITH NOTIFICATIONS
import { useState } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';

// Safe notification hook untuk avoid errors
const useNotificationSafe = () => {
  try {
    const { useNotification } = require('../../contexts/NotificationContext');
    return useNotification();
  } catch (error) {
    // Fallback jika NotificationContext belum ada
    return {
      addNotification: (notification) => {
        console.log('📢 Notification:', notification);
        // Fallback ke alert sederhana
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            alert(`📢 ${notification.title}\n${notification.message}`);
          }, 100);
        }
      }
    };
  }
};

const PlaylistButton = ({ book, onShowPlaylistForm, onCloseBookDescription }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(null); // Track which playlist is being added to
  
  const { playlists, addToPlaylist } = usePlaylist();
  const { addNotification } = useNotificationSafe();

  const handleAddToPlaylist = async (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || !book) return;

    setAddingToPlaylist(playlistId);
    
    try {
      const result = await addToPlaylist(playlistId, book);
      
      // Notification tambahan untuk UI feedback yang lebih spesifik
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil! 🎉',
          message: `"${book.judul}" ditambahkan ke "${playlist.name}"`,
          icon: '✅',
          action: {
            label: 'Lihat Playlist',
            onClick: () => window.open(`/playlists/${playlistId}`, '_blank')
          }
        });
      }
      
      setShowDropdown(false);
    } catch (error) {
      // Error notification sudah dihandle di context, tapi kita bisa kasih feedback tambahan
      console.error('Error adding to playlist:', error);
    } finally {
      setAddingToPlaylist(null);
    }
  };

  // ⚡ Handle create playlist click
  const handleCreateClick = (e) => {
    e.stopPropagation();
    
    // Close book description if open
    if (onCloseBookDescription) {
      onCloseBookDescription();
    }
    
    // Show playlist form
    if (onShowPlaylistForm) {
      onShowPlaylistForm();
    }
    
    setShowDropdown(false);
    
    // Notification untuk create playlist
    addNotification({
      type: 'info',
      title: 'Buat Playlist Baru',
      message: 'Isi form untuk membuat playlist baru',
      icon: '📝'
    });
  };

  // Filter playlists yang tidak mengandung buku ini (untuk avoid duplicate)
  const availablePlaylists = playlists.filter(playlist => 
    !playlist.books?.some(b => b.id === book.id)
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Tombol Utama */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={addingToPlaylist}
        style={{
          backgroundColor: isHovered ? '#2b6cb0' : '#4299e1',
          color: 'white',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          border: 'none',
          fontSize: '0.75rem',
          fontWeight: '500',
          cursor: addingToPlaylist ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          opacity: addingToPlaylist ? 0.7 : 1,
          transform: addingToPlaylist ? 'scale(0.98)' : 'scale(1)'
        }}
      >
        {addingToPlaylist ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            Menambahkan...
          </>
        ) : (
          <>
            📚 Tambah ke Playlist
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          minWidth: '280px',
          zIndex: 1000,
          marginBottom: '8px',
          animation: 'slideDown 0.2s ease-out',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#2d3748',
            borderBottom: '1px solid #f7fafc',
            backgroundColor: '#f8fafc',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📚</span>
            Pilih Playlist
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '400',
              color: '#718096',
              marginLeft: 'auto'
            }}>
              {availablePlaylists.length} tersedia
            </span>
          </div>

          {/* List Playlists */}
          {availablePlaylists.length === 0 ? (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#718096',
              fontSize: '0.8rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
              Belum ada playlist yang tersedia
              <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: '#a0aec0' }}>
                Buat playlist baru untuk menambahkan buku
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {availablePlaylists.map(playlist => (
                <div
                  key={playlist.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlaylist(playlist.id);
                  }}
                  style={{
                    padding: '0.875rem 1rem',
                    cursor: addingToPlaylist === playlist.id ? 'wait' : 'pointer',
                    borderBottom: '1px solid #f7fafc',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: addingToPlaylist === playlist.id ? '#f0fff4' : 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (addingToPlaylist !== playlist.id) {
                      e.target.style.backgroundColor = '#f7fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (addingToPlaylist !== playlist.id) {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {addingToPlaylist === playlist.id ? (
                      <span style={{ 
                        animation: 'pulse 1s infinite',
                        color: '#48bb78'
                      }}>
                        ⏳
                      </span>
                    ) : (
                      <span>📁</span>
                    )}
                    <span style={{ 
                      fontWeight: '500',
                      color: addingToPlaylist === playlist.id ? '#48bb78' : '#2d3748'
                    }}>
                      {playlist.name}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#718096',
                      backgroundColor: '#e2e8f0',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '8px',
                      fontWeight: '500'
                    }}>
                      {playlist.books?.length || 0}
                    </span>
                    
                    {addingToPlaylist === playlist.id && (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #48bb78',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                  </div>
                  
                  {/* Loading bar effect */}
                  {addingToPlaylist === playlist.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '2px',
                      backgroundColor: '#48bb78',
                      animation: 'loadingBar 2s ease-in-out infinite'
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create New Playlist */}
          <div
            onClick={handleCreateClick}
            style={{
              padding: '1rem',
              cursor: 'pointer',
              borderTop: '1px solid #f7fafc',
              backgroundColor: '#f0fff4',
              color: '#22543d',
              fontWeight: '600',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#c6f6d5';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f0fff4';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>✨</span>
            + Buat Playlist Baru
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PlaylistButton;