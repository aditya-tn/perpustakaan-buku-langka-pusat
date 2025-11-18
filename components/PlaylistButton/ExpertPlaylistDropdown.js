// components/PlaylistButton/ExpertPlaylistDropdown.js - FULL UPDATED
import { useState } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';

// Safe notification hook
const useNotificationSafe = () => {
  try {
    const { useNotification } = require('../../contexts/NotificationContext');
    return useNotification();
  } catch (error) {
    return {
      addNotification: (notification) => {
        console.log('📢 Notification:', notification);
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            alert(`📢 ${notification.title}\n${notification.message}`);
          }, 100);
        }
      }
    };
  }
};

const ExpertPlaylistDropdown = ({ book, onClose, onShowPlaylistForm, onCloseBookDescription, integratedMode = false }) => {
  const { playlists, addToPlaylist } = usePlaylist();
  const { addNotification } = useNotificationSafe();
  const [addingToPlaylist, setAddingToPlaylist] = useState(null);

  const handleAddToPlaylist = async (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || !book) return;

    setAddingToPlaylist(playlistId);
    
    try {
      // 1. Tambah buku ke playlist
      const result = await addToPlaylist(playlistId, book);
      
      // 2. Background AI Analysis untuk surprise score
      setTimeout(async () => {
        try {
          const aiAnalysis = await fetch('/api/ai-match-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: book.id, playlistId })
          }).then(res => res.json());
          
          // 3. Tampilkan surprise notification
          if (aiAnalysis.success) {
            showSurpriseScore(aiAnalysis.data, playlist.name);
          }
        } catch (error) {
          console.error('Background AI analysis failed:', error);
        }
      }, 1000);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil! 🎉',
          message: `"${book.judul}" ditambahkan ke "${playlist.name}"`,
          icon: '✅'
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      addNotification({
        type: 'error',
        title: 'Gagal Menambahkan',
        message: error.message,
        icon: '❌'
      });
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const showSurpriseScore = (analysis, playlistName) => {
    const getScoreEmoji = (score) => {
      if (score >= 90) return '🏆';
      if (score >= 80) return '🎯';
      if (score >= 70) return '👍';
      return '🤔';
    };

    addNotification({
      type: 'success',
      title: `${getScoreEmoji(analysis.matchScore)} Excellent Choice!`,
      message: `Match Score: ${analysis.matchScore}% dengan "${playlistName}"\n${analysis.reasoning}`,
      icon: '⭐',
      action: {
        label: 'Lihat Playlist',
        onClick: () => window.open(`/playlists/${analysis.playlistId}`, '_blank')
      }
    });
  };

  const handleCreatePlaylist = () => {
    if (onCloseBookDescription) {
      onCloseBookDescription();
    }
    if (onShowPlaylistForm) {
      onShowPlaylistForm();
    }
    onClose();
  };

  // Filter playlists yang tidak mengandung buku ini
  const availablePlaylists = playlists.filter(playlist =>
    !playlist.books?.some(b => b.id === book.id)
  );

  // Styling untuk integrated vs standalone mode
  const containerStyle = integratedMode ? {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '8px'
  } : {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    minWidth: '280px',
    maxWidth: '400px',
    zIndex: 1000,
    marginTop: '8px'
  };

  const headerStyle = integratedMode ? {
    padding: '1rem 1rem 0.75rem 1rem',
    fontWeight: '600',
    color: '#2d3748',
    fontSize: '1.1rem',
    borderBottom: 'none',
    marginBottom: '0.5rem'
  } : {
    padding: '1rem',
    fontWeight: '600',
    color: '#2d3748',
    borderBottom: '1px solid #f7fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const contentStyle = integratedMode ? {
    maxHeight: '400px',
    overflowY: 'auto'
  } : {
    maxHeight: '300px',
    overflowY: 'auto'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        {integratedMode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span>
            Pilih Playlist Langsung
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '400',
              color: '#718096',
              marginLeft: 'auto'
            }}>
              {availablePlaylists.length} tersedia
            </span>
          </div>
        ) : (
          <>
            <span>⚡</span>
            Pilih Playlist
          </>
        )}
      </div>

      {/* Playlist List */}
      <div style={contentStyle}>
        {availablePlaylists.length === 0 ? (
          <div style={{
            padding: integratedMode ? '2rem 1rem' : '1.5rem 1rem',
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
          availablePlaylists.map(playlist => (
            <div
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id)}
              style={{
                padding: integratedMode ? '1rem' : '0.875rem 1rem',
                cursor: addingToPlaylist === playlist.id ? 'wait' : 'pointer',
                borderBottom: '1px solid #f7fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: addingToPlaylist === playlist.id ? '#f0fff4' : 'white',
                transition: 'background-color 0.2s',
                ...(integratedMode && {
                  borderRadius: '6px',
                  margin: '0.25rem 0'
                })
              }}
              onMouseEnter={(e) => {
                if (addingToPlaylist !== playlist.id) {
                  e.currentTarget.style.backgroundColor = '#f7fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (addingToPlaylist !== playlist.id) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
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
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '500',
                    color: addingToPlaylist === playlist.id ? '#48bb78' : '#2d3748',
                    fontSize: integratedMode ? '0.9rem' : '0.85rem'
                  }}>
                    {playlist.name}
                  </div>
                  {integratedMode && playlist.description && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#718096',
                      marginTop: '0.25rem'
                    }}>
                      {playlist.description.length > 60 
                        ? `${playlist.description.substring(0, 60)}...` 
                        : playlist.description
                      }
                    </div>
                  )}
                </div>
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
                  fontWeight: '500',
                  minWidth: '30px',
                  textAlign: 'center'
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
            </div>
          ))
        )}
      </div>

      {/* Create New Playlist */}
      <div
        onClick={handleCreatePlaylist}
        style={{
          padding: integratedMode ? '1.25rem 1rem' : '1rem',
          cursor: 'pointer',
          borderTop: '1px solid #f7fafc',
          backgroundColor: '#f0fff4',
          color: '#22543d',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
          ...(integratedMode ? {
            borderRadius: '8px',
            marginTop: '1rem'
          } : {
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
          })
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#c6f6d5';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f0fff4';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>✨</span>
        + Buat Playlist Baru
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ExpertPlaylistDropdown;
