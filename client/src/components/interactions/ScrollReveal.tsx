import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    threshold?: number;
    direction?: "up" | "left" | "right" | "none";
    delay?: number;
}

export function ScrollReveal({
    children,
    className,
    threshold = 0.1,
    direction = "up",
    delay = 0
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Once visible, we can stop observing if we only want it to trigger once
                    // observer.unobserve(entry.target); 
                }
            },
            {
                threshold: threshold,
                rootMargin: "0px 0px -50px 0px"
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    const transformStyles = {
        up: "translate-y-8",
        left: "-translate-x-8",
        right: "translate-x-8",
        none: ""
    };

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={cn(
                "transition-all duration-1000 ease-out will-change-transform",
                isVisible ? "opacity-100 transform-none" : `opacity-0 ${transformStyles[direction]}`,
                className
            )}
        >
            {children}
        </div>
    );
}
