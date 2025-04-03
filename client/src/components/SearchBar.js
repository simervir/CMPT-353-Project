import React from 'react';

function SearchBar({ searchTerm, setSearchTerm, onSearch }) {
  return (
    <form onSubmit={e => {
      e.preventDefault();
      onSearch();
    }}>
      <input
        type="text"
        placeholder="Search content or user..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default SearchBar;
