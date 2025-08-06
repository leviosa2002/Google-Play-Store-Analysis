import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { Calendar, Clock, TrendingUp, AlertTriangle, MessageSquare, ThumbsUp } from 'lucide-react';
import { parseInstalls, formatInstalls } from '../utils/dataTransformers';

// --- START: Interfaces ---
interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  Reviews: number;
  Installs: string;
  'Last Updated': string;
  Size: string;
}

interface ParsedAppData {
  App: string;
  Category: string;
  Rating: number;
  Reviews: number;
  Installs: number;
  'Last Updated': Date;
  'Size': string;
}

interface CategoryUpdateAnalysis {
  Category: string;
  'Total Apps': number;
  'Recently Updated': number;
  'Update Rate %': number;
  'Avg Rating': number;
}

interface AppUpdateDetail {
  App: string;
  Category: string;
  Rating: number;
  Reviews: number;
  Installs: string;
  'Last Updated': Date;
  'Days Since Update': number;
}
// --- END: Interfaces ---

// --- A helper function to robustly parse the date string format from the CSV ---
const parseDate = (dateString: string): Date | null => {
  const parts = dateString.split(/[\s,]+/);
  if (parts.length < 3) return null;
  const month = parts[0];
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  const monthMap: { [key: string]: number } = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  const monthIndex = monthMap[month];
  if (monthIndex === undefined || isNaN(day) || isNaN(year)) {
    return null;
  }

  const date = new Date(Date.UTC(year, monthIndex, day));
  return date;
};

const UpdateRecencyPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  // State for table controls
  const [sortByCategoryUpdate, setSortByCategoryUpdate] = useState<string>('Update Rate %');
  const [sortOrderCategoryUpdate, setSortOrderCategoryUpdate] = useState<'asc' | 'desc'>('desc');
  const [sortByRecentApp, setSortByRecentApp] = useState<string>('Last Updated');
  const [sortOrderRecentApp, setSortOrderRecentApp] = useState<'asc' | 'desc'>('desc');
  const [sortByStaleApp, setSortByStaleApp] = useState<string>('Days Since Update');
  const [sortOrderStaleApp, setSortOrderStaleApp] = useState<'asc' | 'desc'>('desc');

  // --- MODIFIED: Use a specific date from 2018 for calculation purposes ---
  const now = useMemo(() => new Date('2018-08-30'), []);
  const dateRanges = useMemo(() => {
    return {
      oneMonthAgo: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      threeMonthsAgo: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      sixMonthsAgo: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      oneYearAgo: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      twoYearsAgo: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
    };
  }, [now]);

  const parsedApps = useMemo(() => {
    return filteredApps
      .filter(app => {
        const date = parseDate(app['Last Updated']);
        return date !== null && date.getFullYear() >= 2010 && app.Rating !== null;
      })
      .map(app => ({
        App: app.App,
        Category: app.Category,
        Rating: app.Rating || 0,
        Reviews: app.Reviews,
        Installs: parseInstalls(app.Installs || '0'),
        'Last Updated': parseDate(app['Last Updated']) as Date,
        Size: app.Size,
      }));
  }, [filteredApps]);

  const {
    recencyDistribution,
    rawCategoryUpdateAnalysis,
    rawRecentlyUpdatedGoodApps,
    rawStaleButGoodApps,
    monthlyTrends,
  } = useMemo(() => {
    const updateRecencyCategories = [
      { name: 'Last Month', apps: parsedApps.filter(app => app['Last Updated'] >= dateRanges.oneMonthAgo) },
      { name: 'Last 3 Months', apps: parsedApps.filter(app => app['Last Updated'] >= dateRanges.threeMonthsAgo && app['Last Updated'] < dateRanges.oneMonthAgo) },
      { name: 'Last 6 Months', apps: parsedApps.filter(app => app['Last Updated'] >= dateRanges.sixMonthsAgo && app['Last Updated'] < dateRanges.threeMonthsAgo) },
      { name: 'Last Year', apps: parsedApps.filter(app => app['Last Updated'] >= dateRanges.oneYearAgo && app['Last Updated'] < dateRanges.sixMonthsAgo) },
      { name: '1-2 Years Ago', apps: parsedApps.filter(app => app['Last Updated'] >= dateRanges.twoYearsAgo && app['Last Updated'] < dateRanges.oneYearAgo) },
      { name: '2+ Years Ago', apps: parsedApps.filter(app => app['Last Updated'] < dateRanges.twoYearsAgo) }
    ];

    const recencyDistribution = updateRecencyCategories.map(category => ({
      name: category.name,
      value: category.apps.length
    }));

    const rawStaleButGoodApps = parsedApps
      .filter(app => app['Last Updated'] < dateRanges.oneYearAgo && app.Rating >= 4.0 && app.Reviews >= 100)
      .map(app => ({
        ...app,
        Installs: formatInstalls(app.Installs),
        'Days Since Update': Math.floor((now.getTime() - app['Last Updated'].getTime()) / (1000 * 60 * 60 * 24))
      }));

    const rawRecentlyUpdatedGoodApps = parsedApps
      .filter(app => app['Last Updated'] >= dateRanges.sixMonthsAgo && app.Rating >= 4.5 && app.Reviews >= 1000)
      .map(app => ({
        ...app,
        Installs: formatInstalls(app.Installs),
        'Days Since Update': Math.floor((now.getTime() - app['Last Updated'].getTime()) / (1000 * 60 * 60 * 24))
      }));

    const rawCategoryUpdateAnalysis = [...new Set(parsedApps.map(app => app.Category))].map(category => {
      const categoryApps = parsedApps.filter(app => app.Category === category);
      const recentlyUpdatedCount = categoryApps.filter(app => app['Last Updated'] >= dateRanges.sixMonthsAgo).length;
      const updateRate = categoryApps.length > 0 ? (recentlyUpdatedCount / categoryApps.length) * 100 : 0;
      const avgRating = categoryApps.reduce((sum, app) => sum + app.Rating, 0) / categoryApps.length;

      return {
        Category: category,
        'Total Apps': categoryApps.length,
        'Recently Updated': recentlyUpdatedCount,
        'Update Rate %': Number(updateRate.toFixed(1)),
        'Avg Rating': Number(avgRating.toFixed(2))
      };
    });

    const monthlyTrends = (() => {
      const trends = [];
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);
        const monthApps = parsedApps.filter(app => app['Last Updated'] >= monthDate && app['Last Updated'] < nextMonth);

        trends.push({
          name: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          value: monthApps.length
        });
      }
      return trends;
    })();

    return {
      recencyDistribution,
      rawCategoryUpdateAnalysis,
      rawRecentlyUpdatedGoodApps,
      rawStaleButGoodApps,
      monthlyTrends
    };
  }, [parsedApps, now, dateRanges]);

  // Reusable sorting function
  const getSortValue = (item: any, key: string) => {
    const value = item[key];
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value.toLowerCase();
    return value;
  };

  const getSortedData = (data: any[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const valA = getSortValue(a, sortBy);
      const valB = getSortValue(b, sortBy);
      if (sortOrder === 'asc') {
        return valA < valB ? -1 : 1;
      } else {
        return valA > valB ? -1 : 1;
      }
    });
  };

  const sortedCategoryUpdateAnalysis = useMemo(() => getSortedData(rawCategoryUpdateAnalysis, sortByCategoryUpdate, sortOrderCategoryUpdate).slice(0, 20), [rawCategoryUpdateAnalysis, sortByCategoryUpdate, sortOrderCategoryUpdate]);
  const sortedStaleButGoodApps = useMemo(() => getSortedData(rawStaleButGoodApps, sortByStaleApp, sortOrderStaleApp).slice(0, 30), [rawStaleButGoodApps, sortByStaleApp, sortOrderStaleApp]);
  const sortedRecentlyUpdatedGoodApps = useMemo(() => getSortedData(rawRecentlyUpdatedGoodApps, sortByRecentApp, sortOrderRecentApp).slice(0, 30), [rawRecentlyUpdatedGoodApps, sortByRecentApp, sortOrderRecentApp]);


  // Statistics
  const totalAppsWithDates = parsedApps.length;
  const recentlyUpdated = recencyDistribution[0]?.value + recencyDistribution[1]?.value || 0;
  const staleApps = recencyDistribution[4]?.value + recencyDistribution[5]?.value || 0;
  const updateRate = totalAppsWithDates > 0 ? (recentlyUpdated / totalAppsWithDates) * 100 : 0;


  // Data for the InsightsCard component
  const recencyInsightsData = useMemo(() => [
    {
      id: 'total-apps-analyzed',
      label: 'Apps with Update Data',
      value: totalAppsWithDates.toLocaleString(),
      description: `Analysis based on ${totalAppsWithDates.toLocaleString()} applications with valid update dates.`,
      colorClass: 'bg-purple-500',
      icon: Clock,
    },
    {
      id: 'recent-update-rate',
      label: 'Recent Update Rate',
      value: `${updateRate.toFixed(1)}%`,
      description: `${updateRate.toFixed(1)}% of apps have been updated in the last 3 months, indicating active maintenance.`,
      colorClass: 'bg-green-500',
      icon: TrendingUp,
    },
    {
      id: 'stale-apps-count',
      label: 'Stale Apps (1+ Year Old)',
      value: staleApps.toLocaleString(),
      description: `${staleApps.toLocaleString()} applications have not received an update in over a year, potentially indicating abandonment.`,
      colorClass: 'bg-orange-500',
      icon: AlertTriangle,
    },
    {
      id: 'highest-update-category',
      label: 'Most Actively Updated Category',
      value: sortedCategoryUpdateAnalysis[0]?.Category || 'N/A',
      description: `${sortedCategoryUpdateAnalysis[0]?.Category || 'No data'} leads with a ${sortedCategoryUpdateAnalysis[0]?.['Update Rate %'] || '0.0'}% recent update rate.`,
      colorClass: 'bg-blue-500',
      icon: Calendar,
    },
    {
      id: 'stale-but-good',
      label: 'High-Quality but Stale Apps',
      value: rawStaleButGoodApps.length.toLocaleString(),
      description: `${rawStaleButGoodApps.length.toLocaleString()} highly-rated apps (${rawStaleButGoodApps.length > 0 ? rawStaleButGoodApps[0].Rating?.toFixed(1) : 'N/A'}+ avg) have not been updated recently.`,
      colorClass: 'bg-amber-500',
      icon: ThumbsUp,
    },
    {
      id: 'recently-updated-high-performing',
      label: 'Top Performing Recent Updates',
      value: rawRecentlyUpdatedGoodApps.length.toLocaleString(),
      description: `${rawRecentlyUpdatedGoodApps.length.toLocaleString()} apps with 4.5+ rating updated recently, showing strong developer engagement.`,
      colorClass: 'bg-rose-500',
      icon: MessageSquare,
    },
  ], [totalAppsWithDates, updateRate, staleApps, sortedCategoryUpdateAnalysis, rawStaleButGoodApps, rawRecentlyUpdatedGoodApps]);


  // --- START: Common Render Cell Functions for DataTables ---
  const appNameRenderCell = (item: { App: string; Category?: string }) => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-md text-gray-600">
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate" title={item.App}>
          {item.App}
        </p>
        {item.Category && (
          <p className="text-xs text-gray-500 truncate">{item.Category}</p>
        )}
      </div>
    </div>
  );

  const categoryRenderCell = (item: { Category: string }) => (
    <span className="text-gray-700 font-medium">{item.Category}</span>
  );

  const ratingRenderCell = (item: { Rating: number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (item.Rating || 0) >= 4.0 ? 'bg-green-100 text-green-800' :
      (item.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {item.Rating?.toFixed(1) || 'N/A'}
    </span>
  );

  const installsRenderCell = (item: { Installs: string }) => (
    <span className="font-mono text-gray-800">{item.Installs}</span>
  );

  const lastUpdatedRenderCell = (item: { 'Last Updated': Date }) => (
    <span className="text-sm text-gray-700">{item['Last Updated'].toLocaleDateString()}</span>
  );

  const reviewsRenderCell = (item: { Reviews: number }) => (
    <span className="font-mono text-gray-800">{item.Reviews.toLocaleString()}</span>
  );

  const daysSinceUpdateRenderCell = (item: { 'Days Since Update': number }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      item['Days Since Update'] <= 365 ? 'bg-green-100 text-green-800' :
      item['Days Since Update'] <= 730 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {item['Days Since Update']} days
    </span>
  );

  const updateRateRenderCell = (item: { 'Update Rate %': number }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      item['Update Rate %'] >= 70 ? 'bg-lime-100 text-lime-800' :
      item['Update Rate %'] >= 40 ? 'bg-yellow-100 text-yellow-800' :
      'bg-orange-100 text-orange-800'
    }`}>
      {item['Update Rate %'].toFixed(1)}%
    </span>
  );

  const totalAppsRenderCell = (item: { 'Total Apps': number }) => (
    <span className="font-mono text-gray-800">{item['Total Apps'].toLocaleString()}</span>
  );

  const recentlyUpdatedCountRenderCell = (item: { 'Recently Updated': number }) => (
    <span className="font-mono text-blue-700">{item['Recently Updated'].toLocaleString()}</span>
  );
  // --- END: Common Render Cell Functions ---


  const categoryUpdateAnalysisColumns = useMemo(() => [
    { key: 'Category', label: 'Category', sortable: true, renderCell: categoryRenderCell, textAlign: 'left' },
    { key: 'Total Apps', label: 'Total Apps', sortable: true, renderCell: totalAppsRenderCell, textAlign: 'right' },
    { key: 'Recently Updated', label: 'Recent Updates', sortable: true, renderCell: recentlyUpdatedCountRenderCell, textAlign: 'right' },
    { key: 'Update Rate %', label: 'Update Rate %', sortable: true, renderCell: updateRateRenderCell, textAlign: 'right' },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true, renderCell: ratingRenderCell, textAlign: 'right' }
  ], []);

  const appColumns = useMemo(() => [
    { key: 'App', label: 'App Name', sortable: true, renderCell: appNameRenderCell, textAlign: 'left' },
    { key: 'Category', label: 'Category', sortable: true, renderCell: categoryRenderCell, textAlign: 'left' },
    { key: 'Rating', label: 'Rating', sortable: true, renderCell: ratingRenderCell, textAlign: 'right' },
    { key: 'Reviews', label: 'Reviews', sortable: true, renderCell: reviewsRenderCell, textAlign: 'right' },
    { key: 'Installs', label: 'Installs', sortable: true, renderCell: installsRenderCell, textAlign: 'right' },
    { key: 'Last Updated', label: 'Last Updated', sortable: true, renderCell: lastUpdatedRenderCell, textAlign: 'center' },
    { key: 'Days Since Update', label: 'Days Ago', sortable: true, renderCell: daysSinceUpdateRenderCell, textAlign: 'right' }
  ], []);

  // --- Conditional return for loading state MUST COME AFTER ALL HOOKS ---
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
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">App Update Recency Dashboard</h1>
        <p className="text-amber-100">
          Track app maintenance patterns, identify stale apps, and analyze update frequency trends
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Recent Update Rate"
          value={`${updateRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Updated Last 3 Months"
          value={recentlyUpdated.toLocaleString()}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Stale Apps (1+ years)"
          value={staleApps.toLocaleString()}
          icon={AlertTriangle}
          color="orange"
        />
        <StatsCard
          title="Apps with Date Data"
          value={totalAppsWithDates.toLocaleString()}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <PieChartComponent
          data={recencyDistribution}
          title="Update Recency Distribution"
          height={400}
        />
        <BarChartComponent
          data={monthlyTrends}
          title="Monthly Update Trends (Last 12 Months)"
          height={400}
          color="#F59E0B"
        />
      </div>

      {/* Category Update Analysis Table Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Category Update Analysis (Top 20)
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByCategoryUpdate}
              onChange={(e) => setSortByCategoryUpdate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="Update Rate %">📈 Update Rate %</option>
              <option value="Total Apps">📊 Total Apps</option>
              <option value="Recently Updated">🆕 Recent Updates</option>
              <option value="Avg Rating">⭐ Avg Rating</option>
            </select>
            <button
              onClick={() => setSortOrderCategoryUpdate(sortOrderCategoryUpdate === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm"
            >
              {sortOrderCategoryUpdate === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
        <DataTable
          data={sortedCategoryUpdateAnalysis}
          columns={categoryUpdateAnalysisColumns}
          title=""
          pageSize={10}
          showPagination={true}
          enableSorting={false}
          initialSortBy={sortByCategoryUpdate}
          initialSortDirection={sortOrderCategoryUpdate}
          showRankColumn={true}
        />
      </div>

      {/* App Tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recently Updated High-Performing Apps Table Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Recently Updated High-Performing Apps (4.5+ rating, 1000+ reviews)
            </h3>
            <div className="flex space-x-2">
              <select
                value={sortByRecentApp}
                onChange={(e) => setSortByRecentApp(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="Last Updated">🗓️ Last Updated</option>
                <option value="Rating">⭐ Rating</option>
                <option value="Reviews">💬 Reviews</option>
                <option value="Installs">⬇️ Installs</option>
              </select>
              <button
                onClick={() => setSortOrderRecentApp(sortOrderRecentApp === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                {sortOrderRecentApp === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          <DataTable
            data={sortedRecentlyUpdatedGoodApps}
            columns={appColumns}
            title=""
            pageSize={10}
            showPagination={true}
            enableSorting={false}
            initialSortBy={sortByRecentApp}
            initialSortDirection={sortOrderRecentApp}
            showRankColumn={true}
          />
        </div>

        {/* Stale but High-Quality Apps Table Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Stale but High-Quality Apps (4.0+ rating, not updated in 1+ year)
            </h3>
            <div className="flex space-x-2">
              <select
                value={sortByStaleApp}
                onChange={(e) => setSortByStaleApp(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Days Since Update">⏳ Days Since Update</option>
                <option value="Rating">⭐ Rating</option>
                <option value="Reviews">💬 Reviews</option>
                <option value="Installs">⬇️ Installs</option>
              </select>
              <button
                onClick={() => setSortOrderStaleApp(sortOrderStaleApp === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
              >
                {sortOrderStaleApp === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          <DataTable
            data={sortedStaleButGoodApps}
            columns={appColumns}
            title=""
            pageSize={10}
            showPagination={true}
            enableSorting={false}
            initialSortBy={sortByStaleApp}
            initialSortDirection={sortOrderStaleApp}
            showRankColumn={true}
          />
        </div>
      </div>

      {/* Insights - Now using InsightsCard component */}
      <InsightsCard
        title="Key Update Recency Insights"
        insights={recencyInsightsData}
      />
    </div>
  );
};

export default UpdateRecencyPage;