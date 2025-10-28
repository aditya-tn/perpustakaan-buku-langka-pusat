// pages/index.js - QUICK FIX FOR BETTER RANKING
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

// Helper function untuk extract tahun dari berbagai format
const extractYearFromString = (yearStr) => {
  if (!yearStr) return null;
  
  const exactYearMatch = yearStr.match(/^(\d{4})$/);
  if (exactYearMatch) {
    const year = parseInt(exactYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const bracketYearMatch = yearStr.match(/\[(\d{4})\]/);
  if (bracketYearMatch) {
    const year = parseInt(bracketYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const rangeYearMatch = yearStr.match(/\[(\d{4})-\d{4}\]/);
  if (rangeYearMatch) {
    const year = parseInt(rangeYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const approxYearMatch = yearStr.match(/(\d{4})/);
  if (approxYearMatch) {
    const year = parseInt(approxYearMatch[1]);
    return (year >= 1000 && year <= 2999) ? year : null;
  }
  
  const incompleteMatch = yearStr.match(/\[(\d{2})-\?\]/);
  if (incompleteMatch) {
    const century = incompleteMatch[1];
    return parseInt(century + '00');
  }
  
  return null;
};

// Synonyms service
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

// Simple language detection
const detectLanguage = (text) => {
  const indonesianWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu'];
  const dutchWords = ['de', 'het', 'en', 'van', 'tot', 'voor', 'met', 'zijn', 'een'];
  
  const words = text.toLowerCase().split(/\s+/);
  const idCount = words.filter(word => indonesianWords.includes(word)).length;
  const nlCount = words.filter(word => dutchWords.includes(word)).length;
  
  if (nlCount > idCount && nlCount > 1) return 'nl';
  if (idCount > nlCount && idCount > 1) return 'id';
  return 'en';
};

// Enhanced synonyms expansion dengan context awareness
const expandSearchWithSynonyms = async (searchQuery) => {
  const searchWords = searchQuery.trim().split(/\s+/).filter(word => word.length > 1);
  
  if (searchWords.length === 0) return { terms: [searchQuery], synonyms: [] };

  const allSynonyms = [];
  const detectedSynonyms = [];
  const primaryLanguage = detectLanguage(searchQuery);

  for (const word of searchWords) {
    const synonymsData = await fetchSynonyms(word);
    
    synonymsData.forEach(item => {
      const relevantSynonyms = item.synonyms.filter(synonym => 
        synonym.toLowerCase() !== word.toLowerCase() &&
        !searchWords.some(searchWord => 
          synonym.toLowerCase().includes(searchWord.toLowerCase()) ||
          searchWord.toLowerCase().includes(synonym.toLowerCase())
        )
      );
      
      relevantSynonyms.forEach(synonym => {
        if (!detectedSynonyms.includes(synonym)) {
          detectedSynonyms.push(synonym);
        }
      });

      let languageWeight = item.language === primaryLanguage ? 2 : 1;
      if (item.language === 'id') languageWeight = 1.5;
      
      relevantSynonyms.forEach(synonym => {
        for (let i = 0; i < languageWeight * item.weight; i++) {
          allSynonyms.push(synonym);
        }
      });
    });
  }

  const uniqueSynonyms = [...new Set(allSynonyms)].slice(0, 6);
  const expandedTerms = [searchQuery, ...uniqueSynonyms];
  const finalSynonyms = detectedSynonyms.slice(0, 4);
  
  return { terms: expandedTerms, synonyms: finalSynonyms };
};

// Smart Title-Author Parsing
const parseTitleAndAuthor = (judul) => {
  if (!judul) return { title: '', author: null };
  
  // Pattern untuk "Judul /Pengarang" 
  const slashMatch = judul.match(/^(.*?)\s*\/([^\/]+)$/);
  if (slashMatch) {
    return {
      title: slashMatch[1].trim(),
      author: slashMatch[2].trim()
    };
  }
  
  return { title: judul, author: null };
};

// STRICT RANKING - hanya prioritze exact matches
const strictRanking = (results, searchQuery) => {
  const searchLower = searchQuery.toLowerCase();
  const normalizedSearch = searchLower.replace(/[.,\/]/g, ' ').replace(/\s+/g, ' ').trim();
  
  return results.map(book => {
    let score = 0;
    const { title: bookTitle, author: bookAuthor } = parseTitleAndAuthor(book.judul);
    
    const titleLower = bookTitle.toLowerCase();
    const normalizedTitle = titleLower.replace(/[.,\/]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 🚨 CRITICAL: Exact match gets HUGE bonus
    if (normalizedTitle === normalizedSearch) {
      score += 10000; // Massive priority for exact match
    }
    
    // Title contains entire query (with symbols)
    if (titleLower.includes(searchLower)) {
      score += 5000; // High priority for contains
    }
    
    // Author exact match
    if (bookAuthor) {
      const authorLower = bookAuthor.toLowerCase();
      const normalizedAuthor = authorLower.replace(/[.,\/]/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (normalizedAuthor.includes(normalizedSearch)) {
        score += 3000; // High priority for author match
      }
    }
    
    // Partial matches dengan requirements ketat
    const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 3);
    const titleWords = normalizedTitle.split(/\s+/);
    
    let matchedWords = 0;
    let importantWordsMatched = 0;
    
    searchWords.forEach((word, index) => {
      if (titleWords.some(tw => tw === word)) { // 🔥 EXACT word match, bukan includes
        matchedWords++;
        score += 200; // Base score for exact word match
        
        // Bonus untuk kata penting (panjang) dan di awal
        if (word.length > 5) importantWordsMatched += 100;
        if (index < 2) score += 50;
      } else if (titleWords.some(tw => tw.includes(word))) {
        // Partial match gets much lower score
        score += 20;
        matchedWords++; // Count partial matches too
      }
    });
    
    score += importantWordsMatched;
    
    // 🚨 COMPLETENESS REQUIREMENT: Minimal 60% kata harus match
    const matchRatio = matchedWords / Math.max(searchWords.length, 1);
    if (matchRatio < 0.6 && score < 1000) {
      score -= 500; // Heavy penalty for incomplete matches yang tidak exact
    }
    
    // Bonus untuk match yang lengkap
    if (matchRatio > 0.8) score += 800;
    if (matchRatio === 1) score += 1500;
    
    // Bonus untuk judul yang lebih pendek (lebih likely exact match)
    if (bookTitle.length < 100) score += 100;
    if (bookTitle.length < 50) score += 200;
    
    return { 
      ...book, 
      _relevanceScore: score,
      _matchedWords: matchedWords,
      _matchRatio: matchRatio,
      _parsedTitle: bookTitle,
      _parsedAuthor: bookAuthor
    };
    
  })
  .filter(book => book._relevanceScore > 300) // 🚨 FILTER OUT low relevance results
  .sort((a, b) => {
    // Priority: score > match ratio > judul length
    if (b._relevanceScore !== a._relevanceScore) {
      return b._relevanceScore - a._relevanceScore;
    }
    if (b._matchRatio !== a._matchRatio) {
      return b._matchRatio - a._matchRatio;
    }
    return (a.judul || '').length - (b.judul || '').length;
  });
};

// STRICT SYMBOL-AWARE SEARCH
const performStrictSearch = async (searchQuery) => {
  const searchWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Build STRICT queries - prioritze exact matches
  const queries = [];
  
  // STRATEGY 1: Exact phrase matching (highest priority)
  queries.push(`judul.ilike.%${searchQuery}%`);
  
  // STRATEGY 2: Symbol-normalized exact matching
  const symbolNormalized = searchQuery.toLowerCase().replace(/[.,\/]/g, '%');
  queries.push(`judul.ilike.%${symbolNormalized}%`);
  
  // STRATEGY 3: Author search
  queries.push(`pengarang.ilike.%${searchQuery}%`);
  
  // STRATEGY 4: Limited word matching - hanya kata kunci utama
  if (searchWords.length > 0) {
    // Ambil maksimal 3 kata terpenting (yang paling panjang)
    const importantWords = searchWords
      .sort((a, b) => b.length - a.length)
      .slice(0, 3);
    
    // Gabungkan kata-kata penting
    importantWords.forEach(word => {
      if (word.length > 4) { // Only significant words
        queries.push(`judul.ilike.%${word}%`);
      }
    });
  }
  
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(queries.join(','))
      .limit(80); // Moderate limit
    
    if (error) throw error;
    
    // Apply STRICT ranking
    return strictRanking(data || [], searchQuery);
  } catch (error) {
    console.error('Strict search error:', error);
    return [];
  }
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [originalSearchResults, setOriginalSearchResults] = useState([])
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

  // Synonyms Filter States
  const [synonymsEnabled, setSynonymsEnabled] = useState(true)
  const [activeSynonyms, setActiveSynonyms] = useState([])

  // Search-within-Search dengan Year Slider ONLY
  const [withinSearchTerm, setWithinSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({
    tahunRange: [1500, 2024]
  })

  // Refs
  const searchTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Constants
  const MIN_YEAR = 1500
  const MAX_YEAR = 2024

  // Helper untuk count buku dengan tahun valid
  const countValidYears = (books) => {
    return books.filter(book => extractYearFromString(book.tahun_terbit) !== null).length;
  };

  // Clean Mode State
  const [cleanMode, setCleanMode] = useState(false)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('searchHistory')
      const savedLiveSearch = localStorage.getItem('liveSearchEnabled')
      const savedSynonymsEnabled = localStorage.getItem('synonymsEnabled')
      
      if (savedHistory) setSearchHistory(JSON.parse(savedHistory))
      if (savedLiveSearch !== null) setLiveSearchEnabled(JSON.parse(savedLiveSearch))
      
      if (savedSynonymsEnabled !== null) {
        try {
          setSynonymsEnabled(JSON.parse(savedSynonymsEnabled))
        } catch (error) {
          setSynonymsEnabled(true)
        }
      } else {
        setSynonymsEnabled(true)
      }
    }
  }, [])

  // Save preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('liveSearchEnabled', JSON.stringify(liveSearchEnabled))
      localStorage.setItem('synonymsEnabled', JSON.stringify(synonymsEnabled))
      if (searchHistory.length > 0) {
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory))
      }
    }
  }, [searchHistory, liveSearchEnabled, synonymsEnabled])
  
  // Clean Mode Effect
  useEffect(() => {
    const shouldActivateCleanMode = searchTerm.trim().length > 0 || isTyping || searchResults.length > 0
    setCleanMode(shouldActivateCleanMode)
  }, [searchTerm, isTyping, searchResults.length])
  
  // REAL-TIME SEARCH EFFECT
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchTerm.trim()) {
      if (searchTerm.trim().length === 0) {
        setSearchResults([])
        setOriginalSearchResults([])
        setShowStats(true)
        setWithinSearchTerm('')
        setActiveFilters({ tahunRange: [MIN_YEAR, MAX_YEAR] })
        setActiveSynonyms([])
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
  }, [searchTerm, liveSearchEnabled])

  // Reset within-search ketika search utama berubah
  useEffect(() => {
    if (searchResults.length > 0) {
      setWithinSearchTerm('')
      setActiveFilters({ tahunRange: [MIN_YEAR, MAX_YEAR] })
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
          .limit(5)

        setSuggestions(data || [])
      } catch (error) {
        console.error('Suggestions error:', error)
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // IMPROVED Filtered Results dengan Enhanced Year Filtering
  const getFilteredResults = useCallback(() => {
    if (!withinSearchTerm.trim() && 
        activeFilters.tahunRange[0] === MIN_YEAR && 
        activeFilters.tahunRange[1] === MAX_YEAR) {
      return searchResults
    }

    return searchResults.filter(book => {
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

      if (book.tahun_terbit) {
        const yearStr = book.tahun_terbit.toString().trim();
        const extractedYear = extractYearFromString(yearStr);
        
        if (extractedYear !== null) {
          const [minYear, maxYear] = activeFilters.tahunRange;
          if (extractedYear < minYear || extractedYear > maxYear) {
            return false;
          }
        } else {
          if (activeFilters.tahunRange[0] !== MIN_YEAR || activeFilters.tahunRange[1] !== MAX_YEAR) {
            return false;
          }
        }
      } else {
        if (activeFilters.tahunRange[0] !== MIN_YEAR || activeFilters.tahunRange[1] !== MAX_YEAR) {
          return false;
        }
      }

      return true
    })
  }, [searchResults, withinSearchTerm, activeFilters.tahunRange])

  // Get current filtered results dengan useMemo untuk optimasi
  const filteredResults = useMemo(() => getFilteredResults(), [getFilteredResults])

  // STRICT SEARCH EXECUTION
  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setActiveSynonyms([]);
    
    const lang = detectLanguage(searchQuery);
    setDetectedLanguage(lang);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setCurrentPage(1);

    try {
      // PHASE 1: Strict exact matching
      const exactResults = await performStrictSearch(searchQuery);
      
      // PHASE 2: Conservative synonyms expansion
      const synonymData = await expandSearchWithSynonyms(searchQuery);
      let synonymResults = [];
      
      if (synonymsEnabled && synonymData.terms.length > 1) {
        // Hanya gunakan 2-3 synonyms terbaik, bukan semua
        const bestSynonyms = synonymData.terms.slice(1, 4); // Max 3 synonyms
        const synonymPromises = bestSynonyms.map(term => 
          performStrictSearch(term)
        );
        const allSynonymResults = await Promise.all(synonymPromises);
        synonymResults = allSynonymResults.flat();
      }
      
      // COMBINE & DEDUPLICATE
      const allResults = [...exactResults, ...synonymResults];
      const uniqueResults = [];
      const seenIds = new Set();
      
      allResults.forEach(book => {
        if (!seenIds.has(book.id)) {
          seenIds.add(book.id);
          uniqueResults.push(book);
        }
      });
      
      // FINAL SORTING - tetap pakai strict ranking
      const finalResults = uniqueResults.sort((a, b) => b._relevanceScore - a._relevanceScore);
      
      setSearchResults(finalResults);
      setOriginalSearchResults(exactResults);
      setSearchMethod(synonymsEnabled ? 'Strict Search + Limited Synonyms' : 'Strict Exact Match');
      setActiveSynonyms(synonymData.synonyms.slice(0, 3)); // Max 3 synonyms displayed
      
      if (finalResults.length > 0) {
        saveToSearchHistory(searchQuery, finalResults.length);
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
        setSearchResults([]);
        setOriginalSearchResults([]);
        setActiveSynonyms([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle Synonyms
  const toggleSynonyms = () => {
    const newSynonymsEnabled = !synonymsEnabled;
    setSynonymsEnabled(newSynonymsEnabled);
    
    if (searchTerm.trim() && originalSearchResults.length > 0) {
      if (newSynonymsEnabled) {
        executeSearch(searchTerm);
      } else {
        setSearchResults(originalSearchResults);
        setSearchMethod('Strict Exact Match');
        setActiveSynonyms([]);
        setCurrentPage(1);
      }
    }
  };

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
    setOriginalSearchResults([])
    setShowStats(true)
    setShowSuggestions(false)
    setWithinSearchTerm('')
    setActiveSynonyms([])
    setActiveFilters({ tahunRange: [MIN_YEAR, MAX_YEAR] })
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  // Clear within-search filters
  const clearWithinSearch = () => {
    setWithinSearchTerm('')
    setActiveFilters({ tahunRange: [MIN_YEAR, MAX_YEAR] })
  }

  // Update year range dari slider
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

  // Check if any within-search filters are active
  const isWithinSearchActive = withinSearchTerm.trim() || 
    activeFilters.tahunRange[0] !== MIN_YEAR || 
    activeFilters.tahunRange[1] !== MAX_YEAR

  return (
    <Layout isMobile={isMobile}>
      <Head>
        <title>Koleksi Buku Langka - Perpustakaan Nasional RI</title>
        <meta name="description" content="Temukan khazanah literatur langka Indonesia dari koleksi Perpustakaan Nasional RI" />
      </Head>

      {/* Hero Section dengan Clean Mode Transition */}
      <section style={{
        background: cleanMode ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: cleanMode ? '#2d3748' : 'white',
        padding: isMobile ? 
          (cleanMode ? '1rem 1rem' : '2.5rem 1rem') : 
          (cleanMode ? '2rem 2rem' : '4rem 2rem'),
        textAlign: 'center',
        transition: 'all 0.3s ease-in-out',
        minHeight: cleanMode ? 'auto' : (isMobile ? '35vh' : '40vh'),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: cleanMode ? 'flex-start' : 'center'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          width: '100%',
          transition: 'all 0.3s ease-in-out'
        }}>
          {/* Judul Hero - Animate Out dalam Clean Mode */}
          <div style={{
            opacity: cleanMode ? 0 : 1,
            height: cleanMode ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            marginBottom: cleanMode ? 0 : '1rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '2rem' : '3rem',
              fontWeight: '800',
              marginBottom: '1rem',
              lineHeight: '1.2',
              transition: 'all 0.3s ease-in-out'
            }}>
              Memori Literasi Nusantara
            </h2>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              marginBottom: isMobile ? '2rem' : '2.5rem',
              opacity: 0.9,
              fontWeight: '300',
              lineHeight: '1.5',
              transition: 'all 0.3s ease-in-out'
            }}>
              85.000+ warisan budaya di layanan buku langka - Perpustakaan Nasional RI
            </p>
          </div>
          
          {/* Search Form - Tetap Visible */}
          <form onSubmit={handleManualSearch} style={{ 
            maxWidth: '600px', 
            margin: cleanMode ? '0 auto 1rem auto' : '0 auto',
            position: 'relative',
            transition: 'all 0.3s ease-in-out'
          }}>
            {/* Search Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
              transition: 'all 0.3s ease-in-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={toggleLiveSearch}
                  style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: liveSearchEnabled ? 
                      (cleanMode ? '#48bb78' : '#48bb78') : 
                      (cleanMode ? '#e2e8f0' : 'rgba(255,255,255,0.3)'),
                    color: liveSearchEnabled ? 
                      (cleanMode ? 'white' : 'white') : 
                      (cleanMode ? '#4a5568' : 'rgba(255,255,255,0.8)'),
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '0.8rem' }}>
                    {liveSearchEnabled ? '🔴' : '⚪'}
                  </span>
                  Live Search
                </button>

                {/* Synonyms Toggle */}
                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSynonyms}
                    style={{
                      padding: '0.3rem 0.6rem',
                      backgroundColor: synonymsEnabled ? 
                        (cleanMode ? '#4299e1' : '#4299e1') : 
                        (cleanMode ? '#e2e8f0' : 'rgba(255,255,255,0.3)'),
                      color: synonymsEnabled ? 
                        (cleanMode ? 'white' : 'white') : 
                        (cleanMode ? '#4a5568' : 'rgba(255,255,255,0.8)'),
                      border: 'none',
                      borderRadius: '15px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>
                      {synonymsEnabled ? '🌐' : '🔤'}
                    </span>
                    {synonymsEnabled ? 'With Synonyms' : 'Exact Match'}
                  </button>
                )}

                {(loading || isTyping) && (
                  <div style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: cleanMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)',
                    color: cleanMode ? '#4a5568' : 'rgba(255,255,255,0.9)',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isTyping ? 
                        (cleanMode ? '#f6e05e' : '#f6e05e') : 
                        (cleanMode ? '#4299e1' : '#4299e1'),
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
                    backgroundColor: cleanMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)',
                    color: cleanMode ? '#4a5568' : 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
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
              boxShadow: cleanMode ? '0 4px 12px rgba(0,0,0,0.1)' : '0 10px 25px rgba(0,0,0,0.2)',
              position: 'relative',
              transition: 'all 0.3s ease-in-out'
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
                    outline: 'none',
                    background: 'white',
                    color: '#2d3748',
                    transition: 'all 0.2s ease'
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
                          backgroundColor: '#f7fafc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          💡 Saran Pencarian 
                          <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#4299e1',
                            color: 'white',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '10px'
                          }}>
                            +Synonyms
                          </span>
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
                color: cleanMode ? '#718096' : 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                justifyContent: 'center',
                transition: 'all 0.3s ease-in-out'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isTyping ? '#f6e05e' : loading ? '#4299e1' : '#48bb78',
                  animation: (isTyping || loading) ? 'pulse 1.5s infinite' : 'none'
                }} />
                {isTyping ? 'Mengetik...' : loading ? 'Mencari...' : 'Live search aktif'}
                <span style={{ marginLeft: '0.5rem' }}>
                  • {synonymsEnabled ? '🌐 Synonyms ON' : '🔤 Exact Match'}
                </span>
              </div>
            )}
          </form>

          {/* Search Info */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: cleanMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              color: cleanMode ? '#4a5568' : 'rgba(255,255,255,0.9)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              display: 'inline-block',
              transition: 'all 0.3s ease-in-out'
            }}>
              🚀 {searchMethod} • {searchResults.length} hasil relevan
              {liveSearchEnabled && ' • 🔴 Live'} 
              • 📊 Strict Ranking
              • {synonymsEnabled ? '🌐 Limited Synonyms' : '🔤 Exact Match'}
              {detectedLanguage && ` • ${detectedLanguage.toUpperCase()}`}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section - Animate Out dalam Clean Mode */}
      <section style={{
        backgroundColor: 'white',
        padding: isMobile ? 
          (cleanMode ? '0 1rem' : '2rem 1rem') : 
          (cleanMode ? '0 2rem' : '3rem 2rem'),
        opacity: cleanMode ? 0 : 1,
        height: cleanMode ? 0 : 'auto',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out'
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

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <section style={{ 
          maxWidth: '1400px', 
          margin: isMobile ? '2rem auto' : '3rem auto',
          padding: isMobile ? '0 1rem' : '0 2rem'
        }}>
          {/* Search-within-Search Panel dengan Year Slider ONLY */}
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
              </div>

              {/* Right Column: Year Slider ONLY */}
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

            {/* Synonyms Filter Status */}
            {searchResults.length > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: synonymsEnabled ? '#f0fff4' : '#f7fafc',
                border: synonymsEnabled ? '1px solid #9ae6b4' : '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: synonymsEnabled ? '#22543d' : '#4a5568'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: synonymsEnabled && activeSynonyms.length > 0 ? '0.5rem' : '0',
                  fontWeight: '600'
                }}>
                  {synonymsEnabled ? '🌐 Pencarian dengan Limited Synonyms' : '🔤 Pencarian Strict Exact Match'}
                  <button
                    onClick={toggleSynonyms}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: synonymsEnabled ? '#2b6cb0' : '#38a169',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      textDecoration: 'underline',
                      marginLeft: 'auto'
                    }}
                  >
                    {synonymsEnabled ? 'Matikan synonyms' : 'Nyalakan synonyms'}
                  </button>
                </div>
                
                {synonymsEnabled && activeSynonyms.length > 0 && (
                  <div style={{ color: '#2d3748' }}>
                    <div style={{ marginBottom: '0.25rem' }}>Termasuk pencarian untuk:</div>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      {activeSynonyms.map((synonym, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: '#e6fffa',
                            color: '#234e52',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            border: '1px solid #81e6d9'
                          }}
                        >
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filter Status */}
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
                {` • ${filteredResults.length} hasil (dari ${searchResults.length})`}
                {` • 📊 ${countValidYears(filteredResults)} buku dengan tahun valid`}
              </div>
            )}
          </div>

          {/* Results Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ flex: 1 }}>
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
                    {synonymsEnabled ? ' dengan limited synonyms' : ' (strict match only)'}
                    {` untuk "${searchTerm}"`}
                    {withinSearchTerm && ` + filter: "${withinSearchTerm}"`}
                    {(activeFilters.tahunRange[0] !== MIN_YEAR || activeFilters.tahunRange[1] !== MAX_YEAR) && 
                      ` + tahun: ${activeFilters.tahunRange[0]}-${activeFilters.tahunRange[1]}`}
                  </>
                ) : (
                  <>
                    <strong>{searchResults.length}</strong> buku ditemukan
                    {synonymsEnabled ? ' dengan limited synonyms' : ' (strict match only)'}
                    {` untuk "${searchTerm}"`}
                    {activeSynonyms.length > 0 && synonymsEnabled && (
                      <span style={{color: '#4299e1', fontWeight: '600'}}>
                        {' '}• {activeSynonyms.length} synonyms
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
                {book._relevanceScore > 1000 && (
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
                    🔥 Exact Match
                  </div>
                )}
                
                <h4 style={{ 
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '0.75rem',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  lineHeight: '1.4'
                }}>
                  {book._parsedTitle || book.judul}
                </h4>
                
                {book._parsedAuthor && (
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.9rem', 
                    color: '#4299e1', 
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    ✍️ {book._parsedAuthor}
                  </div>
                )}
                
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

          {/* Enhanced Pagination */}
          {totalPages > 1 && filteredResults.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '3rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: currentPage === 1 ? '#cbd5e0' : '#4a5568',
                  borderRadius: '8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                ← Prev
              </button>

              {(() => {
                const pages = [];
                const maxVisiblePages = isMobile ? 3 : 5;
                
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => paginate(1)}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: currentPage === 1 ? '#4299e1' : 'white',
                        color: currentPage === 1 ? 'white' : '#4a5568',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      1
                    </button>
                  );
                  
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" style={{ padding: '0.75rem 0.5rem', color: '#718096' }}>
                        ...
                      </span>
                    );
                  }
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => paginate(i)}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: currentPage === i ? '#4299e1' : 'white',
                        color: currentPage === i ? 'white' : '#4a5568',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {i}
                    </button>
                  );
                }
                
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" style={{ padding: '0.75rem 0.5rem', color: '#718096' }}>
                        ...
                      </span>
                    );
                  }
                  
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => paginate(totalPages)}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        backgroundColor: currentPage === totalPages ? '#4299e1' : 'white',
                        color: currentPage === totalPages ? 'white' : '#4a5568',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pages;
              })()}

              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: currentPage === totalPages ? '#cbd5e0' : '#4a5568',
                  borderRadius: '8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Next →
              </button>
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
