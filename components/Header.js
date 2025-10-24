// components/Header.js
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Header({ isMobile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const currentPath = router.pathname

  // Function untuk cek active menu
  const isActive = (path) => {
    return currentPath === path
  }

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

  // Toggle mobile menu
  const toggleMenu = (e) => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  return (
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
          <Link href="/" style={{ textDecoration: 'none' }}>
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
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            alignItems: 'center'
          }}>
            <Link href="/" style={{ 
              color: isActive('/') ? '#4299e1' : '#2d3748', 
              textDecoration: 'none',
              fontWeight: isActive('/') ? '600' : '500',
              fontSize: '0.95rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/') ? '#ebf8ff' : '#f7fafc',
              transition: 'all 0.2s'
            }}>
              Beranda
            </Link>
            <Link href="/koleksi" style={{ 
              color: isActive('/koleksi') ? '#4299e1' : '#4a5568', 
              textDecoration: 'none',
              fontWeight: isActive('/koleksi') ? '600' : '400',
              fontSize: '0.95rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/koleksi') ? '#ebf8ff' : 'transparent',
              transition: 'all 0.2s'
            }}>
              Koleksi
            </Link>
            <Link href="/layanan" style={{ 
              color: isActive('/layanan') ? '#4299e1' : '#4a5568', 
              textDecoration: 'none',
              fontWeight: isActive('/layanan') ? '600' : '400',
              fontSize: '0.95rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/layanan') ? '#ebf8ff' : 'transparent',
              transition: 'all 0.2s'
            }}>
              Layanan
            </Link>
            <Link href="/profil" style={{ 
              color: isActive('/profil') ? '#4299e1' : '#4a5568', 
              textDecoration: 'none',
              fontWeight: isActive('/profil') ? '600' : '400',
              fontSize: '0.95rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/profil') ? '#ebf8ff' : 'transparent',
              transition: 'all 0.2s'
            }}>
              Profil
            </Link>
            <Link href="/kritik-saran" style={{ 
              color: isActive('/kritik-saran') ? '#4299e1' : '#4a5568', 
              textDecoration: 'none',
              fontWeight: isActive('/kritik-saran') ? '600' : '400',
              fontSize: '0.95rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/kritik-saran') ? '#ebf8ff' : 'transparent',
              transition: 'all 0.2s'
            }}>
              Kritik & Saran
            </Link>
          </nav>
        )}

        {/* Mobile Navigation */}
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
              <Link 
                href="/" 
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  color: isActive('/') ? '#4299e1' : '#2d3748', 
                  textDecoration: 'none',
                  fontWeight: isActive('/') ? '600' : '500',
                  fontSize: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: isActive('/') ? '#ebf8ff' : '#f7fafc',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Beranda
              </Link>
              <Link 
                href="/koleksi" 
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  color: isActive('/koleksi') ? '#4299e1' : '#4a5568', 
                  textDecoration: 'none',
                  fontWeight: isActive('/koleksi') ? '600' : '400',
                  fontSize: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: isActive('/koleksi') ? '#ebf8ff' : 'white',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Koleksi
              </Link>
              <Link 
                href="/layanan" 
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  color: isActive('/layanan') ? '#4299e1' : '#4a5568', 
                  textDecoration: 'none',
                  fontWeight: isActive('/layanan') ? '600' : '400',
                  fontSize: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: isActive('/layanan') ? '#ebf8ff' : 'white',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Layanan
              </Link>
              <Link 
                href="/profil" 
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  color: isActive('/profil') ? '#4299e1' : '#4a5568', 
                  textDecoration: 'none',
                  fontWeight: isActive('/profil') ? '600' : '400',
                  fontSize: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: isActive('/profil') ? '#ebf8ff' : 'white',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Profil
              </Link>
              <Link 
                href="/kritik-saran" 
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  color: isActive('/kritik-saran') ? '#4299e1' : '#4a5568', 
                  textDecoration: 'none',
                  fontWeight: isActive('/kritik-saran') ? '600' : '400',
                  fontSize: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: isActive('/kritik-saran') ? '#ebf8ff' : 'white',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Kritik & Saran
              </Link>
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
  )
}
