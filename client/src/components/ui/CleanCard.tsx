import React from "react";
import { cn } from "@/lib/utils";

interface CleanCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "dark" | "frosted" | "highlight" | "interactive" | "featured";
}

export function CleanCard({
    children,
    className,
    variant = "default",
    ...props
}: CleanCardProps) {
    const baseStyles = "rounded-xl border border-border/40 bg-card text-card-foreground shadow-sm transition-all duration-200";

    const variants = {
        default: "hover:shadow-md hover:translate-y-[-2px] hover:border-border/80",
        dark: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 border-transparent",
        frosted: "bg-white/90 backdrop-blur-sm border-white/20 shadow-sm", // Kept for specific use cases but reduced blur
        highlight: "bg-secondary/50 border-secondary",
        interactive: "bg-card hover:bg-gradient-to-br hover:from-card hover:to-primary/5 hover:shadow-lg hover:border-primary/30 cursor-pointer transform hover:-translate-y-1",
        featured: "bg-gradient-to-br from-indigo-50/80 to-white border-indigo-200/60 shadow-md hover:shadow-xl hover:border-indigo-300 hover:scale-[1.02] cursor-pointer",
    };

    return (
        <div
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        >
            {children}
        </div>
    );
}
