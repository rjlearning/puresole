import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Share2, Download, TrendingUp, Activity, Target, Heart, AlertTriangle, Lightbulb, Calendar } from 'lucide-react';

interface ReportData {
  emotionalTrends: {
    dates: string[];
    emotions: { [key: string]: number[] };
    averages: { [key: string]: number };
  };
  voiceInsights: Array<{
    date: string;
    mood: string;
    keyThemes: string[];
    transcriptSnippet?: string;
  }>;
  activitiesCompleted: {
    total: number;
    byCategory: { [key: string]: number };
    topActivities: Array<{ name: string; count: number }>;
  };
  goalsProgress: {
    totalGoals: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    goals: Array<{
      title: string;
      status: string;
      progress: number;
    }>;
  };
  wellnessScore: {
    overall: number;
    consistency: number;
    improvement: number;
  };
  crisisIndicators: Array<{
    date: string;
    severity: string;
    type: string;
    description: string;
  }>;
  keyInsights: Array<{
    type: string;
    title: string;
    description: string;
    severity?: string;
  }>;
}

interface Report {
  id: string;
  title: string;
  report_type: string;
  start_date: string;
  end_date: string;
  data: ReportData;
  status: string;
  created_at: string;
}

export default function ReportDetail() {
  const [match, params] = useRoute('/reports/:id');
  const [, setLocation] = useLocation();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadReport(params.id);
    }
  }, [params?.id]);

  const loadReport = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`);
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      default: return <Heart className="w-5 h-5 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Report not found</h2>
          <button
            onClick={() => setLocation('/reports')}
            className="text-blue-600 hover:underline"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const data = report.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation('/reports')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Reports
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{report.title}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(report.start_date)} - {formatDate(report.end_date)}</span>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
                  {report.report_type}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <a
                href={`/api/reports/${report.id}/pdf`}
                download
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          </div>
        </div>

        {/* Wellness Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Overall Wellness</h3>
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(data.wellnessScore.overall)} rounded-lg px-4 py-2 inline-block`}>
              {data.wellnessScore.overall}
            </div>
            <p className="text-sm text-gray-500 mt-2">Combined health metric</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Consistency</h3>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(data.wellnessScore.consistency)} rounded-lg px-4 py-2 inline-block`}>
              {data.wellnessScore.consistency}
            </div>
            <p className="text-sm text-gray-500 mt-2">Regular engagement</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Improvement</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(data.wellnessScore.improvement)} rounded-lg px-4 py-2 inline-block`}>
              {data.wellnessScore.improvement}
            </div>
            <p className="text-sm text-gray-500 mt-2">Trend direction</p>
          </div>
        </div>

        {/* Key Insights */}
        {data.keyInsights && data.keyInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              Key Insights
            </h2>
            <div className="space-y-3">
              {data.keyInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-100 hover:border-blue-200 transition-all"
                >
                  {getInsightIcon(insight.type)}
                  <div>
                    <div className="font-semibold text-gray-800">{insight.title}</div>
                    <div className="text-sm text-gray-600">{insight.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities Completed */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Activities Completed
          </h2>

          <div className="mb-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">{data.activitiesCompleted.total}</div>
            <p className="text-gray-600">Total activities completed this period</p>
          </div>

          {data.activitiesCompleted.topActivities.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Top Activities</h3>
              <div className="space-y-2">
                {data.activitiesCompleted.topActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-800">{activity.name}</span>
                    <span className="text-blue-600 font-semibold">{activity.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Goals Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-600" />
            Goals Progress
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">{data.goalsProgress.totalGoals}</div>
              <div className="text-sm text-gray-600">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data.goalsProgress.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.goalsProgress.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>

          {data.goalsProgress.goals && data.goalsProgress.goals.length > 0 && (
            <div className="space-y-3">
              {data.goalsProgress.goals.map((goal, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{goal.title}</span>
                    <span className="text-sm text-gray-600 capitalize">{goal.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crisis Indicators */}
        {data.crisisIndicators && data.crisisIndicators.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Crisis Indicators
            </h2>
            <div className="space-y-3">
              {data.crisisIndicators.map((indicator, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">{indicator.date}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      indicator.severity === 'high' ? 'bg-red-100 text-red-800' :
                      indicator.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {indicator.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{indicator.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Insights */}
        {data.voiceInsights && data.voiceInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Voice Journal Insights</h2>
            <div className="space-y-3">
              {data.voiceInsights.map((insight, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{insight.date}</span>
                    <span className="text-sm font-medium text-gray-800">Mood: {insight.mood}</span>
                  </div>
                  {insight.keyThemes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.keyThemes.map((theme, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
