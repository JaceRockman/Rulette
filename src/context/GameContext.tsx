import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Player, Prompt, Rule, StackItem, GameEvent, WheelSegment, WheelSegmentLayer, Modifier, Plaque } from '../types/game';
import socketService from '../services/socketService';
import { colors, LAYER_PLAQUE_COLORS, SEGMENT_COLORS } from '../shared/styles';
import { endPlaque, allModifiers, examplePrompts, exampleRules, testingState } from '../../test/data';

interface GameContextType {
    gameState: GameState | null;
    currentUser: Player | null;
    activePlayer: Player | null;
    dispatch: React.Dispatch<GameAction>;
    getWrittenRules: () => Rule[];
    getWrittenPrompts: () => Prompt[];
    getNonHostPlayers: () => Player[] | null | undefined;
    getHostPlayer: () => Player | null | undefined;
    joinLobby: (lobbyCode: string, playerName: string) => void;
    createLobby: (playerName: string, numRules?: number, numPrompts?: number, startingPoints?: number) => void;
    createTestingState: () => void;
    setNumRules: (num: number) => void;
    setNumPrompts: (num: number) => void;
    addRule: (text: string, plaqueColor: string) => void;
    addPrompt: (text: string, plaqueColor: string) => void;
    updatePlaque: (id: string, text: string, type: 'rule' | 'prompt') => void;
    startGame: (settings?: { numRules?: number; numPrompts?: number; startingPoints?: number }) => void;
    synchronizedSpinWheel: (finalIndex: number, duration: number) => void;
    updatePoints: (playerId: string, points: number) => void;
    swapRules: (player1Id: string, player1RuleId: string, player2Id: string, player2RuleId: string) => void;
    cloneRuleToPlayer: (ruleId: string, targetPlayerId: string) => void;
    shredRule: (ruleId: string) => void;
    assignRule: (ruleId: string, playerId: string) => void;
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
    | { type: 'ADD_RULE'; payload: Rule }
    | { type: 'ADD_PROMPT'; payload: Prompt }
    | { type: 'ADD_MODIFIER'; payload: Modifier }
    | { type: 'UPDATE_RULE'; payload: Rule }
    | { type: 'UPDATE_PROMPT'; payload: Prompt }
    | { type: 'SPIN_WHEEL'; payload: StackItem[] }
    | { type: 'SYNCHRONIZED_WHEEL_SPIN'; payload: { spinningPlayerId: string; finalIndex: number; duration: number } }
    | { type: 'UPDATE_POINTS'; payload: { playerId: string; points: number } }
    | { type: 'SET_CURRENT_USER'; payload: string }
    | { type: 'SET_ACTIVE_PLAYER'; payload: string }
    | { type: 'RESET_GAME' }
    | { type: 'SET_NUM_RULES'; payload: number }
    | { type: 'SET_NUM_PROMPTS'; payload: number }
    | { type: 'REMOVE_WHEEL_LAYER'; payload: string }
    | { type: 'END_GAME'; payload: Player }
    | { type: 'CREATE_WHEEL_SEGMENTS' }
    | { type: 'SET_HOST'; payload: string }
    | { type: 'MARK_RULES_COMPLETED'; payload: string }
    | { type: 'MARK_PROMPTS_COMPLETED'; payload: string }
    | { type: 'ADD_RULES'; payload: Rule[] }
    | { type: 'ADD_PROMPTS'; payload: Prompt[] };

export const initialState: GameState = {
    id: '',
    lobbyCode: '',
    players: [],
    prompts: [],
    rules: [],
    modifiers: [],
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

        case 'ADD_RULE':
            return {
                ...state,
                rules: [...(state.rules || []), action.payload],
            };

        case 'ADD_RULES':
            return {
                ...state,
                rules: [...(state.rules || []), ...action.payload],
            };

        case 'ADD_PROMPT':
            return {
                ...state,
                prompts: [...(state.prompts || []), action.payload],
            };

        case 'ADD_PROMPTS':
            return {
                ...state,
                prompts: [...(state.prompts || []), ...action.payload],
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

        case 'SPIN_WHEEL':
            return {
                ...state,
                isWheelSpinning: true,
                currentStack: action.payload,
            };

        case 'SYNCHRONIZED_WHEEL_SPIN':
            return {
                ...state,
                isWheelSpinning: true,
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

        case 'SET_CURRENT_USER':
            return {
                ...state,
                currentUser: action.payload,
            };

        case 'SET_ACTIVE_PLAYER':
            return {
                ...state,
                activePlayer: action.payload,
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
            if (!state.rules || !state.prompts || !state.modifiers) {
                console.error('GameContext: No rules, prompts, or modifiers found');
                return state;
            }

            // Create wheel segments with layers
            const newSegments: WheelSegment[] = [];

            // Ensure rules and prompts arrays exist
            const rules = state.rules;
            const prompts = state.prompts;
            const modifiers = state.modifiers;
            let totalSegments = Math.max(rules.length, prompts.length, 1); // At least 1 segment

            // Make total segments divisible by 4
            const remainder = totalSegments % 4;
            if (remainder !== 0) {
                totalSegments += (4 - remainder);
            }

            for (let i = 0; i < totalSegments; i++) {
                const layers: WheelSegmentLayer[] = [];

                addRuleLayer(layers, rules, i);
                addPromptLayer(layers, prompts, i);
                addModifierLayer(layers, i);
                addEndLayer(layers);

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

function getBalancedColor(plaques: Plaque[]): string {
    // Count existing colors
    const colorCount: { [color: string]: number } = {};
    LAYER_PLAQUE_COLORS.forEach(color => {
        colorCount[color] = 0;
    });

    plaques.forEach(plaque => {
        colorCount[plaque.plaqueColor]++;
    });

    // Find colors with minimum usage
    const minCount = Math.min(...Object.values(colorCount));
    const availableColors = LAYER_PLAQUE_COLORS.filter(color => colorCount[color] === minCount);

    // Randomly select from available colors
    return availableColors[Math.floor(Math.random() * availableColors.length)];
}

function addRuleLayer(layers: WheelSegmentLayer[], rules: Rule[], index: number) {
    if (rules.length === 0) {
        return;
    }

    const rulePlaqueColor = rules[index].plaqueColor || LAYER_PLAQUE_COLORS[index % LAYER_PLAQUE_COLORS.length];

    if (index < rules.length) {
        const ruleContent = { ...rules[index], plaqueColor: rulePlaqueColor };
        layers.push({
            type: 'rule',
            content: ruleContent,
            isActive: true,
        });
    } else {
        if (exampleRules.length === 0) {
            throw new Error('No rules found');
        }

        const fillerRule = exampleRules[index % exampleRules.length];
        const fillerRuleContent = { ...fillerRule, plaqueColor: fillerRule.plaqueColor };
        layers.push({
            type: 'rule',
            content: fillerRuleContent,
            isActive: true,
        });
    }
}

function addPromptLayer(layers: WheelSegmentLayer[], prompts: Prompt[], index: number) {
    if (prompts.length === 0) {
        return;
    }

    const promptPlaqueColor = prompts[index].plaqueColor || LAYER_PLAQUE_COLORS[index % LAYER_PLAQUE_COLORS.length];

    if (index < prompts.length) {
        const promptContent = { ...prompts[index], plaqueColor: promptPlaqueColor };
        layers.push({
            type: 'prompt',
            content: promptContent,
            isActive: true,
        });
    } else {
        if (examplePrompts.length === 0) {
            throw new Error('No prompts found');
        }

        const fillerPrompt = examplePrompts[index % examplePrompts.length];
        const fillerPromptContent = { ...fillerPrompt, plaqueColor: fillerPrompt.plaqueColor };
        layers.push({
            type: 'prompt',
            content: fillerPromptContent,
            isActive: true,
        });
    }
}

function addModifierLayer(layers: WheelSegmentLayer[], index: number) {
    if (allModifiers.length === 0) {
        throw new Error('No modifiers found');
    }

    const nextModifier = allModifiers[index % allModifiers.length];
    layers.push({
        type: 'modifier',
        content: nextModifier,
        isActive: true,
    });
}

function addEndLayer(layers: WheelSegmentLayer[]) {
    layers.push({
        type: 'end',
        content: endPlaque,
        isActive: true,
    });
}

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [gameState, dispatch] = useReducer(gameReducer, initialState);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const currentUser = gameState?.players.find(p => p.id === currentUserId) || null;
    const activePlayer = gameState?.players.find(p => p.id === gameState?.activePlayer) || null;
    // Connect to socket on mount
    React.useEffect(() => {

        socketService.connect();
        // Listen for socket events
        socketService.setOnLobbyCreated(({ playerId, game }) => {
            setCurrentUserId(playerId);
            dispatch({ type: 'SET_GAME_STATE', payload: game });
        });
        socketService.setOnJoinedLobby(({ playerId, game }) => {
            setCurrentUserId(playerId);
            dispatch({ type: 'SET_GAME_STATE', payload: game });
        });
        socketService.setOnGameUpdated((game) => {
            dispatch({ type: 'SET_GAME_STATE', payload: game });
        });
        socketService.setOnWheelSpun((stack) => {
            dispatch({ type: 'SPIN_WHEEL', payload: stack });
        });
        socketService.setOnSynchronizedWheelSpin((data) => {
            console.log('GameContext: Dispatching SYNCHRONIZED_WHEEL_SPIN action at:', new Date().toISOString());
            console.log('GameContext: SYNCHRONIZED_WHEEL_SPIN data:', data);
            dispatch({ type: 'SYNCHRONIZED_WHEEL_SPIN', payload: data });
        });
        socketService.setOnNavigateToScreen((data) => {
            // Handle navigation to different screens
            // This will be handled by individual screens that need to respond to navigation
        });
        return () => {
            socketService.disconnect();
        };
    }, []);

    // Helper functions to filter rules and prompts based on player role
    const getWrittenRules = () => {
        if (!gameState?.rules || !currentUser) return [];

        // Host sees all rules, players see only their own
        if (currentUser.isHost) {
            return gameState.rules.filter(rule => rule.authorId !== 'system');
        } else {
            return gameState.rules.filter(rule => rule.authorId === currentUser.id);
        }
    };

    const getWrittenPrompts = () => {
        if (!gameState?.prompts || !currentUser) return [];

        // Host sees all prompts, players see only their own
        if (currentUser.isHost) {
            return gameState.prompts.filter(prompt => prompt.authorId !== 'system');
        } else {
            return gameState.prompts.filter(prompt => prompt.authorId === currentUser.id);
        }
    };

    function getNonHostPlayers(): Player[] | null | undefined {
        if (!gameState?.players) return [];
        return gameState.players.filter(player => !player.isHost);
    };

    function getHostPlayer(): Player | null | undefined {
        if (!gameState?.players) return null;
        return gameState.players.find(player => player.isHost);
    };

    // Create wheel segments when all non-host players have completed
    React.useEffect(() => {
        if (!gameState) return;
        if (!gameState.players) return;
        if (!gameState.wheelSegments) return;
        if (!gameState.isGameStarted) return;

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

        socketService.syncWheelSegments(gameState.wheelSegments);
    }, [gameState?.players, gameState?.isGameStarted, gameState?.wheelSegments?.length, dispatch]);

    const joinLobby = (lobbyCode: string, playerName: string) => {
        socketService.joinLobby(lobbyCode, playerName);
    };

    const createLobby = (playerName: string, numRules = 3, numPrompts = 3, startingPoints = 20) => {
        // Note: numRules, numPrompts, startingPoints can be sent to backend if supported
        socketService.createLobby(playerName);
    };

    const createTestingState = () => {
        const testingGameState = testingState();
        dispatch({ type: 'SET_GAME_STATE', payload: testingGameState });
        dispatch({ type: 'CREATE_WHEEL_SEGMENTS' });
    };

    const setNumRules = (num: number) => {
        dispatch({ type: 'SET_NUM_RULES', payload: num });
    };

    const setNumPrompts = (num: number) => {
        dispatch({ type: 'SET_NUM_PROMPTS', payload: num });
    };

    const createPlaque = (type: 'rule' | 'prompt' | 'modifier', text: string, plaqueColor: string) => {
        const currentPlayerId = socketService.getCurrentPlayerId();
        if (!currentPlayerId) return;

        // Create plaque with generated ID, color, and values
        const plaqueId = Math.random().toString(36).substring(2, 15);
        let plaques: Plaque[] = [];
        switch (type) {
            case 'rule':
                plaques = gameState?.rules;
            case 'prompt':
                plaques = gameState?.prompts;
            case 'modifier':
                plaques = gameState?.modifiers;
        }

        const finalPlaqueColor = plaqueColor || getBalancedColor(plaques);

        const plaque = {
            id: plaqueId,
            type: type,
            text: text,
            authorId: currentPlayerId,
            plaqueColor: finalPlaqueColor,
            isActive: type === 'rule' ? true : undefined
        };

        // Send plaque to backend
        socketService.addPlaque(plaque);
    };

    const addRule = (text: string, plaqueColor: string) => {
        createPlaque('rule', text, plaqueColor);
    };

    const addPrompt = (text: string, plaqueColor: string) => {
        createPlaque('prompt', text, plaqueColor);
    };

    const updatePlaque = (id: string, text: string, type: 'rule' | 'prompt') => {
        if (type === 'rule') {
            // Find the existing rule to get its current data
            const existingRule = gameState?.rules.find(r => r.id === id);
            if (!existingRule) return;

            // Create updated plaque with new text but same ID and other properties
            const updatedPlaque = { ...existingRule, text: text };

            // Send updated plaque to backend
            socketService.updatePlaque(updatedPlaque);
        } else {
            // Find the existing prompt to get its current data
            const existingPrompt = gameState?.prompts.find(p => p.id === id);
            if (!existingPrompt) return;

            // Create updated plaque with new text but same ID and other properties
            const updatedPlaque = { ...existingPrompt, text: text };

            // Send updated plaque to backend
            socketService.updatePlaque(updatedPlaque);
        }
    };

    const startGame = (settings?: { numRules?: number; numPrompts?: number; startingPoints?: number }) => {
        if (!gameState) return;

        // Use socket service to start the game with settings (server will update settings and start game)
        socketService.startGame(settings);
    };

    const synchronizedSpinWheel = (finalIndex: number, duration: number) => {
        dispatch({ type: 'SYNCHRONIZED_WHEEL_SPIN', payload: { spinningPlayerId: currentUserId || '', finalIndex, duration } });
    };

    const updatePoints = (playerId: string, points: number) => {
        dispatch({ type: 'UPDATE_POINTS', payload: { playerId, points } });
        // Also sync to backend via socket service
        socketService.updatePoints(playerId, points);
    };

    const swapRules = (player1Id: string, player1RuleId: string, player2Id: string, player2RuleId: string) => {
        if (!gameState) return;

        const player1 = gameState.players.find((p: Player) => p.id === player1Id);
        const player2 = gameState.players.find((p: Player) => p.id === player2Id);

        if (player1 && player2) {
            // Send to backend via socket service
            socketService.swapRules(player1Id, player1RuleId, player2Id, player2RuleId);
        }
    };

    const cloneRuleToPlayer = (ruleId: string, targetPlayerId: string) => {
        if (!gameState || !gameState.activePlayer) return;

        const rule: Rule | undefined = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (!rule) return;

        const newRule: Rule = { ...rule, id: Math.random().toString(36).substring(2, 15) };
        addRule(newRule.text, newRule.plaqueColor);
        socketService.assignRule(newRule.id, targetPlayerId);
    };

    const shredRule = (ruleId: string) => {
        if (!gameState) return;

        const rule = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (rule) {
            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: undefined, isActive: false } });
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

    const removeWheelLayer = (segmentId: string) => {
        dispatch({ type: 'REMOVE_WHEEL_LAYER', payload: segmentId });
        // Also sync to backend via socket service
        socketService.removeWheelLayer(segmentId);
    };

    const endGame = () => {
        if (!gameState || !gameState.activePlayer) return;

        const winner = gameState.players.find(p => p.id === gameState.activePlayer);
        if (winner) {
            dispatch({ type: 'END_GAME', payload: winner });
        } else {
            dispatch({ type: 'END_GAME', payload: gameState.players.find(p => p.isHost) || gameState.players[0] });
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
            currentUser,
            activePlayer,
            dispatch,
            getWrittenRules,
            getWrittenPrompts,
            getNonHostPlayers,
            getHostPlayer,
            joinLobby,
            createLobby,
            createTestingState,
            setNumRules,
            setNumPrompts,
            addRule,
            addPrompt,
            updatePlaque,
            startGame,
            synchronizedSpinWheel,
            updatePoints,
            swapRules,
            cloneRuleToPlayer,
            shredRule,
            assignRule,
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