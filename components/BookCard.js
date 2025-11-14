// components/BookCard.js - UPDATED VERSION WITH BETTER PLAYLIST INDICATORS
import { useState } from 'react';
import { usePlaylist } from '../contexts/PlaylistContext';
import BookDescription from './BookDescription';
import PlaylistButton from './PlaylistButton/PlaylistButton';
import CreatePlaylistForm from './PlaylistModal/CreatePlaylistForm';

// Helper function untuk extract tahun
const extractYearFromString = (yearStr) => {
  if (!yearStr) return null;
  
  const exactYearMatch = yearStr.match(/^(\d{4})$/);
  if (exactYearMatch) {
    const year = parseInt(exactYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const bracketYearMatch = yearStr.match(/\[(\d{4})\]/);
  if (bracketYearMatch) {
    const year = parseInt(bracketYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const approxYearMatch = yearStr.match(/(\d{4})/);
  if (approxYearMatch) {
    const year = parseInt(approxYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  return null;
};

const BookCard = ({ book, isSelected, onCardClick, isMobile = false, showDescription = false, onRemoveBook = null }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const { playlists, trackView } = usePlaylist();

  // Cari playlist yang berisi buku ini
  const playlistsContainingBook = playlists.filter(playlist => 
    playlist.books?.some(b => b.id === book.id)
  );

  const handleCardClick = () => {
    console.log('🟢 BookCard clicked:', book.judul);
    if (onCardClick) {
      onCardClick(isSelected ? null : book);
    }
  };

  const handleCloseDescription = () => {
    if (onCardClick) {
      onCardClick(null);
    }
    setShowPlaylistForm(false);
  };

  // Handle playlist form close - SELALU close card
  const handlePlaylistFormClose = () => {
    setShowPlaylistForm(false);
    if (onCardClick) {
      onCardClick(null);
    }
  };

  const handlePlaylistCreated = (newPlaylist) => {
    setShowPlaylistForm(false);
    if (onCardClick) {
      onCardClick(null);
    }
    console.log('Playlist created:', newPlaylist);
  };

  // Handle klik playlist indicator - TAMBAHKAN TRACK VIEW
  const handlePlaylistClick = async (playlistId, playlistName, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🎯 Opening playlist:', playlistName, playlistId);
    
    try {
      // Track view sebelum membuka playlist
      await trackView(playlistId);
      console.log('✅ View tracked for playlist:', playlistId);
      
      // Buka playlist di tab baru
      window.open(`/playlists/${playlistId}`, '_blank');
    } catch (error) {
      console.error('❌ Error tracking view:', error);
      // Tetap buka playlist meski tracking gagal
      window.open(`/playlists/${playlistId}`, '_blank');
    }
  };

  // Jika kartu dipilih, tampilkan BookDescription ATAU CreatePlaylistForm
  if (isSelected && (showDescription || showPlaylistForm)) {
    return (
      <div 
        className="book-card-hover"
        style={{
          backgroundColor: 'white',
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(66, 153, 225, 0.25)',
          border: '2px solid #4299e1',
          transition: 'all 0.3s ease',
          position: 'relative',
          minHeight: '200px',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          const isInteractiveElement = 
            e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.closest('button') || 
            e.target.closest('input') ||
            e.target.closest('textarea');
          
          if (!isInteractiveElement) {
            handleCloseDescription();
          }
        }}
      >
        {showPlaylistForm ? (
          <CreatePlaylistForm 
            book={book}
            onClose={handlePlaylistFormClose}
            onCreated={handlePlaylistCreated}
          />
        ) : (
          <BookDescription 
            book={book} 
            onClose={handleCloseDescription}
            autoOpen={true}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      className="book-card-hover"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        padding: isMobile ? '1.25rem' : '1.5rem',
        borderRadius: '12px',
        boxShadow: isHovered ? 
          '0 8px 25px rgba(0,0,0,0.15)' : 
          isSelected ? '0 4px 12px rgba(66, 153, 225, 0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        border: isSelected ? 
          '2px solid #4299e1' : 
          isHovered ? '2px solid #e2e8f0' : '1px solid #f0f0f0',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      {/* Exact Title Match Indicator */}
      {book._matchType === 'exact-title' && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          backgroundColor: '#e53e3e',
          color: 'white',
          fontSize: '0.6rem',
          padding: '0.2rem 0.4rem',
          borderRadius: '8px',
          fontWeight: '600',
          zIndex: 2
        }}>
          EXACT TITLE
        </div>
      )}
      
      {/* Symbol Variation Match Indicator */}
      {book._matchType === 'symbol-variation' && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          backgroundColor: '#d69e2e',
          color: 'white',
          fontSize: '0.6rem',
          padding: '0.2rem 0.4rem',
          borderRadius: '8px',
          fontWeight: '600',
          zIndex: 2
        }}>
          SYMBOL MATCH
        </div>
      )}
      
      {/* Relevance Indicator */}
      {book._relevanceScore > 100 && book._matchType === 'fuzzy' && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: '#48bb78',
          color: 'white',
          fontSize: '0.7rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '12px',
          fontWeight: '600'
        }}>
          🔥 Relevan
        </div>
      )}
      
      {/* Book Content */}
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          marginBottom: '0.75rem'
        }}>
          <h4 style={{ 
            fontWeight: '600',
            color: isSelected ? '#4299e1' : '#2d3748',
            fontSize: isMobile ? '1rem' : '1.1rem',
            lineHeight: '1.4',
            margin: '0',
            flex: 1,
            transition: 'color 0.3s ease',
            paddingRight: '0.5rem'
          }}>
            {book.judul}
          </h4>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            fontSize: isMobile ? '0.8rem' : '0.9rem', 
            color: '#4a5568', 
            marginBottom: '0.25rem' 
          }}>
            <strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '0.8rem' : '0.9rem', 
            color: '#4a5568', 
            marginBottom: '0.25rem' 
          }}>
            <strong>Tahun:</strong> 
            <span style={{
              backgroundColor: extractYearFromString(book.tahun_terbit) ? '#f0fff4' : '#fffaf0',
              padding: '0.1rem 0.3rem',
              borderRadius: '4px',
              marginLeft: '0.3rem',
              fontFamily: 'monospace'
            }}>
              {book.tahun_terbit || 'Tidak diketahui'}
              {!extractYearFromString(book.tahun_terbit) && book.tahun_terbit && ' ⚠️'}
            </span>
          </div>
          <div style={{ 
            fontSize: isMobile ? '0.8rem' : '0.9rem', 
            color: '#4a5568' 
          }}>
            <strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}
          </div>
        </div>

        {book.deskripsi_fisik && (
          <p style={{ 
            fontSize: isMobile ? '0.75rem' : '0.85rem', 
            color: '#718096', 
            marginTop: '0.75rem',
            lineHeight: '1.5',
            fontStyle: 'italic',
            paddingRight: '0.5rem',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {book.deskripsi_fisik}
          </p>
        )}
      </div>

      {/* PLAYLIST INDICATORS - POSISI BARU: DI ATAS TOMBOL PLAYLIST */}
      {playlistsContainingBook.length > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '0.8rem'
        }}>
          <div style={{
            fontWeight: '600',
            color: '#4a5568',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem'
          }}>
            📚 Buku ini masuk dalam playlist:
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            {playlistsContainingBook.slice(0, 3).map(playlist => (
              <span 
                key={playlist.id}
                style={{
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  border: '1px solid #cbd5e0',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={(e) => handlePlaylistClick(playlist.id, playlist.name, e)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e2e8f0';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#edf2f7';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {playlist.name}
              </span>
            ))}
            {playlistsContainingBook.length > 3 && (
              <span 
                style={{
                  color: '#718096',
                  fontSize: '0.75rem',
                  fontStyle: 'italic',
                  padding: '0.3rem 0.6rem',
                  backgroundColor: '#f7fafc',
                  borderRadius: '6px',
                  border: '1px dashed #cbd5e0',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Buka halaman playlists dengan filter
                  window.open('/playlists', '_blank');
                }}
              >
                +{playlistsContainingBook.length - 3} lainnya
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
<div style={{
  marginTop: '0.75rem',
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
  justifyContent: 'space-between', // ← Biar tombol rata kiri-kanan
  alignItems: 'center'
}}>

  {/* Left Side: Playlist Button + OPAC + Pesan */}
  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
    <PlaylistButton
      book={book}
      onShowPlaylistForm={() => {
        if (!isSelected) {
          onCardClick(book);
        }
        setShowPlaylistForm(true);
      }}
      onCloseBookDescription={() => onCardClick(null)}
    />

    {/* Tombol OPAC */}
    {book.lihat_opac && book.lihat_opac !== 'null' && (
      <a
        href={book.lihat_opac}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: isHovered ? '#3182ce' : '#4299e1',
          color: 'white',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '0.75rem',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        📖 OPAC
      </a>
    )}

    {/* Tombol Pesan */}
    {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
      <a
        href={book.link_pesan_koleksi}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: isHovered ? '#38a169' : '#48bb78',
          color: 'white',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '0.75rem',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        📥 Pesan
      </a>
    )}
  </div>

  {/* Right Side: Delete Button (Hanya di playlist detail) */}
  {onRemoveBook && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemoveBook(book.id);
      }}
      style={{
        backgroundColor: '#f56565',
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
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#e53e3e';
        e.target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#f56565';
        e.target.style.transform = 'scale(1)';
      }}
    >
      🗑️ Hapus dari playlist
    </button>
  )}

</div>
    </div>
  );
};

export default BookCard;