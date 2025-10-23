import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showStats, setShowStats] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto scroll ke atas ketika currentPage berubah
  useEffect(() => {
    if (searchResults.length > 0) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [currentPage, searchResults.length])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])

  // Hide stats when search results appear
  useEffect(() => {
    if (searchResults.length > 0) {
      setShowStats(false)
    } else {
      setShowStats(true)
    }
  }, [searchResults])

  // Search function
  const searchIndividualWords = async (searchWords) => {
    try {
      const orConditions = []
      searchWords.forEach(word => {
        orConditions.push(`judul.ilike.%${word}%`)
        orConditions.push(`pengarang.ilike.%${word}%`) 
        orConditions.push(`penerbit.ilike.%${word}%`)
      })

      const { data } = await supabase
        .from('books')
        .select('*')
        .or(orConditions.join(','))

      if (data && data.length > 0) {
        setSearchResults(data)
      } else {
        const titleConditions = searchWords.map(word => `judul.ilike.%${word}%`)
        const { data: titleData } = await supabase
          .from('books')
          .select('*')
          .or(titleConditions.join(','))
        
        if (titleData && titleData.length > 0) {
          setSearchResults(titleData)
        } else {
          setSearchResults([])
        }
      }
    } catch (err) {
      console.error('Individual word search error:', err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    
    setLoading(true)
    setCurrentPage(1)

    try {
      const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0)

      let query = supabase.from('books').select('*')

      if (searchWords.length > 1) {
        const searchPattern = `%${searchTerm}%`
        query = query.or(`judul.ilike.${searchPattern},pengarang.ilike.${searchPattern},penerbit.ilike.${searchPattern}`)
        
        const { data, error } = await query
        
        if (!error && data && data.length > 0) {
          setSearchResults(data)
        } else {
          await searchIndividualWords(searchWords)
        }
      } else {
        const { data, error } = await query
          .or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%,penerbit.ilike.%${searchTerm}%`)

        if (error) {
          console.error('Search failed:', error)
        } else {
          setSearchResults(data || [])
        }
      }
    } catch (err) {
      console.error('🚨 Critical error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(searchResults.length / itemsPerPage)
  
  // Function untuk ganti halaman dengan scroll ke atas
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  // Toggle mobile menu
  const toggleMenu = (e) => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#fafafa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6'
    }}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Temukan khazanah literatur langka Indonesia dari koleksi Perpustakaan Nasional RI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Modern Header - FIXED VERSION */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: isMobile ? '0.75rem 1rem' : '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          padding: isMobile ? '0' : '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Logo Section */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem'
          }}>
            {isMobile && (
              <button
                onClick={toggleMenu}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  color: '#4a5568',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
            )}
            <div>
              <h1 style={{ 
                fontSize: isMobile ? '1.1rem' : '1.5rem', 
                fontWeight: '700',
                color: '#1a202c',
                margin: 0,
                lineHeight: '1.2'
              }}>
                Koleksi Buku Langka
              </h1>
              <p style={{ 
                fontSize: isMobile ? '0.7rem' : '0.9rem', 
                color: '#718096',
                margin: '0.1rem 0 0 0'
              }}>
                Perpustakaan Nasional RI
              </p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav style={{ 
              display: 'flex', 
              gap: '2rem', 
              alignItems: 'center'
            }}>
              <a href="/" style={{ 
                color: '#2d3748', 
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: '#f7fafc'
              }}>
                Beranda
              </a>
              <a href="/koleksi" style={{ 
                color: '#4a5568', 
                textDecoration: 'none',
                fontSize: '0.95rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                Koleksi
              </a>
              <a href="/layanan" style={{ 
                color: '#4a5568', 
                textDecoration: 'none',
                fontSize: '0.95rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                Layanan
              </a>
              <a href="/profil" style={{ 
                color: '#4a5568', 
                textDecoration: 'none',
                fontSize: '0.95rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                Profil
              </a>
            </nav>
          )}

          {/* Mobile Navigation - SIMPLE & WORKING */}
          {isMobile && isMenuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.75rem)',
                left: '1rem',
                right: '1rem',
                backgroundColor: 'white',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                padding: '1rem',
                borderRadius: '12px',
                zIndex: 1001,
                border: '1px solid #e2e8f0'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <nav style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <a 
                  href="/" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{ 
                    color: '#2d3748', 
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '1rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: '#f7fafc',
                    display: 'block',
                    textAlign: 'center'
                  }}
                >
                  Beranda
                </a>
                <a 
                  href="/koleksi" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{ 
                    color: '#4a5568', 
                    textDecoration: 'none',
                    fontSize: '1rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: 'white'
                  }}
                >
                  Koleksi
                </a>
                <a 
                  href="/layanan" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{ 
                    color: '#4a5568', 
                    textDecoration: 'none',
                    fontSize: '1rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: 'white'
                  }}
                >
                  Layanan
                </a>
                <a 
                  href="/profil" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{ 
                    color: '#4a5568', 
                    textDecoration: 'none',
                    fontSize: '1rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: 'white'
                  }}
                >
                  Profil
                </a>
              </nav>
            </div>
          )}
        </div>

        {/* Overlay untuk close menu ketika klik di luar */}
        {isMobile && isMenuOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              zIndex: 999
            }}
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </header>

      {/* Modern Hero Section - Responsive */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2.5rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Memori Literasi Nusantara
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            marginBottom: isMobile ? '2rem' : '2.5rem',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            85.000+ warisan budaya di layanan buku langka - Perpustakaan Nasional RI
          </p>
          
          <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.5rem' : '0',
              borderRadius: isMobile ? '8px' : '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul, pengarang, atau tahun terbit..."
                style={{
                  flex: 1,
                  padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
                  border: 'none',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#f56565',
                  color: 'white',
                  padding: isMobile ? '1rem 1.5rem' : '0 2.5rem',
                  border: 'none',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: isMobile ? 'auto' : '120px'
                }}
              >
                {loading ? '🔍' : 'Cari'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Stats Section dengan Smooth Transition - Responsive */}
      {showStats && (
        <section style={{
          backgroundColor: 'white',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          transition: 'all 0.3s ease-in-out',
          opacity: showStats ? 1 : 0,
          transform: showStats ? 'translateY(0)' : 'translateY(-20px)'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>85K+</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Koleksi Buku</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>200+</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Tahun Sejarah</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>50+</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Bahasa</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#4a5568' }}>24/7</div>
              <div style={{ color: '#718096', fontWeight: '500', fontSize: isMobile ? '0.85rem' : '1rem' }}>Akses Digital</div>
            </div>
          </div>
        </section>
      )}

      {/* Search Results - Modern Design & Responsive */}
      {searchResults.length > 0 && (
        <section style={{ 
          maxWidth: '1400px', 
          margin: isMobile ? '2rem auto' : '3rem auto',
          padding: isMobile ? '0 1rem' : '0 2rem',
          animation: 'fadeInUp 0.5s ease-out'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div>
              <h3 style={{ 
                fontSize: isMobile ? '1.5rem' : '1.75rem', 
                fontWeight: '700',
                color: '#2d3748',
                margin: 0
              }}>
                Hasil Pencarian
              </h3>
              <p style={{ 
                color: '#718096',
                margin: '0.5rem 0 0 0',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {searchResults.length} buku ditemukan
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                fontSize: isMobile ? '0.8rem' : '0.9rem', 
                color: '#4a5568', 
                fontWeight: '500' 
              }}>
                Tampilkan:
              </span>
              <select 
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  outline: 'none',
                  minWidth: isMobile ? '140px' : 'auto'
                }}
              >
                <option value={20}>20 per halaman</option>
                <option value={50}>50 per halaman</option>
                <option value={100}>100 per halaman</option>
              </select>
            </div>
          </div>

          {/* Pagination Info */}
          <div style={{
            marginBottom: '2rem',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: '#718096',
            padding: isMobile ? '0.75rem' : '1rem',
            backgroundColor: '#f7fafc',
            borderRadius: '8px'
          }}>
            Menampilkan <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, searchResults.length)}</strong> dari <strong>{searchResults.length}</strong> buku
            {totalPages > 1 && ` • Halaman ${currentPage} dari ${totalPages}`}
          </div>

          {/* Modern Book Grid - Responsive */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '3rem'
          }}>
            {currentItems.map((book) => (
              <div key={book.id} style={{
                backgroundColor: 'white',
                padding: isMobile ? '1.25rem' : '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <h4 style={{ 
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '0.75rem',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  lineHeight: '1.4'
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
                    fontStyle: 'italic'
                  }}>
                    {book.deskripsi_fisik}
                  </p>
                )}

                {/* Modern Action Buttons - Responsive */}
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
            ))}
          </div>

          {/* Pagination Controls - Modern & Responsive */}
          {totalPages > 1 && (
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

              {/* Page Numbers */}
              {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= (isMobile ? 3 : 5)) {
                  pageNumber = i + 1
                } else if (currentPage <= (isMobile ? 2 : 3)) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                  pageNumber = totalPages - (isMobile ? 2 : 4) + i
                } else {
                  pageNumber = currentPage - (isMobile ? 1 : 2) + i
                }

                return (
                  <button
                    key={pageNumber}
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
              })}

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
          )}
        </section>
      )}

      {/* Modern Footer dengan Version */}
      <footer style={{
        backgroundColor: '#2d3748',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        marginTop: '4rem'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1rem' }}>
            &copy; 2025 Layanan Koleksi Buku Langka - Perpustakaan Nasional RI
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: isMobile ? '0.8rem' : '0.9rem', opacity: 0.7 }}>
            Melestarikan warisan literasi Indonesia untuk generasi mendatang
          </p>
          {/* Version Badge */}
          <div style={{
            marginTop: '1rem',
            display: 'inline-block',
            backgroundColor: '#4a5568',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: isMobile ? '0.7rem' : '0.8rem',
            fontWeight: '500'
          }}>
            Beta v.01
          </div>
        </div>
      </footer>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
