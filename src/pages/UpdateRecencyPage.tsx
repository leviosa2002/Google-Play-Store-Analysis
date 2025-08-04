import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { Calendar, Clock, TrendingUp, AlertTriangle, MessageSquare, ThumbsUp } from 'lucide-react';
import { parseInstalls, formatInstalls } from '../utils/dataTransformers';

// --- START: Added Interfaces for better type safety ---
interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  Reviews: number;
  Installs: string;
  'Last Updated': string;
  Size: string;
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
  Rating: number | null;
  Reviews: number;
  Installs: string;
  'Last Updated': string;
  'Days Since Update': number;
}
// --- END: Added Interfaces ---

const UpdateRecencyPage: React.FC = () => {
  // --- ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL, UNCONDITIONALLY ---
  const { filteredApps, loading } = useData();

  // State for table controls
  const [sortByCategoryUpdate, setSortByCategoryUpdate] = useState<string>('Update Rate %');
  const [sortOrderCategoryUpdate, setSortOrderCategoryUpdate] = useState<'asc' | 'desc'>('desc');
  const [sortByRecentApp, setSortByRecentApp] = useState<string>('Last Updated');
  const [sortOrderRecentApp, setSortOrderRecentApp] = useState<'asc' | 'desc'>('desc');
  const [sortByStaleApp, setSortByStaleApp] = useState<string>('Days Since Update');
  const [sortOrderStaleApp, setSortOrderStaleApp] = useState<'asc' | 'desc'>('desc');

  // Memoized date calculations
  const now = useMemo(() => new Date(), []);
  const oneMonthAgo = useMemo(() => new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()), [now]);
  const threeMonthsAgo = useMemo(() => new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()), [now]);
  const sixMonthsAgo = useMemo(() => new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), [now]);
  const oneYearAgo = useMemo(() => new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), [now]);
  const twoYearsAgo = useMemo(() => new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()), [now]);

  // Filter apps with valid dates (this depends on `filteredApps` which comes from `useData`)
  const appsWithDates = useMemo(() => {
    return filteredApps.filter((app: AppData) => {
      const date = new Date(app['Last Updated']);
      return !isNaN(date.getTime()) && date.getFullYear() >= 2010;
    });
  }, [filteredApps]);

  // Categorize apps by update recency
  const updateRecencyCategories = useMemo(() => [
    { name: 'Last Month', apps: appsWithDates.filter(app => new Date(app['Last Updated']) >= oneMonthAgo) },
    { name: 'Last 3 Months', apps: appsWithDates.filter(app => { const date = new Date(app['Last Updated']); return date >= threeMonthsAgo && date < oneMonthAgo; }) },
    { name: 'Last 6 Months', apps: appsWithDates.filter(app => { const date = new Date(app['Last Updated']); return date >= sixMonthsAgo && date < threeMonthsAgo; }) },
    { name: 'Last Year', apps: appsWithDates.filter(app => { const date = new Date(app['Last Updated']); return date >= oneYearAgo && date < sixMonthsAgo; }) },
    { name: '1-2 Years Ago', apps: appsWithDates.filter(app => { const date = new Date(app['Last Updated']); return date >= twoYearsAgo && date < oneYearAgo; }) },
    { name: '2+ Years Ago', apps: appsWithDates.filter(app => new Date(app['Last Updated']) < twoYearsAgo) }
  ], [appsWithDates, oneMonthAgo, threeMonthsAgo, sixMonthsAgo, oneYearAgo, twoYearsAgo]);

  const recencyDistribution = useMemo(() => {
    return updateRecencyCategories.map(category => ({
      name: category.name,
      value: category.apps.length
    }));
  }, [updateRecencyCategories]);

  // Raw and Sorted Stale But Good Apps
  const rawStaleButGoodApps = useMemo(() => {
    return appsWithDates
      .filter((app: AppData) => {
        const date = new Date(app['Last Updated']);
        return date < oneYearAgo && app.Rating >= 4.0 && app.Reviews >= 100;
      })
      .map((app: AppData) => ({
        App: app.App,
        Category: app.Category,
        Rating: app.Rating,
        Reviews: app.Reviews,
        Installs: formatInstalls(parseInstalls(app.Installs || '0')),
        'Last Updated': app['Last Updated'],
        'Days Since Update': Math.floor((now.getTime() - new Date(app['Last Updated']).getTime()) / (1000 * 60 * 60 * 24))
      }));
  }, [appsWithDates, oneYearAgo, now]);

  const sortedStaleButGoodApps = useMemo(() => {
    return [...rawStaleButGoodApps].sort((a, b) => {
      let valA: any = a[sortByStaleApp as keyof AppUpdateDetail];
      let valB: any = b[sortByStaleApp as keyof AppUpdateDetail];

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderStaleApp === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderStaleApp === 'asc' ? -Infinity : Infinity);

      if (sortOrderStaleApp === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 30);
  }, [rawStaleButGoodApps, sortByStaleApp, sortOrderStaleApp]);

  // Raw and Sorted Recently Updated High-Performing Apps
  const rawRecentlyUpdatedGoodApps = useMemo(() => {
    return appsWithDates
      .filter((app: AppData) => {
        const date = new Date(app['Last Updated']);
        return date >= sixMonthsAgo && app.Rating >= 4.5 && app.Reviews >= 1000;
      })
      .map((app: AppData) => ({
        App: app.App,
        Category: app.Category,
        Rating: app.Rating,
        Reviews: app.Reviews,
        Installs: formatInstalls(parseInstalls(app.Installs || '0')),
        'Last Updated': app['Last Updated'],
        'Days Since Update': Math.floor((now.getTime() - new Date(app['Last Updated']).getTime()) / (1000 * 60 * 60 * 24))
      }));
  }, [appsWithDates, sixMonthsAgo, now]);

  const sortedRecentlyUpdatedGoodApps = useMemo(() => {
    return [...rawRecentlyUpdatedGoodApps].sort((a, b) => {
      let valA: any = a[sortByRecentApp as keyof AppUpdateDetail];
      let valB: any = b[sortByRecentApp as keyof AppUpdateDetail];

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderRecentApp === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderRecentApp === 'asc' ? -Infinity : Infinity);

      if (sortByRecentApp === 'Last Updated') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (sortOrderRecentApp === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 30);
  }, [rawRecentlyUpdatedGoodApps, sortByRecentApp, sortOrderRecentApp]);

  // Raw and Sorted Category Update Analysis
  const rawCategoryUpdateAnalysis = useMemo(() => {
    return [...new Set(filteredApps.map((app: AppData) => app.Category))].map(category => {
      const categoryApps = appsWithDates.filter((app: AppData) => app.Category === category);
      const recentlyUpdatedCount = categoryApps.filter(app => new Date(app['Last Updated']) >= sixMonthsAgo).length;
      const updateRate = categoryApps.length > 0 ? (recentlyUpdatedCount / categoryApps.length) * 100 : 0;
      const avgRating = categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length;

      return {
        Category: category,
        'Total Apps': categoryApps.length,
        'Recently Updated': recentlyUpdatedCount,
        'Update Rate %': Number(updateRate.toFixed(1)),
        'Avg Rating': Number(avgRating.toFixed(2))
      };
    });
  }, [filteredApps, appsWithDates, sixMonthsAgo]);

  const sortedCategoryUpdateAnalysis = useMemo(() => {
    return [...rawCategoryUpdateAnalysis].sort((a, b) => {
      let valA: any = a[sortByCategoryUpdate as keyof CategoryUpdateAnalysis];
      let valB: any = b[sortByCategoryUpdate as keyof CategoryUpdateAnalysis];

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderCategoryUpdate === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderCategoryUpdate === 'asc' ? -Infinity : Infinity);

      if (sortOrderCategoryUpdate === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 20);
  }, [rawCategoryUpdateAnalysis, sortByCategoryUpdate, sortOrderCategoryUpdate]);

  // Monthly update trends (last 12 months)
  const monthlyTrends = useMemo(() => {
    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthApps = appsWithDates.filter(app => {
        const appDate = new Date(app['Last Updated']);
        return appDate >= monthDate && appDate < nextMonth;
      });

      trends.push({
        name: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        value: monthApps.length
      });
    }
    return trends;
  }, [appsWithDates, now]);


  // Statistics
  const totalAppsWithDates = appsWithDates.length;
  const recentlyUpdated = updateRecencyCategories[0].apps.length + updateRecencyCategories[1].apps.length;
  const staleApps = updateRecencyCategories[4].apps.length + updateRecencyCategories[5].apps.length;
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
      value: sortedStaleButGoodApps.length.toLocaleString(),
      description: `${sortedStaleButGoodApps.length.toLocaleString()} highly-rated apps (${sortedStaleButGoodApps.length > 0 ? sortedStaleButGoodApps[0].Rating?.toFixed(1) : 'N/A'}+ avg) have not been updated recently.`,
      colorClass: 'bg-amber-500',
      icon: ThumbsUp,
    },
    {
      id: 'recently-updated-high-performing',
      label: 'Top Performing Recent Updates',
      value: sortedRecentlyUpdatedGoodApps.length.toLocaleString(),
      description: `${sortedRecentlyUpdatedGoodApps.length.toLocaleString()} apps with 4.5+ rating updated recently, showing strong developer engagement.`,
      colorClass: 'bg-rose-500',
      icon: MessageSquare,
    },
  ], [totalAppsWithDates, updateRate, staleApps, sortedCategoryUpdateAnalysis, sortedStaleButGoodApps, sortedRecentlyUpdatedGoodApps]);


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

  const lastUpdatedRenderCell = (item: { 'Last Updated': string }) => (
    <span className="text-sm text-gray-700">{item['Last Updated']}</span>
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

      {/* !!! START: Modified Category Update Analysis Table Section for consistent UX !!! */}
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
          // Title handled by external h3
          pageSize={10} // Adjusted pageSize for better view
          showPagination={true}
          enableSorting={false} // External sorting
          initialSortBy={sortByCategoryUpdate}
          initialSortDirection={sortOrderCategoryUpdate}
          showRankColumn={true}
        />
      </div>
      {/* !!! END: Modified Category Update Analysis Table Section !!! */}

      {/* App Tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* !!! START: Modified Recently Updated High-Performing Apps Table Section !!! */}
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
        {/* !!! END: Modified Recently Updated High-Performing Apps Table Section !!! */}

        {/* !!! START: Modified Stale but High-Quality Apps Table Section !!! */}
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
        {/* !!! END: Modified Stale but High-Quality Apps Table Section !!! */}
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