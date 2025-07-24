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
        createdAt: Date.now(),
        lobbyCode: lobbyCode,
        players: [{
            id: hostId,
            name: hostName,
            points: 20,
            rules: [],
            isHost: true,
            rulesCompleted: false,
            promptsCompleted: false,
            currentModal: null
        }],
        settings: {
            customRulesAndPrompts: 0,
            startingPoints: 20
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


// Socket connection handling
io.on('connection', (socket) => {

    // Create lobby
    socket.on('create_lobby', ({ playerName }) => {
        const playerId = uuidv4();
        const game = createGame(playerId, playerName);

        players.set(playerId, { gameId: game.id, socketId: socket.id });
        socket.join(game.id);

        socket.emit('lobby_created', { playerId, game });
    });

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

        // Check for duplicate player name (case-insensitive)
        const nameTaken = game.players.some(
            p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
        );
        if (nameTaken) {
            socket.emit('error', { message: 'That name is already taken in this lobby. Please choose a different name.' });
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
            promptsCompleted: false,
            currentModal: null
        };

        const updatedGame = { ...game, players: [...game.players, player] };
        games.set(game.id, updatedGame);
        games.set(game.lobbyCode, updatedGame);
        players.set(playerId, { gameId: game.id, socketId: socket.id });
        socket.join(game.id);

        // Update all players in the game
        io.to(game.id).emit('game_updated', updatedGame);
        socket.emit('joined_lobby', { playerId, game });
        socket.emit('navigate_player_to_screen', { screen: 'Lobby', playerId: playerId });
    });

    // Update game settings
    socket.on('update_game_settings', ({ gameId, settings }) => {
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
        let game = games.get(gameId);
        if (!game) return;

        game.settings = settings;

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
            console.log('destinationScreen', destinationScreen);
            io.to(gameId).emit('navigate_player_to_screen', { screen: destinationScreen, playerId: player.id });
        })
    });

    // Add plaque (unified handler for rules, prompts, and modifiers)
    socket.on('add_plaque', ({ gameId, plaque }) => {
        let game = games.get(gameId);
        if (!game) return;

        console.log('add_plaque', plaque);

        if (plaque.type === 'rule') {
            const rule = {
                ...plaque,
                isActive: true,
                assignedTo: null
            };
            const updatedGame = { ...game, rules: [...game.rules, rule] };
            games.set(gameId, updatedGame);
        } else if (plaque.type === 'prompt') {
            const prompt = {
                ...plaque
            };
            const updatedGame = { ...game, prompts: [...game.prompts, prompt] };
            games.set(gameId, updatedGame);
        } else if (plaque.type === 'modifier') {
            const modifier = {
                ...plaque
            };
            const updatedGame = { ...game, modifiers: [...game.modifiers, modifier] };
            games.set(gameId, updatedGame);
        } else if (plaque.type === 'end') {
            const end = {
                ...plaque
            };
            const updatedGame = { ...game, ends: [...game.ends, end] };
            games.set(gameId, updatedGame);
        }

        io.to(gameId).emit('game_updated', game);
    });

    // Update plaque (unified handler for rules and prompts)
    socket.on('update_plaque', ({ gameId, plaque }) => {
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
        let game = games.get(gameId);
        if (!game) return;

        const updatedGame = { ...game, wheelSegments: wheelSegments };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_player_modal', ({ gameId, playerId, modal }) => {
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = setPlayerModal(game, playerId, modal);
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_all_player_modals', ({ gameId, modal }) => {
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = setAllPlayerModals(game, modal);
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_selected_player_for_action', ({ gameId, playerId }) => {
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = { ...game, selectedPlayerForAction: playerId };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    socket.on('set_selected_rule', ({ gameId, ruleId }) => {
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = { ...game, selectedRule: ruleId };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Update points
    socket.on('update_points', ({ gameId, playerId, pointChange }) => {
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
        let game = games.get(gameId);
        if (!game) return;

        const updatedGame = { ...game, wheelSpinDetails: wheelSpinDetails };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Complete wheel spin - handles all wheel completion logic centrally
    socket.on('complete_wheel_spin', ({ gameId, segmentId }) => {
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

    // Advance to next player
    socket.on('advance_to_next_player', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game) return;

        // Find the current active player
        const currentActivePlayer = game.players.find(p => p.id === game.activePlayer);
        if (!currentActivePlayer) return;

        // Find the index of the current active player
        const currentIndex = game.players.findIndex(p => p.id === game.activePlayer);
        if (currentIndex === -1) return;

        // Find the next non-host player
        let nextIndex = (currentIndex + 1) % game.players.length;
        while (game.players[nextIndex].isHost) {
            nextIndex = (nextIndex + 1) % game.players.length;
        }

        // Set the new active player
        game.activePlayer = game.players[nextIndex].id;

        console.log('Server: Advanced to next player:', game.activePlayer, 'for game:', gameId);
        io.to(gameId).emit('game_updated', game);
    });



    // Start accusation
    socket.on('initiate_accusation', ({ gameId, ruleId, accuserId, accusedId }) => {
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
            },
            isAccusationInProgress: true
        };

        updatedGame = setAllPlayerModals(updatedGame, 'AccusationJudgement');

        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // Accept accusation
    socket.on('accept_accusation', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game || !game.activeAccusationDetails) return;

        const rule = game.rules.find(r => r.id === game.activeAccusationDetails.rule.id);
        if (!rule) return;

        const accuserId = game.activeAccusationDetails.accuser.id;
        const accusedId = game.activeAccusationDetails.accused.id;

        // Update points immutably
        let newPlayers = game.players.map(player => {
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
            players: newPlayers,
            activeAccusationDetails: null
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
            updatedGame = setAllPlayerModals(updatedGame, 'PromptPerformance');
        } else {
            updatedGame = setAllPlayerModals(updatedGame, null);
        }

        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });

    // End accusation
    socket.on('end_accusation', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game) return;

        game.activeAccusationDetails = null;

        if (game.activePromptDetails !== null) {
            game = setAllPlayerModals(game, 'PromptPerformance');
        } else {
            game = setAllPlayerModals(game, null);
        }

        io.to(gameId).emit('game_updated', game);
    });




    // Give prompt
    socket.on('give_prompt', ({ gameId, playerId, promptId }) => {
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
        let game = games.get(gameId);
        if (!game) return;
        game.activePromptDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // Accept prompt
    socket.on('accept_prompt', ({ gameId }) => {
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
        let game = games.get(gameId);
        if (!game) return;
        const updatedGame = { ...game, activePromptDetails: null };
        games.set(gameId, updatedGame);
        io.to(gameId).emit('game_updated', updatedGame);
    });



    // Initiate clone rule
    socket.on('update_active_cloning_details', ({ gameId, details }) => {
        let game = games.get(gameId);
        if (!game) return;
        game.activeCloneRuleDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // Clone rule to player
    socket.on('clone_rule_to_player', ({ gameId, ruleId, targetPlayerId, authorId }) => {
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
        let game = games.get(gameId);
        if (!game) return;
        game.activeCloneRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });



    // Update active flipping details
    socket.on('update_active_flipping_details', ({ gameId, details }) => {
        let game = games.get(gameId);
        if (!game) return;
        game.activeFlipRuleDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // End flip rule
    socket.on('end_flip_rule', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game) return;
        game.activeFlipRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });



    socket.on('trigger_up_down_modifier', ({ gameId, direction }) => {
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
        let game = games.get(gameId);
        if (!game) return;

        game.activeUpDownRuleDetails = details;

        io.to(gameId).emit('game_updated', game);
    });

    // End up/down rule
    socket.on('end_up_down_rule', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game) return;
        game.activeUpDownRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });



    function navigatePlayersForSwapeeSelection(game, details) {
        game.players.forEach(player => {
            if (player.id === details.swapper.id) {
                game = setPlayerModal(game, player.id, 'SwapActionTargetSelection');
            } else {
                game = setPlayerModal(game, player.id, "AwaitSwapTargetSelection")
            }
        });
    }

    function navigatePlayersForRuleSwapSelection(game, details) {
        game.players.forEach(player => {
            if (player.id === details.swapper.id) {
                game = setPlayerModal(game, player.id, 'SwapActionRuleSelection');
            } else {
                game = setPlayerModal(game, player.id, "AwaitSwapRuleSelection")
            }
        });
    }


    // Update active swapping details
    socket.on('update_active_swapping_details', ({ gameId, details }) => {
        let game = games.get(gameId);
        if (!game) return;

        game.activeSwapRuleDetails = details;

        console.log('game.activeSwapRuleDetails', game.activeSwapRuleDetails);

        if (details.swappee === null) {
            navigatePlayersForSwapeeSelection(game, details);
        } else if (details.swapperRule === null || details.swappeeRule === null) {
            navigatePlayersForRuleSwapSelection(game, details);
        } else {
            game = setAllPlayerModals(game, 'SwapRuleResolution');
        }

        io.to(gameId).emit('game_updated', game);
    });

    // End swap rule
    socket.on('end_swap_rule', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game) return;
        game.activeSwapRuleDetails = null;
        game = setAllPlayerModals(game, null);
        io.to(gameId).emit('game_updated', game);
    });

    // Swap rules
    socket.on('swap_rules', ({ gameId, player1Id, player1RuleId, player2Id, player2RuleId }) => {
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
        console.log('Server: Assigning rule:', ruleId, 'to player:', playerId, 'for game:', gameId);
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
        let game = games.get(gameId);
        if (!game) return;
        game.gameEnded = true;
        game.winner = winner;
        io.to(gameId).emit('game_updated', game);
    });

    // Broadcast end game continue
    socket.on('broadcast_end_game_continue', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('end_game_continue');
    });

    // Broadcast end game end
    socket.on('broadcast_end_game_end', ({ gameId }) => {
        let game = games.get(gameId);
        if (!game) return;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('end_game_end');
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
                            console.log('Server: Updated activePlayer after disconnect to:', game.activePlayer, 'for game:', game.id);
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