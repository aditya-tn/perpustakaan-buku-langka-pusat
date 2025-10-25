// pages/index.js - OPTIMIZED SEARCH WITH CONTEXTUAL SYNONYMS TOGGLE (FIXED FILTERING)
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

// NEW: Helper function untuk extract tahun dari berbagai format
const extractYearFromString = (yearStr) => {
  if (!yearStr) return null;
  
  // Case 1: Exact 4-digit year "1920"
  const exactYearMatch = yearStr.match(/^(\d{4})$/);
  if (exactYearMatch) {
    const year = parseInt(exactYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  // Case 2: Year in brackets "[1920]"
  const bracketYearMatch = yearStr.match(/\[(\d{4})\]/);
  if (bracketYearMatch) {
    const year = parseInt(bracketYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  // Case 3: Range "[1920-1930]" - take first year
  const rangeYearMatch = yearStr.match(/\[(\d{4})-\d{4}\]/);
  if (rangeYearMatch) {
    const year = parseInt(rangeYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  // Case 4: Approximate "[ca. 1920]"
  const approxYearMatch = yearStr.match(/(\d{4})/);
  if (approxYearMatch) {
    const year = parseInt(approxYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  // Case 5: Incomplete "[19-?]" - treat as 1900
  const incompleteMatch = yearStr.match(/\[(\d{2})-\?\]/);
  if (incompleteMatch) {
    const century = incompleteMatch[1];
    return parseInt(century + '00'); // e.g., "[19-?]" -> 1900
  }
  
  return null;
};

// NEW: Synonyms service
const fetchSynonyms = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('search_synonyms')
      .select('term, synonyms, weight, language')
      .or(`term.ilike.%${searchTerm}%,synonyms.cs.{${searchTerm}}`)
      .order('weight', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Synonyms fetch error:', error);
    return [];
  }
};

// NEW: Simple language detection
const detectLanguage = (text) => {
  const indonesianWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu'];
  const dutchWords = ['de', 'het', 'en', 'van', 'tot', 'voor', 'met', 'zijn', 'een'];
  
  const words = text.toLowerCase().split(/\s+/);
  const idCount = words.filter(word => indonesianWords.includes(word)).length;
  const nlCount = words.filter(word => dutchWords.includes(word)).length;
  
  if (nlCount > idCount && nlCount > 1) return 'nl';
  if (idCount > nlCount && idCount > 1) return 'id';
  return 'en'; // default to English
};

// NEW: Enhanced synonyms expansion dengan context awareness
const expandSearchWithSynonyms = async (searchQuery) => {
  const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 1);
  
  if (searchWords.length === 0) return { terms: [searchQuery], synonyms: [] };

  const allSynonyms = [];
  const detectedSynonyms = [];
  const primaryLanguage = detectLanguage(searchQuery);
  
  console.log(`🌐 Detected language: ${primaryLanguage} for query: "${searchQuery}"`);

  // Cari synonyms untuk setiap kata dengan priority berdasarkan bahasa
  for (const word of searchWords) {
    const synonymsData = await fetchSynonyms(word);
    
    synonymsData.forEach(item => {
      // Tambahkan ke detected synonyms untuk display
      item.synonyms.forEach(synonym => {
        if (!detectedSynonyms.includes(synonym) && synonym.toLowerCase() !== word.toLowerCase()) {
          detectedSynonyms.push(synonym);
        }
      });
      
      // Berikan weight berdasarkan bahasa match
      let languageWeight = 1;
      if (item.language === primaryLanguage) languageWeight = 2;
      if (item.language === 'id') languageWeight = 1.5;
      
      // Tambahkan synonyms dengan weight consideration
      item.synonyms.forEach(synonym => {
        for (let i = 0; i < languageWeight * item.weight; i++) {
          allSynonyms.push(synonym);
        }
      });
    });
  }

  // Gabungkan original terms dengan synonyms yang unik
  const uniqueSynonyms = [...new Set(allSynonyms)]
    .filter(synonym => {
      const lowerSynonym = synonym.toLowerCase();
      return !searchWords.some(word => 
        lowerSynonym.includes(word.toLowerCase()) || 
        word.toLowerCase().includes(lowerSynonym)
      );
    })
    .slice(0, 15);

  const expandedTerms = [searchQuery, ...uniqueSynonyms];
  const finalSynonyms = detectedSynonyms.slice(0, 8); // Limit untuk display
  
  console.log('🔤 Expanded search terms:', {
    original: searchQuery,
    synonyms: uniqueSynonyms,
    totalTerms: expandedTerms.length
  });
  
  return { terms: expandedTerms, synonyms: finalSynonyms };
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showStats, setShowStats] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Search Intelligence States
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [searchMethod, setSearchMethod] = useState('')
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [detectedLanguage, setDetectedLanguage] = useState('')
  
  // NEW: Synonyms States
  const [synonymsEnabled, setSynonymsEnabled] = useState(true)
  const [activeSynonyms, setActiveSynonyms] = useState([])
  const [resultsWithoutSynonyms, setResultsWithoutSynonyms] = useState(0)

  // NEW: Search-within-Search dengan Year Slider ONLY
  const [withinSearchTerm, setWithinSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({
    // YEAR SLIDER ONLY - NO MANUAL INPUTS
    tahunRange: [1500, 2024] // [min, max]
  })

  // Refs
  const searchTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  // NEW: Year range constants
  const MIN_YEAR = 1500
  const MAX_YEAR = 2024

  // NEW: Helper untuk count buku dengan tahun valid
  const countValidYears = (books) => {
    return books.filter(book => extractYearFromString(book.tahun_terbit) !== null).length;
  };

  // SMART SEARCH EXECUTION dengan Cache & Synonyms
  const [searchCache, setSearchCache] = useState(new Map());

  // NEW: Toggle synonyms function
  const toggleSynonyms = () => {
    setSynonymsEnabled(prev => !prev);
  };

  // NEW: Check if should show synonyms toggle
  const shouldShowSynonymsToggle = useMemo(() => {
    return synonymsEnabled && 
           activeSynonyms.length > 0 && 
           searchResults.length > resultsWithoutSynonyms &&
           searchResults.length > 0;
  }, [synonymsEnabled, activeSynonyms.length, searchResults.length, resultsWithoutSynonyms]);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load preferences
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    const savedLiveSearch = localStorage.getItem('liveSearchEnabled')
    const savedSynonymsEnabled = localStorage.getItem('synonymsEnabled')
    
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory))
    if (savedLiveSearch !== null) setLiveSearchEnabled(JSON.parse(savedLiveSearch))
    if (savedSynonymsEnabled !== null) setSynonymsEnabled(JSON.parse(savedSynonymsEnabled))
  }, [])

  // Save preferences
  useEffect(() => {
    localStorage.setItem('liveSearchEnabled', JSON.stringify(liveSearchEnabled))
    localStorage.setItem('synonymsEnabled', JSON.stringify(synonymsEnabled))
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory))
    }
  }, [searchHistory, liveSearchEnabled, synonymsEnabled])

  // REAL-TIME SEARCH EFFECT
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchTerm.trim()) {
      if (searchTerm.trim().length === 0) {
        setSearchResults([])
        setShowStats(true)
        // Reset within-search
        setWithinSearchTerm('')
        setActiveFilters({
          tahunRange: [MIN_YEAR, MAX_YEAR]
        })
        setActiveSynonyms([])
        setResultsWithoutSynonyms(0)
      }
      return
    }

    if (!liveSearchEnabled) return

    setIsTyping(true)

    searchTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      await executeSearch(searchTerm)
    }, 800)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, liveSearchEnabled, synonymsEnabled])

  // Reset within-search ketika search utama berubah
  useEffect(() => {
    if (searchResults.length > 0) {
      setWithinSearchTerm('')
      setActiveFilters({
        tahunRange: [MIN_YEAR, MAX_YEAR]
      })
    }
  }, [searchResults])

  // Auto scroll dan hide stats
  useEffect(() => {
    if (searchResults.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentPage, searchResults.length])

  useEffect(() => {
    setShowStats(searchResults.length === 0)
  }, [searchResults])

  // Suggestions effect
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('books')
          .select('judul, pengarang, penerbit, id')
          .or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%`)
          .limit(5) // ✅ Hanya untuk suggestions, biarkan limit

        setSuggestions(data || [])
      } catch (error) {
        console.error('Suggestions error:', error)
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // FIXED: Enhanced Filtered Results dengan Smart Synonyms Filtering
  const getFilteredResults = useCallback(() => {
    let resultsToFilter = searchResults;

    // NEW: Filter out synonyms results jika synonyms dimatikan
    if (!synonymsEnabled && activeSynonyms.length > 0) {
      resultsToFilter = searchResults.filter(book => {
        const lowerJudul = book.judul?.toLowerCase() || '';
        const lowerPengarang = book.pengarang?.toLowerCase() || '';
        const lowerPenerbit = book.penerbit?.toLowerCase() || '';
        
        // FIXED: Cek apakah book match dengan original search term ATAU bagian dari search term
        const searchWords = searchTerm.toLowerCase().split(/\s+/);
        
        const matchesOriginal = searchWords.some(word => 
          lowerJudul.includes(word) ||
          lowerPengarang.includes(word) || 
          lowerPenerbit.includes(word)
        );
        
        // FIXED: Cek apakah book HANYA match dengan synonyms (tidak match dengan original terms)
        const matchesOnlySynonyms = activeSynonyms.some(synonym => {
          const synonymWords = synonym.toLowerCase().split(/\s+/);
          return synonymWords.some(synonymWord => 
            (lowerJudul.includes(synonymWord) ||
             lowerPengarang.includes(synonymWord) ||
             lowerPenerbit.includes(synonymWord)) &&
            // Pastikan tidak ada overlap dengan original search words
            !searchWords.some(originalWord => 
              lowerJudul.includes(originalWord) ||
              lowerPengarang.includes(originalWord) ||
              lowerPenerbit.includes(originalWord)
            )
          );
        });

        return matchesOriginal && !matchesOnlySynonyms;
      });
    }

    if (!withinSearchTerm.trim() && 
        activeFilters.tahunRange[0] === MIN_YEAR && 
        activeFilters.tahunRange[1] === MAX_YEAR) {
      return resultsToFilter
    }

    return resultsToFilter.filter(book => {
      // Filter: Search within text
      if (withinSearchTerm.trim()) {
        const searchLower = withinSearchTerm.toLowerCase()
        const judulMatch = book.judul?.toLowerCase().includes(searchLower) || false
        const pengarangMatch = book.pengarang?.toLowerCase().includes(searchLower) || false
        const penerbitMatch = book.penerbit?.toLowerCase().includes(searchLower) || false
        const deskripsiMatch = book.deskripsi_fisik?.toLowerCase().includes(searchLower) || false
        
        if (!judulMatch && !pengarangMatch && !penerbitMatch && !deskripsiMatch) {
          return false
        }
      }

      // ENHANCED: Year filter untuk handle berbagai format
      if (book.tahun_terbit) {
        const yearStr = book.tahun_terbit.toString().trim();
        const extractedYear = extractYearFromString(yearStr);
        
        if (extractedYear !== null) {
          const [minYear, maxYear] = activeFilters.tahunRange;
          if (extractedYear < minYear || extractedYear > maxYear) {
            return false;
          }
        } else {
          // Skip books dengan format tahun tidak valid untuk filtering
          if (activeFilters.tahunRange[0] !== MIN_YEAR || activeFilters.tahunRange[1] !== MAX_YEAR) {
            return false;
          }
        }
      } else {
        // Book tanpa tahun_terbit, skip jika filter tahun aktif
        if (activeFilters.tahunRange[0] !== MIN_YEAR || activeFilters.tahunRange[1] !== MAX_YEAR) {
          return false;
        }
      }

      return true
    })
  }, [searchResults, withinSearchTerm, activeFilters.tahunRange, synonymsEnabled, activeSynonyms, searchTerm])

  // Get current filtered results dengan useMemo untuk optimasi
  const filteredResults = useMemo(() => getFilteredResults(), [getFilteredResults])

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return
    
    // Reset active synonyms
    setActiveSynonyms([]);
    setResultsWithoutSynonyms(0);
    
    // Check cache first
    const cacheKey = `${searchQuery.toLowerCase().trim()}_${synonymsEnabled}`;
    if (searchCache.has(cacheKey)) {
      const cachedData = searchCache.get(cacheKey);
      setSearchResults(cachedData.results);
      setActiveSynonyms(cachedData.synonyms || []);
      setResultsWithoutSynonyms(cachedData.withoutSynonyms || 0);
      setCurrentPage(1);
      setSearchMethod(cachedData.method);
      return;
    }
    
    // Detect language
    const lang = detectLanguage(searchQuery);
    setDetectedLanguage(lang);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    setLoading(true)
    setCurrentPage(1)

    try {
      const startTime = performance.now();
      const searchData = await performSmartSearch(searchQuery)
      const endTime = performance.now();
      
      setSearchResults(searchData.results)
      setActiveSynonyms(searchData.synonyms || [])
      setResultsWithoutSynonyms(searchData.withoutSynonyms || 0)
      
      // Update cache
      setSearchCache(prev => {
        const newCache = new Map(prev);
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        newCache.set(cacheKey, {
          results: searchData.results,
          synonyms: searchData.synonyms,
          withoutSynonyms: searchData.withoutSynonyms,
          method: searchData.method
        });
        return newCache;
      });
      
      // Log performance
      console.log(`🚀 Search "${searchQuery}" took ${(endTime - startTime).toFixed(2)}ms, found ${searchData.results.length} results`);
      
      if (searchData.results.length > 0) {
        saveToSearchHistory(searchQuery, searchData.results.length)
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err)
        setSearchResults([])
        setActiveSynonyms([])
        setResultsWithoutSynonyms(0)
      }
    } finally {
      setLoading(false)
    }
  }

  // Smart Search Algorithm - UNLIMITED RESULTS dengan Synonyms Support
  const performSmartSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return { results: [], synonyms: [], withoutSynonyms: 0, method: 'Empty' }
    
    const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 0);
    
    try {
      let expandedTerms = [searchQuery];
      let detectedSynonyms = [];
      let withoutSynonymsCount = 0;

      if (synonymsEnabled) {
        // Dapatkan expanded terms dengan synonyms
        const expansionResult = await expandSearchWithSynonyms(searchQuery);
        expandedTerms = expansionResult.terms;
        detectedSynonyms = expansionResult.synonyms;
        
        console.log('🔤 Expanded search terms:', expandedTerms);
        console.log('📝 Detected synonyms:', detectedSynonyms);
      }

      // Strategy 1: Exact matches dengan original query (untuk hitung without synonyms)
      const exactMatchQuery = supabase
        .from('books')
        .select('*')
        .or(`judul.ilike.%${searchQuery}%,pengarang.ilike.%${searchQuery}%,penerbit.ilike.%${searchQuery}%`);

      const { data: exactMatches, error: exactError } = await exactMatchQuery;
      if (exactError) throw exactError;

      withoutSynonymsCount = exactMatches?.length || 0;

      // Jika synonyms disabled, hanya gunakan exact matches
      if (!synonymsEnabled) {
        const results = rankSearchResults(exactMatches || [], searchWords, searchQuery, []);
        return { 
          results, 
          synonyms: [], 
          withoutSynonyms: results.length, 
          method: 'Search (No Synonyms)' 
        };
      }

      // Strategy 2: Search dengan semua expanded terms (synonyms) - hanya jika enabled
      let synonymResults = [];
      if (synonymsEnabled && detectedSynonyms.length > 0) {
        const synonymPromises = expandedTerms.map(term => 
          supabase
            .from('books')
            .select('*')
            .or(`judul.ilike.%${term}%,pengarang.ilike.%${term}%,penerbit.ilike.%${term}%`)
        );
        synonymResults = await Promise.all(synonymPromises);
      }

      // Combine semua results
      const allResults = [...(exactMatches || [])];
      const seenIds = new Set(exactMatches?.map(item => item.id) || []);
      
      if (synonymsEnabled && detectedSynonyms.length > 0) {
        synonymResults.forEach(({ data }) => {
          if (data) {
            data.forEach(item => {
              if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                allResults.push(item);
              }
            });
          }
        });
      }

      // Juga search per kata
      const wordMatchPromises = searchWords.map(word => 
        supabase
          .from('books')
          .select('*')
          .or(`judul.ilike.%${word}%,pengarang.ilike.%${word}%,penerbit.ilike.%${word}%`)
      );

      const wordResults = await Promise.all(wordMatchPromises);
      wordResults.forEach(({ data }) => {
        if (data) {
          data.forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allResults.push(item);
            }
          });
        }
      });

      const method = synonymsEnabled && detectedSynonyms.length > 0 ? 
        'Smart Search + Synonyms' : 'Smart Search';
      
      const rankedResults = rankSearchResults(allResults, searchWords, searchQuery, expandedTerms);
      
      return { 
        results: rankedResults, 
        synonyms: detectedSynonyms, 
        withoutSynonyms: withoutSynonymsCount,
        method 
      };

    } catch (error) {
      console.error('Smart search error:', error);
      const basicResults = await performBasicSearch(searchQuery);
      return { 
        results: basicResults, 
        synonyms: [], 
        withoutSynonyms: basicResults.length,
        method: 'Basic Search' 
      };
    }
  }

  // Enhanced Relevance Scoring dengan Synonyms Awareness
  const rankSearchResults = (results, searchWords, originalQuery, expandedTerms = []) => {
    const lowerQuery = originalQuery.toLowerCase();
    
    const scoredResults = results.map(book => {
      let score = 0;
      const lowerJudul = book.judul?.toLowerCase() || '';
      const lowerPengarang = book.pengarang?.toLowerCase() || '';
      const lowerPenerbit = book.penerbit?.toLowerCase() || '';
      
      // Exact matches get highest priority
      if (lowerJudul === lowerQuery) score += 200;
      if (lowerPengarang === lowerQuery) score += 150;
      
      // Partial matches dengan original query
      if (lowerJudul.includes(lowerQuery)) score += 100;
      if (lowerPengarang.includes(lowerQuery)) score += 80;
      if (lowerPenerbit.includes(lowerQuery)) score += 60;
      
      // Word-by-word matching
      searchWords.forEach(word => {
        const lowerWord = word.toLowerCase();
        
        // Title matches (most important)
        if (lowerJudul.includes(lowerWord)) {
          score += 40;
          // Bonus for word at beginning of title
          if (lowerJudul.startsWith(lowerWord)) score += 20;
        }
        
        // Author matches
        if (lowerPengarang.includes(lowerWord)) score += 25;
        
        // Publisher matches
        if (lowerPenerbit.includes(lowerWord)) score += 15;
      });
      
      // Synonyms matches (sedikit lebih rendah priority)
      expandedTerms.forEach(term => {
        if (term.toLowerCase() !== lowerQuery) {
          const lowerTerm = term.toLowerCase();
          if (lowerJudul.includes(lowerTerm)) score += 15;
          if (lowerPengarang.includes(lowerTerm)) score += 10;
          if (lowerPenerbit.includes(lowerTerm)) score += 8;
        }
      });
      
      // Quality bonuses
      if (book.judul && book.judul.length < 60) score += 10;
      if (book.tahun_terbit && extractYearFromString(book.tahun_terbit) > 1900) score += 5;
      
      return { ...book, _relevanceScore: score };
    });
    
    // Remove duplicates and sort
    const uniqueResults = scoredResults.filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    );
    
    return uniqueResults.sort((a, b) => {
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore;
      }
      return (a.judul || '').localeCompare(b.judul || '');
    });
  };

  // Basic search fallback - UNLIMITED RESULTS
  const performBasicSearch = async (searchQuery) => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`judul.ilike.%${searchQuery}%,pengarang.ilike.%${searchQuery}%,penerbit.ilike.%${searchQuery}%`)

    if (error) throw error;
    return data || [];
  }

  // Save to search history
  const saveToSearchHistory = (term, resultsCount) => {
    const newSearch = {
      term,
      resultsCount,
      timestamp: new Date().toISOString(),
      id: Date.now()
    }
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.term !== term)
      return [newSearch, ...filtered.slice(0, 9)]
    })
  }

  // Manual search handler
  const handleManualSearch = async (e) => {
    if (e) e.preventDefault()
    
    if (!searchTerm.trim()) return

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    await executeSearch(searchTerm)
    setShowSuggestions(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.judul)
    setShowSuggestions(false)
  }

  // Handle search history click
  const handleHistoryClick = (historyItem) => {
    setSearchTerm(historyItem.term)
  }

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  // Toggle live search
  const toggleLiveSearch = () => {
    setLiveSearchEnabled(prev => !prev)
  }

  // Clear current search
  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowStats(true)
    setShowSuggestions(false)
    setWithinSearchTerm('')
    setActiveSynonyms([])
    setResultsWithoutSynonyms(0)
    setActiveFilters({
      tahunRange: [MIN_YEAR, MAX_YEAR]
    })
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  // NEW: Clear within-search filters
  const clearWithinSearch = () => {
    setWithinSearchTerm('')
    setActiveFilters({
      tahunRange: [MIN_YEAR, MAX_YEAR]
    })
  }

  // NEW: Update year range dari slider
  const updateYearRange = (newRange) => {
    setActiveFilters(prev => ({
      ...prev,
      tahunRange: newRange
    }))
    setCurrentPage(1)
  }

  const popularSearches = [
    'sejarah indonesia', 'sastra jawa', 'naskah kuno', 'budaya nusantara',
    'colonial history', 'manuskrip', 'sastra melayu', 'sejarah islam'
  ]

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredResults.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  // NEW: Check if any within-search filters are active
  const isWithinSearchActive = withinSearchTerm.trim() || 
    activeFilters.tahunRange[0] !== MIN_YEAR || 
    activeFilters.tahunRange[1] !== MAX_YEAR ||
    (shouldShowSynonymsToggle && !synonymsEnabled)

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Temukan khazanah literatur langka Indonesia dari koleksi Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2.5rem 1rem' : '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Memori Literasi Nusantara
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            marginBottom: isMobile ? '2rem' : '2.5rem',
            opacity: 0.9,
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            85.000+ warisan budaya di layanan buku langka - Perpustakaan Nasional RI
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleManualSearch} style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            position: 'relative'
          }}>
            {/* Search Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={toggleLiveSearch}
                  style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: liveSearchEnabled ? '#48bb78' : '#e2e8f0',
                    color: liveSearchEnabled ? 'white' : '#4a5568',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span style={{ fontSize: '0.8rem' }}>
                    {liveSearchEnabled ? '🔴' : '⚪'}
                  </span>
                  Live Search
                </button>

                {(loading || isTyping) && (
                  <div style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isTyping ? '#f6e05e' : '#4299e1',
                      animation: 'pulse 1.5s infinite'
                    }} />
                    {isTyping ? 'Mengetik...' : 'Mencari...'}
                  </div>
                )}
              </div>

              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Hapus
                </button>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.5rem' : '0',
              borderRadius: isMobile ? '8px' : '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={
                    liveSearchEnabled 
                      ? "Ketik untuk mencari secara real-time..." 
                      : "Cari judul, pengarang, atau tahun terbit..."
                  }
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
                    border: 'none',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    outline: 'none'
                  }}
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0 || searchTerm.length >= 2) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {/* Recent Searches */}
                    {searchHistory.length > 0 && searchTerm.length < 2 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#718096',
                          borderBottom: '1px solid #f7fafc',
                          backgroundColor: '#f7fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>🔍 Pencarian Terakhir</span>
                          <button
                            onClick={clearSearchHistory}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#718096',
                              cursor: 'pointer',
                              fontSize: '0.7rem'
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                        {searchHistory.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleHistoryClick(item)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f7fafc',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <span>{item.term}</span>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              color: '#718096',
                              backgroundColor: '#e2e8f0',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '12px'
                            }}>
                              {item.resultsCount} hasil
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Search Suggestions */}
                    {suggestions.length > 0 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#718096',
                          borderBottom: '1px solid #f7fafc',
                          backgroundColor: '#f7fafc'
                        }}>
                          💡 Saran Pencarian
                        </div>
                        {suggestions.map((item, index) => (
                          <div
                            key={`${item.id}-${index}`}
                            onClick={() => handleSuggestionClick(item)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f7fafc',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>
                              {item.judul}
                            </div>
                            {item.pengarang && (
                              <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                                oleh {item.pengarang}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {/* Popular Searches */}
                    {searchTerm.length < 2 && (
                      <>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#718096',
                          borderBottom: '1px solid #f7fafc',
                          backgroundColor: '#f7fafc'
                        }}>
                          🔥 Pencarian Populer
                        </div>
                        {popularSearches.map((term, index) => (
                          <div
                            key={index}
                            onClick={() => setSearchTerm(term)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f7fafc',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            {term}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Manual Search Button */}
              {!liveSearchEnabled && (
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#f56565',
                    color: 'white',
                    padding: isMobile ? '1rem 1.5rem' : '0 2.5rem',
                    border: 'none',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minWidth: isMobile ? 'auto' : '120px',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? '🔍' : 'Cari'}
                </button>
              )}
            </div>

            {/* Live Search Status */}
            {liveSearchEnabled && searchTerm && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                justifyContent: 'center'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isTyping ? '#f6e05e' : loading ? '#4299e1' : '#48bb78',
                  animation: (isTyping || loading) ? 'pulse 1.5s infinite' : 'none'
                }} />
                {isTyping ? 'Mengetik...' : loading ? 'Mencari...' : 'Live search aktif'}
              </div>
            )}
          </form>

          {/* UPDATE: Search info dengan synonyms status */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              display: 'inline-block'
            }}>
              🚀 {searchMethod} • {filteredResults.length} hasil relevan
              {liveSearchEnabled && ' • 🔴 Live'} 
              • 📊 Index Optimized
              {shouldShowSynonymsToggle && (
                synonymsEnabled ? ' • 🌐 Synonyms ON' : ' • 🔤 Synonyms OFF'
              )}
              {detectedLanguage && ` • ${detectedLanguage.toUpperCase()}`}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {showStats && (
        <section style={{
          backgroundColor: 'white',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '2rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>85K+</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Koleksi Buku</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>200+</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Tahun Sejarah</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>50+</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Bahasa</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4a5568' }}>24/7</div>
              <div style={{ color: '#718096', fontWeight: '500' }}>Akses Digital</div>
            </div>
          </div>
        </section>
      )}

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <section style={{ 
          maxWidth: '1400px', 
          margin: isMobile ? '2rem auto' : '3rem auto',
          padding: isMobile ? '0 1rem' : '0 2rem'
        }}>
          {/* NEW: Improved Search-within-Search Panel dengan Year Slider & Contextual Synonyms Toggle */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0'
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
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#2d3748',
                margin: 0
              }}>
                🔎 Filter Hasil Pencarian
              </h3>
              
              {isWithinSearchActive && (
                <button
                  onClick={clearWithinSearch}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f7fafc',
                    color: '#718096',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}
                >
                  ✕ Hapus Filter
                </button>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
              gap: '2rem',
              alignItems: 'start'
            }}>
              {/* Left Column: Text Search */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '0.5rem'
                }}>
                  Cari dalam hasil:
                </label>
                <input
                  type="text"
                  value={withinSearchTerm}
                  onChange={(e) => setWithinSearchTerm(e.target.value)}
                  placeholder="Filter judul, pengarang, penerbit..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />

                {/* NEW: Contextual Synonyms Toggle - Hanya muncul ketika relevan */}
                {shouldShowSynonymsToggle && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#4a5568',
                      marginBottom: '0.5rem'
                    }}>
                      Fitur Pencarian:
                    </label>
                    <button
                      onClick={toggleSynonyms}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: synonymsEnabled ? '#e6fffa' : '#fffaf0',
                        color: synonymsEnabled ? '#234e52' : '#744210',
                        border: `1px solid ${synonymsEnabled ? '#81e6d9' : '#fbd38d'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>{synonymsEnabled ? '🌐' : '🔤'}</span>
                      {synonymsEnabled ? 'Synonyms: ON' : 'Synonyms: OFF'}
                      <span style={{ 
                        fontSize: '0.7rem',
                        backgroundColor: synonymsEnabled ? '#38b2ac' : '#ed8936',
                        color: 'white',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '8px',
                        marginLeft: '0.5rem'
                      }}>
                        {synonymsEnabled ? '+' + (searchResults.length - resultsWithoutSynonyms) : 'filtered'}
                      </span>
                    </button>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#718096',
                      marginTop: '0.25rem',
                      textAlign: 'center'
                    }}>
                      {synonymsEnabled ? 
                        `+${searchResults.length - resultsWithoutSynonyms} hasil dari synonyms` : 
                        'Hanya menampilkan hasil exact match'
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Year Slider ONLY - NO MANUAL INPUTS */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#4a5568',
                  marginBottom: '1rem'
                }}>
                  Rentang Tahun Terbit:
                </label>
                
                {/* Year Range Display */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#4a5568'
                }}>
                  <span>{activeFilters.tahunRange[0]}</span>
                  <span style={{ 
                    backgroundColor: '#4299e1',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {activeFilters.tahunRange[1] - activeFilters.tahunRange[0]} tahun
                  </span>
                  <span>{activeFilters.tahunRange[1]}</span>
                </div>

                {/* Custom Slider */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <div style={{
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    position: 'relative'
                  }}>
                    {/* Active Range */}
                    <div style={{
                      position: 'absolute',
                      height: '100%',
                      backgroundColor: '#4299e1',
                      borderRadius: '3px',
                      left: `${((activeFilters.tahunRange[0] - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
                      right: `${100 - ((activeFilters.tahunRange[1] - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`
                    }} />
                    
                    {/* Min Handle */}
                    <input
                      type="range"
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      value={activeFilters.tahunRange[0]}
                      onChange={(e) => updateYearRange([
                        parseInt(e.target.value),
                        activeFilters.tahunRange[1]
                      ])}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        top: '-6px',
                        height: '18px',
                        appearance: 'none',
                        background: 'transparent',
                        pointerEvents: 'none',
                        zIndex: 2
                      }}
                    />
                    
                    {/* Max Handle */}
                    <input
                      type="range"
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      value={activeFilters.tahunRange[1]}
                      onChange={(e) => updateYearRange([
                        activeFilters.tahunRange[0],
                        parseInt(e.target.value)
                      ])}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        top: '-6px',
                        height: '18px',
                        appearance: 'none',
                        background: 'transparent',
                        pointerEvents: 'none',
                        zIndex: 2
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* UPDATE: Filter Status dengan Info Tahun Valid & Synonyms */}
            {isWithinSearchActive && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#e6fffa',
                border: '1px solid #81e6d9',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#234e52'
              }}>
                🔍 Filter aktif: 
                {withinSearchTerm && ` Teks: "${withinSearchTerm}"`}
                {(activeFilters.tahunRange[0] !== MIN_YEAR || activeFilters.tahunRange[1] !== MAX_YEAR) && 
                  ` Tahun: ${activeFilters.tahunRange[0]} - ${activeFilters.tahunRange[1]}`}
                {shouldShowSynonymsToggle && !synonymsEnabled && ` • Synonyms: OFF`}
                {` • ${filteredResults.length} hasil`}
                {shouldShowSynonymsToggle && synonymsEnabled && (
                  <span> • 🌐 +{searchResults.length - resultsWithoutSynonyms} dari synonyms</span>
                )}
                {` • 📊 ${countValidYears(filteredResults)} buku dengan tahun valid`}
              </div>
            )}
          </div>

          {/* UPDATE: Results Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div>
              <h3 style={{ 
                fontSize: isMobile ? '1.5rem' : '1.75rem', 
                fontWeight: '700',
                color: '#2d3748',
                margin: 0
              }}>
                Hasil Pencarian
              </h3>
              <p style={{ 
                color: '#718096',
                margin: '0.5rem 0 0 0',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {isWithinSearchActive ? (
                  <>
                    <strong>{filteredResults.length}</strong> dari <strong>{searchResults.length}</strong> buku 
                    ditemukan {shouldShowSynonymsToggle && synonymsEnabled ? 'dengan synonyms' : 'untuk'} 
                    "<strong>{searchTerm}</strong>"
                    {withinSearchTerm && ` + filter: "${withinSearchTerm}"`}
                    {(activeFilters.tahunRange[0] !== MIN_YEAR || activeFilters.tahunRange[1] !== MAX_YEAR) && 
                      ` + tahun: ${activeFilters.tahunRange[0]}-${activeFilters.tahunRange[1]}`}
                    {shouldShowSynonymsToggle && !synonymsEnabled && ` + synonyms: OFF`}
                  </>
                ) : (
                  <>
                    {filteredResults.length} buku ditemukan {shouldShowSynonymsToggle && synonymsEnabled ? 'dengan synonyms' : 'untuk'} 
                    "<strong>{searchTerm}</strong>"
                    {shouldShowSynonymsToggle && synonymsEnabled && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#4299e1',
                        fontWeight: '600',
                        marginLeft: '0.5rem'
                      }}>
                        (+{searchResults.length - resultsWithoutSynonyms} dari synonyms)
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                fontSize: isMobile ? '0.8rem' : '0.9rem', 
                color: '#4a5568', 
                fontWeight: '500' 
              }}>
                Tampilkan:
              </span>
              <select 
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  outline: 'none'
                }}
              >
                <option value={20}>20 per halaman</option>
                <option value={50}>50 per halaman</option>
                <option value={100}>100 per halaman</option>
              </select>
            </div>
          </div>

          {/* Book Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '3rem'
          }}>
            {currentItems.map((book) => (
              <div key={book.id} style={{
                backgroundColor: 'white',
                padding: isMobile ? '1.25rem' : '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}>
                {/* Relevance Indicator */}
                {book._relevanceScore > 50 && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#48bb78',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    🔥 Relevan
                  </div>
                )}
                
                <h4 style={{ 
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '0.75rem',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  lineHeight: '1.4'
                }}>
                  {book.judul}
                </h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    color: '#4a5568', 
                    marginBottom: '0.25rem' 
                  }}>
                    <strong>Pengarang:</strong> {book.pengarang || 'Tidak diketahui'}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    color: '#4a5568', 
                    marginBottom: '0.25rem' 
                  }}>
                    <strong>Tahun:</strong> 
                    <span style={{
                      backgroundColor: extractYearFromString(book.tahun_terbit) ? '#f0fff4' : '#fffaf0',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '4px',
                      marginLeft: '0.3rem',
                      fontFamily: 'monospace'
                    }}>
                      {book.tahun_terbit || 'Tidak diketahui'}
                      {!extractYearFromString(book.tahun_terbit) && book.tahun_terbit && ' ⚠️'}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    color: '#4a5568' 
                  }}>
                    <strong>Penerbit:</strong> {book.penerbit || 'Tidak diketahui'}
                  </div>
                </div>

                {book.deskripsi_fisik && (
                  <p style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.85rem', 
                    color: '#718096', 
                    marginTop: '0.75rem',
                    lineHeight: '1.5',
                    fontStyle: 'italic'
                  }}>
                    {book.deskripsi_fisik}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  marginTop: '1.25rem', 
                  display: 'flex', 
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  {book.lihat_opac && book.lihat_opac !== 'null' && (
                    <a 
                      href={book.lihat_opac}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#4299e1',
                        color: 'white',
                        padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        fontWeight: '500'
                      }}
                    >
                      📖 Lihat OPAC
                    </a>
                  )}

                  {book.link_pesan_koleksi && book.link_pesan_koleksi !== 'null' && (
                    <a 
                      href={book.link_pesan_koleksi}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#48bb78',
                        color: 'white',
                        padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        fontWeight: '500'
                      }}
                    >
                      📥 Pesan Koleksi
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No Filtered Results Message */}
          {filteredResults.length === 0 && isWithinSearchActive && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              color: '#718096'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h4 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>
                Tidak ada hasil untuk filter ini
              </h4>
              <p>Coba ubah kriteria filter atau <button 
                onClick={clearWithinSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4299e1',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                hapus filter
              </button> untuk melihat semua hasil.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && filteredResults.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '3rem',
              flexWrap: 'wrap'
            }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber = i + 1
                if (totalPages > 5 && currentPage > 3) {
                  pageNumber = currentPage - 2 + i
                }
                if (pageNumber > totalPages) return null

                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: currentPage === pageNumber ? '#4299e1' : 'white',
                      color: currentPage === pageNumber ? 'white' : '#4a5568',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        /* Custom Slider Styles */
        input[type="range"] {
          -webkit-appearance: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4299e1;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          pointer-events: auto;
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: '50%';
          background: #4299e1;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          pointer-events: auto;
        }
      `}</style>
    </Layout>
  )
}
