// src/pages/CategoriesPage.tsx
import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard'; // <-- Use the generic InsightsCard
import { BarChart3, TrendingUp, Star, Smartphone } from 'lucide-react';
import { getCategoryDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

const CategoriesPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categoryData = getCategoryDistribution(filteredApps);
  const topCategories = categoryData.slice(0, 10);

  // Category performance metrics
  const categoryMetrics = categoryData.map(cat => {
    const categoryApps = filteredApps.filter(app => app.Category === cat.name);
    const avgRating = categoryApps.length > 0
                      ? categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length
                      : 0;
    const totalInstalls = categoryApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
    const freeAppsCount = categoryApps.filter(app => app.Type === 'Free').length;
    const freePercentage = categoryApps.length > 0
                             ? (freeAppsCount / categoryApps.length) * 100
                             : 0;

    return {
      Category: cat.name,
      'App Count': cat.value,
      'Avg Rating': Number(avgRating.toFixed(2)),
      'Total Installs': formatInstalls(totalInstalls),
      'Free Apps %': Number(freePercentage.toFixed(1))
    };
  });

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

  const tableColumns = [
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'App Count', label: 'Apps', sortable: true },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true },
    { key: 'Total Installs', label: 'Total Installs', sortable: true },
    { key: 'Free Apps %', label: 'Free Apps %', sortable: true }
  ];

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
        />
      </div>

      {/* Category Performance Table - This component will need its internal styles adjusted for colors */}
      <DataTable
        data={categoryMetrics}
        columns={tableColumns}
        title="Category Performance Metrics"
        pageSize={15}
      />

      {/* Insights Card - now using the generic InsightsCard */}
      <InsightsCard
        title="Category Insights"
        insights={categoryInsightsData}
      />
    </div>
  );
};

export default CategoriesPage;