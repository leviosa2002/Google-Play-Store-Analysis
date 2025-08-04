import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartData } from '../../types';

interface PieChartComponentProps {
  data: ChartData[];
  title: string;
  height?: number;
  showLegend?: boolean;
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', // Blue, Red, Green, Orange, Purple
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1', // Pink, Cyan, Lime, Dark Orange, Indigo
  '#9CA3AF', '#D1D5DB', '#FECDD3', '#BFDBFE', '#A7F3D0'  // Additional, more muted colors for variety
];

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title,
  height = 300,
  showLegend = true
}) => {
  return (
    // Enhanced outer container with a stronger shadow, themed border, and subtle hover effect
    <div
      className="bg-white p-6 rounded-lg shadow-xl border border-blue-200
                 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.005]
                 shadow-[0_10px_15px_-3px_rgba(59,130,246,0.2),_0_4px_6px_-4px_rgba(59,130,246,0.2)]"
      // Note: The shadow color here is hardcoded to blue for consistency with BarChart.
      // If you want it to reflect the pie chart's dominant color, that would require
      // more complex logic to determine the dominant color from the `data` prop.
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false} // Keep labelLine false for cleaner look with many slices
            // Adjust outerRadius and innerRadius for a donut chart, which can
            // sometimes provide more space for labels or a central element.
            // outerRadius={120} // Increased outer radius for a bigger pie
            // innerRadius={70} // Example for a donut chart
            outerRadius={90} // Slightly increased default outer radius
            fill="#8884d8" // This fill is overridden by Cell components, but good to have a fallback
            dataKey="value"
            // Custom label to ensure it fits and provides value + percentage
            label={({ name, percent, value }) => {
                const formattedPercent = (percent * 100).toFixed(0);
                const labelText = `${name} (${formattedPercent}%)`;
                // Basic logic to prevent label overflow if text is too long or slice is too small
                // You might need more advanced logic for very dense charts
                if (percent > 0.05) { // Only show label if slice is at least 5%
                    return labelText;
                }
                return ''; // Don't show label for very small slices
            }}
            // Add slight active shape for hover effect (scales the slice)
            activeShape={(props: any) => {
              const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
              const radius = outerRadius + 10; // Make it grow by 10 pixels
              return (
                <g>
                  <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={radius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    style={{ transition: 'all 0.2s ease-out' }} // Smooth transition for growth
                  />
                </g>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 6px 10px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#374151' }}
            itemStyle={{ color: '#374151' }}
            // Custom formatter for tooltip content
            formatter={(value: any, name: string, props: any) => {
                // 'props' contains the payload, which has the original data object
                const total = data.reduce((sum, item) => sum + item.value, 0);
                const percent = total > 0 ? ((props.payload.value / total) * 100).toFixed(1) : '0';
                return [`${value}`, `${props.payload.name} (${percent}%)`]; // "Value", "Name (Percentage%)"
            }}
          />
          {/* Legend position adjustment for better layout */}
          {showLegend && (
            <Legend
              verticalAlign="bottom" // Position legend at the bottom
              align="center"       // Center align horizontally
              wrapperStyle={{ paddingTop: '20px' }} // Add some space above legend
              iconType="circle" // Use circles for legend items
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {/* If data is genuinely too much for a pie chart and must be listed, a separate scrollable div could be added here */}
      {/* For example:
      {data.length > 10 && ( // Only show scrollable list if many items
        <div className="max-h-32 overflow-y-auto mt-4 border rounded-lg p-2 bg-gray-50 text-sm text-gray-700">
          <p className="font-semibold mb-1">All Categories:</p>
          <ul>
            {data.map((item, index) => (
              <li key={index} className="flex items-center space-x-2">
                <span style={{ backgroundColor: COLORS[index % COLORS.length] }} className="w-2 h-2 rounded-full inline-block"></span>
                <span>{item.name}: {item.value} ({((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      */}
    </div>
  );
};

// Import Sector from recharts for activeShape
import { Sector } from 'recharts';

export default PieChartComponent;