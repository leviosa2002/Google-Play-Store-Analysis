import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScatterPlotProps {
  data: any[];
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
  color = '#3B82F6'
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          data={data}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey={xAxisKey} 
            name={xAxisLabel}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            type="number" 
            dataKey={yAxisKey} 
            name={yAxisLabel}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [value, name]}
          />
          <Scatter dataKey={yAxisKey} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterPlot;