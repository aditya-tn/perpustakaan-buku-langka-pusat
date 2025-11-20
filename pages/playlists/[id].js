// pages/playlists/[id].js - COMPLETE MOBILE OPTIMIZED VERSION
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { usePlaylist } from '../../contexts/PlaylistContext';
import { useNotification } from '../../contexts/NotificationContext';
import { playlistService, analyticsService, searchService } from '../../services/indexService';
import BookCard from '../../components/BookCard';
import { supabase } from '../../lib/supabase';

const PlaylistDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const { playlists, userId, likePlaylist, deletePlaylist, removeBookFromPlaylist } = usePlaylist()
  const { addNotification } = useNotification();

  const [isMobile, setIsMobile] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [similarPlaylists, setSimilarPlaylists] = useState([]);
  const [view, setView] = useState('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteBookConfirm, setDeleteBookConfirm] = useState(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function untuk handle remove book
  const handleRemoveBook = async (bookId) => {
    try {
      const result = await removeBookFromPlaylist(id, bookId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Buku Dihapus 🗑️',
          message: 'Buku berhasil dihapus dari playlist',
          icon: '✅',
          duration: 3000
        });
        setDeleteBookConfirm(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to remove book:', error);
      addNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: error.message,
        icon: '❌',
        duration: 5000
      });
    }
  };

  // 🎯 MANUAL FUNCTION untuk tracking view
  const manualTrackView = async (playlistId) => {
    try {
      console.log('🎯 Manual tracking view for:', playlistId);
      const { data, error } = await supabase.rpc('increment_view_count', {
        playlist_id: playlistId
      });

      if (error) throw error;
      console.log('✅ Manual view tracked successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Manual tracking failed:', error);
      return { success: false, error: error.message };
    }
  };

  // 🎯 HANDLER untuk playlist click dari detail page
  const handlePlaylistClickFromDetail = async (playlistId, playlistName, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    console.log('🎯 Tracking view from playlist detail page:', playlistId);
    
    try {
      await manualTrackView(playlistId);
      console.log('✅ Tracked view from playlist detail');
    } catch (error) {
      console.error('❌ Tracking failed from playlist detail:', error);
    }
    
    window.open(`/playlists/${playlistId}`, '_blank');
  };

  // STATE UNTUK EXPANDABLE CARDS
  const [selectedBook, setSelectedBook] = useState(null);

  // Helper function untuk extract tahun
  const extractYear = (yearStr) => {
    if (!yearStr) return null;
    const yearMatch = yearStr?.match(/\d{4}/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  };

  // Load playlist data
  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const cachedPlaylist = playlists.find(p => p.id === id);
        if (cachedPlaylist) {
          setPlaylist(cachedPlaylist);
          setInitialLoad(false);
        }

        const [playlistData, playlistStats, similar] = await Promise.all([
          cachedPlaylist ? Promise.resolve(cachedPlaylist) : playlistService.getPlaylistById(id),
          analyticsService.getPlaylistStats(id),
          searchService.getSimilarPlaylists(id, 4)
        ]);

        setPlaylist(playlistData);
        setStats(playlistStats);
        setSimilarPlaylists(similar);

      } catch (err) {
        console.error('Error loading playlist:', err);
        setError('Playlist tidak ditemukan atau terjadi error');
      } finally {
        setLoading(false);
      }
    };

    loadPlaylistData();
  }, [id, playlists]);

  // HANDLE CARD CLICK
  const handleCardClick = (book) => {
    console.log('🎯 Card clicked:', book?.judul || 'null (closing)');
    setSelectedBook(book);
  };

  // Handle like playlist
  const [isLiking, setIsLiking] = useState(false);
  const handleLike = async () => {
    if (!playlist || isLiking) return;
    setIsLiking(true);

    try {
      const result = await likePlaylist(playlist.id);
      
      // Manual reload data setelah like
      const freshPlaylist = await playlistService.getPlaylistById(id);
      setPlaylist(freshPlaylist);
      
      addNotification({
        type: 'success',
        title: 'Liked! ❤️',
        message: 'Playlist berhasil disukai',
        icon: '❤️',
        duration: 2000
      });

    } catch (error) {
      console.error('Error liking playlist:', error);
      addNotification({
        type: 'error',
        title: 'Gagal Like',
        message: error.message,
        icon: '❌',
        duration: 3000
      });
    } finally {
      setIsLiking(false);
    }
  };

  // Handle delete playlist
  const handleDeletePlaylist = async (playlistId) => {
    try {
      const result = await deletePlaylist(playlistId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Playlist Dihapus 🗑️',
          message: 'Playlist berhasil dihapus',
          icon: '✅',
          duration: 3000
        });
        setDeleteConfirm(null);
        router.push('/playlists');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      addNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: error.message,
        icon: '❌',
        duration: 5000
      });
      setDeleteConfirm(null);
    }
  };

  // Filter books based on search
  const filteredBooks = playlist?.books?.filter(book =>
    book.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.pengarang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.penerbit?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Loading state
  if (loading && initialLoad) {
    return (
      <Layout isMobile={isMobile}>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#718096'
        }}>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            marginBottom: '1rem',
            animation: 'pulse 1.5s infinite'
          }}>📚</div>
          <div style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Memuat playlist...</div>
          <div style={{ 
            fontSize: isMobile ? '0.7rem' : '0.8rem', 
            marginTop: '1rem', 
            color: '#a0aec0' 
          }}>
            Mengambil data dari server
          </div>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </Layout>
    );
  }

  // Error state
  if (error || !playlist) {
    return (
      <Layout isMobile={isMobile}>
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem 1rem' : '3rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <div style={{ 
            fontSize: isMobile ? '2rem' : '3rem', 
            marginBottom: '1rem' 
          }}>❌</div>
          <h2 style={{ 
            color: '#4a5568', 
            marginBottom: '1rem',
            fontSize: isMobile ? '1.25rem' : '1.5rem'
          }}>
            {error || 'Playlist tidak ditemukan'}
          </h2>
          <p style={{ 
            color: '#718096', 
            marginBottom: '2rem',
            fontSize: isMobile ? '0.85rem' : '1rem'
          }}>
            Playlist mungkin telah dihapus atau terjadi error.
          </p>
          <button
            onClick={() => router.push('/playlists')}
            style={{
              padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
              backgroundColor: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: isMobile ? '0.85rem' : '1rem'
            }}
          >
            Kembali ke Daftar Playlists
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>{playlist.name} - Playlist Komunitas</title>
        <meta name="description" content={playlist.description || `Playlist berisi ${playlist.books?.length || 0} buku`} />
      </Head>

      {/* Header Section - MOBILE OPTIMIZED */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '1.5rem 1rem' : '3rem 2rem'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          padding: isMobile ? '0' : '0 1rem'
        }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
            <button
              onClick={() => router.push('/playlists')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0'
              }}
            >
              ← Kembali ke Playlists
            </button>
          </div>

          {/* Playlist Info - MOBILE STACK */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
            gap: isMobile ? '1rem' : '2rem',
            alignItems: 'start'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2.5rem',
                fontWeight: '700',
                marginBottom: isMobile ? '0.75rem' : '1rem',
                lineHeight: '1.2',
                wordWrap: 'break-word'
              }}>
                {playlist.name}
              </h1>
              {playlist.description && (
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1.1rem',
                  marginBottom: isMobile ? '1rem' : '1.5rem',
                  opacity: 0.9,
                  lineHeight: '1.5'
                }}>
                  {playlist.description}
                </p>
              )}
              {/* Metadata - UPDATE dengan creator_name */}
              <div style={{
                display: 'flex',
                gap: isMobile ? '0.75rem' : '2rem',
                flexWrap: 'wrap',
                fontSize: isMobile ? '0.75rem' : '0.9rem',
                opacity: 0.8,
                alignItems: 'center'
              }}>
                <span>📚 {playlist.books?.length || 0} buku</span>
                <span>❤️ {playlist.like_count || 0} likes</span>
                <span>👁️ {playlist.view_count || 0} views</span>
                
                
                <span>
                  Dibuat oleh                 { /* 🆕 CREATOR NAME BADGE */}
                  {playlist.creator_name && (
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      {playlist.creator_name}
                    </span>
                  )}  •
                  {' '}{new Date(playlist.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>

            {/* Action Buttons - MOBILE FULL WIDTH */}
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '0.75rem' : '1rem', 
              flexDirection: isMobile ? 'row' : 'column',
              width: isMobile ? '100%' : 'auto'
            }}>
              <button
                onClick={handleLike}
                disabled={isLiking}
                style={{
                  padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem',
                  backgroundColor: isLiking ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: isLiking ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  flex: isMobile ? 1 : 'auto',
                  fontSize: isMobile ? '0.8rem' : '1rem',
                  transition: 'all 0.3s ease',
                  transform: isLiking ? 'scale(0.95)' : 'scale(1)',
                  animation: isLiking ? 'pulse 0.6s ease-in-out' : 'none'
                }}
              >
                {isLiking ? '❤️' : '❤️'} {isMobile ? 'Like' : 'Like Playlist'}
              </button>

              {/* TOMBOL DELETE */}
              <button
                onClick={() => setDeleteConfirm({
                  playlistId: playlist.id,
                  playlistName: playlist.name,
                  bookCount: playlist.books?.length || 0,
                  step: 1,
                  verificationText: '',
                  pasteAttempted: false
                })}
                style={{
                  padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem',
                  backgroundColor: 'rgba(245, 101, 101, 0.9)',
                  color: 'white',
                  border: '1px solid rgba(245, 101, 101, 0.5)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  flex: isMobile ? 1 : 'auto',
                  fontSize: isMobile ? '0.8rem' : '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                🗑️ {isMobile ? 'Hapus' : 'Hapus Playlist'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs - MOBILE OPTIMIZED */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '0 1rem' : '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          marginTop: isMobile ? '1rem' : '2rem',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: '2px'
        }}>
          {[
            { key: 'books', label: `Buku`, icon: '📚' },
            { key: 'stats', label: 'Statistik', icon: '📊' },
            { key: 'similar', label: 'Serupa', icon: '🔍' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: view === tab.key ? '#4299e1' : '#718096',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                borderBottom: view === tab.key ? '2px solid #4299e1' : '2px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.key === 'books' && ` (${playlist.books?.length || 0})`}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content - MOBILE OPTIMIZED */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 2rem auto',
        padding: isMobile ? '0 1rem' : '0 2rem'
      }}>
        {view === 'books' && (
          <div>
            {/* Search Box - MOBILE FULL WIDTH */}
            <div style={{
              marginBottom: isMobile ? '1.25rem' : '2rem',
              position: 'relative',
              width: '100%'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari buku dalam playlist..."
                style={{
                  width: '100%',
                  padding: isMobile ? '0.7rem 1rem 0.7rem 2.5rem' : '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#718096',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                🔍
              </span>
            </div>

            {/* Books Grid - MOBILE SINGLE COLUMN */}
            {filteredBooks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '2rem 1rem' : '3rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '2.5rem' : '3rem', 
                  marginBottom: '1rem' 
                }}>📚</div>
                <h3 style={{ 
                  color: '#4a5568', 
                  marginBottom: '0.5rem',
                  fontSize: isMobile ? '1.1rem' : '1.25rem'
                }}>
                  {searchTerm ? 'Buku tidak ditemukan' : 'Belum ada buku dalam playlist'}
                </h3>
                <p style={{ 
                  color: '#718096',
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  lineHeight: '1.5'
                }}>
                  {searchTerm
                    ? 'Coba kata kunci pencarian lain'
                    : 'Tambahkan buku pertama ke playlist ini'
                  }
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: isMobile ? '1.5rem' : '2rem',
                alignItems: 'stretch'
              }}>
                {filteredBooks.map((book, index) => (
                  <BookCard
                    key={book.id || index}
                    book={book}
                    isMobile={isMobile}
                    isSelected={selectedBook?.id === book.id}
                    showDescription={selectedBook?.id === book.id}
                    onCardClick={handleCardClick}
                    onPlaylistClick={handlePlaylistClickFromDetail}
                    onRemoveBook={(bookId) => {
                      const bookToDelete = filteredBooks.find(b => b.id === bookId);
                      setDeleteBookConfirm({
                        bookId,
                        bookTitle: bookToDelete?.judul || 'Buku ini',
                        playlistName: playlist.name,
                        step: 1
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats View - MOBILE OPTIMIZED */}
        {view === 'stats' && stats && (
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '1.25rem 1rem' : '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ 
              color: '#2d3748', 
              marginBottom: isMobile ? '1.25rem' : '2rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>
              📊 Statistik Playlist
            </h2>

            {/* Engagement Metrics - MOBILE GRID */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '1rem' : '1.5rem',
              marginBottom: isMobile ? '1.5rem' : '2rem'
            }}>
              <StatCard
                title="Total Views"
                value={stats.engagement.views}
                description="Dilihat komunitas"
                icon="👁️"
                isMobile={isMobile}
              />
              <StatCard
                title="Total Likes"
                value={stats.engagement.likes}
                description="Disukai komunitas"
                icon="❤️"
                isMobile={isMobile}
              />
              <StatCard
                title="Total Buku"
                value={stats.books.total}
                description="Dalam playlist"
                icon="📚"
                isMobile={isMobile}
              />
            </div>

            {/* Content Analysis - MOBILE STACK */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '1.5rem' : '2rem',
              marginBottom: isMobile ? '1.5rem' : '2rem'
            }}>
              {/* Books by Year */}
              {stats.books.byYear && Object.keys(stats.books.byYear).length > 0 && (
                <div>
                  <h3 style={{ 
                    color: '#4a5568', 
                    marginBottom: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: isMobile ? '1rem' : '1.1rem'
                  }}>
                    📅 Distribusi Tahun Terbit
                  </h3>
                  <div style={{
                    backgroundColor: '#f7fafc',
                    padding: isMobile ? '0.75rem' : '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    maxHeight: isMobile ? '200px' : '300px',
                    overflowY: 'auto'
                  }}>
                    {Object.entries(stats.books.byYear)
                      .sort(([a], [b]) => parseInt(b) - parseInt(a))
                      .map(([year, count]) => {
                        const percentage = (count / stats.books.total * 100).toFixed(1);
                        return (
                          <div key={year} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: isMobile ? '0.5rem 0' : '0.75rem 0',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                              <span style={{
                                fontWeight: '600',
                                color: '#2d3748',
                                minWidth: isMobile ? '40px' : '50px',
                                fontSize: isMobile ? '0.8rem' : '0.9rem'
                              }}>
                                {year}
                              </span>
                              <div style={{
                                flex: 1,
                                height: '6px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: '#4299e1',
                                  borderRadius: '3px',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              minWidth: isMobile ? '60px' : '80px',
                              justifyContent: 'flex-end'
                            }}>
                              <span style={{
                                fontWeight: '600',
                                color: '#4a5568',
                                fontSize: isMobile ? '0.8rem' : '0.9rem'
                              }}>
                                {count}
                              </span>
                              <span style={{
                                color: '#718096',
                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                minWidth: isMobile ? '30px' : '35px'
                              }}>
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Language Distribution */}
              {stats.books.byLanguage && (
                <div>
                  <h3 style={{ 
                    color: '#4a5568', 
                    marginBottom: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: isMobile ? '1rem' : '1.1rem'
                  }}>
                    🌐 Distribusi Bahasa
                  </h3>
                  <div style={{
                    backgroundColor: '#f7fafc',
                    padding: isMobile ? '0.75rem' : '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {Object.entries(stats.books.byLanguage)
                      .filter(([_, count]) => count > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .map(([language, count]) => {
                        const languageLabels = {
                          indonesia: '🇮🇩 Indonesia',
                          english: '🇺🇸 English',
                          dutch: '🇳🇱 Dutch',
                          other: '🌍 Other'
                        };
                        const percentage = (count / stats.books.total * 100).toFixed(1);
                        return (
                          <div key={language} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: isMobile ? '0.4rem 0' : '0.5rem 0',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <span style={{ 
                              color: '#4a5568', 
                              fontSize: isMobile ? '0.8rem' : '0.9rem' 
                            }}>
                              {languageLabels[language] || language}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{
                                fontWeight: '600',
                                color: '#2d3748',
                                fontSize: isMobile ? '0.8rem' : '0.9rem'
                              }}>
                                {count}
                              </span>
                              <span style={{
                                color: '#718096',
                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                minWidth: isMobile ? '35px' : '40px'
                              }}>
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {stats.books.recentAdditions && stats.books.recentAdditions.length > 0 && (
              <div>
                <h3 style={{ 
                  color: '#4a5568', 
                  marginBottom: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: isMobile ? '1rem' : '1.1rem'
                }}>
                  🆕 Buku Terbaru Ditambahkan
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: isMobile ? '0.75rem' : '1rem'
                }}>
                  {stats.books.recentAdditions.map((book, index) => (
                    <div key={index} style={{
                      padding: isMobile ? '0.75rem' : '1rem',
                      backgroundColor: '#f7fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#edf2f7';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f7fafc';
                      e.target.style.transform = 'translateY(0)';
                    }}
                    onClick={() => {
                      window.open(`/?highlight=${book.id}`, '_blank');
                    }}
                    >
                      <div style={{
                        fontWeight: '600',
                        color: '#2d3748',
                        marginBottom: '0.25rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        lineHeight: '1.3'
                      }}>
                        {book.judul}
                      </div>
                      {book.pengarang && (
                        <div style={{ 
                          fontSize: isMobile ? '0.7rem' : '0.8rem', 
                          color: '#718096', 
                          marginBottom: '0.25rem' 
                        }}>
                          oleh {book.pengarang}
                        </div>
                      )}
                      {book.tahun_terbit && (
                        <div style={{ 
                          fontSize: isMobile ? '0.65rem' : '0.75rem', 
                          color: '#a0aec0' 
                        }}>
                          {book.tahun_terbit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Playlist Metadata */}
            <div style={{
              marginTop: isMobile ? '1.5rem' : '2rem',
              padding: isMobile ? '1rem' : '1.5rem',
              backgroundColor: '#f0fff4',
              borderRadius: '8px',
              border: '1px solid #9ae6b4'
            }}>
              <h4 style={{ 
                color: '#22543d', 
                marginBottom: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                ℹ️ Informasi Playlist
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: isMobile ? '0.75rem' : '1rem',
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>
                <div>
                  <strong style={{ color: '#22543d' }}>Dibuat:</strong>{' '}
                  {new Date(stats.basic.createdDate).toLocaleDateString('id-ID', {
                    weekday: isMobile ? 'short' : 'long',
                    year: 'numeric',
                    month: isMobile ? 'short' : 'long',
                    day: 'numeric'
                  })}
                </div>
                <div>
                  <strong style={{ color: '#22543d' }}>Terakhir Diupdate:</strong>{' '}
                  {new Date(stats.basic.lastUpdated).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: isMobile ? 'short' : 'long',
                    day: 'numeric'
                  })}
                </div>
                <div>
                  <strong style={{ color: '#22543d' }}>Rata-rata Buku/Playlist:</strong>{' '}
                  {(stats.books.total / playlists.length).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Similar Playlists - MOBILE OPTIMIZED */}
        {view === 'similar' && (
          <div>
            <h2 style={{ 
              color: '#2d3748', 
              marginBottom: isMobile ? '1.25rem' : '1.5rem',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>🔍 Playlist Serupa</h2>
            {similarPlaylists.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '1.5rem 1rem' : '2rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginBottom: '1rem' 
                }}>🤔</div>
                <p style={{ 
                  color: '#718096',
                  fontSize: isMobile ? '0.85rem' : '1rem'
                }}>
                  Belum ada playlist yang serupa ditemukan
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: isMobile ? '1rem' : '1.5rem'
              }}>
                {similarPlaylists.map(similar => (
                  <div
                    key={similar.id}
                    style={{
                      backgroundColor: 'white',
                      padding: isMobile ? '1.25rem' : '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onClick={() => router.push(`/playlists/${similar.id}`)}
                  >
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '600',
                      color: '#2d3748',
                      lineHeight: '1.3'
                    }}>
                      {similar.name}
                    </h3>
                    {similar.description && (
                      <p style={{
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        color: '#718096',
                        marginBottom: '1rem',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {similar.description}
                      </p>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      color: '#718096'
                    }}>
                      <span>📚 {similar.books?.length || 0} buku</span>
                      <span>❤️ {similar.like_count || 0}</span>
                      <span>{similar._commonBooks} buku sama</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            padding: isMobile ? '1rem' : '2rem'
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
                      fontSize: isMobile ? '0.75rem' : '0.9rem', 
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
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: '#e2e8f0',
                        color: '#4a5568',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        flex: 1,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      Batalkan
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(prev => ({ ...prev, step: 2 }))}
                      style={{
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        flex: 1,
                        fontSize: isMobile ? '0.85rem' : '1rem'
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
                    padding: isMobile ? '0.6rem' : '0.75rem',
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
                      padding: isMobile ? '0.6rem 0.8rem' : '0.75rem',
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
                  {/* Typing indicator */}
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.7rem',
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
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: '#e2e8f0',
                        color: '#4a5568',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        flex: 1,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      Kembali
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(deleteConfirm.playlistId)}
                      disabled={deleteConfirm.verificationText !== deleteConfirm.playlistName}
                      style={{
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: deleteConfirm.verificationText === deleteConfirm.playlistName ? '#f56565' : '#cbd5e0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: deleteConfirm.verificationText === deleteConfirm.playlistName ? 'pointer' : 'not-allowed',
                        fontWeight: '500',
                        flex: 1,
                        opacity: deleteConfirm.verificationText === deleteConfirm.playlistName ? 1 : 0.6,
                        fontSize: isMobile ? '0.85rem' : '1rem'
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

        {/* Delete Book Confirmation Modal - MOBILE OPTIMIZED */}
        {deleteBookConfirm && (
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
            padding: isMobile ? '1rem' : '2rem'
          }}
          onClick={() => setDeleteBookConfirm(null)}
          >
            <div style={{
              backgroundColor: 'white',
              padding: isMobile ? '1.5rem' : '2rem',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              maxWidth: isMobile ? '95%' : '500px',
              width: '100%',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* STEP 1: Konfirmasi Basic */}
              {deleteBookConfirm.step === 1 && (
                <>
                  <div style={{ 
                    fontSize: isMobile ? '2.5rem' : '3rem', 
                    marginBottom: '1rem' 
                  }}>📚</div>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#2d3748',
                    fontSize: isMobile ? '1.1rem' : '1.25rem'
                  }}>
                    Hapus Buku dari Playlist?
                  </h3>
                  <p style={{ 
                    color: '#718096', 
                    marginBottom: '1.5rem', 
                    lineHeight: '1.5',
                    fontSize: isMobile ? '0.85rem' : '1rem'
                  }}>
                    Anda akan menghapus buku:<br />
                    <strong style={{ 
                      color: '#2d3748', 
                      fontSize: isMobile ? '1rem' : '1.1rem' 
                    }}>
                      "{deleteBookConfirm.bookTitle}"
                    </strong>
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
                      fontSize: isMobile ? '0.75rem' : '0.9rem', 
                      margin: 0, 
                      paddingLeft: '1.2rem', 
                      lineHeight: '1.4' 
                    }}>
                      <li>Buku akan dihapus dari playlist "{deleteBookConfirm.playlistName}"</li>
                      <li>Buku tetap tersedia di koleksi utama</li>
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
                      onClick={() => setDeleteBookConfirm(null)}
                      style={{
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: '#e2e8f0',
                        color: '#4a5568',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        flex: 1,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      Batalkan
                    </button>
                    <button
                      onClick={() => setDeleteBookConfirm(prev => ({ ...prev, step: 2 }))}
                      style={{
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '66px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        flex: 1,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      Lanjutkan
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: Pertanyaan Kontekstual */}
              {deleteBookConfirm.step === 2 && (
                <>
                  <div style={{ 
                    fontSize: isMobile ? '2.5rem' : '3rem', 
                    marginBottom: '1rem' 
                  }}>🤔</div>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#2d3748',
                    fontSize: isMobile ? '1.1rem' : '1.25rem'
                  }}>
                    Konfirmasi Penghapusan
                  </h3>
                  {/* PERTANYAAN KONTEKSTUAL */}
                  <div style={{
                    backgroundColor: '#ebf8ff',
                    padding: isMobile ? '1rem' : '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #bee3f8',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#2b6cb0',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '600',
                      margin: '0 0 0.5rem 0',
                      lineHeight: '1.4'
                    }}>
                      Apakah buku
                    </p>
                    <p style={{
                      color: '#2d3748',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '700',
                      margin: '0 0 0.5rem 0'
                    }}>
                      "{deleteBookConfirm.bookTitle}"
                    </p>
                    <p style={{
                      color: '#2b6cb0',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '600',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      tidak cocok untuk playlist<br />
                      <span style={{ color: '#2d3748' }}>"{deleteBookConfirm.playlistName}"</span> ini?
                    </p>
                  </div>
                  <p style={{
                    color: '#718096',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    marginBottom: '2rem',
                    lineHeight: '1.5'
                  }}>
                    Tindakan ini membantu kami memahami preferensi kurasi komunitas.
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    justifyContent: 'center',
                    flexDirection: isMobile ? 'column' : 'row'
                  }}>
                    <button
                      onClick={() => setDeleteBookConfirm(prev => ({ ...prev, step: 1 }))}
                      style={{
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: '#e2e8f0',
                        color: '#4a5568',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        flex: 1,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      Kembali
                    </button>
                    <button
                      onClick={() => handleRemoveBook(deleteBookConfirm.bookId)}
                      style={{
                        padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.5rem',
                        backgroundColor: '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        flex: 1,
                        fontSize: isMobile ? '0.85rem' : '1rem'
                      }}
                    >
                      Ya, Tidak Cocok
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1); }
          75% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Layout>
  );
};

// StatCard Component untuk stats view
const StatCard = ({ title, value, description, icon, isMobile = false }) => (
  <div style={{
    textAlign: 'center',
    padding: isMobile ? '1rem 0.75rem' : '1.5rem',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease'
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

export default PlaylistDetail;