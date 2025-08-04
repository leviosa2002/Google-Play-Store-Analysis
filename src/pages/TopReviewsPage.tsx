import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
// --- START CHANGES FOR INSIGHTS CARD ---
// Import the InsightsCard component
import InsightsCard from '../components/InsightsCard';
// Import additional icons that might be useful for new insights
import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';
// --- END CHANGES FOR INSIGHTS CARD ---

// --- START: Added Interfaces for better type safety (Crucial for the insights data structure) ---
// These should ideally be in a shared types file (e.g., `src/types/data.ts`)
interface ReviewData {
  App: string;
  Translated_Review: string | null;
  Sentiment: 'Positive' | 'Negative' | 'Neutral';
  Sentiment_Polarity: number | null;
  Sentiment_Subjectivity: number | null;
}

interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  // Add other properties from your actual AppData if needed for calculations
  // e.g., Reviews: number; Size: string;
}

interface AppReviewAnalysis {
  App: string;
  Category: string;
  Rating: number | null;
  'Review Count': number;
  Positive: number;
  Negative: number;
  Neutral: number;
  'Avg Polarity': number;
  'Positive %': number;
}

interface CategorySentiment {
  name: string;
  value: number; // For percentage of positive reviews
}
// --- END: Added Interfaces ---


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

  // Filter reviews based on selected sentiment (NO CHANGE)
  const reviewsToShow = selectedSentiment === 'All'
    ? filteredReviews
    : filteredReviews.filter(review => review.Sentiment === selectedSentiment);

  // Top positive reviews (highest polarity) (NO CHANGE - assuming 'Review' key is handled by DataTable)
  const topPositiveReviews = filteredReviews
    .filter(review => review.Sentiment === 'Positive' && (review.Sentiment_Polarity || 0) > 0.5)
    .sort((a, b) => (b.Sentiment_Polarity || 0) - (a.Sentiment_Polarity || 0))
    .slice(0, 20)
    .map(review => ({
      App: review.App,
      Review: review.Translated_Review || 'No review text',
      Sentiment: review.Sentiment,
      Polarity: Number((review.Sentiment_Polarity || 0).toFixed(3)),
      Subjectivity: Number((review.Sentiment_Subjectivity || 0).toFixed(3))
    }));

  // Top negative reviews (lowest polarity) (NO CHANGE - assuming 'Review' key is handled by DataTable)
  const topNegativeReviews = filteredReviews
    .filter(review => review.Sentiment === 'Negative' && (review.Sentiment_Polarity || 0) < -0.1)
    .sort((a, b) => (a.Sentiment_Polarity || 0) - (b.Sentiment_Polarity || 0))
    .slice(0, 20)
    .map(review => ({
      App: review.App,
      Review: review.Translated_Review || 'No review text',
      Sentiment: review.Sentiment,
      Polarity: Number((review.Sentiment_Polarity || 0).toFixed(3)),
      Subjectivity: Number((review.Sentiment_Subjectivity || 0).toFixed(3))
    }));

  // Most reviewed apps with sentiment breakdown (NO CHANGE)
  const appReviewAnalysis: AppReviewAnalysis[] = filteredApps.map((app: AppData) => {
    const appReviews = filteredReviews.filter((review: ReviewData) => review.App === app.App);
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
  }).filter((app): app is AppReviewAnalysis => app !== null) // Added type guard
    .sort((a, b) => (b['Review Count'] || 0) - (a['Review Count'] || 0)).slice(0, 50);

  // Sentiment distribution by app category (NO CHANGE)
  const categories = [...new Set(filteredApps.map((app: AppData) => app.Category))];
  const sentimentByCategory: CategorySentiment[] = categories.map(category => {
    const categoryApps = filteredApps.filter((app: AppData) => app.Category === category);
    const categoryReviews = filteredReviews.filter((review: ReviewData) =>
      categoryApps.some(app => app.App === review.App)
    );

    if (categoryReviews.length === 0) return null;

    const positiveCount = categoryReviews.filter(r => r.Sentiment === 'Positive').length;
    const positivePercentage = (positiveCount / categoryReviews.length) * 100;

    return {
      name: category,
      value: Number(positivePercentage.toFixed(1))
    };
  }).filter((cat): cat is CategorySentiment => cat !== null) // Added type guard
    .sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 15);

  // Statistics (NO CHANGE, but added check for totalReviews > 0 to prevent NaN for avgPolarity)
  const totalReviews = filteredReviews.length;
  const positiveReviews = filteredReviews.filter(r => r.Sentiment === 'Positive').length;
  const negativeReviews = filteredReviews.filter(r => r.Sentiment === 'Negative').length;
  const neutralReviews = filteredReviews.filter(r => r.Sentiment === 'Neutral').length;
  const avgPolarity = totalReviews > 0 ? filteredReviews.reduce((sum, r) => sum + (r.Sentiment_Polarity || 0), 0) / totalReviews : 0;

  // --- START CHANGES FOR INSIGHTS CARD DATA PREPARATION ---
  // Get most and least positive categories for insights, handling empty array
  const mostPositiveCategory = sentimentByCategory.length > 0 ? sentimentByCategory[0] : null;
  const leastPositiveCategory = sentimentByCategory.length > 0 ? sentimentByCategory[sentimentByCategory.length - 1] : null;

  // Data for the InsightsCard component
  const reviewInsightsData = [
    {
      id: 'total-reviews-insight',
      label: 'Total Reviews Analyzed',
      value: totalReviews.toLocaleString(),
      description: `All insights are based on a dataset of ${totalReviews.toLocaleString()} user reviews.`,
      colorClass: 'bg-blue-500',
      icon: MessageSquare,
    },
    {
      id: 'positive-sentiment-share',
      label: 'Overall Positive Sentiment',
      value: totalReviews > 0 ? `${((positiveReviews / totalReviews) * 100).toFixed(1)}%` : '0.0%',
      description: `A significant portion of user feedback expresses positive sentiment.`,
      colorClass: 'bg-green-500',
      icon: ThumbsUp,
    },
    {
      id: 'negative-sentiment-share',
      label: 'Overall Negative Sentiment',
      value: totalReviews > 0 ? `${((negativeReviews / totalReviews) * 100).toFixed(1)}%` : '0.0%',
      description: `Identify key areas for improvement from negative user experiences.`,
      colorClass: 'bg-red-500',
      icon: ThumbsDown,
    },
    {
      id: 'average-polarity',
      label: 'Average Review Polarity',
      value: avgPolarity.toFixed(3),
      description: `The average sentiment score across all reviews (range: -1 to +1).`,
      colorClass: 'bg-purple-500',
      icon: TrendingUp,
    },
    {
      id: 'top-positive-category',
      label: 'Leading Positive Category',
      value: mostPositiveCategory?.name || 'N/A',
      description: `${mostPositiveCategory?.name || 'No data'} holds the highest positive sentiment at ${mostPositiveCategory?.value ?? '0.0'}%.`,
      colorClass: 'bg-rose-500',
      icon: Sparkles, // Using a new icon from lucide-react
    },
    {
      id: 'lowest-positive-category',
      label: 'Lowest Positive Category',
      value: leastPositiveCategory?.name || 'N/A',
      description: `${leastPositiveCategory?.name || 'No data'} shows the lowest positive sentiment at ${leastPositiveCategory?.value ?? '0.0'}%.`,
      colorClass: 'bg-orange-500',
      icon: AlertTriangle, // Using a new icon from lucide-react
    },
    {
      id: 'most-active-app',
      label: 'Most Reviewed Application',
      value: appReviewAnalysis.length > 0 ? appReviewAnalysis[0].App : 'N/A',
      description: `"${appReviewAnalysis.length > 0 ? appReviewAnalysis[0].App : 'No data'}" has received the most user reviews (${appReviewAnalysis.length > 0 ? appReviewAnalysis[0]['Review Count'].toLocaleString() : '0'}).`,
      colorClass: 'bg-indigo-500',
      icon: MessageSquare,
    },
  ];
  // --- END CHANGES FOR INSIGHTS CARD DATA PREPARATION ---


  // reviewColumns (NO CHANGE)
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

  // appAnalysisColumns (NO CHANGE)
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
      {/* Header (NO CHANGE) */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Top Reviews Analysis</h1>
        <p className="text-rose-100">
          Explore the most positive and negative reviews, sentiment patterns, and user feedback insights
        </p>
      </div>

      {/* Stats Cards (NO CHANGE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Reviews"
          value={totalReviews.toLocaleString()}
          icon={MessageSquare}
          color="blue"
        />
        <StatsCard
          title="Positive Reviews"
          value={totalReviews > 0 ? `${((positiveReviews / totalReviews) * 100).toFixed(1)}%` : '0.0%'}
          icon={ThumbsUp}
          color="green"
        />
        <StatsCard
          title="Negative Reviews"
          value={totalReviews > 0 ? `${((negativeReviews / totalReviews) * 100).toFixed(1)}%` : '0.0%'}
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

      {/* Sentiment Filter (NO CHANGE) */}
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

      {/* Charts (NO CHANGE) */}
      <div className="grid grid-cols-1 gap-6">
        <BarChartComponent
          data={sentimentByCategory}
          title="Positive Sentiment Percentage by Category (Top 15)"
          height={400}
          color="#EC4899"
        />
      </div>

      {/* App Review Analysis (NO CHANGE) */}
      <DataTable
        data={appReviewAnalysis}
        columns={appAnalysisColumns}
        title="Apps with Most Reviews - Sentiment Breakdown"
        pageSize={15}
      />

      {/* Top Reviews Tables (NO CHANGE) */}
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

      {/* --- START REPLACEMENT OF MANUAL INSIGHTS DIV WITH INSIGHTSCARD --- */}
      {/* Original Insights div removed and replaced with InsightsCard */}
      <InsightsCard
        title="Key Review Insights"
        insights={reviewInsightsData}
      />
      {/* --- END REPLACEMENT --- */}
    </div>
  );
};

export default TopReviewsPage;