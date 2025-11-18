// components/PlaylistButton/NovicePlaylistRecommendations.js - COMPLETE FIXED VERSION

import { useState, useEffect } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';
import { useNotification } from '../../contexts/NotificationContext';

const NovicePlaylistRecommendations = ({ book, onClose, onShowPlaylistForm, onCloseBookDescription, integratedMode = false, onBookAdded }) => {
  const { playlists, addToPlaylist } = usePlaylist();
  const { addNotification } = useNotification();
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToPlaylist, setAddingToPlaylist] = useState(null);

  useEffect(() => {
    loadAIRecommendations();
  }, [book, playlists]);

  const loadAIRecommendations = async () => {
    setLoading(true);
    try {
      // Filter playlists yang available (tidak mengandung buku ini)
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      );

      console.log('🎯 Available playlists for recommendations:', availablePlaylists.length);

      if (availablePlaylists.length === 0) {
        console.log('⚠️ No playlists available for recommendations');
        setAiRecommendations([]);
        return;
      }

      // Kirim semua playlist IDs, biar API yang filter
      const response = await fetch('/api/ai-playlist-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          playlistIds: availablePlaylists.map(p => p.id)
        })
      });

      if (!response.ok) {
        throw new Error(`API response: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data.recommendations) {
        console.log('✅ AI Recommendations received:', result.data.recommendations.length);
        setAiRecommendations(result.data.recommendations);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }

    } catch (error) {
      console.error('❌ Failed to load AI recommendations:', error);
      // Fallback sederhana
      const availablePlaylists = playlists.filter(playlist =>
        !playlist.books?.some(b => b.id === book.id)
      ).slice(0, 3); // Ambil 3 pertama sebagai fallback
      
      const fallbackRecs = availablePlaylists.map(playlist => ({
        playlistId: playlist.id,
        playlistName: playlist.name,
        matchScore: 50,
        confidence: 0.3,
        reasoning: 'Analisis sederhana - pertimbangkan review manual',
        improvementSuggestions: ['Sistem AI sedang tidak tersedia'],
        isFallback: true
      }));
      
      setAiRecommendations(fallbackRecs);
      
      addNotification({
        type: 'warning',
        title: 'Rekomendasi Dasar',
        message: 'Menggunakan analisis sederhana',
        icon: '⚠️'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId, playlistName) => {
    setAddingToPlaylist(playlistId);
    
    try {
      const result = await addToPlaylist(playlistId, book);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil! 🎉',
          message: `"${book.judul}" ditambahkan ke "${playlistName}"`,
          icon: '✅',
          duration: 3000
        });
        
        // 🆕 TRIGGER REFRESH DI PARENT COMPONENT
        if (onBookAdded) {
          onBookAdded();
        }

        // Save AI score jika ada
        const recommendation = aiRecommendations.find(rec => rec.playlistId === playlistId);
        if (recommendation && !recommendation.isFallback) {
          await saveAIScoreToDatabase(playlistId, book.id, {
            matchScore: recommendation.matchScore,
            confidence: recommendation.confidence,
            reasoning: recommendation.reasoning
          });

          // 🆕 TRIGGER REFRESH LAGI SETELAH AI SCORE DISIMPAN
          if (onBookAdded) {
            setTimeout(() => {
              onBookAdded();
            }, 1000);
          }
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      addNotification({
        type: 'error',
        title: 'Gagal Menambahkan',
        message: error.message,
        icon: '❌',
        duration: 5000
      });
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const saveAIScoreToDatabase = async (playlistId, bookId, analysis) => {
    try {
      await fetch('/api/save-ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId,
          bookId,
          analysis
        })
      });
      console.log('✅ AI score saved from novice mode');
    } catch (error) {
      console.error('Failed to save AI score from novice mode:', error);
    }
  };

  // 🆕 TAMBAH FUNCTION YANG HILANG: handleCreatePlaylist
  const handleCreatePlaylist = () => {
    // Close book description if open
    if (onCloseBookDescription) {
      onCloseBookDescription();
    }

    // Show playlist form
    if (onShowPlaylistForm) {
      onShowPlaylistForm();
    }

    // Close current modal
    onClose();

    // Notification untuk create playlist
    addNotification({
      type: 'info',
      title: 'Buat Playlist Baru',
      message: 'Isi form untuk membuat playlist baru',
      icon: '📝',
      duration: 3000
    });
  };

  // 🆕 FUNCTION: Tampilkan AI score badge
  const getScoreDisplay = (matchScore) => {
    const getScoreStyle = (score) => {
      if (score >= 80) return { background: '#10B981', color: 'white' };
      if (score >= 60) return { background: '#F59E0B', color: 'white' };
      if (score >= 40) return { background: '#EF4444', color: 'white' };
      return { background: '#6B7280', color: 'white' };
    };

    const style = getScoreStyle(matchScore);

    return (
      <span style={{
        backgroundColor: style.background,
        color: style.color,
        padding: '0.2rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: '600',
        minWidth: '40px',
        textAlign: 'center',
        marginLeft: '0.5rem'
      }}>
        {matchScore}%
      </span>
    );
  };

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
    minWidth: '450px',
    maxWidth: '500px',
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

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>🤖</span>
          {integratedMode ? 'AI Sedang Menganalisis...' : 'Rekomendasi AI'}
        </div>
        <div style={{
          padding: integratedMode ? '3rem 2rem' : '2rem',
          textAlign: 'center',
          color: '#718096'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
          <div style={{ marginBottom: '0.5rem' }}>AI sedang menganalisis playlist...</div>
          <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
            Mencari playlist terbaik untuk "{book.judul}"
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e2e8f0',
            borderRadius: '2px',
            marginTop: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '60%',
              height: '100%',
              backgroundColor: '#4299e1',
              borderRadius: '2px',
              animation: 'loading 2s ease-in-out infinite'
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span>🤖</span>
        {integratedMode ? 'Rekomendasi AI' : 'Rekomendasi AI'}
        {!integratedMode && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: '400',
            color: '#718096',
            marginLeft: 'auto'
          }}>
            {aiRecommendations.length} rekomendasi
          </span>
        )}
      </div>

      {/* AI Recommendations */}
      <div style={{
        maxHeight: integratedMode ? '500px' : '400px',
        overflowY: 'auto',
        padding: integratedMode ? '0.5rem' : '0'
      }}>
        {aiRecommendations.length === 0 ? (
          <div style={{
            padding: integratedMode ? '2rem 1rem' : '1.5rem 1rem',
            textAlign: 'center',
            color: '#718096',
            fontSize: '0.8rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤔</div>
            Tidak ada rekomendasi yang ditemukan
            <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: '#a0aec0' }}>
              Coba buat playlist baru atau tambahkan manual
            </div>
          </div>
        ) : (
          aiRecommendations.map((rec, index) => (
            <div
              key={rec.playlistId || index}
              style={{
                padding: integratedMode ? '1.25rem' : '1.25rem',
                borderBottom: '1px solid #f7fafc',
                cursor: addingToPlaylist === rec.playlistId ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: addingToPlaylist === rec.playlistId ? '#f0fff4' : 'white',
                ...(integratedMode && {
                  borderRadius: '8px',
                  margin: '0.5rem 0',
                  border: '1px solid #e2e8f0'
                })
              }}
              onMouseEnter={(e) => {
                if (addingToPlaylist !== rec.playlistId) {
                  e.currentTarget.style.backgroundColor = '#f7fafc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (addingToPlaylist !== rec.playlistId) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
              onClick={() => handleAddToPlaylist(rec.playlistId, rec.playlistName)}
            >
              {/* 🆕 UPDATED: Match Score Section dengan Permanent Score Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {/* Main Match Score Badge */}
                <div style={{
                  padding: '0.35rem 0.75rem',
                  backgroundColor: getScoreColor(rec.matchScore).background,
                  color: getScoreColor(rec.matchScore).color,
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  border: `2px solid ${getScoreColor(rec.matchScore).border}`
                }}>
                  {rec.matchScore}% Match
                </div>

                {/* 🆕 PERMANENT SCORE DISPLAY - akan tetap visible */}
                {getScoreDisplay(rec.matchScore)}

                {/* AI Confidence Indicator */}
                {!rec.isFallback && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#718096',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981'
                    }} />
                    AI Analysis
                  </div>
                )}

                {/* Fallback Indicator */}
                {rec.isFallback && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#F59E0B'
                    }} />
                    Rule-based
                  </div>
                )}

                {addingToPlaylist === rec.playlistId && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #48bb78',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginLeft: 'auto'
                  }} />
                )}
              </div>

              {/* Playlist Info */}
              <div style={{
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '0.5rem',
                fontSize: integratedMode ? '1rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {rec.playlistName}
              </div>

              {/* AI Reasoning */}
              <div style={{
                fontSize: integratedMode ? '0.9rem' : '0.85rem',
                color: '#718096',
                lineHeight: '1.4',
                marginBottom: '0.75rem'
              }}>
                {rec.reasoning}
              </div>

              {/* Improvement Suggestions */}
              {rec.improvementSuggestions && rec.improvementSuggestions.length > 0 && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#d69e2e',
                  fontStyle: 'italic'
                }}>
                  💡 {rec.improvementSuggestions[0]}
                </div>
              )}
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
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// Helper function untuk score colors (tetap di luar component)
const getScoreColor = (score) => {
  if (score >= 80) return { background: '#f0fff4', color: '#22543d', border: '#9ae6b4' };
  if (score >= 60) return { background: '#fffaf0', color: '#744210', border: '#faf089' };
  return { background: '#fff5f5', color: '#c53030', border: '#fc8181' };
};

export default NovicePlaylistRecommendations;