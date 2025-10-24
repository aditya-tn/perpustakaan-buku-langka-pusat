// pages/koleksi.js - PROFESSIONAL FILTER SIDEBAR VERSION
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

const ITEMS_PER_PAGE = 100

export default function Koleksi() {
  const [visibleBooks, setVisibleBooks] = useState([])
  const [allLoadedBooks, setAllLoadedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  // Filter states
  const [hurufFilter, setHurufFilter] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [sortBy, setSortBy] = useState('judul')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('list')

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initial load
  useEffect(() => {
    loadInitialBooks()
  }, [])

  // Load first batch of books
  const loadInitialBooks = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(0, ITEMS_PER_PAGE - 1)

      if (error) throw error
      
      setAllLoadedBooks(data || [])
      setVisibleBooks(data || [])
      setCurrentOffset(ITEMS_PER_PAGE)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load more books on scroll
  const loadMoreBooks = async () => {
    if (loadingMore || !hasMore) return
    
    try {
      setLoadingMore(true)
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1)

      if (error) throw error
      
      const newBooks = data || []
      setAllLoadedBooks(prev => [...prev, ...newBooks])
      setVisibleBooks(prev => [...prev, ...newBooks])
      setCurrentOffset(prev => prev + ITEMS_PER_PAGE)
      setHasMore(newBooks.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error loading more books:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          < document.documentElement.offsetHeight - 500) return
      
      loadMoreBooks()
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMore])

  // Client-side filtering
  useEffect(() => {
    if (!allLoadedBooks.length) return

    let result = [...allLoadedBooks]

    // Apply huruf filter
    if (hurufFilter) {
      result = result.filter(book => {
        const firstChar = book.judul?.charAt(0)?.toUpperCase() || ''
        return firstChar === hurufFilter
      })
    }

    // Apply tahun filter (rentang 30 tahun)
    if (tahunFilter) {
      const [startYear, endYear] = tahunFilter.split('-').map(Number)
      result = result.filter(book => {
        const bookYear = parseInt(book.tahun_terbit) || 0
        return bookYear >= startYear && bookYear <= endYear
      })
    }

    // Apply client-side sorting
    result.sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''
      
      if (!aValue && !bValue) return 0
      if (!aValue) return sortOrder === 'asc' ? 1 : -1
      if (!bValue) return sortOrder === 'asc' ? -1 : 1
      
      aValue = aValue.toString().toLowerCase().trim()
      bValue = bValue.toString().toLowerCase().trim()

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue, 'id', { numeric: true })
      } else {
        return bValue.localeCompare(aValue, 'id', { numeric: true })
      }
    })

    setVisibleBooks(result)
  }, [allLoadedBooks, hurufFilter, tahunFilter, sortBy, sortOrder])

  const clearFilters = () => {
    setHurufFilter('')
    setTahunFilter('')
    setSortBy('judul')
    setSortOrder('asc')
  }

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Jelajahi seluruh koleksi buku langka Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '800',
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          Koleksi Buku Langka
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Jelajahi khazanah literatur langka Indonesia
        </p>
      </section>

      {/* Main Content with Filter Sidebar */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '2rem',
        gap: isMobile ? '1rem' : '2rem'
      }}>
        {/* Filter Sidebar */}
        <div style={{
          width: isMobile ? '100%' : '300px',
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          height: 'fit-content',
          position: isMobile ? 'static' : 'sticky',
          top: '100px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#2d3748',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔍 Filter Koleksi
          </h3>

          {/* Filter by Huruf A-Z */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              FILTER HURUF
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setHurufFilter('')}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: hurufFilter === '' ? '#4299e1' : 'white',
                  color: hurufFilter === '' ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  minWidth: '40px'
                }}
                title="Semua Huruf"
              >
                All
              </button>
              {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(huruf => (
                <button
                  key={huruf}
                  onClick={() => setHurufFilter(huruf)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    backgroundColor: hurufFilter === huruf ? '#4299e1' : 'white',
                    color: hurufFilter === huruf ? 'white' : '#4a5568',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    minWidth: '30px'
                  }}
                >
                  {huruf}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Tahun (30-year ranges) */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              FILTER TAHUN
            </h4>
            <select
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              <option value="">Semua Periode</option>
              <option value="1800-1830">1800 - 1830</option>
              <option value="1831-1860">1831 - 1860</option>
              <option value="1861-1890">1861 - 1890</option>
              <option value="1891-1920">1891 - 1920</option>
              <option value="1921-1950">1921 - 1950</option>
              <option value="1951-1980">1951 - 1980</option>
              <option value="1981-2010">1981 - 2010</option>
              <option value="2011-2024">2011 - Sekarang</option>
            </select>
          </div>

          {/* Sort Options */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              URUTKAN BERDASARKAN
            </h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                marginBottom: '0.75rem'
              }}
            >
              <option value="judul">Judul Buku</option>
              <option value="tahun_terbit">Tahun Terbit</option>
              <option value="pengarang">Nama Pengarang</option>
              <option value="penerbit">Penerbit</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: sortOrder === 'asc' ? '#e6fffa' : '#fed7d7',
                color: '#2d3748',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {sortOrder === 'asc' ? '↑ A-Z (Ascending)' : '↓ Z-A (Descending)'}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              TAMPILAN
            </h4>
            <div style={{
              display: 'flex',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? '#4299e1' : 'white',
                  color: viewMode === 'list' ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'list' ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                ☰ List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? '#4299e1' : 'white',
                  color: viewMode === 'grid' ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'grid' ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                ▦ Grid
              </button>
            </div>
          </div>

          {/* Reset Filters */}
          {(hurufFilter || tahunFilter || sortBy !== 'judul' || sortOrder !== 'asc') && (
            <button
              onClick={clearFilters}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #f56565',
                borderRadius: '8px',
                backgroundColor: '#f56565',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              🔄 Reset Semua Filter
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          {/* Results Info */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  color: '#2d3748',
                  margin: 0
                }}>
                  Koleksi Buku Langka
                </h3>
                <p style={{ 
                  color: '#718096',
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem'
                }}>
                  {loading ? (
                    'Memuat...'
                  ) : (
                    <span>
                      <strong>{visibleBooks.length}</strong> buku ditemukan
                      {hurufFilter && ` • Huruf ${hurufFilter}`}
                      {tahunFilter && ` • Periode ${tahunFilter}`}
                      {hasMore && ' • Scroll untuk load lebih banyak'}
                    </span>
                  )}
                </p>
              </div>
              
              {!loading && (
                <div style={{
                  fontSize: '0.9rem',
                  color: '#718096',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f7fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  Loaded: <strong>{allLoadedBooks.length}</strong> buku
                </div>
              )}
            </div>
          </div>

          {/* Books List/Grid */}
          <div style={{ minHeight: '500px' }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#718096',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <p>Memuat koleksi buku langka...</p>
              </div>
            ) : (
              <>
                {/* List View */}
                {viewMode === 'list' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginBottom: '2rem'
                  }}>
                    {visibleBooks.map((book) => (
                      <BookListItem key={book.id} book={book} isMobile={isMobile} />
                    ))}
                  </div>
                )}

                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    {visibleBooks.map((book) => (
                      <BookCard key={book.id} book={book} isMobile={isMobile} />
                    ))}
                  </div>
                )}

                {/* No Results */}
                {visibleBooks.length === 0 && !loading && (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: '#718096',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                    <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>Tidak ada buku ditemukan</h3>
                    <p>Silakan coba filter yang berbeda</p>
                    <button
                      onClick={clearFilters}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4299e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Tampilkan Semua Buku
                    </button>
                  </div>
                )}

                {/* Loading More Indicator */}
                {loadingMore && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#718096',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    marginTop: '1rem'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Memuat lebih banyak buku...</p>
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && visibleBooks.length > 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#718096',
                    borderTop: '1px solid #e2e8f0',
                    marginTop: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <p>🎉 Semua buku telah dimuat</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Book Card Component (Grid View)
function BookCard({ book, isMobile }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1.25rem' : '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h4 style={{ 
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '0.75rem',
        fontSize: isMobile ? '1rem' : '1.1rem',
        lineHeight: '1.4',
        flex: 1
      }}>
        {book.judul}
      </h4>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          fontSize: isMobile ? '0.8rem' : '0.9rem', 
          color: '#4a5568', 
          marginBottom: '0.25rem' 
        }}>
          <strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.8rem' : '0.9rem', 
          color: '#4a5568', 
          marginBottom: '0.25rem' 
        }}>
          <strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.8rem' : '0.9rem', 
          color: '#4a5568' 
        }}>
          <strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}
        </div>
      </div>

      {book.deskripsi_fisik && (
        <p style={{ 
          fontSize: isMobile ? '0.75rem' : '0.85rem', 
          color: '#718096', 
          marginTop: '0.75rem',
          lineHeight: '1.5',
          fontStyle: 'italic',
          flex: 1
        }}>
          {book.deskripsi_fisik.length > 150 
            ? `${book.deskripsi_fisik.substring(0, 150)}...` 
            : book.deskripsi_fisik
          }
        </p>
      )}

      {/* Action Buttons */}
      <div style={{ 
        marginTop: '1.25rem', 
        display: 'flex', 
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {book.lihat_opac && book.lihat_opac !== 'null' && (
          <a 
            href={book.lihat_opac}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#4299e1',
              color: 'white',
              padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            📖 Lihat OPAC
          </a>
        )}

        {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
          <a 
            href={book.link_pesan_koleksi}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#48bb78',
              color: 'white',
              padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            📥 Pesan Koleksi
          </a>
        )}
      </div>
    </div>
  )
}

// Book List Item Component (List View)
function BookListItem({ book, isMobile }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: isMobile ? '1rem' : '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '1rem' : '2rem',
      alignItems: isMobile ? 'stretch' : 'center'
    }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          fontWeight: '600',
          color: '#2d3748',
          marginBottom: '0.5rem',
          fontSize: isMobile ? '1rem' : '1.1rem',
          lineHeight: '1.4'
        }}>
          {book.judul}
        </h4>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.5rem',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          color: '#4a5568'
        }}>
          <div><strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}</div>
          <div><strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}</div>
          <div><strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}</div>
        </div>

        {book.deskripsi_fisik && (
          <p style={{ 
            fontSize: isMobile ? '0.75rem' : '0.85rem', 
            color: '#718096', 
            marginTop: '0.5rem',
            lineHeight: '1.5',
            fontStyle: 'italic'
          }}>
            {book.deskripsi_fisik.length > 200 
              ? `${book.deskripsi_fisik.substring(0, 200)}...` 
              : book.deskripsi_fisik
            }
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'center' : 'flex-end'
      }}>
        {book.lihat_opac && book.lihat_opac !== 'null' && (
          <a 
            href={book.lihat_opac}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#4299e1',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            📖 OPAC
          </a>
        )}

        {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
          <a 
            href={book.link_pesan_koleksi}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#48bb78',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            📥 Pesan
          </a>
        )}
      </div>
    </div>
  )
}
