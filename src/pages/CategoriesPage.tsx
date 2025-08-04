// src/pages/CategoriesPage.tsx
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { BarChart3, TrendingUp, Star, Smartphone, RefreshCw } from 'lucide-react';
import { getCategoryDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

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
  Type: string; // Add Type property
  index?: number;
}

interface CategoryDataPoint {
  name: string;
  value: number;
}

interface CategoryMetric {
  Category: string;
  'App Count': number;
  'Avg Rating': number;
  'Total Installs': string; // Stored as formatted string, but need numeric for sorting
  _totalInstallsNumeric: number; // For internal numeric sorting
  'Free Apps %': number;
}


const CategoriesPage: React.FC = () => {
  // --- ALL REACT HOOKS MUST BE DECLARED AT THE VERY TOP LEVEL AND UNCONDITIONALLY ---
  const { filteredApps, loading, fetchApps } = useData();

  // State for table sorting controls
  const [sortByCategory, setSortByCategory] = useState<string>('App Count');
  const [sortOrderCategory, setSortOrderCategory] = useState<'desc' | 'asc'>('desc');

  // Memoized category data and metrics
  const categoryData = useMemo(() => getCategoryDistribution(filteredApps), [filteredApps]);
  const topCategories = useMemo(() => categoryData.slice(0, 10), [categoryData]);

  const rawCategoryMetrics = useMemo(() => {
    return categoryData.map(cat => {
      const categoryApps = filteredApps.filter(app => app.Category === cat.name);
      const avgRating = categoryApps.length > 0
                          ? categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length
                          : 0;
      const totalInstallsNumeric = categoryApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
      const freeAppsCount = categoryApps.filter(app => app.Type === 'Free').length;
      const freePercentage = categoryApps.length > 0
                               ? (freeAppsCount / categoryApps.length) * 100
                               : 0;

      return {
        Category: cat.name,
        'App Count': cat.value,
        'Avg Rating': Number(avgRating.toFixed(2)),
        'Total Installs': formatInstalls(totalInstallsNumeric),
        _totalInstallsNumeric: totalInstallsNumeric, // Store numeric for sorting
        'Free Apps %': Number(freePercentage.toFixed(1))
      };
    });
  }, [filteredApps, categoryData]);

  const categoryMetrics = useMemo(() => {
    return [...rawCategoryMetrics].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortByCategory === 'Category') {
        valA = a.Category;
        valB = b.Category;
        return sortOrderCategory === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortByCategory === 'Total Installs') {
        valA = a._totalInstallsNumeric; // Use numeric value for sorting
        valB = b._totalInstallsNumeric; // Use numeric value for sorting
      } else {
        valA = a[sortByCategory as keyof CategoryMetric];
        valB = b[sortByCategory as keyof CategoryMetric];
      }

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderCategory === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderCategory === 'asc' ? -Infinity : Infinity);

      if (sortOrderCategory === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [rawCategoryMetrics, sortByCategory, sortOrderCategory]);


  const totalCategories = categoryData.length;
  const mostPopularCategory = categoryData.length > 0 ? categoryData[0] : null;

  const avgAppsPerCategory = totalCategories > 0 ? filteredApps.length / totalCategories : 0;

  const highestRatedCategory = categoryMetrics.length > 0
    ? categoryMetrics.reduce((max, cat) =>
        cat['Avg Rating'] > max['Avg Rating'] ? cat : max
      )
    : null;

  // Prepare data for the generic InsightsCard for Categories Page
  const categoryInsightsData = [
    {
      id: 'dominant-category',
      label: 'Dominant Category',
      value: mostPopularCategory?.name || 'N/A',
      description: `${mostPopularCategory?.name || 'N/A'} leads with ${mostPopularCategory?.value || 'N/A'} apps`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'quality-leader',
      label: 'Quality Leader',
      value: highestRatedCategory?.['Avg Rating'] || 'N/A',
      description: `${highestRatedCategory?.Category || 'N/A'} has the highest average rating (${highestRatedCategory?.['Avg Rating']?.toFixed(2) || 'N/A'})`,
      colorClass: 'bg-green-500',
    },
    {
      id: 'market-diversity',
      label: 'Market Diversity',
      value: totalCategories,
      description: `${totalCategories} different categories represented in the store`,
      colorClass: 'bg-purple-500',
    },
    {
      id: 'avg-distribution',
      label: 'Average Distribution',
      value: avgAppsPerCategory,
      description: `${avgAppsPerCategory.toFixed(0)} apps per category on average`,
      colorClass: 'bg-orange-500',
    },
  ];

  // --- Reusable Render Cells for consistency and UX ---
  const appCountRenderCell = (category: CategoryMetric) => (
    <span className="font-mono text-blue-600">
      {category['App Count'].toLocaleString()}
    </span>
  );

  const avgRatingRenderCell = (category: CategoryMetric) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      category['Avg Rating'] >= 4.0 ? 'bg-green-100 text-green-800' :
      category['Avg Rating'] >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {category['Avg Rating'].toFixed(2)}
    </span>
  );

  const totalInstallsRenderCell = (category: CategoryMetric) => (
    <span className="font-mono text-indigo-700">
      {category['Total Installs']}
    </span>
  );

  const freeAppsPercentageRenderCell = (category: CategoryMetric) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      category['Free Apps %'] >= 80 ? 'bg-green-100 text-green-800' :
      category['Free Apps %'] >= 50 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {category['Free Apps %'].toFixed(1)}%
    </span>
  );

  const tableColumns = useMemo(() => [
    { key: 'Category', label: 'Category', sortable: true, textAlign: 'left' },
    { key: 'App Count', label: 'Apps', sortable: true, textAlign: 'right', renderCell: appCountRenderCell },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true, textAlign: 'right', renderCell: avgRatingRenderCell },
    { key: 'Total Installs', label: 'Total Installs', sortable: true, textAlign: 'right', renderCell: totalInstallsRenderCell },
    { key: 'Free Apps %', label: 'Free Apps %', sortable: true, textAlign: 'right', renderCell: freeAppsPercentageRenderCell }
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
      {/* Header - Already colorful and prominent */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Categories Analysis</h1>
        <p className="text-indigo-100">
          Comprehensive breakdown of app categories and their performance metrics
        </p>
      </div>

      {/* Stats Cards - These already have colors from the 'color' prop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Categories"
          value={totalCategories}
          icon={BarChart3}
          color="blue"
        />
        <StatsCard
          title="Most Popular"
          value={mostPopularCategory?.name || 'N/A'}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Avg Apps/Category"
          value={avgAppsPerCategory.toFixed(0)}
          icon={Smartphone}
          color="purple"
        />
        <StatsCard
          title="Highest Rated"
          value={highestRatedCategory?.Category || 'N/A'}
          icon={Star}
          color="orange"
        />
      </div>

      {/* Charts Grid - Wrapped in a distinct white card with shadow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <BarChartComponent
          data={topCategories}
          title="Top 10 Categories by App Count"
          height={400}
          color="#4F46E5"
        />
        <PieChartComponent
          data={topCategories}
          title="Category Distribution (Top 10)"
          height={400}
          color="#A855F7" /* Added a default color for consistency, adjust if needed */
        />
      </div>

      {/* Category Performance Table - Enhanced with sorting and reload */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Category Performance Metrics
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByCategory}
              onChange={(e) => setSortByCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="App Count">📊 App Count</option>
              <option value="Category">🏷️ Category</option>
              <option value="Avg Rating">⭐ Avg Rating</option>
              <option value="Total Installs">📈 Total Installs</option>
              <option value="Free Apps %">🆓 Free Apps %</option>
            </select>
            <button
              onClick={() => setSortOrderCategory(sortOrderCategory === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderCategory === 'desc' ? '↓' : '↑'}
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
          data={categoryMetrics}
          columns={tableColumns}
          title="" /* Title moved to h3 above */
          pageSize={15}
          showPagination={true}
          enableSorting={false} /* Sorting handled by parent component now */
          initialSortBy={sortByCategory}
          initialSortDirection={sortOrderCategory}
          showRankColumn={true}
        />
      </div>

      {/* Insights Card - now using the generic InsightsCard */}
      <InsightsCard
        title="Category Insights"
        insights={categoryInsightsData}
      />
    </div>
  );
};

export default CategoriesPage;