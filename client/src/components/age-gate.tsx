import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AgeGateProps {
  onConfirm: () => void;
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  const [showWarning, setShowWarning] = useState(false);

  const handleConfirm = () => {
    localStorage.setItem("age_verified", "true");
    onConfirm();
  };

  const handleDecline = () => {
    setShowWarning(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-amber-500/10 p-4 rounded-full">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Age Verification Required</CardTitle>
          <CardDescription className="text-base">
            You must be 18 years or older to access this website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">Important Disclaimer:</p>
            <p>
              This website provides AI-powered self-awareness and personal growth content for educational and entertainment purposes only.
            </p>
            <p className="font-semibold text-destructive">
              This is NOT medical advice, therapy, or mental health treatment.
            </p>
            <p>
              If you are experiencing a mental health crisis, please contact a licensed healthcare provider or call emergency services.
            </p>
          </div>

          {showWarning && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <p className="text-sm text-destructive font-semibold">
                You must be 18+ to access this website. Please exit if you are under 18.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleConfirm} 
              className="w-full h-12 text-base"
              data-testid="button-age-confirm"
            >
              I am 18 or older - Enter
            </Button>
            <Button 
              onClick={handleDecline} 
              variant="outline" 
              className="w-full h-12 text-base"
              data-testid="button-age-decline"
            >
              I am under 18 - Exit
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By clicking "I am 18 or older", you confirm that you meet the age requirement and agree to use this service for personal growth and self-awareness purposes only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function useAgeVerification() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const verified = localStorage.getItem("age_verified") === "true";
    setIsVerified(verified);
  }, []);

  return {
    isVerified,
    setVerified: () => {
      localStorage.setItem("age_verified", "true");
      setIsVerified(true);
    }
  };
}
