// components/PlaylistModal/IntegratedModeSelection.js
import { useState } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';
import ExpertPlaylistDropdown from '../PlaylistButton/ExpertPlaylistDropdown';
import NovicePlaylistRecommendations from '../PlaylistButton/NovicePlaylistRecommendations';

const IntegratedModeSelection = ({ book, onClose, onShowPlaylistForm }) => {
  const [currentMode, setCurrentMode] = useState(null); // 'expert' | 'novice'
  const [showInitialChoice, setShowInitialChoice] = useState(true);

  const handleExpertSelect = () => {
    setCurrentMode('expert');
    setShowInitialChoice(false);
  };

  const handleNoviceSelect = () => {
    setCurrentMode('novice');
    setShowInitialChoice(false);
  };

  const handleBackToChoice = () => {
    setCurrentMode(null);
    setShowInitialChoice(true);
  };

  const handleCloseMode = () => {
    onClose();
  };

  if (showInitialChoice) {
    return (
      <div style={{
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem'
        }}>
          <div>
            <h4 style={{
              margin: '0 0 0.25rem 0',
              color: '#2d3748',
              fontSize: '1.1rem',
              fontWeight: '600',
              lineHeight: '1.3'
            }}>
              Tambah ke Playlist
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#718096' }}>
              Pilih cara menambahkan "{book.judul}"
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#718096',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: '#f7fafc',
              transition: 'all 0.2s ease'
            }}
          >
            ×
          </button>
        </div>

        {/* Choice Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* AI GUIDANCE OPTION */}
          <div
            onClick={handleNoviceSelect}
            style={{
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4299e1';
              e.currentTarget.style.backgroundColor = '#f7fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>
                Bantu Aku Tentukan
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', color: '#718096', fontSize: '0.9rem' }}>
                AI akan menganalisis & merekomendasikan playlist terbaik
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ 
                  backgroundColor: '#f0fff4', 
                  color: '#22543d',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>🎯 Rekomendasi Pintar</span>
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', color: '#4299e1', flexShrink: 0 }}>→</div>
          </div>

          {/* EXPERT MODE OPTION */}
          <div
            onClick={handleExpertSelect}
            style={{
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#48bb78';
              e.currentTarget.style.backgroundColor = '#f0fff4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>⚡</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>
                Aku Sudah Tentukan
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', color: '#718096', fontSize: '0.9rem' }}>
                Langsung pilih playlist - lihat score kejutan nanti
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ 
                  backgroundColor: '#fffaf0', 
                  color: '#744210',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>⚡ Langsung Tambah</span>
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', color: '#48bb78', flexShrink: 0 }}>→</div>
          </div>
        </div>

        {/* Create New Playlist Option */}
        <div
          onClick={() => {
            onShowPlaylistForm();
            onClose();
          }}
          style={{
            padding: '1rem',
            cursor: 'pointer',
            borderTop: '1px solid #f7fafc',
            backgroundColor: '#f0fff4',
            color: '#22543d',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#c6f6d5';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f0fff4';
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>✨</span>
          + Buat Playlist Baru
        </div>
      </div>
    );
  }

  // Render mode-specific components
  return (
    <div style={{ width: '100%' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleBackToChoice}
          style={{
            background: 'none',
            border: 'none',
            color: '#4299e1',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0'
          }}
        >
          ← Kembali ke Pilihan
        </button>
      </div>

      {/* Mode Specific Content */}
      {currentMode === 'expert' && (
        <ExpertPlaylistDropdown
          book={book}
          onClose={handleCloseMode}
          onShowPlaylistForm={onShowPlaylistForm}
          integratedMode={true}
        />
      )}

      {currentMode === 'novice' && (
        <NovicePlaylistRecommendations
          book={book}
          onClose={handleCloseMode}
          onShowPlaylistForm={onShowPlaylistForm}
          integratedMode={true}
        />
      )}
    </div>
  );
};

export default IntegratedModeSelection;