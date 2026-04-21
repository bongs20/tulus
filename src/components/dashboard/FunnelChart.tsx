// src/components/dashboard/FunnelChart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

interface FunnelChartProps {
  data: { name: string; value: number }[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  // Sort data by value in descending order for a typical funnel visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Calculate percentage for each step
  const total = sortedData[0]?.value || 1; // Use the largest value as total for percentage calculation
  const dataWithPercentage = sortedData.map(item => ({
    ...item,
    percentage: (item.value / total * 100).toFixed(1) + '%',
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={dataWithPercentage}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={120} />
        <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage})`, name]} />
        <Bar dataKey="value" fill="#8884d8">
          <LabelList dataKey="percentage" position="right" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
