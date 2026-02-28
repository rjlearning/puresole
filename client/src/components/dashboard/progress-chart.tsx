import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProgressEntry {
  id: string;
  date: string;
  activityType: string;
  activityName: string;
  completed: boolean;
  moodRating?: number;
  anxietyLevel?: number;
}

interface ProgressChartProps {
  data: ProgressEntry[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  const chartData = useMemo(() => {
    // Group data by week
    const weeklyData = data.reduce((acc, entry) => {
      const date = new Date(entry.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          completed: 0,
          total: 0,
          moodRatings: [],
          anxietyLevels: [],
        };
      }
      
      acc[weekKey].total++;
      if (entry.completed) {
        acc[weekKey].completed++;
      }
      
      if (entry.moodRating) {
        acc[weekKey].moodRatings.push(entry.moodRating);
      }
      
      if (entry.anxietyLevel) {
        acc[weekKey].anxietyLevels.push(entry.anxietyLevel);
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate averages
    return Object.values(weeklyData)
      .map((week: any) => ({
        ...week,
        completionRate: week.total > 0 ? (week.completed / week.total) * 100 : 0,
        avgMood: week.moodRatings.length > 0 
          ? week.moodRatings.reduce((sum: number, rating: number) => sum + rating, 0) / week.moodRatings.length 
          : null,
        avgAnxiety: week.anxietyLevels.length > 0 
          ? week.anxietyLevels.reduce((sum: number, level: number) => sum + level, 0) / week.anxietyLevels.length 
          : null,
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-8); // Show last 8 weeks
  }, [data]);

  const activityStats = useMemo(() => {
    const stats = data.reduce((acc, entry) => {
      if (!acc[entry.activityType]) {
        acc[entry.activityType] = { completed: 0, total: 0 };
      }
      acc[entry.activityType].total++;
      if (entry.completed) {
        acc[entry.activityType].completed++;
      }
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    return Object.entries(stats).map(([type, data]) => ({
      type,
      ...data,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    }));
  }, [data]);

  const recentTrend = useMemo(() => {
    if (chartData.length < 2) return "stable";
    
    const lastTwo = chartData.slice(-2);
    const difference = lastTwo[1].completionRate - lastTwo[0].completionRate;
    
    if (difference > 5) return "improving";
    if (difference < -5) return "declining";
    return "stable";
  }, [chartData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600 bg-green-100";
      case "declining":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12" data-testid="progress-chart-empty">
        <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No progress data available yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Complete some activities to see your progress visualization
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="progress-chart">
      {/* Progress Trend */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Weekly Progress Trend</h3>
        <Badge className={getTrendIcon(recentTrend) ? getTrendColor(recentTrend) : ""}>
          {getTrendIcon(recentTrend)}
          <span className="ml-2 capitalize">{recentTrend}</span>
        </Badge>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-4" data-testid="weekly-progress-chart">
        {chartData.map((week, index) => (
          <div key={week.week} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Week of {new Date(week.week).toLocaleDateString()}
              </span>
              <span className="text-muted-foreground">
                {week.completed}/{week.total} activities ({Math.round(week.completionRate)}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary rounded-full h-3 transition-all duration-300"
                style={{ width: `${week.completionRate}%` }}
              ></div>
            </div>
            
            {/* Mood and Anxiety indicators */}
            {(week.avgMood || week.avgAnxiety) && (
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {week.avgMood && (
                  <div className="flex items-center space-x-1">
                    <span>Avg Mood:</span>
                    <Badge variant="outline" className="text-xs">
                      {week.avgMood.toFixed(1)}/10
                    </Badge>
                  </div>
                )}
                {week.avgAnxiety && (
                  <div className="flex items-center space-x-1">
                    <span>Avg Anxiety:</span>
                    <Badge variant="outline" className="text-xs">
                      {week.avgAnxiety.toFixed(1)}/10
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Activity Type Breakdown */}
      <Card data-testid="activity-breakdown">
        <CardHeader>
          <CardTitle className="text-base">Activity Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityStats.map((stat) => (
              <div key={stat.type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{stat.type.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">
                    {stat.completed}/{stat.total} ({Math.round(stat.completionRate)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-secondary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${stat.completionRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card data-testid="recent-activity-list">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${entry.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className="font-medium text-sm">{entry.activityName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{entry.activityType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                  <Badge variant={entry.completed ? "default" : "secondary"} className="text-xs">
                    {entry.completed ? "Completed" : "In Progress"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
