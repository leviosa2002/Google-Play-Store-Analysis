import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { MessageSquare, TrendingUp, Heart, Frown } from 'lucide-react';
import { getSentimentDistribution } from '../utils/dataTransformers';

const SentimentPage: React.FC = () => {
  const { filteredApps, filteredReviews, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sentimentDistribution = getSentimentDistribution(filteredReviews);
  
  // Sentiment by app analysis
  const appSentimentAnalysis = filteredApps.map(app => {
    const appReviews = filteredReviews.filter(review => review.App === app.App);
    if (appReviews.length === 0) return null;

    const avgPolarity = appReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / appReviews.length;
    const avgSubjectivity = appReviews.reduce((sum, review) => sum + (review.Sentiment_Subjectivity || 0), 0) / appReviews.length;
    
    const positiveReviews = appReviews.filter(r => r.Sentiment === 'Positive').length;
    const negativeReviews = appReviews.filter(r => r.Sentiment === 'Negative').length;
    const neutralReviews = appReviews.filter(r => r.Sentiment === 'Neutral').length;

    return {
      App: app.App,
      Category: app.Category,
      Rating: app.Rating,
      'Total Reviews': appReviews.length,
      'Avg Polarity': Number(avgPolarity.toFixed(3)),
      'Avg Subjectivity': Number(avgSubjectivity.toFixed(3)),
      'Positive %': Number(((positiveReviews / appReviews.length) * 100).toFixed(1)),
      'Negative %': Number(((negativeReviews / appReviews.length) * 100).toFixed(1)),
      'Neutral %': Number(((neutralReviews / appReviews.length) * 100).toFixed(1))
    };
  }).filter(Boolean).sort((a, b) => (b?.['Total Reviews'] || 0) - (a?.['Total Reviews'] || 0)).slice(0, 50);

  // Sentiment vs Rating correlation
  const sentimentRatingData = appSentimentAnalysis.map(app => ({
    rating: app?.Rating || 0,
    polarity: app?.['Avg Polarity'] || 0,
    name: app?.App || ''
  })).filter(item => item.rating > 0);

  // Top positive and negative reviews
  const topPositiveReviews = filteredReviews
    .filter(review => review.Sentiment === 'Positive' && review.Sentiment_Polarity > 0.5)
    .sort((a, b) => (b.Sentiment_Polarity || 0) - (a.Sentiment_Polarity || 0))
    .slice(0, 10);

  const topNegativeReviews = filteredReviews
    .filter(review => review.Sentiment === 'Negative' && review.Sentiment_Polarity < -0.1)
    .sort((a, b) => (a.Sentiment_Polarity || 0) - (b.Sentiment_Polarity || 0))
    .slice(0, 10);

  // Statistics
  const totalReviews = filteredReviews.length;
  const positiveReviews = filteredReviews.filter(r => r.Sentiment === 'Positive').length;
  const negativeReviews = filteredReviews.filter(r => r.Sentiment === 'Negative').length;
  const neutralReviews = filteredReviews.filter(r => r.Sentiment === 'Neutral').length;
  const avgPolarity = filteredReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / totalReviews;

  // Sentiment by category
  const categories = [...new Set(filteredApps.map(app => app.Category))];
  const sentimentByCategory = categories.map(category => {
    const categoryApps = filteredApps.filter(app => app.Category === category);
    const categoryReviews = filteredReviews.filter(review => 
      categoryApps.some(app => app.App === review.App)
    );
    
    if (categoryReviews.length === 0) return null;
    
    const avgPolarity = categoryReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / categoryReviews.length;
    
    return {
      name: category,
      value: Number(avgPolarity.toFixed(3))
    };
  }).filter(Boolean).sort((a, b) => (b?.value || 0) - (a?.value || 0)).slice(0, 15);

  const tableColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Total Reviews', label: 'Reviews', sortable: true },
    { key: 'Avg Polarity', label: 'Avg Polarity', sortable: true },
    { key: 'Positive %', label: 'Positive %', sortable: true },
    { key: 'Negative %', label: 'Negative %', sortable: true }
  ];

  const reviewColumns = [
    { key: 'App', label: 'App', sortable: true },
    { 
      key: 'Translated_Review', 
      label: 'Review', 
      sortable: false,
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value || 'No review text'}
        </div>
      )
    },
    { key: 'Sentiment', label: 'Sentiment', sortable: true },
    { key: 'Sentiment_Polarity', label: 'Polarity', sortable: true }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Sentiment Analysis</h1>
        <p className="text-pink-100">
          Deep dive into user sentiment patterns and review analysis across apps
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Reviews"
          value={totalReviews.toLocaleString()}
          icon={MessageSquare}
          color="blue"
        />
        <StatsCard
          title="Positive Reviews"
          value={`${((positiveReviews / totalReviews) * 100).toFixed(1)}%`}
          icon={Heart}
          color="green"
        />
        <StatsCard
          title="Negative Reviews"
          value={`${((negativeReviews / totalReviews) * 100).toFixed(1)}%`}
          icon={Frown}
          color="red"
        />
        <StatsCard
          title="Avg Polarity"
          value={avgPolarity.toFixed(3)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent
          data={sentimentDistribution}
          title="Overall Sentiment Distribution"
          height={400}
        />
        <BarChartComponent
          data={sentimentByCategory}
          title="Average Sentiment by Category (Top 15)"
          height={400}
          color="#EC4899"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ScatterPlot
          data={sentimentRatingData}
          title="Sentiment Polarity vs App Rating Correlation"
          xAxisKey="rating"
          yAxisKey="polarity"
          xAxisLabel="App Rating"
          yAxisLabel="Average Sentiment Polarity"
          height={400}
          color="#8B5CF6"
        />
      </div>

      {/* App Sentiment Analysis Table */}
      <DataTable
        data={appSentimentAnalysis}
        columns={tableColumns}
        title="App Sentiment Analysis (Top 50 by Review Count)"
        pageSize={15}
      />

      {/* Top Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          data={topPositiveReviews}
          columns={reviewColumns}
          title="Most Positive Reviews"
          pageSize={10}
        />
        <DataTable
          data={topNegativeReviews}
          columns={reviewColumns}
          title="Most Negative Reviews"
          pageSize={10}
        />
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Positive Sentiment</p>
                <p className="text-sm text-gray-600">
                  {positiveReviews.toLocaleString()} positive reviews ({((positiveReviews / totalReviews) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Best Category Sentiment</p>
                <p className="text-sm text-gray-600">
                  {sentimentByCategory[0]?.name} has the highest sentiment polarity ({sentimentByCategory[0]?.value})
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Negative Sentiment</p>
                <p className="text-sm text-gray-600">
                  {negativeReviews.toLocaleString()} negative reviews ({((negativeReviews / totalReviews) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Overall Polarity</p>
                <p className="text-sm text-gray-600">
                  Average sentiment polarity: {avgPolarity.toFixed(3)} (0 = neutral, +1 = very positive, -1 = very negative)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentPage;