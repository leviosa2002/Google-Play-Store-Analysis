import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
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
  '#9CA3AF', '#D1D5DB', '#FECDD3', '#BFDBFE', '#A7F3D0'   // Additional, more muted colors for variety
];

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title,
  height = 300,
  showLegend = true
}) => {

  // --- START: Updated filtering for NaN values and NaN names ---
  const filteredAndValidatedData = useMemo(() => {
    return data.filter(item =>
      typeof item.value === 'number' &&
      !isNaN(item.value) &&
      isFinite(item.value) &&
      item.value > 0 && // Filter out items with 0 value
      item.name && // Ensure name is not null or undefined
      item.name.toString().toLowerCase() !== 'nan' // Explicitly filter out 'NaN' string
    );
  }, [data]);

  const total = useMemo(() => {
    return filteredAndValidatedData.reduce((sum, item) => sum + item.value, 0);
  }, [filteredAndValidatedData]);
  // --- END: Updated filtering ---

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-xl border border-blue-200
                   transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.005]
                   shadow-[0_10px_15px_-3px_rgba(59,130,246,0.2),_0_4px_6px_-4px_rgba(59,130,246,0.2)]"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={filteredAndValidatedData} // Use the filtered data here!
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent, value }) => {
                const formattedPercent = (typeof percent === 'number' && !isNaN(percent)) ? (percent * 100).toFixed(0) : '0';
                const labelText = `${name} (${formattedPercent}%)`;
                if (percent && percent > 0.05) {
                    return labelText;
                }
                return '';
            }}
            activeShape={(props: any) => {
              const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
              const radius = outerRadius + 10;
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
                    style={{ transition: 'all 0.2s ease-out' }}
                  />
                </g>
              );
            }}
          >
            {filteredAndValidatedData.map((entry, index) => (
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
            formatter={(value: any, name: string, props: any) => {
                const itemValue = props.payload.value;
                const percent = (total > 0 && typeof itemValue === 'number' && !isNaN(itemValue)) ? ((itemValue / total) * 100).toFixed(1) : '0';
                return [`${value}`, `${props.payload.name} (${percent}%)`];
            }}
          />
          {showLegend && total > 0 && (
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          )}
          {filteredAndValidatedData.length === 0 && (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-gray-500 text-lg">
              No data available for this chart.
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;