// components/PlaylistButton/PlaylistButton.js - COMPLETE UPDATED VERSION
import { useState, useEffect } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';
import ChoiceModal from '../PlaylistModal/ChoiceModal';
import ExpertPlaylistDropdown from './ExpertPlaylistDropdown';
import NovicePlaylistRecommendations from './NovicePlaylistRecommendations';

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
  const [addingToPlaylist, setAddingToPlaylist] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // STATE BARU UNTUK DUAL MODE
  const [currentMode, setCurrentMode] = useState(null); // 'expert' | 'novice'
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  const { playlists, addToPlaylist } = usePlaylist();
  const { addNotification } = useNotificationSafe();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside (especially for mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.playlist-button-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  // HANDLERS BARU UNTUK DUAL MODE
  const handleExpertSelect = () => {
    setCurrentMode('expert');
    setShowChoiceModal(false);
    setShowDropdown(false);
  };

  const handleNoviceSelect = () => {
    setCurrentMode('novice');
    setShowChoiceModal(false);
    setShowDropdown(false);
  };

  const handleCloseMode = () => {
    setCurrentMode(null);
  };

  // HANDLER LAMA (untuk backward compatibility)
  const handleAddToPlaylist = async (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || !book) return;

    setAddingToPlaylist(playlistId);
    try {
      const result = await addToPlaylist(playlistId, book);
      
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
      console.error('Error adding to playlist:', error);
    } finally {
      setAddingToPlaylist(null);
    }
  };

  // HANDLE CREATE PLAYLIST CLICK
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
    setCurrentMode(null);

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
    <div className="playlist-button-container" style={{
      position: 'relative',
      display: 'inline-block',
      width: isMobile ? '100%' : 'auto'
    }}>
      
      {/* TOMBOL UTAMA - SEKARANG BUKA CHOICE MODAL */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowChoiceModal(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={addingToPlaylist}
        style={{
          backgroundColor: isHovered ? '#2b6cb0' : '#4299e1',
          color: 'white',
          padding: isMobile ? '0.6rem 1rem' : '0.4rem 0.8rem',
          borderRadius: '6px',
          border: 'none',
          fontSize: isMobile ? '0.9rem' : '0.75rem',
          fontWeight: '500',
          cursor: addingToPlaylist ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.25rem',
          opacity: addingToPlaylist ? 0.7 : 1,
          transform: addingToPlaylist ? 'scale(0.98)' : 'scale(1)',
          width: isMobile ? '100%' : 'auto'
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

      {/* CHOICE MODAL BARU */}
      {showChoiceModal && (
        <ChoiceModal
          book={book}
          onClose={() => setShowChoiceModal(false)}
          onExpertSelect={handleExpertSelect}
          onNoviceSelect={handleNoviceSelect}
        />
      )}

      {/* EXPERT MODE DROPDOWN */}
      {currentMode === 'expert' && (
        <ExpertPlaylistDropdown
          book={book}
          onClose={handleCloseMode}
          onShowPlaylistForm={onShowPlaylistForm}
          onCloseBookDescription={onCloseBookDescription}
        />
      )}

      {/* NOVICE MODE RECOMMENDATIONS */}
      {currentMode === 'novice' && (
        <NovicePlaylistRecommendations
          book={book}
          onClose={handleCloseMode}
          onShowPlaylistForm={onShowPlaylistForm}
          onCloseBookDescription={onCloseBookDescription}
        />
      )}

      {/* DROPDOWN LAMA (untuk backward compatibility) - HAPUS JIKA SUDAH TIDAK DIPERLUKAN */}
      {showDropdown && !currentMode && (
        <div style={{
          position: isMobile ? 'fixed' : 'absolute',
          bottom: isMobile ? '0' : '100%',
          left: isMobile ? '0' : 'auto',
          right: isMobile ? '0' : '0',
          top: isMobile ? 'auto' : 'auto',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: isMobile ? '12px 12px 0 0' : '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          minWidth: isMobile ? '100%' : '280px',
          maxWidth: isMobile ? '100%' : '400px',
          zIndex: 1000,
          marginBottom: isMobile ? '0' : '8px',
          animation: isMobile ? 'slideUp 0.3s ease-out' : 'slideDown 0.2s ease-out',
          maxHeight: isMobile ? '70vh' : '400px',
          overflowY: 'auto'
        }}>
          
          {/* Header */}
          <div style={{
            padding: '1rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#2d3748',
            borderBottom: '1px solid #f7fafc',
            backgroundColor: '#f8fafc',
            borderTopLeftRadius: isMobile ? '12px' : '12px',
            borderTopRightRadius: isMobile ? '12px' : '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            position: isMobile ? 'sticky' : 'static',
            top: 0,
            zIndex: 1
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

          {/* Close Button for Mobile */}
          {isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDropdown(false);
              }}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#718096',
                cursor: 'pointer',
                zIndex: 1002,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              ×
            </button>
          )}

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
            <div style={{ maxHeight: isMobile ? '50vh' : '200px', overflowY: 'auto' }}>
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
              borderBottomLeftRadius: isMobile ? '0' : '12px',
              borderBottomRightRadius: isMobile ? '0' : '12px',
              position: isMobile ? 'sticky' : 'static',
              bottom: 0
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
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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