import React from 'react';
import { 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';

const DEFAULT_COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'];

/**
 * PieChart component for showing distribution
 * 
 * @param {Array} data - Array of data points with {name, value}
 * @param {string} title - Optional chart title
 * @param {Array<string>} colors - Array of colors for pie slices
 * @param {number} height - Chart height in pixels
 * @param {boolean} showLegend - Show legend
 * @param {boolean} showLabels - Show labels on slices
 * @param {function} formatValue - Value formatter function
 * @param {number} innerRadius - Inner radius for donut chart (0 for pie)
 * @param {number} outerRadius - Outer radius
 */
export function PieChart({ 
  data = [], 
  title, 
  colors = DEFAULT_COLORS, 
  height = 300,
  showLegend = true,
  showLabels = true,
  formatValue = (v) => v,
  innerRadius = 0,
  outerRadius = 100
}) {
  const renderCustomLabel = (entry) => {
    if (!showLabels) return null;
    return `${entry.name}: ${formatValue(entry.value)}`;
  };
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="font-serif text-lg mb-4 text-brand-black">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            label={showLabels ? renderCustomLabel : false}
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={formatValue}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
            />
          )}
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
