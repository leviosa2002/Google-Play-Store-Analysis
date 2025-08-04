// src/pages/ContentRatingPage.tsx
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { Shield, Users, Star, BarChart3, RefreshCw } from 'lucide-react';
import { getContentRatingDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

// Define AppData interface if not globally available, ensuring InstallsNumeric is present
interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  'Last Updated': string;
  Installs: string | null;
  Reviews: string; // Assuming Reviews is a string that can be parsed to a number
  InstallsNumeric: number; // Ensure this is always available
  ReviewsNumeric: number; // For numeric operations if needed
  EngagementRate: number;
  Price: string;
  Size: string;
  'Content Rating': string;
  Genres: string;
  Type: string;
  index?: number;
}

const ContentRatingPage: React.FC = () => {
  const { filteredApps, loading, fetchApps } = useData(); // Destructure fetchApps

  // --- NEW DEDUPLICATION STEP ---
  const deduplicatedApps = useMemo(() => {
    const seenAppNames = new Set<string>();
    const uniqueApps: AppData[] = [];
    // Iterate in reverse to keep the 'latest' or 'most relevant' if multiple criteria exist
    // For now, it keeps the first encountered unique app by name.
    for (let i = filteredApps.length - 1; i >= 0; i--) {
      const app = filteredApps[i];
      if (!seenAppNames.has(app.App)) {
        seenAppNames.add(app.App);
        uniqueApps.unshift(app);
      }
    }
    return uniqueApps;
  }, [filteredApps]);
  // --- END DEDUPLICATION STEP ---

  // State for contentRatingAnalysis table sorting
  const [sortByContentRatingTable, setSortByContentRatingTable] = useState<string>('App Count'); // Default sort
  const [sortOrderContentRatingTable, setSortOrderContentRatingTable] = useState<'desc' | 'asc'>('desc'); // Default desc

  // Memoized data for charts and stats (now using deduplicatedApps)
  const contentRatingDistribution = useMemo(() => getContentRatingDistribution(deduplicatedApps), [deduplicatedApps]);

  // Content rating performance analysis (raw, unsorted)
  const rawContentRatingAnalysis = useMemo(() => {
    return contentRatingDistribution.map(rating => {
      const ratingApps = deduplicatedApps.filter(app => app['Content Rating'] === rating.name);
      const avgRating = ratingApps.length > 0 ? ratingApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / ratingApps.length : 0;
      const totalInstalls = ratingApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
      const freeApps = ratingApps.filter(app => app.Type === 'Free').length;
      const freePercentage = ratingApps.length > 0 ? (freeApps / ratingApps.length) * 100 : 0;
      const avgReviewsNumeric = ratingApps.length > 0 ? ratingApps.reduce((sum, app) => sum + parseInt(app.Reviews || '0'), 0) / ratingApps.length : 0;

      return {
        'Content Rating': rating.name,
        'App Count': rating.value,
        '_appCountNumeric': rating.value, // For numeric sorting
        'Avg Rating': Number(avgRating.toFixed(2)),
        '_avgRatingNumeric': avgRating, // For numeric sorting
        'Total Installs': formatInstalls(totalInstalls),
        '_totalInstallsNumeric': totalInstalls, // For numeric sorting
        'Free Apps %': Number(freePercentage.toFixed(1)),
        '_freeAppsPercentNumeric': freePercentage, // For numeric sorting
        'Avg Reviews': Math.round(avgReviewsNumeric),
        '_avgReviewsNumeric': avgReviewsNumeric // For numeric sorting
      };
    });
  }, [deduplicatedApps, contentRatingDistribution]);

  // Apply sorting to contentRatingAnalysis
  const sortedContentRatingAnalysis = useMemo(() => {
    return [...rawContentRatingAnalysis].sort((a, b) => {
      let valA: any;
      let valB: any;

      // Determine the values for comparison based on sortByContentRatingTable
      switch (sortByContentRatingTable) {
        case 'Content Rating':
          valA = a['Content Rating'];
          valB = b['Content Rating'];
          return sortOrderContentRatingTable === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'App Count':
          valA = a._appCountNumeric;
          valB = b._appCountNumeric;
          break;
        case 'Avg Rating':
          valA = a._avgRatingNumeric;
          valB = b._avgRatingNumeric;
          break;
        case 'Total Installs':
          valA = a._totalInstallsNumeric;
          valB = b._totalInstallsNumeric;
          break;
        case 'Free Apps %':
          valA = a._freeAppsPercentNumeric;
          valB = b._freeAppsPercentNumeric;
          break;
        case 'Avg Reviews':
          valA = a._avgReviewsNumeric;
          valB = b._avgReviewsNumeric;
          break;
        default:
          return 0; // No sorting
      }

      // Handle null/undefined values for numeric sorting (treat as 0 or extreme for consistency)
      valA = valA ?? (sortOrderContentRatingTable === 'asc' ? -Infinity : Infinity);
      valB = valB ?? (sortOrderContentRatingTable === 'asc' ? -Infinity : Infinity);

      if (sortOrderContentRatingTable === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [rawContentRatingAnalysis, sortByContentRatingTable, sortOrderContentRatingTable]);


  // Average rating by content rating for chart
  const ratingByContentRating = useMemo(() => sortedContentRatingAnalysis.map(item => ({
    name: item['Content Rating'],
    value: item['Avg Rating']
  })), [sortedContentRatingAnalysis]);

  // Install distribution by content rating for chart
  const installsByContentRating = useMemo(() => sortedContentRatingAnalysis.map(item => ({
    name: item['Content Rating'],
    value: parseInstalls(item['Total Installs'])
  })), [sortedContentRatingAnalysis]);


  // Top apps by content rating (now using deduplicatedApps)
  const topAppsByRating = useMemo(() => {
    return ['Everyone', 'Teen', 'Mature 17+', 'Adults only 18+'].map(rating => {
      const ratingApps = deduplicatedApps
        .filter(app => app['Content Rating'] === rating && (app.Rating || 0) >= 4.0)
        .sort((a, b) => (b.Rating || 0) - (a.Rating || 0))
        .slice(0, 5); // Take top 5 for each rating

      return {
        rating,
        apps: ratingApps.map(app => ({
          App: app.App,
          Category: app.Category,
          Rating: app.Rating,
          Installs: formatInstalls(parseInstalls(app.Installs || '0')),
          Reviews: app.Reviews
        }))
      };
    }).filter(group => group.apps.length > 0);
  }, [deduplicatedApps]);

  // Statistics for StatsCards and InsightsCard (now using deduplicatedApps)
  const totalApps = useMemo(() => deduplicatedApps.length, [deduplicatedApps]);
  const everyoneApps = useMemo(() => deduplicatedApps.filter(app => app['Content Rating'] === 'Everyone').length, [deduplicatedApps]);
  const teenApps = useMemo(() => deduplicatedApps.filter(app => app['Content Rating'] === 'Teen').length, [deduplicatedApps]);
  const matureApps = useMemo(() => deduplicatedApps.filter(app => app['Content Rating']?.includes('Mature')).length, [deduplicatedApps]);
  const mostCommonRating = useMemo(() => contentRatingDistribution[0], [contentRatingDistribution]);

  // Prepare data for the InsightsCard
  const contentRatingInsights = useMemo(() => [
    {
      id: 'family-friendly-dominance',
      label: 'Family-Friendly Dominance',
      value: `${totalApps > 0 ? ((everyoneApps / totalApps) * 100).toFixed(1) : '0.0'}%`,
      description: `${(totalApps > 0 ? ((everyoneApps / totalApps) * 100).toFixed(1) : '0.0')}% of apps are rated "Everyone"`,
      colorClass: 'bg-green-500',
    },
    {
      id: 'best-performing-rating',
      label: 'Best Performing Rating',
      value: `${ratingByContentRating[0]?.name || 'N/A'}`,
      description: `${ratingByContentRating[0]?.name || 'N/A'} apps have the highest average rating (${ratingByContentRating[0]?.value || 'N/A'})`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'teen-market',
      label: 'Teen Market',
      value: `${totalApps > 0 ? ((teenApps / totalApps) * 100).toFixed(1) : '0.0'}%`,
      description: `${(totalApps > 0 ? ((teenApps / totalApps) * 100).toFixed(1) : '0.0')}% of apps target teen audiences`,
      colorClass: 'bg-orange-500',
    },
    {
      id: 'market-distribution',
      label: 'Market Distribution',
      value: `${contentRatingDistribution.length}`,
      description: `${contentRatingDistribution.length} different content rating categories`,
      colorClass: 'bg-purple-500',
    },
  ], [totalApps, everyoneApps, ratingByContentRating, teenApps, contentRatingDistribution]);


  // --- Reusable Render Cells for consistency and UX ---

  // For the main Content Rating Performance Analysis Table
  const contentRatingRenderCell = (item: { 'Content Rating': string }) => (
    <span className="font-medium text-gray-800">{item['Content Rating']}</span>
  );

  const appCountRenderCell = (item: { 'App Count': number }) => (
    <span className="font-mono text-gray-700">{item['App Count'].toLocaleString()}</span>
  );

  const avgRatingRenderCell = (item: { 'Avg Rating': number }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      item['Avg Rating'] >= 4.0 ? 'bg-green-100 text-green-800' :
      item['Avg Rating'] >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {item['Avg Rating'].toFixed(1)}
    </span>
  );

  const totalInstallsRenderCell = (item: { 'Total Installs': string }) => (
    <span className="font-mono text-indigo-700">{item['Total Installs']}</span>
  );

  const freeAppsPercentRenderCell = (item: { 'Free Apps %': number }) => (
    <span className="font-mono text-teal-700">{item['Free Apps %'].toFixed(1)}%</span>
  );

  const avgReviewsRenderCell = (item: { 'Avg Reviews': number }) => (
    <span className="font-mono text-purple-700">{item['Avg Reviews'].toLocaleString()}</span>
  );


  // Columns for the main Content Rating Performance Analysis Table
  const tableColumns = useMemo(() => [
    { key: 'Content Rating', label: 'Content Rating', renderCell: contentRatingRenderCell, textAlign: 'left' },
    { key: 'App Count', label: 'Apps', renderCell: appCountRenderCell, textAlign: 'right' },
    { key: 'Avg Rating', label: 'Avg Rating', renderCell: avgRatingRenderCell, textAlign: 'right' },
    { key: 'Total Installs', label: 'Total Installs', renderCell: totalInstallsRenderCell, textAlign: 'right' },
    { key: 'Free Apps %', label: 'Free Apps %', renderCell: freeAppsPercentRenderCell, textAlign: 'right' },
    { key: 'Avg Reviews', label: 'Avg Reviews', renderCell: avgReviewsRenderCell, textAlign: 'right' }
  ], []);


  // For the nested "Top Apps by Content Rating" tables
  const appNameRenderCell = (app: { App: string; Category?: string }) => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-md text-gray-600">
        ✨
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate" title={app.App}>
          {app.App}
        </p>
        {app.Category && (
          <p className="text-xs text-gray-500 truncate">{app.Category}</p>
        )}
      </div>
    </div>
  );

  const nestedAppRatingRenderCell = (app: { Rating: number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (app.Rating || 0) >= 4.0 ? 'bg-green-100 text-green-800' :
      (app.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {app.Rating?.toFixed(1) || 'N/A'}
    </span>
  );

  const nestedAppInstallsRenderCell = (app: { Installs: string }) => (
    <span className="font-mono text-sm text-indigo-700">
      {app.Installs}
    </span>
  );

  const nestedAppReviewsRenderCell = (app: { Reviews: string }) => (
    <span className="text-sm text-gray-700">
      {parseInt(app.Reviews).toLocaleString()}
    </span>
  );

  // Columns for the nested app tables
  const appColumns = useMemo(() => [
    { key: 'App', label: 'App Name', renderCell: appNameRenderCell, textAlign: 'left' },
    { key: 'Rating', label: 'Rating', renderCell: nestedAppRatingRenderCell, textAlign: 'right' },
    { key: 'Installs', label: 'Installs', renderCell: nestedAppInstallsRenderCell, textAlign: 'right' },
    { key: 'Reviews', label: 'Reviews', renderCell: nestedAppReviewsRenderCell, textAlign: 'right' }
  ], []);


  const handleReloadData = () => {
    if (fetchApps) {
      fetchApps();
    }
  };

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
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Content Rating Impact</h1>
        <p className="text-cyan-100">
          Analyze how content ratings affect app performance, user engagement, and market reach
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Everyone Rated"
          value={`${totalApps > 0 ? ((everyoneApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Teen Rated"
          value={`${totalApps > 0 ? ((teenApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
          icon={Shield}
          color="blue"
        />
        <StatsCard
          title="Mature Rated"
          value={`${totalApps > 0 ? ((matureApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
          icon={Star}
          color="orange"
        />
        <StatsCard
          title="Most Common"
          value={mostCommonRating?.name || 'N/A'}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <PieChartComponent
          data={contentRatingDistribution}
          title="Content Rating Distribution"
          height={400}
        />
        <BarChartComponent
          data={ratingByContentRating}
          title="Average App Rating by Content Rating"
          height={400}
          color="#06B6D4"
        />
      </div>

      {/* Content Rating Analysis Table - ENHANCED UX */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Content Rating Performance Analysis
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByContentRatingTable}
              onChange={(e) => setSortByContentRatingTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="App Count">📊 Apps</option>
              <option value="Content Rating">🏷️ Content Rating</option>
              <option value="Avg Rating">⭐ Avg Rating</option>
              <option value="Total Installs">⬇️ Total Installs</option>
              <option value="Free Apps %">🆓 Free Apps %</option>
              <option value="Avg Reviews">✍️ Avg Reviews</option>
            </select>
            <button
              onClick={() => setSortOrderContentRatingTable(sortOrderContentRatingTable === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderContentRatingTable === 'desc' ? '↓' : '↑'}
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
          data={sortedContentRatingAnalysis}
          columns={tableColumns}
          title="" /* Title moved to h3 above */
          pageSize={10}
          showPagination={true}
          enableSorting={false} /* Sorting handled by parent component now */
          initialSortBy={sortByContentRatingTable}
          initialSortDirection={sortOrderContentRatingTable}
          showRankColumn={false} // No rank column for aggregated data table
        />
      </div>

      {/* Top Apps by Content Rating - ENHANCED UX (nested tables) */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Top Apps by Content Rating</h3>
        {/* Changed grid to 2 columns on medium and larger screens for a 2x2 layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topAppsByRating.map((group) => (
            <div key={group.rating} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <DataTable
                data={group.apps}
                columns={appColumns} // Using enhanced appColumns
                title={`Top ${group.rating} Apps (4.0+ Rating)`}
                pageSize={5}
                showPagination={false} // Small table, no pagination needed
                enableSorting={true} // Allow internal sorting for these smaller lists
                showRankColumn={true} // Rank column makes sense here
              />
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <InsightsCard
        title="Content Rating Insights"
        insights={contentRatingInsights}
      />
    </div>
  );
};

export default ContentRatingPage;