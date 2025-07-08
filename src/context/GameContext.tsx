import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Player, Prompt, Rule, StackItem, GameEvent, WheelSegment, WheelLayer } from '../types/game';
import socketService from '../services/socketService';

interface GameContextType {
    gameState: GameState | null;
    currentPlayer: Player | null;
    dispatch: React.Dispatch<GameAction>;
    getVisibleRules: () => Rule[];
    getVisiblePrompts: () => Prompt[];
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
    markRulesCompleted: () => void;
    markPromptsCompleted: () => void;
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
    | { type: 'CREATE_WHEEL_SEGMENTS' }
    | { type: 'SET_HOST'; payload: string }
    | { type: 'MARK_RULES_COMPLETED'; payload: string }
    | { type: 'MARK_PROMPTS_COMPLETED'; payload: string };

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
                players: [...(state.players || []), action.payload],
            };

        case 'REMOVE_PLAYER':
            return {
                ...state,
                players: (state.players || []).filter(p => p.id !== action.payload),
            };

        case 'ADD_PROMPT':
            return {
                ...state,
                prompts: [...(state.prompts || []), action.payload],
            };

        case 'ADD_RULE':
            return {
                ...state,
                rules: [...(state.rules || []), action.payload],
            };

        case 'UPDATE_RULE':
            return {
                ...state,
                rules: (state.rules || []).map((r: Rule) => r.id === action.payload.id ? action.payload : r),
            };

        case 'UPDATE_PROMPT':
            return {
                ...state,
                prompts: (state.prompts || []).map((p: Prompt) => p.id === action.payload.id ? action.payload : p),
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
                players: (state.players || []).map((p: Player) =>
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
            const updatedSegments = (state.wheelSegments || []).map((segment: WheelSegment) => {
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

        case 'SET_HOST':
            const players = state.players || [];
            const oldHost = players.find(p => p.isHost);
            return {
                ...state,
                players: players
                    .filter((p: Player) => !p.isHost) // Remove old host
                    .map((p: Player) => ({
                        ...p,
                        isHost: p.id === action.payload
                    }))
                    .concat(
                        players
                            .filter((p: Player) => p.id === action.payload)
                            .map((p: Player) => ({
                                ...p,
                                isHost: true
                            }))
                    ),
            };

        case 'CREATE_WHEEL_SEGMENTS':
            const SEGMENT_COLORS = ['#6bb9d3', '#a861b3', '#ed5c5d', '#fbbf24'];

            // Create wheel segments with layers
            const newSegments: WheelSegment[] = [];

            // Ensure rules and prompts arrays exist
            const rules = state.rules || [];
            const prompts = state.prompts || [];
            const totalSegments = Math.max(rules.length, prompts.length, 1); // At least 1 segment

            // Track modifier colors for balanced distribution
            const modifierColors: string[] = [];

            for (let i = 0; i < totalSegments; i++) {
                const layers: WheelLayer[] = [];

                // Add rule layer if available, otherwise add modifier
                if (i < rules.length) {
                    const rulePlaqueColor = rules[i].plaqueColor || LAYER_PLAQUE_COLORS[i % LAYER_PLAQUE_COLORS.length];
                    layers.push({
                        type: 'rule',
                        content: rules[i],
                        isActive: true,
                        plaqueColor: rulePlaqueColor
                    });
                } else {
                    // Add modifier layer if no rule available
                    const modifiers = ['Clone', 'Flip', 'Up', 'Down', 'Swap'];
                    const modifierColor = getVariedModifierColor(modifierColors);
                    modifierColors.push(modifierColor);
                    layers.push({
                        type: 'modifier',
                        content: modifiers[Math.floor(Math.random() * modifiers.length)],
                        isActive: true,
                        plaqueColor: modifierColor
                    });
                }

                // Add prompt layer if available, otherwise add modifier
                if (i < prompts.length) {
                    const promptPlaqueColor = prompts[i].plaqueColor || LAYER_PLAQUE_COLORS[i % LAYER_PLAQUE_COLORS.length];
                    layers.push({
                        type: 'prompt',
                        content: prompts[i],
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

            // Sync wheel segments to backend
            socketService.syncWheelSegments(newSegments);

            return {
                ...state,
                wheelSegments: newSegments,
            };

        case 'MARK_RULES_COMPLETED':
            return {
                ...state,
                rules: state.rules.map(rule =>
                    rule.id === action.payload ? { ...rule, isActive: false } : rule
                ),
            };

        case 'MARK_PROMPTS_COMPLETED':
            return {
                ...state,
                prompts: state.prompts.map(prompt =>
                    prompt.id === action.payload ? { ...prompt, isActive: false } : prompt
                ),
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
    // Simple random color selection for now
    const colors = ['#6bb9d3', '#a861b3', '#ed5c5d', '#fff'];
    return colors[Math.floor(Math.random() * colors.length)];
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
    const [currentPlayerId, setCurrentPlayerId] = React.useState<string | null>(null);
    const currentPlayer = gameState?.players.find(p => p.id === currentPlayerId) || null;

    // Helper functions to filter rules and prompts based on player role
    const getVisibleRules = () => {
        if (!gameState?.rules || !currentPlayer) return [];

        // Host sees all rules, players see only their own
        if (currentPlayer.isHost) {
            return gameState.rules.filter(rule => !rule.isFiller);
        } else {
            // Use currentPlayerId as fallback if currentPlayer.id doesn't match
            const playerId = currentPlayer.id || socketService.getCurrentPlayerId();
            return gameState.rules.filter(rule => rule.authorId === playerId && !rule.isFiller);
        }
    };

    const getVisiblePrompts = () => {
        if (!gameState?.prompts || !currentPlayer) return [];

        // Host sees all prompts, players see only their own
        if (currentPlayer.isHost) {
            return gameState.prompts.filter(prompt => !prompt.isFiller);
        } else {
            return gameState.prompts.filter(prompt => prompt.authorId === currentPlayer.id && !prompt.isFiller);
        }
    };

    // Connect to socket on mount
    React.useEffect(() => {
        socketService.connect();
        // Listen for socket events
        socketService.setOnLobbyCreated(({ playerId, game }) => {
            setCurrentPlayerId(playerId);
            dispatch({ type: 'SET_GAME_STATE', payload: game });
        });
        socketService.setOnJoinedLobby(({ playerId, game }) => {
            setCurrentPlayerId(playerId);
            dispatch({ type: 'SET_GAME_STATE', payload: game });
        });
        socketService.setOnGameUpdated((game) => {
            dispatch({ type: 'SET_GAME_STATE', payload: game });
        });
        socketService.setOnGameStarted(() => {
            // When game starts, all players should navigate to rule writing screen
            // This will be handled by the navigation logic in the screens
        });
        return () => {
            socketService.disconnect();
        };
    }, []);

    // Create wheel segments when all non-host players have completed
    React.useEffect(() => {
        if (!gameState || !gameState.isGameStarted) return;

        const nonHostPlayers = gameState.players?.filter(player => !player.isHost) || [];
        const allNonHostPlayersCompleted = nonHostPlayers.every(player =>
            player.rulesCompleted && player.promptsCompleted
        );

        // Only create wheel segments if all non-host players have completed and segments haven't been created yet
        if (allNonHostPlayersCompleted && (gameState.wheelSegments?.length || 0) === 0) {
            // Add a small delay to ensure all rules and prompts are synced from the backend
            setTimeout(() => {
                dispatch({ type: 'CREATE_WHEEL_SEGMENTS' });
            }, 500);
        }
    }, [gameState?.players, gameState?.isGameStarted, gameState?.wheelSegments?.length, dispatch]);

    // No automatic test state initialization - will be created through UI

    const joinLobby = (code: string, playerName: string) => {
        socketService.joinLobby(code, playerName);
    };

    const createLobby = (playerName: string, numRules = 3, numPrompts = 3, startingPoints = 20) => {
        // Note: numRules, numPrompts, startingPoints can be sent to backend if supported
        socketService.createLobby(playerName);
    };

    const addTestPlayers = (numPlayers: number) => {
        if (!gameState || numPlayers <= 0) return;

        const testPlayerNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
        const newPlayers: Player[] = [];

        for (let i = 0; i < numPlayers; i++) {
            const testPlayer: Player = {
                id: Math.random().toString(36).substr(2, 9),
                name: testPlayerNames[i] || `Player ${i + 1}`,
                points: 20, // All players start at 20 points
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
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must speak in a different accent", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot use the letter 'E'", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must end every sentence with 'yo'", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must act like a robot", isActive: true, assignedTo: undefined, plaqueColor: "#fff", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot use contractions", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must speak in questions only", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must use hand gestures for everything", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot say 'yes' or 'no'", isActive: true, assignedTo: undefined, plaqueColor: "#fff", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must speak in third person", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot use past tense", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", isFiller: true, authorId: "system" },
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
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Convince everyone that pizza is actually a dessert", category: "Persuasion", plaqueColor: "#ed5c5d", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Explain how to make a sandwich without using your hands", category: "Instruction", plaqueColor: "#fff", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Describe your morning routine as if you're a superhero", category: "Storytelling", plaqueColor: "#6bb9d3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Argue that socks are actually tiny blankets for your feet", category: "Debate", plaqueColor: "#a861b3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Explain quantum physics using only food metaphors", category: "Education", plaqueColor: "#ed5c5d", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Describe your ideal vacation to a planet that doesn't exist", category: "Creative", plaqueColor: "#fff", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Convince everyone that time travel is just really good planning", category: "Persuasion", plaqueColor: "#6bb9d3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Explain why cats are secretly running the internet", category: "Conspiracy", plaqueColor: "#a861b3", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Describe your perfect day using only emojis", category: "Creative", plaqueColor: "#ed5c5d", isFiller: true, authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Argue that breakfast foods are acceptable at any time", category: "Debate", plaqueColor: "#fff", isFiller: true, authorId: "system" },
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

        const rules: Rule[] = [
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must speak in a different accent", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot use the letter 'E'", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must end every sentence with 'yo'", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must act like a robot", isActive: true, assignedTo: undefined, plaqueColor: "#fff", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot use contractions", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must speak in questions only", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must use hand gestures for everything", isActive: true, assignedTo: undefined, plaqueColor: "#ed5c5d", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot say 'yes' or 'no'", isActive: true, assignedTo: undefined, plaqueColor: "#fff", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Must speak in third person", isActive: true, assignedTo: undefined, plaqueColor: "#6bb9d3", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'rule', text: "Cannot use past tense", isActive: true, assignedTo: undefined, plaqueColor: "#a861b3", authorId: "system" },
        ];

        const prompts: Prompt[] = [
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Convince everyone that pizza is actually a dessert", category: "Persuasion", plaqueColor: "#ed5c5d", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Explain how to make a sandwich without using your hands", category: "Instruction", plaqueColor: "#fff", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Describe your morning routine as if you're a superhero", category: "Storytelling", plaqueColor: "#6bb9d3", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Argue that socks are actually tiny blankets for your feet", category: "Debate", plaqueColor: "#a861b3", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Explain quantum physics using only food metaphors", category: "Education", plaqueColor: "#ed5c5d", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Describe your ideal vacation to a planet that doesn't exist", category: "Creative", plaqueColor: "#fff", authorId: "system" },
            { id: Math.random().toString(36).substr(2, 9), type: 'prompt', text: "Convince everyone that time travel is just really good planning", category: "Persuasion", plaqueColor: "#6bb9d3", authorId: "system" },
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

    const createPlaque = (type: 'rule' | 'prompt', text: string, category?: string, plaqueColor?: string) => {
        const currentPlayerId = socketService.getCurrentPlayerId();
        if (!currentPlayerId) return;

        // Create plaque with generated ID, color, and values
        const plaqueId = Math.random().toString(36).substr(2, 9);
        const finalPlaqueColor = plaqueColor || getBalancedColor(type, gameState?.prompts || [], gameState?.rules || []);

        const plaque = {
            id: plaqueId,
            type: type,
            text: text,
            category: category,
            authorId: currentPlayerId,
            plaqueColor: finalPlaqueColor,
            isActive: type === 'rule' ? true : undefined
        };

        // Send plaque to backend
        socketService.addPlaque(plaque);
    };

    const addRule = (text: string, plaqueColor?: string) => {
        createPlaque('rule', text, undefined, plaqueColor);
    };

    const addPrompt = (text: string, category?: string, plaqueColor?: string) => {
        createPlaque('prompt', text, category, plaqueColor);
    };

    const updatePlaque = (id: string, text: string, type: 'rule' | 'prompt') => {
        if (type === 'rule') {
            // Find the existing rule to get its current data
            const existingRule = gameState?.rules.find(r => r.id === id);
            if (!existingRule || !existingRule.authorId || !existingRule.plaqueColor) return;

            // Create updated plaque with new text but same ID and other properties
            const updatedPlaque = {
                id: existingRule.id,
                type: 'rule' as const,
                text: text,
                isActive: existingRule.isActive,
                authorId: existingRule.authorId,
                plaqueColor: existingRule.plaqueColor
            };

            // Send updated plaque to backend
            socketService.updatePlaque(updatedPlaque);
        } else {
            // Find the existing prompt to get its current data
            const existingPrompt = gameState?.prompts.find(p => p.id === id);
            if (!existingPrompt || !existingPrompt.authorId || !existingPrompt.plaqueColor) return;

            // Create updated plaque with new text but same ID and other properties
            const updatedPlaque = {
                id: existingPrompt.id,
                type: 'prompt' as const,
                text: text,
                category: existingPrompt.category,
                authorId: existingPrompt.authorId,
                plaqueColor: existingPrompt.plaqueColor
            };

            // Send updated plaque to backend
            socketService.updatePlaque(updatedPlaque);
        }
    };

    const updateRule = (id: string, text: string) => {
        updatePlaque(id, text, 'rule');
    };

    const updatePrompt = (id: string, text: string) => {
        updatePlaque(id, text, 'prompt');
    };

    const startGame = () => {
        if (!gameState) return;
        // Use socket service to start the game for all players
        socketService.startGame();
    };

    const spinWheel = () => {
        if (!gameState) return;

        // Send to backend via socket service
        socketService.spinWheel();

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
        // Also sync to backend via socket service
        socketService.updatePoints(playerId, points);
    };

    const swapRules = (player1Id: string, player2Id: string) => {
        if (!gameState) return;

        const player1 = gameState.players.find((p: Player) => p.id === player1Id);
        const player2 = gameState.players.find((p: Player) => p.id === player2Id);

        if (player1 && player2) {
            // Send to backend via socket service
            socketService.swapRules(player1Id, player2Id);
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
            // Send to backend via socket service
            socketService.assignRule(ruleId, targetPlayerId);
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
            // Send to backend via socket service
            socketService.assignRule(ruleId, playerId);
        }
    };

    const assignRuleToCurrentPlayer = (ruleId: string) => {
        if (!gameState || !gameState.currentPlayer) return;

        const rule = gameState.rules.find(r => r.id === ruleId);
        if (rule) {
            // Send to backend via socket service
            socketService.assignRuleToCurrentPlayer(ruleId);
        }
    };

    const removeWheelLayer = (segmentId: string) => {
        dispatch({ type: 'REMOVE_WHEEL_LAYER', payload: segmentId });
        // Also sync to backend via socket service
        socketService.removeWheelLayer(segmentId);
    };

    const endGame = () => {
        if (!gameState || !gameState.currentPlayer) return;

        const winner = gameState.players.find(p => p.id === gameState.currentPlayer);
        if (winner) {
            dispatch({ type: 'END_GAME', payload: winner });
        }
    };

    const markRulesCompleted = () => {
        if (!gameState) return;
        socketService.markRulesCompleted();
    };

    const markPromptsCompleted = () => {
        if (!gameState) return;
        socketService.markPromptsCompleted();
    };

    return (
        <GameContext.Provider value={{
            gameState,
            currentPlayer,
            dispatch,
            getVisibleRules,
            getVisiblePrompts,
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
            markRulesCompleted,
            markPromptsCompleted,
        }}>
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