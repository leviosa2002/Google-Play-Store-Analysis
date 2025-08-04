import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';

const TopReviewsPage: React.FC = () => {
  const { filteredApps, filteredReviews, loading } = useData();
  const [selectedSentiment, setSelectedSentiment] = useState<string>('All');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter reviews based on selected sentiment
  const reviewsToShow = selectedSentiment === 'All' 
    ? filteredReviews 
    : filteredReviews.filter(review => review.Sentiment === selectedSentiment);

  // Top positive reviews (highest polarity)
  const topPositiveReviews = filteredReviews
    .filter(review => review.Sentiment === 'Positive' && review.Sentiment_Polarity > 0.5)
    .sort((a, b) => (b.Sentiment_Polarity || 0) - (a.Sentiment_Polarity || 0))
    .slice(0, 20)
    .map(review => ({
      App: review.App,
      Review: review.Translated_Review || 'No review text',
      Sentiment: review.Sentiment,
      Polarity: Number((review.Sentiment_Polarity || 0).toFixed(3)),
      Subjectivity: Number((review.Sentiment_Subjectivity || 0).toFixed(3))
    }));

  // Top negative reviews (lowest polarity)
  const topNegativeReviews = filteredReviews
    .filter(review => review.Sentiment === 'Negative' && review.Sentiment_Polarity < -0.1)
    .sort((a, b) => (a.Sentiment_Polarity || 0) - (b.Sentiment_Polarity || 0))
    .slice(0, 20)
    .map(review => ({
      App: review.App,
      Review: review.Translated_Review || 'No review text',
      Sentiment: review.Sentiment,
      Polarity: Number((review.Sentiment_Polarity || 0).toFixed(3)),
      Subjectivity: Number((review.Sentiment_Subjectivity || 0).toFixed(3))
    }));

  // Most reviewed apps with sentiment breakdown
  const appReviewAnalysis = filteredApps.map(app => {
    const appReviews = filteredReviews.filter(review => review.App === app.App);
    if (appReviews.length === 0) return null;

    const positiveCount = appReviews.filter(r => r.Sentiment === 'Positive').length;
    const negativeCount = appReviews.filter(r => r.Sentiment === 'Negative').length;
    const neutralCount = appReviews.filter(r => r.Sentiment === 'Neutral').length;
    const avgPolarity = appReviews.reduce((sum, r) => sum + (r.Sentiment_Polarity || 0), 0) / appReviews.length;

    return {
      App: app.App,
      Category: app.Category,
      Rating: app.Rating,
      'Review Count': appReviews.length,
      'Positive': positiveCount,
      'Negative': negativeCount,
      'Neutral': neutralCount,
      'Avg Polarity': Number(avgPolarity.toFixed(3)),
      'Positive %': Number(((positiveCount / appReviews.length) * 100).toFixed(1))
    };
  }).filter(Boolean).sort((a, b) => (b?.['Review Count'] || 0) - (a?.['Review Count'] || 0)).slice(0, 50);

  // Sentiment distribution by app category
  const categories = [...new Set(filteredApps.map(app => app.Category))];
  const sentimentByCategory = categories.map(category => {
    const categoryApps = filteredApps.filter(app => app.Category === category);
    const categoryReviews = filteredReviews.filter(review => 
      categoryApps.some(app => app.App === review.App)
    );
    
    if (categoryReviews.length === 0) return null;
    
    const positiveCount = categoryReviews.filter(r => r.Sentiment === 'Positive').length;
    const positivePercentage = (positiveCount / categoryReviews.length) * 100;
    
    return {
      name: category,
      value: Number(positivePercentage.toFixed(1))
    };
  }).filter(Boolean).sort((a, b) => (b?.value || 0) - (a?.value || 0)).slice(0, 15);

  // Statistics
  const totalReviews = filteredReviews.length;
  const positiveReviews = filteredReviews.filter(r => r.Sentiment === 'Positive').length;
  const negativeReviews = filteredReviews.filter(r => r.Sentiment === 'Negative').length;
  const neutralReviews = filteredReviews.filter(r => r.Sentiment === 'Neutral').length;
  const avgPolarity = filteredReviews.reduce((sum, r) => sum + (r.Sentiment_Polarity || 0), 0) / totalReviews;

  const reviewColumns = [
    { key: 'App', label: 'App', sortable: true },
    { 
      key: 'Review', 
      label: 'Review Text', 
      sortable: false,
      render: (value: string) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-3" title={value}>
            {value.length > 100 ? `${value.substring(0, 100)}...` : value}
          </p>
        </div>
      )
    },
    { 
      key: 'Sentiment', 
      label: 'Sentiment', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Positive' ? 'bg-green-100 text-green-800' :
          value === 'Negative' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'Polarity', label: 'Polarity', sortable: true },
    { key: 'Subjectivity', label: 'Subjectivity', sortable: true }
  ];

  const appAnalysisColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Review Count', label: 'Reviews', sortable: true },
    { key: 'Positive', label: 'Positive', sortable: true },
    { key: 'Negative', label: 'Negative', sortable: true },
    { key: 'Neutral', label: 'Neutral', sortable: true },
    { key: 'Positive %', label: 'Positive %', sortable: true }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Top Reviews Analysis</h1>
        <p className="text-rose-100">
          Explore the most positive and negative reviews, sentiment patterns, and user feedback insights
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
          icon={ThumbsUp}
          color="green"
        />
        <StatsCard
          title="Negative Reviews"
          value={`${((negativeReviews / totalReviews) * 100).toFixed(1)}%`}
          icon={ThumbsDown}
          color="red"
        />
        <StatsCard
          title="Avg Sentiment"
          value={avgPolarity.toFixed(3)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Sentiment Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Sentiment:</label>
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive Only</option>
            <option value="Negative">Negative Only</option>
            <option value="Neutral">Neutral Only</option>
          </select>
          <span className="text-sm text-gray-500">
            Showing {reviewsToShow.length.toLocaleString()} reviews
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <BarChartComponent
          data={sentimentByCategory}
          title="Positive Sentiment Percentage by Category (Top 15)"
          height={400}
          color="#EC4899"
        />
      </div>

      {/* App Review Analysis */}
      <DataTable
        data={appReviewAnalysis}
        columns={appAnalysisColumns}
        title="Apps with Most Reviews - Sentiment Breakdown"
        pageSize={15}
      />

      {/* Top Reviews Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          data={topPositiveReviews}
          columns={reviewColumns}
          title="Top 20 Most Positive Reviews"
          pageSize={10}
        />
        <DataTable
          data={topNegativeReviews}
          columns={reviewColumns}
          title="Top 20 Most Negative Reviews"
          pageSize={10}
        />
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Insights</h3>
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
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Most Positive Category</p>
                <p className="text-sm text-gray-600">
                  {sentimentByCategory[0]?.name} has {sentimentByCategory[0]?.value}% positive reviews
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
                <p className="font-medium text-gray-900">Overall Sentiment</p>
                <p className="text-sm text-gray-600">
                  Average polarity: {avgPolarity.toFixed(3)} (range: -1 to +1)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopReviewsPage;