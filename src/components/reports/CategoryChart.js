'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { getCategoryConfig } from '@/components/ui/CategorySelector';

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
      style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function CategoryChart({ data }) {
  if (!data || data.length === 0) return null;

  const grandTotal = data.reduce((sum, item) => sum + item.total, 0);

  const chartData = data.map((d) => {
    const config = getCategoryConfig(d.category);
    return {
      name: d.category,
      value: d.total,
      fill: config.color || '#00C853',
      percent: grandTotal > 0 ? (d.total / grandTotal) * 100 : 0,
    };
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
            stroke="#0D0D0D"
            strokeWidth={2}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [formatCurrency(v), 'Spent']}
            contentStyle={{
              background: '#151515',
              border: '1px solid #282828',
              borderRadius: 12,
              fontSize: 13,
              color: '#F5F5F5',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
            itemStyle={{ color: '#00C853', fontWeight: 600 }}
            labelStyle={{ color: '#8A8A8A', marginBottom: 4 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Sleek Category Legend List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {chartData.map((item) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#141414',
              border: '1px solid #1F1F1F',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: item.fill,
                  boxShadow: `0 0 10px ${item.fill}80`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#F5F5F5' }}>
                {item.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#8A8A8A',
                  background: '#1E1E1E',
                  padding: '2px 8px',
                  borderRadius: 100,
                }}
              >
                {item.percent.toFixed(0)}%
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
