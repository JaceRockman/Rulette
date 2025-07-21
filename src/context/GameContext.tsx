import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, Player, Prompt, Rule, StackItem, WheelSegment, Modifier, Plaque, ActiveAccusationDetails, ActiveCloneRuleDetails, ActiveFlipRuleDetails, ActiveSwapRuleDetails, ActiveUpDownRuleDetails, WheelSpinDetails, ActivePromptDetails } from '../types/game';
import socketService from '../services/socketService';
import { colors, LAYER_PLAQUE_COLORS, SEGMENT_COLORS } from '../shared/styles';
import { endPlaque, allModifiers, examplePrompts, exampleRules, testingState, generateModifierPlaque } from '../../test/data';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert } from 'react-native';

type RuleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

interface GameContextType {
    gameState: GameState | null;
    currentUser: Player | null;
    activePlayer: Player | null;
    showExitGameModal: boolean;
    dispatch: React.Dispatch<GameAction>;

    getNonHostPlayers: () => Player[] | null | undefined;
    getHostPlayer: () => Player | null | undefined;

    setShowExitGameModal: (show: boolean) => void;
    setPlayerModal: (playerId: string, modalName?: string) => void;
    getBalancedColor: (plaqueType: 'rule' | 'prompt') => string;

    getRulesByAuthor: (authorId: string) => Rule[];
    getPromptsByAuthor: (authorId: string) => Prompt[];
    getAssignedRulesByPlayer: (playerId: string) => Rule[];
    markRulesCompletedForUser: (userId: string) => void;
    markPromptsCompletedForUser: (userId: string) => void;

    addRule: (authorId: string, text: string, plaqueColor: string) => void;
    addPrompt: (authorId: string, text: string, plaqueColor: string) => void;
    updateRule: (id: string, text: string) => void;
    updatePrompt: (id: string, text: string) => void;
    assignRule: (ruleId: string, playerId: string) => void;

    removeWheelLayer: (segmentId: string) => void;

    completeWheelSpin: (segmentId?: string) => void;

    updatePoints: (playerId: string, points: number) => void;

    initiateAccusation: (accusationDetails: ActiveAccusationDetails) => void;
    acceptAccusation: () => void;
    endAccusation: () => void;

    givePrompt: (playerId: string, promptId: string) => void;
    updateActivePromptDetails: (details: ActivePromptDetails | undefined) => void;
    acceptPrompt: () => void;
    shredRule: (ruleId: string) => void;
    endPrompt: () => void;
    possiblyReturnToPrompt: () => void;

    triggerCloneModifier: (player: Player, rule?: Rule, modifierId?: string) => void;
    updateActiveCloningDetails: (details: ActiveCloneRuleDetails) => void;
    cloneRuleToPlayer: (rule: Rule, targetPlayer: Player, authorId?: string) => void;
    endCloneRule: () => void;

    triggerFlipModifier: (player: Player, rule?: Rule, modifierId?: string) => void;
    updateActiveFlippingDetails: (details: ActiveFlipRuleDetails) => void;
    flipRule: (rule: Rule, flippedText: string) => void;
    endFlipRule: () => void;

    triggerSwapModifier: (player: Player, rule?: Rule, modifierId?: string) => void;
    updateActiveSwappingDetails: (details: ActiveSwapRuleDetails) => void;
    swapRules: (player1Id: string, player1RuleId: string, player2Id: string, player2RuleId: string) => void;
    endSwapRule: () => void;

    triggerUpDownModifier: (direction: 'up' | 'down') => void;
    updateActiveUpDownDetails: (details: ActiveUpDownRuleDetails) => void;
    endUpDownRule: () => void;

    endGame: () => void;
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
    ends: [],
    playerInputCompleted: false,
    wheelSegments: [],
    isGameStarted: false,
    isWheelSpinning: false,
    currentStack: [],
    roundNumber: 0,
    settings: {
        numSegments: 4,
        numRulesPerPlayer: 0,
        numPromptsPerPlayer: 0,
        startingPoints: 20,
    },
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
            return { ...state, settings: { ...state.settings, numSegments: action.payload } };
        case 'SET_NUM_PROMPTS':
            return { ...state, settings: { ...state.settings, numSegments: action.payload } };

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

export function GameProvider({ children }: { children: React.ReactNode }) {
    const navigation = useNavigation<RuleScreenNavigationProp>();
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
            console.log('GameContext: ' + game);
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
        socketService.setOnNavigateToScreen((data: { screen: string; params?: any }) => {
            console.log('GameContext: Navigating to screen:', data);
            if (data.screen && navigation) {
                navigation.navigate(data.screen as keyof RootStackParamList, data.params);
            }
        });
        socketService.setOnNavigatePlayerToScreen((data: { screen: string; playerId: string; params?: any }) => {
            console.log('GameContext: Navigating to screen:', data);
            if (currentUser?.id !== data.playerId) {
                if (data.screen && navigation) {
                    navigation.navigate(data.screen as keyof RootStackParamList, data.params);
                }
            }
        });
        return () => {
            socketService.disconnect();
        };
    }, []);



    // Add plaques for segments when player input is completed
    React.useEffect(() => {
        if (gameState.playerInputCompleted && currentUser?.isHost) {
            addPlaquesForSegments();
        }
    }, [gameState?.playerInputCompleted]);

    const addPlaquesForSegments = () => {
        let totalSegments = Math.max(gameState.settings.numSegments, 4);

        const currentNumRules = gameState.rules.length;
        const currentNumPrompts = gameState.prompts.length;
        const currentNumModifiers = gameState.modifiers.length;
        const currentNumEnds = gameState.ends.length;

        const rulesNeededToFillSegment = totalSegments - currentNumRules;
        const promptsNeededToFillSegment = totalSegments - currentNumPrompts;
        const modifiersNeededToFillSegment = totalSegments - currentNumModifiers;
        const endsNeededToFillSegment = totalSegments - currentNumEnds;

        for (let i = 0; i < rulesNeededToFillSegment; i++) {
            console.log('GameContext: Adding rule', i);
            const exampleRuleToAdd = exampleRules[i];
            addRule(exampleRuleToAdd.authorId, exampleRuleToAdd.text, exampleRuleToAdd.plaqueColor);
        }
        for (let i = 0; i < promptsNeededToFillSegment; i++) {
            console.log('GameContext: Adding prompt', i);
            const examplePromptToAdd = examplePrompts[i];
            addPrompt(examplePromptToAdd.authorId, examplePromptToAdd.text, examplePromptToAdd.plaqueColor);
        }
        for (let i = 0; i < modifiersNeededToFillSegment; i++) {
            console.log('GameContext: Adding modifier', i);
            const exampleModifierToAdd = generateModifierPlaque(i);
            createPlaque('modifier', exampleModifierToAdd.authorId, exampleModifierToAdd.text, exampleModifierToAdd.plaqueColor);
        }
        for (let i = 0; i < endsNeededToFillSegment; i++) {
            console.log('GameContext: Adding end', i);
            const exampleEndToAdd: Plaque = {
                id: ('end' + i.toString()),
                type: 'end',
                text: "Game Over",
                plaqueColor: "#313131",
                authorId: "system"
            };
            socketService.addPlaque(exampleEndToAdd);
        }
    };


    const allPlaquesAdded = () => {
        return gameState?.rules.length === gameState.settings.numSegments &&
            gameState?.prompts.length === gameState.settings.numSegments &&
            gameState?.modifiers.length === gameState.settings.numSegments &&
            gameState?.ends.length === gameState.settings.numSegments;
    }

    // Create wheel segments once all rules and prompts are added
    React.useEffect(() => {
        console.log('GameContext: allPlaquesAdded', allPlaquesAdded());
        if (!allPlaquesAdded()) {
            return;
        }
        const generatedWheelSegments = createWheelSegments();
        socketService.syncWheelSegments(generatedWheelSegments);
    }, [gameState.rules.length, gameState.prompts.length]);

    const createWheelSegments = (): WheelSegment[] => {

        const newSegments: WheelSegment[] = [];

        let totalSegments = Math.max(gameState.rules.length, gameState.prompts.length, 4);

        for (let i = 0; i < totalSegments; i++) {
            const layers: Plaque[] = [];

            layers.push(gameState.rules[i]);
            layers.push(gameState.prompts[i]);
            layers.push(gameState.modifiers[i]);
            layers.push(gameState.ends[i]);

            console.log(`GameContext: Segment ${i} layers:`, layers.map(l => ({ type: l.type, text: l.text })));

            newSegments.push({
                id: Math.random().toString(36).substring(2, 9),
                layers,
                currentLayerIndex: 0,
                segmentColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
            });
        }

        console.log('GameContext: newSegments', newSegments);

        return newSegments;
    };

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
        return gameState.rules.filter(rule => rule.assignedTo === playerId);
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

    const updateActivePromptDetails = (details: ActivePromptDetails | undefined) => {
        socketService.updateActivePromptDetails(details);
    };

    const updateActiveCloningDetails = (details: ActiveCloneRuleDetails) => {
        socketService.updateActiveCloningDetails(details);
    };

    const cloneRuleToPlayer = (rule: Rule, targetPlayer: Player, authorId?: string) => {
        socketService.cloneRuleToPlayer(rule.id, targetPlayer.id, authorId);
    };

    const triggerCloneModifier = (player: Player, rule?: Rule, modifierId?: string) => {
        if (!gameState) return;
        const details: ActiveCloneRuleDetails = {
            cloningPlayer: player,
            cloningCompleted: false,
            ruleToClone: rule
        }
        updateActiveCloningDetails(details);
    };


    const updateActiveFlippingDetails = (details: ActiveFlipRuleDetails) => {
        socketService.updateActiveFlippingDetails(details);
    };

    const triggerFlipModifier = (player: Player, rule?: Rule, modifierId?: string) => {
        if (!gameState) return;
        const details: ActiveFlipRuleDetails = {
            flippingPlayer: player,
            ruleToFlip: rule
        }
        updateActiveFlippingDetails(details);
    };

    const flipRule = (rule: Rule, flippedText: string) => {
        updateRule(rule.id, flippedText);
        socketService.endFlipRule();
    };

    const endFlipRule = () => {
        socketService.endFlipRule();
    };



    const updateActiveSwappingDetails = (details: ActiveSwapRuleDetails) => {
        socketService.updateActiveSwappingDetails(details);
    };

    const triggerSwapModifier = (player: Player, rule?: Rule, modifierId?: string) => {
        if (!gameState) return;
        const details: ActiveSwapRuleDetails = {
            swapper: player,
            swapperRule: rule
        }
        updateActiveSwappingDetails(details);
    };

    const swapRules = (player1Id: string, player1RuleId: string, player2Id: string, player2RuleId: string) => {
        socketService.swapRules(player1Id, player1RuleId, player2Id, player2RuleId);
    };

    const endSwapRule = () => {
        socketService.endSwapRule();
    };

    const updateActiveUpDownDetails = (details: ActiveUpDownRuleDetails | undefined) => {
        socketService.updateActiveUpDownDetails(details);
    };

    const endUpDownRule = () => {
        socketService.endUpDownRule();
    };

    const triggerUpDownModifier = (direction: 'up' | 'down') => {
        if (!gameState) return;
        socketService.triggerUpDownModifier(direction);
    };

    const synchronizedSpinWheel = (finalIndex: number, duration: number) => {
        dispatch({ type: 'SYNCHRONIZED_WHEEL_SPIN', payload: { spinningPlayerId: currentUserId || '', finalIndex, duration } });
    };

    const initiateAccusation = (accusationDetails: ActiveAccusationDetails) => {
        if (!gameState) return;

        if (gameState.activeAccusationDetails) {
            Alert.alert('Accusation already in progress');
            return;
        }

        socketService.initiateAccusation(accusationDetails);
    };

    const acceptAccusation = () => {
        socketService.acceptAccusation();
    };

    const endAccusation = () => {
        socketService.endAccusation();
    };


    const possiblyReturnToPrompt = () => {
        socketService.possiblyReturnToPrompt();
    }
    const acceptPrompt = () => {
        socketService.acceptPrompt();
    };

    const endPrompt = () => {
        socketService.endPrompt();
    };

    const shredRule = (ruleId: string) => {
        socketService.shredRule(ruleId);
    };

    const updatePoints = (playerId: string, points: number) => {
        socketService.updatePoints(playerId, points);
    };



    const endCloneRule = () => {
        socketService.endCloneRule();
    };

    const removeWheelLayer = (segmentId: string) => {
        socketService.removeWheelLayer(segmentId);
    };

    const completeWheelSpin = (segmentId?: string) => {
        socketService.completeWheelSpin(segmentId);
    };

    const endGame = () => {
        if (!gameState || !gameState.activePlayer) return;

        const winner = gameState.players.find(p => p.id === gameState.activePlayer);
        socketService.endGame(winner);
    };

    const setPlayerModal = (playerId: string, modalName?: string) => {
        if (!gameState) return;
        const playerIndex = gameState.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            gameState.players[playerIndex].currentModal = modalName;
        }
    };

    return (
        <GameContext.Provider value={{
            gameState,
            currentUser,
            activePlayer,
            showExitGameModal,
            dispatch,

            getNonHostPlayers,
            getHostPlayer,

            setShowExitGameModal,
            setPlayerModal,
            getBalancedColor,

            getRulesByAuthor,
            getPromptsByAuthor,
            getAssignedRulesByPlayer,
            markRulesCompletedForUser,
            markPromptsCompletedForUser,

            addRule,
            addPrompt,
            updateRule,
            updatePrompt,
            assignRule,

            removeWheelLayer,

            completeWheelSpin,

            updatePoints,

            initiateAccusation,
            acceptAccusation,
            endAccusation,

            givePrompt,
            updateActivePromptDetails,
            acceptPrompt,
            shredRule,
            endPrompt,
            possiblyReturnToPrompt,

            triggerCloneModifier,
            updateActiveCloningDetails,
            cloneRuleToPlayer,
            endCloneRule,

            triggerFlipModifier,
            updateActiveFlippingDetails,
            flipRule,
            endFlipRule,

            triggerSwapModifier,
            updateActiveSwappingDetails,
            swapRules,
            endSwapRule,

            triggerUpDownModifier,
            updateActiveUpDownDetails,
            endUpDownRule,

            endGame,
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