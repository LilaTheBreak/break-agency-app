import React from 'react';
import { 
  LineChart as RechartsLine, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

/**
 * LineChart component for displaying trends over time
 * 
 * @param {Array} data - Array of data points
 * @param {string} xKey - Key for x-axis data
 * @param {string|Array<string>} yKey - Key(s) for y-axis data (can be array for multiple lines)
 * @param {string} title - Optional chart title
 * @param {string|Array<string>} color - Line color(s)
 * @param {number} height - Chart height in pixels
 * @param {boolean} showGrid - Show grid lines
 * @param {boolean} showTooltip - Show tooltip on hover
 * @param {boolean} showLegend - Show legend
 * @param {function} formatValue - Value formatter function
 * @param {function} formatXAxis - X-axis formatter function
 */
export function LineChart({ 
  data = [], 
  xKey = 'x', 
  yKey = 'y', 
  title, 
  color = '#000000', 
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  formatValue = (v) => v,
  formatXAxis = (v) => v,
  strokeWidth = 2
}) {
  // Handle multiple lines
  const lines = Array.isArray(yKey) ? yKey : [yKey];
  const colors = Array.isArray(color) ? color : [color];
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="font-serif text-lg mb-4 text-brand-black">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLine data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
          {showTooltip && (
            <Tooltip 
              formatter={formatValue}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
          )}
          {showLegend && <Legend />}
          {lines.map((lineKey, index) => (
            <Line 
              key={lineKey}
              type="monotone" 
              dataKey={lineKey} 
              stroke={colors[index % colors.length]} 
              strokeWidth={strokeWidth}
              dot={{ fill: colors[index % colors.length], r: 4 }}
              activeDot={{ r: 6 }}
              name={lineKey}
            />
          ))}
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}
