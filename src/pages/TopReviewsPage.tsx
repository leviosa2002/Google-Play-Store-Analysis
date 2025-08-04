import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard';
import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';

// --- START: Added Interfaces for better type safety (Crucial for the insights data structure) ---
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

  // --- START: State for table controls (NEW) ---
  // For 'Apps with Most Reviews' table
  const [sortByAppAnalysis, setSortByAppAnalysis] = useState<string>('Review Count');
  const [sortOrderAppAnalysis, setSortOrderAppAnalysis] = useState<'asc' | 'desc'>('desc');

  // For 'Top Positive Reviews' and 'Top Negative Reviews' tables
  const [sortByReview, setSortByReview] = useState<string>('Polarity'); // Default for reviews
  const [sortOrderReview, setSortOrderReview] = useState<'asc' | 'desc'>('desc'); // Default for reviews (desc for positive, asc for negative)
  // --- END: State for table controls ---


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter reviews based on selected sentiment
  const reviewsToShow = useMemo(() => {
    return selectedSentiment === 'All'
      ? filteredReviews
      : filteredReviews.filter(review => review.Sentiment === selectedSentiment);
  }, [selectedSentiment, filteredReviews]);

  // Top positive reviews (highest polarity)
  const rawTopPositiveReviews = useMemo(() => {
    return filteredReviews
      .filter(review => review.Sentiment === 'Positive' && (review.Sentiment_Polarity || 0) > 0.5)
      .map(review => ({
        App: review.App,
        Review: review.Translated_Review || 'No review text',
        Sentiment: review.Sentiment,
        Polarity: Number((review.Sentiment_Polarity || 0).toFixed(3)),
        Subjectivity: Number((review.Sentiment_Subjectivity || 0).toFixed(3))
      }));
  }, [filteredReviews]);

  // Sort Top Positive Reviews
  const sortedTopPositiveReviews = useMemo(() => {
    return [...rawTopPositiveReviews].sort((a, b) => {
      let valA: any = a[sortByReview as keyof typeof a];
      let valB: any = b[sortByReview as keyof typeof b];

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderReview === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderReview === 'asc' ? -Infinity : Infinity);

      if (sortOrderReview === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 20); // Still slice to top 20 after sorting
  }, [rawTopPositiveReviews, sortByReview, sortOrderReview]);


  // Top negative reviews (lowest polarity)
  const rawTopNegativeReviews = useMemo(() => {
    return filteredReviews
      .filter(review => review.Sentiment === 'Negative' && (review.Sentiment_Polarity || 0) < -0.1)
      .map(review => ({
        App: review.App,
        Review: review.Translated_Review || 'No review text',
        Sentiment: review.Sentiment,
        Polarity: Number((review.Sentiment_Polarity || 0).toFixed(3)),
        Subjectivity: Number((review.Sentiment_Subjectivity || 0).toFixed(3))
      }));
  }, [filteredReviews]);

  // Sort Top Negative Reviews (note: sorting by Polarity asc for negative reviews to get 'most negative')
  const sortedTopNegativeReviews = useMemo(() => {
    return [...rawTopNegativeReviews].sort((a, b) => {
      let valA: any = a[sortByReview as keyof typeof a];
      let valB: any = b[sortByReview as keyof typeof b];

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderReview === 'asc' ? Infinity : -Infinity); // For negative, asc means more negative
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderReview === 'asc' ? Infinity : -Infinity);

      if (sortOrderReview === 'asc') {
        return valA - valB; // For negative, asc will bring lower (more negative) values first
      } else {
        return valB - valA;
      }
    }).slice(0, 20); // Still slice to top 20 after sorting
  }, [rawTopNegativeReviews, sortByReview, sortOrderReview]);


  // Most reviewed apps with sentiment breakdown
  const rawAppReviewAnalysis: AppReviewAnalysis[] = useMemo(() => {
    return filteredApps.map((app: AppData) => {
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
    }).filter((app): app is AppReviewAnalysis => app !== null);
  }, [filteredApps, filteredReviews]);

  // Sort App Review Analysis
  const sortedAppReviewAnalysis = useMemo(() => {
    return [...rawAppReviewAnalysis].sort((a, b) => {
      let valA: any = a[sortByAppAnalysis as keyof AppReviewAnalysis];
      let valB: any = b[sortByAppAnalysis as keyof AppReviewAnalysis];

      if (valA === null || typeof valA === 'undefined') valA = (sortOrderAppAnalysis === 'asc' ? -Infinity : Infinity);
      if (valB === null || typeof valB === 'undefined') valB = (sortOrderAppAnalysis === 'asc' ? -Infinity : Infinity);

      if (sortOrderAppAnalysis === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    }).slice(0, 50); // Slice to top 50 after sorting
  }, [rawAppReviewAnalysis, sortByAppAnalysis, sortOrderAppAnalysis]);


  // Sentiment distribution by app category
  const sentimentByCategory: CategorySentiment[] = useMemo(() => {
    const categories = [...new Set(filteredApps.map((app: AppData) => app.Category))];
    return categories.map(category => {
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
    }).filter((cat): cat is CategorySentiment => cat !== null)
      .sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 15);
  }, [filteredApps, filteredReviews]);

  // Statistics
  const totalReviews = filteredReviews.length;
  const positiveReviews = filteredReviews.filter(r => r.Sentiment === 'Positive').length;
  const negativeReviews = filteredReviews.filter(r => r.Sentiment === 'Negative').length;
  const neutralReviews = filteredReviews.filter(r => r.Sentiment === 'Neutral').length;
  const avgPolarity = totalReviews > 0 ? filteredReviews.reduce((sum, r) => sum + (r.Sentiment_Polarity || 0), 0) / totalReviews : 0;

  // Get most and least positive categories for insights, handling empty array
  const mostPositiveCategory = sentimentByCategory.length > 0 ? sentimentByCategory[0] : null;
  const leastPositiveCategory = sentimentByCategory.length > 0 ? sentimentByCategory[sentimentByCategory.length - 1] : null;

  // Data for the InsightsCard component
  const reviewInsightsData = useMemo(() => [
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
      icon: Sparkles,
    },
    {
      id: 'lowest-positive-category',
      label: 'Lowest Positive Category',
      value: leastPositiveCategory?.name || 'N/A',
      description: `${leastPositiveCategory?.name || 'No data'} shows the lowest positive sentiment at ${leastPositiveCategory?.value ?? '0.0'}%.`,
      colorClass: 'bg-orange-500',
      icon: AlertTriangle,
    },
    {
      id: 'most-active-app',
      label: 'Most Reviewed Application',
      value: sortedAppReviewAnalysis.length > 0 ? sortedAppReviewAnalysis[0].App : 'N/A',
      description: `"${sortedAppReviewAnalysis.length > 0 ? sortedAppReviewAnalysis[0].App : 'No data'}" has received the most user reviews (${sortedAppReviewAnalysis.length > 0 ? sortedAppReviewAnalysis[0]['Review Count'].toLocaleString() : '0'}).`,
      colorClass: 'bg-indigo-500',
      icon: MessageSquare,
    },
  ], [totalReviews, positiveReviews, negativeReviews, avgPolarity, mostPositiveCategory, leastPositiveCategory, sortedAppReviewAnalysis]);


  // --- START: Common Render Cell Functions for DataTables ---
  // Reusable App Name render cell
  const appNameCommonRenderCell = (item: { App: string; Category?: string }) => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-md text-gray-600">
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate" title={item.App}>
          {item.App}
        </p>
        {item.Category && (
          <p className="text-xs text-gray-500 truncate">{item.Category}</p>
        )}
      </div>
    </div>
  );

  // Reusable Category render cell
  const categoryCommonRenderCell = (item: { Category: string }) => (
    <span className="text-gray-700 font-medium">{item.Category}</span>
  );

  // Reusable Rating render cell
  const ratingCommonRenderCell = (item: { Rating: number | null }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      (item.Rating || 0) >= 4.0 ? 'bg-green-100 text-green-800' :
      (item.Rating || 0) >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {item.Rating?.toFixed(1) || 'N/A'}
    </span>
  );

  // --- END: Common Render Cell Functions ---


  // reviewColumns (UPDATED to use renderCell)
  const reviewColumns = useMemo(() => [
    { key: 'App', label: 'App', renderCell: appNameCommonRenderCell, textAlign: 'left' },
    {
      key: 'Review',
      label: 'Review Text',
      sortable: false, // Review text is typically not sortable
      renderCell: (item: { Review: string }) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-3" title={item.Review}>
            {item.Review.length > 100 ? `${item.Review.substring(0, 100)}...` : item.Review}
          </p>
        </div>
      )
    },
    {
      key: 'Sentiment',
      label: 'Sentiment',
      sortable: true,
      renderCell: (item: { Sentiment: string }) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.Sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
          item.Sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {item.Sentiment}
        </span>
      ),
      textAlign: 'center'
    },
    {
      key: 'Polarity',
      label: 'Polarity',
      sortable: true,
      renderCell: (item: { Polarity: number }) => (
        <span className="font-mono text-blue-700">
          {item.Polarity.toFixed(3)}
        </span>
      ),
      textAlign: 'right'
    },
    {
      key: 'Subjectivity',
      label: 'Subjectivity',
      sortable: true,
      renderCell: (item: { Subjectivity: number }) => (
        <span className="font-mono text-purple-700">
          {item.Subjectivity.toFixed(3)}
        </span>
      ),
      textAlign: 'right'
    }
  ], []);

  // appAnalysisColumns (UPDATED to use renderCell)
  const appAnalysisColumns = useMemo(() => [
    { key: 'App', label: 'App Name', renderCell: appNameCommonRenderCell, textAlign: 'left' },
    { key: 'Category', label: 'Category', renderCell: categoryCommonRenderCell, textAlign: 'left' },
    { key: 'Rating', label: 'Rating', renderCell: ratingCommonRenderCell, textAlign: 'right' },
    {
      key: 'Review Count',
      label: 'Reviews',
      sortable: true,
      renderCell: (item: { 'Review Count': number }) => (
        <span className="font-mono text-gray-800">{item['Review Count'].toLocaleString()}</span>
      ),
      textAlign: 'right'
    },
    {
      key: 'Positive',
      label: 'Positive',
      sortable: true,
      renderCell: (item: { Positive: number }) => (
        <span className="font-mono text-green-700">{item.Positive.toLocaleString()}</span>
      ),
      textAlign: 'right'
    },
    {
      key: 'Negative',
      label: 'Negative',
      sortable: true,
      renderCell: (item: { Negative: number }) => (
        <span className="font-mono text-red-700">{item.Negative.toLocaleString()}</span>
      ),
      textAlign: 'right'
    },
    {
      key: 'Neutral',
      label: 'Neutral',
      sortable: true,
      renderCell: (item: { Neutral: number }) => (
        <span className="font-mono text-gray-700">{item.Neutral.toLocaleString()}</span>
      ),
      textAlign: 'right'
    },
    {
      key: 'Positive %',
      label: 'Positive %',
      sortable: true,
      renderCell: (item: { 'Positive %': number }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item['Positive %'] >= 70 ? 'bg-lime-100 text-lime-800' :
          item['Positive %'] >= 50 ? 'bg-yellow-100 text-yellow-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {item['Positive %'].toFixed(1)}%
        </span>
      ),
      textAlign: 'right'
    }
  ], []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg p-8 text-white shadow-lg">
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

      {/* Sentiment Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <label htmlFor="sentiment-filter" className="text-sm font-medium text-gray-700">Filter by Sentiment:</label>
          <select
            id="sentiment-filter"
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
      <div className="grid grid-cols-1 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <BarChartComponent
          data={sentimentByCategory}
          title="Positive Sentiment Percentage by Category (Top 15)"
          height={400}
          color="#EC4899"
        />
      </div>

      {/* !!! START: Modified App Review Analysis Table Section for consistent UX !!! */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Apps with Most Reviews - Sentiment Breakdown
          </h3>
          <div className="flex space-x-2">
            <select
              value={sortByAppAnalysis}
              onChange={(e) => setSortByAppAnalysis(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Review Count">💬 Review Count</option>
              <option value="Positive %">👍 Positive %</option>
              <option value="Avg Polarity">📊 Avg Polarity</option>
              <option value="Rating">⭐ Rating</option>
            </select>
            <button
              onClick={() => setSortOrderAppAnalysis(sortOrderAppAnalysis === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {sortOrderAppAnalysis === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
        <DataTable
          data={sortedAppReviewAnalysis} // Pass the full sorted list
          columns={appAnalysisColumns}
          title="" // Empty title as it's handled externally
          pageSize={15}
          showPagination={true}
          enableSorting={false} // External sorting only
          initialSortBy={sortByAppAnalysis}
          initialSortDirection={sortOrderAppAnalysis}
          showRankColumn={true}
        />
      </div>
      {/* !!! END: Modified App Review Analysis Table Section !!! */}


      {/* !!! START: Modified Top Reviews Tables Sections for consistent UX !!! */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Top 20 Most Positive Reviews
            </h3>
            <div className="flex space-x-2">
              <select
                value={sortByReview}
                onChange={(e) => setSortByReview(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Polarity">📊 Polarity</option>
                <option value="Subjectivity">🔬 Subjectivity</option>
              </select>
              <button
                onClick={() => setSortOrderReview(sortOrderReview === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                {sortOrderReview === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          <DataTable
            data={sortedTopPositiveReviews}
            columns={reviewColumns}
            title=""
            pageSize={10}
            showPagination={true}
            enableSorting={false} // External sorting only
            initialSortBy={sortByReview}
            initialSortDirection={sortOrderReview}
            showRankColumn={true}
          />
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Top 20 Most Negative Reviews
            </h3>
            <div className="flex space-x-2">
              <select
                value={sortByReview} // Using the same sort state for both review tables for simplicity
                onChange={(e) => setSortByReview(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Polarity">📊 Polarity</option>
                <option value="Subjectivity">🔬 Subjectivity</option>
              </select>
              <button
                // For negative reviews, 'asc' on polarity means more negative
                onClick={() => setSortOrderReview(sortOrderReview === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                {sortOrderReview === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          <DataTable
            data={sortedTopNegativeReviews}
            columns={reviewColumns}
            title=""
            pageSize={10}
            showPagination={true}
            enableSorting={false} // External sorting only
            initialSortBy={sortByReview}
            initialSortDirection={sortOrderReview}
            showRankColumn={true}
          />
        </div>
      </div>
      {/* !!! END: Modified Top Reviews Tables Sections !!! */}

      {/* Insights - Now using InsightsCard component */}
      <InsightsCard
        title="Key Review Insights"
        insights={reviewInsightsData}
      />
    </div>
  );
};

export default TopReviewsPage;