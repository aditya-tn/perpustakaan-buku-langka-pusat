import { useState } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';

const CreatePlaylistForm = ({ book, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { createPlaylist } = usePlaylist();

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

  const handleClose = () => {
    onClose();
  };

  const styles = {
    container: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1.5rem',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '1rem'
    },
    closeButton: {
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
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: 'white',
      marginBottom: '0.25rem',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      resize: 'vertical',
      transition: 'border-color 0.2s',
      fontFamily: 'inherit',
      backgroundColor: 'white',
      minHeight: '80px',
      boxSizing: 'border-box'
    },
    infoBox: {
      backgroundColor: '#f0fff4',
      padding: '0.75rem',
      borderRadius: '6px',
      marginBottom: '1.5rem',
      border: '1px solid #9ae6b4',
      fontSize: '0.8rem',
      color: '#22543d'
    },
    button: {
      padding: '0.6rem 1.25rem',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ flex: 1, paddingRight: '1rem' }}>
          <h4 style={{ 
            margin: '0 0 0.25rem 0',
            color: '#2d3748',
            fontSize: '1rem',
            fontWeight: '600',
            lineHeight: '1.3'
          }}>
            Buat Playlist Baru
          </h4>
          <div style={{ fontSize: '0.75rem', color: '#718096' }}>
            📚 Tambahkan buku ke playlist komunitas
          </div>
        </div>
        
        <button
          onClick={handleClose}
          style={styles.closeButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f7fafc'}
        >
          ×
        </button>
      </div>

      {/* Book Info */}
      {book && (
        <div style={{
          backgroundColor: '#f7fafc',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            Menambahkan buku:
          </div>
          <div style={{ marginBottom: '0.2rem' }}>
            <strong>Judul:</strong> {book.judul}
          </div>
          {book.pengarang && (
            <div style={{ marginBottom: '0.2rem' }}>
              <strong>Pengarang:</strong> {book.pengarang}
            </div>
          )}
          {book.tahun_terbit && (
            <div>
              <strong>Tahun:</strong> {book.tahun_terbit}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Nama Playlist */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#4a5568',
            fontSize: '0.85rem'
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
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#4299e1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            maxLength={100}
            autoFocus
          />
          <div style={{
            fontSize: '0.7rem',
            color: '#718096',
            textAlign: 'right'
          }}>
            {formData.name.length}/100 karakter
          </div>
        </div>

        {/* Deskripsi */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#4a5568',
            fontSize: '0.85rem'
          }}>
            Deskripsi (opsional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              description: e.target.value 
            }))}
            placeholder="Jelaskan tentang playlist ini..."
            style={styles.textarea}
            onFocus={(e) => e.target.style.borderColor = '#4299e1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            maxLength={500}
          />
          <div style={{
            fontSize: '0.7rem',
            color: '#718096',
            textAlign: 'right'
          }}>
            {formData.description.length}/500 karakter
          </div>
        </div>

        {/* Info Box */}
        <div style={styles.infoBox}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            🌐 Playlist Komunitas
          </div>
          Playlist ini akan terlihat oleh semua pengguna
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              ...styles.button,
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              color: '#4a5568'
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
              ...styles.button,
              backgroundColor: loading || !formData.name.trim() ? '#cbd5e0' : '#4299e1',
              color: 'white'
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
  );
};

export default CreatePlaylistForm;