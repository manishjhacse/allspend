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
  // data: [{month: 0-11, total: number}]
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: getMonthName(d.month).slice(0, 3),
    amount: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E9E6" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#66736D' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: '#66736D' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          formatter={(v) => [formatCurrency(v), 'Spent']}
          contentStyle={{
            background: '#FFFFFF',
            border: '1px solid #E3E9E6',
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Bar dataKey="amount" fill="#159A68" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
