import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Home,
  Star,
  MessageSquare,
  TrendingUp,
  Download,
  HardDrive,
  Shield,
  Smartphone,
  Search,
  FileText,
  Calendar
} from 'lucide-react';
import SidebarFilters from './SidebarFilters';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigationItems = [
    { path: '/', icon: Home, label: 'Overview' },
    { path: '/categories', icon: BarChart3, label: 'Categories' },
    { path: '/ratings', icon: Star, label: 'Ratings' },
    { path: '/sentiment', icon: MessageSquare, label: 'Sentiment' },
    { path: '/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/installs', icon: Download, label: 'Installs Analysis' },
    { path: '/size-performance', icon: HardDrive, label: 'Size & Performance' },
    { path: '/content-rating', icon: Shield, label: 'Content Rating' },
    { path: '/version-explorer', icon: Smartphone, label: 'Version Explorer' },
    { path: '/search-compare', icon: Search, label: 'Search & Compare' },
    { path: '/top-reviews', icon: MessageSquare, label: 'Top Reviews' },
    { path: '/update-recency', icon: Calendar, label: 'Update Recency' },
    { path: '/report', icon: FileText, label: 'Comprehensive Report' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans antialiased"> {/* Added font-sans and antialiased */}
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out"> {/* Slightly narrower width, stronger shadow, subtle transition */}
        {/* Header */}
        <div className="p-6 border-b border-gray-100"> {/* Lighter border */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md"> {/* Darker gradient, shadow */}
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Play Store</h1> {/* Bolder title */}
              <p className="text-sm text-gray-500">Analytics Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar"> {/* Added px-4 py-3, custom-scrollbar */}
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' // Changed to left border for emphasis
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Nicer hover color
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500`} /* Added focus ring */
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Filters */}
        <div className="border-t border-gray-100"> {/* Lighter border */}
          <SidebarFilters />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto p-6 custom-scrollbar"> {/* Added p-6 for general content padding, custom-scrollbar */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;