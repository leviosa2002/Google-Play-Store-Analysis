import React from 'react';
import { useData } from '../context/DataContext';
import StatsCard from '../components/StatsCard';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import { 
  Smartphone, 
  Star, 
  Download, 
  MessageSquare,
  TrendingUp,
  Users
} from 'lucide-react';
import { 
  getCategoryDistribution, 
  getRatingDistribution, 
  getSentimentDistribution,
  formatInstalls,
  parseInstalls
} from '../utils/dataTransformers';

const HomePage: React.FC = () => {
  const { filteredApps, filteredReviews, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  const totalApps = filteredApps.length;
  const averageRating = filteredApps.reduce((sum, app) => sum + app.Rating, 0) / totalApps;
  const totalInstalls = filteredApps.reduce((sum, app) => sum + parseInstalls(app.Installs), 0);
  const totalReviews = filteredReviews.length;
  const freeApps = filteredApps.filter(app => app.Type === 'Free').length;
  const paidApps = filteredApps.filter(app => app.Type === 'Paid').length;

  const categoryData = getCategoryDistribution(filteredApps).slice(0, 10);
  const ratingData = getRatingDistribution(filteredApps);
  const sentimentData = getSentimentDistribution(filteredReviews);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Google Play Store Analytics</h1>
        <p className="text-blue-100">
          Comprehensive analysis of {totalApps.toLocaleString()} apps and {totalReviews.toLocaleString()} reviews
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard
          title="Total Apps"
          value={totalApps.toLocaleString()}
          icon={Smartphone}
          color="blue"
        />
        <StatsCard
          title="Average Rating"
          value={averageRating.toFixed(1)}
          icon={Star}
          color="green"
        />
        <StatsCard
          title="Total Installs"
          value={formatInstalls(totalInstalls)}
          icon={Download}
          color="purple"
        />
        <StatsCard
          title="Total Reviews"
          value={totalReviews.toLocaleString()}
          icon={MessageSquare}
          color="orange"
        />
        <StatsCard
          title="Free Apps"
          value={`${((freeApps / totalApps) * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Paid Apps"
          value={`${((paidApps / totalApps) * 100).toFixed(1)}%`}
          icon={Users}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={categoryData}
          title="Top 10 Categories by App Count"
          height={400}
        />
        <PieChartComponent
          data={ratingData}
          title="Rating Distribution"
          height={400}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent
          data={sentimentData}
          title="Review Sentiment Distribution"
          height={400}
        />
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Most Popular Category</p>
                <p className="text-sm text-gray-600">
                  {categoryData[0]?.name} with {categoryData[0]?.value} apps
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Average App Rating</p>
                <p className="text-sm text-gray-600">
                  {averageRating.toFixed(2)} out of 5.0 stars
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Free vs Paid</p>
                <p className="text-sm text-gray-600">
                  {((freeApps / totalApps) * 100).toFixed(1)}% free apps, {((paidApps / totalApps) * 100).toFixed(1)}% paid apps
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Review Sentiment</p>
                <p className="text-sm text-gray-600">
                  {sentimentData.find(s => s.name === 'Positive')?.value || 0} positive reviews analyzed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;