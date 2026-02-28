import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface BaselineMetrics {
  windowDays: 30 | 60 | 90;
  baselineWellnessScore: number;
  baselineValence: number;
  baselineArousal: number;
  baselineDominance: number;
  wellnessStdDev: number;
  valenceStdDev: number;
  arousalStdDev: number;
  dominanceStdDev: number;
  dataPointCount: number;
  baselineConfidence: number;
  lastUpdatedAt: string;
}

interface DeviationStatus {
  metric: string;
  currentValue: number;
  baselineValue: number;
  zScore: number;
  isSignificant: boolean;
  direction: 'up' | 'down' | 'stable';
}

interface BaselineVisualizationProps {
  userId?: string;
}

const getDeviationColor = (zScore: number): string => {
  const absZ = Math.abs(zScore);
  if (absZ >= 2.5) return 'text-red-600 bg-red-50 border-red-200';
  if (absZ >= 2.0) return 'text-orange-600 bg-orange-50 border-orange-200';
  if (absZ >= 1.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-green-600 bg-green-50 border-green-200';
};

const getDeviationIcon = (direction: 'up' | 'down' | 'stable') => {
  switch (direction) {
    case 'up':
      return <TrendingUp className="w-4 h-4" />;
    case 'down':
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <Minus className="w-4 h-4" />;
  }
};

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 0.9) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
  if (confidence >= 0.7) return <Badge className="bg-blue-100 text-blue-800">Good Confidence</Badge>;
  if (confidence >= 0.5) return <Badge className="bg-yellow-100 text-yellow-800">Moderate Confidence</Badge>;
  return <Badge className="bg-gray-100 text-gray-800">Low Confidence</Badge>;
};

export default function BaselineVisualization({ userId }: BaselineVisualizationProps) {
  const [baselines, setBaselines] = useState<BaselineMetrics[]>([]);
  const [deviations, setDeviations] = useState<DeviationStatus[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<30 | 60 | 90>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBaselines();
    loadDeviations();
  }, [userId]);

  const loadBaselines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/advanced-analytics/baselines', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load baselines');
      }

      const data = await response.json();
      setBaselines(data.baselines || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading baselines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeviations = async () => {
    try {
      const response = await fetch('/api/advanced-analytics/baselines/deviations?days=7', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load deviations');
      }

      const data = await response.json();
      setDeviations(data.deviations || []);
    } catch (err) {
      console.error('Error loading deviations:', err);
    }
  };

  const currentBaseline = baselines.find(b => b.windowDays === selectedWindow);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <p>Failed to load baseline data: {error}</p>
        </div>
      </Card>
    );
  }

  if (!baselines || baselines.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Baseline Data Yet</h3>
          <p className="text-gray-500">
            Continue recording voice entries to establish your personalized baseline.
            We need at least 14 recordings to calculate reliable baselines.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personalized Baseline</h2>
          <p className="text-sm text-gray-600 mt-1">
            Your typical wellness patterns based on historical data
          </p>
        </div>
        {currentBaseline && getConfidenceBadge(currentBaseline.baselineConfidence)}
      </div>

      {/* Time Window Selector */}
      <Tabs value={selectedWindow.toString()} onValueChange={(v) => setSelectedWindow(parseInt(v) as 30 | 60 | 90)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="30">30 Days</TabsTrigger>
          <TabsTrigger value="60">60 Days</TabsTrigger>
          <TabsTrigger value="90">90 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedWindow.toString()} className="mt-6">
          {currentBaseline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Baseline Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Wellness Score */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Wellness Score</span>
                    <Heart className="w-4 h-4 text-pink-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentBaseline.baselineWellnessScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ± {currentBaseline.wellnessStdDev.toFixed(1)} typical range
                  </div>
                </Card>

                {/* Valence */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Valence</span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentBaseline.baselineValence.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ± {currentBaseline.valenceStdDev.toFixed(2)} typical range
                  </div>
                </Card>

                {/* Arousal */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Arousal</span>
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentBaseline.baselineArousal.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ± {currentBaseline.arousalStdDev.toFixed(2)} typical range
                  </div>
                </Card>

                {/* Dominance */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Dominance</span>
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentBaseline.baselineDominance.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ± {currentBaseline.dominanceStdDev.toFixed(2)} typical range
                  </div>
                </Card>
              </div>

              {/* Baseline Info */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">About Your Baseline</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Based on {currentBaseline.dataPointCount} recordings over the last {selectedWindow} days.
                      Your baseline represents your typical emotional state and helps identify significant changes.
                      Updated {new Date(currentBaseline.lastUpdatedAt).toLocaleDateString()}.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Deviations */}
      {deviations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deviations (Last 7 Days)</h3>
          <div className="space-y-3">
            {deviations.map((deviation, idx) => (
              <motion.div
                key={deviation.metric}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`p-4 border ${getDeviationColor(deviation.zScore)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviationIcon(deviation.direction)}
                      <div>
                        <h4 className="font-semibold text-sm">{deviation.metric}</h4>
                        <p className="text-xs mt-0.5">
                          Current: {deviation.currentValue.toFixed(1)} |
                          Baseline: {deviation.baselineValue.toFixed(1)} |
                          Z-score: {deviation.zScore.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {deviation.isSignificant && (
                      <Badge variant="outline" className="text-xs">
                        Significant Change
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
