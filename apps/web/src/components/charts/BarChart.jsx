import React from 'react';
import { 
  BarChart as RechartsBar, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

/**
 * BarChart component for comparing values
 * 
 * @param {Array} data - Array of data points
 * @param {string} xKey - Key for x-axis data (category)
 * @param {string|Array<string>} yKey - Key(s) for y-axis data (values)
 * @param {string} title - Optional chart title
 * @param {string|Array<string>} color - Bar color(s)
 * @param {number} height - Chart height in pixels
 * @param {boolean} showGrid - Show grid lines
 * @param {boolean} horizontal - Horizontal bar chart
 * @param {function} formatValue - Value formatter function
 * @param {Array<string>} customColors - Array of colors for each bar (overrides color prop)
 */
export function BarChart({ 
  data = [], 
  xKey = 'name', 
  yKey = 'value', 
  title, 
  color = '#000000', 
  height = 300,
  showGrid = true,
  horizontal = false,
  formatValue = (v) => v,
  customColors = null,
  showLegend = false
}) {
  const bars = Array.isArray(yKey) ? yKey : [yKey];
  const colors = Array.isArray(color) ? color : [color];
  
  const BarChartComponent = horizontal ? RechartsBar : RechartsBar;
  const xAxisProps = horizontal ? { type: 'number', tickFormatter: formatValue } : { dataKey: xKey };
  const yAxisProps = horizontal ? { dataKey: xKey, type: 'category' } : { tickFormatter: formatValue };
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="font-serif text-lg mb-4 text-brand-black">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChartComponent 
          data={data} 
          layout={horizontal ? 'horizontal' : 'vertical'}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          )}
          <XAxis 
            {...xAxisProps}
            stroke="#6b7280" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            {...yAxisProps}
            stroke="#6b7280" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
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
          {bars.map((barKey, index) => (
            <Bar 
              key={barKey}
              dataKey={barKey} 
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              name={barKey}
            >
              {customColors && data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={customColors[idx % customColors.length]} />
              ))}
            </Bar>
          ))}
        </BarChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
