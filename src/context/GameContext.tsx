import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Player, Prompt, Rule, StackItem, WheelSegment, WheelSegmentLayer, Modifier, Plaque, AccusationDetails } from '../types/game';
import socketService from '../services/socketService';
import { colors, LAYER_PLAQUE_COLORS, SEGMENT_COLORS } from '../shared/styles';
import { endPlaque, allModifiers, examplePrompts, exampleRules, testingState } from '../../test/data';

interface GameContextType {
    gameState: GameState | null;
    currentUser: Player | null;
    activePlayer: Player | null;
    showExitGameModal: boolean;
    setShowExitGameModal: (show: boolean) => void;
    getBalancedColor: (plaqueType: 'rule' | 'prompt') => string;
    dispatch: React.Dispatch<GameAction>;
    getRulesByAuthor: (authorId: string) => Rule[];
    getPromptsByAuthor: (authorId: string) => Prompt[];
    getAssignedRulesByPlayer: (playerId: string) => Rule[];
    getNonHostPlayers: () => Player[] | null | undefined;
    getHostPlayer: () => Player | null | undefined;
    addRule: (authorId: string, text: string, plaqueColor: string) => void;
    addPrompt: (authorId: string, text: string, plaqueColor: string) => void;
    updateRule: (id: string, text: string) => void;
    updatePrompt: (id: string, text: string) => void;
    synchronizedSpinWheel: (finalIndex: number, duration: number) => void;
    initiateAccusation: (accusationDetails: AccusationDetails) => void;
    acceptAccusation: () => void;
    declineAccusation: () => void;
    updatePoints: (playerId: string, points: number) => void;
    swapRules: (player1Id: string, player1RuleId: string, player2Id: string, player2RuleId: string) => void;
    cloneRuleToPlayer: (authorId: string, ruleId: string, targetPlayerId: string) => void;
    shredRule: (ruleId: string) => void;
    assignRule: (ruleId: string, playerId: string) => void;
    removeWheelLayer: (segmentId: string) => void;
    endGame: () => void;
    markRulesCompletedForUser: (userId: string) => void;
    markPromptsCompletedForUser: (userId: string) => void;
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

function createWheelSegments(state: GameState): WheelSegment[] {
    if (!state.rules || !state.prompts || !state.modifiers) {
        throw new Error('No rules, prompts, or modifiers found');
    }

    const newSegments: WheelSegment[] = [];
    const rules = state.rules;
    const prompts = state.prompts;
    const modifiers = state.modifiers;
    let totalSegments = Math.max(rules.length, prompts.length, 1);

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

    return newSegments;
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
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(socketService.getCurrentUserId());
    const currentUser = gameState?.players.find(p => p.id === currentUserId) || null;
    const activePlayer = gameState?.players.find(p => p.id === gameState?.activePlayer) || null;
    const [showExitGameModal, setShowExitGameModal] = React.useState(false);
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

    // Create wheel segments when all non-host players have completed
    React.useEffect(() => {
        if (!currentUser?.isHost) return;

        const nonHostPlayers = getNonHostPlayers() || [];
        if (nonHostPlayers.length === 0) return;

        const allNonHostPlayersCompleted = nonHostPlayers.every(player =>
            player.rulesCompleted && player.promptsCompleted
        );

        if (allNonHostPlayersCompleted && (gameState.wheelSegments?.length || 0) === 0) {
            const generatedWheelSegments = createWheelSegments(gameState);
            socketService.syncWheelSegments(generatedWheelSegments);
        } else {
            throw new Error('All non-host players must have completed their rules and prompts before wheel segments can be created');
        }
    }, [gameState?.players, gameState?.isGameStarted, gameState?.wheelSegments?.length, dispatch]);

    // Helper functions used in multiple places
    const getBalancedColor = (plaqueType: 'rule' | 'prompt'): string => {
        let plaques: Plaque[] = [];
        if (plaqueType === 'rule') {
            plaques = gameState?.rules || [];
        } else if (plaqueType === 'prompt') {
            plaques = gameState?.prompts || [];
        } else {
            throw new Error('Invalid plaque type');
        }

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
        const selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];

        // Randomly select from available colors
        return selectedColor;
    };

    const getRulesByAuthor = (authorId: string) => {
        if (!gameState?.rules || !currentUser) return [];

        // Host sees all rules, players see only their own
        if (currentUser.isHost) {
            return gameState.rules.filter(rule => rule.authorId === authorId);
        } else {
            return gameState.rules.filter(rule => rule.authorId === authorId);
        }
    };

    const getPromptsByAuthor = (authorId: string) => {
        if (!gameState?.prompts || !currentUser) return [];

        // Host sees all prompts, players see only their own
        if (currentUser.isHost) {
            return gameState.prompts.filter(prompt => prompt.authorId !== 'system');
        } else {
            return gameState.prompts.filter(prompt => prompt.authorId === currentUser.id);
        }
    };

    const getNonHostPlayers = (): Player[] | null | undefined => {
        return gameState.players.filter(player => !player.isHost);
    };

    const getHostPlayer = (): Player | null | undefined => {
        return gameState.players.find(player => player.isHost);
    };

    const getAssignedRulesByPlayer = (playerId: string) => {
        return gameState.rules.filter(rule => rule.assignedTo?.id === playerId);
    };

    const createPlaque = (type: 'rule' | 'prompt' | 'modifier', authorId: string = 'system', text: string, plaqueColor: string) => {
        const plaqueId = Math.random().toString(36).substring(2, 15);
        const plaque: Plaque = {
            id: plaqueId,
            type: type,
            text: text,
            authorId: authorId,
            plaqueColor: plaqueColor,
            isActive: type === 'rule' ? true : undefined
        };

        socketService.addPlaque(plaque);
    };

    const updatePlaque = (type: 'rule' | 'prompt', id: string, text: string) => {
        if (type === 'rule') {
            const existingRule = gameState?.rules.find(r => r.id === id);
            if (!existingRule) throw new Error('Rule not found');

            const updatedPlaque = { ...existingRule, text: text };

            socketService.updatePlaque(updatedPlaque);
        } else {
            const existingPrompt = gameState?.prompts.find(p => p.id === id);
            if (!existingPrompt) throw new Error('Prompt not found');

            const updatedPlaque = { ...existingPrompt, text: text };

            socketService.updatePlaque(updatedPlaque);
        }
    };

    const markRulesCompletedForUser = (userId: string) => {
        if (!gameState) return;
        socketService.markRulesCompletedForUser(userId);
    };

    const markPromptsCompletedForUser = (userId: string) => {
        if (!gameState) return;
        socketService.markPromptsCompletedForUser(userId);
    };

    const addRule = (authorId: string = 'system', text: string, plaqueColor: string) => {
        createPlaque('rule', authorId, text, plaqueColor);
    };

    const updateRule = (id: string, text: string) => {
        updatePlaque('rule', id, text);
    };

    const assignRule = (ruleId: string, playerId: string) => {
        if (!gameState) return;
        socketService.assignRule(ruleId, playerId);
    };

    const addPrompt = (authorId: string = 'system', text: string, plaqueColor: string) => {
        createPlaque('prompt', authorId, text, plaqueColor);
    };

    const updatePrompt = (id: string, text: string) => {
        updatePlaque('prompt', id, text);
    };

    const givePrompt = (promptId: string, playerId: string) => {
        socketService.givePrompt(playerId, promptId);
    };

    const triggerCloneModifier = (modifierId: string, playerId: string) => {
        socketService.triggerCloneModifier(modifierId, playerId);
    };

    const triggerSwapModifier = (modifierId: string, playerId: string) => {
        socketService.triggerSwapModifier(modifierId, playerId);
    };

    const triggerFlipModifier = (modifierId: string, playerId: string) => {
        socketService.triggerFlipModifier(modifierId, playerId);
    };

    const triggerUpModifier = (modifierId: string, playerId: string) => {
        socketService.triggerUpModifier(modifierId, playerId);
    };

    const triggerDownModifier = (modifierId: string, playerId: string) => {
        socketService.triggerDownModifier(modifierId, playerId);
    };

    const synchronizedSpinWheel = (finalIndex: number, duration: number) => {
        dispatch({ type: 'SYNCHRONIZED_WHEEL_SPIN', payload: { spinningPlayerId: currentUserId || '', finalIndex, duration } });
    };

    const initiateAccusation = (accusationDetails: AccusationDetails) => {
        if (!gameState) return;

        if (gameState.activeAccusationDetails) {
            throw new Error('Accusation already in progress');
        }

        socketService.startAccusation(accusationDetails);
    };

    const acceptAccusation = (accusationDetails: AccusationDetails) => {
        socketService.acceptAccusation(accusationDetails);
    };

    const declineAccusation = (accusationDetails: AccusationDetails) => {
        socketService.declineAccusation(accusationDetails);
    };

    const updatePoints = (playerId: string, points: number) => {
        if (!gameState) return;
        if (points < 0) throw new Error('Points must be greater than or equal to 0');
        if (points > 99) throw new Error('Points must be less than 100');

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

    const cloneRuleToPlayer = (authorId: string = 'system', ruleId: string, targetPlayerId: string) => {
        if (!gameState || !gameState.activePlayer) return;

        const rule: Rule | undefined = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (!rule) return;

        const newRule: Rule = { ...rule, id: Math.random().toString(36).substring(2, 15) };
        addRule(authorId, newRule.text, newRule.plaqueColor);
        socketService.assignRule(newRule.id, targetPlayerId);
    };

    const shredRule = (ruleId: string) => {
        if (!gameState) return;

        const rule = gameState.rules.find((r: Rule) => r.id === ruleId);
        if (rule) {
            dispatch({ type: 'UPDATE_RULE', payload: { ...rule, assignedTo: undefined, isActive: false } });
        }
    };

    const removeWheelLayer = (segmentId: string) => {
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

    return (
        <GameContext.Provider value={{
            gameState,
            currentUser,
            activePlayer,
            dispatch,
            getBalancedColor,
            getRulesByAuthor,
            getPromptsByAuthor,
            getAssignedRulesByPlayer,
            getNonHostPlayers,
            getHostPlayer,
            addRule,
            addPrompt,
            updateRule,
            updatePrompt,
            synchronizedSpinWheel,
            initiateAccusation,
            acceptAccusation,
            declineAccusation,
            updatePoints,
            swapRules,
            cloneRuleToPlayer,
            shredRule,
            assignRule,
            removeWheelLayer,
            endGame,
            markRulesCompletedForUser,
            markPromptsCompletedForUser,
            showExitGameModal,
            setShowExitGameModal,
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