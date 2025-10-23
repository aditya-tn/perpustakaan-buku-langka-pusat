// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

// Komponen Advanced Search Bar
function AdvancedSearchBar({ books, onSearchResults }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      onSearchResults(books);
      return;
    }

    const keywords = term.toLowerCase().split(' ').filter(word => word.length > 0);
    
    const results = books.filter(book => {
      const searchableText = `
        ${book.title || ''} 
        ${book.author || ''} 
        ${book.description || ''}
        ${book.category || ''}
        ${book.publisher || ''}
      `.toLowerCase();

      return keywords.every(keyword => searchableText.includes(keyword));
    });

    onSearchResults(results);
  };

  return (
    <div className="search-bar mb-6">
      <input
        type="text"
        placeholder="Cari buku... (contoh: sejarah majapahit, novel terjemahan, sastra jawa)"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
      />
      {searchTerm && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Mencari: "{searchTerm}" • {searchTerm.split(' ').filter(w => w.length > 0).length} kata kunci</p>
        </div>
      )}
    </div>
  );
}

// Komponen Book Card
function BookCard({ book }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-800">{book.title}</h3>
        <p className="text-gray-600 mb-1"><strong>Pengarang:</strong> {book.author}</p>
        <p className="text-gray-600 mb-1"><strong>Kategori:</strong> {book.category}</p>
        <p className="text-gray-600 mb-1"><strong>Tahun:</strong> {book.year}</p>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2">{book.description}</p>
        <button className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
          Detail Buku
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchInfo, setSearchInfo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Data contoh buku (nanti bisa ganti dengan data dari database)
  const sampleBooks = [
    {
      id: 1,
      title: "Sejarah Majapahit: Kejayaan Nusantara",
      author: "Prof. Dr. Sastro Wijaya",
      category: "Sejarah",
      year: "2018",
      description: "Buku ini mengupas tuntas sejarah kerajaan Majapahit dari masa kejayaan hingga keruntuhannya.",
      publisher: "Pustaka Nusantara"
    },
    {
      id: 2,
      title: "Nagarakretagama dan Sejarah Kuno",
      author: "Dr. Bambang Sutopo",
      category: "Sejarah",
      year: "2020",
      description: "Analisis mendalam tentang kitab Nagarakretagama sebagai sumber sejarah kuno Indonesia.",
      publisher: "Balai Arkeologi"
    },
    {
      id: 3,
      title: "Sastra Jawa Kuno",
      author: "Dra. Sri Mulyani",
      category: "Sastra",
      year: "2019",
      description: "Kumpulan dan analisis karya sastra Jawa kuno beserta terjemahan modern.",
      publisher: "Universitas Indonesia Press"
    },
    {
      id: 4,
      title: "Arsitektur Candi Majapahit",
      author: "Ir. Teguh Santoso",
      category: "Arsitektur",
      year: "2017",
      description: "Studi tentang arsitektur dan struktur candi-candi peninggalan Majapahit.",
      publisher: "Penerbit Teknik"
    },
    {
      id: 5,
      title: "Novel Sejarah: Sang Pemberani",
      author: "Ahmad Fauzi",
      category: "Novel",
      year: "2021",
      description: "Novel historis tentang petualangan seorang pahlawan muda di zaman Majapahit.",
      publisher: "Pustaka Fiksi"
    },
    {
      id: 6,
      title: "Terjemahan Kakawin Sutasoma",
      author: "Prof. Suryo Negoro",
      category: "Sastra",
      year: "2015",
      description: "Terjemahan lengkap dan penjelasan Kakawin Sutasoma beserta nilai filosofisnya.",
      publisher: "Lembaga Bahasa"
    }
  ];

  useEffect(() => {
    // Simulasi loading data
    setTimeout(() => {
      setAllBooks(sampleBooks);
      setFilteredBooks(sampleBooks);
      setSearchInfo(`Menampilkan semua ${sampleBooks.length} koleksi buku`);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSearchResults = (results) => {
    setFilteredBooks(results);
    setSearchInfo(`Ditemukan ${results.length} hasil pencarian`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Perpustakaan Buku Langka Pusat</title>
        <meta name="description" content="Koleksi buku langka dan naskah kuno" />
      </Head>

      {/* Header */}
      <header className="bg-blue-800 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Perpustakaan Buku Langka Pusat</h1>
          <p className="text-blue-200 mt-2">Koleksi Naskah Kuno dan Buku Langka Nusantara</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Cari Koleksi Buku</h2>
          <AdvancedSearchBar 
            books={allBooks} 
            onSearchResults={handleSearchResults}
          />
        </section>

        {/* Search Info */}
        {searchInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium">{searchInfo}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Memuat koleksi buku...</p>
          </div>
        )}

        {/* Books Grid */}
        {!isLoading && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Koleksi Buku</h2>
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-600 text-lg">Tidak ditemukan buku yang sesuai dengan pencarian.</p>
                <p className="text-gray-500 mt-2">Coba gunakan kata kunci yang lebih umum atau kurangi filter.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Perpustakaan Buku Langka Pusat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
