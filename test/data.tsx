import { LAYER_PLAQUE_COLORS } from "../src/shared/styles";
import { GameState, Player, Rule, Prompt, Modifier, End } from "../src/types/game";

export const testingState = () => {
    const hostId = Math.random().toString(36).substring(2, 9);
    const player1Id = Math.random().toString(36).substring(2, 9);
    const player2Id = Math.random().toString(36).substring(2, 9);
    const player3Id = Math.random().toString(36).substring(2, 9);

    const players: Player[] = [
        {
            id: hostId,
            name: "Host Player",
            points: 20,
            rules: [],
            isHost: true,
        },
        {
            id: player1Id,
            name: "Alice",
            points: 20,
            rules: [],
            isHost: false,
        },
        {
            id: player2Id,
            name: "Bob",
            points: 20,
            rules: [],
            isHost: false,
        },
        {
            id: player3Id,
            name: "Charlie",
            points: 20,
            rules: [],
            isHost: false,
        },
    ];

    const testingGameState: any = {
        id: Math.random().toString(36).substring(2, 9),
        code: "TEST123",
        players,
        modifiers: [],
        currentUser: hostId,
        activePlayer: player1Id, // Set first non-host player as active
        rules: exampleRules,
        prompts: examplePrompts,
        numRules: 10,
        numPrompts: 7,
        isGameStarted: true,
    };

    return testingGameState;
};


const randomPlaqueColor = () => {
    return LAYER_PLAQUE_COLORS[Math.floor(Math.random() * LAYER_PLAQUE_COLORS.length)];
}

export const exampleRules: Rule[] = [
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must speak in a different accent", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot use the letter 'E'", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must end every sentence with 'yo'", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must act like a robot", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot use contractions", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must speak in questions only", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must use hand gestures for everything", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot say 'yes' or 'no'", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Must speak in third person", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
    { id: Math.random().toString(36).substring(2, 9), type: 'rule', text: "Cannot use past tense", isActive: true, plaqueColor: randomPlaqueColor(), authorId: "system" },
];


export const examplePrompts: Prompt[] = [
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Convince everyone that pizza is actually a dessert", plaqueColor: randomPlaqueColor(), authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Explain how to make a sandwich without using your hands", plaqueColor: randomPlaqueColor(), authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Describe your morning routine as if you're a superhero", plaqueColor: randomPlaqueColor(), authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Argue that socks are actually tiny blankets for your feet", plaqueColor: randomPlaqueColor(), authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Explain quantum physics using only food metaphors", plaqueColor: randomPlaqueColor(), authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Describe your ideal vacation to a planet that doesn't exist", plaqueColor: randomPlaqueColor(), authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'prompt', text: "Convince everyone that time travel is just really good planning", plaqueColor: randomPlaqueColor(), authorId: "system", isActive: true },
];

export const allModifiers: Modifier[] = [
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Clone", plaqueColor: "#7A2D3F", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Flip", plaqueColor: "#7A2D3F", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Up", plaqueColor: "#29395C", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Down", plaqueColor: "#29395C", authorId: "system", isActive: true },
    { id: Math.random().toString(36).substring(2, 9), type: 'modifier', text: "Swap", plaqueColor: "#7A2D3F", authorId: "system", isActive: true },
];


export const generateModifierPlaque = (index: number) => {
    return allModifiers[index % allModifiers.length]
}

export const endPlaque: End = {
    id: Math.random().toString(36).substring(2, 9),
    type: 'end',
    text: "Game Over",
    plaqueColor: "#313131",
    authorId: "system"
}

// const addTestPlayers = (numPlayers: number) => {
//     if (!gameState || numPlayers <= 0) return;

//     const testPlayerNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
//     const newPlayers: Player[] = [];

//     for (let i = 0; i < numPlayers; i++) {
//         const testPlayer: Player = {
//             id: Math.random().toString(36).substr(2, 9),
//             name: testPlayerNames[i] || `Player ${i + 1}`,
//             points: 20, // All players start at 20 points
//             rules: [],
//             isHost: false,
//         };
//         newPlayers.push(testPlayer);
//     }

//     const updatedGameState = {
//         ...gameState,
//         players: [...gameState.players, ...newPlayers],
//     };

//     dispatch({ type: 'SET_GAME_STATE', payload: updatedGameState });
// };

// const addFillerRules = (numRules: number) => {
//     if (!gameState) return;

//     const selectedFillerRules = exampleRules.slice(0, Math.min(numRules, exampleRules.length));

//     dispatch({ type: 'ADD_RULES', payload: selectedFillerRules });
// };

// const addFillerPrompts = (numPrompts: number) => {
//     if (!gameState) return;

//     const selectedFillerPrompts = examplePrompts.slice(0, Math.min(numPrompts, examplePrompts.length));

//     dispatch({ type: 'ADD_PROMPTS', payload: selectedFillerPrompts });
// };