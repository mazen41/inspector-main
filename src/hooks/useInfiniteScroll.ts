import { useState, useEffect, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  hasMore: boolean;
  isLoading: boolean;
}

export function useInfiniteScroll(
  fetchMore: () => void,
  options: UseInfiniteScrollOptions
) {
  const { threshold = 100, hasMore, isLoading } = options;
  const [isFetching, setIsFetching] = useState(false);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - threshold
    ) {
      if (hasMore && !isLoading && !isFetching) {
        setIsFetching(true);
      }
    }
  }, [hasMore, isLoading, isFetching, threshold]);

  useEffect(() => {
    if (isFetching && hasMore && !isLoading) {
      fetchMore();
      setIsFetching(false);
    }
  }, [isFetching, hasMore, isLoading, fetchMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { isFetching };
}