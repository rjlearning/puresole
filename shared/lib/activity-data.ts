
export interface Activity {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    duration: number;
    icon_emoji: string;
    gradient_class: string;
    benefits: string[];
    animation_type?: 'breathing' | 'meditation' | 'movement' | 'grounding' | 'journaling' | 'somatic' | 'default';
    ai_suggested?: boolean;
    instructions?: string[];
}

export const sampleActivities: Activity[] = [
    {
        id: 'breathing-1',
        name: '4-7-8 Breathing',
        description: 'Reduce anxiety and promote calmness with this simple breathing technique',
        category: 'breathing',
        difficulty: 'beginner',
        duration: 5,
        icon_emoji: '🫁',
        gradient_class: 'from-blue-500 to-cyan-500',
        benefits: ['Reduces stress', 'Improves sleep', 'Calms nervous system'],
        animation_type: 'breathing',
        ai_suggested: true,
        instructions: [
            'Sit comfortably with your back straight. Place the tip of your tongue against the ridge behind your upper front teeth.',
            'Exhale completely through your mouth, making a whoosh sound.',
            'Close your mouth and inhale quietly through your nose for 4 counts.',
            'Hold your breath for 7 counts.',
            'Exhale completely through your mouth for 8 counts, making a whoosh sound.',
            'Repeat this cycle 3-4 times. You may feel lightheaded at first - this is normal.'
        ]
    },
    {
        id: 'meditation-1',
        name: 'Guided Mindfulness',
        description: 'A 10-minute guided meditation to center your thoughts and relax your mind',
        category: 'meditation',
        difficulty: 'beginner',
        duration: 10,
        icon_emoji: '🧘',
        gradient_class: 'from-purple-500 to-pink-500',
        benefits: ['Improves focus', 'Reduces anxiety', 'Emotional balance'],
        animation_type: 'meditation',
        ai_suggested: true,
        instructions: [
            'Find a quiet space and sit comfortably with your back straight but relaxed.',
            'Close your eyes or maintain a soft gaze downward.',
            'Bring your attention to your breath. Notice the natural rhythm of breathing in and out.',
            'When thoughts arise, acknowledge them without judgment and gently return focus to your breath.',
            'Scan your body from head to toe, noticing any tension and allowing it to release.',
            'Expand awareness to sounds around you, then to the feeling of your body in space.',
            'In the final minute, slowly bring movement back to your fingers and toes.',
            'Take a deep breath and open your eyes when ready.'
        ]
    },
    {
        id: 'journaling-1',
        name: 'Gratitude Journal',
        description: 'Write down three things you\'re grateful for today to shift your mindset',
        category: 'journaling',
        difficulty: 'beginner',
        duration: 5,
        icon_emoji: '📝',
        gradient_class: 'from-green-500 to-emerald-500',
        benefits: ['Positive thinking', 'Better mood', 'Mindfulness'],
        ai_suggested: false,
        animation_type: 'journaling',
        instructions: [
            'Get a notebook or open your digital journal.',
            'Think about your day and identify three things you\'re grateful for. They can be big or small.',
            'Write each item clearly. Instead of just listing, explain WHY you\'re grateful. Example: "I\'m grateful for my morning coffee because it gave me a moment of peace."',
            'Be specific and genuine. Focus on people, experiences, or things that truly matter.',
            'Re-read what you wrote and let the positive feelings sink in.',
            'Optional: End with one thing you\'re looking forward to tomorrow.'
        ]
    },
    {
        id: 'movement-1',
        name: 'Yoga for Stress',
        description: 'Gentle yoga flows designed to release tension and improve flexibility',
        category: 'movement',
        difficulty: 'intermediate',
        duration: 15,
        icon_emoji: '🤸',
        gradient_class: 'from-orange-500 to-red-500',
        benefits: ['Reduces tension', 'Improves flexibility', 'Body awareness'],
        animation_type: 'movement',
        ai_suggested: true,
        instructions: [
            'Find a quiet space with your yoga mat. Wear comfortable clothing.',
            'Start in Child\'s Pose: Kneel, sit back on heels, extend arms forward. Hold for 1 minute, breathing deeply.',
            'Move to Cat-Cow: On hands and knees, alternate arching back (cow) and rounding spine (cat). Repeat 5 times.',
            'Downward Dog: From hands and knees, lift hips up and back, forming an inverted V. Hold for 5 breaths.',
            'Transition to Warrior I: Step right foot forward, raise arms overhead, bend right knee. Hold 5 breaths, switch sides.',
            'Child\'s Pose for 1 minute to rest.',
            'Seated Forward Fold: Sit with legs extended, reach for toes. Hold for 1 minute.',
            'End in Savasana (Corpse Pose): Lie flat, arms at sides, palms up. Relax completely for 2-3 minutes.'
        ]
    },
    {
        id: 'grounding-1',
        name: '5-4-3-2-1 Technique',
        description: 'Ground yourself in the present moment using your five senses',
        category: 'grounding',
        difficulty: 'beginner',
        duration: 5,
        icon_emoji: '🌍',
        gradient_class: 'from-teal-500 to-green-500',
        benefits: ['Reduces panic', 'Present awareness', 'Calming'],
        ai_suggested: false,
        animation_type: 'grounding',
        instructions: [
            'Sit or stand comfortably. Take a deep breath.',
            '5 THINGS YOU SEE: Look around and name 5 things you can see. Say them out loud or in your mind. Example: "I see a blue chair, a lamp, a window, a book, my phone."',
            '4 THINGS YOU TOUCH: Acknowledge 4 things you can physically feel. Example: "I feel the chair beneath me, my feet on the floor, my hands on my lap, the air on my skin."',
            '3 THINGS YOU HEAR: Listen carefully and identify 3 sounds. Example: "I hear birds chirping, a car passing, the hum of the refrigerator."',
            '2 THINGS YOU SMELL: Notice 2 scents. If you can\'t smell anything, name 2 scents you like.',
            '1 THING YOU TASTE: Identify 1 thing you can taste, or name your favorite flavor.',
            'Take another deep breath and notice how you feel more present and calm.'
        ]
    },
    {
        id: 'breathing-2',
        name: 'Box Breathing',
        description: 'Used by Navy SEALs to stay calm under pressure',
        category: 'breathing',
        difficulty: 'intermediate',
        duration: 8,
        icon_emoji: '🫁',
        gradient_class: 'from-blue-500 to-cyan-500',
        benefits: ['Focus', 'Stress relief', 'Mental clarity'],
        animation_type: 'breathing',
        ai_suggested: true,
        instructions: [
            'Sit upright in a comfortable position with feet flat on the floor.',
            'Exhale slowly through your mouth to empty your lungs completely.',
            'STEP 1 - Inhale: Breathe in slowly through your nose for 4 counts.',
            'STEP 2 - Hold: Hold your breath for 4 counts. Stay relaxed.',
            'STEP 3 - Exhale: Breathe out slowly through your mouth for 4 counts.',
            'STEP 4 - Hold: Hold your breath (lungs empty) for 4 counts.',
            'Repeat this "box" pattern for 5-10 cycles. Imagine tracing the sides of a square.',
            'End with a few natural breaths and notice your calmer state.'
        ]
    },
    {
        id: 'meditation-2',
        name: 'Body Scan Meditation',
        description: 'Progressive relaxation technique to release physical tension',
        category: 'meditation',
        difficulty: 'beginner',
        duration: 12,
        icon_emoji: '🧘',
        gradient_class: 'from-purple-500 to-pink-500',
        benefits: ['Deep relaxation', 'Better sleep', 'Pain relief'],
        animation_type: 'meditation',
        ai_suggested: true,
        instructions: [
            'Lie down comfortably on your back with arms at your sides, palms facing up.',
            'Close your eyes and take 3 deep, slow breaths.',
            'Bring attention to your toes. Notice any sensations. Consciously relax them.',
            'Move attention up to your feet, then ankles. Relax each area as you go.',
            'Continue scanning: calves, knees, thighs, hips. Release tension in each part.',
            'Move to your abdomen, chest, and back. Breathe into any tight areas.',
            'Scan your shoulders, arms, hands, and fingers. Let them become heavy.',
            'Finally, relax your neck, jaw, face, and scalp.',
            'Stay in this fully relaxed state for 2-3 minutes before slowly opening your eyes.'
        ]
    },
    {
        id: 'movement-2',
        name: 'Walking Meditation',
        description: 'Combine gentle movement with mindfulness practice',
        category: 'movement',
        difficulty: 'beginner',
        duration: 10,
        icon_emoji: '🚶',
        gradient_class: 'from-orange-500 to-red-500',
        benefits: ['Mood boost', 'Mental clarity', 'Energy'],
        ai_suggested: false,
        animation_type: 'movement',
        instructions: [
            'Find a quiet path or space where you can walk for 10 minutes uninterrupted.',
            'Stand still for a moment. Take 3 deep breaths and set an intention to be present.',
            'Begin walking at a slow, natural pace. There\'s no destination.',
            'Focus on the physical sensations: feet touching the ground, legs moving, arms swinging.',
            'Notice how your weight shifts from heel to toe with each step.',
            'When your mind wanders (it will!), gently bring attention back to the sensation of walking.',
            'Observe your surroundings with fresh eyes, but keep primary focus on the act of walking.',
            'In the last minute, gradually slow down. Stand still and take 3 final deep breaths.',
            'Notice how you feel - often calmer and more grounded.'
        ]
    },
    {
        id: 'journaling-2',
        name: 'Thought Dump',
        description: 'Free-write everything on your mind for mental clarity',
        category: 'journaling',
        difficulty: 'beginner',
        duration: 10,
        icon_emoji: '📝',
        gradient_class: 'from-green-500 to-emerald-500',
        benefits: ['Mental clarity', 'Stress release', 'Self-awareness'],
        ai_suggested: false,
        animation_type: 'journaling',
        instructions: [
            'Grab a notebook or open a blank document. Set a timer for 10 minutes.',
            'Start writing everything that comes to mind. Don\'t filter, edit, or judge.',
            'Write continuously. If you get stuck, write "I don\'t know what to write" until something comes.',
            'Include worries, tasks, random thoughts, feelings - anything occupying mental space.',
            'Don\'t worry about grammar, spelling, or making sense. This is just for you.',
            'Keep your hand moving for the full 10 minutes.',
            'When the timer ends, take a breath. You don\'t need to reread it unless you want to.',
            'Notice the mental clarity and lightness that comes from emptying your mind onto paper.'
        ]
    },
    {
        id: 'somatic-1',
        name: 'Vagus Nerve Reset',
        description: 'A physical eye-movement exercise to directly signal safety to your nervous system',
        category: 'somatic',
        difficulty: 'beginner',
        duration: 4,
        icon_emoji: '👀',
        gradient_class: 'from-emerald-500 to-teal-500',
        benefits: ['Nervous system regulation', 'Immediate calm', 'Trauma release'],
        ai_suggested: true,
        animation_type: 'somatic',
        instructions: [
            'Sit comfortably. Interlace your fingers and place them behind your head.',
            'Keep your head perfectly still. Move only your eyes to look as far right as possible.',
            'Hold this visual position until you naturally sigh, swallow, or yawn.',
            'Bring eyes back to center.',
            'Repeat on the left side until an involuntary physical release occurs.'
        ]
    },
    {
        id: 'somatic-2',
        name: 'Tension Releasing Shake (TRE)',
        description: 'Physical shaking to discharge stored stress and trauma from the body',
        category: 'somatic',
        difficulty: 'intermediate',
        duration: 5,
        icon_emoji: '〰️',
        gradient_class: 'from-orange-500 to-rose-500',
        benefits: ['Releases stored trauma', 'Discharges adrenaline', 'Physical relief'],
        ai_suggested: true,
        animation_type: 'somatic',
        instructions: [
            'Stand comfortably. Ground your feet into the floor.',
            'Begin by shaking just your hands and wrists loosely.',
            'Let the shaking travel up your arms to your shoulders.',
            'Shift weight to one leg and shake the other. Then switch.',
            'Allow your whole body to shake, bounce, and vibrate as needed.',
            'Stop abruptly and stand in perfect stillness. Notice the tingling.'
        ]
    }
];
