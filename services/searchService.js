// services/searchService.js - ADVANCED SEARCH & DISCOVERY
import { supabase } from '../lib/supabase';
import { playlistService } from './playlistService';

export const searchService = {
  // ========================
  // BASIC SEARCH OPERATIONS
  // ========================

  /**
   * Unified search across playlists and books
   */
  unifiedSearch: async (query, options = {}) => {
    try {
      const {
        limit = 20,
        offset = 0,
        searchIn = 'all', // 'playlists', 'books', 'all'
        sortBy = 'relevance', // 'relevance', 'popular', 'recent'
        filters = {}
      } = options;

      console.log('🔍 Performing unified search:', { query, options });

      const results = {
        query,
        playlists: [],
        books: [],
        totalResults: 0,
        searchTime: Date.now()
      };

      // Search in playlists
      if (searchIn === 'all' || searchIn === 'playlists') {
        const playlistResults = await searchService.searchPlaylists(query, {
          limit: Math.ceil(limit / 2),
          offset,
          sortBy,
          filters
        });
        results.playlists = playlistResults;
      }

      // Search in books within playlists
      if (searchIn === 'all' || searchIn === 'books') {
        const bookResults = await searchService.searchBooksInPlaylists(query, {
          limit: Math.ceil(limit / 2),
          offset,
          sortBy,
          filters
        });
        results.books = bookResults;
      }

      results.totalResults = results.playlists.length + results.books.length;
      results.searchTime = Date.now() - results.searchTime;

      console.log('✅ Search completed:', {
        query,
        playlistsFound: results.playlists.length,
        booksFound: results.books.length,
        time: results.searchTime + 'ms'
      });

      return results;
    } catch (error) {
      console.error('❌ Error in unifiedSearch:', error);
      throw error;
    }
  },

  /**
   * Search playlists by name, description, or content
   */
  searchPlaylists: async (query, options = {}) => {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = 'relevance',
        filters = {}
      } = options;

      let playlists = await playlistService.getPlaylists({ 
        limit: 1000 // Get more for client-side filtering
      });

      // Filter playlists based on search query
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      const scoredPlaylists = playlists.map(playlist => {
        let score = 0;
        const searchText = (
          (playlist.name || '') + ' ' + 
          (playlist.description || '') + ' ' +
          (playlist.books?.map(book => book.judul || '').join(' ') || '')
        ).toLowerCase();

        // Exact match scoring
        if (playlist.name?.toLowerCase().includes(query.toLowerCase())) {
          score += 100;
        }
        if (playlist.description?.toLowerCase().includes(query.toLowerCase())) {
          score += 50;
        }

        // Partial match scoring
        searchTerms.forEach(term => {
          if (searchText.includes(term)) {
            score += 10;
          }
        });

        // Book content matching
        const bookMatches = playlist.books?.filter(book =>
          book.judul?.toLowerCase().includes(query.toLowerCase()) ||
          book.pengarang?.toLowerCase().includes(query.toLowerCase())
        ).length || 0;

        score += bookMatches * 5;

        // Engagement boost
        score += (playlist.like_count || 0) * 0.1;
        score += (playlist.view_count || 0) * 0.01;

        return {
          ...playlist,
          _searchScore: score,
          _bookMatches: bookMatches
        };
      });

      // Apply filters
      let filtered = scoredPlaylists.filter(playlist => {
        if (filters.minBooks && (playlist.books?.length || 0) < filters.minBooks) {
          return false;
        }
        if (filters.minLikes && (playlist.like_count || 0) < filters.minLikes) {
          return false;
        }
        if (filters.userId && playlist.created_by !== filters.userId) {
          return false;
        }
        return playlist._searchScore > 0;
      });

      // Sort results
      switch (sortBy) {
        case 'popular':
          filtered.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
          break;
        case 'recent':
          filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        case 'relevance':
        default:
          filtered.sort((a, b) => b._searchScore - a._searchScore);
      }

      // Paginate
      const paginated = filtered.slice(offset, offset + limit);

      return paginated;

    } catch (error) {
      console.error('❌ Error in searchPlaylists:', error);
      throw error;
    }
  },

  /**
   * Search books within all playlists
   */
  searchBooksInPlaylists: async (query, options = {}) => {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = 'relevance',
        filters = {}
      } = options;

      const playlists = await playlistService.getPlaylists({ limit: 1000 });
      
      const allBooks = [];
      const bookMap = new Map(); // Untuk avoid duplicates

      // Collect all unique books from playlists
      playlists.forEach(playlist => {
        playlist.books?.forEach(book => {
          if (!bookMap.has(book.id)) {
            bookMap.set(book.id, {
              ...book,
              _playlists: [],
              _totalPlaylists: 0
            });
          }
          const bookRecord = bookMap.get(book.id);
          bookRecord._playlists.push({
            playlistId: playlist.id,
            playlistName: playlist.name,
            addedAt: book.added_at
          });
          bookRecord._totalPlaylists++;
        });
      });

      const books = Array.from(bookMap.values());

      // Score books based on search relevance
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      const scoredBooks = books.map(book => {
        let score = 0;
        const searchText = (
          (book.judul || '') + ' ' + 
          (book.pengarang || '') + ' ' +
          (book.penerbit || '') + ' ' +
          (book.deskripsi_fisik || '')
        ).toLowerCase();

        // Exact match scoring
        if (book.judul?.toLowerCase().includes(query.toLowerCase())) {
          score += 100;
        }
        if (book.pengarang?.toLowerCase().includes(query.toLowerCase())) {
          score += 80;
        }
        if (book.penerbit?.toLowerCase().includes(query.toLowerCase())) {
          score += 30;
        }

        // Partial match scoring
        searchTerms.forEach(term => {
          if (searchText.includes(term)) {
            score += 15;
          }
        });

        // Popularity boost based on how many playlists include this book
        score += book._totalPlaylists * 10;

        // Year relevance (boost recent books)
        if (book.tahun_terbit) {
          const yearMatch = book.tahun_terbit.match(/\d{4}/);
          if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            if (year > 1900) {
              score += (year - 1900) * 0.1; // Slight boost for newer books
            }
          }
        }

        return {
          ...book,
          _searchScore: score
        };
      });

      // Apply filters
      let filtered = scoredBooks.filter(book => {
        if (filters.yearRange) {
          const yearMatch = book.tahun_terbit?.match(/\d{4}/);
          if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            if (year < filters.yearRange[0] || year > filters.yearRange[1]) {
              return false;
            }
          } else if (filters.yearRange[0] > 1547) { // If no year but filter requires it
            return false;
          }
        }
        
        if (filters.minPlaylists && book._totalPlaylists < filters.minPlaylists) {
          return false;
        }
        
        return book._searchScore > 0;
      });

      // Sort results
      switch (sortBy) {
        case 'popular':
          filtered.sort((a, b) => b._totalPlaylists - a._totalPlaylists);
          break;
        case 'recent':
          // Sort by most recently added to any playlist
          filtered.sort((a, b) => {
            const aLatest = Math.max(...a._playlists.map(p => new Date(p.addedAt)));
            const bLatest = Math.max(...b._playlists.map(p => new Date(p.addedAt)));
            return bLatest - aLatest;
          });
          break;
        case 'year':
          filtered.sort((a, b) => {
            const aYear = parseInt(a.tahun_terbit?.match(/\d{4}/)?.[0] || 0);
            const bYear = parseInt(b.tahun_terbit?.match(/\d{4}/)?.[0] || 0);
            return bYear - aYear;
          });
          break;
        case 'relevance':
        default:
          filtered.sort((a, b) => b._searchScore - a._searchScore);
      }

      // Paginate
      const paginated = filtered.slice(offset, offset + limit);

      return paginated;

    } catch (error) {
      console.error('❌ Error in searchBooksInPlaylists:', error);
      throw error;
    }
  },

  // ========================
  // ADVANCED SEARCH FEATURES
  // ========================

  /**
   * Search within a specific playlist
   */
  searchWithinPlaylist: async (playlistId, query, options = {}) => {
    try {
      const playlist = await playlistService.getPlaylistById(playlistId);
      if (!playlist) {
        throw new Error('Playlist tidak ditemukan');
      }

      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      const scoredBooks = (playlist.books || []).map(book => {
        let score = 0;
        const searchText = (
          (book.judul || '') + ' ' + 
          (book.pengarang || '') + ' ' +
          (book.penerbit || '') + ' ' +
          (book.deskripsi_fisik || '')
        ).toLowerCase();

        // Exact matches
        if (book.judul?.toLowerCase().includes(query.toLowerCase())) {
          score += 100;
        }
        if (book.pengarang?.toLowerCase().includes(query.toLowerCase())) {
          score += 80;
        }

        // Partial matches
        searchTerms.forEach(term => {
          if (searchText.includes(term)) {
            score += 20;
          }
        });

        return {
          ...book,
          _searchScore: score,
          _playlistContext: {
            playlistId: playlist.id,
            playlistName: playlist.name,
            addedAt: book.added_at
          }
        };
      });

      const filtered = scoredBooks
        .filter(book => book._searchScore > 0)
        .sort((a, b) => b._searchScore - a._searchScore);

      const { limit = 20, offset = 0 } = options;
      return filtered.slice(offset, offset + limit);

    } catch (error) {
      console.error('❌ Error in searchWithinPlaylist:', error);
      throw error;
    }
  },

  /**
   * Find playlists that contain a specific book
   */
  findPlaylistsWithBook: async (bookId, options = {}) => {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const playlists = await playlistService.getPlaylists({ limit: 1000 });
      
      const matchingPlaylists = playlists
        .filter(playlist => 
          playlist.books?.some(book => book.id === bookId)
        )
        .map(playlist => ({
          ...playlist,
          _bookContext: playlist.books.find(book => book.id === bookId)
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return matchingPlaylists.slice(offset, offset + limit);

    } catch (error) {
      console.error('❌ Error in findPlaylistsWithBook:', error);
      throw error;
    }
  },

  /**
   * Search by book metadata (advanced filters)
   */
  searchByMetadata: async (filters = {}) => {
    try {
      const {
        author,
        publisher,
        yearRange,
        language,
        limit = 20,
        offset = 0
      } = filters;

      const playlists = await playlistService.getPlaylists({ limit: 1000 });
      
      const allBooks = [];
      const bookMap = new Map();

      // Collect and deduplicate books
      playlists.forEach(playlist => {
        playlist.books?.forEach(book => {
          if (!bookMap.has(book.id)) {
            bookMap.set(book.id, {
              ...book,
              _playlists: [{
                playlistId: playlist.id,
                playlistName: playlist.name
              }],
              _totalPlaylists: 1
            });
          } else {
            const existing = bookMap.get(book.id);
            existing._playlists.push({
              playlistId: playlist.id,
              playlistName: playlist.name
            });
            existing._totalPlaylists++;
          }
        });
      });

      let filteredBooks = Array.from(bookMap.values());

      // Apply filters
      if (author) {
        filteredBooks = filteredBooks.filter(book =>
          book.pengarang?.toLowerCase().includes(author.toLowerCase())
        );
      }

      if (publisher) {
        filteredBooks = filteredBooks.filter(book =>
          book.penerbit?.toLowerCase().includes(publisher.toLowerCase())
        );
      }

      if (yearRange) {
        filteredBooks = filteredBooks.filter(book => {
          const yearMatch = book.tahun_terbit?.match(/\d{4}/);
          if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            return year >= yearRange[0] && year <= yearRange[1];
          }
          return false;
        });
      }

      if (language) {
        filteredBooks = filteredBooks.filter(book => {
          const text = (book.judul + ' ' + book.pengarang).toLowerCase();
          // Simple language detection
          if (language === 'dutch') {
            return text.includes('van ') || text.includes('de ') || text.includes('het ');
          } else if (language === 'english') {
            return text.match(/\b(the|and|of|in|to)\b/);
          } else if (language === 'indonesia') {
            return text.match(/\b(dan|yang|di|dari|untuk)\b/);
          }
          return true;
        });
      }

      // Sort by popularity (number of playlists containing the book)
      filteredBooks.sort((a, b) => b._totalPlaylists - a._totalPlaylists);

      return filteredBooks.slice(offset, offset + limit);

    } catch (error) {
      console.error('❌ Error in searchByMetadata:', error);
      throw error;
    }
  },

  // ========================
  // DISCOVERY & SUGGESTIONS
  // ========================

  /**
   * Get similar playlists based on content
   */
  getSimilarPlaylists: async (playlistId, limit = 5) => {
    try {
      const targetPlaylist = await playlistService.getPlaylistById(playlistId);
      if (!targetPlaylist) {
        throw new Error('Playlist tidak ditemukan');
      }

      const allPlaylists = await playlistService.getPlaylists({ limit: 100 });
      const targetBooks = new Set(targetPlaylist.books?.map(book => book.id) || []);

      const scoredPlaylists = allPlaylists
        .filter(playlist => playlist.id !== playlistId)
        .map(playlist => {
          const playlistBooks = new Set(playlist.books?.map(book => book.id) || []);
          
          // Jaccard similarity coefficient
          const intersection = [...targetBooks].filter(id => playlistBooks.has(id)).length;
          const union = targetBooks.size + playlistBooks.size - intersection;
          const similarity = union > 0 ? intersection / union : 0;

          // Boost by engagement
          const engagementScore = (playlist.like_count || 0) * 0.1 + (playlist.view_count || 0) * 0.01;

          return {
            ...playlist,
            _similarityScore: similarity + engagementScore,
            _commonBooks: intersection
          };
        })
        .filter(playlist => playlist._similarityScore > 0)
        .sort((a, b) => b._similarityScore - a._similarityScore)
        .slice(0, limit);

      return scoredPlaylists;

    } catch (error) {
      console.error('❌ Error in getSimilarPlaylists:', error);
      throw error;
    }
  },

  /**
   * Get recently added books across all playlists
   */
  getRecentlyAddedBooks: async (limit = 10) => {
    try {
      const playlists = await playlistService.getPlaylists({ limit: 1000 });
      
      const allBooks = [];
      const bookMap = new Map();

      // Collect all books with their most recent addition date
      playlists.forEach(playlist => {
        playlist.books?.forEach(book => {
          const addedAt = new Date(book.added_at || playlist.created_at);
          if (!bookMap.has(book.id) || addedAt > new Date(bookMap.get(book.id).added_at)) {
            bookMap.set(book.id, {
              ...book,
              added_at: addedAt.toISOString(),
              _recentPlaylist: {
                id: playlist.id,
                name: playlist.name
              }
            });
          }
        });
      });

      const recentBooks = Array.from(bookMap.values())
        .sort((a, b) => new Date(b.added_at) - new Date(a.added_at))
        .slice(0, limit);

      return recentBooks;

    } catch (error) {
      console.error('❌ Error in getRecentlyAddedBooks:', error);
      throw error;
    }
  },

  // ========================
  // SEARCH UTILITIES
  // ========================

  /**
   * Get search suggestions based on query
   */
  getSearchSuggestions: async (partialQuery, limit = 5) => {
    try {
      if (!partialQuery || partialQuery.length < 2) {
        return [];
      }

      const playlists = await playlistService.getPlaylists({ limit: 100 });
      const query = partialQuery.toLowerCase();

      const suggestions = new Set();

      // Extract suggestions from playlist names
      playlists.forEach(playlist => {
        if (playlist.name?.toLowerCase().includes(query)) {
          const words = playlist.name.split(' ');
          words.forEach(word => {
            if (word.toLowerCase().startsWith(query) && word.length > 2) {
              suggestions.add(word);
            }
          });
        }
      });

      // Extract suggestions from book titles and authors
      playlists.forEach(playlist => {
        playlist.books?.forEach(book => {
          if (book.judul?.toLowerCase().includes(query)) {
            const words = book.judul.split(' ');
            words.forEach(word => {
              if (word.toLowerCase().startsWith(query) && word.length > 2) {
                suggestions.add(word);
              }
            });
          }
          if (book.pengarang?.toLowerCase().includes(query)) {
            suggestions.add(book.pengarang);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);

    } catch (error) {
      console.error('❌ Error in getSearchSuggestions:', error);
      return [];
    }
  },

  /**
   * Get search analytics (popular searches, etc.)
   */
  getSearchAnalytics: async () => {
    try {
      // This would typically connect to a search analytics service
      // For now, return mock data or basic stats
      return {
        totalSearches: 0,
        popularQueries: [],
        searchSuccessRate: 100
      };
    } catch (error) {
      console.error('❌ Error in getSearchAnalytics:', error);
      return {};
    }
  }
};
