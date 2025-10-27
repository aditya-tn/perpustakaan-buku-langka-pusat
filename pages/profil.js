// pages/profil.js - FIXED VERSION
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import HeroProfil from '../components/profil/HeroProfil'
import TabNavigation from '../components/profil/TabNavigation'
import TentangKami from '../components/profil/TentangKami'
import VisiMisi from '../components/profil/VisiMisi'
import TimKami from '../components/profil/TimKami'
import KontakJam from '../components/profil/KontakJam'
import QuickActions from '../components/profil/QuickActions'

export default function Profil() {
  const [activeTab, setActiveTab] = useState('tentang')
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // FIX: Client-side only code
  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tentang':
        return <TentangKami />
      case 'visi-misi':
        return <VisiMisi />
      case 'pegawai':
        return <TimKami />
      case 'kontak':
        return <KontakJam />
      default:
        return <TentangKami />
    }
  }

  // FIX: Return early during SSR
  if (!isClient) {
    return (
      <Layout>
        <Head>
          <title>Profil Layanan - Koleksi Buku Langka Perpustakaan Nasional RI</title>
          <meta name="description" content="Profil Layanan Koleksi Buku Langka Perpustakaan Nasional RI" />
        </Head>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Loading...
        </div>
      </Layout>
    )
  }

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Profil Layanan - Koleksi Buku Langka Perpustakaan Nasional RI</title>
        <meta name="description" content="Profil Layanan Koleksi Buku Langka Perpustakaan Nasional RI - Visi, Misi, Tim, dan Kontak" />
      </Head>

      <HeroProfil />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderTabContent()}
      <QuickActions />
    </Layout>
  )
}
