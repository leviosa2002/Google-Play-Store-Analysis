import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import StatsCard from '../components/StatsCard';
import { HardDrive, Zap, Star, BarChart3 } from 'lucide-react';
import { parseSize, formatSize } from '../utils/dataTransformers';

const SizePerformancePage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter apps with valid size data
  const appsWithSize = filteredApps.filter(app => 
    app.Size && app.Size !== 'Varies with device' && parseSize(app.Size) > 0
  );

  // Size distribution
  const sizeBins = [
    { range: '0-10MB', min: 0, max: 10 },
    { range: '10-25MB', min: 10, max: 25 },
    { range: '25-50MB', min: 25, max: 50 },
    { range: '50-100MB', min: 50, max: 100 },
    { range: '100-250MB', min: 100, max: 250 },
    { range: '250MB+', min: 250, max: Infinity },
  ];

  const sizeDistribution = sizeBins.map(bin => ({
    name: bin.range,
    value: appsWithSize.filter(app => {
      const size = parseSize(app.Size);
      return size >= bin.min && size < bin.max;
    }).length
  }));

  // Size vs Rating correlation
  const sizeRatingData = appsWithSize
    .filter(app => app.Rating > 0)
    .map(app => ({
      size: parseSize(app.Size),
      rating: app.Rating,
      name: app.App
    }))
    .slice(0, 500);

  // Size vs Reviews correlation
  const sizeReviewsData = appsWithSize
    .filter(app => app.Reviews > 0)
    .map(app => ({
      size: parseSize(app.Size),
      reviews: app.Reviews,
      name: app.App
    }))
    .slice(0, 500);

  // Calculate stats
  const averageSize = appsWithSize.reduce((sum, app) => sum + parseSize(app.Size), 0) / appsWithSize.length;
  const largestApp = appsWithSize.reduce((max, app) => 
    parseSize(app.Size) > parseSize(max.Size) ? app : max
  );
  const smallestApp = appsWithSize.reduce((min, app) => 
    parseSize(app.Size) < parseSize(min.Size) ? app : min
  );

  // Correlation between size and rating
  const avgRatingBySize = sizeBins.map(bin => {
    const appsInBin = appsWithSize.filter(app => {
      const size = parseSize(app.Size);
      return size >= bin.min && size < bin.max && app.Rating > 0;
    });
    
    const avgRating = appsInBin.length > 0 
      ? appsInBin.reduce((sum, app) => sum + app.Rating, 0) / appsInBin.length 
      : 0;
    
    return {
      name: bin.range,
      value: Number(avgRating.toFixed(2))
    };
  }).filter(item => item.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">App Size vs Performance</h1>
        <p className="text-purple-100">
          Analyzing the relationship between app size, ratings, and user engagement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Average App Size"
          value={formatSize(averageSize)}
          icon={HardDrive}
          color="purple"
        />
        <StatsCard
          title="Largest App"
          value={formatSize(parseSize(largestApp?.Size || '0'))}
          icon={Zap}
          color="red"
        />
        <StatsCard
          title="Smallest App"
          value={formatSize(parseSize(smallestApp?.Size || '0'))}
          icon={Star}
          color="green"
        />
        <StatsCard
          title="Apps with Size Data"
          value={appsWithSize.length.toLocaleString()}
          icon={BarChart3}
          color="blue"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={sizeDistribution}
          title="App Size Distribution"
          height={400}
          color="#8B5CF6"
        />
        <BarChartComponent
          data={avgRatingBySize}
          title="Average Rating by Size Range"
          height={400}
          color="#EC4899"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPlot
          data={sizeRatingData}
          title="Size vs Rating Correlation"
          xAxisKey="size"
          yAxisKey="rating"
          xAxisLabel="Size (MB)"
          yAxisLabel="Rating"
          height={400}
          color="#8B5CF6"
        />
        <ScatterPlot
          data={sizeReviewsData}
          title="Size vs Reviews Correlation"
          xAxisKey="size"
          yAxisKey="reviews"
          xAxisLabel="Size (MB)"
          yAxisLabel="Number of Reviews"
          height={400}
          color="#EC4899"
        />
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Most Common Size Range</p>
                <p className="text-sm text-gray-600">
                  {sizeDistribution.reduce((max, current) => 
                    current.value > max.value ? current : max
                  ).name} contains the most apps
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Size Extremes</p>
                <p className="text-sm text-gray-600">
                  Range from {formatSize(parseSize(smallestApp?.Size || '0'))} to {formatSize(parseSize(largestApp?.Size || '0'))}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Best Rated Size Range</p>
                <p className="text-sm text-gray-600">
                  {avgRatingBySize.reduce((max, current) => 
                    current.value > max.value ? current : max, { name: 'N/A', value: 0 }
                  ).name} has highest average rating
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Size Impact</p>
                <p className="text-sm text-gray-600">
                  {appsWithSize.length} apps analyzed for size-performance correlation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizePerformancePage;