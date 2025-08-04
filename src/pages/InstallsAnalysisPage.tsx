import React from 'react';
import { useData } from '../context/DataContext';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { Download, TrendingUp, Smartphone, DollarSign } from 'lucide-react';
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
    .filter(app => app.Rating > 0 && parseInstalls(app.Installs) > 0)
    .map(app => ({
      installs: parseInstalls(app.Installs),
      rating: app.Rating,
      name: app.App
    }))
    .slice(0, 500); // Limit for performance

  // Free vs Paid installs comparison
  const freeAppsInstalls = filteredApps
    .filter(app => app.Type === 'Free')
    .reduce((sum, app) => sum + parseInstalls(app.Installs), 0);
  
  const paidAppsInstalls = filteredApps
    .filter(app => app.Type === 'Paid')
    .reduce((sum, app) => sum + parseInstalls(app.Installs), 0);

  const freeVsPaidData = [
    { name: 'Free Apps', value: freeAppsInstalls },
    { name: 'Paid Apps', value: paidAppsInstalls }
  ];

  const totalInstalls = filteredApps.reduce((sum, app) => sum + parseInstalls(app.Installs), 0);
  const averageInstalls = totalInstalls / filteredApps.length;
  const topApp = topInstalledApps[0];
  const freeAppsCount = filteredApps.filter(app => app.Type === 'Free').length;

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
          value={topApp ? formatInstalls(parseInstalls(topApp.Installs)) : '0'}
          icon={Smartphone}
          color="purple"
        />
        <StatsCard
          title="Free Apps Ratio"
          value={`${((freeAppsCount / filteredApps.length) * 100).toFixed(1)}%`}
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

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Most Popular Install Range</p>
                <p className="text-sm text-gray-600">
                  {installsDistribution.reduce((max, current) => 
                    current.value > max.value ? current : max
                  ).name} has the most apps
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Free vs Paid Dominance</p>
                <p className="text-sm text-gray-600">
                  Free apps account for {((freeAppsInstalls / totalInstalls) * 100).toFixed(1)}% of total installs
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Top Performer</p>
                <p className="text-sm text-gray-600">
                  {topApp?.App} leads with {formatInstalls(parseInstalls(topApp?.Installs || '0'))} installs
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Market Distribution</p>
                <p className="text-sm text-gray-600">
                  {installsDistribution.filter(d => d.value > 0).length} different install ranges represented
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallsAnalysisPage;