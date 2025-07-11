const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { gameReducer, createInitialGameState, generateLobbyCode } = require('./gameReducer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Game state storage
const games = new Map();
const players = new Map(); // playerId -> { gameId, socketId }
const socketToPlayer = new Map(); // socketId -> playerId

// Create a new game using the reducer
function createGame(hostId, hostName) {
    const game = createInitialGameState(hostId, hostName);

    games.set(game.id, game);
    games.set(game.code, game);
    players.set(hostId, { gameId: game.id, socketId: null });

    return game;
}

// Find game by code
function findGameByCode(code) {
    return games.get(code.toUpperCase());
}

// Helper function to dispatch action and broadcast to all clients
function dispatchGameAction(gameId, action) {
    const game = games.get(gameId);
    if (!game) return null;

    // Apply the action to the game state
    const newState = gameReducer(game, action);

    // Update the stored game state
    games.set(gameId, newState);
    games.set(newState.code, newState);

    // Broadcast the updated state to all clients in the game
    io.to(gameId).emit('game_updated', newState);

    return newState;
}

// Socket connection handling
io.on('connection', (socket) => {

    // Join lobby
    socket.on('join_lobby', ({ code, playerName }) => {
        const game = findGameByCode(code);

        if (!game) {
            socket.emit('error', { message: 'Lobby not found' });
            return;
        }

        if (game.isGameStarted) {
            socket.emit('error', { message: 'Game already started' });
            return;
        }

        const playerId = uuidv4();
        const player = {
            id: playerId,
            name: playerName,
            points: 20,
            rules: [],
            isHost: false,
            rulesCompleted: false,
            promptsCompleted: false
        };

        // Use reducer to add player
        dispatchGameAction(game.id, { type: 'ADD_PLAYER', payload: player });

        players.set(playerId, { gameId: game.id, socketId: socket.id });
        socketToPlayer.set(socket.id, playerId);
        socket.join(game.id);

        socket.emit('joined_lobby', { playerId, game: games.get(game.id) });
    });

    // Create lobby
    socket.on('create_lobby', ({ playerName }) => {
        const playerId = uuidv4();
        const game = createGame(playerId, playerName);

        players.set(playerId, { gameId: game.id, socketId: socket.id });
        socketToPlayer.set(socket.id, playerId);
        socket.join(game.id);

        socket.emit('lobby_created', { playerId, game });
    });

    // Add plaque (unified handler for rules and prompts)
    socket.on('add_plaque', ({ gameId, plaque }) => {
        if (plaque.type === 'rule') {
            const rule = {
                ...plaque,
                isActive: plaque.isActive || true,
                assignedTo: undefined
            };
            dispatchGameAction(gameId, { type: 'ADD_RULE', payload: rule });
        } else if (plaque.type === 'prompt') {
            const prompt = {
                ...plaque
            };
            dispatchGameAction(gameId, { type: 'ADD_PROMPT', payload: prompt });
        }
    });

    // Add prompt
    socket.on('add_prompt', ({ gameId, plaqueObject }) => {
        const prompt = {
            ...plaqueObject
        };
        dispatchGameAction(gameId, { type: 'ADD_PROMPT', payload: prompt });
    });

    // Add rule
    socket.on('add_rule', (data) => {
        const { gameId, plaqueObject } = data;
        const rule = {
            ...plaqueObject,
            isActive: true
        };
        dispatchGameAction(gameId, { type: 'ADD_RULE', payload: rule });
    });

    // Update plaque (unified handler for rules and prompts)
    socket.on('update_plaque', ({ gameId, plaque }) => {
        if (plaque.type === 'rule') {
            dispatchGameAction(gameId, { type: 'UPDATE_RULE', payload: plaque });
        } else if (plaque.type === 'prompt') {
            dispatchGameAction(gameId, { type: 'UPDATE_PROMPT', payload: plaque });
        }
    });

    // Update rule
    socket.on('update_rule', (data) => {
        const { gameId, plaqueObject } = data;
        dispatchGameAction(gameId, { type: 'UPDATE_RULE', payload: plaqueObject });
    });

    // Update prompt
    socket.on('update_prompt', (data) => {
        const { gameId, plaqueObject } = data;
        dispatchGameAction(gameId, { type: 'UPDATE_PROMPT', payload: plaqueObject });
    });

    // Start game
    socket.on('start_game', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Check if the requesting player is the host
        const playerId = socketToPlayer.get(socket.id);
        const player = game.players.find(p => p.id === playerId);

        if (!player || !player.isHost) {
            socket.emit('error', { message: 'Only the host can start the game' });
            return;
        }

        dispatchGameAction(gameId, { type: 'START_GAME' });
        io.to(gameId).emit('game_started');
    });

    // Wheel spin
    socket.on('spin_wheel', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Check if the requesting player is the active player
        const playerId = socketToPlayer.get(socket.id);
        const player = game.players.find(p => p.id === playerId);
        if (!player || player.id !== game.activePlayer) {
            socket.emit('error', { message: 'Only the active player can spin the wheel' });
            return;
        }

        dispatchGameAction(gameId, { type: 'SYNCHRONIZED_WHEEL_SPIN' });
    });

    // Synchronized wheel spin
    socket.on('synchronized_wheel_spin', ({ gameId, finalIndex, scrollAmount, duration }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Broadcast to all clients in the game
        io.to(gameId).emit('synchronized_wheel_spin', {
            spinningPlayerId: game.activePlayer,
            finalIndex,
            scrollAmount,
            duration
        });
    });

    // Navigate to screen
    socket.on('navigate_to_screen', ({ gameId, screen, params }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Broadcast to all clients in the game
        io.to(gameId).emit('navigate_to_screen', { screen, params });
    });

    // End game continue
    socket.on('end_game_continue', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Broadcast to all clients in the game
        io.to(gameId).emit('end_game_continue');
    });

    // End game end
    socket.on('end_game_end', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Find player with most points
        const winner = game.players.reduce((prev, current) =>
            (prev.points > current.points) ? prev : current
        );

        dispatchGameAction(gameId, { type: 'END_GAME', payload: winner });

        // Broadcast to all clients in the game
        io.to(gameId).emit('end_game_end');
    });

    // Advance to next player
    socket.on('advance_to_next_player', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        dispatchGameAction(gameId, { type: 'ADVANCE_TO_NEXT_PLAYER' });
    });

    // Update game settings
    socket.on('update_game_settings', ({ gameId, settings }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Check if the requesting player is the host
        const playerId = socketToPlayer.get(socket.id);
        const player = game.players.find(p => p.id === playerId);
        if (!player || !player.isHost) {
            socket.emit('error', { message: 'Only the host can update game settings' });
            return;
        }

        if (settings.numRules !== undefined) {
            dispatchGameAction(gameId, { type: 'SET_NUM_RULES', payload: settings.numRules });
        }
        if (settings.numPrompts !== undefined) {
            dispatchGameAction(gameId, { type: 'SET_NUM_PROMPTS', payload: settings.numPrompts });
        }
    });

    // Update points
    socket.on('update_points', ({ gameId, playerId, points }) => {
        const game = games.get(gameId);
        if (!game) return;

        dispatchGameAction(gameId, { type: 'UPDATE_POINTS', payload: { playerId, points } });
    });

    // Swap rules
    socket.on('swap_rules', ({ gameId, player1Id, player2Id }) => {
        const game = games.get(gameId);
        if (!game) return;

        // This would need to be implemented in the reducer
        // For now, just broadcast the action
        io.to(gameId).emit('swap_rules', { player1Id, player2Id });
    });

    // Assign rule
    socket.on('assign_rule', ({ gameId, ruleId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;

        dispatchGameAction(gameId, { type: 'ASSIGN_RULE', payload: { ruleId, playerId } });
    });

    // Assign rule to current player
    socket.on('assign_rule_to_current_player', ({ gameId, ruleId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;

        dispatchGameAction(gameId, { type: 'ASSIGN_RULE', payload: { ruleId, playerId } });
    });

    // Remove wheel layer
    socket.on('remove_wheel_layer', ({ gameId, segmentId }) => {
        const game = games.get(gameId);
        if (!game) return;

        dispatchGameAction(gameId, { type: 'REMOVE_WHEEL_LAYER', payload: segmentId });
    });

    // Sync wheel segments
    socket.on('sync_wheel_segments', ({ gameId, wheelSegments }) => {
        const game = games.get(gameId);
        if (!game) return;

        // This would need to be implemented in the reducer
        // For now, just broadcast the action
        io.to(gameId).emit('sync_wheel_segments', { wheelSegments });
    });

    // Add player (for testing)
    socket.on('add_player', ({ gameId, player }) => {
        const game = games.get(gameId);
        if (!game) return;

        dispatchGameAction(gameId, { type: 'ADD_PLAYER', payload: player });
    });

    // Mark rules completed
    socket.on('rules_completed', ({ gameId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;

        dispatchGameAction(gameId, { type: 'MARK_RULES_COMPLETED', payload: playerId });
    });

    // Mark prompts completed
    socket.on('prompts_completed', ({ gameId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;

        dispatchGameAction(gameId, { type: 'MARK_PROMPTS_COMPLETED', payload: playerId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // Find the player associated with this socket
        let playerToRemove = null;
        let gameId = null;

        for (const [playerId, playerData] of players.entries()) {
            if (playerData.socketId === socket.id) {
                playerToRemove = playerId;
                gameId = playerData.gameId;
                break;
            }
        }

        if (playerToRemove && gameId) {
            const game = games.get(gameId);
            if (game) {
                const player = game.players.find(p => p.id === playerToRemove);

                if (player) {
                    // Remove the player from the game
                    dispatchGameAction(gameId, { type: 'REMOVE_PLAYER', payload: player });

                    // If the host disconnected, assign a new host
                    if (player.isHost && game.players.length > 0) {
                        const newHost = game.players[0];
                        dispatchGameAction(gameId, { type: 'SET_HOST', payload: newHost.id });
                    }

                    // If the active player disconnected, advance to the next player
                    if (game.activePlayer === playerToRemove) {
                        dispatchGameAction(gameId, { type: 'ADVANCE_TO_NEXT_PLAYER' });
                    }
                }
            }

            // Remove the player from the players map
            players.delete(playerToRemove);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 