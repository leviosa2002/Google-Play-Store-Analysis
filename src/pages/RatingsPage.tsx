import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { Star, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { getRatingDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

const RatingsPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ratingDistribution = getRatingDistribution(filteredApps);
  
  // Rating vs Installs correlation
  const ratingInstallsData = filteredApps
    .filter(app => app.Rating > 0 && parseInstalls(app.Installs || '0') > 0)
    .map(app => ({
      rating: app.Rating,
      installs: parseInstalls(app.Installs || '0'),
      name: app.App
    }))
    .slice(0, 500);

  // Top rated apps
  const topRatedApps = filteredApps
    .filter(app => app.Rating >= 4.0 && app.Reviews >= 100)
    .sort((a, b) => b.Rating - a.Rating)
    .slice(0, 20)
    .map(app => ({
      App: app.App,
      Category: app.Category,
      Rating: app.Rating,
      Reviews: app.Reviews,
      Installs: formatInstalls(parseInstalls(app.Installs || '0')),
      Type: app.Type
    }));

  // Rating statistics
  const validRatings = filteredApps.filter(app => app.Rating > 0);
  const averageRating = validRatings.reduce((sum, app) => sum + app.Rating, 0) / validRatings.length;
  const highestRating = Math.max(...validRatings.map(app => app.Rating));
  const appsAbove4 = validRatings.filter(app => app.Rating >= 4.0).length;
  const percentageAbove4 = (appsAbove4 / validRatings.length) * 100;

  // Rating by category
  const categories = [...new Set(filteredApps.map(app => app.Category))];
  const ratingByCategory = categories.map(category => {
    const categoryApps = filteredApps.filter(app => app.Category === category && app.Rating > 0);
    const avgRating = categoryApps.reduce((sum, app) => sum + app.Rating, 0) / categoryApps.length;
    return {
      name: category,
      value: Number(avgRating.toFixed(2))
    };
  }).sort((a, b) => b.value - a.value).slice(0, 15);

  const tableColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Reviews', label: 'Reviews', sortable: true },
    { key: 'Installs', label: 'Installs', sortable: true },
    { key: 'Type', label: 'Type', sortable: true }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Ratings Analysis</h1>
        <p className="text-yellow-100">
          Deep dive into app ratings, quality metrics, and user satisfaction patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Average Rating"
          value={averageRating.toFixed(2)}
          icon={Star}
          color="orange"
        />
        <StatsCard
          title="Highest Rating"
          value={highestRating.toFixed(1)}
          icon={Award}
          color="green"
        />
        <StatsCard
          title="Apps Above 4.0"
          value={`${percentageAbove4.toFixed(1)}%`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Rated Apps"
          value={validRatings.length.toLocaleString()}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={ratingDistribution}
          title="Rating Distribution"
          height={400}
          color="#F59E0B"
        />
        <PieChartComponent
          data={ratingDistribution}
          title="Rating Distribution (Pie Chart)"
          height={400}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={ratingByCategory}
          title="Average Rating by Category (Top 15)"
          height={400}
          color="#EF4444"
        />
        <ScatterPlot
          data={ratingInstallsData}
          title="Rating vs Installs Correlation"
          xAxisKey="rating"
          yAxisKey="installs"
          xAxisLabel="Rating"
          yAxisLabel="Installs"
          height={400}
          color="#F59E0B"
        />
      </div>

      {/* Top Rated Apps Table */}
      <DataTable
        data={topRatedApps}
        columns={tableColumns}
        title="Top 20 Highest Rated Apps (4.0+ with 100+ reviews)"
        pageSize={20}
      />

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Quality Standard</p>
                <p className="text-sm text-gray-600">
                  {percentageAbove4.toFixed(1)}% of apps maintain ratings above 4.0 stars
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Best Category</p>
                <p className="text-sm text-gray-600">
                  {ratingByCategory[0]?.name} leads with {ratingByCategory[0]?.value} average rating
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Rating Range</p>
                <p className="text-sm text-gray-600">
                  Most common rating range: {ratingDistribution.reduce((max, current) => 
                    current.value > max.value ? current : max
                  ).name}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Market Average</p>
                <p className="text-sm text-gray-600">
                  Overall market average: {averageRating.toFixed(2)} out of 5.0 stars
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingsPage;