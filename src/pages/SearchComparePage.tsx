import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, Star, Download, MessageSquare, DollarSign } from 'lucide-react';
import { parseInstalls, formatInstalls } from '../utils/dataTransformers';
import AppComparisonCard from '../components/AppComparisonCard'; // Import the new component

// Define the AppData interface here as well, to ensure consistency
// It should match the one in AppComparisonCard.tsx
interface AppData {
  App: string;
  Category: string;
  Rating: number;
  Reviews: number;
  Installs: string; // Stored as string, parsed to number
  Type: 'Free' | 'Paid';
  Price: string;
  'Content Rating': string;
  Size: string;
  'Last Updated': string;
  'Android Ver': string;
  // These are custom fields added in getAppDetails
  reviewCount: number;
  avgSentiment: string; // Formatted string
  sentimentLabel: 'Positive' | 'Negative' | 'Neutral';
}

const SearchComparePage: React.FC = () => {
  const { filteredApps, filteredReviews, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter apps based on search term
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return filteredApps
      .filter(app =>
        app.App.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.Category || '').toLowerCase().includes(searchTerm.toLowerCase()) // Added null check for Category
      )
      .slice(0, 10);
  }, [filteredApps, searchTerm]);

  const handleAppSelect = (appName: string) => {
    if (selectedApps.includes(appName)) {
      setSelectedApps(selectedApps.filter(name => name !== appName));
    } else if (selectedApps.length < 2) {
      setSelectedApps([...selectedApps, appName]);
    }
  };

  const getAppDetails = (appName: string): AppData | null => { // Explicitly type the return
    const app = filteredApps.find(a => a.App === appName);
    if (!app) return null;

    const appReviews = filteredReviews.filter(review => review.App === appName);
    const avgSentiment = appReviews.length > 0
      ? appReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / appReviews.length
      : 0;

    return {
      App: app.App || '',
      Category: app.Category || 'N/A',
      Rating: app.Rating || 0,
      Reviews: app.Reviews || 0,
      Installs: app.Installs || '0+',
      Type: (app.Type as 'Free' | 'Paid') || 'Free', // Cast to the specific union type
      Price: app.Price || '0',
      'Content Rating': app['Content Rating'] || 'Everyone',
      Size: app.Size || 'Varies with device',
      'Last Updated': app['Last Updated'] || 'N/A',
      'Android Ver': app['Android Ver'] || 'Varies with device',
      reviewCount: appReviews.length,
      avgSentiment: avgSentiment.toFixed(3),
      sentimentLabel: avgSentiment > 0.1 ? 'Positive' : avgSentiment < -0.1 ? 'Negative' : 'Neutral'
    };
  };

  const selectedAppDetails: AppData[] = selectedApps.map(getAppDetails).filter(Boolean) as AppData[];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">App Search & Compare</h1>
        <p className="text-indigo-100">
          Search for apps and compare up to 2 apps side by side
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for apps by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((app) => (
                <div
                  key={app.App}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedApps.includes(app.App)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAppSelect(app.App)}
                >
                  <h4 className="font-semibold text-gray-900 truncate">{app.App}</h4>
                  <p className="text-sm text-gray-600 mb-2">{app.Category}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      {(app.Rating || 0).toFixed(1)}
                    </span>
                    <span className="flex items-center">
                      <Download className="w-3 h-3 mr-1" />
                      {formatInstalls(parseInstalls(app.Installs || '0'))}
                    </span>
                  </div>
                  {selectedApps.includes(app.App) && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Section */}
      {selectedAppDetails.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">App Comparison</h3>
            <button
              onClick={() => setSelectedApps([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear Selection
            </button>
          </div>

          <div className={`grid grid-cols-1 ${selectedAppDetails.length === 2 ? 'lg:grid-cols-2' : ''} gap-6`}>
            {selectedAppDetails.map((app) => (
              <AppComparisonCard key={app.App} app={app} /> // Use the new component here
            ))}
          </div>

          {/* Side-by-side comparison for 2 apps */}
          {selectedAppDetails.length === 2 && (
            <div className="mt-8 border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-700">Metric</th>
                      <th className="text-left py-2 font-medium text-gray-700">{selectedAppDetails[0].App}</th>
                      <th className="text-left py-2 font-medium text-gray-700">{selectedAppDetails[1].App}</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Rating</td>
                      <td className="py-2">{selectedAppDetails[0].Rating.toFixed(1)}</td>
                      <td className="py-2">{selectedAppDetails[1].Rating.toFixed(1)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Installs</td>
                      <td className="py-2">{formatInstalls(parseInstalls(selectedAppDetails[0].Installs))}</td>
                      <td className="py-2">{formatInstalls(parseInstalls(selectedAppDetails[1].Installs))}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Reviews</td>
                      <td className="py-2">{selectedAppDetails[0].Reviews.toLocaleString()}</td>
                      <td className="py-2">{selectedAppDetails[1].Reviews.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Sentiment</td>
                      <td className="py-2">{selectedAppDetails[0].sentimentLabel}</td>
                      <td className="py-2">{selectedAppDetails[1].sentimentLabel}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {selectedApps.length === 0 && !searchTerm && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How to use</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Search for apps by typing in the search box above</li>
            <li>• Click on up to 2 apps to select them for comparison</li>
            <li>• View detailed information and side-by-side comparison</li>
            <li>• Use the filters in the sidebar to narrow down your search</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchComparePage;