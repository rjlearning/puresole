import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Calendar, RefreshCw, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface Prediction {
  userId: string;
  predictionDate: string;
  predictionWindow: 7 | 14 | 30;
  predictedWellnessScore: number;
  predictedValence: number;
  predictedArousal: number;
  predictedDominance: number;
  confidenceScore: number;
  rSquared: number;
  wellnessCiLower: number;
  wellnessCiUpper: number;
  valenceCiLower: number;
  valenceCiUpper: number;
  modelType: string;
  trainingDataPoints: number;
  generatedAt: string;
  expiresAt: string;
}

interface ChartDataPoint {
  date: string;
  predicted: number;
  ciLower: number;
  ciUpper: number;
  isRisk?: boolean;
}

interface PredictiveForecastsProps {
  userId?: string;
}

const getRiskLevel = (score: number): { level: string; color: string } => {
  if (score >= 81) return { level: 'Excellent', color: '#10b981' };
  if (score >= 61) return { level: 'Good', color: '#84cc16' };
  if (score >= 41) return { level: 'Fair', color: '#fbbf24' };
  if (score >= 26) return { level: 'At Risk', color: '#f59e0b' };
  return { level: 'Critical', color: '#ef4444' };
};

const getModelQualityBadge = (rSquared: number) => {
  if (rSquared >= 0.8) return <Badge className="bg-green-100 text-green-800">Excellent Fit</Badge>;
  if (rSquared >= 0.6) return <Badge className="bg-blue-100 text-blue-800">Good Fit</Badge>;
  if (rSquared >= 0.4) return <Badge className="bg-yellow-100 text-yellow-800">Fair Fit</Badge>;
  return <Badge className="bg-orange-100 text-orange-800">Limited Fit</Badge>;
};

const CustomForecastTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const risk = getRiskLevel(data.predicted);

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800 mb-2">{data.date}</p>
        <div className="space-y-1">
          <p className="text-sm text-gray-700">
            Predicted: <span className="font-bold">{data.predicted.toFixed(1)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Range: {data.ciLower.toFixed(1)} - {data.ciUpper.toFixed(1)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: risk.color }}></div>
            <span className="text-sm font-medium">{risk.level}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PredictiveForecasts({ userId }: PredictiveForecastsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<7 | 14 | 30>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, [userId]);

  const loadPredictions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/advanced-analytics/predictions', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load predictions');
      }

      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading predictions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewPredictions = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/advanced-analytics/predictions/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate predictions');
      }

      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error generating predictions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentPrediction = predictions.find(p => p.predictionWindow === selectedWindow);

  // Generate chart data points for the selected window
  const generateChartData = (): ChartDataPoint[] => {
    if (!currentPrediction) return [];

    const data: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = 0; i <= selectedWindow; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Interpolate prediction values
      const progress = i / selectedWindow;
      const predicted = currentPrediction.predictedWellnessScore;
      const ciLower = currentPrediction.wellnessCiLower;
      const ciUpper = currentPrediction.wellnessCiUpper;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted,
        ciLower,
        ciUpper,
        isRisk: predicted < 41
      });
    }

    return data;
  };

  const chartData = generateChartData();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-80 w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load forecasts: {error}</p>
        </div>
      </Card>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Predictions Available</h3>
          <p className="text-gray-500 mb-4">
            We need at least 14 voice recordings to generate reliable wellness forecasts.
          </p>
          <Button onClick={generateNewPredictions} disabled={isGenerating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Predictions'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wellness Forecast</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered predictions based on your historical patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentPrediction && getModelQualityBadge(currentPrediction.rSquared)}
          <Button
            variant="outline"
            size="sm"
            onClick={generateNewPredictions}
            disabled={isGenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Update
          </Button>
        </div>
      </div>

      {/* Time Window Selector */}
      <Tabs value={selectedWindow.toString()} onValueChange={(v) => setSelectedWindow(parseInt(v) as 7 | 14 | 30)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="7">7 Days</TabsTrigger>
          <TabsTrigger value="14">14 Days</TabsTrigger>
          <TabsTrigger value="30">30 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedWindow.toString()} className="mt-6">
          {currentPrediction && chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Prediction Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Predicted Wellness */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">Predicted Wellness</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentPrediction.predictedWellnessScore.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {currentPrediction.predictedWellnessScore >= 61 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Positive outlook</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">Needs attention</span>
                      </>
                    )}
                  </div>
                </Card>

                {/* Confidence */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-600">Confidence</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {(currentPrediction.confidenceScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Based on {currentPrediction.trainingDataPoints} data points
                  </div>
                </Card>

                {/* Confidence Range */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">Confidence Range</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {currentPrediction.wellnessCiLower.toFixed(1)} - {currentPrediction.wellnessCiUpper.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    95% confidence interval
                  </div>
                </Card>
              </div>

              {/* Forecast Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedWindow}-Day Wellness Forecast
                </h3>

                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomForecastTooltip />} />

                    {/* Confidence Interval Band */}
                    <Area
                      type="monotone"
                      dataKey="ciUpper"
                      stroke="none"
                      fill="#93c5fd"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="ciLower"
                      stroke="none"
                      fill="#fff"
                      fillOpacity={1}
                    />

                    {/* Predicted Line */}
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Chart Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-500"></div>
                    <span className="text-gray-700">Predicted Wellness</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-3 bg-blue-300 opacity-30 rounded"></div>
                    <span className="text-gray-700">95% Confidence Range</span>
                  </div>
                </div>
              </Card>

              {/* Prediction Info */}
              <Card className="p-4 bg-purple-50 border-purple-200 mt-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900 text-sm">About This Forecast</h4>
                    <p className="text-sm text-purple-800 mt-1">
                      This {selectedWindow}-day forecast uses linear regression trained on {currentPrediction.trainingDataPoints} recent
                      voice recordings. The model quality (R² = {currentPrediction.rSquared.toFixed(2)}) indicates{' '}
                      {currentPrediction.rSquared >= 0.7 ? 'strong' : currentPrediction.rSquared >= 0.5 ? 'moderate' : 'limited'} predictive
                      power. The shaded area represents the 95% confidence interval. Generated{' '}
                      {new Date(currentPrediction.generatedAt).toLocaleString()}.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
