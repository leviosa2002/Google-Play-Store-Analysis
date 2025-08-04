import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
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
    const avgRating = categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length;
    const totalInstalls = categoryApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
    const freeAppsCount = categoryApps.filter(app => app.Type === 'Free').length;
    const freePercentage = (freeAppsCount / categoryApps.length) * 100;

    return {
      Category: cat.name,
      'App Count': cat.value,
      'Avg Rating': Number(avgRating.toFixed(2)),
      'Total Installs': formatInstalls(totalInstalls),
      'Free Apps %': Number(freePercentage.toFixed(1))
    };
  });

  const totalCategories = categoryData.length;
  const mostPopularCategory = categoryData[0];
  const avgAppsPerCategory = filteredApps.length / totalCategories;
  const highestRatedCategory = categoryMetrics.reduce((max, cat) => 
    cat['Avg Rating'] > max['Avg Rating'] ? cat : max
  );

  const tableColumns = [
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'App Count', label: 'Apps', sortable: true },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true },
    { key: 'Total Installs', label: 'Total Installs', sortable: true },
    { key: 'Free Apps %', label: 'Free Apps %', sortable: true }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Categories Analysis</h1>
        <p className="text-indigo-100">
          Comprehensive breakdown of app categories and their performance metrics
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Category Performance Table */}
      <DataTable
        data={categoryMetrics}
        columns={tableColumns}
        title="Category Performance Metrics"
        pageSize={15}
      />

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Dominant Category</p>
                <p className="text-sm text-gray-600">
                  {mostPopularCategory?.name} leads with {mostPopularCategory?.value} apps
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Quality Leader</p>
                <p className="text-sm text-gray-600">
                  {highestRatedCategory?.Category} has the highest average rating ({highestRatedCategory?.['Avg Rating']})
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Market Diversity</p>
                <p className="text-sm text-gray-600">
                  {totalCategories} different categories represented in the store
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Average Distribution</p>
                <p className="text-sm text-gray-600">
                  {avgAppsPerCategory.toFixed(0)} apps per category on average
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;