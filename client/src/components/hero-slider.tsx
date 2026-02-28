import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Slide {
  title: string;
  highlight?: string;
  description: string;
  buttonText: string;
  buttonAction: () => void;
  backgroundType: "gradient" | "image";
  backgroundImage?: string;
  titleColor?: string;
}

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: "Discover Your Inner World",
      highlight: "With AI",
      description: "AI-powered self-reflection and personalized growth journeys.",
      buttonText: "Start Your Journey",
      buttonAction: () => window.location.href = "/auth",
      backgroundType: "gradient",
    },
    {
      title: "Know Yourself Better",
      description: "Explore your thoughts, emotions, and personality with AI insights.",
      buttonText: "Learn More",
      buttonAction: () => document.getElementById("section-how-it-works")?.scrollIntoView({ behavior: "smooth" }),
      backgroundType: "gradient",
      titleColor: "from-primary to-accent",
    },
    {
      title: "Personal Growth Made Simple",
      description: "AI-powered conversations designed for self-discovery.",
      buttonText: "Explore Features",
      buttonAction: () => document.getElementById("section-assessments")?.scrollIntoView({ behavior: "smooth" }),
      backgroundType: "gradient",
      titleColor: "from-secondary to-accent",
    },
    {
      title: "Unlock Your Potential",
      description: "Build self-awareness and grow at your own pace.",
      buttonText: "Get Started Free",
      buttonAction: () => window.location.href = "/auth",
      backgroundType: "gradient",
      titleColor: "from-accent to-primary",
    }
  ];

  const slideCount = slides.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);

    return () => clearInterval(interval);
  }, [slideCount]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      {/* Logo Hologram Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src=""
          alt=""
          className="w-64 h-64 lg:w-80 lg:h-80 object-contain opacity-[0.08] blur-[1px]"
          aria-hidden="true"
        />
      </div>

      <div className="container mx-auto px-4 py-10 lg:py-12 relative z-10">
        <div className="relative min-h-[300px] lg:min-h-[320px] flex items-center justify-center">
          {/* Slides Container */}
          <div className="w-full max-w-2xl mx-auto">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ease-in-out ${
                  index === currentSlide
                    ? "opacity-100 translate-x-0 relative z-10 pointer-events-auto"
                    : index < currentSlide
                    ? "opacity-0 -translate-x-full absolute inset-0 z-0 pointer-events-none"
                    : "opacity-0 translate-x-full absolute inset-0 z-0 pointer-events-none"
                }`}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4 px-4">
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-tight max-w-xl">
                    {slide.highlight ? (
                      <>
                        {slide.title}
                        <span className={`block ${slide.titleColor || "bg-gradient-to-r from-primary to-accent"} bg-clip-text text-transparent`}>
                          {slide.highlight}
                        </span>
                      </>
                    ) : (
                      <span className={slide.titleColor ? `bg-gradient-to-r ${slide.titleColor} bg-clip-text text-transparent` : ""}>
                        {slide.title}
                      </span>
                    )}
                  </h1>
                  
                  <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg">
                    {slide.description}
                  </p>

                  <div className="flex justify-center pt-2">
                    <Button
                      size="lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        slide.buttonAction();
                      }}
                      className="bg-gradient-to-r from-primary to-accent text-white px-7 py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                      data-testid={`button-slide-${index}`}
                    >
                      {slide.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`dot-${index}`}
            />
          ))}
        </div>
      </div>

      {/* Floating Animation CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
