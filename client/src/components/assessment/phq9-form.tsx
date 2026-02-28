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

const phq9Schema = z.object({
  q1: z.string().min(1, "Please select an answer"),
  q2: z.string().min(1, "Please select an answer"),
  q3: z.string().min(1, "Please select an answer"),
  q4: z.string().min(1, "Please select an answer"),
  q5: z.string().min(1, "Please select an answer"),
  q6: z.string().min(1, "Please select an answer"),
  q7: z.string().min(1, "Please select an answer"),
  q8: z.string().min(1, "Please select an answer"),
  q9: z.string().min(1, "Please select an answer"),
});

type PHQ9FormData = z.infer<typeof phq9Schema>;

interface PHQ9FormProps {
  onComplete: (result: any) => void;
}

const questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

const options = [
  { value: "0", label: "Not at all" },
  { value: "1", label: "Several days" },
  { value: "2", label: "More than half the days" },
  { value: "3", label: "Nearly every day" }
];

export default function PHQ9Form({ onComplete }: PHQ9FormProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showCrisisWarning, setShowCrisisWarning] = useState(false);

  const form = useForm<PHQ9FormData>({
    resolver: zodResolver(phq9Schema),
    defaultValues: {
      q1: "",
      q2: "",
      q3: "",
      q4: "",
      q5: "",
      q6: "",
      q7: "",
      q8: "",
      q9: ""
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
        description: "Your PHQ-9 assessment has been analyzed successfully.",
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
    const currentFieldName = `q${currentQuestion + 1}` as keyof PHQ9FormData;
    const currentValue = form.getValues(currentFieldName);

    if (currentValue === "" || currentValue === undefined || currentValue === null) {
      form.trigger(currentFieldName);
      return;
    }

    // Check for suicidal ideation (question 9)
    if (currentQuestion === 8 && parseInt(currentValue) > 0) {
      setShowCrisisWarning(true);
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

  const calculateScore = (data: PHQ9FormData): { score: number; severity: string } => {
    const score = Object.values(data).reduce((sum, value) => sum + parseInt(value), 0);
    
    let severity: string;
    if (score <= 4) severity = 'minimal';
    else if (score <= 9) severity = 'mild';
    else if (score <= 14) severity = 'moderate';
    else if (score <= 19) severity = 'moderately_severe';
    else severity = 'severe';

    return { score, severity };
  };

  const onSubmit = async (data: PHQ9FormData) => {
    const { score, severity } = calculateScore(data);
    
    const assessmentData = {
      type: 'phq9',
      responses: data,
      score,
      severity
    };

    assessmentMutation.mutate(assessmentData);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentFieldName = `q${currentQuestion + 1}` as keyof PHQ9FormData;

  return (
    <div className="max-w-2xl mx-auto" data-testid="phq9-form">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>PHQ-9 Depression Assessment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        
        <CardContent>
          {showCrisisWarning && (
            <Card className="border-destructive bg-destructive/5 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive mb-2">Crisis Support Available</h4>
                    <p className="text-sm text-destructive/80 mb-4">
                      If you're having thoughts of self-harm, please reach out for immediate help:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div><strong>National Suicide Prevention Lifeline:</strong> 988</div>
                      <div><strong>Crisis Text Line:</strong> Text HOME to 741741</div>
                      <div><strong>Emergency Services:</strong> 911</div>
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
                      Over the last 2 weeks, how often have you been bothered by:
                    </FormLabel>
                    <div className="p-4 bg-muted/30 rounded-lg mb-4">
                      <p className="font-medium">{questions[currentQuestion]}</p>
                    </div>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        className="space-y-3"
                        data-testid="radio-group-phq9"
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

      {/* Important Notice */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
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
                This tool does not replace professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
