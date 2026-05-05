// src/components/dashboard/BarChart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: {
    month: string;
    count: number;
    sum: number;
  }[];
}

export function MonthlyBarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#d7e3f7" />
        <XAxis dataKey="month" />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(31, 99, 219, 0.08)' }}
          formatter={(value, name) => [
            `${Number(value ?? 0)} ${name === 'count' ? 'Penyaluran' : 'Rp'}`,
            String(name),
          ]}
        />
        <Legend />
        <Bar dataKey="count" name="Jumlah Penyaluran" fill="#1f63db" />
        <Bar dataKey="sum" name="Total Nominal (Rp)" fill="#5b9bff" />
      </BarChart>
    </ResponsiveContainer>
  );
}
