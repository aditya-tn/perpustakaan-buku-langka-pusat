import { useState } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  
  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20) // Default 20 per halaman

  // Function untuk search individual words
  const searchIndividualWords = async (searchWords) => {
    try {
      // Buat OR condition untuk setiap kata di setiap field
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

      console.log('🔍 Individual word results:', data)
      if (data && data.length > 0) {
        setSearchResults(data)
      } else {
        // Jika masih kosong, coba search hanya di judul
        const titleConditions = searchWords.map(word => `judul.ilike.%${word}%`)
        const { data: titleData } = await supabase
          .from('books')
          .select('*')
          .or(titleConditions.join(','))
        
        console.log('🔍 Title-only results:', titleData)
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
    setCurrentPage(1) // Reset ke halaman 1 setiap search baru
    console.log('🔍 Searching for:', searchTerm)

    try {
      // Clean and split search term
      const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0)
      console.log('📝 Search words:', searchWords)

      let query = supabase
        .from('books')
        .select('*')

      if (searchWords.length > 1) {
        // Untuk multiple words: buat OR condition yang lebih sederhana
        const searchPattern = `%${searchTerm}%` // Cari frase lengkap dulu
        query = query.or(`judul.ilike.${searchPattern},pengarang.ilike.${searchPattern},penerbit.ilike.${searchPattern}`)
        
        const { data, error } = await query
        
        if (!error && data && data.length > 0) {
          console.log('✅ Found with phrase search:', data.length)
          setSearchResults(data)
        } else {
          // Jika frase tidak ketemu, cari individual words
          console.log('🔄 Trying individual word search...')
          await searchIndividualWords(searchWords)
        }
      } else {
        // Single word search
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

  // Hitung data untuk pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(searchResults.length / itemsPerPage)

  // Function untuk ganti halaman
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Function untuk ganti items per page
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1) // Reset ke halaman 1
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FFFEF7',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Head>
        <title>Layanan Koleksi Buku Langka - Perpustakaan Nasional RI</title>
      </Head>

      {/* Header */}
      <header style={{
        backgroundColor: '#8B4513',
        color: 'white',
        padding: '1rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Layanan Koleksi Buku Langka - Perpustakaan Nasional RI
          </h1>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: '#D2691E',
        padding: '0.5rem 1rem'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          gap: '2rem'
        }}>
          <a href="/" style={{ color: 'white', textDecoration: 'none' }}>Beranda</a>
          <a href="/koleksi" style={{ color: 'white', textDecoration: 'none' }}>Koleksi</a>
          <a href="/layanan" style={{ color: 'white', textDecoration: 'none' }}>Layanan</a>
          <a href="/profil" style={{ color: 'white', textDecoration: 'none' }}>Profil</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        backgroundColor: '#f5f5f0',
        padding: '3rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#2C1810',
            marginBottom: '1rem'
          }}>
            Koleksi 85,000+ Buku Langka
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#2C1810',
            marginBottom: '2rem'
          }}>
            Temukan khazanah literatur langka Indonesia
          </p>
          
          <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul, pengarang, atau tahun..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #D2691E',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <button 
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#8B4513',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Mencari...' : 'Cari'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section style={{ 
          maxWidth: '1200px', 
          margin: '2rem auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: '#2C1810',
              margin: 0
            }}>
              Hasil Pencarian ({searchResults.length} buku)
            </h3>
            
            {/* Items Per Page Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Tampilkan:</span>
              <select 
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #D2691E',
                  borderRadius: '4px',
                  backgroundColor: 'white'
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
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, searchResults.length)} dari {searchResults.length} buku
            {totalPages > 1 && ` (Halaman ${currentPage} dari ${totalPages})`}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {currentItems.map((book) => (
              <div key={book.id} style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #f5f5f0'
              }}>
                <h4 style={{ 
                  fontWeight: 'bold',
                  color: '#2C1810',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  {book.judul}
                </h4>
                
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.25rem 0' }}>
                  <strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}
                </p>
                
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.25rem 0' }}>
                  <strong>Tahun:</strong> {book.tahun_terbit || 'Tidak diketahui'}
                </p>
                
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.25rem 0' }}>
                  <strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}
                </p>

                {book.deskripsi_fisik && (
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                    <strong>Deskripsi:</strong> {book.deskripsi_fisik}
                  </p>
                )}

                {/* TOMBOL OPAC & PEMESANAN */}
                <div style={{ 
                  marginTop: '1rem', 
                  display: 'flex', 
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Tombol Lihat OPAC */}
                  {book.lihat_opac && book.lihat_opac !== 'null' && (
                    <a 
                      href={book.lihat_opac}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#8B4513',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        display: 'inline-block'
                      }}
                    >
                      📖 LIHAT OPAC
                    </a>
                  )}

                  {/* Tombol Pesan Koleksi */}
                  {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
                    <a 
                      href={book.link_pesan_koleksi}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#D2691E',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        display: 'inline-block'
                      }}
                    >
                      📥 PESAN KOLEKSI
                    </a>
                  )}

                  {/* Jika tidak ada link, tampilkan placeholder */}
                  {(!book.lihat_opac || book.lihat_opac === 'null') && 
                   (!book.link_pesan_koleksi || book.link_pesan_koleksi === 'null') && (
                    <span style={{
                      color: '#999',
                      fontSize: '0.8rem',
                      fontStyle: 'italic'
                    }}>
                      Link tidak tersedia
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #D2691E',
                  backgroundColor: currentPage === 1 ? '#f5f5f0' : 'white',
                  color: currentPage === 1 ? '#999' : '#2C1810',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ⏮️ First
              </button>
              
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #D2691E',
                  backgroundColor: currentPage === 1 ? '#f5f5f0' : 'white',
                  color: currentPage === 1 ? '#999' : '#2C1810',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ◀️ Prev
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #D2691E',
                      backgroundColor: currentPage === pageNumber ? '#8B4513' : 'white',
                      color: currentPage === pageNumber ? 'white' : '#2C1810',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: currentPage === pageNumber ? 'bold' : 'normal'
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
                  padding: '0.5rem 1rem',
                  border: '1px solid #D2691E',
                  backgroundColor: currentPage === totalPages ? '#f5f5f0' : 'white',
                  color: currentPage === totalPages ? '#999' : '#2C1810',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next ▶️
              </button>
              
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #D2691E',
                  backgroundColor: currentPage === totalPages ? '#f5f5f0' : 'white',
                  color: currentPage === totalPages ? '#999' : '#2C1810',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Last ⏭️
              </button>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer style={{
        backgroundColor: '#2C1810',
        color: 'white',
        padding: '2rem 1rem',
        marginTop: '3rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p>&copy; 2024 Layanan Koleksi Buku Langka - Perpustakaan Nasional RI</p>
        </div>
      </footer>
    </div>
  )
}
