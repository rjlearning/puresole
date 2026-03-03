import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Gender = "male" | "female" | "other" | null;
export type LifePhase = "flowering" | "blooming" | "blossoming" | "becoming" | null;

export interface PhaseInfo {
    id: LifePhase;
    name: string;
    nickname: string;
    emoji: string;
    color: string;        // tailwind bg
    accent: string;       // tailwind text
    ring: string;         // tailwind ring
    gradient: string;
    free: boolean;
    description: string;
}

export const PHASES: PhaseInfo[] = [
    {
        id: "flowering",
        name: "Flowering",
        nickname: "Puberty & Adolescence",
        emoji: "🌱",
        color: "bg-emerald-50",
        accent: "text-emerald-700",
        ring: "ring-emerald-300",
        gradient: "from-emerald-400 to-teal-400",
        free: true,
        description: "Body literacy, cycle tracking & mindfulness foundations.",
    },
    {
        id: "blooming",
        name: "Blooming",
        nickname: "Fertility & Cycle Optimization",
        emoji: "🌸",
        color: "bg-pink-50",
        accent: "text-pink-700",
        ring: "ring-pink-300",
        gradient: "from-pink-400 to-rose-400",
        free: false,
        description: "Fertility awareness, nutrition by cycle phase & conception support.",
    },
    {
        id: "blossoming",
        name: "Blossoming",
        nickname: "Postpartum & New Motherhood",
        emoji: "🌺",
        color: "bg-orange-50",
        accent: "text-orange-700",
        ring: "ring-orange-300",
        gradient: "from-orange-400 to-amber-400",
        free: false,
        description: "Recovery, emotional health, baby bonding & sleep.",
    },
    {
        id: "becoming",
        name: "Becoming",
        nickname: "Perimenopause & Menopause",
        emoji: "🌿",
        color: "bg-violet-50",
        accent: "text-violet-700",
        ring: "ring-violet-300",
        gradient: "from-violet-400 to-purple-400",
        free: false,
        description: "Hormonal balance, bone health, sleep & identity.",
    },
];

export function getPhaseInfo(id: LifePhase): PhaseInfo {
    return PHASES.find(p => p.id === id) ?? PHASES[0];
}

interface PhaseContextValue {
    gender: Gender;
    setGender: (g: Gender) => void;
    phase: LifePhase;
    phaseInfo: PhaseInfo;
    setPhase: (p: LifePhase) => void;
    hasChosen: boolean;
}

const PhaseContext = createContext<PhaseContextValue>({
    gender: null,
    setGender: () => { },
    phase: null,
    phaseInfo: PHASES[0],
    setPhase: () => { },
    hasChosen: false,
});

import { useAuth } from "@/hooks/useAuth";
import { useRef } from "react";

const STORAGE_KEY_PHASE = "puresoul_life_phase";
const STORAGE_KEY_GENDER = "puresoul_gender";

export function PhaseProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id || 'guest';

    const genderKey = `${STORAGE_KEY_GENDER}_${userId}`;
    const phaseKey = `${STORAGE_KEY_PHASE}_${userId}`;

    const [genderState, setGenderState] = useState<Gender>(() => {
        try { return (localStorage.getItem(genderKey) as Gender) ?? null; }
        catch { return null; }
    });

    const [phaseState, setPhaseState] = useState<LifePhase>(() => {
        try { return (localStorage.getItem(phaseKey) as LifePhase) ?? null; }
        catch { return null; }
    });

    // Sync state if user changes
    const prevUserIdRef = useRef(userId);
    if (prevUserIdRef.current !== userId) {
        prevUserIdRef.current = userId;
        try {
            setGenderState((localStorage.getItem(genderKey) as Gender) ?? null);
            setPhaseState((localStorage.getItem(phaseKey) as LifePhase) ?? null);
        } catch { }
    }

    // If male, they are "done" with onboarding (they skip the phase quiz).
    // If female/other, they are "done" only if they have picked a phase.
    const hasChosen = genderState === "male" || phaseState !== null;
    const phaseInfo = getPhaseInfo(phaseState);

    const setGender = (g: Gender) => {
        setGenderState(g);
        try {
            if (g) localStorage.setItem(genderKey, g);
            else localStorage.removeItem(genderKey);
        } catch { /* ignore */ }
    };

    const setPhase = (p: LifePhase) => {
        setPhaseState(p);
        try {
            if (p) localStorage.setItem(phaseKey, p);
            else localStorage.removeItem(phaseKey);
        } catch { /* ignore */ }
    };

    return (
        <PhaseContext.Provider value={{ gender: genderState, setGender, phase: phaseState, phaseInfo, setPhase, hasChosen }}>
            {children}
        </PhaseContext.Provider>
    );
}

export function usePhase() {
    return useContext(PhaseContext);
}
