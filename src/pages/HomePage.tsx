import React from 'react';
import { useData } from '../context/DataContext';
import StatsCard from '../components/StatsCard';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import InsightsCard from '../components/InsightsCard'; // <--- Import InsightsCard
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

  // Handle cases where totalApps might be 0 to prevent division by zero errors
  const totalApps = filteredApps.length;
  const averageRating = totalApps > 0 ? filteredApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / totalApps : 0;
  const totalInstalls = filteredApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
  const totalReviews = filteredReviews.length;
  const freeApps = filteredApps.filter(app => app.Type === 'Free').length;
  const paidApps = filteredApps.filter(app => app.Type === 'Paid').length;

  const categoryData = getCategoryDistribution(filteredApps).slice(0, 10);
  const ratingData = getRatingDistribution(filteredApps);
  const sentimentData = getSentimentDistribution(filteredReviews);

  // Prepare data for the InsightsCard
  const keyInsights = [
    {
      id: 'most-popular-category',
      label: 'Most Popular Category',
      value: categoryData[0]?.name || 'N/A',
      description: `${categoryData[0]?.name || 'N/A'} with ${categoryData[0]?.value || 0} apps`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'average-app-rating',
      label: 'Average App Rating',
      value: averageRating.toFixed(2),
      description: `${averageRating.toFixed(2)} out of 5.0 stars`,
      colorClass: 'bg-green-500',
    },
    {
      id: 'free-vs-paid',
      label: 'Free vs Paid',
      value: `${totalApps > 0 ? ((freeApps / totalApps) * 100).toFixed(1) : '0.0'}% Free`,
      description: `${totalApps > 0 ? ((freeApps / totalApps) * 100).toFixed(1) : '0.0'}% free apps, ${totalApps > 0 ? ((paidApps / totalApps) * 100).toFixed(1) : '0.0'}% paid apps`,
      colorClass: 'bg-purple-500',
    },
    {
      id: 'review-sentiment',
      label: 'Review Sentiment',
      value: `${sentimentData.find(s => s.name === 'Positive')?.value || 0} Positive`,
      description: `${sentimentData.find(s => s.name === 'Positive')?.value || 0} positive reviews analyzed`,
      colorClass: 'bg-orange-500',
    },
  ];

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
          value={`${totalApps > 0 ? ((freeApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Paid Apps"
          value={`${totalApps > 0 ? ((paidApps / totalApps) * 100).toFixed(1) : '0.0'}%`}
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
        {/* Replaced the manual insight div with InsightsCard */}
        <InsightsCard
          title="Key Insights"
          insights={keyInsights}
        />
      </div>
    </div>
  );
};

export default HomePage;