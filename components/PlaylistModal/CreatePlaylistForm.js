// components/PlaylistModal/CreatePlaylistForm.js - WITHOUT PAGE REFRESH
import { useState } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';
import { useNotification } from '../../contexts/NotificationContext';

const CreatePlaylistForm = ({ book, onClose, onCreated, isMobile = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    creatorType: '🔰 Pencinta Buku',
    customCreatorName: ''
  });

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { createPlaylist, refreshUserId, refreshPlaylists } = usePlaylist(); // 🆪 TAMBAH refreshPlaylists
  const { addNotification } = useNotification();

  // Opsi untuk jenis pembuat
  const creatorOptions = [
    { value: '🔰 Pencinta Buku', label: '🔰 Pencinta Buku' },
    { value: '🏆 Kurator Handal', label: '🏆 Kurator Handal' },
    { value: '🎓 Academic Researcher', label: '🎓 Academic Researcher' },
    { value: '🏛️ History Explorer', label: '🏛️ History Explorer' },
    { value: '👨‍⚖️ Pustakawan Koleksi Buku Langka', label: '👨‍⚖️ Pustakawan Koleksi Buku Langka' },
    { value: 'custom', label: '⭐ Tulis nama sendiri (custom)' }
  ];

  // 🆕 FUNCTION: Trigger AI metadata generation
  const triggerAIMetadataGeneration = async (playlistId, playlistName) => {
    try {
      console.log(`🔄 Triggering AI metadata generation for new playlist: ${playlistName}`);
      
      const response = await fetch('/api/playlists/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ AI metadata generated for: ${playlistName}`);
        return true;
      } else {
        console.warn(`⚠️ AI metadata generation warning: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ AI metadata generation failed:', error.message);
      // Silent fail - tidak ganggu user experience
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nama playlist wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      refreshUserId();

      let creatorName = formData.creatorType;
      if (formData.creatorType === 'custom' && formData.customCreatorName.trim()) {
        creatorName = formData.customCreatorName.trim();
      }

      const playlistData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        creator_name: creatorName
      };

      console.log('🔄 Submitting playlist creation...', playlistData);

      const result = await createPlaylist(playlistData);

      if (result.success) {
        console.log('✅ Playlist created successfully:', result.data.id);
        
        // 🆪 TRIGGER AI METADATA GENERATION DI BACKGROUND
        setTimeout(async () => {
          try {
            const aiSuccess = await triggerAIMetadataGeneration(result.data.id, result.data.name);
            
            if (aiSuccess) {
              console.log(`🎉 Auto-AI enhancement completed for: ${result.data.name}`);
              
              // 🆪 TAMPILKAN NOTIFIKASI SUKSES DENGAN AI INFO
              addNotification({
                type: 'success',
                title: 'Playlist + AI Enhanced! 🚀',
                message: `"${result.data.name}" telah dibuat & ditingkatkan dengan AI`,
                icon: '🤖',
                duration: 5000
              });

              // 🆪 REFRESH PLAYLISTS DATA SETELAH AI SELESAI
              setTimeout(() => {
                refreshPlaylists();
                console.log('🔄 Playlists data refreshed after AI enhancement');
              }, 1000);
              
            } else {
              console.log(`ℹ️ Auto-AI enhancement skipped for: ${result.data.name}`);
              
              // Notifikasi standard tanpa AI info
              addNotification({
                type: 'success',
                title: 'Playlist Berhasil Dibuat! ✅',
                message: `"${result.data.name}" telah berhasil dibuat`,
                icon: '📚',
                duration: 4000
              });

              // 🆪 REFRESH PLAYLISTS DATA MESKI AI GAGAL
              setTimeout(() => {
                refreshPlaylists();
                console.log('🔄 Playlists data refreshed (AI skipped)');
              }, 1000);
            }
          } catch (aiError) {
            console.error('❌ Auto-AI enhancement failed:', aiError);
            
            // Fallback notification
            addNotification({
              type: 'success',
              title: 'Playlist Berhasil Dibuat! ✅',
              message: `"${result.data.name}" telah berhasil dibuat`,
              icon: '📚',
              duration: 4000
            });

            // 🆪 REFRESH PLAYLISTS DATA MESKI ADA ERROR
            setTimeout(() => {
              refreshPlaylists();
              console.log('🔄 Playlists data refreshed (AI failed)');
            }, 1000);
          }
        }, 500); // Delay 500ms untuk biar create playlist selesai dulu

        // 🆪 NOTIFIKASI INSTANT - Playlist created
        addNotification({
          type: 'info',
          title: 'Membuat Playlist... 📝',
          message: `"${formData.name.trim()}" sedang diproses`,
          icon: '⏳',
          duration: 2000
        });

        // 🆪 REFRESH PLAYLISTS DATA SEKARANG (tanpa AI)
        setTimeout(() => {
          refreshPlaylists();
          console.log('🔄 Playlists data refreshed immediately');
        }, 300);

        if (onCreated) {
          onCreated(result.data);
        }
        
        // 🆪 TUTUP MODAL SETELAH BERHASIL
        setTimeout(() => {
          onClose();
        }, 800);
        
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error creating playlist:', error);
      setError(`Gagal membuat playlist: ${error.message}`);
      
      // 🆪 TAMPILKAN NOTIFIKASI ERROR
      addNotification({
        type: 'error',
        title: 'Gagal Membuat Playlist',
        message: error.message,
        icon: '❌',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    onClose();
  };

  const handleCreatorTypeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      creatorType: value,
      customCreatorName: value === 'custom' ? prev.customCreatorName : ''
    }));
    setShowCustomInput(value === 'custom');
  };

  const styles = {
    container: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      maxHeight: isMobile ? '85vh' : 'none',
      overflowY: isMobile ? 'auto' : 'visible'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isMobile ? '1rem' : '1.5rem',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: isMobile ? '0.75rem' : '1rem',
      position: isMobile ? 'sticky' : 'static',
      top: 0,
      backgroundColor: 'white',
      zIndex: 10
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: isMobile ? '1.25rem' : '1.5rem',
      cursor: 'pointer',
      color: '#718096',
      padding: '0',
      width: isMobile ? '28px' : '32px',
      height: isMobile ? '28px' : '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: '#f7fafc',
      transition: 'all 0.2s ease',
      flexShrink: 0
    },
    input: {
      width: '100%',
      padding: isMobile ? '0.6rem 0.75rem' : '0.75rem',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: isMobile ? '0.85rem' : '0.9rem',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: 'white',
      marginBottom: '0.25rem',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: isMobile ? '0.6rem 0.75rem' : '0.75rem',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: isMobile ? '0.85rem' : '0.9rem',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: 'white',
      marginBottom: '0.25rem',
      boxSizing: 'border-box',
      cursor: 'pointer'
    },
    textarea: {
      width: '100%',
      padding: isMobile ? '0.6rem 0.75rem' : '0.75rem',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: isMobile ? '0.85rem' : '0.9rem',
      outline: 'none',
      resize: 'vertical',
      transition: 'border-color 0.2s',
      fontFamily: 'inherit',
      backgroundColor: 'white',
      minHeight: isMobile ? '70px' : '80px',
      boxSizing: 'border-box'
    },
    infoBox: {
      backgroundColor: '#f0fff4',
      padding: isMobile ? '0.6rem' : '0.75rem',
      borderRadius: '6px',
      marginBottom: isMobile ? '1rem' : '1.5rem',
      border: '1px solid #9ae6b4',
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      color: '#22543d'
    },
    // 🆪 AI INFO BOX BARU
    aiInfoBox: {
      backgroundColor: '#e6fffa',
      padding: isMobile ? '0.6rem' : '0.75rem',
      borderRadius: '6px',
      marginBottom: isMobile ? '1rem' : '1.5rem',
      border: '1px solid #81e6d9',
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      color: '#234e52'
    },
    button: {
      padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
      border: 'none',
      borderRadius: '6px',
      fontSize: isMobile ? '0.8rem' : '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      flex: isMobile ? 1 : 'none'
    },
    formSection: {
      marginBottom: isMobile ? '1rem' : '1.25rem'
    },
    label: {
      display: 'block',
      marginBottom: isMobile ? '0.4rem' : '0.5rem',
      fontWeight: '600',
      color: '#4a5568',
      fontSize: isMobile ? '0.8rem' : '0.85rem'
    },
    characterCount: {
      fontSize: isMobile ? '0.65rem' : '0.7rem',
      color: '#718096',
      textAlign: 'right'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ flex: 1, paddingRight: isMobile ? '0.5rem' : '1rem' }}>
          <h4 style={{
            margin: '0 0 0.25rem 0',
            color: '#2d3748',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            lineHeight: '1.3'
          }}>
            Buat Playlist Baru
          </h4>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: '#718096',
            lineHeight: '1.3'
          }}>
            📚 Tambahkan buku ke playlist komunitas
          </div>
        </div>
        <button
          onClick={onClose}
          style={styles.closeButton}
        >
          ×
        </button>
      </div>

      {/* 🆕 ERROR MESSAGE */}
      {error && (
        <div style={{
          backgroundColor: '#fed7d7',
          color: '#c53030',
          padding: isMobile ? '0.75rem' : '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid #feb2b2',
          fontSize: isMobile ? '0.8rem' : '0.85rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Book Info */}
      {book && (
        <div style={{
          backgroundColor: '#f7fafc',
          padding: isMobile ? '0.6rem' : '0.75rem',
          borderRadius: '6px',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            Menambahkan buku:
          </div>
          <div style={{ marginBottom: '0.2rem', lineHeight: '1.3' }}>
            <strong>Judul:</strong> {book.judul}
          </div>
          {book.pengarang && (
            <div style={{ marginBottom: '0.2rem', lineHeight: '1.3' }}>
              <strong>Pengarang:</strong> {book.pengarang}
            </div>
          )}
          {book.tahun_terbit && (
            <div style={{ lineHeight: '1.3' }}>
              <strong>Tahun:</strong> {book.tahun_terbit}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Nama Playlist */}
        <div style={styles.formSection}>
          <label style={styles.label}>
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
            autoFocus={!isMobile}
          />
          <div style={styles.characterCount}>
            {formData.name.length}/100 karakter
          </div>
        </div>

        {/* Nama Pembuat - DROPDOWN */}
        <div style={styles.formSection}>
          <label style={styles.label}>
            Nama Pembuat
          </label>
          <select
            value={formData.creatorType}
            onChange={handleCreatorTypeChange}
            style={styles.select}
            onFocus={(e) => e.target.style.borderColor = '#4299e1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            {creatorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom Creator Name Input */}
          {showCustomInput && (
            <div style={{ marginTop: '0.75rem' }}>
              <input
                type="text"
                value={formData.customCreatorName}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  customCreatorName: e.target.value 
                }))}
                placeholder="Tulis nama pembuat playlist..."
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#4299e1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                maxLength={50}
              />
              <div style={styles.characterCount}>
                {formData.customCreatorName.length}/50 karakter
              </div>
            </div>
          )}
        </div>

        {/* Deskripsi */}
        <div style={styles.formSection}>
          <label style={styles.label}>
            Deskripsi Playlist (opsional)
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
          <div style={styles.characterCount}>
            {formData.description.length}/500 karakter
          </div>
        </div>

        {/* 🆪 AI ENHANCEMENT INFO BOX */}
        <div style={styles.aiInfoBox}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🤖</span>
            <span>AI Enhanced Playlist</span>
          </div>
          Playlist ini akan secara otomatis ditingkatkan dengan AI untuk matching buku yang lebih akurat
        </div>

        {/* Info Box */}
        <div style={styles.infoBox}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            🌐 Playlist Komunitas
          </div>
          Playlist ini akan terlihat oleh semua pengguna dan dapat dikurasi bersama
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          justifyContent: 'flex-end',
          flexDirection: isMobile ? 'column' : 'row'
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

