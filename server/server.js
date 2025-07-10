const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

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
const players = new Map();

// Generate random lobby code
function generateLobbyCode() {
    // Generate 4 random letters (A-Z)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
}

// Create a new game
function createGame(hostId, hostName) {
    const gameId = uuidv4();
    const lobbyCode = generateLobbyCode();

    const game = {
        id: gameId,
        code: lobbyCode,
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
        currentUser: hostId, // The user ID of the person currently using the app
        activePlayer: null, // The player ID of the player currently taking their turn (excludes host)
        isGameStarted: false,
        isWheelSpinning: false,
        currentStack: [],
        roundNumber: 0,
        createdAt: Date.now()
    };

    games.set(gameId, game);
    games.set(lobbyCode, game);
    players.set(hostId, { gameId, socketId: null });

    return game;
}

// Find game by code
function findGameByCode(code) {
    return games.get(code.toUpperCase());
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

        game.players.push(player);
        players.set(playerId, { gameId: game.id, socketId: socket.id });
        socket.join(game.id);

        // Update all players in the game
        io.to(game.id).emit('game_updated', game);
        socket.emit('joined_lobby', { playerId, game });
    });

    // Create lobby
    socket.on('create_lobby', ({ playerName }) => {
        const playerId = uuidv4();
        const game = createGame(playerId, playerName);

        players.set(playerId, { gameId: game.id, socketId: socket.id });
        socket.join(game.id);

        socket.emit('lobby_created', { playerId, game });
    });

    // Add plaque (unified handler for rules and prompts)
    socket.on('add_plaque', ({ gameId, plaque }) => {
        const game = games.get(gameId);
        if (!game) return;

        if (plaque.type === 'rule') {
            const rule = {
                ...plaque,
                isActive: plaque.isActive || true,
                assignedTo: undefined
            };
            game.rules.push(rule);
        } else if (plaque.type === 'prompt') {
            const prompt = {
                ...plaque
            };
            game.prompts.push(prompt);
        }

        io.to(gameId).emit('game_updated', game);
    });

    // Add prompt
    socket.on('add_prompt', ({ gameId, plaqueObject }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Use the plaque object as the prompt (it already has id, text, category, authorId, plaqueColor)
        const prompt = {
            ...plaqueObject
        };

        game.prompts.push(prompt);
        io.to(gameId).emit('game_updated', game);
    });

    // Add rule
    socket.on('add_rule', (data) => {
        const { gameId, plaqueObject } = data;
        const game = games.get(gameId);
        if (!game) return;

        // Use the plaque object as the rule (it already has id, text, authorId, plaqueColor)
        const rule = {
            ...plaqueObject,
            isActive: true
        };

        game.rules.push(rule);
        io.to(gameId).emit('game_updated', game);
    });

    // Update plaque (unified handler for rules and prompts)
    socket.on('update_plaque', ({ gameId, plaque }) => {
        const game = games.get(gameId);
        if (!game) return;

        if (plaque.type === 'rule') {
            const ruleIndex = game.rules.findIndex(r => r.id === plaque.id);
            if (ruleIndex !== -1) {
                // Replace the rule with the updated plaque
                game.rules[ruleIndex] = {
                    ...game.rules[ruleIndex],
                    ...plaque
                };
                io.to(gameId).emit('game_updated', game);
            }
        } else if (plaque.type === 'prompt') {
            const promptIndex = game.prompts.findIndex(p => p.id === plaque.id);
            if (promptIndex !== -1) {
                // Replace the prompt with the updated plaque
                game.prompts[promptIndex] = {
                    ...game.prompts[promptIndex],
                    ...plaque
                };
                io.to(gameId).emit('game_updated', game);
            }
        }
    });

    // Update rule
    socket.on('update_rule', ({ gameId, plaqueObject }) => {
        const game = games.get(gameId);
        if (!game) return;

        const ruleIndex = game.rules.findIndex(r => r.id === plaqueObject.id);
        if (ruleIndex !== -1) {
            // Replace the rule with the updated plaque object
            game.rules[ruleIndex] = {
                ...game.rules[ruleIndex],
                ...plaqueObject
            };
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Update prompt
    socket.on('update_prompt', ({ gameId, plaqueObject }) => {
        const game = games.get(gameId);
        if (!game) return;

        const promptIndex = game.prompts.findIndex(p => p.id === plaqueObject.id);
        if (promptIndex !== -1) {
            // Replace the prompt with the updated plaque object
            game.prompts[promptIndex] = {
                ...game.prompts[promptIndex],
                ...plaqueObject
            };
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Start game
    socket.on('start_game', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        game.isGameStarted = true;
        game.roundNumber = 1;

        // Set the first non-host player as the initial active player
        const nonHostPlayers = game.players.filter(player => !player.isHost);
        if (nonHostPlayers.length > 0) {
            game.activePlayer = nonHostPlayers[0].id;
            console.log('Server: Setting initial activePlayer to:', game.activePlayer, 'for game:', gameId);
        }

        console.log('Server: Broadcasting game_updated after start with activePlayer:', game.activePlayer, 'for game:', gameId);
        io.to(gameId).emit('game_updated', game);
        io.to(gameId).emit('game_started');
    });

    // Mark rules as completed
    socket.on('rules_completed', ({ gameId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        if (player) {
            player.rulesCompleted = true;
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Mark prompts as completed
    socket.on('prompts_completed', ({ gameId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        if (player) {
            player.promptsCompleted = true;
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Spin wheel
    socket.on('spin_wheel', ({ gameId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Check if the spinning player is the host
        const spinningPlayer = game.players.find(p => p.id === playerId);
        if (spinningPlayer && spinningPlayer.isHost) {
            socket.emit('error', { message: 'Host players cannot spin the wheel' });
            return;
        }

        // Check if all non-host players have completed both phases
        const nonHostPlayers = game.players.filter(player => !player.isHost);
        const allNonHostPlayersCompleted = nonHostPlayers.every(player =>
            player.rulesCompleted && player.promptsCompleted
        );

        if (!allNonHostPlayersCompleted) {
            socket.emit('error', { message: 'All players must complete rules and prompts before spinning the wheel' });
            return;
        }

        game.isWheelSpinning = true;

        // Ensure the active player is not a host
        const playerToSpin = game.players.find(p => p.id === playerId);
        if (playerToSpin && playerToSpin.isHost) {
            console.error('Server: Attempted to set host as active player!');
            socket.emit('error', { message: 'Host players cannot be active players' });
            return;
        }

        game.activePlayer = playerId; // Set the active player who is spinning
        console.log('Server: Setting activePlayer to:', playerId, 'for game:', gameId);

        // Generate random stack
        const stack = [];
        const availableRules = game.rules.filter(r => r.isActive && !r.assignedTo); // Only unassigned rules
        const availablePrompts = game.prompts;

        if (availableRules.length > 0) {
            const randomRule = availableRules[Math.floor(Math.random() * availableRules.length)];
            stack.push({ type: 'rule', content: randomRule });
        }

        if (availablePrompts.length > 0) {
            const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
            stack.push({ type: 'prompt', content: randomPrompt });
        }

        if (Math.random() > 0.5) {
            const modifiers = ['Double Points', 'Skip Turn', 'Reverse Order', 'Free Pass'];
            const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
            stack.push({ type: 'modifier', content: randomModifier });
        }

        game.currentStack = stack;

        console.log('Server: Broadcasting game_updated after spin with activePlayer:', game.activePlayer, 'for game:', gameId);
        io.to(gameId).emit('game_updated', game);
        io.to(gameId).emit('wheel_spun', stack);
    });

    // Update points
    socket.on('update_points', ({ gameId, playerId, points }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        if (player) {
            player.points = Math.max(0, points);
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Swap rules
    socket.on('swap_rules', ({ gameId, player1Id, player2Id }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player1Rules = game.rules.filter(r => r.assignedTo === player1Id);
        const player2Rules = game.rules.filter(r => r.assignedTo === player2Id);

        player1Rules.forEach(rule => {
            rule.assignedTo = player2Id;
        });

        player2Rules.forEach(rule => {
            rule.assignedTo = player1Id;
        });

        io.to(gameId).emit('game_updated', game);
    });

    // Assign rule
    socket.on('assign_rule', ({ gameId, ruleId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const rule = game.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.assignedTo = playerId;
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Assign rule to active player (when wheel lands on a rule)
    socket.on('assign_rule_to_current_player', ({ gameId, ruleId }) => {
        const game = games.get(gameId);
        if (!game || !game.activePlayer) return;

        const rule = game.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.assignedTo = game.activePlayer;
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Remove wheel layer
    socket.on('remove_wheel_layer', ({ gameId, segmentId }) => {
        const game = games.get(gameId);
        if (!game || !game.wheelSegments) return;

        const segment = game.wheelSegments.find(s => s.id === segmentId);
        if (segment) {
            segment.currentLayerIndex = Math.min(segment.currentLayerIndex + 1, segment.layers.length - 1);
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Sync wheel segments
    socket.on('sync_wheel_segments', ({ gameId, wheelSegments }) => {
        const game = games.get(gameId);
        if (!game) return;

        game.wheelSegments = wheelSegments;
        io.to(gameId).emit('game_updated', game);
    });

    // Broadcast synchronized wheel spin
    socket.on('broadcast_synchronized_wheel_spin', ({ gameId, spinningPlayerId, finalIndex, scrollAmount, duration }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('synchronized_wheel_spin', {
            spinningPlayerId,
            finalIndex,
            scrollAmount,
            duration
        });
    });

    // Broadcast navigation to screen
    socket.on('broadcast_navigate_to_screen', ({ gameId, screen, params }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('navigate_to_screen', {
            screen,
            params
        });
    });

    // Advance to next player after wheel spinning
    socket.on('advance_to_next_player', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Find non-host players
        const nonHostPlayers = game.players.filter(player => !player.isHost);
        if (nonHostPlayers.length === 0) return;

        // Find active player index
        const activePlayerIndex = nonHostPlayers.findIndex(player => player.id === game.activePlayer);

        // Move to next player (or back to first if at end)
        const nextPlayerIndex = (activePlayerIndex + 1) % nonHostPlayers.length;
        game.activePlayer = nonHostPlayers[nextPlayerIndex].id;
        console.log('Server: Advancing activePlayer to:', game.activePlayer, 'for game:', gameId);

        // Broadcast the updated game state to all players
        console.log('Server: Broadcasting game_updated after advancing player with activePlayer:', game.activePlayer, 'for game:', gameId);
        io.to(gameId).emit('game_updated', game);
    });

    // Disconnect handling
    socket.on('disconnect', () => {

        // Find and remove player
        for (const [playerId, playerData] of players.entries()) {
            if (playerData.socketId === socket.id) {
                const game = games.get(playerData.gameId);
                if (game) {
                    game.players = game.players.filter(p => p.id !== playerId);

                    // If no players left, remove game
                    if (game.players.length === 0) {
                        games.delete(game.id);
                        games.delete(game.code);
                    } else {
                        // Assign host to first remaining player if host left
                        if (!game.players.some(p => p.isHost)) {
                            game.players[0].isHost = true;
                        }

                        // If the disconnected player was the active player, set active player to null or first non-host player
                        if (game.activePlayer === playerId) {
                            const nonHostPlayers = game.players.filter(p => !p.isHost);
                            game.activePlayer = nonHostPlayers.length > 0 ? nonHostPlayers[0].id : null;
                            console.log('Server: Updated activePlayer after disconnect to:', game.activePlayer, 'for game:', gameId);
                        }

                        io.to(game.id).emit('game_updated', game);
                    }
                }
                players.delete(playerId);
                break;
            }
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', games: games.size, players: players.size });
});

// Get active games (for debugging)
app.get('/games', (req, res) => {
    const gameList = Array.from(games.values()).filter(game => game.id && game.code);
    res.json(gameList);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Network access: http://192.168.1.201:${PORT}/health`);
}); 