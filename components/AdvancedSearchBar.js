// components/AdvancedSearchBar.js
import { useState } from 'react';

export default function AdvancedSearchBar({ books, onSearchResults }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      onSearchResults(books); // Return all books if empty
      return;
    }

    // Split into multiple keywords and remove empty strings
    const keywords = term.toLowerCase().split(' ').filter(word => word.length > 0);
    
    const results = books.filter(book => {
      // Combine all searchable fields into one text
      const searchableText = `
        ${book.title || ''} 
        ${book.author || ''} 
        ${book.description || ''}
        ${book.category || ''}
        ${book.publisher || ''}
      `.toLowerCase();

      // Check if ALL keywords exist in the searchable text
      return keywords.every(keyword => searchableText.includes(keyword));
    });

    onSearchResults(results);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Cari buku... (contoh: sejarah majapahit, novel terjemahan)"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="search-info mt-2 text-sm text-gray-600">
        {searchTerm && (
          <p>Mencari: "{searchTerm}" • {keywords.length} kata kunci • AND logic</p>
        )}
      </div>
    </div>
  );
}
