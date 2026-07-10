"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AchievementDataPoint } from "@/lib/types";

export function AchievementChart({
  series,
}: {
  series: AchievementDataPoint[];
}) {
  return (
    <Card className="col-span-12 border-border/50 bg-card lg:col-span-7">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Achievement Progress Over Time
        </CardTitle>
        <Select defaultValue="percent">
          <SelectTrigger className="h-8 w-36 border-border/50 bg-background text-xs">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">Percent Completion</SelectItem>
            <SelectItem value="count">Achievement Count</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="mb-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-primary" />
            <span className="text-muted-foreground">You</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1 w-6 rounded-full border border-dashed border-muted-foreground" />
            <span className="text-muted-foreground">Community Average</span>
          </div>
        </div>
        <div
          className="h-[260px] w-full"
          role="img"
          aria-label={`Achievement progress over time. You reached ${series.at(-1)?.you ?? 0}% versus the community average of ${series.at(-1)?.community ?? 0}%.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 5, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-border"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "currentColor", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fill: "currentColor", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="you"
                stroke="currentColor"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "currentColor" }}
                className="text-primary"
              />
              <Line
                type="monotone"
                dataKey="community"
                stroke="currentColor"
                strokeWidth={2}
                strokeDasharray="6 6"
                dot={false}
                className="text-muted-foreground"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>Achievement progress over time</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">You (%)</th>
              <th scope="col">Community average (%)</th>
            </tr>
          </thead>
          <tbody>
            {series.map((point) => (
              <tr key={point.date}>
                <td>{point.date}</td>
                <td>{point.you}</td>
                <td>{point.community}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
