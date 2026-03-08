import { motion } from "framer-motion";

interface MeshBackgroundProps {
    variant?: "indigo" | "rose" | "emerald" | "unified";
}

export default function MeshBackground({ variant = "unified" }: MeshBackgroundProps) {
    const colors = {
        indigo: ["#4f46e5", "#818cf8", "#312e81"],
        rose: ["#f43f5e", "#fb7185", "#881337"],
        emerald: ["#10b981", "#34d399", "#064e3b"],
        unified: ["#4f46e5", "#f43f5e", "#10b981"]
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
                style={{ backgroundColor: selectedColors[0] }}
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
                style={{ backgroundColor: selectedColors[1] }}
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
                style={{ backgroundColor: selectedColors[2] }}
            />
        </div>
    );
}
