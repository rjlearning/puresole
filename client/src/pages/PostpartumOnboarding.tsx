import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    HeartPulse,
    Baby,
    Activity,
    Sparkles,
    ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
    { id: 'welcome', title: 'Welcome', icon: Sparkles },
    { id: 'context', title: 'Context', icon: ClipboardList },
    { id: 'biomarkers', title: 'Biomarkers', icon: HeartPulse },
    { id: 'wearables', title: 'Integrations', icon: Activity },
    { id: 'complete', title: 'Ready', icon: CheckCircle2 },
];

export default function PostpartumOnboarding() {
    const [step, setStep] = useState(0);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        lifePhase: "menstruating",
        cycleLength: "28",
        primaryGoal: "energy",
        symptoms: [] as string[],
        biomarkers: {
            ferritin: "",
            vitaminD: "",
            tsh: "",
            glucose: ""
        }
    });

    const nextStep = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleComplete = async () => {
        try {
            const res = await fetch("/api/postpartum/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to save onboarding data");

            toast({
                title: "Success",
                description: "Setting up your personalized recovery engine...",
            });
            setLocation("/women/metabolic");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 p-6 flex items-center justify-center font-sans">
            <Card className="max-w-2xl w-full p-8 shadow-xl border-none bg-white/80 backdrop-blur-md">

                {/* Progress bar */}
                <div className="flex justify-between mb-12">
                    {STEPS.map((s, idx) => {
                        const Icon = s.icon;
                        const active = idx <= step;
                        return (
                            <div key={s.id} className="flex flex-col items-center gap-2 flex-1 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all ${active ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-rose-600' : 'text-slate-400'}`}>{s.title}</span>
                                {idx < STEPS.length - 1 && (
                                    <div className={`absolute left-1/2 top-5 w-full h-[2px] -z-0 ${idx < step ? 'bg-rose-500' : 'bg-slate-100'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="min-h-[400px]">
                    {step === 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight leading-tight">Welcome to Precision Health</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                                We're going to build a health protocol designed specifically for your unique biology.
                                By understanding your current life phase, biomarkers, and wearable data, we can personalize your nutrition
                                and lifestyle for optimal vitality.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                    <HeartPulse className="w-8 h-8 text-rose-500 mb-2" />
                                    <h3 className="font-bold text-slate-800 text-sm">Biomarker Led</h3>
                                    <p className="text-xs text-slate-500">We analyze your labs to find what your body needs most.</p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <Activity className="w-8 h-8 text-indigo-500 mb-2" />
                                    <h3 className="font-bold text-slate-800 text-sm">Adaptive AI</h3>
                                    <p className="text-xs text-slate-500">Your meal plans adjust weekly based on your sleep and HRV.</p>
                                </div>
                            </div>
                            <Button onClick={nextStep} className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl group">
                                Begin Onboarding
                                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Health Context</h2>

                            <div className="space-y-6">
                                <div>
                                    <Label className="text-slate-700 font-bold mb-4 block">Current Life Phase</Label>
                                    <RadioGroup value={formData.lifePhase} onValueChange={(val) => setFormData({ ...formData, lifePhase: val })} className="grid grid-cols-2 gap-4">
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.lifePhase === 'menstruating' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="menstruating" id="menstruating" className="sr-only" />
                                            <Label htmlFor="menstruating" className="cursor-pointer font-bold block">Menstruating</Label>
                                        </div>
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.lifePhase === 'perimenopause' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="perimenopause" id="perimenopause" className="sr-only" />
                                            <Label htmlFor="perimenopause" className="cursor-pointer font-bold block">Perimenopause</Label>
                                        </div>
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.lifePhase === 'menopause' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="menopause" id="menopause" className="sr-only" />
                                            <Label htmlFor="menopause" className="cursor-pointer font-bold block">Postmenopause</Label>
                                        </div>
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.lifePhase === 'postpartum' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="postpartum" id="postpartum" className="sr-only" />
                                            <Label htmlFor="postpartum" className="cursor-pointer font-bold block">Postpartum</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {formData.lifePhase === 'menstruating' && (
                                    <div className="animate-in fade-in duration-300">
                                        <Label className="text-slate-700 font-bold mb-2 block">Typical Cycle Length (Days)</Label>
                                        <Input
                                            type="number"
                                            className="h-12 rounded-xl border-slate-200"
                                            value={formData.cycleLength}
                                            onChange={(e) => setFormData({ ...formData, cycleLength: e.target.value })}
                                            placeholder="e.g. 28"
                                            min="21"
                                            max="45"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2">This helps us sync your nutrition to your hormonal fluctuations.</p>
                                    </div>
                                )}

                                <div>
                                    <Label className="text-slate-700 font-bold mb-4 block">Primary Health Goal</Label>
                                    <RadioGroup value={formData.primaryGoal} onValueChange={(val) => setFormData({ ...formData, primaryGoal: val })} className="grid grid-cols-2 gap-4">
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.primaryGoal === 'energy' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="energy" id="goal-energy" className="sr-only" />
                                            <Label htmlFor="goal-energy" className="cursor-pointer font-bold block text-sm">Boost Energy</Label>
                                        </div>
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.primaryGoal === 'hormones' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="hormones" id="goal-hormones" className="sr-only" />
                                            <Label htmlFor="goal-hormones" className="cursor-pointer font-bold block text-sm">Balance Hormones</Label>
                                        </div>
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.primaryGoal === 'metabolism' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="metabolism" id="goal-metabolism" className="sr-only" />
                                            <Label htmlFor="goal-metabolism" className="cursor-pointer font-bold block text-sm">Support Metabolism</Label>
                                        </div>
                                        <div className={`cursor-pointer border-2 p-4 rounded-2xl transition-all ${formData.primaryGoal === 'recovery' ? 'border-rose-500 bg-rose-50' : 'border-slate-100'}`}>
                                            <RadioGroupItem value="recovery" id="goal-recovery" className="sr-only" />
                                            <Label htmlFor="goal-recovery" className="cursor-pointer font-bold block text-sm">Postpartum Recovery</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-12">
                                <Button variant="ghost" onClick={prevStep} className="flex-1 h-12 rounded-2xl">Back</Button>
                                <Button onClick={nextStep} className="flex-[2] h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl">Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Biomarker Panel</h2>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                If you have recent lab results, enter them here. These numbers help us calibrate your
                                micronutrient and supplement protocol.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold text-xs uppercase">Ferritin (Iron)</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="e.g. 45"
                                            className="h-12 rounded-xl pr-12"
                                            value={formData.biomarkers.ferritin}
                                            onChange={(e) => setFormData({ ...formData, biomarkers: { ...formData.biomarkers, ferritin: e.target.value } })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">ng/mL</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold text-xs uppercase">Vitamin D</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="e.g. 32"
                                            className="h-12 rounded-xl pr-12"
                                            value={formData.biomarkers.vitaminD}
                                            onChange={(e) => setFormData({ ...formData, biomarkers: { ...formData.biomarkers, vitaminD: e.target.value } })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">ng/mL</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold text-xs uppercase">TSH (Thyroid)</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="e.g. 2.1"
                                            className="h-12 rounded-xl pr-12"
                                            value={formData.biomarkers.tsh}
                                            onChange={(e) => setFormData({ ...formData, biomarkers: { ...formData.biomarkers, tsh: e.target.value } })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">mIU/L</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold text-xs uppercase">Glucose</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="e.g. 85"
                                            className="h-12 rounded-xl pr-12"
                                            value={formData.biomarkers.glucose}
                                            onChange={(e) => setFormData({ ...formData, biomarkers: { ...formData.biomarkers, glucose: e.target.value } })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">mg/dL</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <ClipboardList className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <p className="text-xs text-amber-800/80 leading-relaxed font-semibold">
                                    Missing your labs? You can skip this for now and add them later.
                                    Our clinical partners (Quest/LabCorp) can also be synced automatically.
                                </p>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <Button variant="ghost" onClick={prevStep} className="flex-1 h-12 rounded-2xl">Back</Button>
                                <Button onClick={nextStep} className="flex-[2] h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl">Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Wearables (Optional)</h2>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                Personalized nutrition works best with real-time feedback. Your HRV and Sleep data allow our
                                AI to adjust your macros daily, but you can always skip this and use manual baselines.
                            </p>

                            <div className="space-y-3 mb-8">
                                {[
                                    { name: 'Apple Health', icon: '🍎' },
                                    { name: 'Whoop', icon: '🔋' },
                                    { name: 'Oura', icon: '💍' }
                                ].map(w => (
                                    <div key={w.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{w.icon}</span>
                                            <span className="font-bold text-slate-700">{w.name}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-rose-500 font-bold">Connect</Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={prevStep} className="flex-1 h-12 rounded-2xl">Back</Button>
                                    <Button onClick={nextStep} className="flex-[2] h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl">Connect & Continue</Button>
                                </div>
                                <Button variant="ghost" onClick={nextStep} className="w-full text-slate-400 text-xs font-bold hover:text-rose-500 transition-colors">
                                    I don't have a wearable / Skip for now
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-in fade-in zoom-in duration-700 text-center">
                            <div className="w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-200">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif">You're All Set!</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed max-w-sm mx-auto">
                                Your biomarker data and health context have been ingested.
                                Our AI engine is now generating your first Weekly Precision Protocol.
                            </p>

                            <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100 text-left">
                                <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Next 24 Hours:</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-sm text-slate-600">
                                        <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                                        <span>Initial Adaptive Meal Plan generated</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600">
                                        <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                                        <span>Supplement protocol recommendation ready</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600">
                                        <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                                        <span>First biometric baseline analysis</span>
                                    </li>
                                </ul>
                            </div>

                            <Button onClick={handleComplete} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]">
                                Go to Health Dashboard
                            </Button>
                        </div>
                    )}
                </div>

            </Card>
        </div>
    );
}
