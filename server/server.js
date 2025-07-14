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
    let lobbyCode = '';
    for (let i = 0; i < 4; i++) {
        lobbyCode += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return lobbyCode;
}

// Create a new game
function createGame(hostId, hostName) {
    const gameId = uuidv4();
    const lobbyCode = generateLobbyCode();

    const game = {
        id: gameId,
        lobbyCode: lobbyCode,
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
        numRules: 3, // Default number of rules per player
        numPrompts: 3, // Default number of prompts per player
        createdAt: Date.now()
    };

    games.set(gameId, game);
    games.set(lobbyCode, game);
    players.set(hostId, { gameId, socketId: null });

    return game;
}

// Find game by lobby code
function findGameByCode(lobbyCode) {
    if (!lobbyCode) return null;
    return games.get(lobbyCode.toUpperCase());
}

function setPlayerModal(game, playerId, modal) {
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (player) {
        player.currentModal = modal;
    }
}

function setAllPlayerModals(game, modal) {
    if (!game) return;
    game.players.forEach(player => {
        player.currentModal = modal;
    })
}

// Socket connection handling
io.on('connection', (socket) => {

    // Join lobby
    socket.on('join_lobby', ({ lobbyCode, playerName }) => {
        const game = findGameByCode(lobbyCode);

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

    // Add plaque (unified handler for rules, prompts, and modifiers)
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
        } else if (plaque.type === 'modifier') {
            const modifier = {
                ...plaque
            };
            game.modifiers.push(modifier);
        }

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
    socket.on('start_game', ({ gameId, settings }) => {
        const game = games.get(gameId);
        if (!game) return;

        game.numRules = settings.numRules || 3;
        game.numPrompts = settings.numPrompts || 3;
        game.startingPoints = settings.startingPoints || 20;

        game.players.forEach(player => {
            player.points = settings.startingPoints;
        });

        game.isGameStarted = true;
        game.roundNumber = 1;

        // Set the first non-host player as the initial active player
        const nonHostPlayers = game.players.filter(player => !player.isHost);
        if (nonHostPlayers.length > 0) {
            game.activePlayer = nonHostPlayers[0].id;
            console.log('Server: Setting initial activePlayer to:', game.activePlayer, 'for game:', gameId);
        }

        io.to(gameId).emit('game_updated', game);
        io.to(gameId).emit('broadcast_navigate_to_screen', { screen: 'RuleWriting' });
    });

    // Update game settings
    socket.on('update_game_settings', ({ gameId, settings }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Update the game settings
        if (settings.numRules !== undefined) {
            game.numRules = settings.numRules;
        }
        if (settings.numPrompts !== undefined) {
            game.numPrompts = settings.numPrompts;
        }
        if (settings.startingPoints !== undefined) {
            // Update all players' starting points
            game.players.forEach(player => {
                player.points = settings.startingPoints;
            });
        }

        console.log('Server: Updated game settings:', settings, 'for game:', gameId);
        io.to(gameId).emit('game_updated', game);
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

        // Check if the spinning player is the current active player
        if (game.activePlayer !== playerId) {
            socket.emit('error', { message: 'Only the active player can spin the wheel' });
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

        console.log('Server: Active player', playerId, 'is spinning the wheel for game:', gameId);

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

    // Start accusation
    socket.on('initiate_accusation', ({ gameId, ruleId, accuserId, accusedId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const rule = game.rules.find(r => r.id === ruleId);
        if (!rule) return;

        const accuser = game.players.find(p => p.id === accuserId);
        if (!accuser) return;

        const accused = game.players.find(p => p.id === accusedId);
        if (!accused) return;

        console.log('accuser', accuser);
        console.log('accused', accused);

        game.isAccusationInProgress = true;
        game.activeAccusationDetails = {
            rule,
            accuser,
            accused
        };

        setAllPlayerModals(game, 'AccusationJudgement');

        console.log('game.activeAccusationDetails', game.activeAccusationDetails);
        console.log('game.players', game.players);

        io.to(gameId).emit('game_updated', game);
    });

    // Accept accusation
    socket.on('accept_accusation', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game || !game.activeAccusationDetails) return;

        const rule = game.rules.find(r => r.id === game.activeAccusationDetails.rule.id);
        if (!rule) return;

        const accuser = game.players.find(p => p.id === game.activeAccusationDetails.accuser.id);
        const accused = game.players.find(p => p.id === game.activeAccusationDetails.accused.id);

        accuser.points += 1;
        accused.points -= 1;

        if (accuser.isHost || game.rules.filter(r => r.assignedTo === accuser.id).length === 0) {
            game.activeAccusationDetails = undefined;
            setAllPlayerModals(game, undefined);
        } else {
            game.activeAccusationDetails.accusationAccepted = true;
            game.players.forEach(player => {
                if (player.id === accuser.id) {
                    setPlayerModal(game, player.id, 'SuccessfulAccusationRuleSelection');
                } else {
                    setPlayerModal(game, player.id, 'WaitForRuleSelection');
                }
            });
        }

        io.to(gameId).emit('game_updated', game);
    });

    // End accusation
    socket.on('end_accusation', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        game.activeAccusationDetails = undefined;
        setAllPlayerModals(game, undefined);

        io.to(gameId).emit('game_updated', game);
    });

    // Update points
    socket.on('update_points', ({ gameId, playerId, points }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        if (player) {
            player.points = Math.max(0, points);
            game.selectedRule = undefined;
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Give prompt
    socket.on('give_prompt', ({ gameId, playerId, promptId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        const prompt = game.prompts.find(p => p.id === promptId);
        if (player && prompt) {
            prompt.isActive = false;
            game.activePromptDetails = {
                selectedPrompt: prompt,
                selectedPlayer: player,
                isPromptAccepted: undefined
            };
            io.to(gameId).emit('game_updated', game);
        } else if (!player && !prompt) {
            socket.emit('error', { message: 'Player and prompt not found' });
        } else if (!player) {
            socket.emit('error', { message: 'Player not found' });
        } else if (!prompt) {
            socket.emit('error', { message: 'Prompt not found' });
        }
    });

    // Accept prompt
    socket.on('accept_prompt', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activePromptDetails.isPromptAccepted = true;
        io.to(gameId).emit('game_updated', game);
    });

    // End prompt
    socket.on('end_prompt', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activePromptDetails = undefined;
        io.to(gameId).emit('game_updated', game);
    });

    // Shred rule
    socket.on('shred_rule', ({ gameId, ruleId }) => {
        const game = games.get(gameId);
        if (!game) return;
        const rule = game.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.assignedTo = undefined;
            rule.isActive = false;
        }
        game.rules = game.rules.filter(r => r.id !== ruleId);
        io.to(gameId).emit('game_updated', game);
    });

    // Accusation
    socket.on('start_accusation', ({ gameId, ruleId, accuserId, accusedId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const rule = game.rules.find(r => r.id === ruleId);
        if (!rule) return;

        const accuser = game.players.find(p => p.id === accuserId);
        if (!accuser) return;

        const accused = game.players.find(p => p.id === accusedId);
        if (!accused) return;

        game.isAccusationInProgress = true;
        game.activeAccusationDetails = {
            rule,
            accuser,
            accused
        };

        // Broadcast accusation to all players
        io.to(gameId).emit('game_updated', game);
    });


    // Swap rules
    socket.on('swap_rules', ({ gameId, player1Id, player1RuleId, player2Id, player2RuleId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player1Rule = game.rules.find(r => r.id === player1RuleId);
        const player2Rule = game.rules.find(r => r.id === player2RuleId);

        player1Rule.assignedTo = player2Id;
        player2Rule.assignedTo = player1Id;

        io.to(gameId).emit('game_updated', game);
    });

    // Assign rule
    socket.on('assign_rule', ({ gameId, ruleId, playerId }) => {
        console.log('Server: Assigning rule:', ruleId, 'to player:', playerId, 'for game:', gameId);
        const game = games.get(gameId);
        if (!game) return;

        const rule = game.rules.find(r => r.id === ruleId);
        const player = game.players.find(p => p.id === playerId);

        if (rule && player) {
            rule.assignedTo = player.id;
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

    // Broadcast end game continue
    socket.on('broadcast_end_game_continue', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('end_game_continue');
    });

    // Broadcast end game end
    socket.on('broadcast_end_game_end', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('end_game_end');
    });

    // Advance to next player after wheel spinning
    socket.on('advance_to_next_player', ({ gameId }) => {
        console.log('Server: Received advance_to_next_player event for game:', gameId, 'at:', new Date().toISOString());
        const game = games.get(gameId);
        if (!game) {
            console.log('Server: Game not found for advance_to_next_player');
            return;
        }

        console.log('Server: Current game state before advancement:');
        console.log('Server: - activePlayer:', game.activePlayer);
        console.log('Server: - players:', game.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })));

        // Find non-host players
        const nonHostPlayers = game.players.filter(player => !player.isHost);
        console.log('Server: Non-host players:', nonHostPlayers.map(p => ({ id: p.id, name: p.name })));

        if (nonHostPlayers.length === 0) {
            console.log('Server: No non-host players found for advance_to_next_player');
            return;
        }

        // Find active player index
        const activePlayerIndex = nonHostPlayers.findIndex(player => player.id === game.activePlayer);
        console.log('Server: Current activePlayer:', game.activePlayer, 'at index:', activePlayerIndex);

        // Check if active player is not found in non-host players
        if (activePlayerIndex === -1) {
            console.log('Server: Current activePlayer not found in non-host players, setting to first non-host player');
            game.activePlayer = nonHostPlayers[0].id;
            console.log('Server: Set activePlayer to:', game.activePlayer, '(', nonHostPlayers[0].name, ') for game:', gameId);
            io.to(gameId).emit('game_updated', game);
            return;
        }

        // Move to next player (or back to first if at end)
        const nextPlayerIndex = (activePlayerIndex + 1) % nonHostPlayers.length;
        const oldActivePlayer = game.activePlayer;
        const newActivePlayer = nonHostPlayers[nextPlayerIndex];
        game.activePlayer = newActivePlayer.id;

        io.to(gameId).emit('game_updated', game);
    });

    // Disconnect handling
    socket.on('disconnect', () => {

        // Find and remove player
        for (const [playerId, playerData] of players.entries()) {
            console.log('disconnecting playerData', playerData);
            if (playerData.socketId === socket.id) {
                const game = games.get(playerData.gameId);
                if (game) {
                    game.players = game.players.filter(p => p.id !== playerId);

                    // If no players left, remove game
                    if (game.players.length === 0) {
                        games.delete(game.id);
                        games.delete(game.lobbyCode);
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
    const gameList = Array.from(games.values()).filter(game => game.id && game.lobbyCode);
    res.json(gameList);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Network access: http://192.168.1.201:${PORT}/health`);
}); 