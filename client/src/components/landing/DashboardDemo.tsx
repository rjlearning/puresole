
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";
import { MessageCircle, CheckCircle, TrendingUp, Sparkles } from "lucide-react";

export function DashboardDemo() {
    const [messages, setMessages] = useState<number>(0);
    const [chartData, setChartData] = useState<{ value: number }[]>([]);

    // Simulation sequence
    useEffect(() => {
        const timer = setInterval(() => {
            setMessages((prev) => (prev < 3 ? prev + 1 : 0));
        }, 4000);

        // Animate chart data continuously
        const chartInterval = setInterval(() => {
            setChartData(Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 40) + 30 })));
        }, 2000);
        setChartData(Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 40) + 30 })));

        return () => {
            clearInterval(timer);
            clearInterval(chartInterval);
        };
    }, []);

    const data = [
        { name: 'Mon', value: 40 },
        { name: 'Tue', value: 30 },
        { name: 'Wed', value: 60 },
        { name: 'Thu', value: 45 },
        { name: 'Fri', value: 70 },
        { name: 'Sat', value: 85 },
        { name: 'Sun', value: 65 },
    ];

    return (
        <div className="absolute inset-0 bg-slate-50/50 p-6 md:p-8 flex items-center justify-center overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full max-w-5xl">

                {/* Column 1: AI Chat Simulation */}
                <div className="flex flex-col gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1 flex flex-col relative overflow-hidden"
                    >
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm">AI Companion</span>
                        </div>

                        <div className="space-y-3 flex-1">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-slate-50 rounded-2xl rounded-tl-none p-3 text-sm text-slate-600 max-w-[90%]"
                            >
                                Hi there! How are you feeling today?
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: messages >= 1 ? 1 : 0, x: messages >= 1 ? 0 : 10 }}
                                className="bg-orange-500 text-white rounded-2xl rounded-tr-none p-3 text-sm self-end ml-auto max-w-[90%]"
                            >
                                Detailed analytics helps my anxiety.
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: messages >= 2 ? 1 : 0, x: messages >= 2 ? 0 : -10 }}
                                className="bg-slate-50 rounded-2xl rounded-tl-none p-3 text-sm text-slate-600 max-w-[90%]"
                            >
                                That's great! Let's check your weekly progress chart.
                            </motion.div>

                            {messages >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center gap-3"
                                >
                                    <CheckCircle className="w-5 h-5 text-orange-500" />
                                    <span className="text-xs font-medium text-orange-700">Check-in Complete</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Input mock */}
                        <div className="mt-auto pt-4 flex gap-2">
                            <div className="h-8 bg-slate-50 rounded-full flex-1" />
                            <div className="h-8 w-8 bg-orange-100 rounded-full" />
                        </div>
                    </motion.div>
                </div>

                {/* Column 2: Live Activity Chart */}
                <div className="flex flex-col gap-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 h-full flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-slate-700">Emotional Balance</span>
                            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                        </div>

                        <div className="flex-1 flex items-end gap-2 h-32 mb-4">
                            {[40, 65, 30, 85, 50, 90, 60].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                                    className={`flex-1 rounded-t-md ${i === 5 ? 'bg-orange-400' : 'bg-slate-100'}`}
                                />
                            ))}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                            <div className="text-xs text-slate-500">Weekly Goal</div>
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-orange-400" />)}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Column 3: Stats & Insights */}
                <div className="flex flex-col gap-4">
                    {/* Stat Card 1 */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-medium">Stress Level</div>
                                <div className="font-bold text-slate-700">Decreasing</div>
                            </div>
                        </div>
                        <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 1.5, delay: 0.8 }}
                                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* Stat Card 2 */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1"
                    >
                        <div className="text-sm font-bold text-slate-700 mb-4">Recent Insights</div>
                        <div className="space-y-3">
                            {[1, 2].map((_, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-400" />
                                    <div className="space-y-1">
                                        <div className="h-2 w-24 bg-slate-100 rounded-full" />
                                        <div className="h-2 w-16 bg-slate-50 rounded-full" />
                                    </div>
                                </div>
                            ))}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100 mt-2"
                            >
                                <div className="flex gap-2 items-center">
                                    <Sparkles className="w-3 h-3 text-orange-500" />
                                    <span className="text-xs font-medium text-orange-600">Analyzing...</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
