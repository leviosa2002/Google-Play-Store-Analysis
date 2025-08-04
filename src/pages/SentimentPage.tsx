// src/pages/SentimentPage.tsx
import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { MessageSquare, TrendingUp, Heart, Frown } from 'lucide-react';
import { getSentimentDistribution } from '../utils/dataTransformers';

// Define interfaces for clarity and type safety
interface AppSentimentAnalysis {
  App: string;
  Category: string;
  Rating: number | null; // Rating can be null in raw data
  'Total Reviews': number;
  'Avg Polarity': number;
  'Avg Subjectivity': number;
  'Positive %': number;
  'Negative %': number;
  'Neutral %': number;
}

interface CategorySentiment {
  name: string;
  value: number;
}

interface ReviewData {
  App: string;
  Translated_Review: string;
  Sentiment: 'Positive' | 'Negative' | 'Neutral';
  Sentiment_Polarity: number | null;
  Sentiment_Subjectivity: number | null;
}

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

  // --- START MODIFICATION FOR appSentimentAnalysis: Ensures unique apps in the table ---
  // 1. Get unique app names from all filtered reviews
  const uniqueAppNames = [...new Set(filteredReviews.map(review => review.App))];

  // 2. Calculate sentiment analysis for each unique app name
  const appSentimentAnalysis: AppSentimentAnalysis[] = uniqueAppNames
    .map(appName => {
      // Get all reviews for the current unique app
      const appReviews = filteredReviews.filter(review => review.App === appName);
      if (appReviews.length === 0) return null; // Should ideally not happen if appName came from filteredReviews

      // Find the corresponding app's data (category, rating) from the filteredApps list
      // Use .find() to get the first matching app, assuming consistency
      const appData = filteredApps.find(app => app.App === appName);

      // Calculate sentiment metrics
      const avgPolarity = appReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / appReviews.length;
      const avgSubjectivity = appReviews.reduce((sum, review) => sum + (review.Sentiment_Subjectivity || 0), 0) / appReviews.length;

      const positiveReviews = appReviews.filter(r => r.Sentiment === 'Positive').length;
      const negativeReviews = appReviews.filter(r => r.Sentiment === 'Negative').length;
      const neutralReviews = appReviews.filter(r => r.Sentiment === 'Neutral').length;

      return {
        App: appName,
        Category: appData?.Category || 'N/A', // Use optional chaining for safety
        Rating: appData?.Rating || null,
        'Total Reviews': appReviews.length,
        'Avg Polarity': Number(avgPolarity.toFixed(3)),
        'Avg Subjectivity': Number(avgSubjectivity.toFixed(3)),
        'Positive %': Number(((positiveReviews / appReviews.length) * 100).toFixed(1)),
        'Negative %': Number(((negativeReviews / appReviews.length) * 100).toFixed(1)),
        'Neutral %': Number(((neutralReviews / appReviews.length) * 100).toFixed(1))
      };
    })
    .filter((app): app is AppSentimentAnalysis => app !== null) // Filter out any null entries if an app had no reviews
    .sort((a, b) => b['Total Reviews'] - a['Total Reviews']) // Sort by total reviews (descending)
    .slice(0, 50); // Take the top 50 apps
  // --- END MODIFICATION FOR appSentimentAnalysis ---

  // Sentiment vs Rating correlation
  const sentimentRatingData = appSentimentAnalysis
    .filter(app => (app.Rating || 0) > 0) // Filter out apps without a valid rating
    .map(app => ({
      rating: app.Rating || 0,
      polarity: app['Avg Polarity'],
      name: app.App
    }));

  // Top positive and negative reviews
  // These lists will show individual reviews, even if from the same app.
  // If you want only one review per app, a further de-duplication step would be needed here.
  const topPositiveReviews: ReviewData[] = filteredReviews
    .filter(review => review.Sentiment === 'Positive' && (review.Sentiment_Polarity || 0) > 0.5)
    .sort((a, b) => (b.Sentiment_Polarity || 0) - (a.Sentiment_Polarity || 0))
    .slice(0, 10) as ReviewData[];

  const topNegativeReviews: ReviewData[] = filteredReviews
    .filter(review => review.Sentiment === 'Negative' && (review.Sentiment_Polarity || 0) < -0.1)
    .sort((a, b) => (a.Sentiment_Polarity || 0) - (b.Sentiment_Polarity || 0))
    .slice(0, 10) as ReviewData[];

  // Statistics
  const totalReviews = filteredReviews.length;
  const positiveReviews = filteredReviews.filter(r => r.Sentiment === 'Positive').length;
  const negativeReviews = filteredReviews.filter(r => r.Sentiment === 'Negative').length;
  const neutralReviews = filteredReviews.filter(r => r.Sentiment === 'Neutral').length;
  const avgPolarity = totalReviews > 0 ? filteredReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / totalReviews : 0;

  // Sentiment by category
  const categories = [...new Set(filteredApps.map(app => app.Category))];
  const sentimentByCategory: CategorySentiment[] = categories
    .map(category => {
      const categoryApps = filteredApps.filter(app => app.Category === category);
      const categoryReviews = filteredReviews.filter(review =>
        categoryApps.some(app => app.App === review.App)
      );

      if (categoryReviews.length === 0) return null;

      const categoryAvgPolarity = categoryReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / categoryReviews.length;

      return {
        name: category,
        value: Number(categoryAvgPolarity.toFixed(3))
      };
    })
    .filter((cat): cat is CategorySentiment => cat !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  // Get the best category for insights, handling empty array
  const bestCategorySentiment = sentimentByCategory.length > 0 ? sentimentByCategory[0] : null;

  // Prepare data for the generic InsightsCard
  const sentimentInsightsData = [
    {
      id: 'positive',
      label: 'Positive Sentiment',
      value: positiveReviews,
      description: `${positiveReviews.toLocaleString()} positive reviews (${totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(1) : '0.0'}%)`,
      colorClass: 'bg-green-500',
      icon: Heart, // Added icon
    },
    {
      id: 'best-category',
      label: 'Best Category Sentiment',
      value: bestCategorySentiment?.value ?? 'N/A',
      description: `${bestCategorySentiment?.name || 'N/A'} has the highest sentiment polarity (${bestCategorySentiment?.value?.toFixed(3) ?? 'N/A'})`,
      colorClass: 'bg-pink-500',
      icon: TrendingUp, // Added icon
    },
    {
      id: 'negative',
      label: 'Negative Sentiment',
      value: negativeReviews,
      description: `${negativeReviews.toLocaleString()} negative reviews (${totalReviews > 0 ? ((negativeReviews / totalReviews) * 100).toFixed(1) : '0.0'}%)`,
      colorClass: 'bg-red-500',
      icon: Frown, // Added icon
    },
    {
      id: 'overall-polarity',
      label: 'Overall Polarity',
      value: avgPolarity,
      description: `Average sentiment polarity: ${avgPolarity.toFixed(3)} (0 = neutral, +1 = very positive, -1 = very negative)`,
      colorClass: 'bg-purple-500',
      icon: MessageSquare, // Added icon
    },
  ];

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
      render: (value: string | undefined) => (
        <div className="max-w-xs truncate" title={value || 'No review text'}>
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
          value={totalReviews > 0 ? `${((positiveReviews / totalReviews) * 100).toFixed(1)}%` : '0.0%'}
          icon={Heart}
          color="green"
        />
        <StatsCard
          title="Negative Reviews"
          value={totalReviews > 0 ? `${((negativeReviews / totalReviews) * 100).toFixed(1)}%` : '0.0%'}
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
          color="#EC4899"
        />
        <BarChartComponent
          data={sentimentByCategory}
          title="Average Sentiment by Category (Top 15)"
          height={400}
          color="#EF4444"
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
          // For this scatter plot, we usually want app ratings on X (0-5) and polarity on Y (-1 to +1)
          // No specific xAxisDomain or yAxisDomain props passed here, letting Recharts auto-adjust based on data.
          // If you need specific ranges, add them like: xAxisDomain={[0, 5]} yAxisDomain={[-1, 1]}
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

      {/* Insights Card - now using the generic InsightsCard */}
      <InsightsCard
        title="Sentiment Insights"
        insights={sentimentInsightsData}
      />
    </div>
  );
};

export default SentimentPage;