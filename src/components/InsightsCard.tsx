// src/components/InsightsCard.tsx
import React from 'react';

// Define a type for a single insight item
interface InsightItem {
  id: string; // Unique ID for React keys
  label: string;
  value: string | number;
  description: string;
  colorClass: string; // Tailwind class for the color, e.g., 'bg-green-500'
}

interface InsightsCardProps {
  title: string;
  insights: InsightItem[]; // Array of insight items
}

const InsightsCard: React.FC<InsightsCardProps> = ({
  title,
  insights,
}) => {
  // We'll split the insights into two columns, if there are enough
  const midPoint = Math.ceil(insights.length / 2);
  const col1Insights = insights.slice(0, midPoint);
  const col2Insights = insights.slice(midPoint);

  return (
    // 1. Added a very light blue background to the entire card (bg-blue-50)
    <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200 transition-all duration-300 hover:shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1 */}
        <div className="space-y-4">
          {col1Insights.map(item => (
            // 2. Added a very light gray background, padding, and rounded corners to each insight item
            <div key={item.id} className="bg-white p-4 rounded-md shadow-sm flex items-start space-x-3">
              <div className={`w-2 h-2 ${item.colorClass} rounded-full mt-2`}></div>
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Column 2 */}
        {col2Insights.length > 0 && (
          <div className="space-y-4">
            {col2Insights.map(item => (
              // 2. Added a very light gray background, padding, and rounded corners to each insight item
              <div key={item.id} className="bg-white p-4 rounded-md shadow-sm flex items-start space-x-3">
                <div className={`w-2 h-2 ${item.colorClass} rounded-full mt-2`}></div>
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsCard;