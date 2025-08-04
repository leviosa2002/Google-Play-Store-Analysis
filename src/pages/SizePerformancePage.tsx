import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard'; // Import InsightsCard
import { HardDrive, Zap, Star, BarChart3 } from 'lucide-react';
import { parseSize, formatSize } from '../utils/dataTransformers';

// Define an interface for your App data structure to improve type safety
// This should ideally come from a central types file, e.g., src/types/data.ts
interface AppData {
  App: string;
  Category: string;
  Rating: number | null; // Rating can be null or NaN in raw data
  Reviews: number;
  Size: string; // e.g., '15M', '2.4G', 'Varies with device'
  Installs: string;
  Type: string;
  Price: string;
  'Content Rating': string;
  Genres: string;
  'Last Updated': string;
  'Current Ver': string;
  'Android Ver': string;
}

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
  // Ensure the filtered apps are typed correctly
  const appsWithSize: AppData[] = filteredApps.filter((app: AppData) =>
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
    value: appsWithSize.filter((app: AppData) => {
      const size = parseSize(app.Size);
      return size >= bin.min && size < bin.max;
    }).length
  }));

  // Size vs Rating correlation
  const sizeRatingData = appsWithSize
    .filter((app: AppData) => (app.Rating !== null && !isNaN(app.Rating) && app.Rating > 0))
    .map((app: AppData) => ({
      size: parseSize(app.Size),
      rating: app.Rating!, // Use non-null assertion as we filtered above
      name: app.App
    }))
    .slice(0, 500); // Limit data points for performance

  // Size vs Reviews correlation
  const sizeReviewsData = appsWithSize
    .filter((app: AppData) => app.Reviews > 0)
    .map((app: AppData) => ({
      size: parseSize(app.Size),
      reviews: app.Reviews,
      name: app.App
    }))
    .slice(0, 500); // Limit data points for performance

  // Calculate stats, handling empty arrays
  const averageSize = appsWithSize.length > 0
    ? appsWithSize.reduce((sum, app) => sum + parseSize(app.Size), 0) / appsWithSize.length
    : 0;

  // Type largestApp and smallestApp directly as AppData or null
  const largestApp: AppData | null = appsWithSize.length > 0
    ? appsWithSize.reduce((max, app) =>
        parseSize(app.Size) > parseSize(max.Size) ? app : max
      )
    : null;

  const smallestApp: AppData | null = appsWithSize.length > 0
    ? appsWithSize.reduce((min, app) =>
        parseSize(app.Size) < parseSize(min.Size) ? app : min
      )
    : null;

  // Correlation between size and rating
  const avgRatingBySize = sizeBins.map(bin => {
    const appsInBin = appsWithSize.filter((app: AppData) => {
      const size = parseSize(app.Size);
      return size >= bin.min && size < bin.max && (app.Rating !== null && !isNaN(app.Rating) && app.Rating > 0);
    });

    const avgRating = appsInBin.length > 0
      ? appsInBin.reduce((sum, app) => sum + app.Rating!, 0) / appsInBin.length
      : 0;

    return {
      name: bin.range,
      value: Number(avgRating.toFixed(2))
    };
  }).filter(item => item.value > 0);

  // Prepare data for the generic InsightsCard
  const mostCommonSizeRange = sizeDistribution.length > 0
    ? sizeDistribution.reduce((max, current) => current.value > max.value ? current : max)
    : { name: 'N/A', value: 0 };

  const bestRatedSizeRange = avgRatingBySize.length > 0
    ? avgRatingBySize.reduce((max, current) => current.value > max.value ? current : max)
    : { name: 'N/A', value: 0 };

  const sizePerformanceInsights = [
    {
      id: 'most-common-size',
      label: 'Most Common Size Range',
      value: mostCommonSizeRange.value,
      description: `${mostCommonSizeRange.name} contains the most apps`,
      colorClass: 'bg-purple-500',
    },
    {
      id: 'size-extremes',
      label: 'Size Extremes',
      value: 'N/A', // Placeholder, actual values in description
      description: `Range from ${formatSize(parseSize(smallestApp?.Size || '0'))} to ${formatSize(parseSize(largestApp?.Size || '0'))}`,
      colorClass: 'bg-pink-500',
    },
    {
      id: 'best-rated-size',
      label: 'Best Rated Size Range',
      value: bestRatedSizeRange.value,
      description: `${bestRatedSizeRange.name} has the highest average rating`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'apps-analyzed',
      label: 'Apps with Size Data',
      value: appsWithSize.length,
      description: `${appsWithSize.length.toLocaleString()} apps analyzed for size-performance correlation`,
      colorClass: 'bg-green-500',
    },
  ];


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

      {/* Insights Card - using the generic InsightsCard */}
      <InsightsCard
        title="Size Performance Insights"
        insights={sizePerformanceInsights}
      />
    </div>
  );
};

export default SizePerformancePage;