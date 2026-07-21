"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ComparisonData } from "@/lib/types";

export function ComparisonChart({
  comparison,
}: {
  comparison: ComparisonData;
}) {
  const youData = [
    { name: "You", value: comparison.you },
    { name: "Remaining", value: Math.max(0, 100 - comparison.you) },
  ];
  const communityData = [
    { name: "Community Avg", value: comparison.community },
    { name: "Remaining", value: Math.max(0, 100 - comparison.community) },
  ];

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Achievement Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2">
        <div
          className="relative h-55 w-full"
          role="img"
          aria-label={`Achievement comparison: you ${comparison.you}% versus community average ${comparison.community}%.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={youData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={88}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                cornerRadius={8}
                paddingAngle={2}
              >
                <Cell className="text-primary" fill="currentColor" />
                <Cell className="text-muted" fill="currentColor" />
              </Pie>
              <Pie
                data={communityData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={64}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                cornerRadius={6}
                paddingAngle={2}
              >
                <Cell className="text-muted-foreground" fill="currentColor" />
                <Cell className="text-muted" fill="currentColor" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">You vs</span>
            <span className="text-lg font-bold text-foreground">Community</span>
          </div>
        </div>

        <div className="mt-2 flex w-full justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <div>
              <p className="text-xs text-muted-foreground">You</p>
              <p className="text-sm font-semibold text-foreground">
                {comparison.you || 0}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Community Avg</p>
              <p className="text-sm font-semibold text-foreground">
                {comparison.community || 0}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
