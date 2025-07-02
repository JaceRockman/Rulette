import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Player, Prompt, Rule, StackItem, GameEvent } from '../types/game';

interface GameContextType {
    gameState: GameState | null;
    currentPlayer: Player | null;
    dispatch: React.Dispatch<GameAction>;
    joinLobby: (code: string, playerName: string) => void;
    createLobby: (playerName: string, numRules?: number, numPrompts?: number, startingPoints?: number) => void;
    setNumRules: (num: number) => void;
    setNumPrompts: (num: number) => void;
    addPrompt: (text: string, category?: string) => void;
    addRule: (text: string) => void;
    startGame: () => void;
    spinWheel: () => void;
    updatePoints: (playerId: string, points: number) => void;
    swapRules: (player1Id: string, player2Id: string) => void;
    assignRule: (ruleId: string, playerId: string) => void;
    assignRuleToCurrentPlayer: (ruleId: string) => void;
}

type GameAction =
    | { type: 'SET_GAME_STATE'; payload: GameState }
    | { type: 'UPDATE_PLAYER'; payload: Player }
    | { type: 'ADD_PLAYER'; payload: Player }
    | { type: 'REMOVE_PLAYER'; payload: string }
    | { type: 'ADD_PROMPT'; payload: Prompt }
    | { type: 'ADD_RULE'; payload: Rule }
    | { type: 'UPDATE_RULE'; payload: Rule }
    | { type: 'START_GAME' }
    | { type: 'SPIN_WHEEL'; payload: StackItem[] }
    | { type: 'UPDATE_POINTS'; payload: { playerId: string; points: number } }
    | { type: 'SET_CURRENT_PLAYER'; payload: string }
    | { type: 'RESET_GAME' }
    | { type: 'SET_NUM_RULES'; payload: number }
    | { type: 'SET_NUM_PROMPTS'; payload: number };

const initialState: GameState = {
    id: '',
    code: '',
    players: [],
    prompts: [],
    rules: [],
    isGameStarted: false,
    isWheelSpinning: false,
    currentStack: [],
    roundNumber: 0,
    numRules: 3,
    numPrompts: 3,
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

        default:
            return state;
    }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [gameState, dispatch] = useReducer(gameReducer, initialState);

    const currentPlayer = gameState?.players.find(p => p.id === gameState.currentPlayer) || null;

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

    const setNumRules = (num: number) => {
        dispatch({ type: 'SET_NUM_RULES', payload: num });
    };
    const setNumPrompts = (num: number) => {
        dispatch({ type: 'SET_NUM_PROMPTS', payload: num });
    };

    const addPrompt = (text: string, category?: string) => {
        const prompt: Prompt = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            category,
        };
        dispatch({ type: 'ADD_PROMPT', payload: prompt });
    };

    const addRule = (text: string) => {
        const rule: Rule = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            isActive: true,
        };
        dispatch({ type: 'ADD_RULE', payload: rule });
    };

    const startGame = () => {
        dispatch({ type: 'START_GAME' });
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
            const modifiers = ['Double Points', 'Skip Turn', 'Reverse Order', 'Free Pass'];
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

    const value: GameContextType = {
        gameState,
        currentPlayer,
        dispatch,
        joinLobby,
        createLobby,
        setNumRules,
        setNumPrompts,
        addPrompt,
        addRule,
        startGame,
        spinWheel,
        updatePoints,
        swapRules,
        assignRule,
        assignRuleToCurrentPlayer,
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