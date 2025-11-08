// pages/playlists.js - HALAMAN PLAYLISTS COMMUNITY
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { usePlaylist } from '../contexts/PlaylistContext';
import { searchService, analyticsService } from '../services/indexService';

const PlaylistsPage = () => {
  const { playlists, loading, userId, refreshPlaylists } = usePlaylist();
  const [view, setView] = useState('all'); // 'all', 'my', 'popular', 'trending'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'popular', 'name'
  const [stats, setStats] = useState(null);

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
        // For now, use popular as trending - will enhance later
        filtered = filtered.filter(playlist => (playlist.like_count || 0) > 0);
        break;
      default:
        // 'all' - show all playlists
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

  // Stats cards
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

  // Playlist card component
  const PlaylistCard = ({ playlist }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-4px)';
      e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}
    onClick={() => {
      // Akan kita buat halaman detail nanti
      console.log('Open playlist:', playlist.id);
      alert(`Buka playlist: ${playlist.name}\n\nFitur halaman detail playlist akan segera hadir!`);
    }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#2d3748',
          lineHeight: '1.4'
        }}>
          {playlist.name}
        </h3>
        {playlist.description && (
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#718096',
            lineHeight: '1.5'
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
                border: '1px solid #e2e8f0'
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
          Dibuat oleh {playlist.created_by === userId ? 'Anda' : 'Komunitas'}
        </span>
        <span>
          {new Date(playlist.created_at).toLocaleDateString('id-ID')}
        </span>
      </div>
    </div>
  );

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
            gap: '1.5rem'
          }}>
            {filteredPlaylists.map(playlist => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default PlaylistsPage;
