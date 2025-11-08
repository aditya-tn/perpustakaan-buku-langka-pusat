import { PlaylistProvider } from '../contexts/PlaylistContext';

function MyApp({ Component, pageProps }) {
  return (
    <PlaylistProvider>
      <Component {...pageProps} />
    </PlaylistProvider>
  );
}

export default MyApp;