// src/components/AppComparisonCard.tsx
import React from 'react';
import { Star, Download, MessageSquare, DollarSign } from 'lucide-react';
import { parseInstalls, formatInstalls } from '../utils/dataTransformers';

// Define the interface for your App data
interface AppData {
  App: string;
  Category: string;
  Rating: number;
  Reviews: number;
  Installs: string; // Stored as string, parsed to number
  Type: 'Free' | 'Paid';
  Price: string;
  'Content Rating': string;
  Size: string;
  'Last Updated': string;
  'Android Ver': string;
  // These are custom fields added in getAppDetails
  reviewCount: number;
  avgSentiment: string; // Formatted string
  sentimentLabel: 'Positive' | 'Negative' | 'Neutral';
}

interface AppComparisonCardProps {
  app: AppData;
}

const AppComparisonCard: React.FC<AppComparisonCardProps> = ({ app }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-gray-900">{app.App}</h4>
        <span className={`px-2 py-1 text-xs rounded-full ${
          app.Type === 'Free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {app.Type}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Category</p>
            <p className="text-lg text-gray-900">{app.Category}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Content Rating</p>
            <p className="text-lg text-gray-900">{app['Content Rating']}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Rating</p>
              <p className="text-lg font-bold text-gray-900">{app.Rating.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Installs</p>
              <p className="text-lg font-bold text-gray-900">{formatInstalls(parseInstalls(app.Installs))}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Reviews</p>
              <p className="text-lg font-bold text-gray-900">{app.Reviews.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Price</p>
              <p className="text-lg font-bold text-gray-900">{app.Price || 'Free'}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Sentiment Analysis</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-1 text-xs rounded-full ${
              app.sentimentLabel === 'Positive' ? 'bg-green-100 text-green-800' :
              app.sentimentLabel === 'Negative' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {app.sentimentLabel}
            </span>
            <span className="text-sm text-gray-600">({app.avgSentiment})</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Additional Info</p>
          <div className="mt-1 space-y-1 text-sm text-gray-600">
            <p>Size: {app.Size}</p>
            <p>Last Updated: {app['Last Updated']}</p>
            <p>Android Version: {app['Android Ver']}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppComparisonCard;