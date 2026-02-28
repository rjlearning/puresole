import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Filter,
  Pin,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionItem {
  action: string;
  category: 'immediate' | 'short-term' | 'long-term';
  impact: 'high' | 'medium' | 'low';
  completed?: boolean;
}

interface RelatedMetrics {
  baseline?: {
    metric: string;
    deviation: number;
    zScore: number;
  };
  prediction?: {
    window: number;
    trend: 'improving' | 'declining' | 'stable';
    confidence: number;
  };
  correlation?: {
    metric: string;
    strength: number;
    significance: string;
  };
}

interface AdvancedInsight {
  id: string;
  insightType: 'baseline_deviation' | 'trend_alert' | 'recommendation' | 'pattern_discovery' | 'achievement';
  title: string;
  description: string;
  urgencyLevel: number; // 1-10
  priorityScore: number; // 1-100
  confidenceScore: number;
  actionItems: ActionItem[];
  relatedMetrics: RelatedMetrics;
  isPinned: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface AdvancedInsightsPanelProps {
  userId?: string;
}

const getInsightColorClass = (type: string): string => {
  switch (type) {
    case 'baseline_deviation':
      return 'bg-orange-50 border-orange-200';
    case 'trend_alert':
      return 'bg-red-50 border-red-200';
    case 'recommendation':
      return 'bg-blue-50 border-blue-200';
    case 'pattern_discovery':
      return 'bg-purple-50 border-purple-200';
    case 'achievement':
      return 'bg-green-50 border-green-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getInsightIcon = (type: string) => {
  const iconProps = { className: 'w-5 h-5' };
  switch (type) {
    case 'baseline_deviation':
      return <AlertTriangle {...iconProps} className="w-5 h-5 text-orange-600" />;
    case 'trend_alert':
      return <AlertCircle {...iconProps} className="w-5 h-5 text-red-600" />;
    case 'recommendation':
      return <Lightbulb {...iconProps} className="w-5 h-5 text-blue-600" />;
    case 'pattern_discovery':
      return <TrendingUp {...iconProps} className="w-5 h-5 text-purple-600" />;
    case 'achievement':
      return <Trophy {...iconProps} className="w-5 h-5 text-green-600" />;
    default:
      return <Lightbulb {...iconProps} />;
  }
};

const getUrgencyBadge = (urgency: number) => {
  if (urgency >= 8) return <Badge className="bg-red-100 text-red-800">High Urgency</Badge>;
  if (urgency >= 5) return <Badge className="bg-orange-100 text-orange-800">Medium Urgency</Badge>;
  return <Badge className="bg-blue-100 text-blue-800">Low Urgency</Badge>;
};

const getActionCategoryColor = (category: string): string => {
  switch (category) {
    case 'immediate':
      return 'text-red-700 bg-red-100';
    case 'short-term':
      return 'text-orange-700 bg-orange-100';
    case 'long-term':
      return 'text-blue-700 bg-blue-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

const getImpactIcon = (impact: string) => {
  const color = impact === 'high' ? 'text-red-500' : impact === 'medium' ? 'text-orange-500' : 'text-blue-500';
  return <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`}></div>;
};

export default function AdvancedInsightsPanel({ userId }: AdvancedInsightsPanelProps) {
  const [insights, setInsights] = useState<AdvancedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Map<string, Set<number>>>(new Map());

  // Filters
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['baseline_deviation', 'trend_alert', 'recommendation', 'pattern_discovery', 'achievement']));
  const [minUrgency, setMinUrgency] = useState<number>(0);

  useEffect(() => {
    loadInsights();
  }, [userId]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/advanced-analytics/insights?limit=20', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const toggleActionCompleted = (insightId: string, actionIndex: number) => {
    const newCompleted = new Map(completedActions);
    const insightActions = newCompleted.get(insightId) || new Set();

    if (insightActions.has(actionIndex)) {
      insightActions.delete(actionIndex);
    } else {
      insightActions.add(actionIndex);
    }

    newCompleted.set(insightId, insightActions);
    setCompletedActions(newCompleted);
  };

  const toggleTypeFilter = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  // Filter insights
  const filteredInsights = insights.filter(insight => {
    if (showPinnedOnly && !insight.isPinned) return false;
    if (!selectedTypes.has(insight.insightType)) return false;
    if (insight.urgencyLevel < minUrgency) return false;
    return true;
  });

  // Sort by priority (high to low) and pinned status
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.priorityScore - a.priorityScore;
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load insights: {error}</p>
        </div>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Advanced Insights Yet</h3>
          <p className="text-gray-500">
            Continue recording voice entries and tracking wellness metrics to receive personalized insights.
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
          <h2 className="text-2xl font-bold text-gray-900">Advanced Insights</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered recommendations with actionable steps
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Button
            variant={showPinnedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
          >
            <Pin className="w-4 h-4 mr-2" />
            Pinned Only
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Insight Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedTypes.has('baseline_deviation')}
                onCheckedChange={() => toggleTypeFilter('baseline_deviation')}
              >
                Baseline Deviations
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.has('trend_alert')}
                onCheckedChange={() => toggleTypeFilter('trend_alert')}
              >
                Trend Alerts
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.has('recommendation')}
                onCheckedChange={() => toggleTypeFilter('recommendation')}
              >
                Recommendations
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.has('pattern_discovery')}
                onCheckedChange={() => toggleTypeFilter('pattern_discovery')}
              >
                Pattern Discoveries
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.has('achievement')}
                onCheckedChange={() => toggleTypeFilter('achievement')}
              >
                Achievements
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Insights List */}
      <AnimatePresence>
        <div className="space-y-3">
          {sortedInsights.map((insight, idx) => {
            const isExpanded = expandedInsights.has(insight.id);
            const completedSet = completedActions.get(insight.id) || new Set();

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`p-4 border ${getInsightColorClass(insight.insightType)} ${insight.isPinned ? 'ring-2 ring-purple-500' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon and Content */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {getInsightIcon(insight.insightType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title and Badges */}
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base flex-1">
                            {insight.title}
                            {insight.isPinned && <Pin className="inline-block w-3 h-3 ml-2 text-purple-600" />}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getUrgencyBadge(insight.urgencyLevel)}
                          <Badge variant="outline" className="text-xs">
                            {(insight.confidenceScore * 100).toFixed(0)}% confidence
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Priority: {insight.priorityScore}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                          {insight.description}
                        </p>

                        {/* Related Metrics */}
                        {insight.relatedMetrics && (
                          <div className="mt-3 text-xs text-gray-600 space-y-1">
                            {insight.relatedMetrics.baseline && (
                              <div>
                                <span className="font-semibold">Baseline: </span>
                                {insight.relatedMetrics.baseline.metric} (Z-score: {insight.relatedMetrics.baseline.zScore.toFixed(2)})
                              </div>
                            )}
                            {insight.relatedMetrics.prediction && (
                              <div>
                                <span className="font-semibold">Forecast: </span>
                                {insight.relatedMetrics.prediction.window}-day trend is {insight.relatedMetrics.prediction.trend}
                              </div>
                            )}
                            {insight.relatedMetrics.correlation && (
                              <div>
                                <span className="font-semibold">Correlation: </span>
                                {insight.relatedMetrics.correlation.metric} ({insight.relatedMetrics.correlation.significance})
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Items */}
                        {insight.actionItems && insight.actionItems.length > 0 && (
                          <div className="mt-4">
                            <button
                              onClick={() => toggleExpanded(insight.id)}
                              className="text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
                            >
                              {isExpanded ? '▼' : '▶'} {insight.actionItems.length} Action{insight.actionItems.length > 1 ? 's' : ''} ({completedSet.size}/{insight.actionItems.length} completed)
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-3 space-y-2 overflow-hidden"
                                >
                                  {insight.actionItems.map((action, i) => (
                                    <div
                                      key={i}
                                      className="flex items-start gap-3 p-2 rounded bg-white/50 hover:bg-white transition-colors"
                                    >
                                      <Checkbox
                                        checked={completedSet.has(i)}
                                        onCheckedChange={() => toggleActionCompleted(insight.id, i)}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          {getImpactIcon(action.impact)}
                                          <span className={`text-sm ${completedSet.has(i) ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                            {action.action}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge className={`text-xs ${getActionCategoryColor(action.category)}`}>
                                            {action.category}
                                          </Badge>
                                          <span className="text-xs text-gray-500">{action.impact} impact</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="text-xs text-gray-500 mt-3">
                          Created {new Date(insight.createdAt).toLocaleString()}
                          {insight.expiresAt && (
                            <> • Expires {new Date(insight.expiresAt).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {sortedInsights.length === 0 && (
        <Card className="p-6">
          <div className="text-center py-8 text-gray-500">
            No insights match your current filters. Try adjusting the filters above.
          </div>
        </Card>
      )}
    </div>
  );
}
