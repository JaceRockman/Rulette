import { LAYER_PLAQUE_COLORS } from "./styles";

export const defaultRules = [
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must speak in a different accent", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot use the letter 'E'", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must end every sentence with 'yo'", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must act like a robot", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot use contractions", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must speak in questions only", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must use hand gestures for everything", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot say 'yes' or 'no'", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must speak in third person", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot use past tense", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must rhyme every sentence", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Can only speak in song lyrics", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must pretend to be a famous celebrity", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Can only answer questions with questions", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must use a different name for everyone", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Can only whisper", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must act as if underwater", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Can only use one-syllable words", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must narrate everything you do", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Can only speak in animal noises", isActive: true, plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system" },
];

export const defaultPrompts = [
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Convince everyone that pizza is actually a dessert", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Explain how to make a sandwich without using your hands", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Describe your morning routine as if you're a superhero", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Argue that socks are actually tiny blankets for your feet", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Explain quantum physics using only food metaphors", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Describe your ideal vacation to a planet that doesn't exist", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Convince everyone that time travel is just really good planning", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Sell a pet rock as the next big thing", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Explain why the sky is green", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Teach someone how to ride a unicycle (without using the word ‘balance’)", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Convince everyone that you’re a time traveler from the year 3000", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Describe your job as if you’re a secret agent", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Argue that breakfast should be eaten for dinner", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Explain how to brush your teeth to an alien", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Tell a bedtime story about a heroic potato", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Convince everyone that shoes are unnecessary", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Describe your favorite food as if you hate it", plaqueColor: LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)], authorId: "system", isActive: true },
];

export const allModifiers = [
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Clone", plaqueColor: "#7A2D3F", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Flip", plaqueColor: "#7A2D3F", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Up", plaqueColor: "#29395C", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Down", plaqueColor: "#29395C", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Swap", plaqueColor: "#7A2D3F", authorId: "system", isActive: true },
];

export const generateModifierPlaque = (index: number) => {
    return allModifiers[index % allModifiers.length];
};

export const endPlaque = {
    id: Math.random().toString(36).substring(2, 9),
    type: 'end',
    text: "Game Over",
    plaqueColor: "#313131",
    authorId: "system"
}; 