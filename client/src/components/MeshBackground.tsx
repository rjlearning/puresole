import { motion } from "framer-motion";

interface MeshBackgroundProps {
    variant?: "indigo" | "rose" | "emerald" | "unified";
}

export default function MeshBackground({ variant = "unified" }: MeshBackgroundProps) {
    const colors = {
        indigo: ["#312e81", "#4338ca", "#1e1b4b"], // Deeper Indigo tones
        rose: ["#9f1239", "#be123c", "#4c0519"],   // Deeper Rose/Crimson
        emerald: ["#064e3b", "#065f46", "#022c22"], // Deeper Emerald
        unified: ["#312e81", "#881337", "#064e3b"]  // Combined deep tones
    };

    const selectedColors = colors[variant];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-[0.15]"
                style={{
                    backgroundColor: selectedColors[0],
                    willChange: "transform",
                    WebkitBackfaceVisibility: "hidden"
                }}
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [0, -100, 0],
                    y: [0, -50, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-[0.12]"
                style={{
                    backgroundColor: selectedColors[1],
                    willChange: "transform",
                    WebkitBackfaceVisibility: "hidden"
                }}
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    x: [0, 50, 0],
                    y: [0, -50, 0],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-[0.08]"
                style={{
                    backgroundColor: selectedColors[2],
                    willChange: "transform",
                    WebkitBackfaceVisibility: "hidden"
                }}
            />
        </div>
    );
}
