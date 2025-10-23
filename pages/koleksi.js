// pages/koleksi.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Koleksi() {
  const [books, setBooks] = useState([])
  const [filteredBooks, setFilteredBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isMobile, setIsMobile] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [sortBy, setSortBy] = useState('judul')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('list') // DEFAULT: LIST VIEW

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load all books - FIX: Load semua data tanpa limit
  useEffect(() => {
    loadAllBooks()
  }, [])

  const loadAllBooks = async () => {
    try {
      setLoading(true)
      
      // Load semua data dengan pagination manual jika perlu
      let allBooks = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('judul', { ascending: true })

        if (error) throw error
        
        if (data && data.length > 0) {
          allBooks = [...allBooks, ...data]
          page++
          
          // Jika dapat kurang dari pageSize, berarti sudah akhir
          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }
      
      console.log(`Loaded ${allBooks.length} books total`)
      setBooks(allBooks)
      setFilteredBooks(allBooks)
    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters and sorting - FIX: Improved sorting logic
  useEffect(() => {
    let result = [...books]

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      result = result.filter(book => 
        (book.judul?.toLowerCase() || '').includes(searchLower) ||
        (book.pengarang?.toLowerCase() || '').includes(searchLower) ||
        (book.penerbit?.toLowerCase() || '').includes(searchLower)
      )
    }

    // Apply tahun filter
    if (tahunFilter) {
      result = result.filter(book => 
        book.tahun_terbit?.toString().includes(tahunFilter)
      )
    }

    // Apply sorting - FIX: Improved sorting logic
    result.sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''
      
      // Handle empty values
      if (!aValue && !bValue) return 0
      if (!aValue) return sortOrder === 'asc' ? 1 : -1
      if (!bValue) return sortOrder === 'asc' ? -1 : 1
      
      // Convert to string for consistent comparison
      aValue = aValue.toString().toLowerCase().trim()
      bValue = bValue.toString().toLowerCase().trim()

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue, 'id', { numeric: true })
      } else {
        return bValue.localeCompare(aValue, 'id', { numeric: true })
      }
    })

    setFilteredBooks(result)
    setCurrentPage(1)
  }, [books, searchTerm, tahunFilter, sortBy, sortOrder])

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredBooks.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTahunFilter('')
    setSortBy('judul')
    setSortOrder('asc')
  }

  // Get unique years for filter dropdown
  const uniqueYears = [...new Set(books
    .map(book => book.tahun_terbit)
    .filter(year => year && year.toString().match(/^\d{4}$/)) // Only 4-digit years
    .map(year => parseInt(year))
    .filter(year => year > 1500 && year < 2100) // Reasonable year range
    .sort((a, b) => b - a) // Descending order
  )]

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
          Jelajahi {books.length.toLocaleString()} khazanah literatur langka Indonesia
        </p>
      </section>

      {/* Controls Section */}
      <section style={{
        backgroundColor: 'white',
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search Box */}
          <div style={{ flex: isMobile ? 'none' : 1 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul, pengarang, atau penerbit..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: '#f7fafc'
              }}
            />
          </div>

          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            flex: isMobile ? 'none' : 2,
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            {/* Tahun Filter */}
            <select
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                minWidth: '140px'
              }}
            >
              <option value="">Semua Tahun</option>
              {uniqueYears.slice(0, 100).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Sort By - FIX: Improved options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                minWidth: '150px'
              }}
            >
              <option value="judul">Urutkan: Judul</option>
              <option value="tahun_terbit">Urutkan: Tahun</option>
              <option value="pengarang">Urutkan: Pengarang</option>
              <option value="penerbit">Urutkan: Penerbit</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: sortOrder === 'asc' ? '#e6fffa' : '#fed7d7',
                color: '#2d3748',
                fontSize: '0.9rem',
                cursor: 'pointer',
                minWidth: '50px',
                fontWeight: '600'
              }}
              title={sortOrder === 'asc' ? 'A-Z / Terlama' : 'Z-A / Terbaru'}
            >
              {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
            </button>

            {/* View Mode - FIX: Default list view */}
            <div style={{
              display: 'flex',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? '#4299e1' : 'white',
                  color: viewMode === 'list' ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'list' ? '600' : '400'
                }}
                title="Tampilan List"
              >
                ☰ List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? '#4299e1' : 'white',
                  color: viewMode === 'grid' ? 'white' : '#4a5568',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'grid' ? '600' : '400'
                }}
                title="Tampilan Grid"
              >
                ▦ Grid
              </button>
            </div>

            {/* Clear Filters */}
            {(searchTerm || tahunFilter || sortBy !== 'judul' || sortOrder !== 'asc') && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f56565',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                🔄 Reset
              </button>
            )}
          </div>

          {/* Items Per Page */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: isMobile ? 'none' : 0.5
          }}>
            <span style={{ fontSize: '0.9rem', color: '#4a5568', whiteSpace: 'nowrap' }}>
              Per halaman:
            </span>
            <select 
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={{
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '0.9rem'
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results Info */}
      <section style={{
        backgroundColor: '#f7fafc',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600',
              color: '#2d3748',
              margin: 0
            }}>
              Koleksi Buku Langka
            </h3>
            <p style={{ 
              color: '#718096',
              margin: '0.25rem 0 0 0',
              fontSize: '0.9rem'
            }}>
              {loading ? (
                <span>Memuat {books.length.toLocaleString()} buku...</span>
              ) : (
                <span>
                  <strong>{filteredBooks.length.toLocaleString()}</strong> buku 
                  {searchTerm && ` untuk "${searchTerm}"`}
                  {tahunFilter && ` tahun ${tahunFilter}`}
                </span>
              )}
            </p>
          </div>
          
          {!loading && filteredBooks.length > 0 && (
            <div style={{
              fontSize: '0.9rem',
              color: '#718096',
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              Menampilkan <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBooks.length)}</strong> 
              {totalPages > 1 && ` • Halaman ${currentPage} dari ${totalPages}`}
            </div>
          )}
        </div>
      </section>

      {/* Books Grid/List */}
      <section style={{ 
        maxWidth: '1400px', 
        margin: '2rem auto',
        padding: isMobile ? '0 1rem' : '0 2rem',
        minHeight: '500px'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#718096'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <p>Memuat {books.length.toLocaleString()} koleksi buku langka...</p>
            <div style={{ 
              width: '200px', 
              height: '4px', 
              backgroundColor: '#e2e8f0',
              borderRadius: '2px',
              margin: '2rem auto',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#4299e1',
                width: '60%',
                animation: 'loading 2s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        ) : (
          <>
            {/* DEFAULT: List View */}
            {viewMode === 'list' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '3rem'
              }}>
                {currentItems.map((book) => (
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
                marginBottom: '3rem'
              }}>
                {currentItems.map((book) => (
                  <BookCard key={book.id} book={book} isMobile={isMobile} />
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredBooks.length === 0 && !loading && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#718096'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>Tidak ada buku ditemukan</h3>
                <p>Silakan coba kata kunci atau filter yang berbeda</p>
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
                  Tampilkan Semua {books.length.toLocaleString()} Buku
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && filteredBooks.length > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
                isMobile={isMobile}
              />
            )}
          </>
        )}
      </section>

      {/* Loading Animation */}
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </Layout>
  )
}

// Book Card Component (Grid View) - SAMA
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

// Book List Item Component (List View) - SAMA
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

// Pagination Component - SAMA
function Pagination({ currentPage, totalPages, paginate, isMobile }) {
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = isMobile ? 3 : 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= Math.ceil(maxVisible / 2)) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - Math.floor(maxVisible / 2)) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - maxVisible + 2; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
    
    return pages
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '3rem',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
        style={{
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          backgroundColor: currentPage === 1 ? '#f7fafc' : 'white',
          color: currentPage === 1 ? '#a0aec0' : '#4a5568',
          borderRadius: '8px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          fontSize: isMobile ? '0.8rem' : '1rem'
        }}
      >
        ⏮️
      </button>
      
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          backgroundColor: currentPage === 1 ? '#f7fafc' : 'white',
          color: currentPage === 1 ? '#a0aec0' : '#4a5568',
          borderRadius: '8px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          fontSize: isMobile ? '0.8rem' : '1rem'
        }}
      >
        ◀️
      </button>

      {getPageNumbers().map((pageNumber, index) => (
        pageNumber === '...' ? (
          <span key={index} style={{
            padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
            color: '#718096'
          }}>
            ...
          </span>
        ) : (
          <button
            key={index}
            onClick={() => paginate(pageNumber)}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              backgroundColor: currentPage === pageNumber ? '#4299e1' : 'white',
              color: currentPage === pageNumber ? 'white' : '#4a5568',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: isMobile ? '2.5rem' : '3rem',
              fontSize: isMobile ? '0.8rem' : '1rem'
            }}
          >
            {pageNumber}
          </button>
        )
      ))}

      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          backgroundColor: currentPage === totalPages ? '#f7fafc' : 'white',
          color: currentPage === totalPages ? '#a0aec0' : '#4a5568',
          borderRadius: '8px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          fontSize: isMobile ? '0.8rem' : '1rem'
        }}
      >
        ▶️
      </button>
      
      <button
        onClick={() => paginate(totalPages)}
        disabled={currentPage === totalPages}
        style={{
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          backgroundColor: currentPage === totalPages ? '#f7fafc' : 'white',
          color: currentPage === totalPages ? '#a0aec0' : '#4a5568',
          borderRadius: '8px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          fontSize: isMobile ? '0.8rem' : '1rem'
        }}
      >
        ⏭️
      </button>
    </div>
  )
}
