import { useState, useEffect } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';

const CreatePlaylistModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const { createPlaylist } = usePlaylist();

  // ⚡ PREVENT BODY SCROLL & ADD BACKDROP FILTER
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Nama playlist wajib diisi');
      return;
    }

    setLoading(true);
    
    try {
      const newPlaylist = createPlaylist(formData);
      
      if (newPlaylist && onCreated) {
        onCreated(newPlaylist);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Gagal membuat playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // ⚡ DARKER OVERLAY
        backdropFilter: 'blur(4px)', // ⚡ BLUR EFFECT
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647, // ⚡ MAXIMUM Z-INDEX
        padding: '1rem'
      }}
      onClick={handleOverlayClick}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)', // ⚡ STRONGER SHADOW
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh', // ⚡ REDUCED HEIGHT
          overflowY: 'auto',
          position: 'relative',
          border: '2px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 1
        }}>
          <h2 style={{
            margin: 0,
            color: '#2d3748',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Buat Playlist Baru
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#718096',
              padding: '0.25rem',
              borderRadius: '4px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nama Playlist */}
          <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#4a5568',
              fontSize: '0.9rem'
            }}>
              Nama Playlist *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
              placeholder="Contoh: Sejarah Indonesia, Sastra Jawa, dll."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: 'white',
                position: 'relative',
                zIndex: 2
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              maxLength={100}
              autoFocus
            />
            <div style={{
              fontSize: '0.75rem',
              color: '#718096',
              marginTop: '0.25rem',
              textAlign: 'right'
            }}>
              {formData.name.length}/100 karakter
            </div>
          </div>

          {/* Deskripsi */}
          <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#4a5568',
              fontSize: '0.9rem'
            }}>
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              placeholder="Jelaskan tentang playlist ini... (opsional)"
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                position: 'relative',
                zIndex: 2
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              maxLength={500}
            />
            <div style={{
              fontSize: '0.75rem',
              color: '#718096',
              marginTop: '0.25rem',
              textAlign: 'right'
            }}>
              {formData.description.length}/500 karakter
            </div>
          </div>

          {/* Visibility Info */}
          <div style={{
            backgroundColor: '#f0fff4',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #9ae6b4',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#22543d',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}>
              🌐 Playlist Komunitas
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#2d3748',
              marginTop: '0.25rem'
            }}>
              Terlihat oleh semua pengguna
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            zIndex: 1
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#4a5568',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#cbd5e0';
                e.target.style.backgroundColor = '#f7fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = 'white';
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: loading || !formData.name.trim() ? '#cbd5e0' : '#4299e1',
                color: 'white',
                cursor: loading || !formData.name.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                if (!loading && formData.name.trim()) {
                  e.target.style.backgroundColor = '#3182ce';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && formData.name.trim()) {
                  e.target.style.backgroundColor = '#4299e1';
                }
              }}
            >
              {loading ? 'Membuat...' : 'Buat Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;