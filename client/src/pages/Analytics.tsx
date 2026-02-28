import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Lightbulb,
  AlertTriangle,
  Heart,
  Sparkles,
  BarChart3,
  Calendar,
  RefreshCw,
  Target,
  Zap,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import MoodLineChart from '@/components/analytics/MoodLineChart';
import MoodHeatmap from '@/components/analytics/MoodHeatmap';
import BaselineVisualization from '@/components/analytics/BaselineVisualization';
import PredictiveForecasts from '@/components/analytics/PredictiveForecasts';
import AdvancedInsightsPanel from '@/components/analytics/AdvancedInsightsPanel';
import ExportModal from '@/components/analytics/ExportModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Trend {
  date: string;
  mood: number;
  energy: number;
  stress: number;
  entries: number;
}

interface Correlation {
  category: string;
  averageMood: number;
  impact: number;
  strength: string;
  sampleSize: number;
}

interface Prediction {
  date: string;
  predictedMood: number;
  confidence: number;
}

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  priority: number;
  status: string;
  created_at: string;
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  actions: Array<{ label: string; type?: string; category?: string }>;
  priority: number;
}

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [trends, setTrends] = useState<any>(null);
  const [correlations, setCorrelations] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [activeView, setActiveView] = useState<'overview' | 'advanced'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/analytics/dashboard');
      const data = await response.json();

      setTrends(data.dashboard.trends);
      setCorrelations(data.dashboard.correlations);
      setPredictions(data.dashboard.predictions);
      setInsights(data.dashboard.insights);
      setRecommendations(data.dashboard.recommendations);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadTrends = async (period: 'week' | 'month' | 'quarter') => {
    try {
      const response = await fetch(`/api/analytics/trends?period=${period}`);
      const data = await response.json();
      setTrends(data.data);
      setSelectedPeriod(period);
    } catch (error) {
      console.error('Failed to load trends:', error);
    }
  };

  const refreshInsights = async () => {
    try {
      const response = await fetch('/api/analytics/insights/refresh', { method: 'POST' });
      const data = await response.json();
      setInsights(data.insights);
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  };

  const dismissInsight = async (id: string) => {
    try {
      await fetch(`/api/analytics/insights/${id}/dismiss`, { method: 'POST' });
      setInsights(insights.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'suggestion':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'achievement':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      default:
        return <Heart className="w-5 h-5 text-blue-600" />;
    }
  };

  const getMoodLabel = (mood: number) => {
    if (mood >= 4.5) return { label: 'Great', color: 'text-green-600', bg: 'bg-green-100' };
    if (mood >= 3.5) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (mood >= 2.5) return { label: 'Okay', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (mood >= 1.5) return { label: 'Bad', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">Deep insights into your mental wellness journey</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Phase IV Export Modal */}
              <ExportModal />

              {/* Refresh Button */}
              <Button
                onClick={loadDashboard}
                disabled={isRefreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Enhanced View Switcher */}
          <Card className="p-2 bg-white shadow-lg">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('overview')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeView === 'overview'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-[1.02]'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline">Overview</span>
              </button>
              <button
                onClick={() => setActiveView('advanced')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeView === 'advanced'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md transform scale-[1.02]'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">Advanced Analytics</span>
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full font-bold">NEW</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Mood Trends Section */}
            <Card className="shadow-lg">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Mood Trends
                  </h2>
                  <div className="flex gap-2">
                    {(['week', 'month', 'quarter'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => loadTrends(period)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedPeriod === period
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {trends && (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Average Mood</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                          {trends.summary.averageMood ? trends.summary.averageMood.toFixed(1) : 'N/A'}
                        </div>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">Average Energy</span>
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                          {trends.summary.averageEnergy ? trends.summary.averageEnergy.toFixed(1) : 'N/A'}
                        </div>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">Average Stress</span>
                        </div>
                        <div className="text-3xl font-bold text-orange-600">
                          {trends.summary.averageStress ? trends.summary.averageStress.toFixed(1) : 'N/A'}
                        </div>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {trends.summary.trendDirection === 'improving' ? (
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                          ) : trends.summary.trendDirection === 'declining' ? (
                            <TrendingDown className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Activity className="w-5 h-5 text-purple-600" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Trend</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600 capitalize">
                          {trends.summary.trendDirection}
                        </div>
                      </Card>
                    </div>

                    {/* Chart */}
                    <Card className="bg-gray-50 p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Mood, Energy & Stress Trends</h3>
                      <MoodLineChart data={trends.trends} />
                    </Card>
                  </>
                )}
              </div>
            </Card>

            {/* Calendar Heatmap */}
            {trends && trends.trends.length > 0 && (
              <div>
                <MoodHeatmap data={trends.trends} />
              </div>
            )}

            {/* Correlations & Predictions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Correlations */}
              <Card className="shadow-lg">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-purple-600" />
                    Activity Correlations
                  </h2>

                  {correlations && correlations.correlations.length > 0 ? (
                    <div className="space-y-3">
                      {correlations.correlations.slice(0, 5).map((corr: Correlation, index: number) => (
                        <Card key={index} className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800 capitalize">{corr.category}</span>
                            <span
                              className={`text-sm px-3 py-1 rounded-full font-medium ${
                                corr.impact > 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {corr.impact > 0 ? '+' : ''}
                              {corr.impact ? corr.impact.toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  corr.impact > 0 ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.abs(corr.impact) * 20)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 capitalize font-medium">{corr.strength}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">Not enough data yet. Keep tracking activities!</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Mood Predictions */}
              <Card className="shadow-lg">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    Mood Predictions
                  </h2>

                  {predictions && predictions.predictions.length > 0 ? (
                    <>
                      <Card className="mb-4 p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-700">Current Trend:</span>
                          <span className="font-semibold text-blue-600 capitalize">{predictions.trend}</span>
                          <span
                            className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${
                              predictions.confidence === 'high'
                                ? 'bg-green-100 text-green-800'
                                : predictions.confidence === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {predictions.confidence} confidence
                          </span>
                        </div>
                      </Card>

                      <div className="space-y-2">
                        {predictions.predictions.map((pred: Prediction, index: number) => {
                          const moodLabel = getMoodLabel(pred.predictedMood);
                          return (
                            <Card key={index} className="p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 font-medium w-20">{formatDate(pred.date)}</span>
                                <div className="flex-1 flex items-center gap-2">
                                  <div className={`px-3 py-1 rounded-lg ${moodLabel.bg} ${moodLabel.color} font-semibold text-sm`}>
                                    {pred.predictedMood ? pred.predictedMood.toFixed(1) : 'N/A'}
                                  </div>
                                  <span className="text-xs text-gray-500">{pred.confidence}% confidence</span>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">{predictions?.message || 'Not enough data for predictions'}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Insights Section */}
            <Card className="shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                    Personalized Insights
                  </h2>
                  <Button
                    onClick={refreshInsights}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Insights
                  </Button>
                </div>

                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <Card
                        key={insight.id}
                        className="p-4 border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          {getInsightIcon(insight.insight_type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">{insight.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{insight.description}</div>
                            {insight.confidence_score && (
                              <div className="mt-2 text-xs text-gray-500">
                                Confidence: {(insight.confidence_score * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => dismissInsight(insight.id)}
                            className="text-gray-400 hover:text-gray-600 text-sm font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lightbulb className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-lg">No new insights available</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Recommendations Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-600" />
                  Personalized Recommendations
                </h2>

                {recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, index) => (
                      <Card key={index} className="bg-white p-5 shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">{rec.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                        <div className="space-y-2">
                          {rec.actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium text-purple-800 transition-all flex items-center justify-between group"
                            >
                              <span>{action.label}</span>
                              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-lg">No recommendations available yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Advanced Analytics View - Phase IV */}
        {activeView === 'advanced' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Phase IV: Baseline Visualization */}
            <section>
              <BaselineVisualization />
            </section>

            {/* Phase IV: Predictive Forecasts */}
            <section>
              <PredictiveForecasts />
            </section>

            {/* Phase IV: Advanced Insights Panel */}
            <section>
              <AdvancedInsightsPanel />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
