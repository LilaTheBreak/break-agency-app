import React from 'react';
import { 
  AreaChart as RechartsArea, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

/**
 * AreaChart component for cumulative metrics and stacked values
 * 
 * @param {Array} data - Array of data points
 * @param {string} xKey - Key for x-axis data
 * @param {Array<{key: string, color: string, name?: string}>} areas - Array of area configurations
 * @param {string} title - Optional chart title
 * @param {number} height - Chart height in pixels
 * @param {boolean} stacked - Stack areas on top of each other
 * @param {boolean} showGrid - Show grid lines
 * @param {function} formatValue - Value formatter function
 * @param {function} formatXAxis - X-axis formatter function
 */
export function AreaChart({ 
  data = [], 
  xKey = 'x', 
  areas = [{ key: 'y', color: '#000000' }], 
  title, 
  height = 300,
  stacked = false,
  showGrid = true,
  formatValue = (v) => v,
  formatXAxis = (v) => v,
  showLegend = false
}) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="font-serif text-lg mb-4 text-brand-black">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsArea data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          )}
          <XAxis 
            dataKey={xKey} 
            stroke="#6b7280" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={formatXAxis}
          />
          <YAxis 
            stroke="#6b7280" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={formatValue}
          />
          <Tooltip 
            formatter={formatValue}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          {showLegend && <Legend />}
          {areas.map((area) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              stackId={stacked ? '1' : undefined}
              stroke={area.color}
              fill={area.color}
              fillOpacity={0.6}
              name={area.name || area.key}
            />
          ))}
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}
