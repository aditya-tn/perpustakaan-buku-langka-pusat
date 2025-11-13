// pages/_app.js - Tambahkan NotificationProvider
import { PlaylistProvider } from '../contexts/PlaylistContext';
import { NotificationProvider } from '../contexts/NotificationContext';

function MyApp({ Component, pageProps }) {
  return (
    <NotificationProvider>
      <PlaylistProvider>
        <Component {...pageProps} />
      </PlaylistProvider>
    </NotificationProvider>
  );
}

export default MyApp;