// pages/_app.js - TAMBAH NOTIFICATIONCONTAINER
import { PlaylistProvider } from '../contexts/PlaylistContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import NotificationContainer from '../components/NotificationContainer'; // 🆕 IMPORT INI
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* VIEWPORT META TAG - ESSENTIAL untuk mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        {/* Additional mobile-optimized meta tags */}
        <meta name="theme-color" content="#4299e1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        <title>Perpustakaan Nasional RI - Buku Langka</title>
        <meta name="description" content="Koleksi buku langka Perpustakaan Nasional RI" />
      </Head>
      
      <NotificationProvider>
        <PlaylistProvider>
          <Component {...pageProps} />
          {/* 🆕 TAMBAH NOTIFICATION CONTAINER DI SINI */}
          <NotificationContainer />
        </PlaylistProvider>
      </NotificationProvider>
    </>
  );
}

export default MyApp;
