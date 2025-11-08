import { useState } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';

const PlaylistButton = ({ book, onShowPlaylistForm, onCloseBookDescription }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { playlists, addToPlaylist } = usePlaylist();

  const handleAddToPlaylist = (playlistId) => {
    addToPlaylist(playlistId, book);
    setShowDropdown(false);
  };

  // ⚡ NEW: Handle create playlist click
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
  };

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
        style={{
          backgroundColor: isHovered ? '#2b6cb0' : '#4299e1',
          color: 'white',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          border: 'none',
          fontSize: '0.75rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        📚 Tambah ke Playlist
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minWidth: '220px',
          zIndex: 1000,
          marginBottom: '8px'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#718096',
            borderBottom: '1px solid #f7fafc',
            backgroundColor: '#f7fafc'
          }}>
            Pilih Playlist
          </div>
          
          {/* List Playlists */}
          {playlists.length === 0 ? (
            <div style={{ 
              padding: '1rem', 
              textAlign: 'center', 
              color: '#718096',
              fontSize: '0.8rem'
            }}>
              Belum ada playlist
            </div>
          ) : (
            playlists.map(playlist => (
              <div
                key={playlist.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToPlaylist(playlist.id);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f7fafc',
                  fontSize: '0.85rem',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                <span>{playlist.name}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  color: '#718096',
                  backgroundColor: '#e2e8f0',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '8px'
                }}>
                  {playlist.books.length}
                </span>
              </div>
            ))
          )}
          
          {/* Create New Playlist */}
          <div
            onClick={handleCreateClick}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderTop: '1px solid #f7fafc',
              backgroundColor: '#f0fff4',
              color: '#22543d',
              fontWeight: '600',
              fontSize: '0.85rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c6f6d5'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f0fff4'}
          >
            + Buat Playlist Baru
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistButton;