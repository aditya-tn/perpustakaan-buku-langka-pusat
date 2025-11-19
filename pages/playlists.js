// pages/playlists.js - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useNotification } from '../contexts/NotificationContext'; // ✅ TAMBAH INI
import { searchService, analyticsService } from '../services/indexService';

const PlaylistsPage = () => {
  const router = useRouter();
  const { playlists, loading, userId, deletePlaylist, trackView } = usePlaylist(); // ✅ TAMBAH trackView
  const { addNotification } = useNotification(); // ✅ TAMBAH INI
  
  const [view, setView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [stats, setStats] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [hoveredPlaylist, setHoveredPlaylist] = useState(null);

  // Load platform stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const platformStats = await analyticsService.getPlatformStats();
        setStats(platformStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();
  }, []);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchService.searchPlaylists(searchQuery, {
          limit: 50,
          sortBy: 'relevance'
        });
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter playlists based on view
  const getFilteredPlaylists = () => {
    let filtered = searchQuery ? searchResults : playlists;

    switch (view) {
      case 'my':
        filtered = filtered.filter(playlist => playlist.created_by === userId);
        break;
      case 'popular':
        filtered = filtered.filter(playlist => (playlist.like_count || 0) > 0);
        break;
      case 'trending':
        filtered = filtered.filter(playlist => (playlist.like_count || 0) > 0);
        break;
      default:
        break;
    }

    // Sort playlists
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return filtered;
  };

  const filteredPlaylists = getFilteredPlaylists();

  // Handle delete playlist - ✅ DIPERBAIKI DENGAN NOTIFIKASI
  const handleDeletePlaylist = async (playlistData) => {
    try {
      await deletePlaylist(playlistData.playlistId);
      setDeleteConfirm(null);
      
      // ✅ TAMBAH NOTIFIKASI SUKSES
      addNotification({
        type: 'success',
        title: 'Playlist Dihapus 🗑️',
        message: `Playlist "${playlistData.playlistName}" berhasil dihapus`,
        icon: '✅',
        duration: 3000
      });
    } catch (error) {
      console.error('Delete failed:', error);
      
      // ✅ TAMBAH NOTIFIKASI ERROR
      addNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: error.message || 'Gagal menghapus playlist',
        icon: '❌',
        duration: 5000
      });
    }
  };

  // Stats cards component
  const StatCard = ({ title, value, description, icon }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '0.25rem'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#718096'
      }}>
        {description}
      </div>
    </div>
  );

  // Playlist card component - ✅ DIPERBAIKI
  const PlaylistCard = ({ playlist }) => {
    const isOwner = playlist.created_by === userId;

    const handleClick = async (e) => {
      e.preventDefault();
      
      // HANYA tracking di sini, tidak perlu di handler lain
      try {
        await trackView(playlist.id);
        console.log('✅ Tracked view from playlists page:', playlist.id);
      } catch (error) {
        console.error('❌ Tracking failed:', error);
      }
      
      router.push(`/playlists/${playlist.id}`);
    };

    return (
      <div 
        onClick={handleClick} // ✅ PAKAI HANDLER BARU
        style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={() => setHoveredPlaylist(playlist.id)}
        onMouseLeave={() => setHoveredPlaylist(null)}
      >
        {/* Delete Button - Show on hover for owner */}
        {isOwner && ( // ✅ TAMBAH CONDITIONAL RENDERING
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm({
                playlistId: playlist.id,
                playlistName: playlist.name,
                bookCount: playlist.books?.length || 0,
                step: 1,
                verificationText: ''
              });
            }}
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: '#f56565',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem 0.6rem',
              fontSize: '0.7rem',
              fontWeight: '600',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e53e3e';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f56565';
              e.target.style.transform = 'scale(1)';
            }}
          >
            🗑️
          </button>
        )}

        {/* Header */}
        <div style={{
          marginBottom: '1rem',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#2d3748',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            paddingRight: isOwner ? '2rem' : '0'
          }}>
            {playlist.name}
          </h3>
          {playlist.description && (
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#718096',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {playlist.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          fontSize: '0.75rem',
          color: '#718096'
        }}>
          <span>📚 {playlist.books?.length || 0} buku</span>
          <span>❤️ {playlist.like_count || 0}</span>
          <span>👁️ {playlist.view_count || 0}</span>
        </div>

        {/* Book preview */}
        {playlist.books && playlist.books.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '0.5rem'
            }}>
              Beberapa buku:
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              {playlist.books.slice(0, 3).map((book, index) => (
                <div key={index} style={{
                  fontSize: '0.75rem',
                  color: '#718096',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f7fafc',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {book.judul}
                  {book.pengarang && ` - ${book.pengarang}`}
                </div>
              ))}
              {playlist.books.length > 3 && (
                <div style={{
                  fontSize: '0.7rem',
                  color: '#4299e1',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  +{playlist.books.length - 3} buku lainnya
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem',
          color: '#718096'
        }}>
          <span>
            Dibuat oleh {isOwner ? 'Anda' : 'Komunitas'}
          </span>
          <span>
            {new Date(playlist.created_at).toLocaleDateString('id-ID')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <Head>
        <title>Playlists Komunitas - Perpustakaan Buku Langka</title>
        <meta name="description" content="Jelajahi playlist buku yang dikurasi komunitas" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Playlists Komunitas
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '2rem',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            Temukan koleksi buku yang dikurasi oleh komunitas pencinta literatur
          </p>

          {/* Stats Overview */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <StatCard
                title="Total Playlists"
                value={stats.totals.playlists}
                description="Koleksi komunitas"
                icon="📚"
              />
              <StatCard
                title="Total Buku"
                value={stats.totals.books}
                description="Dalam semua playlist"
                icon="📖"
              />
              <StatCard
                title="Total Likes"
                value={stats.totals.likes}
                description="Dari komunitas"
                icon="❤️"
              />
              <StatCard
                title="Playlists Baru"
                value={stats.growth.playlistsCreatedThisWeek}
                description="Minggu ini"
                icon="🆕"
              />
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section style={{
        maxWidth: '1400px',
        margin: '2rem auto',
        padding: '0 2rem'
      }}>
        
        {/* Controls */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            
            {/* View Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Semua Playlists', icon: '📚' },
                { key: 'my', label: 'Playlists Saya', icon: '👤' },
                { key: 'popular', label: 'Populer', icon: '❤️' },
                { key: 'trending', label: 'Trending', icon: '🔥' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: view === tab.key ? '#4299e1' : '#f7fafc',
                    color: view === tab.key ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '300px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari playlist atau buku..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#718096'
              }}>
                🔍
              </span>
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="recent">Terbaru</option>
              <option value="popular">Paling Populer</option>
              <option value="name">A-Z</option>
            </select>
          </div>

          {/* Active Filters Info */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f0fff4',
            border: '1px solid #9ae6b4',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#22543d'
          }}>
            Menampilkan {filteredPlaylists.length} playlist
            {searchQuery && ` untuk "${searchQuery}"`}
            {view !== 'all' && ` • ${view === 'my' ? 'Playlists saya' : view === 'popular' ? 'Populer' : 'Trending'}`}
            {isSearching && ' • 🔍 Mencari...'}
          </div>
        </div>

        {/* Playlists Grid */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#718096'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            Memuat playlists...
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>
              {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada playlist'}
            </h3>
            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
              {searchQuery
                ? `Coba kata kunci lain atau buat playlist "${searchQuery}"`
                : 'Jadilah yang pertama membuat playlist komunitas!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                📚 Buat Playlist Pertama
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '2rem' // ✅ REDUCED GAP untuk better layout
          }}>
            {filteredPlaylists.map(playlist => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}
        onClick={() => setDeleteConfirm(null)}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* STEP 1: Konfirmasi Basic */}
            {deleteConfirm.step === 1 && (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>
                  Hapus Playlist?
                </h3>
                <p style={{ color: '#718096', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Anda akan menghapus playlist:<br />
                  <strong>"{deleteConfirm.playlistName}"</strong>
                </p>
                
                <div style={{ 
                  backgroundColor: '#fffaf0', 
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #fed7d7',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: '600', color: '#c53030', marginBottom: '0.5rem' }}>
                    ⚠️ Perhatian:
                  </div>
                  <ul style={{ color: '#744210', fontSize: '0.9rem', margin: 0, paddingLeft: '1.2rem', lineHeight: '1.4' }}>
                    <li>Playlist akan dihapus permanen</li>
                    <li>{deleteConfirm.bookCount} buku akan dihapus dari playlist</li>
                    <li>Tindakan ini tidak dapat dibatalkan</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#e2e8f0',
                      color: '#4a5568',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    Batalkan
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm(prev => ({ ...prev, step: 2 }))}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    Lanjutkan
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: Verifikasi Nama Playlist */}
            {deleteConfirm.step === 2 && (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>
                  Verifikasi Penghapusan
                </h3>
                <p style={{ color: '#718096', marginBottom: '1rem', lineHeight: '1.5' }}>
                  Ketik <strong>manual</strong> nama playlist berikut:<br />
                  <strong style={{ color: '#e53e3e', fontSize: '1.1rem' }}>
                    "{deleteConfirm.playlistName}"
                  </strong>
                </p>

                {/* Warning Message */}
                <div style={{
                  backgroundColor: '#fffaf0',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #fed7d7',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  color: '#744210'
                }}>
                  ⚠️ <strong>Copy-paste tidak diperbolehkan.</strong> Harap ketik manual.
                </div>

                <input
                  type="text"
                  value={deleteConfirm.verificationText || ''}
                  onChange={(e) => setDeleteConfirm(prev => ({ 
                    ...prev, 
                    verificationText: e.target.value 
                  }))}
                  onPaste={(e) => {
                    e.preventDefault();
                    setDeleteConfirm(prev => ({ 
                      ...prev, 
                      pasteAttempted: true 
                    }));
                    
                    e.target.style.borderColor = '#f56565';
                    e.target.style.backgroundColor = '#fed7d7';
                    setTimeout(() => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = 'white';
                    }, 1000);
                  }}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  placeholder="Ketik manual nama playlist..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: deleteConfirm.pasteAttempted ? '2px solid #f56565' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                    outline: 'none',
                    backgroundColor: deleteConfirm.pasteAttempted ? '#fed7d7' : 'white',
                    transition: 'all 0.3s ease'
                  }}
                />

                {deleteConfirm.pasteAttempted && (
                  <div style={{
                    color: '#e53e3e',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ❌ Copy-paste tidak diperbolehkan. Harap ketik manual.
                  </div>
                )}

                <div style={{
                  fontSize: '0.7rem',
                  color: '#718096',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {deleteConfirm.verificationText && deleteConfirm.verificationText !== deleteConfirm.playlistName && (
                    <>❌ Teks tidak sesuai</>
                  )}
                  {deleteConfirm.verificationText && deleteConfirm.verificationText === deleteConfirm.playlistName && (
                    <>✅ Teks sesuai</>
                  )}
                  {!deleteConfirm.verificationText && (
                    <>⌨️ Ketik nama playlist di atas</>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => setDeleteConfirm(prev => ({ ...prev, step: 1, verificationText: '', pasteAttempted: false }))}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#e2e8f0',
                      color: '#4a5568',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    Kembali
                  </button>
                  <button 
                    onClick={() => handleDeletePlaylist(deleteConfirm)}
                    disabled={deleteConfirm.verificationText !== deleteConfirm.playlistName}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: deleteConfirm.verificationText === deleteConfirm.playlistName ? '#f56565' : '#cbd5e0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: deleteConfirm.verificationText === deleteConfirm.playlistName ? 'pointer' : 'not-allowed',
                      fontWeight: '500',
                      flex: 1,
                      opacity: deleteConfirm.verificationText === deleteConfirm.playlistName ? 1 : 0.6
                    }}
                  >
                    Hapus Permanen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PlaylistsPage;
