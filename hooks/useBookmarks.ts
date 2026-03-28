'use client';

import { useState, useEffect } from 'react';
import { Scheme } from '@/lib/supabase';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Scheme[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('schemeatlas_bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse bookmarks', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const addBookmark = (scheme: Scheme) => {
    setBookmarks(prev => {
      if (prev.find(s => s.id === scheme.id)) return prev;
      const updated = [...prev, scheme];
      localStorage.setItem('schemeatlas_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('schemeatlas_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const isBookmarked = (id: string) => {
    return bookmarks.some(s => s.id === id);
  };

  const toggleBookmark = (scheme: Scheme) => {
    if (isBookmarked(scheme.id)) {
      removeBookmark(scheme.id);
    } else {
      addBookmark(scheme);
    }
  };

  return {
    bookmarks,
    isLoaded,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark
  };
}
