// Server-side game reducer for authoritative state management
const { v4: uuidv4 } = require('uuid');

// Game state structure
const createInitialGameState = (hostId, hostName) => ({
    id: uuidv4(),
    code: generateLobbyCode(),
    players: [{
        id: hostId,
        name: hostName,
        points: 20,
        rules: [],
        isHost: true,
        rulesCompleted: false,
        promptsCompleted: false
    }],
    prompts: [],
    rules: [],
    wheelSegments: [],
    currentUser: hostId,
    activePlayer: null,
    isGameStarted: false,
    isWheelSpinning: false,
    currentWheelPlaques: [],
    roundNumber: 0,
    numRules: 3,
    numPrompts: 3,
    gameEnded: false,
    winner: null,
    createdAt: Date.now()
});

// Generate random lobby code
function generateLobbyCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
}

// Game reducer function
function gameReducer(state, action) {
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
                players: (state.players || []).filter(p => p.id !== action.payload.id),
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
                rules: (state.rules || []).map((r) => r.id === action.payload.id ? action.payload : r),
            };

        case 'UPDATE_PROMPT':
            return {
                ...state,
                prompts: (state.prompts || []).map((p) => p.id === action.payload.id ? action.payload : p),
            };

        case 'START_GAME':
            return {
                ...state,
                isGameStarted: true,
                roundNumber: 1,
                // Set the first non-host player as active
                activePlayer: state.players.find(p => !p.isHost)?.id || null,
            };

        case 'SYNCHRONIZED_WHEEL_SPIN':
            return {
                ...state,
                isWheelSpinning: true,
            };

        case 'UPDATE_POINTS':
            return {
                ...state,
                players: (state.players || []).map((p) =>
                    p.id === action.payload.playerId
                        ? { ...p, points: action.payload.points }
                        : p
                ),
            };

        case 'SET_ACTIVE_PLAYER':
            return {
                ...state,
                activePlayer: action.payload.id,
            };

        case 'ADVANCE_TO_NEXT_PLAYER':
            const nonHostPlayers = state.players.filter(p => !p.isHost);
            if (nonHostPlayers.length === 0) return state;

            const currentPlayerIndex = nonHostPlayers.findIndex(p => p.id === state.activePlayer);
            const nextPlayerIndex = (currentPlayerIndex + 1) % nonHostPlayers.length;
            const nextPlayer = nonHostPlayers[nextPlayerIndex];

            return {
                ...state,
                activePlayer: nextPlayer.id,
            };

        case 'SET_NUM_RULES':
            return { ...state, numRules: action.payload };

        case 'SET_NUM_PROMPTS':
            return { ...state, numPrompts: action.payload };

        case 'REMOVE_WHEEL_LAYER':
            const updatedSegments = (state.wheelSegments || []).map((segment) => {
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

        case 'CREATE_WHEEL_SEGMENTS':
            // Create wheel segments from rules and prompts
            const segments = [];
            const colorUsage = {};

            // Helper function to get balanced color
            function getBalancedColor(type, prompts, rules) {
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'];
                const usage = colorUsage[colors[0]] || { prompts: 0, rules: 0, modifiers: 0 };

                for (const color of colors) {
                    if (!colorUsage[color]) {
                        colorUsage[color] = { prompts: 0, rules: 0, modifiers: 0 };
                    }

                    const currentUsage = colorUsage[color][type + 's'];
                    const minUsage = Math.min(...Object.values(colorUsage).map(u => u[type + 's']));

                    if (currentUsage <= minUsage) {
                        colorUsage[color][type + 's']++;
                        return color;
                    }
                }

                // Fallback
                colorUsage[colors[0]][type + 's']++;
                return colors[0];
            }

            // Create segments from rules
            state.rules.forEach((rule) => {
                const color = getBalancedColor('rule', state.prompts, state.rules);
                segments.push({
                    id: uuidv4(),
                    color: color,
                    plaqueColor: rule.plaqueColor || '#fff',
                    layers: [{
                        type: 'rule',
                        content: rule,
                        plaqueColor: rule.plaqueColor || '#fff'
                    }],
                    currentLayerIndex: 0
                });
            });

            // Create segments from prompts
            state.prompts.forEach((prompt) => {
                const color = getBalancedColor('prompt', state.prompts, state.rules);
                segments.push({
                    id: uuidv4(),
                    color: color,
                    plaqueColor: prompt.plaqueColor || '#fff',
                    layers: [{
                        type: 'prompt',
                        content: prompt,
                        plaqueColor: prompt.plaqueColor || '#fff'
                    }],
                    currentLayerIndex: 0
                });
            });

            // Add modifier segments
            const modifiers = ['Clone', 'Flip', 'Up', 'Down', 'Swap', 'Shred'];
            const modifierColors = ['#28a745', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14', '#dc3545'];

            modifiers.forEach((modifier, index) => {
                segments.push({
                    id: uuidv4(),
                    color: modifierColors[index],
                    plaqueColor: '#fff',
                    layers: [{
                        type: 'modifier',
                        content: modifier,
                        plaqueColor: '#fff'
                    }],
                    currentLayerIndex: 0
                });
            });

            // Add end segment
            segments.push({
                id: uuidv4(),
                color: '#dc3545',
                plaqueColor: '#fff',
                layers: [{
                    type: 'end',
                    content: { text: 'END GAME' },
                    plaqueColor: '#fff'
                }],
                currentLayerIndex: 0
            });

            return {
                ...state,
                wheelSegments: segments,
            };

        case 'END_GAME':
            return {
                ...state,
                gameEnded: true,
                winner: action.payload,
            };

        case 'SET_HOST':
            const players = state.players || [];
            return {
                ...state,
                players: players
                    .filter((p) => !p.isHost)
                    .map((p) => ({
                        ...p,
                        isHost: p.id === action.payload
                    }))
                    .concat(
                        players
                            .filter((p) => p.id === action.payload)
                            .map((p) => ({
                                ...p,
                                isHost: true
                            }))
                    )
            };

        case 'ASSIGN_RULE':
            return {
                ...state,
                rules: (state.rules || []).map((r) =>
                    r.id === action.payload.ruleId
                        ? { ...r, assignedTo: action.payload.playerId }
                        : r
                ),
            };

        case 'MARK_RULES_COMPLETED':
            return {
                ...state,
                players: (state.players || []).map((p) =>
                    p.id === action.payload
                        ? { ...p, rulesCompleted: true }
                        : p
                ),
            };

        case 'MARK_PROMPTS_COMPLETED':
            return {
                ...state,
                players: (state.players || []).map((p) =>
                    p.id === action.payload
                        ? { ...p, promptsCompleted: true }
                        : p
                ),
            };

        default:
            return state;
    }
}

module.exports = {
    gameReducer,
    createInitialGameState,
    generateLobbyCode
}; 