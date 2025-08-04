import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Papa from 'papaparse';
import { PlayStoreApp, UserReview, FilterState } from '../types';

interface DataContextType {
  apps: PlayStoreApp[];
  reviews: UserReview[];
  filteredApps: PlayStoreApp[];
  filteredReviews: UserReview[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [apps, setApps] = useState<PlayStoreApp[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [filteredApps, setFilteredApps] = useState<PlayStoreApp[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    ratingRange: [1, 5],
    sentiment: [],
    appType: [],
    installsRange: [0, 1000000000],
    contentRating: [],
    recentlyUpdated: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load apps data
        const appsResponse = await fetch('/googleplaystore.csv');
        if (!appsResponse.ok) {
          throw new Error(`Failed to load apps data: ${appsResponse.status}`);
        }
        const appsText = await appsResponse.text();
        
        const appsResult = Papa.parse<PlayStoreApp>(appsText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transform: (value, field) => {
            if (field === 'Rating') {
              const rating = parseFloat(value);
              return isNaN(rating) || value === 'NaN' ? 0 : rating;
            }
            if (field === 'Reviews') {
              const cleanValue = String(value).replace(/,/g, '');
              const reviews = parseInt(cleanValue);
              return isNaN(reviews) ? 0 : reviews;
            }
            return value;
          }
        });

        // Load reviews data
        const reviewsResponse = await fetch('/googleplaystore_user_reviews.csv');
        if (!reviewsResponse.ok) {
          throw new Error(`Failed to load reviews data: ${reviewsResponse.status}`);
        }
        const reviewsText = await reviewsResponse.text();
        
        const reviewsResult = Papa.parse<UserReview>(reviewsText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transform: (value, field) => {
            if (field === 'Sentiment_Polarity') {
              const polarity = parseFloat(value);
              return isNaN(polarity) || value === 'nan' ? 0 : polarity;
            }
            if (field === 'Sentiment_Subjectivity') {
              const subjectivity = parseFloat(value);
              return isNaN(subjectivity) || value === 'nan' ? 0 : subjectivity;
            }
            return value;
          }
        });

        console.log('Apps loaded:', appsResult.data.length);
        console.log('Reviews loaded:', reviewsResult.data.length);
        console.log('Sample app:', appsResult.data[0]);
        console.log('Sample review:', reviewsResult.data[0]);

        if (appsResult.data.length === 0) {
          throw new Error('No apps data loaded from CSV');
        }

        // Filter out invalid apps (those without required fields)
        const validApps = appsResult.data.filter(app => 
          app.App && app.Category && typeof app.Rating === 'number'
        );
        
        // Filter out invalid reviews
        const validReviews = reviewsResult.data.filter(review => 
          review.App && review.Sentiment
        );

        console.log('Valid apps:', validApps.length);
        console.log('Valid reviews:', validReviews.length);

        setApps(validApps);
        setReviews(validReviews);
        setFilteredApps(validApps);
        setFilteredReviews(validReviews);
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters
    if (apps.length === 0) return;

    let filtered = [...apps].filter(app => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(app.Category || '')) {
        return false;
      }

      // Rating filter
      const rating = typeof app.Rating === 'number' ? app.Rating : 0;
      if (rating < filters.ratingRange[0] || rating > filters.ratingRange[1]) {
        return false;
      }

      // App type filter
      if (filters.appType.length > 0 && !filters.appType.includes(app.Type || '')) {
        return false;
      }

      // Content rating filter
      if (filters.contentRating.length > 0 && !filters.contentRating.includes(app['Content Rating'] || '')) {
        return false;
      }

      // Installs filter
      const installsNum = parseInstalls(app.Installs || '0');
      if (installsNum < filters.installsRange[0] || installsNum > filters.installsRange[1]) {
        return false;
      }

      // Recently updated filter
      if (filters.recentlyUpdated) {
        const lastUpdated = new Date(app['Last Updated'] || '');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (isNaN(lastUpdated.getTime()) || lastUpdated < sixMonthsAgo) {
          return false;
        }
      }

      return true;
    });

    setFilteredApps(filtered);

    // Filter reviews based on filtered apps and sentiment
    let filteredReviewsData = [...reviews].filter(review => {
      const appExists = filtered.some(app => app.App === review.App);
      if (!appExists) return false;

      if (filters.sentiment.length > 0 && !filters.sentiment.includes(review.Sentiment || '')) {
        return false;
      }

      return true;
    });

    setFilteredReviews(filteredReviewsData);
  }, [apps, reviews, filters]);

  const parseInstalls = (installs: string): number => {
    if (!installs) return 0;
    const cleaned = installs.toString().replace(/[+,]/g, '');
    return parseInt(cleaned) || 0;
  };

  return (
    <DataContext.Provider
      value={{
        apps,
        reviews,
        filteredApps,
        filteredReviews,
        filters,
        setFilters,
        loading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};