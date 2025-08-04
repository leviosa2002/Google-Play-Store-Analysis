import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartData } from '../../types'; // Assuming ChartData is { name: string, value: number }

interface BarChartComponentProps {
  data: ChartData[];
  title: string;
  xAxisKey?: string;
  yAxisKey?: string;
  color?: string; // Main color for the bars
  height?: number;
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  title,
  xAxisKey = 'name',
  yAxisKey = 'value',
  color = '#3B82F6', // Default bar color
  height = 300
}) => {
  // Define a darker shade for the hover effect (e.g., 10-20% darker)
  const highlightColor = (c: string) => {
    // Simple color darkening logic for hex colors
    if (c.startsWith('#') && c.length === 7) {
      const hex = c.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    }
    return c; // Fallback for non-hex colors or if parsing fails
  };

  const activeBarFill = highlightColor(color);

  // Define the base bar size
  const baseBarSize = 30; // Original size, or whatever you want the non-hovered bar to be

  // Define the hovered bar size (significantly larger than baseBarSize)
  const hoveredBarSize = 50; // Example: This will make it thicker on hover

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-xl border border-blue-200
                 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.005]
                 shadow-[0_10px_15px_-3px_rgba(59,130,246,0.2),_0_4px_6px_-4px_rgba(59,130,246,0.2)]"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 6px 10px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#374151' }}
            itemStyle={{ color: '#374151' }}
            formatter={(value: any, name: string, props: any) => [`${value} Apps`, name === xAxisKey ? 'Version' : name]}
          />
          <Bar
            dataKey={yAxisKey}
            fill={color}
            radius={[6, 6, 0, 0]}
            barSize={baseBarSize} // Set the default, smaller size here
            activeBar={{
              fill: activeBarFill,
              stroke: activeBarFill,
              strokeWidth: 2,
              // Apply a larger barSize directly when active
              barSize: hoveredBarSize,
              // The transformOrigin is still useful if you're mixing barSize and scale,
              // but changing barSize directly handles the "grow from base" naturally.
            }}
            isAnimationActive={true}
            animationEasing="ease-out"
            animationDuration={200}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;