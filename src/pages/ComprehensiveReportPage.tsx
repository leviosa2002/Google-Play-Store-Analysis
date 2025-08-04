import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard'; // <--- Import InsightsCard
import {
  FileText,
  BarChart3,
  TrendingUp,
  Star,
  Download,
  MessageSquare,
  Smartphone,
  Calendar
} from 'lucide-react';
import {
  getCategoryDistribution,
  getRatingDistribution,
  getSentimentDistribution,
  getInstallsDistribution,
  getContentRatingDistribution,
  parseInstalls,
  formatInstalls
} from '../utils/dataTransformers';

const ComprehensiveReportPage: React.FC = () => {
  const { filteredApps, filteredReviews, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Key metrics
  const totalApps = filteredApps.length;
  const totalReviews = filteredReviews.length;
  const averageRating = totalApps > 0 ? filteredApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / totalApps : 0;
  const totalInstalls = filteredApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
  const freeApps = filteredApps.filter(app => app.Type === 'Free').length;
  const paidApps = filteredApps.filter(app => app.Type === 'Paid').length;

  // Data for charts
  const categoryData = getCategoryDistribution(filteredApps).slice(0, 10);
  const ratingData = getRatingDistribution(filteredApps);
  const sentimentData = getSentimentDistribution(filteredReviews);
  const installsData = getInstallsDistribution(filteredApps);
  const contentRatingData = getContentRatingDistribution(filteredApps);

  // Top performers
  const topRatedApps = filteredApps
    .filter(app => (app.Rating || 0) >= 4.5 && (app.Reviews || 0) >= 1000)
    .sort((a, b) => (b.Rating || 0) - (a.Rating || 0))
    .slice(0, 5);

  const topInstalledApps = filteredApps
    .sort((a, b) => parseInstalls(b.Installs || '0') - parseInstalls(a.Installs || '0'))
    .slice(0, 5);

  // Market insights
  const categories = [...new Set(filteredApps.map(app => app.Category))];
  const avgRatingByCategory = categories.map(category => {
    const categoryApps = filteredApps.filter(app => app.Category === category);
    const avgRating = categoryApps.length > 0 ? categoryApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / categoryApps.length : 0;
    return { category, avgRating, appCount: categoryApps.length };
  }).sort((a, b) => b.avgRating - a.avgRating);

  // Sentiment analysis
  const positiveReviews = filteredReviews.filter(r => r.Sentiment === 'Positive').length;
  const negativeReviews = filteredReviews.filter(r => r.Sentiment === 'Negative').length;
  const neutralReviews = filteredReviews.filter(r => r.Sentiment === 'Neutral').length;
  const avgSentimentPolarity = totalReviews > 0 ? filteredReviews.reduce((sum, r) => sum + (r.Sentiment_Polarity || 0), 0) / totalReviews : 0;

  // Update recency analysis
  const appsWithDates = filteredApps.filter(app => {
    const date = new Date(app['Last Updated']);
    return !isNaN(date.getTime());
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentlyUpdated = appsWithDates.filter(app => new Date(app['Last Updated']) >= sixMonthsAgo).length;

  // Size analysis
  const appsWithSize = filteredApps.filter(app =>
    app.Size && app.Size !== 'Varies with device' && !isNaN(parseFloat(app.Size))
  );

  // Prepare data for the InsightsCard for 'Market Statistics'
  const marketStatisticsInsights = [
    {
      id: 'free-paid-apps',
      label: 'Free vs Paid Apps',
      value: `${totalApps > 0 ? ((freeApps / totalApps) * 100).toFixed(1) : '0.0'}% Free`,
      description: `Out of ${totalApps.toLocaleString()} apps, ${freeApps.toLocaleString()} are free.`,
      colorClass: 'bg-blue-500', // Corresponding to the original blue
    },
    {
      id: 'apps-4plus-rating',
      label: 'Apps with 4+ Rating',
      value: `${totalApps > 0 ? ((filteredApps.filter(app => (app.Rating || 0) >= 4.0).length / totalApps) * 100).toFixed(1) : '0.0'}%`,
      description: `${filteredApps.filter(app => (app.Rating || 0) >= 4.0).length.toLocaleString()} apps have a rating of 4.0 or higher.`,
      colorClass: 'bg-green-500', // Corresponding to the original green
    },
    {
      id: 'recently-updated',
      label: 'Recently Updated (6mo)',
      value: `${appsWithDates.length > 0 ? ((recentlyUpdated / appsWithDates.length) * 100).toFixed(1) : '0.0'}%`,
      description: `${recentlyUpdated.toLocaleString()} apps have been updated in the last 6 months.`,
      colorClass: 'bg-purple-500', // Corresponding to the original purple
    },
    {
      id: 'apps-with-size',
      label: 'Apps with Size Data',
      value: `${totalApps > 0 ? ((appsWithSize.length / totalApps) * 100).toFixed(1) : '0.0'}%`,
      description: `${appsWithSize.length.toLocaleString()} apps provide specific size information.`,
      colorClass: 'bg-orange-500', // Corresponding to the original orange
    },
  ];


  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-600 rounded-lg p-8 text-white">
        <div className="flex items-center space-x-4 mb-4">
          <FileText className="w-12 h-12" />
          <div>
            <h1 className="text-4xl font-bold">Comprehensive Report</h1>
            <p className="text-slate-200 text-lg">
              Complete analysis of Google Play Store data and market insights
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-300">
          Generated on {new Date().toLocaleDateString()} • {totalApps.toLocaleString()} apps analyzed
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="Total Apps Analyzed"
            value={totalApps.toLocaleString()}
            icon={Smartphone}
            color="blue"
          />
          <StatsCard
            title="Average Rating"
            value={averageRating.toFixed(2)}
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
        </div>

        <div className="prose max-w-none text-gray-700">
          <p className="text-lg leading-relaxed">
            This comprehensive analysis covers <strong>{totalApps.toLocaleString()} applications</strong> from the Google Play Store,
            representing <strong>{categories.length} distinct categories</strong>. The dataset includes
            <strong> {totalReviews.toLocaleString()} user reviews</strong> providing deep insights into user sentiment and app performance.
          </p>
          <p className="mt-4">
            Key findings show that <strong>{totalApps > 0 ? ((freeApps / totalApps) * 100).toFixed(1) : '0.0'}% of apps are free</strong>,
            with an overall market average rating of <strong>{averageRating.toFixed(2)} stars</strong>.
            The most popular category is <strong>{categoryData[0]?.name || 'N/A'}</strong> with {categoryData[0]?.value || 'N/A'} apps.
          </p>
        </div>
      </div>

      {/* Market Overview */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Market Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">App Distribution by Category</h3>
            <PieChartComponent
              data={categoryData}
              title=""
              height={300}
              showLegend={false}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
            <BarChartComponent
              data={ratingData}
              title=""
              height={300}
              color="#10B981"
            />
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Analysis</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Install Distribution</h3>
            <BarChartComponent
              data={installsData}
              title=""
              height={300}
              color="#3B82F6"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Rating Distribution</h3>
            <PieChartComponent
              data={contentRatingData}
              title=""
              height={300}
              showLegend={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Rated Apps</h3>
            <div className="space-y-3">
              {topRatedApps.map((app, index) => (
                <div key={app.App} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 truncate">{app.App}</p>
                    <p className="text-sm text-gray-600">{app.Category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{app.Rating?.toFixed(1) || 'N/A'} ⭐</p>
                    <p className="text-xs text-gray-500">{app.Reviews?.toLocaleString() || 'N/A'} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Installed Apps</h3>
            <div className="space-y-3">
              {topInstalledApps.map((app, index) => (
                <div key={app.App} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 truncate">{app.App}</p>
                    <p className="text-sm text-gray-600">{app.Category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatInstalls(parseInstalls(app.Installs || '0'))}</p>
                    <p className="text-xs text-gray-500">{app.Rating?.toFixed(1) || 'N/A'} ⭐</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Sentiment Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Positive Reviews"
            value={`${totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(1) : '0.0'}%`}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Negative Reviews"
            value={`${totalReviews > 0 ? ((negativeReviews / totalReviews) * 100).toFixed(1) : '0.0'}%`}
            icon={BarChart3}
            color="red"
          />
          <StatsCard
            title="Neutral Reviews"
            value={`${totalReviews > 0 ? ((neutralReviews / totalReviews) * 100).toFixed(1) : '0.0'}%`}
            icon={MessageSquare}
            color="blue"
          />
          <StatsCard
            title="Avg Sentiment"
            value={avgSentimentPolarity.toFixed(3)}
            icon={Star}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PieChartComponent
            data={sentimentData}
            title="Overall Sentiment Distribution"
            height={300}
          />
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {avgSentimentPolarity > 0 ? '+' : ''}{avgSentimentPolarity.toFixed(3)}
              </div>
              <div className="text-lg text-gray-600 mb-4">Average Sentiment Polarity</div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                avgSentimentPolarity > 0.1 ? 'bg-green-100 text-green-800' :
                avgSentimentPolarity < -0.1 ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {avgSentimentPolarity > 0.1 ? 'Positive' : avgSentimentPolarity < -0.1 ? 'Negative' : 'Neutral'} Overall Sentiment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Market Insights</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="space-y-3">
              {avgRatingByCategory.slice(0, 5).map((cat, index) => (
                <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{cat.category}</p>
                    <p className="text-sm text-gray-600">{cat.appCount} apps</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{cat.avgRating.toFixed(2)} ⭐</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Replaced 'Market Statistics' div with InsightsCard */}
          <InsightsCard
            title="Market Statistics" // Title for the card
            insights={marketStatisticsInsights} // The prepared data array
          />
        </div>
      </div>

      {/* Recommendations - Kept as is, but could also be converted to InsightsCard if desired */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Strategic Recommendations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">For App Developers</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Focus on the <strong>{categoryData[0]?.name || 'N/A'}</strong> category which shows highest market demand</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Maintain ratings above <strong>4.0</strong> to stay competitive in the market</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span>Regular updates are crucial - {appsWithDates.length > 0 ? ((recentlyUpdated / appsWithDates.length) * 100).toFixed(1) : '0.0'}% of apps updated recently</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <span>Consider freemium model - {totalApps > 0 ? ((freeApps / totalApps) * 100).toFixed(1) : '0.0'}% of successful apps are free</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Opportunities</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <span>Target underserved categories with fewer than 100 apps</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <span>Improve user sentiment - {totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(1) : '0.0'}% positive reviews market-wide</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                <span>Focus on {contentRatingData[0]?.name || 'N/A'} content rating for broader reach</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                <span>Optimize for modern Android versions (5.0+) for better performance</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-600">
          Report generated on {new Date().toLocaleDateString()} •
          Data includes {totalApps.toLocaleString()} apps and {totalReviews.toLocaleString()} reviews •
          Analysis covers {categories.length} categories
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Google Play Store Analytics Dashboard - Comprehensive Market Analysis
        </p>
      </div>
    </div>
  );
};

export default ComprehensiveReportPage;