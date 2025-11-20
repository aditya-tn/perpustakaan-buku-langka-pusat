// pages/playlists.js - COMPLETE MOBILE OPTIMIZED VERSION
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useNotification } from '../contexts/NotificationContext';
import { searchService, analyticsService } from '../services/indexService';

const PlaylistsPage = () => {
  const router = useRouter();
  const { playlists, loading, userId, deletePlaylist, trackView } = usePlaylist();
  const { addNotification } = useNotification();

  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [stats, setStats] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Handle delete playlist
  const handleDeletePlaylist = async (playlistData) => {
    try {
      await deletePlaylist(playlistData.playlistId);
      setDeleteConfirm(null);
      addNotification({
        type: 'success',
        title: 'Playlist Dihapus 🗑️',
        message: `Playlist "${playlistData.playlistName}" berhasil dihapus`,
        icon: '✅',
        duration: 3000
      });
    } catch (error) {
      console.error('Delete failed:', error);
      addNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: error.message || 'Gagal menghapus playlist',
        icon: '❌',
        duration: 5000
      });
    }
  };

  // Stats Card Component
  const StatCard = ({ title, value, description, icon }) => (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1rem' : '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: isMobile ? '1.5rem' : '2rem', 
        marginBottom: '0.5rem' 
      }}>{icon}</div>
      <div style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: isMobile ? '0.8rem' : '0.9rem',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '0.25rem'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: '#718096'
      }}>
        {description}
      </div>
    </div>
  );

  // Playlist Card Component - MOBILE OPTIMIZED
  const PlaylistCard = ({ playlist, isMobile = false }) => {
    const isOwner = playlist.created_by === userId;

    const handleClick = async (e) => {
      e.preventDefault();
      try {
        await trackView(playlist.id);
        console.log('✅ Tracked view for playlist:', playlist.id);
      } catch (error) {
        console.error('❌ Tracking failed:', error);
      }
      router.push(`/playlists/${playlist.id}`);
    };

    return (
      <div
        onClick={handleClick}
        style={{
          backgroundColor: 'white',
          padding: isMobile ? '1.25rem' : '1.5rem',
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
        onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {/* Delete Button - Show on hover for owner */}
        {isOwner && (
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
              top: isMobile ? '0.5rem' : '0.75rem',
              right: isMobile ? '0.5rem' : '0.75rem',
              background: 'hsla(0, 0%, 100%, 1.00)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.6rem',
              fontSize: isMobile ? '0.6rem' : '0.7rem',
              fontWeight: '600',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
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
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#2d3748',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            paddingRight: isOwner ? (isMobile ? '1.5rem' : '2rem') : '0'
          }}>
            {playlist.name}
          </h3>
          {playlist.description && (
            <p style={{
              margin: 0,
              fontSize: isMobile ? '0.8rem' : '0.85rem',
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
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: '1rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
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
              fontSize: isMobile ? '0.75rem' : '0.8rem',
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
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
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
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
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

      {/* Footer - UPDATE dengan creator info */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: '#718096',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>
            Dibuat oleh         {  /* 🆕 TAMPILKAN CREATOR NAME */}
            {playlist.creator_name && (
              <span style={{
                backgroundColor: '#edf2f7',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: '#4a5568',
                border: '1px solid #cbd5e0'
              }}>
                {playlist.creator_name}
              </span>
        )}
          </span>
        </div>
        <span>
          {new Date(playlist.created_at).toLocaleDateString('id-ID')}
        </span>
      </div>
    </div>
  );
};

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Playlists Komunitas - Perpustakaan Buku Langka</title>
        <meta name="description" content="Jelajahi playlist buku yang dikurasi komunitas" />
      </Head>

      {/* Hero Section - MOBILE OPTIMIZED */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          padding: isMobile ? '0' : '0 1rem'
        }}>
          <h1 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Playlists Komunitas
          </h1>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            Temukan koleksi buku yang dikurasi oleh komunitas pencinta literatur
          </p>

          {/* Stats Overview - Mobile Grid */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem',
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

      {/* Main Content - MOBILE OPTIMIZED */}
      <section style={{
        maxWidth: '1400px',
        margin: isMobile ? '1rem auto' : '2rem auto',
        padding: isMobile ? '0 1rem' : '0 2rem'
      }}>
        {/* Controls - Mobile Optimized */}
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '1rem' : '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '1rem'
          }}>
            {/* View Tabs - Mobile Scrollable */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              flexWrap: 'wrap',
              overflowX: isMobile ? 'auto' : 'visible',
              paddingBottom: isMobile ? '0.5rem' : '0'
            }}>
              {[
                { key: 'all', label: 'Semua', icon: '📚' },
                { key: 'my', label: 'Saya', icon: '👤' },
                { key: 'popular', label: 'Populer', icon: '❤️' },
                { key: 'trending', label: 'Trending', icon: '🔥' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  style={{
                    padding: isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: view === tab.key ? '#4299e1' : '#f7fafc',
                    color: view === tab.key ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Sort - Mobile Stack */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '1rem',
              width: isMobile ? '100%' : 'auto'
            }}>
              {/* Search Box */}
              <div style={{ 
                position: 'relative', 
                width: isMobile ? '100%' : '300px' 
              }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari playlist..."
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.6rem 0.8rem 0.6rem 2.2rem' : '0.75rem 1rem 0.75rem 2.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    outline: 'none'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  left: isMobile ? '0.6rem' : '0.75rem',
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
                  padding: isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  outline: 'none',
                  width: isMobile ? '100%' : '150px'
                }}
              >
                <option value="recent">Terbaru</option>
                <option value="popular">Paling Populer</option>
                <option value="name">A-Z</option>
              </select>
            </div>
          </div>

          {/* Active Filters Info */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f0fff4',
            border: '1px solid #9ae6b4',
            borderRadius: '6px',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: '#22543d'
          }}>
            Menampilkan {filteredPlaylists.length} playlist
            {searchQuery && ` untuk "${searchQuery}"`}
            {view !== 'all' && ` • ${view === 'my' ? 'Playlists saya' : view === 'popular' ? 'Populer' : 'Trending'}`}
            {isSearching && ' • 🔍 Mencari...'}
          </div>
        </div>

        {/* Playlists Grid - Mobile Single Column */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#718096'
          }}>
            <div style={{ 
              fontSize: isMobile ? '1.5rem' : '2rem', 
              marginBottom: '1rem',
              animation: 'pulse 1.5s infinite'
            }}>⏳</div>
            Memuat playlists...
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '3rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: isMobile ? '2rem' : '3rem', 
              marginBottom: '1rem' 
            }}>📚</div>
            <h3 style={{ 
              color: '#4a5568', 
              marginBottom: '0.5rem',
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}>
              {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada playlist'}
            </h3>
            <p style={{ 
              color: '#718096',
              marginBottom: '1.5rem',
              fontSize: isMobile ? '0.85rem' : '1rem'
            }}>
              {searchQuery
                ? `Coba kata kunci lain atau buat playlist "${searchQuery}"`
                : 'Jadilah yang pertama membuat playlist komunitas!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}
              >
                📚 Buat Playlist Pertama
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: isMobile ? '1.5rem' : '2rem'
          }}>
            {filteredPlaylists.map(playlist => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal - MOBILE OPTIMIZED */}
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
          padding: isMobile ? '0.5rem' : '1rem'
        }}
        onClick={() => setDeleteConfirm(null)}
        >
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '1.5rem' : '2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxWidth: isMobile ? '95%' : '450px',
            width: '100%',
            textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* STEP 1: Konfirmasi Basic */}
            {deleteConfirm.step === 1 && (
              <>
                <div style={{ 
                  fontSize: isMobile ? '2.5rem' : '3rem', 
                  marginBottom: '1rem' 
                }}>⚠️</div>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#2d3748',
                  fontSize: isMobile ? '1.1rem' : '1.25rem'
                }}>
                  Hapus Playlist?
                </h3>
                <p style={{ 
                  color: '#718096', 
                  marginBottom: '1.5rem', 
                  lineHeight: '1.5',
                  fontSize: isMobile ? '0.85rem' : '1rem'
                }}>
                  Anda akan menghapus playlist:<br />
                  <strong>"{deleteConfirm.playlistName}"</strong>
                </p>
                <div style={{
                  backgroundColor: '#fffaf0',
                  padding: isMobile ? '0.75rem' : '1rem',
                  borderRadius: '8px',
                  border: '1px solid #fed7d7',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#c53030', 
                    marginBottom: '0.5rem',
                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                  }}>
                    ⚠️ Perhatian:
                  </div>
                  <ul style={{ 
                    color: '#744210', 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    margin: 0, 
                    paddingLeft: '1.2rem', 
                    lineHeight: '1.4' 
                  }}>
                    <li>Playlist akan dihapus permanen</li>
                    <li>{deleteConfirm.bookCount} buku akan dihapus dari playlist</li>
                    <li>Tindakan ini tidak dapat dibatalkan</li>
                  </ul>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'center',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
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
                      padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
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
                <div style={{ 
                  fontSize: isMobile ? '2.5rem' : '3rem', 
                  marginBottom: '1rem' 
                }}>🔒</div>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#2d3748',
                  fontSize: isMobile ? '1.1rem' : '1.25rem'
                }}>
                  Verifikasi Penghapusan
                </h3>
                <p style={{ 
                  color: '#718096', 
                  marginBottom: '1rem', 
                  lineHeight: '1.5',
                  fontSize: isMobile ? '0.85rem' : '1rem'
                }}>
                  Ketik <strong>manual</strong> nama playlist berikut:<br />
                  <strong style={{ 
                    color: '#e53e3e', 
                    fontSize: isMobile ? '1rem' : '1.1rem' 
                  }}>
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
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
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
                    padding: isMobile ? '0.6rem' : '0.75rem',
                    border: deleteConfirm.pasteAttempted ? '2px solid #f56565' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    marginBottom: '0.5rem',
                    outline: 'none',
                    backgroundColor: deleteConfirm.pasteAttempted ? '#fed7d7' : 'white',
                    transition: 'all 0.3s ease'
                  }}
                />

                {deleteConfirm.pasteAttempted && (
                  <div style={{
                    color: '#e53e3e',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ❌ Copy-paste tidak diperbolehkan. Harap ketik manual.
                  </div>
                )}

                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
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

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'center',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <button
                    onClick={() => setDeleteConfirm(prev => ({ ...prev, step: 1, verificationText: '', pasteAttempted: false }))}
                    style={{
                      padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
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
                      padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
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

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Layout>
  );
};

export default PlaylistsPage;