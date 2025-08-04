// src/pages/InstallsAnalysisPage.tsx
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import {
  Download,
  TrendingUp,
  Smartphone,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import {
  getInstallsDistribution,
  parseInstalls,
  formatInstalls
} from '../utils/dataTransformers';

// Define AppData interface if not globally available, ensuring InstallsNumeric is present
interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  'Last Updated': string;
  Installs: string | null;
  Reviews: string;
  InstallsNumeric: number; // Ensure this is always available
  ReviewsNumeric: number;
  EngagementRate: number;
  Price: string;
  Size: string;
  'Content Rating': string;
  Genres: string;
  Type: string;
  index?: number;
}

const InstallsAnalysisPage: React.FC = () => {
  const { filteredApps, loading, fetchApps } = useData();

  // State for table sorting controls
  const [sortByInstallsTable, setSortByInstallsTable] = useState<string>('Installs');
  const [sortOrderInstallsTable, setSortOrderInstallsTable] = useState<'desc' | 'asc'>('desc');

  // --- NEW DEDUPLICATION STEP ---
  const deduplicatedApps = useMemo(() => {
    const seenAppNames = new Set<string>();
    const uniqueApps: AppData[] = [];
    // Iterate in reverse to keep the 'latest' or 'highest value' if multiple criteria exist
    // For simplicity, this will just take the first unique app by name encountered.
    // If you need specific logic (e.g., keep the one with highest installs if duplicate names),
    // you'd need a more complex reduce or sort-and-filter approach.
    for (let i = filteredApps.length - 1; i >= 0; i--) {
        const app = filteredApps[i];
        if (!seenAppNames.has(app.App)) {
            seenAppNames.add(app.App);
            uniqueApps.unshift(app); // Add to the beginning to maintain original relative order of unique items
        }
    }
    // Alternatively, if you want to prioritize, for example, the entry with the highest installs:
    // const appMap = new Map<string, AppData>();
    // filteredApps.forEach(app => {
    //     const existing = appMap.get(app.App);
    //     if (!existing || parseInstalls(app.Installs || '0') > parseInstalls(existing.Installs || '0')) {
    //         appMap.set(app.App, app);
    //     }
    // });
    // return Array.from(appMap.values());

    return uniqueApps;
  }, [filteredApps]);
  // --- END DEDUPLICATION STEP ---


  // Memoized data for charts and stats (now using deduplicatedApps)
  const installsDistribution = useMemo(() => getInstallsDistribution(deduplicatedApps), [deduplicatedApps]);

  const installRatingData = useMemo(() => {
    return deduplicatedApps
      .filter(app => (app.Rating || 0) > 0 && parseInstalls(app.Installs || '0') > 0)
      .map(app => ({
        rating: app.Rating || 0,
        installs: parseInstalls(app.Installs || '0'),
        name: app.App
      }))
      .slice(0, 500);
  }, [deduplicatedApps]);

  const freeAppsInstalls = useMemo(() => deduplicatedApps
    .filter(app => app.Type === 'Free')
    .reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0), [deduplicatedApps]);

  const paidAppsInstalls = useMemo(() => deduplicatedApps
    .filter(app => app.Type === 'Paid')
    .reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0), [deduplicatedApps]);

  const totalMarketInstalls = freeAppsInstalls + paidAppsInstalls;

  const freeVsPaidData = useMemo(() => [
    { name: 'Free Apps', value: freeAppsInstalls },
    { name: 'Paid Apps', value: paidAppsInstalls }
  ], [freeAppsInstalls, paidAppsInstalls]);

  const totalAppsCount = useMemo(() => deduplicatedApps.length, [deduplicatedApps]); // Use deduplicatedApps
  const totalInstalls = useMemo(() => deduplicatedApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0), [deduplicatedApps]); // Use deduplicatedApps
  const averageInstalls = useMemo(() => totalAppsCount > 0 ? totalInstalls / totalAppsCount : 0, [totalAppsCount, totalInstalls]);
  const freeAppsCount = useMemo(() => deduplicatedApps.filter(app => app.Type === 'Free').length, [deduplicatedApps]); // Use deduplicatedApps

  // Prepare data for the Top Apps Table, including numeric installs for sorting
  const rawTopAppsTableData = useMemo(() => {
    return deduplicatedApps // Now using deduplicatedApps here
      .filter(app => parseInstalls(app.Installs || '0') > 0)
      .map(app => ({
        App: app.App,
        Category: app.Category,
        Installs: app.Installs,
        _installsNumeric: parseInstalls(app.Installs || '0'),
        Rating: app.Rating,
        Type: app.Type,
        Genres: app.Genres
      }));
  }, [deduplicatedApps]);

  const sortedTopInstalledApps = useMemo(() => {
    return [...rawTopAppsTableData].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortByInstallsTable === 'App' || sortByInstallsTable === 'Category' || sortByInstallsTable === 'Type') {
        valA = a[sortByInstallsTable as keyof typeof a];
        valB = b[sortByInstallsTable as keyof typeof b];
        return sortOrderInstallsTable === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortByInstallsTable === 'Installs') {
        valA = a._installsNumeric;
        valB = b._installsNumeric;
      } else { // 'Rating'
        valA = a[sortByInstallsTable as keyof typeof a] || 0;
        valB = b[sortByInstallsTable as keyof typeof b] || 0;
      }

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderInstallsTable === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderInstallsTable === 'asc' ? -Infinity : Infinity);

      if (sortOrderInstallsTable === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 20);
  }, [rawTopAppsTableData, sortByInstallsTable, sortOrderInstallsTable]);

  const topApp = sortedTopInstalledApps[0];

  const keyInsights = useMemo(() => [
    {
      id: 'most-popular-install-range',
      label: 'Most Popular Install Range',
      value: installsDistribution.length > 0
        ? installsDistribution.reduce((max, current) =>
            current.value > max.value ? current : max
          ).name
        : 'N/A',
      description: installsDistribution.length > 0
        ? `${installsDistribution.reduce((max, current) => current.value > max.value ? current : max).name} has the most apps`
        : 'No data available',
      colorClass: 'bg-green-500',
    },
    {
      id: 'free-vs-paid-dominance',
      label: 'Free vs Paid Dominance',
      value: `${totalMarketInstalls > 0 ? ((freeAppsInstalls / totalMarketInstalls) * 100).toFixed(1) : '0.0'}% Free`,
      description: `Free apps account for ${totalMarketInstalls > 0 ? ((freeAppsInstalls / totalMarketInstalls) * 100).toFixed(1) : '0.0'}% of total installs`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'top-performer',
      label: 'Top Performer',
      value: topApp?.App || 'N/A',
      description: `${topApp?.App || 'N/A'} leads with ${formatInstalls(parseInstalls(topApp?.Installs || '0'))} installs`,
      colorClass: 'bg-purple-500',
    },
    {
      id: 'market-distribution',
      label: 'Market Distribution',
      value: `${installsDistribution.filter(d => d.value > 0).length}`,
      description: `${installsDistribution.filter(d => d.value > 0).length} different install ranges represented`,
      colorClass: 'bg-orange-500',
    },
  ], [installsDistribution, totalMarketInstalls, freeAppsInstalls, topApp]);


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

  const categoryRenderCell = (app: { Category: string }) => (
    <span className="text-gray-700">{app.Category}</span>
  );

  const installsRenderCell = (app: { Installs: string }) => (
    <span className="font-mono text-indigo-700">
      {app.Installs}
    </span>
  );

  const ratingRenderCell = (app: { Rating: number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (app.Rating || 0) >= 4.0 ? 'bg-green-100 text-green-800' :
      (app.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {app.Rating?.toFixed(1) || 'N/A'}
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
    { key: 'Category', label: 'Category', renderCell: categoryRenderCell, textAlign: 'left' },
    { key: 'Installs', label: 'Installs', renderCell: installsRenderCell, textAlign: 'right' },
    { key: 'Rating', label: 'Rating', renderCell: ratingRenderCell, textAlign: 'right' },
    { key: 'Type', label: 'Type', renderCell: typeRenderCell, textAlign: 'center' }
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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Installs Analysis</h1>
        <p className="text-green-100">
          Deep dive into app installation patterns and popularity metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Installs"
          value={formatInstalls(totalInstalls)}
          icon={Download}
          color="green"
        />
        <StatsCard
          title="Average Installs"
          value={formatInstalls(averageInstalls)}
          icon={TrendingUp}
          color="blue"
        />
        {/* Corrected: The comment was causing the syntax error */}
        <StatsCard
          title="Top App Installs"
          value={topApp ? formatInstalls(parseInstalls(topApp.Installs || '0')) : 'N/A'}
          icon={Smartphone}
          color="purple"
        />
        <StatsCard
          title="Free Apps Ratio"
          value={`${totalAppsCount > 0 ? ((freeAppsCount / totalAppsCount) * 100).toFixed(1) : '0.0'}%`}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <BarChartComponent
          data={installsDistribution}
          title="Install Distribution (Binned)"
          height={400}
          color="#10B981"
        />
        <PieChartComponent
          data={freeVsPaidData}
          title="Free vs Paid App Installs"
          height={400}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <ScatterPlot
          data={installRatingData}
          title="Installs vs Rating Correlation"
          xAxisKey="installs"
          yAxisKey="rating"
          xAxisLabel="Installs"
          yAxisLabel="Rating"
          height={400}
          color="#3B82F6"
        />
      </div>

      {/* Top Apps Table - ENHANCED UX */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Top 20 Apps by Installs
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByInstallsTable}
              onChange={(e) => setSortByInstallsTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Installs">📈 Installs</option>
              <option value="App">📱 App Name</option>
              <option value="Category">🏷️ Category</option>
              <option value="Rating">⭐ Rating</option>
              <option value="Type">💲 Type</option>
            </select>
            <button
              onClick={() => setSortOrderInstallsTable(sortOrderInstallsTable === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderInstallsTable === 'desc' ? '↓' : '↑'}
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
          data={sortedTopInstalledApps}
          columns={tableColumns}
          title=""
          pageSize={20}
          showPagination={true}
          enableSorting={false}
          initialSortBy={sortByInstallsTable}
          initialSortDirection={sortOrderInstallsTable}
          showRankColumn={true}
        />
      </div>

      {/* Insights - Now using InsightsCard */}
      <InsightsCard
        title="Key Insights"
        insights={keyInsights}
      />
    </div>
  );
};

export default InstallsAnalysisPage;