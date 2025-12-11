"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function SubmissionTrendChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-lg font-bold mb-4">近7天提交趋势</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" name="提交份数" stroke="#2563eb" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}