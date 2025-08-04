import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { TrendingUp, Calendar, Star, BarChart3 } from 'lucide-react';
import { parseInstalls, formatInstalls } from '../utils/dataTransformers';

const TrendsPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Parse last updated dates and create trends
  const appsWithDates = filteredApps.filter(app => {
    const date = new Date(app['Last Updated']);
    return !isNaN(date.getTime()) && date.getFullYear() >= 2010;
  });

  // Updates by year
  const updatesByYear = appsWithDates.reduce((acc, app) => {
    const year = new Date(app['Last Updated']).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const yearlyUpdates = Object.entries(updatesByYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));

  // Updates by month (for recent years)
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
    .slice(-24); // Last 24 months

  // Rating trends over time
  const ratingTrends = yearlyUpdates.map(yearData => {
    const yearApps = appsWithDates.filter(app => 
      new Date(app['Last Updated']).getFullYear() === parseInt(yearData.name)
    );
    const avgRating = yearApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / yearApps.length;
    
    return {
      year: parseInt(yearData.name),
      avgRating: Number(avgRating.toFixed(2)),
      appCount: yearData.value
    };
  });

  // Category trends
  const categoryTrends = [...new Set(filteredApps.map(app => app.Category))].map(category => {
    const categoryApps = appsWithDates.filter(app => app.Category === category);
    const recentUpdates = categoryApps.filter(app => {
      const date = new Date(app['Last Updated']);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return date >= oneYearAgo;
    }).length;
    
    const totalCategoryApps = filteredApps.filter(app => app.Category === category).length;
    const updateRate = totalCategoryApps > 0 ? (recentUpdates / totalCategoryApps) * 100 : 0;
    
    return {
      Category: category,
      'Total Apps': totalCategoryApps,
      'Recent Updates': recentUpdates,
      'Update Rate %': Number(updateRate.toFixed(1)),
      'Avg Rating': Number((categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length).toFixed(2))
    };
  }).sort((a, b) => b['Update Rate %'] - a['Update Rate %']).slice(0, 20);

  // Apps not updated recently
  const staleApps = filteredApps.filter(app => {
    const date = new Date(app['Last Updated']);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return !isNaN(date.getTime()) && date < twoYearsAgo && app.Rating >= 4.0;
  }).sort((a, b) => b.Rating - a.Rating).slice(0, 20).map(app => ({
    App: app.App,
    Category: app.Category,
    Rating: app.Rating,
    'Last Updated': app['Last Updated'],
    Installs: formatInstalls(parseInstalls(app.Installs || '0')),
    Reviews: app.Reviews
  }));

  // Statistics
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

  const avgUpdateRate = (recentlyUpdated / totalAppsWithDates) * 100;

  const tableColumns = [
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Total Apps', label: 'Total Apps', sortable: true },
    { key: 'Recent Updates', label: 'Recent Updates', sortable: true },
    { key: 'Update Rate %', label: 'Update Rate %', sortable: true },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true }
  ];

  const staleAppsColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Last Updated', label: 'Last Updated', sortable: true },
    { key: 'Installs', label: 'Installs', sortable: true },
    { key: 'Reviews', label: 'Reviews', sortable: true }
  ];

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

      {/* Category Update Trends */}
      <DataTable
        data={categoryTrends}
        columns={tableColumns}
        title="Category Update Trends (Top 20 by Update Rate)"
        pageSize={15}
      />

      {/* Stale but Good Apps */}
      <DataTable
        data={staleApps}
        columns={staleAppsColumns}
        title="High-Rated Apps Not Updated Recently (2+ years, 4.0+ rating)"
        pageSize={15}
      />

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Update Activity</p>
                <p className="text-sm text-gray-600">
                  {avgUpdateRate.toFixed(1)}% of apps updated in the last 6 months
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Peak Activity</p>
                <p className="text-sm text-gray-600">
                  {mostActiveYear.name} saw the most updates with {mostActiveYear.value.toLocaleString()} apps
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Most Active Category</p>
                <p className="text-sm text-gray-600">
                  {categoryTrends[0]?.Category} has the highest update rate at {categoryTrends[0]?.['Update Rate %']}%
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Neglected Quality Apps</p>
                <p className="text-sm text-gray-600">
                  {staleApps.length} high-rated apps haven't been updated in 2+ years
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