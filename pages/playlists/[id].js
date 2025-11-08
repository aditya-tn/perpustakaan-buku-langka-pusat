// pages/playlists/[id].js - FIX VIEW TRACKING
import { useState, useEffect, useRef } from 'react'; // ⚡ TAMBAH useRef
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { usePlaylist } from '../../contexts/PlaylistContext';
import { playlistService, analyticsService, searchService } from '../../services/indexService';

const PlaylistDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { playlists, userId, likePlaylist, trackView } = usePlaylist();
  
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [similarPlaylists, setSimilarPlaylists] = useState([]);
  const [view, setView] = useState('books');
  const [searchTerm, setSearchTerm] = useState('');
  
  // ⚡ TAMBAH: Track jika view sudah di-count
  const viewCountedRef = useRef(false);

  // Load playlist data - FIX VIEW TRACKING
  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Try to get from context first (cached)
        const cachedPlaylist = playlists.find(p => p.id === id);
        
        if (cachedPlaylist) {
          setPlaylist(cachedPlaylist);
        } else {
          // Fetch from service
          const playlistData = await playlistService.getPlaylistById(id);
          setPlaylist(playlistData);
        }

        // ⚡ FIX: Track view hanya sekali per session
        if (!viewCountedRef.current) {
          await trackView(id);
          viewCountedRef.current = true;
          console.log('✅ View tracked for playlist:', id);
        }

        // Load analytics
        const playlistStats = await analyticsService.getPlaylistStats(id);
        setStats(playlistStats);

        // Load similar playlists
        const similar = await searchService.getSimilarPlaylists(id, 4);
        setSimilarPlaylists(similar);

      } catch (err) {
        console.error('Error loading playlist:', err);
        setError('Playlist tidak ditemukan atau terjadi error');
      } finally {
        setLoading(false);
      }
    };

    loadPlaylistData();
  }, [id, playlists, trackView]);

  // ⚡ FIX: Handle like dengan better feedback
  const handleLike = async () => {
    if (!playlist) return;
    
    try {
      await likePlaylist(playlist.id);
      // Optimistic update
      setPlaylist(prev => ({
        ...prev,
        like_count: (prev.like_count || 0) + 1
      }));
      
      // Update stats juga
      if (stats) {
        setStats(prev => ({
          ...prev,
          engagement: {
            ...prev.engagement,
            likes: prev.engagement.likes + 1
          }
        }));
      }
      
      console.log('✅ Liked playlist:', playlist.id);
    } catch (error) {
      console.error('Error liking playlist:', error);
    }
  };

  // Filter books based on search
  const filteredBooks = playlist?.books?.filter(book => 
    book.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.pengarang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.penerbit?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Extract year from tahun_terbit
  const extractYear = (tahunStr) => {
    const match = tahunStr?.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          color: '#718096'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          Memuat playlist...
        </div>
      </Layout>
    );
  }

  if (error || !playlist) {
    return (
      <Layout>
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#4a5568', marginBottom: '1rem' }}>
            {error || 'Playlist tidak ditemukan'}
          </h2>
          <p style={{ color: '#718096', marginBottom: '2rem' }}>
            Playlist mungkin telah dihapus atau terjadi error.
          </p>
          <button
            onClick={() => router.push('/playlists')}
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
            Kembali ke Daftar Playlists
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{playlist.name} - Playlist Komunitas</title>
        <meta name="description" content={playlist.description || `Playlist berisi ${playlist.books?.length || 0} buku`} />
      </Head>

      {/* Header Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '3rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => router.push('/playlists')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← Kembali ke Playlists
            </button>
          </div>

          {/* Playlist Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '2rem',
            alignItems: 'start'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                lineHeight: '1.2'
              }}>
                {playlist.name}
              </h1>
              
              {playlist.description && (
                <p style={{
                  fontSize: '1.1rem',
                  marginBottom: '1.5rem',
                  opacity: 0.9,
                  lineHeight: '1.5'
                }}>
                  {playlist.description}
                </p>
              )}

              {/* Metadata */}
              <div style={{
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                fontSize: '0.9rem',
                opacity: 0.8
              }}>
                <span>📚 {playlist.books?.length || 0} buku</span>
                <span>❤️ {playlist.like_count || 0} likes</span>
                <span>👁️ {playlist.view_count || 0} views</span>
                <span>
                  Dibuat oleh {playlist.created_by === userId ? 'Anda' : 'Komunitas'} • 
                  {' '}{new Date(playlist.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button
                onClick={handleLike}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                ❤️ Like Playlist
              </button>
              
              {playlist.created_by === userId && (
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  ✏️ Edit Playlist
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '2rem',
          marginTop: '2rem'
        }}>
          {[
            { key: 'books', label: `Buku (${playlist.books?.length || 0})`, icon: '📚' },
            { key: 'stats', label: 'Statistik', icon: '📊' },
            { key: 'similar', label: 'Playlist Serupa', icon: '🔍' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: view === tab.key ? '#4299e1' : '#718096',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: view === tab.key ? '2px solid #4299e1' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section style={{ 
        maxWidth: '1200px', 
        margin: '0 auto 3rem auto',
        padding: '0 2rem'
      }}>
        {view === 'books' && (
          <div>
            {/* Search Box */}
            <div style={{
              marginBottom: '2rem',
              position: 'relative',
              maxWidth: '400px'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari buku dalam playlist..."
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

            {/* Books Grid */}
            {filteredBooks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>
                  {searchTerm ? 'Buku tidak ditemukan' : 'Belum ada buku dalam playlist'}
                </h3>
                <p style={{ color: '#718096' }}>
                  {searchTerm 
                    ? 'Coba kata kunci pencarian lain'
                    : 'Tambahkan buku pertama ke playlist ini'
                  }
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredBooks.map((book, index) => (
                  <div
                    key={book.id || index}
                    style={{
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onClick={() => {
                      // Buka detail buku atau scroll ke buku di halaman utama
                      window.open(`/?highlight=${book.id}`, '_blank');
                    }}
                  >
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#2d3748',
                      lineHeight: '1.4'
                    }}>
                      {book.judul}
                    </h3>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      {book.pengarang && (
                        <div style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '0.25rem' }}>
                          <strong>Pengarang:</strong> {book.pengarang}
                        </div>
                      )}
                      {book.tahun_terbit && (
                        <div style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '0.25rem' }}>
                          <strong>Tahun:</strong> 
                          <span style={{
                            backgroundColor: extractYear(book.tahun_terbit) ? '#f0fff4' : '#fffaf0',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            marginLeft: '0.3rem',
                            fontFamily: 'monospace'
                          }}>
                            {book.tahun_terbit}
                          </span>
                        </div>
                      )}
                      {book.penerbit && (
                        <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                          <strong>Penerbit:</strong> {book.penerbit}
                        </div>
                      )}
                    </div>

                    {book.deskripsi_fisik && (
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#718096',
                        fontStyle: 'italic',
                        lineHeight: '1.4',
                        margin: 0
                      }}>
                        {book.deskripsi_fisik}
                      </p>
                    )}

                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '0.7rem',
                      color: '#718096',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Ditambahkan: {new Date(book.added_at || playlist.created_at).toLocaleDateString('id-ID')}</span>
                      <span>📖 Lihat Buku</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'stats' && stats && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#2d3748', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Statistik Playlist
            </h2>
            
            {/* Engagement Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ 
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: '#ebf8ff',
                borderRadius: '8px',
                border: '1px solid #bee3f8'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3182ce', marginBottom: '0.5rem' }}>
                  {stats.engagement.views}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#2c5282', fontWeight: '600' }}>Total Views</div>
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>Dilihat oleh komunitas</div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: '#fff5f5',
                borderRadius: '8px',
                border: '1px solid #fed7d7'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#e53e3e', marginBottom: '0.5rem' }}>
                  {stats.engagement.likes}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#c53030', fontWeight: '600' }}>Total Likes</div>
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>Disukai oleh komunitas</div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: '#f0fff4',
                borderRadius: '8px',
                border: '1px solid #9ae6b4'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#38a169', marginBottom: '0.5rem' }}>
                  {stats.books.total}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#276749', fontWeight: '600' }}>Total Buku</div>
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>Dalam playlist ini</div>
              </div>
            </div>
        
            {/* Content Analysis */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Books by Year */}
              {stats.books.byYear && Object.keys(stats.books.byYear).length > 0 && (
                <div>
                  <h3 style={{ color: '#4a5568', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📅 Distribusi Tahun Terbit
                  </h3>
                  <div style={{
                    backgroundColor: '#f7fafc',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    maxHeight: '300px',
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
                            padding: '0.75rem 0',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                fontWeight: '600', 
                                color: '#2d3748',
                                minWidth: '50px'
                              }}>
                                {year}
                              </span>
                              <div style={{
                                flex: 1,
                                height: '8px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: '#4299e1',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              minWidth: '80px',
                              justifyContent: 'flex-end'
                            }}>
                              <span style={{ 
                                fontWeight: '600', 
                                color: '#4a5568',
                                fontSize: '0.9rem'
                              }}>
                                {count}
                              </span>
                              <span style={{ 
                                color: '#718096', 
                                fontSize: '0.8rem',
                                minWidth: '35px'
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
                  <h3 style={{ color: '#4a5568', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🌐 Distribusi Bahasa
                  </h3>
                  <div style={{
                    backgroundColor: '#f7fafc',
                    padding: '1rem',
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
                            padding: '0.5rem 0',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>
                              {languageLabels[language] || language}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                fontWeight: '600', 
                                color: '#2d3748',
                                fontSize: '0.9rem'
                              }}>
                                {count}
                              </span>
                              <span style={{ 
                                color: '#718096', 
                                fontSize: '0.8rem',
                                minWidth: '40px'
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
                <h3 style={{ color: '#4a5568', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🆕 Buku Terbaru Ditambahkan
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {stats.books.recentAdditions.map((book, index) => (
                    <div key={index} style={{
                      padding: '1rem',
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
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        lineHeight: '1.3'
                      }}>
                        {book.judul}
                      </div>
                      {book.pengarang && (
                        <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.25rem' }}>
                          oleh {book.pengarang}
                        </div>
                      )}
                      {book.tahun_terbit && (
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
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
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f0fff4',
              borderRadius: '8px',
              border: '1px solid #9ae6b4'
            }}>
              <h4 style={{ color: '#22543d', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ℹ️ Informasi Playlist
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                fontSize: '0.9rem'
              }}>
                <div>
                  <strong style={{ color: '#22543d' }}>Dibuat:</strong>{' '}
                  {new Date(stats.basic.createdDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div>
                  <strong style={{ color: '#22543d' }}>Terakhir Diupdate:</strong>{' '}
                  {new Date(stats.basic.lastUpdated).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
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

        {view === 'similar' && (
          <div>
            <h2 style={{ color: '#2d3748', marginBottom: '1.5rem' }}>🔍 Playlist Serupa</h2>
            
            {similarPlaylists.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤔</div>
                <p style={{ color: '#718096' }}>
                  Belum ada playlist yang serupa ditemukan
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {similarPlaylists.map(similar => (
                  <div
                    key={similar.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onClick={() => router.push(`/playlists/${similar.id}`)}
                  >
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#2d3748'
                    }}>
                      {similar.name}
                    </h3>
                    
                    {similar.description && (
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#718096',
                        marginBottom: '1rem',
                        lineHeight: '1.4'
                      }}>
                        {similar.description}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
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
      </section>
    </Layout>
  );
};

export default PlaylistDetail;
