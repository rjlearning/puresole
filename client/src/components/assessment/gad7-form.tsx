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

const gad7Schema = z.object({
  q1: z.string().min(1, "Please select an answer"),
  q2: z.string().min(1, "Please select an answer"),
  q3: z.string().min(1, "Please select an answer"),
  q4: z.string().min(1, "Please select an answer"),
  q5: z.string().min(1, "Please select an answer"),
  q6: z.string().min(1, "Please select an answer"),
  q7: z.string().min(1, "Please select an answer"),
});

type GAD7FormData = z.infer<typeof gad7Schema>;

interface GAD7FormProps {
  onComplete: (result: any) => void;
}

const questions = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const options = [
  { value: "0", label: "Not at all" },
  { value: "1", label: "Several days" },
  { value: "2", label: "More than half the days" },
  { value: "3", label: "Nearly every day" }
];

export default function GAD7Form({ onComplete }: GAD7FormProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const form = useForm<GAD7FormData>({
    resolver: zodResolver(gad7Schema),
    defaultValues: {
      q1: "",
      q2: "",
      q3: "",
      q4: "",
      q5: "",
      q6: "",
      q7: ""
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
        description: "Your GAD-7 assessment has been analyzed successfully.",
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
    const currentFieldName = `q${currentQuestion + 1}` as keyof GAD7FormData;
    const currentValue = form.getValues(currentFieldName);

    if (currentValue === "" || currentValue === undefined || currentValue === null) {
      form.trigger(currentFieldName);
      return;
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

  const calculateScore = (data: GAD7FormData): { score: number; severity: string } => {
    const score = Object.values(data).reduce((sum, value) => sum + parseInt(value), 0);
    
    let severity: string;
    if (score <= 4) severity = 'minimal';
    else if (score <= 9) severity = 'mild';
    else if (score <= 14) severity = 'moderate';
    else severity = 'severe';

    return { score, severity };
  };

  const onSubmit = async (data: GAD7FormData) => {
    const { score, severity } = calculateScore(data);
    
    const assessmentData = {
      type: 'gad7',
      responses: data,
      score,
      severity
    };

    assessmentMutation.mutate(assessmentData);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentFieldName = `q${currentQuestion + 1}` as keyof GAD7FormData;

  return (
    <div className="max-w-2xl mx-auto" data-testid="gad7-form">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <CardTitle>GAD-7 Anxiety Assessment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        
        <CardContent>
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
                        data-testid="radio-group-gad7"
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
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Brain className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">About GAD-7</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                The GAD-7 is a validated screening tool for generalized anxiety disorder. 
                It helps identify anxiety symptoms and their severity over the past two weeks. 
                This assessment takes about 3-5 minutes to complete.
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
                If you're experiencing severe anxiety or panic attacks, please seek immediate professional help.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
