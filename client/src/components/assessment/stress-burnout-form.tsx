import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Brain, AlertTriangle } from "lucide-react";

const stressBurnoutSchema = z.object({
  q1: z.string().min(1, "Please select an answer"),
  q2: z.string().min(1, "Please select an answer"),
  q3: z.string().min(1, "Please select an answer"),
  q4: z.string().min(1, "Please select an answer"),
  q5: z.string().min(1, "Please select an answer"),
  q6: z.string().min(1, "Please select an answer"),
  q7: z.string().min(1, "Please select an answer"),
  q8: z.string().min(1, "Please select an answer"),
  q9: z.string().min(1, "Please select an answer"),
  q10: z.string().min(1, "Please select an answer"),
});

type StressBurnoutFormData = z.infer<typeof stressBurnoutSchema>;

interface StressBurnoutFormProps {
  onComplete: (result: any) => void;
}

const questions = [
  "I feel emotionally exhausted by my daily activities",
  "I have trouble sleeping due to stress or worry",
  "I feel overwhelmed by my responsibilities", 
  "I have difficulty concentrating or making decisions",
  "I feel irritable or short-tempered with others",
  "I experience physical symptoms of stress (headaches, muscle tension, etc.)",
  "I feel like I can't keep up with demands placed on me",
  "I have lost interest or motivation in activities I used to enjoy",
  "I feel like I'm constantly under pressure",
  "I feel disconnected or detached from my work/daily activities"
];

const options = [
  { value: "0", label: "Never" },
  { value: "1", label: "Rarely" },
  { value: "2", label: "Sometimes" },
  { value: "3", label: "Often" },
  { value: "4", label: "Always" }
];

export default function StressBurnoutForm({ onComplete }: StressBurnoutFormProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showHighStressWarning, setShowHighStressWarning] = useState(false);

  const form = useForm<StressBurnoutFormData>({
    resolver: zodResolver(stressBurnoutSchema),
    defaultValues: {
      q1: "",
      q2: "",
      q3: "",
      q4: "",
      q5: "",
      q6: "",
      q7: "",
      q8: "",
      q9: "",
      q10: ""
    }
  });

  const assessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/assessments", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Assessment Complete",
        description: "Your Stress & Burnout assessment has been analyzed successfully.",
      });
      onComplete(result);
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
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    const currentFieldName = `q${currentQuestion + 1}` as keyof StressBurnoutFormData;
    const currentValue = form.getValues(currentFieldName);

    if (currentValue === "" || currentValue === undefined || currentValue === null) {
      form.trigger(currentFieldName);
      return;
    }

    // Check for high stress indicators (any question answered with 3-4)
    if (parseInt(currentValue) >= 3 && !showHighStressWarning) {
      setShowHighStressWarning(true);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = (data: StressBurnoutFormData): { score: number; severity: string } => {
    const score = Object.values(data).reduce((sum, value) => sum + parseInt(value), 0);
    
    let severity: string;
    if (score <= 10) severity = 'low';
    else if (score <= 20) severity = 'moderate';
    else if (score <= 30) severity = 'high';
    else severity = 'severe';

    return { score, severity };
  };

  const onSubmit = async (data: StressBurnoutFormData) => {
    const { score, severity } = calculateScore(data);
    
    const assessmentData = {
      type: 'stress_burnout',
      responses: data,
      score,
      severity
    };

    assessmentMutation.mutate(assessmentData);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentFieldName = `q${currentQuestion + 1}` as keyof StressBurnoutFormData;

  return (
    <div className="max-w-2xl mx-auto" data-testid="stress-burnout-form">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle>Stress & Burnout Scale</CardTitle>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        
        <CardContent>
          {showHighStressWarning && (
            <Card className="border-orange-200 bg-orange-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-2">High Stress Detected</h4>
                    <p className="text-sm text-orange-700 mb-4">
                      Your responses indicate significant stress levels. Consider these resources:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div><strong>Employee Assistance:</strong> Contact your workplace EAP if available</div>
                      <div><strong>Stress Management:</strong> Consider mindfulness, exercise, or relaxation techniques</div>
                      <div><strong>Professional Help:</strong> A counselor or therapist can provide coping strategies</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name={currentFieldName}
                key={currentFieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium">
                      Over the past month, how often have you experienced:
                    </FormLabel>
                    <div className="p-4 bg-muted/30 rounded-lg mb-4">
                      <p className="font-medium">{questions[currentQuestion]}</p>
                    </div>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        className="space-y-3"
                        data-testid="radio-group-stress-burnout"
                      >
                        {options.map((option) => (
                          <div 
                            key={option.value} 
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <RadioGroupItem 
                              value={option.value} 
                              id={`${currentFieldName}-${option.value}`}
                              data-testid={`radio-option-${option.value}`}
                            />
                            <label 
                              htmlFor={`${currentFieldName}-${option.value}`}
                              className="flex-1 cursor-pointer font-medium"
                            >
                              {option.label}
                            </label>
                            <div className="text-sm text-muted-foreground">
                              {option.value} points
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  data-testid="button-previous"
                >
                  Previous
                </Button>

                {currentQuestion === questions.length - 1 ? (
                  <Button
                    type="submit"
                    disabled={assessmentMutation.isPending || form.getValues(currentFieldName) === "" || form.getValues(currentFieldName) === undefined}
                    data-testid="button-submit"
                  >
                    {assessmentMutation.isPending ? "Analyzing..." : "Complete Assessment"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={form.getValues(currentFieldName) === "" || form.getValues(currentFieldName) === undefined}
                    data-testid="button-next"
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="mt-6 border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Brain className="h-6 w-6 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-800 mb-2">About Stress & Burnout Assessment</h4>
              <p className="text-sm text-purple-700 leading-relaxed">
                This assessment evaluates stress levels, burnout symptoms, and coping mechanisms. 
                It helps identify areas where stress management techniques or professional support may be beneficial. 
                This comprehensive evaluation takes about 8-12 minutes to complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="mt-4 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs font-bold text-white">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                This assessment is a screening tool and not a diagnostic instrument. 
                Results should be discussed with a qualified healthcare professional. 
                If you're experiencing severe stress, burnout, or mental health concerns, please seek professional help.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}