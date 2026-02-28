import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  Award,
  Activity,
  Heart,
  Brain,
  Users,
  Pill,
  Moon,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  X,
  Edit2,
  Trash2
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  category: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  why_important: string;
  reward: string;
  status: string;
  completion_percentage: number;
  completed_at: string | null;
  created_at: string;
}

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  goal_type: string;
  target_value: number;
  target_metric: string;
  suggested_duration_days: number;
  tips: string;
  is_featured: boolean;
}

interface GoalStats {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  abandoned_goals: number;
  avg_completion: number;
  overdue_goals: number;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    goal_type: 'personal',
    category: 'mental_health',
    target_metric: 'activities_completed',
    target_value: 30,
    unit: 'activities',
    target_date: '',
    why_important: '',
    reward: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load goals
      const goalsRes = await fetch('/api/goals');
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.goals || []);
      }

      // Load stats
      const statsRes = await fetch('/api/goals/stats/summary');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Load templates
      const templatesRes = await fetch('/api/goals/templates/list');
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error('Error loading goals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });

      if (res.ok) {
        await loadData();
        setShowCreateModal(false);
        setNewGoal({
          title: '',
          description: '',
          goal_type: 'personal',
          category: 'mental_health',
          target_metric: 'activities_completed',
          target_value: 30,
          unit: 'activities',
          target_date: '',
          why_important: '',
          reward: ''
        });
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mental_health': return <Brain className="w-5 h-5" />;
      case 'physical_health': return <Heart className="w-5 h-5" />;
      case 'social': return <Users className="w-5 h-5" />;
      case 'mindfulness': return <Activity className="w-5 h-5" />;
      case 'medication': return <Pill className="w-5 h-5" />;
      case 'sleep': return <Moon className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mental_health': return 'bg-purple-100 text-purple-700';
      case 'physical_health': return 'bg-red-100 text-red-700';
      case 'social': return 'bg-blue-100 text-blue-700';
      case 'mindfulness': return 'bg-green-100 text-green-700';
      case 'medication': return 'bg-orange-100 text-orange-700';
      case 'sleep': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-700">Paused</Badge>;
      case 'abandoned':
        return <Badge className="bg-gray-100 text-gray-700">Abandoned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (activeTab === 'active') return goal.status === 'active';
    if (activeTab === 'completed') return goal.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Target className="w-10 h-10 text-purple-600" />
                Wellness Goals
              </h1>
              <p className="text-gray-600">Set targets, track progress, and achieve your mental wellness goals</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowTemplatesModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Use Template
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                <Plus className="w-4 h-4" />
                New Goal
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Goals</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.active_goals}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed_goals}</p>
                  </div>
                  <Award className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(parseFloat(stats.avg_completion) || 0)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdue_goals}</p>
                  </div>
                  <Clock className="w-8 h-8 text-red-600 opacity-20" />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active ({goals.filter(g => g.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({goals.filter(g => g.status === 'completed').length})</TabsTrigger>
            <TabsTrigger value="all">All Goals ({goals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredGoals.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {activeTab === 'active' ? 'No Active Goals' : activeTab === 'completed' ? 'No Completed Goals' : 'No Goals Yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'active'
                    ? 'Create your first wellness goal to start tracking your progress'
                    : activeTab === 'completed'
                    ? "You haven't completed any goals yet. Keep working on your active goals!"
                    : 'Start your wellness journey by setting your first goal'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowTemplatesModal(true)}
                    variant="outline"
                  >
                    Browse Templates
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  >
                    Create Goal
                  </Button>
                </div>
              </Card>
            ) : (
              filteredGoals.map(goal => (
                <Card key={goal.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getCategoryColor(goal.category)}`}>
                          {getCategoryIcon(goal.category)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{goal.title}</h3>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(goal.status)}
                      <Button size="sm" variant="ghost">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-gray-900">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(goal.completion_percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-sm font-semibold text-purple-600">
                        {Math.round(goal.completion_percentage)}% Complete
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Started: {new Date(goal.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {goal.why_important && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm">
                        <span className="font-semibold text-purple-700">Why this matters:</span>{' '}
                        <span className="text-gray-700">{goal.why_important}</span>
                      </p>
                    </div>
                  )}

                  {goal.reward && (
                    <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm">
                        <span className="font-semibold text-yellow-700">Reward:</span>{' '}
                        <span className="text-gray-700">{goal.reward}</span>
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {goal.status === 'active' && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateGoalStatus(goal.id, 'completed')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateGoalStatus(goal.id, 'paused')}
                      >
                        Pause
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Create New Goal</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Goal Title *</label>
                    <input
                      type="text"
                      required
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="e.g., Daily Mood Tracking"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      rows={3}
                      placeholder="What do you want to achieve?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={newGoal.category}
                        onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="mental_health">Mental Health</option>
                        <option value="physical_health">Physical Health</option>
                        <option value="social">Social</option>
                        <option value="mindfulness">Mindfulness</option>
                        <option value="medication">Medication</option>
                        <option value="sleep">Sleep</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Goal Type</label>
                      <select
                        value={newGoal.goal_type}
                        onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="personal">Personal</option>
                        <option value="shared">Shared</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Target Value *</label>
                      <input
                        type="number"
                        required
                        value={newGoal.target_value}
                        onChange={(e) => setNewGoal({ ...newGoal, target_value: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Unit</label>
                      <input
                        type="text"
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                        placeholder="e.g., activities, days"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Date *</label>
                    <input
                      type="date"
                      required
                      value={newGoal.target_date}
                      onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Why is this important to you?</label>
                    <textarea
                      value={newGoal.why_important}
                      onChange={(e) => setNewGoal({ ...newGoal, why_important: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                      rows={2}
                      placeholder="Understanding your 'why' helps maintain motivation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Reward yourself when complete</label>
                    <input
                      type="text"
                      value={newGoal.reward}
                      onChange={(e) => setNewGoal({ ...newGoal, reward: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                      placeholder="e.g., Treat yourself to a spa day"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    >
                      Create Goal
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplatesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Goal Templates</h2>
                  <button
                    onClick={() => setShowTemplatesModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                          {getCategoryIcon(template.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{template.title}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        {template.is_featured && (
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <p><strong>Target:</strong> {template.target_value} {template.target_metric}</p>
                        <p><strong>Duration:</strong> {template.suggested_duration_days} days</p>
                      </div>

                      {template.tips && (
                        <div className="text-sm bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="text-gray-700">{template.tips}</p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Use This Template
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
