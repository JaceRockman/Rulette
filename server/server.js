const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

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
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

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
        createdAt: Date.now(),
        lobbyCode: lobbyCode,
        players: [{
            id: hostId,
            name: hostName,
            points: 20,
            rules: [],
            isHost: true,
            playerOrderPosition: null, // Hosts have null position
            rulesCompleted: false,
            promptsCompleted: false,
            currentModal: null
        }],
        settings: {
            customRulesAndPrompts: 0,
            startingPoints: 20,
            hostIsValidTarget: true
        },
        isGameStarted: false,
        rules: [],
        prompts: [],
        modifiers: [],
        ends: [],
        playerInputCompleted: false,
        wheelSegments: [],
        wheelSpinDetails: null,
        currentUser: hostId, // The user ID of the person currently using the app
        activePlayer: null, // The player ID of the player currently taking their turn (excludes host)
        selectedPlayerForAction: null, // The player ID of the player currently being acted upon
        selectedRule: null, // The rule ID of the rule currently being selected

        activeAccusationDetails: null,
        activePromptDetails: null,
        activeCloneRuleDetails: null,
        activeFlipRuleDetails: null,
        activeSwapRuleDetails: null,
        activeUpDownRuleDetails: null,
        currentStack: [],
        roundNumber: 0,
        gameEnded: false,
        winner: null,
    }



    games.set(gameId, game);
    games.set(lobbyCode, game);
    players.set(hostId, { gameId, socketId: null });

    console.log('game', game);

    return game;
}

// Find game by lobby code
function findGameByCode(lobbyCode) {
    if (!lobbyCode) return null;
    return games.get(lobbyCode.toUpperCase());
}

// Helper function to find the next active player in rotation
function findNextActivePlayer(game, currentActivePlayerId) {
    if (!game.players || game.players.length === 0) return null;

    // Get all non-host players sorted by playerOrderPosition
    const nonHostPlayers = game.players
        .filter(p => !p.isHost)
        .sort((a, b) => (a.playerOrderPosition || 0) - (b.playerOrderPosition || 0));

    if (nonHostPlayers.length === 0) return null;

    // If no current active player, return the first non-host player
    if (!currentActivePlayerId) {
        return nonHostPlayers[0].id;
    }

    // Find the current active player
    const currentPlayer = nonHostPlayers.find(p => p.id === currentActivePlayerId);
    if (!currentPlayer) return nonHostPlayers[0].id;

    // Find the next player in rotation
    const currentPosition = currentPlayer.playerOrderPosition;
    const nextPlayer = nonHostPlayers.find(p => p.playerOrderPosition === currentPosition + 1);

    // If no next player, wrap around to the first player
    return nextPlayer ? nextPlayer.id : nonHostPlayers[0].id;
}

// Helper function to assign host to first player if no host exists
function assignHostIfNeeded(players) {
    if (!players.some(p => p.isHost)) {
        return players.map((p, index) =>
            index === 0 ? { ...p, isHost: true, playerOrderPosition: null } : p
        );
    }
    return players;
}

// Helper function to handle player removal from game
function removePlayerFromGame(game, playerId) {
    // Remove the player from the game
    const updatedPlayers = game.players.filter(p => p.id !== playerId);

    // If no players left, return null to indicate game should be ended
    if (updatedPlayers.length === 0) {
        return null;
    }

    // Assign host to first remaining player if host left
    const playersWithHost = assignHostIfNeeded(updatedPlayers);

    // Reassign player order positions for non-host players
    const reassignedPlayers = playersWithHost.map(player => {
        if (player.isHost) {
            return { ...player, playerOrderPosition: null };
        } else {
            // For non-host players, we'll reassign positions based on their current order
            return player; // Keep current position for now, will be reassigned below
        }
    });

    // Reassign positions for non-host players in order
    let positionCounter = 1;
    const finalPlayers = reassignedPlayers.map(player => {
        if (player.isHost) {
            return player;
        } else {
            return { ...player, playerOrderPosition: positionCounter++ };
        }
    });

    // Create updated game state
    let updatedGame = {
        ...game,
        players: finalPlayers
    };

    // If the removed player was the active player, find the next player in rotation
    if (game.activePlayer === playerId) {
        updatedGame.activePlayer = findNextActivePlayer(updatedGame, null);
        console.log('Server: Updated activePlayer after removal to:', updatedGame.activePlayer, 'for game:', game.id);
    }

    return updatedGame;
}

function setPlayerModal(game, playerId, modal) {
    if (!game) return game;
    return {
        ...game,
        players: game.players.map(p =>
            p.id === playerId ? { ...p, currentModal: modal } : p
        )
    };
}

function setAllPlayerModals(game, modal) {
    if (!game) return game;
    return {
        ...game,
        players: game.players.map(p => ({ ...p, currentModal: modal }))
    };
}

// Helper function to get players in order (hosts first, then non-host players by position)
function getAllPlayersInOrder(game) {
    if (!game || !game.players) return [];

    const hosts = game.players.filter(p => p.isHost);
    const nonHostPlayers = game.players
        .filter(p => !p.isHost)
        .sort((a, b) => (a.playerOrderPosition || 0) - (b.playerOrderPosition || 0));

    return [...hosts, ...nonHostPlayers];
}

function getNonHostPlayersInOrder(game) {
    if (!game || !game.players) return [];
    return game.players
        .filter(p => !p.isHost)
        .sort((a, b) => (a.playerOrderPosition || 0) - (b.playerOrderPosition || 0));
}


// Socket connection handling
io.on('connection', (socket) => {

    // Create lobby
    socket.on('create_lobby', ({ playerName, userId }) => {
        console.log('SERVER: create_lobby');
        const playerId = userId || uuidv4();
        const game = createGame(playerId, playerName);

        players.set(playerId, { gameId: game.id, socketId: socket.id, userId: userId || null });
        socket.join(game.id);

        socket.emit('lobby_created', { playerId, userId: userId || null, game });
    });

    // Join lobby
    socket.on('join_lobby', ({ lobbyCode, playerName, userId }) => {
        console.log('SERVER: join_lobby');
        const game = findGameByCode(lobbyCode);

        if (!game) {
            socket.emit('error', { message: 'Lobby not found' });
            return;
        }

        if (game.isGameStarted) {
            socket.emit('error', { message: 'Game already started' });
            return;
        }

        // Check for duplicate player name (case-insensitive)
        const nameTaken = game.players.some(
            p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
        );
        if (nameTaken) {
            socket.emit('error', { message: 'That name is already taken in this lobby. Please choose a different name.' });
            return;
        }

        const playerId = userId || uuidv4();
        // Calculate the next player order position (exclude hosts)
        const nonHostPlayers = game.players.filter(p => !p.isHost);
        const nextPosition = nonHostPlayers.length + 1;

        const player = {
            id: playerId,
            name: playerName,
            points: 20,
            rules: [],
            isHost: false,
            playerOrderPosition: nextPosition,
            rulesCompleted: false,
            promptsCompleted: false,
            currentModal: null
        };

        const updatedGame = { ...game, players: [...game.players, player] };
        games.set(game.id, updatedGame);
        games.set(game.lobbyCode, updatedGame);
        players.set(playerId, { gameId: game.id, socketId: socket.id, userId: userId || null });
        socket.join(game.id);

        // Update all players in the game
        // Emit payload with a 'game' key to match client expectations
        socket.emit('joined_lobby', { playerId, userId: userId || null, game: updatedGame });
        // Ensure the joining player also receives the latest game state immediately
        socket.emit('game_updated', updatedGame);
        io.to(game.id).emit('game_updated', updatedGame);
        socket.emit('navigate_player_to_screen', { screen: 'Lobby', playerId: playerId, params: { lobbyCode: updatedGame.lobbyCode } });
    });

    // Update game settings
    socket.on('update_game_settings', ({ gameId, settings }) => {
        console.log('SERVER: update_game_settings');
        let game = games.get(gameId);
        if (!game) return;

        // Update the game settings
        if (settings.customRulesAndPrompts !== null) {
            game.settings.customRulesAndPrompts = settings.customRulesAndPrompts;
        } else {
            game.settings.customRulesAndPrompts = 0;
        }

        if (settings.startingPoints !== null) {
            // Update all players' starting points
            game.players.forEach(player => {
                player.points = settings.startingPoints;
            });
        }

        console.log('Server: Updated game settings:', settings, 'for game:', gameId);
        io.to(gameId).emit('game_updated', game);
    });

    // Start game
    socket.on('start_game', ({ gameId, settings }) => {
        console.log('SERVER: start_game');
        let game = games.get(gameId);
        if (!game) return;

        game.settings = settings;

        game.players.forEach(player => {
            player.points = settings.startingPoints;
        });

        game.isGameStarted = true;
        game.roundNumber = 1;

        // Set the first non-host player as the initial active player
        const nonHostPlayers = getNonHostPlayersInOrder(game);
        if (nonHostPlayers.length > 0) {
            game.activePlayer = nonHostPlayers[0].id;
            console.log('Server: Setting initial activePlayer to:', game.activePlayer, 'for game:', gameId);
        }

        io.to(gameId).emit('game_updated', game);

        game.players.forEach(player => {
            let destinationScreen = 'Game';
            if (player.isHost) {
                destinationScreen = 'RuleWriting';
            } else if (game.settings.customRulesAndPrompts > 0) {
                destinationScreen = 'RuleWriting';
            } else {
                player.rulesCompleted = true;
                player.promptsCompleted = true;
                game.playerInputCompleted = true;
                io.to(gameId).emit('game_updated', game);
                destinationScreen = 'Game';
            }
            io.to(gameId).emit('navigate_player_to_screen', { screen: destinationScreen, playerId: player.id });
        })
    });

    socket.on('set_player_as_host', ({ gameId, playerId }) => {
        console.log('SERVER: set_player_as_host');
        let game = games.get(gameId);
        if (!game) return;

        const relevantOrderPosition = game.players.find(p => p.id === playerId)?.playerOrderPosition;

        let updatedGame = { ...game, activePlayer: game.players.find(p => p.isHost)?.id };

        let updatedPlayers = updatedGame.players.map(p => {
            if (p.id === playerId) {
                return { ...p, isHost: true, playerOrderPosition: null };
            } else if (p.isHost) {
                return { ...p, isHost: false, playerOrderPosition: relevantOrderPosition };
            }
            return p;
        });

        updatedGame = { ...updatedGame, players: updatedPlayers };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Add plaque (unified handler for rules, prompts, and modifiers)
    socket.on('add_plaque', ({ gameId, plaque }) => {
        console.log('SERVER: add_plaque');
        let game = games.get(gameId);
        if (!game) return;

        let updatedGame = game;

        if (plaque.type === 'rule') {
            const rule = {
                ...plaque,
                isActive: true
            };
            updatedGame = { ...game, rules: [...game.rules, rule] };
            games.set(gameId, updatedGame);
        } else if (plaque.type === 'prompt') {
            const prompt = {
                ...plaque
            };
            updatedGame = { ...game, prompts: [...game.prompts, prompt] };
            games.set(gameId, updatedGame);
        } else if (plaque.type === 'modifier') {
            const modifier = {
                ...plaque
            };
            updatedGame = { ...game, modifiers: [...game.modifiers, modifier] };
            games.set(gameId, updatedGame);
        } else if (plaque.type === 'end') {
            const end = {
                ...plaque
            };
            updatedGame = { ...game, ends: [...game.ends, end] };
            games.set(gameId, updatedGame);
        }

        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Update plaque (unified handler for rules and prompts)
    socket.on('update_plaque', ({ gameId, plaque }) => {
        console.log('SERVER: update_plaque');
        let game = games.get(gameId);
        if (!game) return;

        if (plaque.type === 'rule') {
            const updatedRules = game.rules.map(r =>
                r.id === plaque.id ? { ...r, ...plaque } : r
            );
            const updatedGame = { ...game, rules: updatedRules };
            games.set(gameId, updatedGame);
            io.to(gameId).emit('game_updated', updatedGame);
        } else if (plaque.type === 'prompt') {
            const updatedPrompts = game.prompts.map(p =>
                p.id === plaque.id ? { ...p, ...plaque } : p
            );
            const updatedGame = { ...game, prompts: updatedPrompts };
            games.set(gameId, updatedGame);
            io.to(gameId).emit('game_updated', updatedGame);
        }
    });

    // Mark rules as completed
    socket.on('rules_completed', ({ gameId, playerId }) => {
        console.log('SERVER: rules_completed');
        let game = games.get(gameId);
        if (!game) return;

        const updatedGame = {
            ...game,
            players: game.players.map(p =>
                p.id === playerId ? { ...p, rulesCompleted: true } : p
            )
        };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Mark prompts as completed
    socket.on('prompts_completed', ({ gameId, playerId }) => {
        console.log('SERVER: prompts_completed');
        let game = games.get(gameId);
        if (!game) return;

        const updatedPlayers = game.players.map(p =>
            p.id === playerId ? { ...p, promptsCompleted: true } : p
        );
        // Check if all non-host players have completed both phases
        const nonHostPlayers = updatedPlayers.filter(p => !p.isHost);
        const playerInputCompleted = nonHostPlayers.every(p => p.promptsCompleted) && nonHostPlayers.every(p => p.rulesCompleted);
        const updatedGame = {
            ...game,
            players: updatedPlayers,
            playerInputCompleted
        };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Sync wheel segments
    socket.on('sync_wheel_segments', ({ gameId, wheelSegments }) => {
        console.log('SERVER: sync_wheel_segments');
        let game = games.get(gameId);
        if (!game) return;

        const updatedGame = { ...game, wheelSegments: wheelSegments };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_player_modal', ({ gameId, playerId, modal }) => {
        console.log('SERVER: set_player_modal');
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = setPlayerModal(game, playerId, modal);
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_all_player_modals', ({ gameId, modal }) => {
        console.log('SERVER: set_all_player_modals');
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = setAllPlayerModals(game, modal);
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_selected_player_for_action', ({ gameId, playerId }) => {
        console.log('SERVER: set_selected_player_for_action');
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = { ...game, selectedPlayerForAction: playerId };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_selected_rule', ({ gameId, ruleId }) => {
        console.log('SERVER: set_selected_rule');
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = { ...game, selectedRule: ruleId };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Update points
    socket.on('update_points', ({ gameId, playerId, pointChange }) => {
        console.log('SERVER: update_points');
        let game = games.get(gameId);
        if (!game) return;

        const updatedGame = {
            ...game,
            players: game.players.map(p =>
                p.id === playerId ? { ...p, points: Math.max(0, p.points + pointChange) } : p
            )
        };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Broadcast synchronized wheel spin
    socket.on('update_wheel_spin_details', ({ gameId, wheelSpinDetails }) => {
        console.log('SERVER: update_wheel_spin_details');
        let game = games.get(gameId);
        if (!game) return;

        const updatedGame = { ...game, wheelSpinDetails: wheelSpinDetails };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Complete wheel spin - handles all wheel completion logic centrally
    socket.on('complete_wheel_spin', ({ gameId, segmentId }) => {
        console.log('SERVER: complete_wheel_spin');
        let game = games.get(gameId);
        if (!game) return;

        // Remove wheel layer if segmentId is provided
        let updatedWheelSegments = game.wheelSegments;
        if (segmentId !== null && game.wheelSegments) {
            updatedWheelSegments = game.wheelSegments.map(segment => {
                if (segment.id === segmentId) {
                    return {
                        ...segment,
                        currentLayerIndex: segment.currentLayerIndex + 1
                    };
                }
                return segment;
            });
        }

        // Advance to next player
        let nextActivePlayer = game.activePlayer;
        const currentActivePlayer = game.players.find(p => p.id === game.activePlayer);
        if (currentActivePlayer) {
            const currentIndex = game.players.findIndex(p => p.id === game.activePlayer);
            if (currentIndex !== -1) {
                let nextIndex = (currentIndex + 1) % game.players.length;
                while (game.players[nextIndex].isHost) {
                    nextIndex = (nextIndex + 1) % game.players.length;
                }
                nextActivePlayer = game.players[nextIndex].id;
            }
        }

        // Build new game object immutably
        const updatedGame = {
            ...game,
            wheelSegments: updatedWheelSegments,
            wheelSpinDetails: null,
            activePromptDetails: null,
            activeAccusationDetails: null,
            activePlayer: nextActivePlayer
        };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
        io.to(gameId).emit('broadcast_navigate_to_screen', {
            screen: 'Game'
        });
    });

    // Remove wheel layer for rule if it exists
    socket.on('remove_wheel_layer_for_rule', ({ gameId, ruleId }) => {
        console.log('SERVER: remove_wheel_layer_for_rule');
        let game = games.get(gameId);
        if (!game) return;
        const newSegments = game.wheelSegments.map(segment => {
            if (segment.layers[segment.currentLayerIndex].id === ruleId) {
                return {
                    ...segment,
                    currentLayerIndex: segment.currentLayerIndex + 1
                };
            }
            return segment;
        });
        const updatedGame = { ...game, wheelSegments: newSegments };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Advance to next player
    socket.on('advance_to_next_player', ({ gameId }) => {
        console.log('SERVER: advance_to_next_player');
        let game = games.get(gameId);
        if (!game) return;

        // Find the next active player in rotation
        const nextActivePlayerId = findNextActivePlayer(game, game.activePlayer);
        if (!nextActivePlayerId) return;

        // Set the new active player
        const updatedGame = { ...game, activePlayer: nextActivePlayerId };

        io.to(gameId).emit('game_updated', updatedGame);
    });



    // Start accusation
    socket.on('initiate_accusation', ({ gameId, ruleId, accuserId, accusedId }) => {
        console.log('SERVER: initiate_accusation');
        let game = games.get(gameId);
        if (!game) return;

        const rule = game.rules.find(r => r.id === ruleId);
        if (!rule) return;

        const accuser = game.players.find(p => p.id === accuserId);
        if (!accuser) return;

        const accused = game.players.find(p => p.id === accusedId);
        if (!accused) return;


        let updatedGame = {
            ...game,
            activeAccusationDetails: {
                rule,
                accuser,
                accused
            }
        };

        updatedGame = setAllPlayerModals(updatedGame, 'AccusationJudgement');

        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('update_active_accusation_details', ({ gameId, details }) => {
        console.log('SERVER: update_active_accusation_details');
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = { ...game, activeAccusationDetails: details };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Accept accusation
    socket.on('accept_accusation', ({ gameId }) => {
        console.log('SERVER: accept_accusation');
        let game = games.get(gameId);
        if (!game || !game.activeAccusationDetails) return;

        const rule = game.rules.find(r => r.id === game.activeAccusationDetails.rule.id);
        if (!rule) return;

        const accuserId = game.activeAccusationDetails.accuser.id;
        const accusedId = game.activeAccusationDetails.accused.id;

        // Update points immutably
        let updatedPlayers = game.players.map(player => {
            if (player.id === accuserId) {
                return { ...player, points: player.points + 1 };
            }
            if (player.id === accusedId) {
                return { ...player, points: player.points - 1 };
            }
            return player;
        });

        let updatedGame = {
            ...game,
            players: updatedPlayers
        };

        // Modal logic (all immutable)
        if (game.rules.some(r => r.assignedTo === accuserId)) {
            // Set modals immutably for all players
            updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(player =>
                    player.id === accuserId
                        ? { ...player, currentModal: 'SuccessfulAccusationRuleSelection' }
                        : { ...player, currentModal: 'AwaitRuleSelection' }
                )
            };
        } else if (updatedGame.activePromptDetails !== null) {
            updatedGame.activeAccusationDetails = null;
            updatedGame = setAllPlayerModals(updatedGame, 'PromptPerformance');
        } else {
            updatedGame.activeAccusationDetails = null;
            updatedGame = setAllPlayerModals(updatedGame, null);
        }

        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // End accusation
    socket.on('end_accusation', ({ gameId }) => {
        console.log('SERVER: end_accusation');
        let game = games.get(gameId);
        if (!game) return;

        let updatedGame = { ...game, activeAccusationDetails: null };

        if (updatedGame.activePromptDetails !== null) {
            updatedGame = setAllPlayerModals(updatedGame, 'PromptPerformance');
        } else {
            updatedGame = setAllPlayerModals(updatedGame, null);
        }

        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });




    // Give prompt
    socket.on('give_prompt', ({ gameId, playerId, promptId }) => {
        console.log('SERVER: give_prompt');
        let game = games.get(gameId);
        if (!game) return;

        const promptedPlayer = game.players.find(p => p.id === playerId);
        const prompt = game.prompts.find(p => p.id === promptId);
        if (promptedPlayer && prompt) {
            const updatedPrompts = game.prompts.map(p =>
                p.id === promptId ? { ...p, isActive: false } : p
            );
            const updatedGame = {
                ...game,
                prompts: updatedPrompts,
                activePromptDetails: {
                    selectedPrompt: { ...prompt, isActive: false },
                    selectedPlayer: promptedPlayer,
                    isPromptAccepted: null
                }
            };
            games.set(gameId, updatedGame);
            io.to(gameId).emit('game_updated', updatedGame);
        } else if (!promptedPlayer && !prompt) {
            socket.emit('error', { message: 'Player and prompt not found' });
        } else if (!promptedPlayer) {
            socket.emit('error', { message: 'Player not found' });
        } else if (!prompt) {
            socket.emit('error', { message: 'Prompt not found' });
        }
    });

    socket.on('update_active_prompt_details', ({ gameId, details }) => {
        console.log('SERVER: update_active_prompt_details');
        let game = games.get(gameId);
        if (!game) return;
        game.activePromptDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // Accept prompt
    socket.on('accept_prompt', ({ gameId }) => {
        console.log('SERVER: accept_prompt');
        let game = games.get(gameId);
        if (!game) return;
        if (game.activePromptDetails === null) return;
        if (game.activePromptDetails.selectedPlayer === null) return;

        const updatedPlayers = game.players.map(p =>
            p.id === game.activePromptDetails.selectedPlayer.id
                ? { ...p, points: p.points + 2 }
                : p
        );
        const updatedGame = {
            ...game,
            players: updatedPlayers,
            activePromptDetails: {
                ...game.activePromptDetails,
                isPromptAccepted: true
            }
        };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('possibly_return_to_prompt', ({ gameId }) => {
        console.log('SERVER: possibly_return_to_prompt');
        let game = games.get(gameId);
        if (!game) return;
        if (game.activePromptDetails !== null) {
            game = setAllPlayerModals(game, 'PromptPerformance');
        } else {
            game = setAllPlayerModals(game, null);
        }
        io.to(gameId).emit('game_updated', game);
    });

    // Shred rule
    socket.on('shred_rule', ({ gameId, ruleId }) => {
        console.log('SERVER: shred_rule');
        let game = games.get(gameId);
        if (!game) return;
        let rule = game.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.assignedTo = null;
            rule.isActive = false;
        }
        const updatedGame = { ...game, rules: game.rules.filter(r => r.id !== ruleId) };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // End prompt
    socket.on('end_prompt', ({ gameId }) => {
        console.log('SERVER: end_prompt');
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = { ...game, activePromptDetails: null };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });



    // Initiate clone rule
    socket.on('update_active_cloning_details', ({ gameId, details }) => {
        console.log('SERVER: update_active_cloning_details');
        let game = games.get(gameId);
        if (!game) return;
        game.activeCloneRuleDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // Clone rule to player
    socket.on('clone_rule_to_player', ({ gameId, ruleId, targetPlayerId, authorId }) => {
        console.log('SERVER: clone_rule_to_player');
        let game = games.get(gameId);
        if (!game) return;

        const ruleToClone = game.rules.find(r => r.id === ruleId);
        if (!ruleToClone) return;

        const clonedRule = {
            ...ruleToClone,
            id: Math.random().toString(36).substring(2, 15),
            assignedTo: targetPlayerId,
        };
        const updatedGame = { ...game, rules: [...game.rules, clonedRule] };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // End clone rule
    socket.on('end_clone_rule', ({ gameId }) => {
        console.log('SERVER: end_clone_rule');
        let game = games.get(gameId);
        if (!game) return;
        game.activeCloneRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });



    // Update active flipping details
    socket.on('update_active_flipping_details', ({ gameId, details }) => {
        console.log('SERVER: update_active_flipping_details');
        let game = games.get(gameId);
        if (!game) return;
        game.activeFlipRuleDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // End flip rule
    socket.on('end_flip_rule', ({ gameId }) => {
        console.log('SERVER: end_flip_rule');
        let game = games.get(gameId);
        if (!game) return;
        game.activeFlipRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });



    socket.on('trigger_up_down_modifier', ({ gameId, direction }) => {
        console.log('SERVER: trigger_up_down_modifier');
        let game = games.get(gameId);
        if (!game) return;
        game.activeUpDownRuleDetails = {
            direction,
            selectedRules: {},
            isComplete: false
        };
        io.to(gameId).emit('game_updated', game);
    });

    // Update active up/down details
    socket.on('update_active_up_down_details', ({ gameId, details }) => {
        console.log('SERVER: update_active_up_down_details');
        let game = games.get(gameId);
        if (!game) return;

        game.activeUpDownRuleDetails = details;

        io.to(gameId).emit('game_updated', game);
    });

    // End up/down rule
    socket.on('end_up_down_rule', ({ gameId }) => {
        console.log('SERVER: end_up_down_rule');
        let game = games.get(gameId);
        if (!game) return;
        game.activeUpDownRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });


    // Update active swapping details
    socket.on('update_active_swapping_details', ({ gameId, details }) => {
        console.log('SERVER: update_active_swapping_details');
        let game = games.get(gameId);
        if (!game) return;
        game.activeSwapRuleDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // End swap rule
    socket.on('end_swap_rule', ({ gameId }) => {
        console.log('SERVER: end_swap_rule');
        let game = games.get(gameId);
        if (!game) return;
        game.activeSwapRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });

    // Swap rules
    socket.on('swap_rules', ({ gameId, player1Id, player1RuleId, player2Id, player2RuleId }) => {
        console.log('SERVER: swap_rules');
        let game = games.get(gameId);
        if (!game) return;

        const player1Rule = game.rules.find(r => r.id === player1RuleId);
        const player2Rule = game.rules.find(r => r.id === player2RuleId);

        player1Rule.assignedTo = player2Id;
        player2Rule.assignedTo = player1Id;

        io.to(gameId).emit('game_updated', game);
    });



    // Assign rule
    socket.on('assign_rule', ({ gameId, ruleId, playerId }) => {
        console.log('SERVER: assign_rule');
        let game = games.get(gameId);
        if (!game) return;

        const rule = game.rules.find(r => r.id === ruleId);
        const player = game.players.find(p => p.id === playerId);

        if (rule && player) {
            rule.assignedTo = player.id;
            io.to(gameId).emit('game_updated', game);
        }
    });



    // Broadcast navigation to screen
    socket.on('broadcast_navigate_to_screen', ({ gameId, screen, params }) => {
        console.log('SERVER: broadcast_navigate_to_screen');
        let game = games.get(gameId);
        if (!game) return;

        let updatedGame = setAllPlayerModals(game, null);

        io.to(gameId).emit('game_updated', updatedGame);
        io.to(gameId).emit('navigate_to_screen', {
            screen,
            params
        });
    });

    // End game
    socket.on('end_game', ({ gameId, winner }) => {
        console.log('SERVER: end_game');
        let game = games.get(gameId);
        if (!game) return;
        game.gameEnded = true;
        game.winner = winner;
        io.to(gameId).emit('game_updated', game);
    });

    // Broadcast end game continue
    socket.on('broadcast_end_game_continue', ({ gameId }) => {
        console.log('SERVER: broadcast_end_game_continue');
        let game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('end_game_continue');
    });

    // Broadcast end game end
    socket.on('broadcast_end_game_end', ({ gameId }) => {
        console.log('SERVER: broadcast_end_game_end');
        let game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('end_game_end');
    });

    // Remove player
    socket.on('remove_player', ({ gameId, playerId }) => {
        console.log('SERVER: remove_player');
        let game = games.get(gameId);
        if (!game) return;

        // Remove the player from the game
        const updatedGame = removePlayerFromGame(game, playerId);

        // Clean up player data and socket room
        players.delete(playerId);
        socket.leave(gameId);

        // If the game was ended, remove it from storage
        if (updatedGame === null) {
            games.delete(game.id);
            games.delete(game.lobbyCode);
            return;
        }

        // Update the game in storage
        games.set(gameId, updatedGame);
        games.set(updatedGame.lobbyCode, updatedGame);

        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log('SERVER: disconnect');
        // Find and remove player
        for (const [playerId, playerData] of players.entries()) {
            console.log('disconnecting playerData', playerData);
            if (playerData.socketId === socket.id) {
                const game = games.get(playerData.gameId);
                if (game) {
                    const updatedGame = removePlayerFromGame(game, playerId);

                    // If the game was ended, remove it from storage
                    if (updatedGame === null) {
                        games.delete(game.id);
                        games.delete(game.lobbyCode);
                    } else {
                        // Update the game in storage
                        games.set(game.id, updatedGame);
                        games.set(updatedGame.lobbyCode, updatedGame);

                        // Broadcast updated game state
                        io.to(game.id).emit('game_updated', updatedGame);
                    }
                }
                // Remove the player's socket from the game room
                socket.leave(playerData.gameId);
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

// Function to get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost'; // fallback
}

const PORT = process.env.PORT || 3001;
const LOCAL_IP = getLocalIPAddress();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Network access: http://${LOCAL_IP}:${PORT}/health`);
    }
});