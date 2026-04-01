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
    const baseStyles = "rounded-xl border border-border/40 bg-card dark:bg-card/90 text-card-foreground shadow-sm transition-all duration-200";

    const variants = {
        default: "hover:shadow-md hover:translate-y-[-2px] hover:border-border/80",
        dark: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 border-transparent",
        frosted: "bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm border-white/20 dark:border-white/5 shadow-sm", // Kept for specific use cases but reduced blur
        highlight: "bg-secondary/50 border-secondary",
        interactive: "bg-card hover:bg-gradient-to-br hover:from-card hover:to-primary/5 dark:hover:to-primary/10 hover:shadow-lg hover:border-primary/30 cursor-pointer transform hover:-translate-y-1",
        featured: "bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/30 dark:to-slate-950 border-indigo-200/60 dark:border-indigo-800/40 shadow-md hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.02] cursor-pointer",
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
