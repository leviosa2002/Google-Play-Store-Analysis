import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
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
    const avgRating = ratingApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / ratingApps.length;
    const totalInstalls = ratingApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
    const freeApps = ratingApps.filter(app => app.Type === 'Free').length;
    const freePercentage = (freeApps / ratingApps.length) * 100;
    const avgReviews = ratingApps.reduce((sum, app) => sum + (app.Reviews || 0), 0) / ratingApps.length;

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
      .filter(app => app['Content Rating'] === rating && app.Rating >= 4.0)
      .sort((a, b) => b.Rating - a.Rating)
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

  // Statistics
  const totalApps = filteredApps.length;
  const everyoneApps = filteredApps.filter(app => app['Content Rating'] === 'Everyone').length;
  const teenApps = filteredApps.filter(app => app['Content Rating'] === 'Teen').length;
  const matureApps = filteredApps.filter(app => app['Content Rating']?.includes('Mature')).length;
  const mostCommonRating = contentRatingDistribution[0];

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
          value={`${((everyoneApps / totalApps) * 100).toFixed(1)}%`}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Teen Rated"
          value={`${((teenApps / totalApps) * 100).toFixed(1)}%`}
          icon={Shield}
          color="blue"
        />
        <StatsCard
          title="Mature Rated"
          value={`${((matureApps / totalApps) * 100).toFixed(1)}%`}
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Rating Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Family-Friendly Dominance</p>
                <p className="text-sm text-gray-600">
                  {((everyoneApps / totalApps) * 100).toFixed(1)}% of apps are rated "Everyone"
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Best Performing Rating</p>
                <p className="text-sm text-gray-600">
                  {ratingByContentRating[0]?.name} apps have the highest average rating ({ratingByContentRating[0]?.value})
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Teen Market</p>
                <p className="text-sm text-gray-600">
                  {((teenApps / totalApps) * 100).toFixed(1)}% of apps target teen audiences
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Market Distribution</p>
                <p className="text-sm text-gray-600">
                  {contentRatingDistribution.length} different content rating categories
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentRatingPage;