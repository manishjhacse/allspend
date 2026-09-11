'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { getCategoryConfig } from '@/components/ui/CategorySelector';

const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function CategoryChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: d.category,
    value: d.total,
    fill: getCategoryConfig(d.category).text,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v)} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-col gap-1 px-4 mt-2">
        {data.map((d) => {
          const config = getCategoryConfig(d.category);
          return (
            <div key={d.category} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14 }}>{config.emoji}</span>
                <span style={{ fontSize: 14, color: '#17201C' }}>{d.category}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#17201C' }}>
                {formatCurrency(d.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
