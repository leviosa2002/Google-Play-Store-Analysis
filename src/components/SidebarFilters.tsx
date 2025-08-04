import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

const SidebarFilters: React.FC = () => {
  const { apps, filters, setFilters } = useData();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique values for filter options
  const categories = [...new Set(apps.map(app => app.Category))].sort();
  const contentRatings = [...new Set(apps.map(app => app['Content Rating']))].sort();

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    setFilters({ ...filters, categories: newCategories });
  };

  const handleContentRatingChange = (rating: string) => {
    const newRatings = filters.contentRating.includes(rating)
      ? filters.contentRating.filter(r => r !== rating)
      : [...filters.contentRating, rating];
    
    setFilters({ ...filters, contentRating: newRatings });
  };

  const handleSentimentChange = (sentiment: string) => {
    const newSentiments = filters.sentiment.includes(sentiment)
      ? filters.sentiment.filter(s => s !== sentiment)
      : [...filters.sentiment, sentiment];
    
    setFilters({ ...filters, sentiment: newSentiments });
  };

  const handleAppTypeChange = (type: string) => {
    const newTypes = filters.appType.includes(type)
      ? filters.appType.filter(t => t !== type)
      : [...filters.appType, type];
    
    setFilters({ ...filters, appType: newTypes });
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      ratingRange: [1, 5],
      sentiment: [],
      appType: [],
      installsRange: [0, 1000000000],
      contentRating: [],
      recentlyUpdated: false,
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Rating Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Rating Range: {filters.ratingRange[0]} - {filters.ratingRange[1]}
            </label>
            <div className="flex space-x-2">
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={filters.ratingRange[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  ratingRange: [parseFloat(e.target.value), filters.ratingRange[1]]
                })}
                className="flex-1"
              />
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={filters.ratingRange[1]}
                onChange={(e) => setFilters({
                  ...filters,
                  ratingRange: [filters.ratingRange[0], parseFloat(e.target.value)]
                })}
                className="flex-1"
              />
            </div>
          </div>

          {/* App Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">App Type</label>
            <div className="space-y-1">
              {['Free', 'Paid'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.appType.includes(type)}
                    onChange={() => handleAppTypeChange(type)}
                    className="w-3 h-3 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-600">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Sentiment</label>
            <div className="space-y-1">
              {['Positive', 'Neutral', 'Negative'].map(sentiment => (
                <label key={sentiment} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.sentiment.includes(sentiment)}
                    onChange={() => handleSentimentChange(sentiment)}
                    className="w-3 h-3 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-600">{sentiment}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recently Updated */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.recentlyUpdated}
                onChange={(e) => setFilters({ ...filters, recentlyUpdated: e.target.checked })}
                className="w-3 h-3 text-blue-600 rounded"
              />
              <span className="ml-2 text-xs text-gray-600">Recently Updated (6 months)</span>
            </label>
          </div>

          {/* Categories (Top 10) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Categories ({filters.categories.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {categories.slice(0, 15).map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="w-3 h-3 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-600 truncate">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearAllFilters}
            className="w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarFilters;