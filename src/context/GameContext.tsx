import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Player, Prompt, Rule, StackItem, GameEvent, WheelSegment, WheelLayer } from '../types/game';

interface GameContextType {
    gameState: GameState | null;
    currentPlayer: Player | null;
    dispatch: React.Dispatch<GameAction>;
    joinLobby: (code: string, playerName: string) => void;
    createLobby: (playerName: string, numRules?: number, numPrompts?: number, startingPoints?: number) => void;
    addTestPlayers: (numPlayers: number) => void;
    addFillerRules: (numRules: number) => void;
    addFillerPrompts: (numPrompts: number) => void;
    createTestingState: () => void;
    setNumRules: (num: number) => void;
    setNumPrompts: (num: number) => void;
    addPrompt: (text: string, category?: string, plaqueColor?: string) => void;
    addRule: (text: string, plaqueColor?: string) => void;
    updatePrompt: (id: string, text: string) => void;
    updateRule: (id: string, text: string) => void;
    startGame: () => void;
    spinWheel: () => void;
    updatePoints: (playerId: string, points: number) => void;
    swapRules: (player1Id: string, player2Id: string) => void;
    swapRulesWithPlayer: (targetPlayerId: string) => void;
    cloneRuleToPlayer: (ruleId: string, targetPlayerId: string) => void;
    shredRule: (ruleId: string) => void;
    flipRule: (ruleId: string) => void;
    assignRule: (ruleId: string, playerId: string) => void;
    assignRuleToCurrentPlayer: (ruleId: string) => void;
    removeWheelLayer: (segmentId: string) => void;
    endGame: () => void;
}

type GameAction =
    | { type: 'SET_GAME_STATE'; payload: GameState }
    | { type: 'UPDATE_PLAYER'; payload: Player }
    | { type: 'ADD_PLAYER'; payload: Player }
    | { type: 'REMOVE_PLAYER'; payload: string }
    | { type: 'ADD_PROMPT'; payload: Prompt }
    | { type: 'ADD_RULE'; payload: Rule }
    | { type: 'UPDATE_RULE'; payload: Rule }
    | { type: 'UPDATE_PROMPT'; payload: Prompt }
    | { type: 'START_GAME' }
    | { type: 'SPIN_WHEEL'; payload: StackItem[] }
    | { type: 'UPDATE_POINTS'; payload: { playerId: string; points: number } }
    | { type: 'SET_CURRENT_PLAYER'; payload: string }
    | { type: 'RESET_GAME' }
    | { type: 'SET_NUM_RULES'; payload: number }
    | { type: 'SET_NUM_PROMPTS'; payload: number }
    | { type: 'REMOVE_WHEEL_LAYER'; payload: string }
    | { type: 'END_GAME'; payload: Player }
    | { type: 'CREATE_WHEEL_SEGMENTS' };

const initialState: GameState = {
    id: '',
    code: '',
    players: [],
    prompts: [],
    rules: [],
    wheelSegments: [],
    isGameStarted: false,
    isWheelSpinning: false,
    currentStack: [],
    roundNumber: 0,
    numRules: 3,
    numPrompts: 3,
    gameEnded: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_GAME_STATE':
            return action.payload;

        case 'ADD_PLAYER':
            return {
                ...state,
                players: [...state.players, action.payload],
            };

        case 'REMOVE_PLAYER':
            return {
                ...state,
                players: state.players.filter(p => p.id !== action.payload),
            };

        case 'ADD_PROMPT':
            return {
                ...state,
                prompts: [...state.prompts, action.payload],
            };

        case 'ADD_RULE':
            return {
                ...state,
                rules: [...state.rules, action.payload],
            };

        case 'UPDATE_RULE':
            return {
                ...state,
                rules: state.rules.map((r: Rule) => r.id === action.payload.id ? action.payload : r),
            };

        case 'UPDATE_PROMPT':
            return {
                ...state,
                prompts: state.prompts.map((p: Prompt) => p.id === action.payload.id ? action.payload : p),
            };

        case 'START_GAME':
            return {
                ...state,
                isGameStarted: true,
                roundNumber: 1,
            };

        case 'SPIN_WHEEL':
            return {
                ...state,
                isWheelSpinning: true,
                currentStack: action.payload,
            };

        case 'UPDATE_POINTS':
            return {
                ...state,
                players: state.players.map((p: Player) =>
                    p.id === action.payload.playerId
                        ? { ...p, points: action.payload.points }
                        : p
                ),
            };

        case 'SET_CURRENT_PLAYER':
            return {
                ...state,
                currentPlayer: action.payload,
            };

        case 'RESET_GAME':
            return initialState;

        case 'SET_NUM_RULES':
            return { ...state, numRules: action.payload };
        case 'SET_NUM_PROMPTS':
            return { ...state, numPrompts: action.payload };

        case 'REMOVE_WHEEL_LAYER':
            const updatedSegments = state.wheelSegments.map((segment: WheelSegment) => {
                if (segment.id === action.payload) {
                    const newLayerIndex = segment.currentLayerIndex + 1;
                    return { ...segment, currentLayerIndex: newLayerIndex };
                }
                return segment;
            });

            return {
                ...state,
                wheelSegments: updatedSegments,
            };

        case 'END_GAME':
            return {
                ...state,
                gameEnded: true,
                winner: action.payload,
            };

        case 'CREATE_WHEEL_SEGMENTS':
            const SEGMENT_COLORS = ['#6bb9d3', '#a861b3', '#ed5c5d', '#fbbf24'];

            // Create wheel segments with layers
            const newSegments: WheelSegment[] = [];
            const totalSegments = state.rules.length; // Always create segments based on rules

            // Track modifier colors for balanced distribution
            const modifierColors: string[] = [];

            for (let i = 0; i < totalSegments; i++) {
                const layers: WheelLayer[] = [];

                // Add rule layer (always present) with its stored plaque color or balanced if not set
                const rulePlaqueColor = state.rules[i].plaqueColor || LAYER_PLAQUE_COLORS[i % LAYER_PLAQUE_COLORS.length];
                layers.push({
                    type: 'rule',
                    content: state.rules[i],
                    isActive: true,
                    plaqueColor: rulePlaqueColor
                });

                // Add prompt layer if available, otherwise add modifier
                if (i < state.prompts.length) {
                    const promptPlaqueColor = state.prompts[i].plaqueColor || LAYER_PLAQUE_COLORS[i % LAYER_PLAQUE_COLORS.length];
                    layers.push({
                        type: 'prompt',
                        content: state.prompts[i],
                        isActive: true,
                        plaqueColor: promptPlaqueColor
                    });
                } else {
                    // Add modifier layer if no prompt available
                    const modifiers = ['Clone', 'Flip', 'Up', 'Down', 'Swap'];
                    // Use a more varied approach for modifier colors
                    const modifierColor = getVariedModifierColor(modifierColors);
                    modifierColors.push(modifierColor);
                    layers.push({
                        type: 'modifier',
                        content: modifiers[Math.floor(Math.random() * modifiers.length)],
                        isActive: true,
                        plaqueColor: modifierColor
                    });
                }

                // Add another modifier layer
                const modifiers = ['Clone', 'Flip', 'Up', 'Down', 'Swap'];
                const secondModifierColor = getVariedModifierColor(modifierColors);
                modifierColors.push(secondModifierColor);
                layers.push({
                    type: 'modifier',
                    content: modifiers[Math.floor(Math.random() * modifiers.length)],
                    isActive: true,
                    plaqueColor: secondModifierColor
                });

                // Add end layer
                layers.push({
                    type: 'end',
                    content: 'Game Over',
                    isActive: true,
                    plaqueColor: '#313131' // Always slate gray for end layer
                });

                newSegments.push({
                    id: Math.random().toString(36).substr(2, 9),
                    layers,
                    currentLayerIndex: 0,
                    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                    plaqueColor: LAYER_PLAQUE_COLORS[i % LAYER_PLAQUE_COLORS.length]
                });
            }

            return {
                ...state,
                wheelSegments: newSegments,
            };

        default:
            return state;
    }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Color distribution utility
const LAYER_PLAQUE_COLORS = ['#6bb9d3', '#a861b3', '#ed5c5d', '#fff'];

interface ColorUsage {
    [color: string]: {
        prompts: number;
        rules: number;
        modifiers: number;
    };
}

function getBalancedColor(type: 'prompt' | 'rule' | 'modifier', prompts: Prompt[], rules: Rule[]): string {
    // Count color usage for the specific type
    const colorCount: { [color: string]: number } = {};
    LAYER_PLAQUE_COLORS.forEach(color => {
        colorCount[color] = 0;
    });

    // Count existing colors for this type
    if (type === 'prompt') {
        prompts.forEach(prompt => {
            if (prompt.plaqueColor && colorCount[prompt.plaqueColor] !== undefined) {
                colorCount[prompt.plaqueColor]++;
            }
        });
    } else if (type === 'rule') {
        rules.forEach(rule => {
            if (rule.plaqueColor && colorCount[rule.plaqueColor] !== undefined) {
                colorCount[rule.plaqueColor]++;
            }
        });
    }

    // Find colors with minimum usage
    const minCount = Math.min(...Object.values(colorCount));
    const availableColors = LAYER_PLAQUE_COLORS.filter(color => colorCount[color] === minCount);

    // If multiple colors have the same usage, randomly select one
    if (availableColors.length > 1) {
        return availableColors[Math.floor(Math.random() * availableColors.length)];
    }

    return availableColors[0];
}

function getVariedModifierColor(existingModifierColors: string[]): string {
    // Count existing modifier colors
    const colorCount: { [color: string]: number } = {};
    LAYER_PLAQUE_COLORS.forEach(color => {
        colorCount[color] = 0;
    });

    existingModifierColors.forEach(color => {
        if (colorCount[color] !== undefined) {
            colorCount[color]++;
        }
    });

    // Find colors with minimum usage
    const minCount = Math.min(...Object.values(colorCount));
    const availableColors = LAYER_PLAQUE_COLORS.filter(color => colorCount[color] === minCount);

    // Randomly select from available colors
    return availableColors[Math.floor(Math.random() * availableColors.length)];
}

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [gameState, dispatch] = useReducer(gameReducer, initialState);

    const currentPlayer = gameState?.players.find(p => p.id === gameState.currentPlayer) || null;

    // No automatic test state initialization - will be created through UI

    const joinLobby = (code: string, playerName: string) => {
        // This would connect to your backend/socket server
        const player: Player = {
            id: Math.random().toString(36).substr(2, 9),
            name: playerName,
            points: 20,
            rules: [],
            isHost: false,
        };

        dispatch({ type: 'ADD_PLAYER', payload: player });
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: player.id });
    };

    const createLobby = (playerName: string, numRules = 3, numPrompts = 3, startingPoints = 20) => {
        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        const player: Player = {
            id: Math.random().toString(36).substr(2, 9),
            name: playerName,
            points: startingPoints,
            rules: [],
            isHost: true,
        };

        const newGameState: GameState = {
            ...initialState,
            id: Math.random().toString(36).substr(2, 9),
            code,
            players: [player],
            currentPlayer: player.id,
            numRules,
            numPrompts,
        };

        dispatch({ type: 'SET_GAME_STATE', payload: newGameState });
    };

    const addTestPlayers = (numPlayers: number) => {
        if (!gameState || numPlayers <= 0) return;

        const testPlayerNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
        const newPlayers: Player[] = [];

        for (let i = 0; i < numPlayers; i++) {
            const testPlayer: Player = {
                id: Math.random().toString(36).substr(2, 9),
                name: testPlayerNames[i] || `Player ${i + 1}`,
                points: Math.floor(Math.random() * 10) + 15, // Random points between 15-24
                rules: [],
                isHost: false,
            };
            newPlayers.push(testPlayer);
        }

        const updatedGameState = {
            ...gameState,
            players: [...gameState.players, ...newPlayers],
        };

        dispatch({ type: 'SET_GAME_STATE', payload: updatedGameState });
    };

    const addFillerRules = (numRules: number) => {
        if (!gameState || numRules <= 0) return;

        const fillerRules: Rule[] = [
            { id: Math.random().toString(36).substr(2, 9), text: "Must speak in a different accent", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot use the letter 'E'", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Must end every sentence with 'yo'", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Must act like a robot", isActive: true, assignedTo: undefined, plaqueColor: "#fff", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot use contractions", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Must speak in questions only", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Must use hand gestures for everything", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot say 'yes' or 'no'", isActive: true, assignedTo: undefined, plaqueColor: "#fff", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Must speak in third person", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot use past tense", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", isFiller: true },
        ];

        const selectedFillerRules = fillerRules.slice(0, Math.min(numRules, fillerRules.length));

        const updatedGameState = {
            ...gameState,
            rules: [...gameState.rules, ...selectedFillerRules],
        };

        dispatch({ type: 'SET_GAME_STATE', payload: updatedGameState });
    };

    const addFillerPrompts = (numPrompts: number) => {
        if (!gameState || numPrompts <= 0) return;

        const fillerPrompts: Prompt[] = [
            { id: Math.random().toString(36).substr(2, 9), text: "Convince everyone that pizza is actually a dessert", category: "Persuasion", plaqueColor: "#ed5c5d", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Explain how to make a sandwich without using your hands", category: "Instruction", plaqueColor: "#fff", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Describe your morning routine as if you're a superhero", category: "Storytelling", plaqueColor: "#6bb9d3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Argue that socks are actually tiny blankets for your feet", category: "Debate", plaqueColor: "#a861b3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Explain quantum physics using only food metaphors", category: "Education", plaqueColor: "#ed5c5d", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Describe your ideal vacation to a planet that doesn't exist", category: "Creative", plaqueColor: "#fff", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Convince everyone that time travel is just really good planning", category: "Persuasion", plaqueColor: "#6bb9d3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Explain why cats are secretly running the internet", category: "Conspiracy", plaqueColor: "#a861b3", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Describe your perfect day using only emojis", category: "Creative", plaqueColor: "#ed5c5d", isFiller: true },
            { id: Math.random().toString(36).substr(2, 9), text: "Argue that breakfast foods are acceptable at any time", category: "Debate", plaqueColor: "#fff", isFiller: true },
        ];

        const selectedFillerPrompts = fillerPrompts.slice(0, Math.min(numPrompts, fillerPrompts.length));

        const updatedGameState = {
            ...gameState,
            prompts: [...gameState.prompts, ...selectedFillerPrompts],
        };

        dispatch({ type: 'SET_GAME_STATE', payload: updatedGameState });
    };

    const createTestingState = () => {
        const hostId = Math.random().toString(36).substr(2, 9);
        const player1Id = Math.random().toString(36).substr(2, 9);
        const player2Id = Math.random().toString(36).substr(2, 9);
        const player3Id = Math.random().toString(36).substr(2, 9);

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
                points: 18,
                rules: [],
                isHost: false,
            },
            {
                id: player2Id,
                name: "Bob",
                points: 22,
                rules: [],
                isHost: false,
            },
            {
                id: player3Id,
                name: "Charlie",
                points: 16,
                rules: [],
                isHost: false,
            },
        ];

        const rules: Rule[] = [
            { id: Math.random().toString(36).substr(2, 9), text: "Must speak in a different accent", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3" },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot use the letter 'E'", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3" },
            { id: Math.random().toString(36).substr(2, 9), text: "Must end every sentence with 'yo'", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d" },
            { id: Math.random().toString(36).substr(2, 9), text: "Must act like a robot", isActive: true, assignedTo: undefined, plaqueColor: "#fff" },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot use contractions", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3" },
            { id: Math.random().toString(36).substr(2, 9), text: "Must speak in questions only", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3" },
            { id: Math.random().toString(36).substr(2, 9), text: "Must use hand gestures for everything", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d" },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot say 'yes' or 'no'", isActive: true, assignedTo: undefined, plaqueColor: "#fff" },
            { id: Math.random().toString(36).substr(2, 9), text: "Must speak in third person", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3" },
            { id: Math.random().toString(36).substr(2, 9), text: "Cannot use past tense", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3" },
        ];

        const prompts: Prompt[] = [
            { id: Math.random().toString(36).substr(2, 9), text: "Convince everyone that pizza is actually a dessert", category: "Persuasion", plaqueColor: "#ed5c5d" },
            { id: Math.random().toString(36).substr(2, 9), text: "Explain how to make a sandwich without using your hands", category: "Instruction", plaqueColor: "#fff" },
            { id: Math.random().toString(36).substr(2, 9), text: "Describe your morning routine as if you're a superhero", category: "Storytelling", plaqueColor: "#6bb9d3" },
            { id: Math.random().toString(36).substr(2, 9), text: "Argue that socks are actually tiny blankets for your feet", category: "Debate", plaqueColor: "#a861b3" },
            { id: Math.random().toString(36).substr(2, 9), text: "Explain quantum physics using only food metaphors", category: "Education", plaqueColor: "#ed5c5d" },
            { id: Math.random().toString(36).substr(2, 9), text: "Describe your ideal vacation to a planet that doesn't exist", category: "Creative", plaqueColor: "#fff" },
            { id: Math.random().toString(36).substr(2, 9), text: "Convince everyone that time travel is just really good planning", category: "Persuasion", plaqueColor: "#6bb9d3" },
        ];

        const testingGameState: GameState = {
            ...initialState,
            id: Math.random().toString(36).substr(2, 9),
            code: "TEST123",
            players,
            currentPlayer: hostId,
            rules,
            prompts,
            numRules: 10,
            numPrompts: 7,
            isGameStarted: true,
        };

        dispatch({ type: 'SET_GAME_STATE', payload: testingGameState });
        dispatch({ type: 'CREATE_WHEEL_SEGMENTS' });
    };

    const setNumRules = (num: number) => {
        dispatch({ type: 'SET_NUM_RULES', payload: num });
    };
    const setNumPrompts = (num: number) => {
        dispatch({ type: 'SET_NUM_PROMPTS', payload: num });
    };

    const addPrompt = (text: string, category?: string, plaqueColor?: string) => {
        const prompt: Prompt = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            category,
            plaqueColor: plaqueColor || getBalancedColor('prompt', gameState?.prompts || [], gameState?.rules || [])
        };
        dispatch({ type: 'ADD_PROMPT', payload: prompt });
    };

    const addRule = (text: string, plaqueColor?: string) => {
        const rule: Rule = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            isActive: true,
            plaqueColor: plaqueColor || getBalancedColor('rule', gameState?.prompts || [], gameState?.rules || [])
        };
        dispatch({ type: 'ADD_RULE', payload: rule });
    };

    const updateRule = (id: string, text: string) => {
        const rule = gameState?.rules.find(r => r.id === id);
        if (rule) {
            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, text } });
        }
    };

    const updatePrompt = (id: string, text: string) => {
        const prompt = gameState?.prompts.find(p => p.id === id);
        if (prompt) {
            dispatch({ type: 'UPDATE_PROMPT', payload: { ...prompt, text } });
        }
    };

    const startGame = () => {
        dispatch({ type: 'START_GAME' });
        dispatch({ type: 'CREATE_WHEEL_SEGMENTS' });
    };

    const spinWheel = () => {
        if (!gameState) return;

        const stack: StackItem[] = [];
        const availableRules = gameState.rules.filter(r => r.isActive && !r.assignedTo);
        const availablePrompts = gameState.prompts;

        // Generate random stack: rule -> prompt/modifier -> prompt/modifier -> end
        if (availableRules.length > 0) {
            const randomRule = availableRules[Math.floor(Math.random() * availableRules.length)];
            stack.push({ type: 'rule', content: randomRule });
        }

        if (availablePrompts.length > 0) {
            const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
            stack.push({ type: 'prompt', content: randomPrompt });
        }

        // Add modifier (50% chance)
        if (Math.random() > 0.5) {
            const modifiers = ['Clone', 'Flip'];
            const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
            stack.push({ type: 'modifier', content: randomModifier });
        }

        dispatch({ type: 'SPIN_WHEEL', payload: stack });
    };

    const updatePoints = (playerId: string, points: number) => {
        dispatch({ type: 'UPDATE_POINTS', payload: { playerId, points } });
    };

    const swapRules = (player1Id: string, player2Id: string) => {
        if (!gameState) return;

        const player1 = gameState.players.find((p: Player) => p.id === player1Id);
        const player2 = gameState.players.find((p: Player) => p.id === player2Id);

        if (player1 && player2) {
            const player1Rules = gameState.rules.filter((r: Rule) => r.assignedTo === player1Id);
            const player2Rules = gameState.rules.filter((r: Rule) => r.assignedTo === player2Id);

            // Update rules to swap assignments
            player1Rules.forEach((rule: Rule) => {
                dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: player2Id } });
            });

            player2Rules.forEach((rule: Rule) => {
                dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: player1Id } });
            });
        }
    };

    const swapRulesWithPlayer = (targetPlayerId: string) => {
        if (!gameState || !gameState.currentPlayer) return;

        const currentPlayer = gameState.players.find((p: Player) => p.id === gameState.currentPlayer);
        if (currentPlayer && currentPlayer.id !== targetPlayerId) {
            swapRules(currentPlayer.id, targetPlayerId);
        }
    };

    const cloneRuleToPlayer = (ruleId: string, targetPlayerId: string) => {
        if (!gameState || !gameState.currentPlayer) return;

        const rule = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (rule) {
            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: targetPlayerId } });
        }
    };

    const shredRule = (ruleId: string) => {
        if (!gameState) return;

        const rule = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (rule) {
            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: undefined, isActive: false } });
        }
    };

    const flipRule = (ruleId: string) => {
        if (!gameState) return;

        const rule = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (rule) {
            // Flip the rule text by adding "NOT" or "DON'T" to make it opposite
            let flippedText = rule.text;
            if (flippedText.toLowerCase().includes('must') || flippedText.toLowerCase().includes('should') || flippedText.toLowerCase().includes('always')) {
                flippedText = flippedText.replace(/\b(must|should|always)\b/gi, 'must NOT');
            } else if (flippedText.toLowerCase().includes('cannot') || flippedText.toLowerCase().includes('must not') || flippedText.toLowerCase().includes('never')) {
                flippedText = flippedText.replace(/\b(cannot|must not|never)\b/gi, 'must');
            } else if (flippedText.toLowerCase().includes('don\'t') || flippedText.toLowerCase().includes('do not')) {
                flippedText = flippedText.replace(/\b(don't|do not)\b/gi, 'must');
            } else {
                // Default: add "NOT" at the beginning
                flippedText = `NOT: ${flippedText}`;
            }

            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, text: flippedText } });
        }
    };

    const assignRule = (ruleId: string, playerId: string) => {
        if (!gameState) return;

        const rule = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (rule) {
            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: playerId } });
        }
    };

    const assignRuleToCurrentPlayer = (ruleId: string) => {
        if (!gameState || !gameState.currentPlayer) return;

        const rule = gameState.rules.find(r => r.id === ruleId);
        if (rule) {
            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: gameState.currentPlayer } });
        }
    };

    const removeWheelLayer = (segmentId: string) => {
        dispatch({ type: 'REMOVE_WHEEL_LAYER', payload: segmentId });
    };

    const endGame = () => {
        if (!gameState || !gameState.currentPlayer) return;

        const winner = gameState.players.find(p => p.id === gameState.currentPlayer);
        if (winner) {
            dispatch({ type: 'END_GAME', payload: winner });
        }
    };

    const value: GameContextType = {
        gameState,
        currentPlayer,
        dispatch,
        joinLobby,
        createLobby,
        addTestPlayers,
        addFillerRules,
        addFillerPrompts,
        createTestingState,
        setNumRules,
        setNumPrompts,
        addPrompt,
        addRule,
        updatePrompt,
        updateRule,
        startGame,
        spinWheel,
        updatePoints,
        swapRules,
        swapRulesWithPlayer,
        cloneRuleToPlayer,
        shredRule,
        flipRule,
        assignRule,
        assignRuleToCurrentPlayer,
        removeWheelLayer,
        endGame,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
} 