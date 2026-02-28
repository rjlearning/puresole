import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, Circle, Clock, Play, BookOpen, PenTool, Heart, ChevronDown, ChevronRight } from "lucide-react";

interface Activity {
  type: 'exercise' | 'lesson' | 'journal' | 'meditation' | 'reading';
  name: string;
  description: string;
  duration: number;
  instructions: string;
}

interface TreatmentModuleProps {
  module: {
    id: string;
    title: string;
    description: string;
    week: number;
    content: {
      activities: Activity[];
      learningObjectives: string[];
    };
  };
  progressEntries: any[];
  onActivityComplete: (activityName: string, activityType: string, moduleId?: string) => void;
  isLoading: boolean;
}

export default function TreatmentModule({ 
  module, 
  progressEntries = [], 
  onActivityComplete, 
  isLoading 
}: TreatmentModuleProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'exercise':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'lesson':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'journal':
        return <PenTool className="h-5 w-5 text-purple-500" />;
      case 'meditation':
        return <Circle className="h-5 w-5 text-green-500" />;
      case 'reading':
        return <BookOpen className="h-5 w-5 text-orange-500" />;
      default:
        return <Play className="h-5 w-5 text-gray-500" />;
    }
  };

  const isActivityCompleted = (activityName: string) => {
    return progressEntries.some(entry => 
      entry.activityName === activityName && entry.completed
    );
  };

  const toggleActivityExpansion = (index: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedActivities(newExpanded);
  };

  const completedActivities = module.content.activities.filter(activity => 
    isActivityCompleted(activity.name)
  ).length;
  
  const totalActivities = module.content.activities.length;
  const completionPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  return (
    <Card className="overflow-hidden" data-testid={`treatment-module-${module.id}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-xl" data-testid="module-title">
                    {module.title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1" data-testid="module-description">
                    {module.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  Week {module.week}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {completedActivities}/{totalActivities} activities
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Module Progress</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Learning Objectives */}
            {module.content.learningObjectives && module.content.learningObjectives.length > 0 && (
              <div data-testid="learning-objectives">
                <h4 className="font-semibold mb-3">Learning Objectives</h4>
                <div className="space-y-2">
                  {module.content.learningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            <div data-testid="module-activities">
              <h4 className="font-semibold mb-4">Activities</h4>
              <div className="space-y-4">
                {module.content.activities.map((activity, index) => {
                  const isCompleted = isActivityCompleted(activity.name);
                  const isExpanded = expandedActivities.has(index);
                  
                  return (
                    <Card key={index} className={`border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-border'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {isCompleted ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            )}
                            {getActivityIcon(activity.type)}
                            <div>
                              <h5 className="font-medium" data-testid={`activity-name-${index}`}>
                                {activity.name}
                              </h5>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="capitalize">
                                  {activity.type}
                                </Badge>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{activity.duration} min</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!isCompleted && (
                              <Button
                                size="sm"
                                onClick={() => onActivityComplete(activity.name, activity.type, module.id)}
                                disabled={isLoading}
                                data-testid={`button-complete-${index}`}
                              >
                                {isLoading ? "Saving..." : "Mark Complete"}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActivityExpansion(index)}
                              data-testid={`button-expand-${index}`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {activity.description}
                        </p>

                        {isExpanded && (
                          <div className="p-4 bg-muted/30 rounded-lg" data-testid={`activity-instructions-${index}`}>
                            <h6 className="font-medium mb-2">Instructions:</h6>
                            <p className="text-sm leading-relaxed whitespace-pre-line">
                              {activity.instructions}
                            </p>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2 text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Activity Completed</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Module Summary */}
            {completedActivities === totalActivities && totalActivities > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="module-completed">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <h4 className="font-semibold text-green-800">Module Completed!</h4>
                    <p className="text-sm text-green-700">
                      Great job completing all activities in this module. You're making excellent progress on your mental health journey.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
