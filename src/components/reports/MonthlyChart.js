'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { formatCurrency, getMonthName } from '@/lib/formatters';

function formatYAxis(v) {
  if (v >= 100000) return `${(v / 100000).toFixed(0)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v;
}

export function MonthlyChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: getMonthName(d.month).slice(0, 3),
    amount: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={chartData} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#8A8A8A' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: '#8A8A8A' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
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
        />
        <Bar dataKey="amount" fill="#00C853" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
