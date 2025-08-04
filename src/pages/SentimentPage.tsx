// src/pages/SentimentPage.tsx
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { MessageSquare, TrendingUp, Heart, Frown, RefreshCw } from 'lucide-react';
import { getSentimentDistribution } from '../utils/dataTransformers';

// Define interfaces for clarity and type safety
interface AppData {
  App: string;
  Category: string;
  Rating: number | null;
  'Last Updated': string;
  Installs: string | null;
  Reviews: string;
  InstallsNumeric: number;
  ReviewsNumeric: number;
  EngagementRate: number;
  Price: string;
  Size: string;
  'Content Rating': string;
  Genres: string;
  index?: number;
}

interface AppSentimentAnalysis {
  App: string;
  Category: string;
  Rating: number | null;
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
  // --- ALL REACT HOOKS MUST BE DECLARED AT THE VERY TOP LEVEL AND UNCONDITIONALLY ---
  const { filteredApps, filteredReviews, loading, fetchApps } = useData();

  // State for table controls
  const [sortByAppSentiment, setSortByAppSentiment] = useState<string>('Total Reviews');
  const [sortOrderAppSentiment, setSortOrderAppSentiment] = useState<'desc' | 'asc'>('desc');
  const [sortByReview, setSortByReview] = useState<string>('Sentiment_Polarity');
  const [sortOrderReview, setSortOrderReview] = useState<'desc' | 'asc'>('desc');

  // Data processing with useMemo - These must also be *before* the conditional return
  const sentimentDistribution = useMemo(() => getSentimentDistribution(filteredReviews), [filteredReviews]);

  const uniqueAppNames = useMemo(() => {
    return [...new Set(filteredReviews.map(review => review.App))];
  }, [filteredReviews]);

  const rawAppSentimentAnalysis = useMemo(() => {
    return uniqueAppNames
      .map(appName => {
        const appReviews = filteredReviews.filter(review => review.App === appName);
        if (appReviews.length === 0) return null;

        const appData = filteredApps.find(app => app.App === appName);

        const avgPolarity = appReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / appReviews.length;
        const avgSubjectivity = appReviews.reduce((sum, review) => sum + (review.Sentiment_Subjectivity || 0), 0) / appReviews.length;

        const positiveReviews = appReviews.filter(r => r.Sentiment === 'Positive').length;
        const negativeReviews = appReviews.filter(r => r.Sentiment === 'Negative').length;
        const neutralReviews = appReviews.filter(r => r.Sentiment === 'Neutral').length;

        return {
          App: appName,
          Category: appData?.Category || 'N/A',
          Rating: appData?.Rating || null,
          'Total Reviews': appReviews.length,
          'Avg Polarity': Number(avgPolarity.toFixed(3)),
          'Avg Subjectivity': Number(avgSubjectivity.toFixed(3)),
          'Positive %': Number(((positiveReviews / appReviews.length) * 100).toFixed(1)),
          'Negative %': Number(((negativeReviews / appReviews.length) * 100).toFixed(1)),
          'Neutral %': Number(((neutralReviews / appReviews.length) * 100).toFixed(1))
        };
      })
      .filter((app): app is AppSentimentAnalysis => app !== null);
  }, [filteredReviews, filteredApps, uniqueAppNames]);

  const sortedAppSentimentAnalysis = useMemo(() => {
    return [...rawAppSentimentAnalysis].sort((a, b) => {
      let valA: any = a[sortByAppSentiment as keyof AppSentimentAnalysis];
      let valB: any = b[sortByAppSentiment as keyof AppSentimentAnalysis];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrderAppSentiment === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA === null || typeof valA === 'undefined') valA = (sortOrderAppSentiment === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderAppSentiment === 'asc' ? -Infinity : Infinity);

      if (sortOrderAppSentiment === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [rawAppSentimentAnalysis, sortByAppSentiment, sortOrderAppSentiment]);

  const sentimentRatingData = useMemo(() => {
    return sortedAppSentimentAnalysis
      .filter(app => (app.Rating || 0) > 0)
      .map(app => ({
        rating: app.Rating || 0,
        polarity: app['Avg Polarity'],
        name: app.App
      }));
  }, [sortedAppSentimentAnalysis]);

  const allSortedReviews = useMemo(() => {
    return [...filteredReviews].sort((a, b) => {
      let valA: any = a[sortByReview as keyof ReviewData];
      let valB: any = b[sortByReview as keyof ReviewData];

      if (sortByReview === 'App' || sortByReview === 'Sentiment') {
        return sortOrderReview === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA === null || typeof valA === 'undefined') valA = (sortOrderReview === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderReview === 'asc' ? -Infinity : Infinity);

      if (sortOrderReview === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [filteredReviews, sortByReview, sortOrderReview]);

  const topPositiveReviews: ReviewData[] = useMemo(() => {
    return [...allSortedReviews]
      .filter(review => review.Sentiment === 'Positive' && (review.Sentiment_Polarity || 0) > 0.5)
      .sort((a, b) => (b.Sentiment_Polarity || 0) - (a.Sentiment_Polarity || 0)) as ReviewData[];
  }, [allSortedReviews]);

  const topNegativeReviews: ReviewData[] = useMemo(() => {
    return [...allSortedReviews]
      .filter(review => review.Sentiment === 'Negative' && (review.Sentiment_Polarity || 0) < -0.1)
      .sort((a, b) => (a.Sentiment_Polarity || 0) - (b.Sentiment_Polarity || 0)) as ReviewData[];
  }, [allSortedReviews]);

  // Statistics (These are NOT hooks, so their placement doesn't cause the error)
  const totalReviews = filteredReviews.length;
  const positiveReviews = filteredReviews.filter(r => r.Sentiment === 'Positive').length;
  const negativeReviews = filteredReviews.filter(r => r.Sentiment === 'Negative').length;
  const neutralReviews = filteredReviews.filter(r => r.Sentiment === 'Neutral').length;
  const avgPolarity = totalReviews > 0 ? filteredReviews.reduce((sum, review) => sum + (review.Sentiment_Polarity || 0), 0) / totalReviews : 0;

  const categories = [...new Set(filteredApps.map(app => app.Category))];
  const sentimentByCategory: CategorySentiment[] = useMemo(() => {
    return categories
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
  }, [filteredApps, filteredReviews, categories]);

  const bestCategorySentiment = sentimentByCategory.length > 0 ? sentimentByCategory[0] : null;

  const sentimentInsightsData = [
    {
      id: 'positive',
      label: 'Positive Sentiment',
      value: positiveReviews,
      description: `${positiveReviews.toLocaleString()} positive reviews (${totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(1) : '0.0'}%)`,
      colorClass: 'bg-green-500',
      icon: Heart,
    },
    {
      id: 'best-category',
      label: 'Best Category Sentiment',
      value: bestCategorySentiment?.value ?? 'N/A',
      description: `${bestCategorySentiment?.name || 'N/A'} has the highest sentiment polarity (${bestCategorySentiment?.value?.toFixed(3) ?? 'N/A'})`,
      colorClass: 'bg-pink-500',
      icon: TrendingUp,
    },
    {
      id: 'negative',
      label: 'Negative Sentiment',
      value: negativeReviews,
      description: `${negativeReviews.toLocaleString()} negative reviews (${totalReviews > 0 ? ((negativeReviews / totalReviews) * 100).toFixed(1) : '0.0'}%)`,
      colorClass: 'bg-red-500',
      icon: Frown,
    },
    {
      id: 'overall-polarity',
      label: 'Overall Polarity',
      value: avgPolarity,
      description: `Average sentiment polarity: ${avgPolarity.toFixed(3)} (0 = neutral, +1 = very positive, -1 = very negative)`,
      colorClass: 'bg-purple-500',
      icon: MessageSquare,
    },
  ];

  // Reusable Render Cells for consistency
  const appNameRenderCell = (app: { App: string; Category?: string; Genres?: string }) => (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xl text-gray-600">
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 mb-1 truncate" title={app.App}>
          {app.App}
        </p>
        {app.Genres && (
          <p className="text-xs text-gray-500">
            {app.Genres}
          </p>
        )}
      </div>
    </div>
  );

  const ratingRenderCell = (app: { Rating: number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (app.Rating || 0) >= 4.5 ? 'bg-green-100 text-green-800' :
      (app.Rating || 0) >= 4.0 ? 'bg-blue-100 text-blue-800' :
      (app.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {app.Rating?.toFixed(1) || 'N/A'}
    </span>
  );

  const percentageRenderCell = (value: number) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      value >= 70 ? 'bg-green-100 text-green-800' :
      value >= 40 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {value.toFixed(1)}%
    </span>
  );

  const polarityRenderCell = (value: number | null) => {
    if (value === null) return 'N/A';
    const colorClass = value > 0.3 ? 'bg-green-100 text-green-800' :
                       value < -0.3 ? 'bg-red-100 text-red-800' :
                       'bg-yellow-100 text-yellow-800';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {value.toFixed(3)}
      </span>
    );
  };

  const sentimentStatusRenderCell = (value: 'Positive' | 'Negative' | 'Neutral') => {
    let colorClass = '';
    switch (value) {
      case 'Positive':
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'Negative':
        colorClass = 'bg-red-100 text-red-800';
        break;
      case 'Neutral':
        colorClass = 'bg-gray-100 text-gray-800';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800';
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {value}
      </span>
    );
  };

  const reviewTextRenderCell = (review: ReviewData) => (
    // Added 'break-words' to ensure long words break and wrap within the cell
    <div className="max-w-md text-gray-700 text-sm py-1 break-words">
      {review.Translated_Review || 'No review text'}
    </div>
  );

  // Columns for the "App Sentiment Analysis" table
  const appSentimentTableColumns = useMemo(() => [
    { key: 'App', label: 'App Name', renderCell: appNameRenderCell, textAlign: 'left' },
    { key: 'Category', label: 'Category', textAlign: 'left' },
    { key: 'Rating', label: 'Rating', renderCell: ratingRenderCell, textAlign: 'right' },
    { key: 'Total Reviews', label: 'Reviews', textAlign: 'right',
      renderCell: (app: AppSentimentAnalysis) => (
        <span className="font-mono text-blue-600">{app['Total Reviews'].toLocaleString()}</span>
      )
    },
    { key: 'Avg Polarity', label: 'Avg Polarity', renderCell: (app: AppSentimentAnalysis) => polarityRenderCell(app['Avg Polarity']), textAlign: 'right' },
    { key: 'Positive %', label: 'Positive %', renderCell: (app: AppSentimentAnalysis) => percentageRenderCell(app['Positive %']), textAlign: 'right' },
    { key: 'Negative %', label: 'Negative %', renderCell: (app: AppSentimentAnalysis) => percentageRenderCell(app['Negative %']), textAlign: 'right' }
  ], []);

  // Columns for the "Most Positive/Negative Reviews" tables
  const reviewTableColumns = useMemo(() => [
    { key: 'App', label: 'App', renderCell: appNameRenderCell, textAlign: 'left' },
    { key: 'Translated_Review', label: 'Review', renderCell: reviewTextRenderCell, textAlign: 'left' },
    { key: 'Sentiment', label: 'Sentiment', renderCell: (review: ReviewData) => sentimentStatusRenderCell(review.Sentiment), textAlign: 'center' },
    { key: 'Sentiment_Polarity', label: 'Polarity', renderCell: (review: ReviewData) => polarityRenderCell(review.Sentiment_Polarity), textAlign: 'right' }
  ], []);

  const handleReloadData = () => {
    if (fetchApps) {
      fetchApps();
    }
  };

  // Now, the conditional return is safe because all hooks are above it
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
        />
      </div>

      {/* App Sentiment Analysis Table with consistent styling and controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            App Sentiment Analysis
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByAppSentiment}
              onChange={(e) => setSortByAppSentiment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Total Reviews">📊 Total Reviews</option>
              <option value="App">📱 App Name</option>
              <option value="Category">🏷️ Category</option>
              <option value="Rating">⭐ Rating</option>
              <option value="Avg Polarity">📈 Avg Polarity</option>
              <option value="Positive %">🟢 Positive %</option>
              <option value="Negative %">🔴 Negative %</option>
            </select>
            <button
              onClick={() => setSortOrderAppSentiment(sortOrderAppSentiment === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderAppSentiment === 'desc' ? '↓' : '↑'}
            </button>
            <button
              onClick={handleReloadData}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <DataTable
          data={sortedAppSentimentAnalysis}
          columns={appSentimentTableColumns}
          title=""
          pageSize={15}
          showPagination={true}
          enableSorting={false}
          initialSortBy={sortByAppSentiment}
          initialSortDirection={sortOrderAppSentiment}
          showRankColumn={true}
        />
      </div>

      {/* Most Positive/Negative Reviews Tables with consistent styling and controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Most Positive and Negative Reviews
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByReview}
              onChange={(e) => setSortByReview(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Sentiment_Polarity">📊 Polarity</option>
              <option value="App">📱 App Name</option>
              <option value="Sentiment">💬 Sentiment Type</option>
            </select>
            <button
              onClick={() => setSortOrderReview(sortOrderReview === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderReview === 'desc' ? '↓' : '↑'}
            </button>
            <button
              onClick={handleReloadData}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable
            data={topPositiveReviews}
            columns={reviewTableColumns}
            title="Most Positive Reviews"
            pageSize={10}
            showPagination={true}
            enableSorting={false}
            initialSortBy={sortByReview}
            initialSortDirection={sortOrderReview}
            showRankColumn={true}
          />
          <DataTable
            data={topNegativeReviews}
            columns={reviewTableColumns}
            title="Most Negative Reviews"
            pageSize={10}
            showPagination={true}
            enableSorting={false}
            initialSortBy={sortByReview}
            initialSortDirection={sortOrderReview}
            showRankColumn={true}
          />
        </div>
      </div>

      {/* Insights Card */}
      <InsightsCard
        title="Sentiment Insights"
        insights={sentimentInsightsData}
      />
    </div>
  );
};

export default SentimentPage;