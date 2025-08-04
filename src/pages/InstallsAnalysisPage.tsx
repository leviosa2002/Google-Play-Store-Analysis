import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import InsightsCard from '../components/InsightsCard'; // <--- Import InsightsCard
import {
  Download,
  TrendingUp,
  Smartphone,
  DollarSign
} from 'lucide-react';
import {
  getInstallsDistribution,
  getTopApps,
  parseInstalls,
  formatInstalls
} from '../utils/dataTransformers';

const InstallsAnalysisPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const installsDistribution = getInstallsDistribution(filteredApps);
  const topInstalledApps = getTopApps(filteredApps, 'Installs', 20);

  // Install vs Rating correlation data
  const installRatingData = filteredApps
    .filter(app => (app.Rating || 0) > 0 && parseInstalls(app.Installs || '0') > 0)
    .map(app => ({
      installs: parseInstalls(app.Installs || '0'),
      rating: app.Rating || 0,
      name: app.App
    }))
    .slice(0, 500); // Limit for performance

  // Free vs Paid installs comparison
  const freeAppsInstalls = filteredApps
    .filter(app => app.Type === 'Free')
    .reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);

  const paidAppsInstalls = filteredApps
    .filter(app => app.Type === 'Paid')
    .reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);

  const totalMarketInstalls = freeAppsInstalls + paidAppsInstalls; // Corrected total for free vs paid percentage

  const freeVsPaidData = [
    { name: 'Free Apps', value: freeAppsInstalls },
    { name: 'Paid Apps', value: paidAppsInstalls }
  ];

  const totalAppsCount = filteredApps.length; // Renamed to avoid confusion with totalInstalls
  const totalInstalls = filteredApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0);
  const averageInstalls = totalAppsCount > 0 ? totalInstalls / totalAppsCount : 0;
  const topApp = topInstalledApps[0];
  const freeAppsCount = filteredApps.filter(app => app.Type === 'Free').length;


  // Prepare data for the InsightsCard
  const keyInsights = [
    {
      id: 'most-popular-install-range',
      label: 'Most Popular Install Range',
      value: installsDistribution.length > 0
        ? installsDistribution.reduce((max, current) =>
            current.value > max.value ? current : max
          ).name
        : 'N/A',
      description: installsDistribution.length > 0
        ? `${installsDistribution.reduce((max, current) => current.value > max.value ? current : max).name} has the most apps`
        : 'No data available',
      colorClass: 'bg-green-500',
    },
    {
      id: 'free-vs-paid-dominance',
      label: 'Free vs Paid Dominance',
      value: `${totalMarketInstalls > 0 ? ((freeAppsInstalls / totalMarketInstalls) * 100).toFixed(1) : '0.0'}% Free`,
      description: `Free apps account for ${totalMarketInstalls > 0 ? ((freeAppsInstalls / totalMarketInstalls) * 100).toFixed(1) : '0.0'}% of total installs`,
      colorClass: 'bg-blue-500',
    },
    {
      id: 'top-performer',
      label: 'Top Performer',
      value: topApp?.App || 'N/A',
      description: `${topApp?.App || 'N/A'} leads with ${formatInstalls(parseInstalls(topApp?.Installs || '0'))} installs`,
      colorClass: 'bg-purple-500',
    },
    {
      id: 'market-distribution',
      label: 'Market Distribution',
      value: `${installsDistribution.filter(d => d.value > 0).length}`,
      description: `${installsDistribution.filter(d => d.value > 0).length} different install ranges represented`,
      colorClass: 'bg-orange-500',
    },
  ];

  const tableColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    {
      key: 'Installs',
      label: 'Installs',
      sortable: true,
      render: (value: string) => formatInstalls(parseInstalls(value))
    },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Type', label: 'Type', sortable: true }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Installs Analysis</h1>
        <p className="text-green-100">
          Deep dive into app installation patterns and popularity metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Installs"
          value={formatInstalls(totalInstalls)}
          icon={Download}
          color="green"
        />
        <StatsCard
          title="Average Installs"
          value={formatInstalls(averageInstalls)}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Top App"
          value={topApp ? formatInstalls(parseInstalls(topApp.Installs || '0')) : 'N/A'}
          icon={Smartphone}
          color="purple"
        />
        <StatsCard
          title="Free Apps Ratio"
          value={`${totalAppsCount > 0 ? ((freeAppsCount / totalAppsCount) * 100).toFixed(1) : '0.0'}%`}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={installsDistribution}
          title="Install Distribution (Binned)"
          height={400}
          color="#10B981"
        />
        <PieChartComponent
          data={freeVsPaidData}
          title="Free vs Paid App Installs"
          height={400}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ScatterPlot
          data={installRatingData}
          title="Installs vs Rating Correlation"
          xAxisKey="installs"
          yAxisKey="rating"
          xAxisLabel="Installs"
          yAxisLabel="Rating"
          height={400}
          color="#3B82F6"
        />
      </div>

      {/* Top Apps Table */}
      <DataTable
        data={topInstalledApps}
        columns={tableColumns}
        title="Top 20 Most Installed Apps"
        pageSize={20}
      />

      {/* Insights - Now using InsightsCard */}
      <InsightsCard
        title="Key Insights"
        insights={keyInsights}
      />
    </div>
  );
};

export default InstallsAnalysisPage;