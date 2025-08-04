import React from 'react';
import { useData } from '../context/DataContext'; // Assuming DataContext.tsx is in the 'context' folder
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { Smartphone, Code, Star, BarChart3 } from 'lucide-react';
import { getAndroidVersionDistribution, parseInstalls, formatInstalls } from '../utils/dataTransformers';

const VersionExplorerPage: React.FC = () => {
  const { filteredApps, loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const androidVersionDistribution = getAndroidVersionDistribution(filteredApps);
  
  // Current version analysis
  const currentVersions = filteredApps.filter(app => 
    typeof app['Current Ver'] === 'string' && // Ensure it's a string first
    app['Current Ver'] && 
    app['Current Ver'] !== 'NaN' && 
    app['Current Ver'] !== 'Varies with device'
  );

  // Apps with latest updates (version analysis)
  const appsWithVersions = currentVersions.map(app => {
    const version = app['Current Ver'];
    // Ensure 'version' is a string before calling .includes() or parseFloat()
    const versionString = typeof version === 'string' ? version : ''; // Default to empty string if not a string

    const isLatest = versionString && (
      versionString.includes('2018') || 
      versionString.includes('2019') || 
      versionString.includes('2020') ||
      parseFloat(versionString) >= 5.0
    );
    
    return {
      App: app.App,
      Category: app.Category,
      'Current Version': versionString || 'N/A', // Display 'N/A' if version was not a valid string
      'Android Version': app['Android Ver'],
      Rating: app.Rating,
      Installs: formatInstalls(parseInstalls(app.Installs || '0')),
      'Last Updated': app['Last Updated'],
      'Is Recent': isLatest ? 'Yes' : 'No'
    };
  }).sort((a, b) => (b.Rating || 0) - (a.Rating || 0)).slice(0, 100); // Added null check for Rating sort

  // Android version requirements analysis
  const androidVersionAnalysis = androidVersionDistribution.map(version => {
    const versionApps = filteredApps.filter(app => app['Android Ver'] === version.name);
    // Add null/undefined checks for versionApps.length before calculations
    const avgRating = versionApps.length > 0 ? versionApps.reduce((sum, app) => sum + (app.Rating || 0), 0) / versionApps.length : 0;
    const totalInstalls = versionApps.length > 0 ? versionApps.reduce((sum, app) => sum + parseInstalls(app.Installs || '0'), 0) : 0;
    const freeApps = versionApps.filter(app => app.Type === 'Free').length;
    const freePercentage = versionApps.length > 0 ? (freeApps / versionApps.length) * 100 : 0;

    return {
      'Android Version': version.name,
      'App Count': version.value,
      'Avg Rating': Number(avgRating.toFixed(2)),
      'Total Installs': formatInstalls(totalInstalls),
      'Free Apps %': Number(freePercentage.toFixed(1))
    };
  });

  // Compatibility analysis - Adding null/undefined/non-string checks for Android Ver
  const compatibilityLevels = [
    { name: 'Legacy (2.x)', apps: filteredApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('2.')).length },
    { name: 'Older (3.x)', apps: filteredApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('3.')).length },
    { name: 'Standard (4.x)', apps: filteredApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('4.')).length },
    { name: 'Modern (5.x+)', apps: filteredApps.filter(app => typeof app['Android Ver'] === 'string' && (app['Android Ver'].includes('5.') || app['Android Ver'].includes('6.') || app['Android Ver'].includes('7.') || app['Android Ver'].includes('8.'))).length },
    { name: 'Variable', apps: filteredApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('Varies')).length }
  ].filter(level => level.apps > 0).map(level => ({ name: level.name, value: level.apps }));

  // Top apps by Android version requirement
  const topAppsByAndroidVersion = ['4.0 and up', '4.1 and up', '5.0 and up', 'Varies with device'].map(version => {
    const versionApps = filteredApps
      .filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'] === version && (app.Rating || 0) >= 4.0) // Ensure Android Ver is string and Rating check
      .sort((a, b) => parseInstalls(b.Installs || '0') - parseInstalls(a.Installs || '0'))
      .slice(0, 5);
    
    return {
      version,
      apps: versionApps.map(app => ({
        App: app.App,
        Category: app.Category,
        Rating: app.Rating,
        Installs: formatInstalls(parseInstalls(app.Installs || '0')),
        'Current Ver': typeof app['Current Ver'] === 'string' ? app['Current Ver'] : 'N/A' // Safely handle Current Ver
      }))
    };
  }).filter(group => group.apps.length > 0);

  // Statistics - Adding null/undefined/non-string checks
  const totalApps = filteredApps.length;
  const appsWithVersionData = filteredApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver']).length;
  const modernApps = filteredApps.filter(app => 
    typeof app['Android Ver'] === 'string' && (
      app['Android Ver'].includes('5.') || 
      app['Android Ver'].includes('6.') || 
      app['Android Ver'].includes('7.') || 
      app['Android Ver'].includes('8.')
    )
  ).length;
  const variableApps = filteredApps.filter(app => typeof app['Android Ver'] === 'string' && app['Android Ver'].includes('Varies')).length;
  
  // Safely get mostCommonVersion, handling empty array
  const mostCommonVersion = androidVersionDistribution.length > 0 ? androidVersionDistribution[0] : { name: 'N/A', value: 0 };

  const tableColumns = [
    { key: 'Android Version', label: 'Android Version', sortable: true },
    { key: 'App Count', label: 'Apps', sortable: true },
    { key: 'Avg Rating', label: 'Avg Rating', sortable: true },
    { key: 'Total Installs', label: 'Total Installs', sortable: true },
    { key: 'Free Apps %', label: 'Free Apps %', sortable: true }
  ];

  const versionTableColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Current Version', label: 'Version', sortable: true },
    { key: 'Android Version', label: 'Android Req.', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Installs', label: 'Installs', sortable: true },
    { key: 'Is Recent', label: 'Recent', sortable: true }
  ];

  const appColumns = [
    { key: 'App', label: 'App Name', sortable: true },
    { key: 'Category', label: 'Category', sortable: true },
    { key: 'Rating', label: 'Rating', sortable: true },
    { key: 'Installs', label: 'Installs', sortable: true },
    { key: 'Current Ver', label: 'Version', sortable: true }
  ];

  return (
    // Added a subtle gray background to the entire page and min-h-screen for full height
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen"> 
      {/* Header - A new, vibrant gradient for this page */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg p-8 text-white shadow-lg"> 
        <h1 className="text-3xl font-bold mb-2">Version & Android Compatibility</h1>
        <p className="text-violet-100">
          Explore app versions, Android compatibility requirements, and update patterns
        </p>
      </div>

      {/* Stats Cards - These already have colors from the 'color' prop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Apps with Version Data"
          value={`${((appsWithVersionData / (totalApps || 1)) * 100).toFixed(1)}%`} /* Added (totalApps || 1) to prevent division by zero */
          icon={Smartphone}
          color="blue"
        />
        <StatsCard
          title="Modern Android (5.0+)"
          value={`${((modernApps / (totalApps || 1)) * 100).toFixed(1)}%`}
          icon={Code}
          color="green"
        />
        <StatsCard
          title="Variable Requirements"
          value={`${((variableApps / (totalApps || 1)) * 100).toFixed(1)}%`}
          icon={Star}
          color="purple"
        />
        <StatsCard
          title="Most Common Req."
          value={mostCommonVersion?.name?.substring(0, 10) || 'N/A'}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Charts Grid - Wrapped in a distinct white card with shadow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-100"> 
        <BarChartComponent
          data={androidVersionDistribution}
          title="Android Version Requirements (Top 15)"
          height={400}
          color="#8B5CF6" // A nice violet color for the bars
        />
        <PieChartComponent
          data={compatibilityLevels}
          title="Compatibility Level Distribution"
          height={400}
          // PieChartComponent might benefit from a custom color array prop if you want to control its slice colors from here.
          // Otherwise, it likely has internal color handling.
        />
      </div>

      {/* Android Version Analysis Table - Will use the updated DataTable styles */}
      <DataTable
        data={androidVersionAnalysis}
        columns={tableColumns}
        title="Android Version Requirements Analysis"
        pageSize={15}
      />

      {/* App Version Analysis - Will use the updated DataTable styles */}
      <DataTable
        data={appsWithVersions}
        columns={versionTableColumns}
        title="Top 100 Apps with Version Information"
        pageSize={15}
      />

      {/* Top Apps by Android Version - Each sub-table will also use DataTable styles */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Top Apps by Android Version Requirement</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topAppsByAndroidVersion.map((group) => (
            <DataTable
              key={group.version}
              data={group.apps}
              columns={appColumns}
              title={`Top Apps - ${group.version}`}
              pageSize={5}
            />
          ))}
        </div>
      </div>

      {/* Insights - Enhanced with a slightly stronger shadow and clear border */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Version & Compatibility Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Version Coverage</p>
                <p className="text-sm text-gray-600">
                  {((appsWithVersionData / (totalApps || 1)) * 100).toFixed(1)}% of apps provide Android version requirements
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Modern Compatibility</p>
                <p className="text-sm text-gray-600">
                  {((modernApps / (totalApps || 1)) * 100).toFixed(1)}% of apps require Android 5.0 or higher
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Most Common Requirement</p>
                <p className="text-sm text-gray-600">
                  {mostCommonVersion.name} is required by {mostCommonVersion.value} apps
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Flexible Apps</p>
                <p className="text-sm text-gray-600">
                  {((variableApps / (totalApps || 1)) * 100).toFixed(1)}% of apps have variable device requirements
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionExplorerPage;