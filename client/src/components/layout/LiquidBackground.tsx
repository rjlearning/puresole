import React from "react";

export function LiquidBackground() {
    return (
        <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
            {/* Subtle Static Gradient - Warm/Professional */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-secondary/40 to-transparent pointer-events-none" />

            {/* Right Side Accent - Very subtle */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 blur-[120px] rounded-full opacity-40 pointer-events-none" />

            {/* Bottom Left Accent - Grounding */}
            <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-secondary/30 blur-[100px] rounded-full opacity-30 pointer-events-none" />
        </div>
    );
}
