import { useState, useCallback, useEffect } from 'react';

const SearchComponent = () => {
  // State untuk pencarian dan filter
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    tahunRange: [1547, 1990]
  });

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() || activeFilters.tahunRange[0] > 1547 || activeFilters.tahunRange[1] < 1990) {
        performSearch();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeFilters]);

  // Handler untuk range slider
  const handleTahunRangeChange = useCallback((index) => (e) => {
    const value = parseInt(e.target.value);
    
    setActiveFilters(prev => {
      const newRange = [...prev.tahunRange];
      newRange[index] = value;
      
      // Pastikan min tidak lebih besar dari max
      if (index === 0 && newRange[0] > newRange[1]) {
        newRange[1] = newRange[0];
      } else if (index === 1 && newRange[1] < newRange[0]) {
        newRange[0] = newRange[1];
      }
      
      return { ...prev, tahunRange: newRange };
    });
  }, []);

  // Calculate slider track style
  const calculateTrackStyle = () => {
    const min = 1547;
    const max = 1990;
    const minPercent = ((activeFilters.tahunRange[0] - min) / (max - min)) * 100;
    const maxPercent = ((activeFilters.tahunRange[1] - min) / (max - min)) * 100;
    
    return {
      background: `linear-gradient(to right, 
        #ddd ${minPercent}%, 
        #3b82f6 ${minPercent}%, 
        #3b82f6 ${maxPercent}%, 
        #ddd ${maxPercent}%)`
    };
  };

  // Perform search function - SESUAI STRUCTURE DATABASE ANDA
  const performSearch = async () => {
    setLoading(true);
    try {
      // Simulasi data - GANTI DENGAN SUPABASE QUERY ANDA
      const mockData = [
        {
          id: 1,
          judul: "Sejarah Kuno Indonesia",
          pengarang: "Prof. Dr. Sastra Nusantara",
          penerbit: "Penerbit Sejarah",
          tempat_terbit: "Jakarta",
          tahun_terbit: 1920,
          deskripsi_fisik: "xii + 345 halaman; ilustrasi; 24 cm",
          nomor_panggil: "959.8 SAS s",
          link_pesan: "#"
        },
        {
          id: 2,
          judul: "Naskah Kuno Majapahit",
          pengarang: "Dr. Arkeologi Indonesia",
          penerbit: "Balai Pustaka",
          tempat_terbit: "Yogyakarta", 
          tahun_terbit: 1895,
          deskripsi_fisik: "viii + 230 halaman; 22 cm",
          nomor_panggil: "959.82 ARK n",
          link_pesan: "#"
        }
      ];

      // Filter data berdasarkan tahun range
      const filteredData = mockData.filter(book => 
        book.tahun_terbit >= activeFilters.tahunRange[0] && 
        book.tahun_terbit <= activeFilters.tahunRange[1]
      );

      // Filter berdasarkan search query
      const finalResults = searchQuery.trim() ? 
        filteredData.filter(book => 
          book.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.pengarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.penerbit.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.tempat_terbit.toLowerCase().includes(searchQuery.toLowerCase())
        ) : 
        filteredData;

      setResults(finalResults);

      // UNCOMMENT UNTUK SUPABASE QUERY:
      /*
      const { data, error } = await supabase
        .from('nama_tabel_anda') // GANTI DENGAN NAMA TABEL
        .select('*')
        .gte('tahun_terbit', activeFilters.tahunRange[0])
        .lte('tahun_terbit', activeFilters.tahunRange[1])
        .or(`judul.ilike.%${searchQuery}%,pengarang.ilike.%${searchQuery}%,penerbit.ilike.%${searchQuery}%`)
        .limit(100);
      
      if (!error) setResults(data || []);
      */

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setActiveFilters({ tahunRange: [1547, 1990] });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Koleksi Buku Langka
          </h1>
          <p className="text-gray-600">
            Telusuri 85,000+ koleksi buku langka dari tahun 1547 - 1990
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, pengarang, penerbit, atau tempat terbit..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={resetFilters}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Range Slider Filter */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Rentang Tahun Terbit:
            </label>
            
            <div className="slider-container space-y-4">
              {/* Slider Track dengan Dual Thumbs */}
              <div className="slider-track relative h-2 bg-gray-200 rounded-full">
                {/* Range Fill */}
                <div 
                  className="slider-range absolute h-2 bg-blue-500 rounded-full"
                  style={calculateTrackStyle()}
                />
                
                {/* Input Min */}
                <input
                  type="range"
                  min="1547"
                  max="1990"
                  value={activeFilters.tahunRange[0]}
                  onChange={handleTahunRangeChange(0)}
                  className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
                />
                
                {/* Input Max */}
                <input
                  type="range"
                  min="1547"
                  max="1990"
                  value={activeFilters.tahunRange[1]}
                  onChange={handleTahunRangeChange(1)}
                  className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
                />
                
                {/* Custom Thumbs */}
                <div
                  className="absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg transform -translate-y-1 z-10 cursor-pointer"
                  style={{ left: `${((activeFilters.tahunRange[0] - 1547) / (1990 - 1547)) * 100}%` }}
                />
                <div
                  className="absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg transform -translate-y-1 z-10 cursor-pointer"
                  style={{ left: `${((activeFilters.tahunRange[1] - 1547) / (1990 - 1547)) * 100}%` }}
                />
              </div>
              
              {/* Tampilan Range */}
              <div className="range-display flex items-center justify-between text-sm text-gray-600">
                <span className="px-3 py-1 bg-gray-100 rounded-full border font-medium">
                  {activeFilters.tahunRange[0]}
                </span>
                
                <span className="range-badge px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {activeFilters.tahunRange[1] - activeFilters.tahunRange[0]} tahun
                </span>
                
                <span className="px-3 py-1 bg-gray-100 rounded-full border font-medium">
                  {activeFilters.tahunRange[1]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Mencari koleksi...
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && results.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Ditemukan <strong>{results.length}</strong> hasil
            {searchQuery && ` untuk "${searchQuery}"`}
            {activeFilters.tahunRange[0] > 1547 || activeFilters.tahunRange[1] < 1990 ? 
              ` (Tahun ${activeFilters.tahunRange[0]} - ${activeFilters.tahunRange[1]})` : ''}
          </div>
        )}

        {/* No Results */}
        {!loading && searchQuery && results.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-gray-500 mb-2">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hasil ditemukan</h3>
            <p className="text-gray-600">
              Coba kata kunci lain atau sesuaikan filter tahun
            </p>
          </div>
        )}

        {/* Results Grid - SESUAI KOLOM DATABASE ANDA */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {book.judul}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}</p>
                    <p><strong>Penerbit:</strong> {book.penerbit || '-'}</p>
                    <p><strong>Tempat Terbit:</strong> {book.tempat_terbit || '-'}</p>
                    <p><strong>Tahun:</strong> {book.tahun_terbit}</p>
                    <p><strong>Deskripsi Fisik:</strong> {book.deskripsi_fisik || '-'}</p>
                    <p><strong>No. Panggil:</strong> <code>{book.nomor_panggil}</code></p>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Tersedia
                    </span>
                    <a 
                      href={book.link_pesan} 
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Pesan Koleksi →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - Awal */}
        {!loading && !searchQuery && results.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Jelajahi Koleksi Buku Langka
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Gunakan kolom pencarian di atas untuk menemukan buku langka 
              dari koleksi 85,000+ item, atau sesuaikan rentang tahun menggunakan slider.
            </p>
          </div>
        )}

      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider-track {
          position: relative;
          height: 6px;
          background: #e5e7eb;
          border-radius: 9999px;
        }

        .slider-range {
          position: absolute;
          height: 100%;
          border-radius: 9999px;
          pointer-events: none;
        }

        .slider-track input[type="range"] {
          position: absolute;
          width: 100%;
          height: 100%;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
        }

        .slider-track input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 2px solid #ffffff;
          border-radius: 50%;
          cursor: pointer;
          pointer-events: all;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-track input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 2px solid #ffffff;
          border-radius: 50%;
          cursor: pointer;
          pointer-events: all;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default SearchComponent;
