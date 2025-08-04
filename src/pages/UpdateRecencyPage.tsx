import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { Calendar, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { parseInstalls, formatInstalls } from '../utils/dataTransformers';

const UpdateRecencyPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter apps with valid dates
  const appsWithDates = filteredApps.filter(app => {
    const date = new Date(app['Last Updated']);
    return !isNaN(date.getTime()) && date.getFullYear() >= 2010;
  });

  // Calculate time periods
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  // Categorize apps by update recency
  const updateRecencyCategories = [
    {
      name: 'Last Month',
      apps: appsWithDates.filter(app => new Date(app['Last Updated']) >= oneMonthAgo)
    },
    {
      name: 'Last 3 Months',
      apps: appsWithDates.filter(app => {
        const date = new Date(app['Last Updated']);
        return date >= threeMonthsAgo && date < oneMonthAgo;
      })
    },
    {
      name: 'Last 6 Months',
      apps: appsWithDates.filter(app => {
        const date = new Date(app['Last Updated']);
        return date >= sixMonthsAgo && date < threeMonthsAgo;
      })
    },
    {
      name: 'Last Year',
      apps: appsWithDates.filter(app => {
        const date = new Date(app['Last Updated']);
        return date >= oneYearAgo && date < sixMonthsAgo;
      })
    },
    {
      name: '1-2 Years Ago',
      apps: appsWithDates.filter(app => {
        const date = new Date(app['Last Updated']);
        return date >= twoYearsAgo && date < oneYearAgo;
      })
    },
    {
      name: '2+ Years Ago',
      apps: appsWithDates.filter(app => new Date(app['Last Updated']) < twoYearsAgo)
    }
  ];

  const recencyDistribution = updateRecencyCategories.map(category => ({
    name: category.name,
    value: category.apps.length
  }));

  // Apps not updated in over 1 year but with good ratings
  const staleButGoodApps = appsWithDates
    .filter(app => {
      const date = new Date(app['Last Updated']);
      return date < oneYearAgo && app.Rating >= 4.0 && app.Reviews >= 100;
    })
    .sort((a, b) => b.Rating - a.Rating)
    .slice(0, 30)
    .map(app => ({
      App: app.App,
      Category: app.Category,
      Rating: app.Rating,
      Reviews: app.Reviews,
      Installs: formatInstalls(parseInstalls(app.Installs || '0')),
      'Last Updated': app['Last Updated'],
      'Days Since Update': Math.floor((now.getTime() - new Date(app['Last Updated']).getTime()) / (1000 * 60 * 60 * 24))
    }));

  // Recently updated high-performing apps
  const recentlyUpdatedGoodApps = appsWithDates
    .filter(app => {
      const date = new Date(app['Last Updated']);
      return date >= sixMonthsAgo && app.Rating >= 4.5 && app.Reviews >= 1000;
    })
    .sort((a, b) => new Date(b['Last Updated']).getTime() - new Date(a['Last Updated']).getTime())
    .slice(0, 30)
    .map(app => ({
      App: app.App,
      Category: app.Category,
      Rating: app.Rating,
      Reviews: app.Reviews,
      Installs: formatInstalls(parseInstalls(app.Installs || '0')),
      'Last Updated': app['Last Updated'],
      'Days Since Update': Math.floor((now.getTime() - new Date(app['Last Updated']).getTime()) / (1000 * 60 * 60 * 24))
    }));

  // Update frequency by category
  const categoryUpdateAnalysis = [...new Set(filteredApps.map(app => app.Category))].map(category => {
    const categoryApps = appsWithDates.filter(app => app.Category === category);
    const recentlyUpdated = categoryApps.filter(app => new Date(app['Last Updated']) >= sixMonthsAgo).length;
    const updateRate = categoryApps.length > 0 ? (recentlyUpdated / categoryApps.length) * 100 : 0;
    const avgRating = categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length;
    
    return {
      Category: category,
      'Total Apps': categoryApps.length,
      'Recently Updated': recentlyUpdated,
      'Update Rate %': Number(updateRate.toFixed(1)),
      'Avg Rating': Number(avgRating.toFixed(2))
    };
  }).sort((a, b) => b['Update Rate %'] - a['Update Rate %']).slice(0, 20);

  // Monthly update trends (last 12 months)
  const monthlyTrends = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthApps = appsWithDates.filter(app => {
      const appDate = new Date(app['Last Updated']);
      return appDate >= monthDate && appDate < nextMonth;
    });
    
    monthlyTrends.push({
      name: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      value: monthApps.length
    });
  }

  // Statistics
  const totalAppsWithDates = appsWithDates.length;
  const recentlyUpdated = updateRecencyCategories[0].apps.length + updateRecencyCategories[1].apps.length;
  const staleApps = updateRecencyCategories[4].apps.length + updateRecencyCategories[5].apps.length;
  const updateRate = (recentlyUpdated / totalAppsWithDates) * 100;

  const tableColumns = [
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Total Apps', label: 'Total Apps', sortable: true },
    { key: 'Recently Updated', label: 'Recent Updates', sortable: true },
    { key: 'Update Rate %', label: 'Update Rate %', sortable: true },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true }
  ];

  const appColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Reviews', label: 'Reviews', sortable: true },
    { key: 'Installs', label: 'Installs', sortable: true },
    { key: 'Last Updated', label: 'Last Updated', sortable: true },
    { key: 'Days Since Update', label: 'Days Ago', sortable: true }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">App Update Recency Dashboard</h1>
        <p className="text-amber-100">
          Track app maintenance patterns, identify stale apps, and analyze update frequency trends
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Recently Updated"
          value={`${updateRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Last 3 Months"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Category Update Analysis */}
      <DataTable
        data={categoryUpdateAnalysis}
        columns={tableColumns}
        title="Category Update Analysis (Top 20 by Update Rate)"
        pageSize={15}
      />

      {/* App Tables */}
      <div className="grid grid-cols-1 gap-6">
        <DataTable
          data={recentlyUpdatedGoodApps}
          columns={appColumns}
          title="Recently Updated High-Performing Apps (4.5+ rating, 1000+ reviews)"
          pageSize={15}
        />
        <DataTable
          data={staleButGoodApps}
          columns={appColumns}
          title="Stale but High-Quality Apps (4.0+ rating, not updated in 1+ year)"
          pageSize={15}
        />
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Recency Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Active Maintenance</p>
                <p className="text-sm text-gray-600">
                  {updateRate.toFixed(1)}% of apps updated in the last 3 months
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Most Active Category</p>
                <p className="text-sm text-gray-600">
                  {categoryUpdateAnalysis[0]?.Category} has {categoryUpdateAnalysis[0]?.['Update Rate %']}% recent updates
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Neglected Apps</p>
                <p className="text-sm text-gray-600">
                  {staleApps.toLocaleString()} apps haven't been updated in over a year
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Quality vs Maintenance</p>
                <p className="text-sm text-gray-600">
                  {staleButGoodApps.length} high-rated apps need attention despite good reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateRecencyPage;