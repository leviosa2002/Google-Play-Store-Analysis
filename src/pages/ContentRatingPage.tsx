import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard'; // <--- Import InsightsCard
import { Shield, Users, Star, BarChart3 } from 'lucide-react';
import { getContentRatingDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

const ContentRatingPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const contentRatingDistribution = getContentRatingDistribution(filteredApps);

  // Content rating performance analysis
  const contentRatingAnalysis = contentRatingDistribution.map(rating => {
    const ratingApps = filteredApps.filter(app => app['Content Rating'] === rating.name);
    const avgRating = ratingApps.length > 0 ? ratingApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / ratingApps.length : 0;
    const totalInstalls = ratingApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
    const freeApps = ratingApps.filter(app => app.Type === 'Free').length;
    const freePercentage = ratingApps.length > 0 ? (freeApps / ratingApps.length) * 100 : 0;
    const avgReviews = ratingApps.length > 0 ? ratingApps.reduce((sum, app) => sum + (app.Reviews || 0), 0) / ratingApps.length : 0;

    return {
      'Content Rating': rating.name,
      'App Count': rating.value,
      'Avg Rating': Number(avgRating.toFixed(2)),
      'Total Installs': formatInstalls(totalInstalls),
      'Free Apps %': Number(freePercentage.toFixed(1)),
      'Avg Reviews': Math.round(avgReviews)
    };
  });

  // Average rating by content rating
  const ratingByContentRating = contentRatingAnalysis.map(item => ({
    name: item['Content Rating'],
    value: item['Avg Rating']
  })).sort((a, b) => b.value - a.value);

  // Install distribution by content rating
  const installsByContentRating = contentRatingAnalysis.map(item => ({
    name: item['Content Rating'],
    value: parseInstalls(item['Total Installs'].replace(/[KMB]/g, '')) // Simplified for chart
  })).sort((a, b) => b.value - a.value);

  // Top apps by content rating
  const topAppsByRating = ['Everyone', 'Teen', 'Mature 17+', 'Adults only 18+'].map(rating => {
    const ratingApps = filteredApps
      .filter(app => app['Content Rating'] === rating && (app.Rating || 0) >= 4.0)
      .sort((a, b) => (b.Rating || 0) - (a.Rating || 0))
      .slice(0, 5);

    return {
      rating,
      apps: ratingApps.map(app => ({
        App: app.App,
        Category: app.Category,
        Rating: app.Rating,
        Installs: formatInstalls(parseInstalls(app.Installs || '0')),
        Reviews: app.Reviews
      }))
    };
  }).filter(group => group.apps.length > 0);

  // Statistics for StatsCards and InsightsCard
  const totalApps = filteredApps.length;
  const everyoneApps = filteredApps.filter(app => app['Content Rating'] === 'Everyone').length;
  const teenApps = filteredApps.filter(app => app['Content Rating'] === 'Teen').length;
  const matureApps = filteredApps.filter(app => app['Content Rating']?.includes('Mature')).length;
  const mostCommonRating = contentRatingDistribution[0];

  // Prepare data for the InsightsCard
  const contentRatingInsights = [
    {
      id: 'family-friendly-dominance',
      label: 'Family-Friendly Dominance',
      value: `${totalApps > 0 ? ((everyoneApps / totalApps) * 100).toFixed(1) : '0.0'}%`,
      description: `${(totalApps > 0 ? ((everyoneApps / totalApps) * 100).toFixed(1) : '0.0')}% of apps are rated "Everyone"`,
      colorClass: 'bg-green-500',
    },
    {
      id: 'best-performing-rating',
      label: 'Best Performing Rating',
      value: `${ratingByContentRating[0]?.name || 'N/A'}`,
      description: `${ratingByContentRating[0]?.name || 'N/A'} apps have the highest average rating (${ratingByContentRating[0]?.value || 'N/A'})`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'teen-market',
      label: 'Teen Market',
      value: `${totalApps > 0 ? ((teenApps / totalApps) * 100).toFixed(1) : '0.0'}%`,
      description: `${(totalApps > 0 ? ((teenApps / totalApps) * 100).toFixed(1) : '0.0')}% of apps target teen audiences`,
      colorClass: 'bg-orange-500',
    },
    {
      id: 'market-distribution',
      label: 'Market Distribution',
      value: `${contentRatingDistribution.length}`,
      description: `${contentRatingDistribution.length} different content rating categories`,
      colorClass: 'bg-purple-500',
    },
  ];

  const tableColumns = [
    { key: 'Content Rating', label: 'Content Rating', sortable: true },
    { key: 'App Count', label: 'Apps', sortable: true },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true },
    { key: 'Total Installs', label: 'Total Installs', sortable: true },
    { key: 'Free Apps %', label: 'Free Apps %', sortable: true },
    { key: 'Avg Reviews', label: 'Avg Reviews', sortable: true }
  ];

  const appColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Installs', label: 'Installs', sortable: true },
    { key: 'Reviews', label: 'Reviews', sortable: true }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Content Rating Impact</h1>
        <p className="text-cyan-100">
          Analyze how content ratings affect app performance, user engagement, and market reach
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Everyone Rated"
          value={`${totalApps > 0 ? ((everyoneApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Teen Rated"
          value={`${totalApps > 0 ? ((teenApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
          icon={Shield}
          color="blue"
        />
        <StatsCard
          title="Mature Rated"
          value={`${totalApps > 0 ? ((matureApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
          icon={Star}
          color="orange"
        />
        <StatsCard
          title="Most Common"
          value={mostCommonRating?.name || 'N/A'}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent
          data={contentRatingDistribution}
          title="Content Rating Distribution"
          height={400}
        />
        <BarChartComponent
          data={ratingByContentRating}
          title="Average App Rating by Content Rating"
          height={400}
          color="#06B6D4"
        />
      </div>

      {/* Content Rating Analysis Table */}
      <DataTable
        data={contentRatingAnalysis}
        columns={tableColumns}
        title="Content Rating Performance Analysis"
        pageSize={10}
      />

      {/* Top Apps by Content Rating */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Top Apps by Content Rating</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topAppsByRating.map((group) => (
            <DataTable
              key={group.rating}
              data={group.apps}
              columns={appColumns}
              title={`Top ${group.rating} Apps (4.0+ Rating)`}
              pageSize={5}
            />
          ))}
        </div>
      </div>

      {/* Insights */}
      {/* Replaced the manual insight div with InsightsCard */}
      <InsightsCard
        title="Content Rating Insights"
        insights={contentRatingInsights}
      />

    </div>
  );
};

export default ContentRatingPage;