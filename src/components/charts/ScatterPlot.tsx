import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceDot, // Used for activeShape
  Dot // Used for activeShape
} from 'recharts';

interface ScatterPlotProps {
  data: any[]; // Assuming data points have xAxisKey and yAxisKey
  title: string;
  xAxisKey: string;
  yAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  color?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  title,
  xAxisKey,
  yAxisKey,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  color = '#3B82F6' // Default point color
}) => {
  // Define a darker shade for the hover effect (e.g., 10-20% darker)
  const highlightColor = (c: string) => {
    if (c.startsWith('#') && c.length === 7) {
      const hex = c.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    }
    return c; // Fallback for non-hex colors or if parsing fails
  };

  const activeDotFill = highlightColor(color);

  // Custom active shape for the scatter points
  const CustomActiveDot = (props: any) => {
    const { cx, cy, fill, stroke, strokeWidth, r } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r * 1.5} // Make the radius 1.5 times larger on hover
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth || 2}
        // Add transition for smooth animation
        style={{ transition: 'all 0.15s ease-out' }}
      />
    );
  };

  return (
    // Enhanced outer container with a stronger shadow, themed border, and subtle hover effect
    <div
      className="bg-white p-6 rounded-lg shadow-xl border border-blue-200
                 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.005]
                 shadow-[0_10px_15px_-3px_rgba(59,130,246,0.2),_0_4px_6px_-4px_rgba(59,130,246,0.2)]"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }} // Adjusted margins slightly
          data={data}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /> {/* Lighter grid lines */}
          <XAxis
            type="number"
            dataKey={xAxisKey}
            name={xAxisLabel}
            tick={{ fontSize: 12, fill: '#6B7280' }} // Darker tick labels
            axisLine={{ stroke: '#D1D5DB' }} // Lighter axis line
            tickLine={false} // Remove tick lines
            // Optional: Add label for X axis if needed and not handled by 'name' prop
            // label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: '#6B7280' }}
          />
          <YAxis
            type="number"
            dataKey={yAxisKey}
            name={yAxisLabel}
            tick={{ fontSize: 12, fill: '#6B7280' }} // Darker tick labels
            axisLine={{ stroke: '#D1D5DB' }} // Lighter axis line
            tickLine={false} // Remove tick lines
            // Optional: Add label for Y axis if needed and not handled by 'name' prop
            // label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: -5, fill: '#6B7280' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#9CA3AF' }} // More subtle cursor
            contentStyle={{
              backgroundColor: '#ffffff', // Pure white background
              border: '1px solid #d1d5db', // Lighter border
              borderRadius: '8px',
              boxShadow: '0 6px 10px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)' // More prominent shadow for tooltip
            }}
            labelStyle={{ fontWeight: 'bold', color: '#374151' }} // Darker, bolder label
            itemStyle={{ color: '#374151' }} // Darker item text
            // Custom formatter for tooltip content
            formatter={(value: any, name: string, props: any) => {
              // 'props' contains the payload (the hovered data point)
              const payload = props.payload;
              // Ensure name matches the key used for data (e.g., 'X-Value', 'Y-Value')
              if (name === xAxisKey) {
                return [value, xAxisLabel || xAxisKey];
              }
              if (name === yAxisKey) {
                return [value, yAxisLabel || yAxisKey];
              }
              return [value, name]; // Fallback
            }}
          />
          <Scatter
            dataKey={yAxisKey} // This is the Y-axis value
            fill={color}
            // Increase the default radius slightly for better visibility
            // The activeShape will then make it even bigger.
            shape={<Dot r={5} fill={color} />} // Default dot size and color
            // Add interactive highlight: When a point is active (hovered), use CustomActiveDot
            activeShape={(props: any) => (
              <CustomActiveDot
                {...props}
                fill={activeDotFill} // Apply highlight color
                stroke={activeDotFill} // Apply highlight color to stroke
                strokeWidth={2}
              />
            )}
            isAnimationActive={true}
            animationEasing="ease-out"
            animationDuration={200}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterPlot;