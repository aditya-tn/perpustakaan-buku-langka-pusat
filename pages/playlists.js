// pages/playlists.js - SIMPLE REFRESH LOGIC
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useNotification } from '../contexts/NotificationContext';
import { searchService, analyticsService } from '../services/indexService';

const PlaylistsPage = () => {
  const router = useRouter();
  const { playlists, loading, userId, deletePlaylist, trackView, refreshPlaylists } = usePlaylist(); // 🆪 Pastikan ada refreshPlaylists
  const { addNotification } = useNotification();

  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [stats, setStats] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // 🆪 STATE UNTUK FORCE REFRESH
  const [refreshKey, setRefreshKey] = useState(0);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🆪 SIMPLE REFRESH LOGIC: Check localStorage periodically
  useEffect(() => {
    const checkForRefresh = () => {
      const needsRefresh = localStorage.getItem('playlistRefreshNeeded');
      if (needsRefresh === 'true') {
        console.log('🔄 Refresh triggered via localStorage');
        
        const newPlaylistName = localStorage.getItem('newPlaylistName');
        if (newPlaylistName) {
          addNotification({
            type: 'success',
            title: 'Playlist Diperbarui! 🔄',
            message: `"${newPlaylistName}" telah ditambahkan`,
            icon: '✅',
            duration: 3000
          });
          localStorage.removeItem('newPlaylistName');
        }
        
        // Clear the trigger
        localStorage.removeItem('playlistRefreshNeeded');
        
        // Force re-render
        setRefreshKey(prev => prev + 1);
        console.log('✅ Page re-rendered with new data');
      }
    };

    // Check every 1 second
    const interval = setInterval(checkForRefresh, 1000);
    return () => clearInterval(interval);
  }, [addNotification]);

  // 🆪 EVENT LISTENER sebagai backup
  useEffect(() => {
    const handlePlaylistCreated = () => {
      console.log('🎯 Playlist created event received');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('playlistCreated', handlePlaylistCreated);
    return () => window.removeEventListener('playlistCreated', handlePlaylistCreated);
  }, []);

  // Load platform stats - refresh ketika refreshKey berubah
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
  }, [refreshKey]);

  // Handle search - refresh ketika refreshKey berubah
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
  }, [searchQuery, refreshKey]);

  // 🆪 MANUAL REFRESH FUNCTION
  const manualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
  };

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

// Playlist Card Component - MOBILE OPTIMIZED (DENGAN METADATA INDICATOR)
const PlaylistCard = ({ playlist, isMobile = false }) => {
  const isOwner = playlist.created_by === userId;
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 🆕 CEK STATUS METADATA
  const hasMetadata = playlist.metadata_generated_at && 
                     playlist.ai_metadata && 
                     Object.keys(playlist.ai_metadata).length > 0;
  const isAIFallback = hasMetadata && playlist.ai_metadata.is_fallback;

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

  // Di PlaylistCard component - UPDATE handleGenerateMetadata
  const handleGenerateMetadata = async (e) => {
    e.stopPropagation();
    setIsGenerating(true);
    
    console.log(`🎯 Generating AI metadata for playlist: ${playlist.id} - ${playlist.name}`);
    
    try {
      const response = await fetch('/api/playlists/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlist.id })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('📦 API Response:', result);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Metadata Generated ✅',
          message: `AI metadata berhasil dibuat untuk "${playlist.name}"`,
          icon: '🤖',
          duration: 3000
        });
        
        // Refresh page untuk update data
        setTimeout(() => {
          console.log('🔄 Refreshing page...');
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Metadata generation failed:', error);
      addNotification({
        type: 'error',
        title: 'Gagal Generate Metadata',
        message: error.message || 'Terjadi kesalahan saat generate metadata',
        icon: '❌',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
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
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f7fafc';
        e.currentTarget.style.border = '2px solid #4299e1';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 153, 225, 0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.border = '1px solid #e2e8f0';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 🆕 METADATA STATUS INDICATOR */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '0.5rem' : '0.75rem',
        left: isMobile ? '0.5rem' : '0.75rem',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <div style={{
          padding: '0.2rem 0.4rem',
          borderRadius: '6px',
          fontSize: isMobile ? '0.55rem' : '0.65rem',
          fontWeight: '600',
          backgroundColor: !hasMetadata ? '#fff5f5' : 
                         isAIFallback ? '#fffaf0' : '#f0fff4',
          color: !hasMetadata ? '#c53030' : 
                 isAIFallback ? '#744210' : '#22543d',
          border: `1px solid ${
            !hasMetadata ? '#fed7d7' : 
            isAIFallback ? '#faf089' : '#9ae6b4'
          }`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem'
        }}>
          {!hasMetadata && '❌ No AI'}
          {hasMetadata && isAIFallback && '📝 Basic'} 
          {hasMetadata && !isAIFallback && '🤖 Enhanced'}
        </div>
        
        {/* 🆕 GENERATE BUTTON (for admin/owner) */}
        {(!hasMetadata || isAIFallback) && isOwner && (
          <button
            onClick={handleGenerateMetadata}
            disabled={isGenerating}
            style={{
              padding: '0.2rem 0.4rem',
              backgroundColor: isGenerating ? '#cbd5e0' : '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '0.55rem' : '0.65rem',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              opacity: isGenerating ? 0.6 : 1
            }}
          >
            {isGenerating ? '⏳' : '⚡'}
            {isGenerating ? 'Generating...' : 'AI'}
          </button>
        )}
      </div>

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
            background: 'transparent',
            color: '#f56565',
            border: '1px solid rgba(255, 255, 255, 1)',
            borderRadius: '6px',
            padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.6rem',
            fontSize: isMobile ? '0.6rem' : '0.7rem',
            fontWeight: '600',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f56565';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#f56565';
          }}
        >
          🗑️
        </button>
      )}

      {/* Header */}
      <div style={{
        marginBottom: '1rem',
        position: 'relative',
        zIndex: 1,
        marginTop: (hasMetadata || isOwner) ? (isMobile ? '1.5rem' : '1.8rem') : '0'
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

      {/* 🆕 METADATA PREVIEW (jika ada) */}
      {hasMetadata && playlist.ai_metadata && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: isAIFallback ? '#fffaf0' : '#f0fff4',
          border: `1px solid ${isAIFallback ? '#faf089' : '#9ae6b4'}`,
          borderRadius: '6px',
          fontSize: isMobile ? '0.7rem' : '0.75rem'
        }}>
          <div style={{ 
            fontWeight: '600', 
            color: isAIFallback ? '#744210' : '#22543d', 
            marginBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            {isAIFallback ? '📝 Basic Rules' : '🤖 AI Enhanced'}
          </div>
          
          <div style={{ 
            color: '#2d3748',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.3rem',
            lineHeight: '1.3'
          }}>
            {playlist.ai_metadata.key_themes?.slice(0, 3).map((theme, index) => (
              <span key={index} style={{
                backgroundColor: isAIFallback ? '#faf089' : '#c6f6d5',
                color: isAIFallback ? '#744210' : '#22543d',
                padding: '0.1rem 0.3rem',
                borderRadius: '4px',
                fontSize: '0.65rem'
              }}>
                {theme}
              </span>
            ))}
            
            {playlist.ai_metadata.historical_names?.slice(0, 2).map((name, index) => (
              <span key={index} style={{
                backgroundColor: '#bee3f8',
                color: '#2a4365',
                padding: '0.1rem 0.3rem',
                borderRadius: '4px',
                fontSize: '0.65rem'
              }}>
                🏛️ {name}
              </span>
            ))}
          </div>
          
          {playlist.ai_metadata.accuracy_reasoning && (
            <div style={{ 
              color: isAIFallback ? '#744210' : '#4a5568', 
              fontSize: '0.65rem',
              marginTop: '0.3rem',
              fontStyle: 'italic'
            }}>
              {playlist.ai_metadata.accuracy_reasoning}
            </div>
          )}
        </div>
      )}

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

      {/* Footer */}
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
            Dibuat oleh
            {playlist.creator_name && (
              <span style={{
                backgroundColor: '#edf2f7',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: '#4a5568',
                border: '1px solid #cbd5e0',
                marginLeft: '0.3rem'
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

      {/* Hero Section */}
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

      {/* Main Content */}
      <section style={{
        maxWidth: '1400px',
        margin: isMobile ? '1rem auto' : '2rem auto',
        padding: isMobile ? '0 1rem' : '0 2rem'
      }}>
        {/* Controls */}
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
                    width: '80%',
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

{/* Controls */}
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
    {/* ... View Tabs ... */}
    {/* ... Search & Sort ... */}
  </div>

  {/* 🆕 TEMPATKAN ADMIN METADATA CONTROLS DI SINI */}
  {userId && (
    <div style={{/* ... Admin Metadata Controls ... */}}>
      {/* ... content ... */}
    </div>
  )}

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

{/* 🆕 ADMIN METADATA CONTROLS */}
{userId && (
  <div style={{
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f0fff4',
    border: '1px solid #9ae6b4',
    borderRadius: '8px'
  }}>
    <div style={{
      fontSize: isMobile ? '0.85rem' : '0.9rem',
      fontWeight: '600',
      color: '#22543d',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      🤖 AI Metadata Enhancement
    </div>
    
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }}>
      {/* 🆕 OPSI BARU: Upgrade Basic ke AI Enhanced */}
      <button
        onClick={async () => {
          try {
            const response = await fetch('/api/playlists/generate-metadata', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ upgradeBasic: true })
            });
            
            const result = await response.json();
            
            if (result.success) {
              addNotification({
                type: 'success',
                title: 'Upgrade Started 🚀',
                message: `Upgrading ${result.data?.length || 0} basic playlists ke AI Enhanced`,
                icon: '🤖',
                duration: 5000
              });
              
              setTimeout(() => window.location.reload(), 3000);
            }
          } catch (error) {
            addNotification({
              type: 'error',
              title: 'Upgrade Failed',
              message: error.message,
              icon: '❌'
            });
          }
        }}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#805ad5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}
      >
        🚀 Upgrade Basic ke AI
      </button>

      <button
        onClick={async () => {
          try {
            const response = await fetch('/api/playlists/generate-metadata', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fillMissing: true })
            });
            
            const result = await response.json();
            
            if (result.success) {
              addNotification({
                type: 'success',
                title: 'Generation Started ✅',
                message: `Processing ${result.data?.length || 0} playlists`,
                icon: '🤖',
                duration: 5000
              });
              
              setTimeout(() => window.location.reload(), 3000);
            }
          } catch (error) {
            addNotification({
              type: 'error',
              title: 'Generation Failed',
              message: error.message,
              icon: '❌'
            });
          }
        }}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#48bb78',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}
      >
        ⚡ Generate Missing
      </button>
      
      <button
        onClick={async () => {
          try {
            const response = await fetch('/api/playlists/generate-metadata', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ generateAll: true })
            });
            
            const result = await response.json();
            
            if (result.success) {
              addNotification({
                type: 'success',
                title: 'Regenerating All 🔄',
                message: `Regenerating semua ${result.data?.length || 0} playlists`,
                icon: '🔄',
                duration: 5000
              });
              
              setTimeout(() => window.location.reload(), 3000);
            }
          } catch (error) {
            addNotification({
              type: 'error',
              title: 'Regeneration Failed',
              message: error.message,
              icon: '❌'
            });
          }
        }}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#ed8936',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}
      >
        🔄 Regenerate All
      </button>
    </div>
    
    <div style={{
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      color: '#2d3748',
      marginTop: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }}>
      <span>
        Status: 
        <strong style={{ color: '#22543d', marginLeft: '0.3rem' }}>
          {playlists.filter(p => p.metadata_generated_at && p.ai_metadata && !p.ai_metadata.is_fallback).length}
        </strong> Enhanced • 
        <strong style={{ color: '#744210', margin: '0 0.3rem' }}>
          {playlists.filter(p => p.metadata_generated_at && p.ai_metadata && p.ai_metadata.is_fallback).length}
        </strong> Basic • 
        <strong style={{ color: '#c53030', marginLeft: '0.3rem' }}>
          {playlists.filter(p => !p.metadata_generated_at).length}
        </strong> No AI
      </span>
    </div>
  </div>
)}

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

        {/* Playlists Grid */}
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
          // 🆪 PERBAIKI: TAMBAHKAN JSX YANG BENAR, JANGAN KOSONG
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
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: isMobile ? '1.5rem' : '1.3rem',
            gridAutoRows: 'minmax(200px, auto)',
            alignContent: 'start'
          }}>
            {filteredPlaylists.map(playlist => (
              <div key={playlist.id} style={{
                display: 'flex',
                flexDirection: 'column'
              }}>
                <PlaylistCard 
                  playlist={playlist} 
                  isMobile={isMobile}
                />
              </div>
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
