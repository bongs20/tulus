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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number, name: string) => [`${value} ${name === 'count' ? 'Penyaluran' : 'Rp'}`, name]} />
        <Legend />
        <Bar dataKey="count" name="Jumlah Penyaluran" fill="#8884d8" />
        <Bar dataKey="sum" name="Total Nominal (Rp)" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
}
