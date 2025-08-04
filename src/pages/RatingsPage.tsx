// src/pages/RatingsPage.tsx
import React, { useState, useMemo } from 'react'; // Import useState and useMemo
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { Star, TrendingUp, Award, BarChart3, RefreshCw } from 'lucide-react'; // Import RefreshCw
import { getRatingDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

// Define interfaces for clarity and type safety (if not already defined globally or in DataContext)
interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  'Last Updated': string;
  Installs: string | null;
  Reviews: string;
  InstallsNumeric: number;
  ReviewsNumeric: number;
  EngagementRate: number;
  Price: string;
  Size: string;
  'Content Rating': string;
  Genres: string;
  Type: string;
  index?: number;
}

const RatingsPage: React.FC = () => {
  // --- ALL REACT HOOKS MUST BE DECLARED AT THE VERY TOP LEVEL AND UNCONDITIONALLY ---
  const { filteredApps, loading, fetchApps } = useData(); // Destructure fetchApps

  // State for table controls
  const [sortByAppRating, setSortByAppRating] = useState<string>('Rating'); // Default sort by Rating
  const [sortOrderAppRating, setSortOrderAppRating] = useState<'desc' | 'asc'>('desc'); // Default sort descending

  // Data processing with useMemo
  const ratingDistribution = useMemo(() => getRatingDistribution(filteredApps), [filteredApps]);

  // Rating vs Installs correlation
  const ratingInstallsData = useMemo(() => {
    return filteredApps
      .filter(app => (app.Rating || 0) > 0 && parseInstalls(app.Installs || '0') > 0)
      .map(app => ({
        rating: app.Rating || 0,
        installs: parseInstalls(app.Installs || '0'),
        name: app.App
      }))
      .slice(0, 500); // Limiting for chart performance if data is too large
  }, [filteredApps]);


  // Raw Top rated apps - we will sort this in a separate useMemo
  const rawTopRatedApps = useMemo(() => {
    return filteredApps
      .filter(app => (app.Rating || 0) >= 4.0 && (app.Reviews || 0) >= 100)
      .map(app => ({
        App: app.App,
        Category: app.Category,
        Rating: app.Rating,
        Reviews: app.Reviews,
        Installs: formatInstalls(parseInstalls(app.Installs || '0')),
        _installsNumeric: parseInstalls(app.Installs || '0'), // For numeric sorting
        Type: app.Type,
        Genres: app.Genres // Include Genres for AppNameRenderCell
      }));
  }, [filteredApps]);

  // Sorted Top rated apps for the DataTable
  const sortedTopRatedApps = useMemo(() => {
    return [...rawTopRatedApps].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortByAppRating === 'App' || sortByAppRating === 'Category' || sortByAppRating === 'Type') {
        valA = a[sortByAppRating as keyof typeof a];
        valB = b[sortByAppRating as keyof typeof b];
        return sortOrderAppRating === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortByAppRating === 'Installs') {
        valA = a._installsNumeric; // Use numeric installs for sorting
        valB = b._installsNumeric;
      } else { // 'Rating', 'Reviews'
        valA = a[sortByAppRating as keyof typeof a] || 0; // Default to 0 if null for numeric comparison
        valB = b[sortByAppRating as keyof typeof b] || 0;
      }

      // Handle null/undefined values for numeric sorting, pushing them to end/start based on sort order
      if (valA === null || typeof valA === 'undefined') valA = (sortOrderAppRating === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderAppRating === 'asc' ? -Infinity : Infinity);


      if (sortOrderAppRating === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 20); // Still show top 20 after sorting
  }, [rawTopRatedApps, sortByAppRating, sortOrderAppRating]);


  // Rating statistics
  const validRatings = useMemo(() => filteredApps.filter(app => (app.Rating || 0) > 0), [filteredApps]);
  const averageRating = useMemo(() => validRatings.length > 0 ? validRatings.reduce((sum, app) => sum + (app.Rating || 0), 0) / validRatings.length : 0, [validRatings]);
  const highestRating = useMemo(() => validRatings.length > 0 ? Math.max(...validRatings.map(app => (app.Rating || 0))) : 0, [validRatings]);
  const appsAbove4 = useMemo(() => validRatings.filter(app => (app.Rating || 0) >= 4.0).length, [validRatings]);
  const percentageAbove4 = useMemo(() => validRatings.length > 0 ? (appsAbove4 / validRatings.length) * 100 : 0, [validRatings]);

  // Rating by category
  const categories = useMemo(() => [...new Set(filteredApps.map(app => app.Category))], [filteredApps]);
  const ratingByCategory = useMemo(() => {
    return categories.map(category => {
      const categoryApps = filteredApps.filter(app => app.Category === category && (app.Rating || 0) > 0);
      const avgRating = categoryApps.length > 0 ? categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length : 0;
      return {
        name: category,
        value: Number(avgRating.toFixed(2))
      };
    }).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [filteredApps, categories]);


  // Prepare data for the InsightsCard
  const ratingInsights = useMemo(() => [
    {
      id: 'quality-standard',
      label: 'Quality Standard',
      value: `${percentageAbove4.toFixed(1)}%`,
      description: `${percentageAbove4.toFixed(1)}% of apps maintain ratings above 4.0 stars`,
      colorClass: 'bg-orange-500',
    },
    {
      id: 'best-category',
      label: 'Best Category',
      value: ratingByCategory[0]?.name || 'N/A',
      description: `${ratingByCategory[0]?.name || 'N/A'} leads with ${ratingByCategory[0]?.value || 'N/A'} average rating`,
      colorClass: 'bg-green-500',
    },
    {
      id: 'rating-range',
      label: 'Rating Range',
      value: ratingDistribution.length > 0 ? ratingDistribution.reduce((max, current) =>
        current.value > max.value ? current : max
      ).name : 'N/A',
      description: ratingDistribution.length > 0 ? `Most common rating range: ${ratingDistribution.reduce((max, current) =>
        current.value > max.value ? current : max
      ).name}` : 'No data available',
      colorClass: 'bg-blue-500',
    },
    {
      id: 'market-average',
      label: 'Market Average',
      value: averageRating.toFixed(2),
      description: `Overall market average: ${averageRating.toFixed(2)} out of 5.0 stars`,
      colorClass: 'bg-purple-500',
    },
  ], [percentageAbove4, ratingByCategory, ratingDistribution, averageRating]);


  // --- Reusable Render Cells for consistency and UX ---
  const appNameRenderCell = (app: { App: string; Genres?: string }) => (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xl text-gray-600">
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 mb-1 truncate" title={app.App}>
          {app.App}
        </p>
        {app.Genres && (
          <p className="text-xs text-gray-500">
            {app.Genres}
          </p>
        )}
      </div>
    </div>
  );

  const ratingRenderCell = (app: { Rating: number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (app.Rating || 0) >= 4.5 ? 'bg-green-100 text-green-800' :
      (app.Rating || 0) >= 4.0 ? 'bg-blue-100 text-blue-800' :
      (app.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {app.Rating?.toFixed(1) || 'N/A'}
    </span>
  );

  const reviewsRenderCell = (app: { Reviews: string | number }) => (
    <span className="font-mono text-blue-600">
      {typeof app.Reviews === 'number' ? app.Reviews.toLocaleString() : parseInt(app.Reviews.replace(/,/g, '')).toLocaleString()}
    </span>
  );

  const installsRenderCell = (app: { Installs: string }) => (
    <span className="font-mono text-indigo-700">
      {app.Installs}
    </span>
  );

  const typeRenderCell = (app: { Type: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      app.Type === 'Free' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {app.Type}
    </span>
  );

  const tableColumns = useMemo(() => [
    { key: 'App', label: 'App Name', renderCell: appNameRenderCell, textAlign: 'left' },
    { key: 'Category', label: 'Category', textAlign: 'left' },
    { key: 'Rating', label: 'Rating', renderCell: ratingRenderCell, textAlign: 'right' },
    { key: 'Reviews', label: 'Reviews', renderCell: reviewsRenderCell, textAlign: 'right' },
    { key: 'Installs', label: 'Installs', renderCell: installsRenderCell, textAlign: 'right' },
    { key: 'Type', label: 'Type', renderCell: typeRenderCell, textAlign: 'center' }
  ], []);

  const handleReloadData = () => {
    if (fetchApps) {
      fetchApps();
    }
  };

  // --- NOW, THE CONDITIONAL RETURN IS SAFE BECAUSE ALL HOOKS ARE ABOVE IT ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Ratings Analysis</h1>
        <p className="text-yellow-100">
          Deep dive into app ratings, quality metrics, and user satisfaction patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Average Rating"
          value={averageRating.toFixed(2)}
          icon={Star}
          color="orange"
        />
        <StatsCard
          title="Highest Rating"
          value={highestRating.toFixed(1)}
          icon={Award}
          color="green"
        />
        <StatsCard
          title="Apps Above 4.0"
          value={`${percentageAbove4.toFixed(1)}%`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Rated Apps"
          value={validRatings.length.toLocaleString()}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <BarChartComponent
          data={ratingDistribution}
          title="Rating Distribution"
          height={400}
          color="#F59E0B"
        />
        <PieChartComponent
          data={ratingDistribution}
          title="Rating Distribution (Pie Chart)"
          height={400}
          color="#A855F7" // Added a default color for consistency
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <BarChartComponent
          data={ratingByCategory}
          title="Average Rating by Category (Top 15)"
          height={400}
          color="#EF4444"
        />
        <ScatterPlot
          data={ratingInstallsData}
          title="Rating vs Installs Correlation"
          xAxisKey="rating"
          yAxisKey="installs"
          xAxisLabel="Rating"
          yAxisLabel="Installs"
          height={400}
          color="#F59E0B"
        />
      </div>

      {/* Top Rated Apps Table - ENHANCED UX */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Top 20 Highest Rated Apps (4.0+ with 100+ reviews)
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByAppRating}
              onChange={(e) => setSortByAppRating(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Rating">⭐ Rating</option>
              <option value="App">📱 App Name</option>
              <option value="Reviews">💬 Reviews</option>
              <option value="Installs">📈 Installs</option>
              <option value="Category">🏷️ Category</option>
              <option value="Type">💲 Type</option>
            </select>
            <button
              onClick={() => setSortOrderAppRating(sortOrderAppRating === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderAppRating === 'desc' ? '↓' : '↑'}
            </button>
            <button
              onClick={handleReloadData}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <DataTable
          data={sortedTopRatedApps}
          columns={tableColumns}
          title="" /* Title moved to h3 above */
          pageSize={20} // Display all 20 top apps on one page
          showPagination={true}
          enableSorting={false} /* Sorting handled by parent component now */
          initialSortBy={sortByAppRating}
          initialSortDirection={sortOrderAppRating}
          showRankColumn={true}
        />
      </div>

      {/* Insights - Now using InsightsCard */}
      <InsightsCard
        title="Rating Insights"
        insights={ratingInsights}
      />
    </div>
  );
};

export default RatingsPage;