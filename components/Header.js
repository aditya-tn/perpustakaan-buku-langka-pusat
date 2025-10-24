import { useState } from 'react'
import Link from 'next/link'

export default function Header({ isMobile, currentPath = '' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Function untuk cek active menu
  const isActive = (path) => {
    return currentPath === path ? 'active' : ''
  }

  return (
    <header style={{
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <Link href="/" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '800',
            color: '#4299e1'
          }}>
            📚
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '700',
            color: '#2d3748'
          }}>
            Perpustakaan Nasional
          </div>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <Link 
              href="/" 
              style={{
                textDecoration: 'none',
                color: isActive('/') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              Beranda
            </Link>
            
            <Link 
              href="/koleksi" 
              style={{
                textDecoration: 'none',
                color: isActive('/koleksi') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/koleksi') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/koleksi') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              Koleksi Buku
            </Link>
            
            <Link 
              href="/layanan" 
              style={{
                textDecoration: 'none',
                color: isActive('/layanan') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/layanan') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/layanan') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              Layanan
            </Link>
            
            <Link 
              href="/profil" 
              style={{
                textDecoration: 'none',
                color: isActive('/profil') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/profil') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/profil') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              Profil
            </Link>
            
            <Link 
              href="/kritik-saran" 
              style={{
                textDecoration: 'none',
                color: isActive('/kritik-saran') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/kritik-saran') ? '600' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/kritik-saran') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              Kritik & Saran
            </Link>
          </nav>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#4a5568'
            }}
          >
            ☰
          </button>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMobile && isMenuOpen && (
        <div style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e2e8f0',
          padding: '1rem'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: isActive('/') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/') ? '600' : '400',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s',
                display: 'block'
              }}
            >
              Beranda
            </Link>
            
            <Link 
              href="/koleksi" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: isActive('/koleksi') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/koleksi') ? '600' : '400',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/koleksi') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s',
                display: 'block'
              }}
            >
              Koleksi Buku
            </Link>
            
            <Link 
              href="/layanan" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: isActive('/layanan') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/layanan') ? '600' : '400',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/layanan') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s',
                display: 'block'
              }}
            >
              Layanan
            </Link>
            
            <Link 
              href="/profil" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: isActive('/profil') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/profil') ? '600' : '400',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/profil') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s',
                display: 'block'
              }}
            >
              Profil
            </Link>
            
            <Link 
              href="/kritik-saran" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: isActive('/kritik-saran') ? '#4299e1' : '#4a5568',
                fontWeight: isActive('/kritik-saran') ? '600' : '400',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/kritik-saran') ? '#ebf8ff' : 'transparent',
                transition: 'all 0.2s',
                display: 'block'
              }}
            >
              Kritik & Saran
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
