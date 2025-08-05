import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

const SidebarFilters: React.FC = () => {
  const { apps, filters, setFilters } = useData();
  const [isExpanded, setIsExpanded] = useState(false); // Changed to false for initial collapsed state

  const categories = apps ? [...new Set(apps.map(app => app.Category))].sort() : [];
  const contentRatings = apps ? [...new Set(apps.map(app => app['Content Rating']))].sort() : [];

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
    // The main container will now always have `overflow-y-auto` when content exceeds its height.
    // The `max-h` will control the *visible* height, and if content overflows, it will scroll.
    <div
      className={`
        py-4 px-4 bg-gray-50 border-t border-gray-100
        transition-all duration-300 ease-in-out
        overflow-y-auto custom-scrollbar
        ${isExpanded ? 'max-h-[calc(100vh-64px)]' : 'max-h-64'}
      `}
      // Remember to adjust 'max-h-64' for your desired initial collapsed height
      // and '64px' in 'calc(100vh-64px)' for your actual header/navbar height.
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 text-sm"> {/* Removed h-full and overflow-y-auto here */}
          {/* Rating Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Rating Range: <span className="font-semibold">{filters.ratingRange[0].toFixed(1)}</span> - <span className="font-semibold">{filters.ratingRange[1].toFixed(1)}</span>
            </label>
            <div className="flex space-x-2 items-center">
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
                className="flex-1 h-1 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                className="flex-1 h-1 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* App Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">App Type</label>
            <div className="space-y-1">
              {['Free', 'Paid'].map(type => (
                <label key={type} className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.appType.includes(type)}
                    onChange={() => handleAppTypeChange(type)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Sentiment</label>
            <div className="space-y-1">
              {['Positive', 'Neutral', 'Negative'].map(sentiment => (
                <label key={sentiment} className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.sentiment.includes(sentiment)}
                    onChange={() => handleSentimentChange(sentiment)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{sentiment}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recently Updated */}
          <div>
            <label className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
              <input
                type="checkbox"
                checked={filters.recentlyUpdated}
                onChange={(e) => setFilters({ ...filters, recentlyUpdated: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Recently Updated (6 months)</span>
            </label>
          </div>

          {/* Categories (Scrollable) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Categories ({filters.categories.length} selected)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {categories.map(category => (
                <label key={category} className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 truncate">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content Ratings (Scrollable) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Content Rating ({filters.contentRating.length} selected)
            </label>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {contentRatings.map(rating => (
                <label key={rating} className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.contentRating.includes(rating)}
                    onChange={() => handleContentRatingChange(rating)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 truncate">{rating}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearAllFilters}
            className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg
                       hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarFilters;