import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { TrendingUp, Calendar, Star, BarChart3, Clock, Flame, ShieldOff, Lightbulb, RefreshCw, AlertCircle } from 'lucide-react';

import { parseInstalls, formatInstalls } from '../utils/dataTransformers';

// --- START: Added Interfaces for better type safety ---
interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  'Last Updated': string;
  Installs: string | null;
  Reviews: string;
  InstallsNumeric: number;
  EngagementRate: number;
  Price: string;
  Size: string;
  'Content Rating': string;
  Genres: string;
  // DataTable might pass 'index' if you implement it
  index?: number;
}

interface Category {
  code: string;
  name: string;
}
// --- END: Added Interfaces ---

const TrendsPage: React.FC = () => {
  const { filteredApps, loading, fetchApps } = useData();

  // --- START: State for new features ---
  const [selectedCategory, setSelectedCategory] = useState<string>('ART_AND_DESIGN'); // Default category
  const [sortBy, setSortBy] = useState<string>('InstallsNumeric');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // --- END: State for new features ---

  // Mock categories (replace with actual data if you have it from context or a separate API)
  const categories: Category[] = useMemo(() => {
    const uniqueCategories = [...new Set(filteredApps.map(app => app.Category))];
    return [{ code: 'ALL', name: 'All Categories' }, ...uniqueCategories.map(cat => ({ code: cat, name: cat })).sort((a,b) => a.name.localeCompare(b.name))];
  }, [filteredApps]);


  // Add derived properties to apps
  const appsWithProcessedData = useMemo(() => {
    return filteredApps.map(app => {
      const installsNumeric = parseInstalls(app.Installs || '0');
      const reviewsNumeric = parseInt(app.Reviews || '0');
      const engagementRate = installsNumeric > 0 ? (reviewsNumeric / installsNumeric) * 100 : 0;

      const appAny = app as any; // Temporary cast to access properties that might not be strictly typed yet
      return {
        ...app,
        InstallsNumeric: installsNumeric,
        EngagementRate: engagementRate,
        Price: appAny.Price || '0',
        Size: appAny.Size || 'Varies with device',
        'Content Rating': appAny['Content Rating'] || 'Unrated',
        Genres: appAny.Genres || 'N/A'
      } as AppData;
    });
  }, [filteredApps]);

  // Data for "Top Trending Apps Table"
  const appsForCategory = useMemo(() => {
    return selectedCategory === 'ALL' ? appsWithProcessedData : appsWithProcessedData.filter(app => app.Category === selectedCategory);
  }, [appsWithProcessedData, selectedCategory]);

  const sortedApps = useMemo(() => {
    return [...appsForCategory].sort((a, b) => {
      let valA: any = a[sortBy as keyof AppData];
      let valB: any = b[sortBy as keyof AppData];

      if (typeof valA === 'string' && !isNaN(parseFloat(valA))) {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      }

      if (valA === null || typeof valA === 'undefined') valA = (sortOrder === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrder === 'asc' ? -Infinity : Infinity);


      if (sortOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [appsForCategory, sortBy, sortOrder]);


  // --- START: Original TrendsPage calculations (kept the same logic) ---
  const appsWithDates = appsWithProcessedData.filter((app: AppData) => {
    const date = new Date(app['Last Updated']);
    return !isNaN(date.getTime()) && date.getFullYear() >= 2010;
  });

  const updatesByYear = appsWithDates.reduce((acc, app) => {
    const year = new Date(app['Last Updated']).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const yearlyUpdates = Object.entries(updatesByYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));

  const recentApps = appsWithDates.filter(app => {
    const year = new Date(app['Last Updated']).getFullYear();
    return year >= 2017;
  });

  const updatesByMonth = recentApps.reduce((acc, app) => {
    const date = new Date(app['Last Updated']);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyUpdates = Object.entries(updatesByMonth)
    .map(([month, count]) => ({ name: month, value: count }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-24);

  const ratingTrends = yearlyUpdates.map(yearData => {
    const yearApps = appsWithDates.filter(app =>
      new Date(app['Last Updated']).getFullYear() === parseInt(yearData.name)
    );
    const avgRating = yearApps.length > 0 ? yearApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / yearApps.length : 0;

    return {
      year: parseInt(yearData.name),
      avgRating: Number(avgRating.toFixed(2)),
      appCount: yearData.value
    };
  });

  const staleApps = filteredApps.filter((app: AppData) => {
    const date = new Date(app['Last Updated']);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return !isNaN(date.getTime()) && date < twoYearsAgo && (app.Rating || 0) >= 4.0;
  }).sort((a, b) => (b.Rating || 0) - (a.Rating || 0)).slice(0, 20).map((app: AppData) => ({
    App: app.App,
    Category: app.Category,
    Rating: app.Rating,
    'Last Updated': app['Last Updated'],
    Installs: formatInstalls(parseInstalls(app.Installs || '0')),
    Reviews: app.Reviews,
    Genres: (app as any).Genres // Ensure Genres is included for consistent App rendering
  }));

  const totalAppsWithDates = appsWithDates.length;
  const recentlyUpdated = appsWithDates.filter(app => {
    const date = new Date(app['Last Updated']);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return date >= sixMonthsAgo;
  }).length;

  const mostActiveYear = yearlyUpdates.reduce((max, current) =>
    current.value > max.value ? current : max, { name: '0', value: 0 }
  );

  const avgUpdateRate = totalAppsWithDates > 0 ? (recentlyUpdated / totalAppsWithDates) * 100 : 0;

  const highRatedStaleAppsCount = staleApps.length;

  const trendInsightsData = [
    {
      id: 'update-activity',
      label: 'Recent Update Activity',
      value: `${avgUpdateRate.toFixed(1)}%`,
      description: `${avgUpdateRate.toFixed(1)}% of apps have been updated in the last 6 months, indicating active development.`,
      colorClass: 'bg-green-500',
      icon: TrendingUp,
    },
    {
      id: 'peak-update-year',
      label: 'Peak Update Year',
      value: mostActiveYear.name,
      description: `${mostActiveYear.name} saw the highest number of app updates, with ${mostActiveYear.value.toLocaleString()} apps being updated.`,
      colorClass: 'bg-purple-500',
      icon: Calendar,
    },
    {
      id: 'stale-high-rated-apps',
      label: 'High-Rated Stale Apps',
      value: highRatedStaleAppsCount.toLocaleString(),
      description: `${highRatedStaleAppsCount} apps with 4.0+ rating haven't been updated in 2+ years, potentially indicating missed opportunities.`,
      colorClass: 'bg-orange-500',
      icon: ShieldOff,
    },
    {
      id: 'rating-trend-overview',
      label: 'Overall Rating Stability',
      value: ratingTrends.length > 0 ? `Avg ${ratingTrends[ratingTrends.length - 1].avgRating.toFixed(2)}` : 'N/A',
      description: ratingTrends.length > 0
        ? `Average app ratings have fluctuated around ${ratingTrends[ratingTrends.length - 1].avgRating.toFixed(2)} in recent years.`
        : 'No historical rating trend data available.',
      colorClass: 'bg-blue-500',
      icon: Star,
    },
    {
      id: 'long-term-updates',
      label: 'Total Update Records',
      value: totalAppsWithDates.toLocaleString(),
      description: `Analysis based on update data from ${totalAppsWithDates.toLocaleString()} apps.`,
      colorClass: 'bg-gray-600',
      icon: Lightbulb,
    },
  ];
  // --- END: Original TrendsPage calculations ---

  // --- START: New data calculations for the added sections ---
  // For Engagement Distribution by Category (top 10 based on avg engagement)
  const categoryEngagementData = useMemo(() => {
    const engagementMap: { [key: string]: { totalEngagement: number; count: number } } = {};
    appsWithProcessedData.forEach(app => {
      if (!engagementMap[app.Category]) {
        engagementMap[app.Category] = { totalEngagement: 0, count: 0 };
      }
      engagementMap[app.Category].totalEngagement += app.EngagementRate;
      engagementMap[app.Category].count += 1;
    });

    return Object.entries(engagementMap).map(([category, data]) => ({
      name: category, // Mapped to 'name' for BarChartComponent
      value: data.count > 0 ? (data.totalEngagement / data.count) : 0, // Mapped to 'value'
    })).sort((a, b) => b.value - a.value); // Sort by value (avgEngagement)
  }, [appsWithProcessedData]);

  const top10CategoryPerformance = categoryEngagementData.slice(0, 10);
  // --- END: New data calculations for the added sections ---

  // Reusable App Name renderCell function for consistency
  const appNameRenderCell = (app: AppData) => (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xl text-gray-600">
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 mb-1 truncate" title={app.App}>
          {app.App}
        </p>
        <p className="text-xs text-gray-500">
          {app.Genres}
        </p>
      </div>
    </div>
  );

  // Reusable Rating renderCell function for consistency
  const ratingRenderCell = (app: AppData) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (app.Rating || 0) >= 4.5 ? 'bg-green-100 text-green-800' :
      (app.Rating || 0) >= 4.0 ? 'bg-blue-100 text-blue-800' :
      (app.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {app.Rating?.toFixed(1) || 'N/A'}
    </span>
  );

  // Columns for the "High-Rated Apps Not Updated Recently" table
  const staleAppsColumns = useMemo(() => [
    { key: 'App', label: 'App Name', sortable: true, renderCell: appNameRenderCell, textAlign: 'left' },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true, renderCell: ratingRenderCell, textAlign: 'right' },
    { key: 'Last Updated', label: 'Last Updated', sortable: true },
    {
      key: 'Installs',
      label: 'Installs',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className="font-mono text-purple-600">
          {formatInstalls(parseInstalls(app.Installs || '0'))}
        </span>
      )
    },
    {
      key: 'Reviews',
      label: 'Reviews',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className="font-mono text-green-600">
          {formatInstalls(parseInt(app.Reviews))}
        </span>
      )
    }
  ], []);

  const handleSort = (value: string) => {
    setSortBy(value);
  };

  const loadCsvData = () => {
    if (fetchApps) {
      fetchApps();
    }
  };

  // Columns for the "Top Apps in Category" table
  const topAppsTableColumns = useMemo(() => [
    // The Rank column is now handled by DataTable's showRankColumn prop
    {
      key: 'App',
      label: 'App',
      sortable: true,
      textAlign: 'left',
      renderCell: appNameRenderCell // Use reusable renderCell
    },
    {
      key: 'Rating',
      label: 'Rating',
      sortable: true,
      textAlign: 'right',
      renderCell: ratingRenderCell // Use reusable renderCell
    },
    {
      key: 'Reviews',
      label: 'Reviews',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className="font-mono text-green-600">
          {formatInstalls(parseInt(app.Reviews))}
        </span>
      )
    },
    {
      key: 'InstallsNumeric', // Use the numeric key for sorting
      label: 'Installs',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className="font-mono text-purple-600">
          {formatInstalls(app.InstallsNumeric)}
        </span>
      )
    },
    {
      key: 'Price',
      label: 'Price',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className="font-mono text-orange-600">
          {app.Price === '0' || app.Price === '0.0' ? 'Free' : app.Price}
        </span>
      )
    },
    {
      key: 'Size',
      label: 'Size',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className="text-gray-600">
          {app.Size === 'Varies with device' ? 'Variable' : app.Size}
        </span>
      )
    },
    {
      key: 'Content Rating',
      label: 'Content Rating',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
          {app['Content Rating']}
        </span>
      )
    },
    {
      key: 'EngagementRate',
      label: 'Engagement',
      sortable: true,
      textAlign: 'right',
      renderCell: (app: AppData) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          app.EngagementRate > 1 ? 'bg-green-100 text-green-800' :
          app.EngagementRate > 0.1 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {app.EngagementRate?.toFixed(2)}%
        </span>
      )
    },
  ], []);


  const top20SortedApps = useMemo(() => sortedApps.slice(0, 20), [sortedApps]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Trends Analysis</h1>
        <p className="text-emerald-100">
          Analyze app update patterns, category trends, and temporal insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Apps with Update Data"
          value={totalAppsWithDates.toLocaleString()}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Recently Updated"
          value={`${avgUpdateRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Most Active Year"
          value={mostActiveYear.name}
          icon={BarChart3}
          color="purple"
        />
        <StatsCard
          title="Peak Updates"
          value={mostActiveYear.value.toLocaleString()}
          icon={Star}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={yearlyUpdates}
          title="App Updates by Year"
          height={400}
          color="#10B981"
        />
        <BarChartComponent
          data={monthlyUpdates}
          title="Monthly Update Trends (Last 24 Months)"
          height={400}
          color="#06B6D4"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ScatterPlot
          data={ratingTrends}
          title="Average Rating Trends Over Time"
          xAxisKey="year"
          yAxisKey="avgRating"
          xAxisLabel="Year"
          yAxisLabel="Average Rating"
          height={400}
          color="#10B981"
        />
      </div>

      {/* Stale but Good Apps Table (now with consistent styling and rank) */}
      <DataTable
        data={staleApps}
        columns={staleAppsColumns}
        title="High-Rated Apps Not Updated Recently (2+ years, 4.0+ rating)"
        pageSize={15}
        initialSortBy="Rating"
        initialSortDirection="desc"
        showRankColumn={true} /* Added rank column here */
      />

      {/* Insights */}
      <InsightsCard
        title="Key Trend Insights"
        insights={trendInsightsData}
      />

      {/* Top Trending Apps Table (consistent styling and rank) */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Top Apps in {categories.find(cat => cat.code === selectedCategory)?.name || selectedCategory}
          </h3>
          <div className="flex space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.code} value={cat.code}>{cat.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="InstallsNumeric">📈 Installs</option>
              <option value="Rating">⭐ Rating</option>
              <option value="Reviews">💬 Reviews</option>
              <option value="EngagementRate">⚡ Engagement</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
            <button
              onClick={loadCsvData}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <DataTable
            data={top20SortedApps}
            columns={topAppsTableColumns}
            title=""
            pageSize={20}
            showPagination={false} // This table is explicitly showing top 20 without pagination
            enableSorting={false} // Sorting handled by parent component's controls
            initialSortBy={sortBy}
            initialSortDirection={sortOrder}
            showRankColumn={true} /* Added rank column here */
        />
      </div>

      {/* Detailed Analytics Grid - Containing the Bar Chart for Engagement Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Engagement Distribution - Now a Bar Chart */}
        <BarChartComponent
          data={top10CategoryPerformance}
          title="Top 10 Category Engagement Distribution"
          height={400}
          color="#8884d8"
          xAxisLabel="Category"
          yAxisLabel="Avg. Engagement Rate (%)"
        />
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Additional Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">High-Performing Categories</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Based on current data, categories like 'Games' and 'Family' show high total installs and a large number of apps. Focus on popular and actively updated categories for new app development or marketing efforts.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Opportunities for Improvement</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Apps with lower engagement rates or average ratings within popular categories could be areas for developer focus and improvement. Consider conducting user feedback surveys or A/B testing new features to boost engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendsPage;