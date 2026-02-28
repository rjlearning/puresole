import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Brain, TrendingUp, Target, AlertTriangle, CheckCircle, Plus, FileText } from "lucide-react";

interface AssessmentResultsProps {
  assessment: any;
  onStartNew: () => void;
}

export default function AssessmentResults({ assessment, onStartNew }: AssessmentResultsProps) {
  const { toast } = useToast();
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const generatePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/treatment-plans", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Treatment Plan Created",
        description: "Your personalized treatment plan has been generated successfully.",
      });
      // Redirect to the new treatment plan
      window.location.href = `/treatment-plan/${result.id}`;
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate treatment plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
      case 'moderately_severe':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      case 'mild':
        return 'default';
      case 'minimal':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getSeverityDescription = (type: string, severity: string, score: number) => {
    const typeUpper = type.toUpperCase();
    
    if (type === 'phq9') {
      switch (severity) {
        case 'minimal':
          return 'Your responses suggest minimal depression symptoms. This is within the normal range.';
        case 'mild':
          return 'Your responses suggest mild depression symptoms. Consider monitoring your mood and implementing self-care strategies.';
        case 'moderate':
          return 'Your responses suggest moderate depression symptoms. Consider speaking with a healthcare professional about treatment options.';
        case 'moderately_severe':
          return 'Your responses suggest moderately severe depression symptoms. Professional treatment is recommended.';
        case 'severe':
          return 'Your responses suggest severe depression symptoms. Please seek professional help immediately.';
        default:
          return 'Assessment completed successfully.';
      }
    } else if (type === 'gad7') {
      switch (severity) {
        case 'minimal':
          return 'Your responses suggest minimal anxiety symptoms. This is within the normal range.';
        case 'mild':
          return 'Your responses suggest mild anxiety symptoms. Consider stress management techniques and relaxation strategies.';
        case 'moderate':
          return 'Your responses suggest moderate anxiety symptoms. Consider speaking with a healthcare professional about anxiety management.';
        case 'severe':
          return 'Your responses suggest severe anxiety symptoms. Professional treatment is recommended to help manage your anxiety.';
        default:
          return 'Assessment completed successfully.';
      }
    }
    
    return 'Assessment completed successfully.';
  };

  const handleGeneratePlan = () => {
    setIsGeneratingPlan(true);
    generatePlanMutation.mutate({
      assessmentId: assessment.id,
      userGoals: [] // Could be expanded to include user-specified goals
    });
  };

  const maxScore = assessment.type === 'phq9' ? 27 : assessment.type === 'gad7' ? 21 : 30;
  const scorePercentage = (assessment.score / maxScore) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="assessment-results">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary to-accent text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-results-title">
                  Assessment Complete
                </h1>
                <p className="text-white/90 capitalize" data-testid="text-assessment-type">
                  {assessment.type.replace('_', ' ')} Results
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Score</div>
              <div className="text-4xl font-bold" data-testid="text-assessment-score">
                {assessment.score}/{maxScore}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Assessment Score</span>
              <span>{Math.round(scorePercentage)}%</span>
            </div>
            <Progress value={scorePercentage} className="bg-white/20" />
          </div>

          <div className="flex items-center justify-between">
            <Badge 
              className={`capitalize text-lg px-4 py-2 ${
                assessment.severity === 'severe' || assessment.severity === 'moderately_severe'
                  ? 'bg-red-500 text-white'
                  : assessment.severity === 'moderate'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
              data-testid="badge-severity"
            >
              {assessment.severity.replace('_', ' ')} Severity
            </Badge>
            <div className="text-sm opacity-90">
              Completed {new Date(assessment.createdAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Warning */}
      {(assessment.severity === 'severe' || assessment.severity === 'moderately_severe') && (
        <Card className="border-destructive bg-destructive/5" data-testid="card-crisis-warning">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-2">Immediate Support Available</h4>
                <p className="text-sm text-destructive/80 mb-4">
                  Your assessment indicates significant symptoms that may benefit from professional support. 
                  If you're in crisis or having thoughts of self-harm, please reach out immediately:
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-white rounded border">
                    <div className="font-semibold">Crisis Hotline</div>
                    <div className="font-mono">988</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="font-semibold">Crisis Text Line</div>
                    <div className="font-mono">Text HOME to 741741</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="font-semibold">Emergency</div>
                    <div className="font-mono">911</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Results Summary */}
        <Card data-testid="card-results-summary">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Results Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Assessment Overview</h4>
              <p className="text-muted-foreground text-sm">
                {getSeverityDescription(assessment.type, assessment.severity, assessment.score)}
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Score Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Your Score</span>
                  <Badge variant="outline">{assessment.score} points</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Severity Level</span>
                  <Badge variant={getSeverityColor(assessment.severity)} className="capitalize">
                    {assessment.severity.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Assessment Type</span>
                  <Badge variant="secondary" className="uppercase">
                    {assessment.type}
                  </Badge>
                </div>
              </div>
            </div>

            {assessment.aiAnalysis && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {assessment.aiAnalysis}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card data-testid="card-recommendations">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {assessment.recommendations && assessment.recommendations.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-3">Personalized Recommendations</h4>
                <div className="space-y-3">
                  {assessment.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold mb-3">General Recommendations</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <p className="text-sm">Consider speaking with a mental health professional for personalized guidance</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <p className="text-sm">Practice regular self-care activities like exercise, meditation, or hobbies</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <p className="text-sm">Maintain a consistent sleep schedule and healthy eating habits</p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Next Steps</h4>
              <div className="space-y-3">
                <Button
                  onClick={handleGeneratePlan}
                  disabled={generatePlanMutation.isPending}
                  className="w-full"
                  data-testid="button-generate-plan"
                >
                  {generatePlanMutation.isPending ? (
                    "Generating Treatment Plan..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Personalized Treatment Plan
                    </>
                  )}
                </Button>
                
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full" data-testid="button-view-dashboard">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Progress Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factors */}
      {assessment.riskFactors && assessment.riskFactors.length > 0 && (
        <Card data-testid="card-risk-factors">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Identified Risk Factors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {assessment.riskFactors.map((factor: string, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card data-testid="card-action-buttons">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onStartNew}
              variant="outline"
              className="flex-1"
              data-testid="button-new-assessment"
            >
              <Plus className="h-4 w-4 mr-2" />
              Take Another Assessment
            </Button>
            
            <Link href="/dashboard">
              <Button variant="outline" className="flex-1" data-testid="button-dashboard">
                <FileText className="h-4 w-4 mr-2" />
                View All Results
              </Button>
            </Link>
            
            <Link href="/">
              <Button className="flex-1" data-testid="button-home">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50" data-testid="card-disclaimer">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs font-bold text-white">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Important Disclaimer</h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                This assessment is a screening tool and not a diagnostic instrument. Results should be interpreted 
                by a qualified mental health professional. This tool does not replace professional medical advice, 
                diagnosis, or treatment. If you are experiencing a mental health emergency, please contact emergency 
                services immediately or call the National Suicide Prevention Lifeline at 988.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
