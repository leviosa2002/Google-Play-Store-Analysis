import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  };

  const changeClasses = {
    positive: 'text-green-600 font-semibold',
    negative: 'text-red-600 font-semibold',
    neutral: 'text-gray-600',
  };

  const cardBorderShadowClasses = {
    blue: 'border-blue-300 shadow-blue-200/50',
    green: 'border-green-300 shadow-green-200/50',
    purple: 'border-purple-300 shadow-purple-200/50',
    orange: 'border-orange-300 shadow-orange-200/50',
    red: 'border-red-300 shadow-red-200/50',
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out
                  ${cardBorderShadowClasses[color]}
                  hover:scale-[1.02] hover:shadow-xl
                  relative overflow-hidden`} // 'relative' is crucial for absolute positioning of children
      style={{
        boxShadow: `0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color)`,
        '--tw-shadow-color': `var(--color-${color}-300, ${color === 'blue' ? '#93C5FD' : color === 'green' ? '#A7F3D0' : color === 'purple' ? '#DDA0DD' : color === 'orange' ? '#FED7AA' : '#FECACA'})`
      }}
    >
      <div className="flex flex-col justify-between h-full"> {/* Changed to flex-col as icon is now absolute */}
        {/* Text content container: occupies all available horizontal space */}
        <div className="flex-1 min-w-0 pr-4"> {/* Removed the flex-col here as it's not needed for the overall card layout with absolute icon */}
          <div>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-700 leading-tight">
              {title}
            </p>

            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mt-1 leading-none">
              {value}
            </p>
          </div>

          {change && (
            <p className={`text-xs mt-2 ${changeClasses[changeType]} leading-none`}>
              {change}
            </p>
          )}
        </div>
      </div>

      {/* Icon container: Absolute positioned to the top-right corner, 50% smaller */}
      <div className={`absolute top-4 right-4 p-2 rounded-full ${colorClasses[color]} z-10`}> {/* Smaller padding, absolute position */}
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" /> {/* Drastically reduced icon size */}
      </div>
    </div>
  );
};

export default StatsCard;