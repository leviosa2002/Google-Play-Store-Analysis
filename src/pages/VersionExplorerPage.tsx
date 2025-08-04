// src/pages/VersionExplorerPage.tsx
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard'; // Import InsightsCard
import { Smartphone, Code, Star, BarChart3, RefreshCw, FileText } from 'lucide-react'; // Import RefreshCw, FileText
import { getAndroidVersionDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

// Define AppData interface if not globally available
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
  'Current Ver': string | number | null; // Can be string like 'Varies with device' or number like '1.0'
  'Android Ver': string | null; // Can be string like '4.0 and up' or null
  index?: number;
}

const VersionExplorerPage: React.FC = () => {
  const { filteredApps, loading, fetchApps } = useData(); // Destructure fetchApps

  // --- NEW DEDUPLICATION STEP ---
  const deduplicatedApps = useMemo(() => {
    const seenAppNames = new Set<string>();
    const uniqueApps: AppData[] = [];
    // Iterate in reverse to keep the first unique app by name, assuming data might be pre-sorted
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

  // State for "Android Version Analysis" table sorting
  const [sortByAndroidVerTable, setSortByAndroidVerTable] = useState<string>('App Count');
  const [sortOrderAndroidVerTable, setSortOrderAndroidVerTable] = useState<'desc' | 'asc'>('desc');

  // State for "Apps with Version Information" table sorting
  const [sortByAppsWithVersionsTable, setSortByAppsWithVersionsTable] = useState<string>('Rating');
  const [sortOrderAppsWithVersionsTable, setSortOrderAppsWithVersionsTable] = useState<'desc' | 'asc'>('desc');

  // Memoized data for charts and stats (now using deduplicatedApps)
  const androidVersionDistribution = useMemo(() => getAndroidVersionDistribution(deduplicatedApps), [deduplicatedApps]);

  // Current version analysis (raw, unsorted)
  const rawAppsWithVersions = useMemo(() => {
    return deduplicatedApps.filter(app =>
      typeof app['Current Ver'] === 'string' &&
      app['Current Ver'] &&
      app['Current Ver'] !== 'NaN' &&
      app['Current Ver'] !== 'Varies with device'
    ).map(app => {
      const versionString = typeof app['Current Ver'] === 'string' ? app['Current Ver'] : '';
      const isLatest = versionString && (
        versionString.includes('2018') ||
        versionString.includes('2019') ||
        versionString.includes('2020') ||
        parseFloat(versionString) >= 5.0
      );

      return {
        App: app.App,
        Category: app.Category,
        'Current Version': versionString || 'N/A',
        'Android Version': app['Android Ver'] || 'N/A',
        Rating: app.Rating,
        _ratingNumeric: app.Rating || 0, // Numeric for sorting
        Installs: formatInstalls(parseInstalls(app.Installs || '0')),
        _installsNumeric: parseInstalls(app.Installs || '0'), // Numeric for sorting
        'Last Updated': app['Last Updated'],
        'Is Recent': isLatest ? 'Yes' : 'No'
      };
    });
  }, [deduplicatedApps]);

  // Apply sorting to appsWithVersions
  const sortedAppsWithVersions = useMemo(() => {
    return [...rawAppsWithVersions].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortByAppsWithVersionsTable === 'App' || sortByAppsWithVersionsTable === 'Category' ||
          sortByAppsWithVersionsTable === 'Current Version' || sortByAppsWithVersionsTable === 'Android Version' ||
          sortByAppsWithVersionsTable === 'Last Updated' || sortByAppsWithVersionsTable === 'Is Recent') {
        valA = a[sortByAppsWithVersionsTable as keyof typeof a];
        valB = b[sortByAppsWithVersionsTable as keyof typeof b];
        return sortOrderAppsWithVersionsTable === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      } else if (sortByAppsWithVersionsTable === 'Rating') {
        valA = a._ratingNumeric;
        valB = b._ratingNumeric;
      } else if (sortByAppsWithVersionsTable === 'Installs') {
        valA = a._installsNumeric;
        valB = b._installsNumeric;
      }

      valA = valA ?? (sortOrderAppsWithVersionsTable === 'asc' ? -Infinity : Infinity);
      valB = valB ?? (sortOrderAppsWithVersionsTable === 'asc' ? -Infinity : Infinity);

      if (sortOrderAppsWithVersionsTable === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 100); // Still slice to top 100 AFTER sorting
  }, [rawAppsWithVersions, sortByAppsWithVersionsTable, sortOrderAppsWithVersionsTable]);


  // Android version requirements analysis (raw, unsorted)
  const rawAndroidVersionAnalysis = useMemo(() => {
    return androidVersionDistribution.map(version => {
      const versionApps = deduplicatedApps.filter(app => app['Android Ver'] === version.name);
      const avgRating = versionApps.length > 0 ? versionApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / versionApps.length : 0;
      const totalInstalls = versionApps.length > 0 ? versionApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0) : 0;
      const freeApps = versionApps.filter(app => app.Type === 'Free').length;
      const freePercentage = versionApps.length > 0 ? (freeApps / versionApps.length) * 100 : 0;

      return {
        'Android Version': version.name,
        'App Count': version.value,
        '_appCountNumeric': version.value,
        'Avg Rating': Number(avgRating.toFixed(2)),
        '_avgRatingNumeric': avgRating,
        'Total Installs': formatInstalls(totalInstalls),
        '_totalInstallsNumeric': totalInstalls,
        'Free Apps %': Number(freePercentage.toFixed(1)),
        '_freeAppsPercentNumeric': freePercentage
      };
    });
  }, [deduplicatedApps, androidVersionDistribution]);

  // Apply sorting to androidVersionAnalysis
  const sortedAndroidVersionAnalysis = useMemo(() => {
    return [...rawAndroidVersionAnalysis].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortByAndroidVerTable) {
        case 'Android Version':
          valA = a['Android Version'];
          valB = b['Android Version'];
          return sortOrderAndroidVerTable === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
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
        default:
          return 0;
      }

      valA = valA ?? (sortOrderAndroidVerTable === 'asc' ? -Infinity : Infinity);
      valB = valB ?? (sortOrderAndroidVerTable === 'asc' ? -Infinity : Infinity);

      if (sortOrderAndroidVerTable === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [rawAndroidVersionAnalysis, sortByAndroidVerTable, sortOrderAndroidVerTable]);


  // Compatibility analysis - using deduplicatedApps
  const compatibilityLevels = useMemo(() => [
    { name: 'Legacy (2.x)', apps: deduplicatedApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('2.')).length },
    { name: 'Older (3.x)', apps: deduplicatedApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('3.')).length },
    { name: 'Standard (4.x)', apps: deduplicatedApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('4.')).length },
    { name: 'Modern (5.x+)', apps: deduplicatedApps.filter(app => typeof app['Android Ver'] === 'string' && (app['Android Ver'].includes('5.') || app['Android Ver'].includes('6.') || app['Android Ver'].includes('7.') || app['Android Ver'].includes('8.') || app['Android Ver'].includes('9.') || app['Android Ver'].includes('10.') || app['Android Ver'].includes('11.') || app['Android Ver'].includes('12.') || app['Android Ver'].includes('13.') || app['Android Ver'].includes('14.') || app['Android Ver'].includes('15.'))).length }, // Expanded modern versions
    { name: 'Variable', apps: deduplicatedApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('Varies')).length }
  ].filter(level => level.apps > 0).map(level => ({ name: level.name, value: level.apps })), [deduplicatedApps]);

  // Top apps by Android version requirement - using deduplicatedApps
  const topAppsByAndroidVersion = useMemo(() => {
    return ['4.0 and up', '4.1 and up', '5.0 and up', 'Varies with device'].map(version => {
      const versionApps = deduplicatedApps
        .filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'] === version && (app.Rating || 0) >= 4.0)
        .sort((a, b) => parseInstalls(b.Installs || '0') - parseInstalls(a.Installs || '0'))
        .slice(0, 5);

      return {
        version,
        apps: versionApps.map(app => ({
          App: app.App,
          Category: app.Category,
          Rating: app.Rating,
          Installs: formatInstalls(parseInstalls(app.Installs || '0')),
          'Current Ver': typeof app['Current Ver'] === 'string' ? app['Current Ver'] : 'N/A'
        }))
      };
    }).filter(group => group.apps.length > 0);
  }, [deduplicatedApps]);

  // Statistics - using deduplicatedApps
  const totalApps = useMemo(() => deduplicatedApps.length, [deduplicatedApps]);
  const appsWithVersionData = useMemo(() => deduplicatedApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'] && app['Android Ver'] !== 'Varies with device' && app['Android Ver'] !== 'NaN').length, [deduplicatedApps]);
  const modernApps = useMemo(() => deduplicatedApps.filter(app =>
    typeof app['Android Ver'] === 'string' && (
      app['Android Ver'].includes('5.') || app['Android Ver'].includes('6.') ||
      app['Android Ver'].includes('7.') || app['Android Ver'].includes('8.') ||
      app['Android Ver'].includes('9.') || app['Android Ver'].includes('10.') ||
      app['Android Ver'].includes('11.') || app['Android Ver'].includes('12.') ||
      app['Android Ver'].includes('13.') || app['Android Ver'].includes('14.') ||
      app['Android Ver'].includes('15.')
    )
  ).length, [deduplicatedApps]);
  const variableApps = useMemo(() => deduplicatedApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('Varies')).length, [deduplicatedApps]);

  const mostCommonVersion = useMemo(() => androidVersionDistribution.length > 0 ? androidVersionDistribution[0] : { name: 'N/A', value: 0 }, [androidVersionDistribution]);

  // Insights Card Data
  const versionInsights = useMemo(() => [
    {
      id: 'version-coverage',
      label: 'Version Data Coverage',
      value: `${((appsWithVersionData / (totalApps || 1)) * 100).toFixed(1)}%`,
      description: `${((appsWithVersionData / (totalApps || 1)) * 100).toFixed(1)}% of apps have specific Android version requirements listed.`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'modern-app-adoption',
      label: 'Modern Android Adoption',
      value: `${((modernApps / (totalApps || 1)) * 100).toFixed(1)}%`,
      description: `${((modernApps / (totalApps || 1)) * 100).toFixed(1)}% of apps require Android 5.0 (Lollipop) or higher.`,
      colorClass: 'bg-green-500',
    },
    {
      id: 'most-common-req',
      label: 'Most Common Requirement',
      value: mostCommonVersion?.name?.substring(0, 15) || 'N/A',
      description: `${mostCommonVersion.name} is the most frequently required Android version by apps (${mostCommonVersion.value} apps).`,
      colorClass: 'bg-purple-500',
    },
    {
      id: 'flexible-apps',
      label: 'Flexible Compatibility',
      value: `${((variableApps / (totalApps || 1)) * 100).toFixed(1)}%`,
      description: `${((variableApps / (totalApps || 1)) * 100).toFixed(1)}% of apps can adapt to various device Android versions.`,
      colorClass: 'bg-orange-500',
    },
  ], [appsWithVersionData, totalApps, modernApps, mostCommonVersion, variableApps]);


  // --- Render Cell Functions for all DataTables ---

  // For Android Version Analysis Table
  const androidVersionReqRenderCell = (item: { 'Android Version': string }) => (
    <span className="font-medium text-gray-800">{item['Android Version']}</span>
  );
  const appCountVerRenderCell = (item: { 'App Count': number }) => (
    <span className="font-mono text-gray-700">{item['App Count'].toLocaleString()}</span>
  );
  const avgRatingVerRenderCell = (item: { 'Avg Rating': number }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      item['Avg Rating'] >= 4.0 ? 'bg-green-100 text-green-800' :
      item['Avg Rating'] >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {item['Avg Rating'].toFixed(1)}
    </span>
  );
  const totalInstallsVerRenderCell = (item: { 'Total Installs': string }) => (
    <span className="font-mono text-indigo-700">{item['Total Installs']}</span>
  );
  const freeAppsPercentVerRenderCell = (item: { 'Free Apps %': number }) => (
    <span className="font-mono text-teal-700">{item['Free Apps %'].toFixed(1)}%</span>
  );

  // Columns for the "Android Version Requirements Analysis" table
  const tableColumns = useMemo(() => [
    { key: 'Android Version', label: 'Android Version', renderCell: androidVersionReqRenderCell, textAlign: 'left' },
    { key: 'App Count', label: 'Apps', renderCell: appCountVerRenderCell, textAlign: 'right' },
    { key: 'Avg Rating', label: 'Avg Rating', renderCell: avgRatingVerRenderCell, textAlign: 'right' },
    { key: 'Total Installs', label: 'Total Installs', renderCell: totalInstallsVerRenderCell, textAlign: 'right' },
    { key: 'Free Apps %', label: 'Free Apps %', renderCell: freeAppsPercentVerRenderCell, textAlign: 'right' }
  ], []);


  // For "Top 100 Apps with Version Information" table
  const appNameCommonRenderCell = (app: { App: string; Category?: string }) => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-md text-gray-600">
        📱
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

  const categoryCommonRenderCell = (app: { Category: string }) => (
    <span className="text-gray-700">{app.Category}</span>
  );

  const currentVersionRenderCell = (app: { 'Current Version': string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      app['Current Version'] === 'Varies with device' ? 'bg-gray-100 text-gray-600' :
      parseFloat(app['Current Version']) >= 5.0 ? 'bg-blue-100 text-blue-800' :
      'bg-yellow-100 text-yellow-800'
    }`}>
      {app['Current Version']}
    </span>
  );

  const androidVersionRenderCell = (app: { 'Android Version': string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      app['Android Version'].includes('5.') || app['Android Version'].includes('6.') || app['Android Version'].includes('7.') ? 'bg-emerald-100 text-emerald-800' :
      app['Android Version'].includes('Varies') ? 'bg-slate-100 text-slate-700' :
      'bg-red-100 text-red-800'
    }`}>
      {app['Android Version']}
    </span>
  );

  const ratingCommonRenderCell = (app: { Rating: number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (app.Rating || 0) >= 4.0 ? 'bg-green-100 text-green-800' :
      (app.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {app.Rating?.toFixed(1) || 'N/A'}
    </span>
  );

  const installsCommonRenderCell = (app: { Installs: string }) => (
    <span className="font-mono text-indigo-700">
      {app.Installs}
    </span>
  );

  const isRecentRenderCell = (app: { 'Is Recent': string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      app['Is Recent'] === 'Yes' ? 'bg-cyan-100 text-cyan-800' : 'bg-gray-100 text-gray-600'
    }`}>
      {app['Is Recent']}
    </span>
  );

  // Columns for the "Top 100 Apps with Version Information" table
  const versionTableColumns = useMemo(() => [
    { key: 'App', label: 'App Name', renderCell: appNameCommonRenderCell, textAlign: 'left' },
    { key: 'Current Version', label: 'Version', renderCell: currentVersionRenderCell, textAlign: 'left' },
    { key: 'Android Version', label: 'Android Req.', renderCell: androidVersionRenderCell, textAlign: 'left' },
    { key: 'Rating', label: 'Rating', renderCell: ratingCommonRenderCell, textAlign: 'right' },
    { key: 'Installs', label: 'Installs', renderCell: installsCommonRenderCell, textAlign: 'right' },
    { key: 'Is Recent', label: 'Recent', renderCell: isRecentRenderCell, textAlign: 'center' }
  ], []);


  // For "Top Apps by Android Version Requirement" nested tables
  // Reusing appNameCommonRenderCell, ratingCommonRenderCell, installsCommonRenderCell
  const nestedCurrentVerRenderCell = (app: { 'Current Ver': string | number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      typeof app['Current Ver'] === 'string' && app['Current Ver'].includes('Varies') ? 'bg-gray-100 text-gray-600' :
      (typeof app['Current Ver'] === 'string' && parseFloat(app['Current Ver']) >= 5.0) || (typeof app['Current Ver'] === 'number' && app['Current Ver'] >= 5.0) ? 'bg-blue-100 text-blue-800' :
      'bg-yellow-100 text-yellow-800'
    }`}>
      {typeof app['Current Ver'] === 'string' ? app['Current Ver'] : (app['Current Ver'] as number)?.toFixed(1) || 'N/A'}
    </span>
  );

  // Columns for the nested app tables
  const appColumns = useMemo(() => [
    { key: 'App', label: 'App Name', renderCell: appNameCommonRenderCell, textAlign: 'left' },
    // { key: 'Category', label: 'Category', renderCell: categoryCommonRenderCell, textAlign: 'left' }, // Removed for brevity in small table
    { key: 'Rating', label: 'Rating', renderCell: ratingCommonRenderCell, textAlign: 'right' },
    { key: 'Installs', label: 'Installs', renderCell: installsCommonRenderCell, textAlign: 'right' },
    { key: 'Current Ver', label: 'Version', renderCell: nestedCurrentVerRenderCell, textAlign: 'left' }
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
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Version & Android Compatibility</h1>
        <p className="text-violet-100">
          Explore app versions, Android compatibility requirements, and update patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Apps with Version Data"
          value={`${((appsWithVersionData / (totalApps || 1)) * 100).toFixed(1)}%`}
          icon={Smartphone}
          color="blue"
        />
        <StatsCard
          title="Modern Android (5.0+)"
          value={`${((modernApps / (totalApps || 1)) * 100).toFixed(1)}%`}
          icon={Code}
          color="green"
        />
        <StatsCard
          title="Variable Requirements"
          value={`${((variableApps / (totalApps || 1)) * 100).toFixed(1)}%`}
          icon={FileText} /* Changed from Star to FileText for more relevance */
          color="purple"
        />
        <StatsCard
          title="Most Common Req."
          value={mostCommonVersion?.name?.substring(0, 10) || 'N/A'}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <BarChartComponent
          data={androidVersionDistribution}
          title="Android Version Requirements (Top 15)"
          height={400}
          color="#8B5CF6"
        />
        <PieChartComponent
          data={compatibilityLevels}
          title="Compatibility Level Distribution"
          height={400}
        />
      </div>

      {/* Android Version Analysis Table - ENHANCED UX */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Android Version Requirements Analysis
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByAndroidVerTable}
              onChange={(e) => setSortByAndroidVerTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="App Count">📊 Apps</option>
              <option value="Android Version">🤖 Version</option>
              <option value="Avg Rating">⭐ Avg Rating</option>
              <option value="Total Installs">⬇️ Total Installs</option>
              <option value="Free Apps %">🆓 Free Apps %</option>
            </select>
            <button
              onClick={() => setSortOrderAndroidVerTable(sortOrderAndroidVerTable === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderAndroidVerTable === 'desc' ? '↓' : '↑'}
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
          data={sortedAndroidVersionAnalysis}
          columns={tableColumns}
          title=""
          pageSize={15}
          showPagination={true}
          enableSorting={false}
          initialSortBy={sortByAndroidVerTable}
          initialSortDirection={sortOrderAndroidVerTable}
          showRankColumn={false}
        />
      </div>

      {/* App Version Analysis Table - ENHANCED UX */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Top 100 Apps with Version Information
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByAppsWithVersionsTable}
              onChange={(e) => setSortByAppsWithVersionsTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Rating">⭐ Rating</option>
              <option value="Installs">⬇️ Installs</option>
              <option value="App">📱 App Name</option>
              <option value="Current Version">⚙️ Current Version</option>
              <option value="Android Version">🤖 Android Req.</option>
              <option value="Is Recent">🆕 Recent Update</option>
            </select>
            <button
              onClick={() => setSortOrderAppsWithVersionsTable(sortOrderAppsWithVersionsTable === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderAppsWithVersionsTable === 'desc' ? '↓' : '↑'}
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
          data={sortedAppsWithVersions}
          columns={versionTableColumns}
          title=""
          pageSize={15}
          showPagination={true}
          enableSorting={false}
          initialSortBy={sortByAppsWithVersionsTable}
          initialSortDirection={sortOrderAppsWithVersionsTable}
          showRankColumn={true}
        />
      </div>


      {/* Top Apps by Android Version - ENHANCED UX (nested tables) */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Top Apps by Android Version Requirement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Ensured 2 columns on medium and larger screens */}
          {topAppsByAndroidVersion.map((group) => (
            <div key={group.version} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <DataTable
                data={group.apps}
                columns={appColumns}
                title={`Top Apps - ${group.version}`}
                pageSize={5}
                showPagination={false}
                enableSorting={true}
                showRankColumn={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Insights - Now using InsightsCard component */}
      <InsightsCard
        title="Version & Compatibility Insights"
        insights={versionInsights}
      />
    </div>
  );
};

export default VersionExplorerPage;