import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard'; // <--- Import InsightsCard
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
    .filter(app => (app.Rating || 0) > 0 && parseInstalls(app.Installs || '0') > 0)
    .map(app => ({
      rating: app.Rating || 0,
      installs: parseInstalls(app.Installs || '0'),
      name: app.App
    }))
    .slice(0, 500);

  // Top rated apps
  const topRatedApps = filteredApps
    .filter(app => (app.Rating || 0) >= 4.0 && (app.Reviews || 0) >= 100)
    .sort((a, b) => (b.Rating || 0) - (a.Rating || 0))
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
  const validRatings = filteredApps.filter(app => (app.Rating || 0) > 0);
  const averageRating = validRatings.length > 0 ? validRatings.reduce((sum, app) => sum + (app.Rating || 0), 0) / validRatings.length : 0;
  const highestRating = validRatings.length > 0 ? Math.max(...validRatings.map(app => (app.Rating || 0))) : 0;
  const appsAbove4 = validRatings.filter(app => (app.Rating || 0) >= 4.0).length;
  const percentageAbove4 = validRatings.length > 0 ? (appsAbove4 / validRatings.length) * 100 : 0;

  // Rating by category
  const categories = [...new Set(filteredApps.map(app => app.Category))];
  const ratingByCategory = categories.map(category => {
    const categoryApps = filteredApps.filter(app => app.Category === category && (app.Rating || 0) > 0);
    const avgRating = categoryApps.length > 0 ? categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length : 0;
    return {
      name: category,
      value: Number(avgRating.toFixed(2))
    };
  }).sort((a, b) => b.value - a.value).slice(0, 15);


  // Prepare data for the InsightsCard
  const ratingInsights = [
    {
      id: 'quality-standard',
      label: 'Quality Standard',
      value: `${percentageAbove4.toFixed(1)}%`,
      description: `${percentageAbove4.toFixed(1)}% of apps maintain ratings above 4.0 stars`,
      colorClass: 'bg-orange-500',
    },
    {
      id: 'best-category',
      label: 'Best Category',
      value: ratingByCategory[0]?.name || 'N/A',
      description: `${ratingByCategory[0]?.name || 'N/A'} leads with ${ratingByCategory[0]?.value || 'N/A'} average rating`,
      colorClass: 'bg-green-500',
    },
    {
      id: 'rating-range',
      label: 'Rating Range',
      value: ratingDistribution.length > 0 ? ratingDistribution.reduce((max, current) =>
        current.value > max.value ? current : max
      ).name : 'N/A',
      description: ratingDistribution.length > 0 ? `Most common rating range: ${ratingDistribution.reduce((max, current) =>
        current.value > max.value ? current : max
      ).name}` : 'No data available',
      colorClass: 'bg-blue-500',
    },
    {
      id: 'market-average',
      label: 'Market Average',
      value: averageRating.toFixed(2),
      description: `Overall market average: ${averageRating.toFixed(2)} out of 5.0 stars`,
      colorClass: 'bg-purple-500',
    },
  ];

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

      {/* Insights - Now using InsightsCard */}
      <InsightsCard
        title="Rating Insights"
        insights={ratingInsights}
      />
    </div>
  );
};

export default RatingsPage;