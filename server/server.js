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
            promptsCompleted: false
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
        wheelSpinDetails: undefined,
        currentUser: hostId, // The user ID of the person currently using the app
        activePlayer: undefined, // The player ID of the player currently taking their turn (excludes host)
        selectedPlayerForAction: undefined, // The player ID of the player currently being acted upon
        selectedRule: undefined, // The rule ID of the rule currently being selected

        activeAccusationDetails: undefined,
        activePromptDetails: undefined,
        activeCloneRuleDetails: undefined,
        activeFlipRuleDetails: undefined,
        activeSwapRuleDetails: undefined,
        activeUpDownRuleDetails: undefined,
        currentStack: [],
        roundNumber: 0,
        gameEnded: false,
        winner: undefined,
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
            promptsCompleted: false
        };

        game.players.push(player);
        players.set(playerId, { gameId: game.id, socketId: socket.id });
        socket.join(game.id);

        // Update all players in the game
        io.to(game.id).emit('game_updated', game);
        socket.emit('joined_lobby', { playerId, game });
        socket.emit('navigate_player_to_screen', { screen: 'Lobby', playerId: playerId });
    });

    // Update game settings
    socket.on('update_game_settings', ({ gameId, settings }) => {
        const game = games.get(gameId);
        if (!game) return;

        // Update the game settings
        if (settings.customRulesAndPrompts !== undefined) {
            game.settings.customRulesAndPrompts = settings.customRulesAndPrompts;
        } else {
            game.settings.customRulesAndPrompts = 0;
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

    // Start game
    socket.on('start_game', ({ gameId, settings }) => {
        const game = games.get(gameId);
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
        const game = games.get(gameId);
        if (!game) return;

        console.log('add_plaque', plaque);

        if (plaque.type === 'rule') {
            const rule = {
                ...plaque,
                isActive: true,
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
        } else if (plaque.type === 'end') {
            const end = {
                ...plaque
            };
            game.ends.push(end);
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
            const nonHostPlayers = game.players.filter(p => !p.isHost);
            console.log('nonHostPlayers', nonHostPlayers);
            if (nonHostPlayers.every(p => p.promptsCompleted) && nonHostPlayers.every(p => p.rulesCompleted)) {
                console.log('playerInputCompleted');
                game.playerInputCompleted = true;
            }
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

    socket.on('set_player_modal', ({ gameId, playerId, modal }) => {
        const game = games.get(gameId);
        if (!game) return;
        setPlayerModal(game, playerId, modal);
        io.to(gameId).emit('game_updated', game);
    });

    socket.on('set_all_player_modals', ({ gameId, modal }) => {
        const game = games.get(gameId);
        if (!game) return;
        setAllPlayerModals(game, modal);
        io.to(gameId).emit('game_updated', game);
    });

    socket.on('set_selected_player_for_action', ({ gameId, playerId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.selectedPlayerForAction = playerId;
        io.to(gameId).emit('game_updated', game);
    });

    socket.on('set_selected_rule', ({ gameId, ruleId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.selectedRule = ruleId;
        io.to(gameId).emit('game_updated', game);
    });

    // Update points
    socket.on('update_points', ({ gameId, playerId, pointChange }) => {
        const game = games.get(gameId);
        if (!game) return;

        const player = game.players.find(p => p.id === playerId);
        if (player) {
            player.points = Math.max(0, player.points + pointChange);
            game.selectedRule = undefined;
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

    // Broadcast synchronized wheel spin
    socket.on('update_wheel_spin_details', ({ gameId, wheelSpinDetails }) => {
        const game = games.get(gameId);
        if (!game) return;

        console.log('Server: Updating wheel spin details', wheelSpinDetails);

        game.wheelSpinDetails = wheelSpinDetails;

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('game_updated', game);
    });

    // Complete wheel spin - handles all wheel completion logic centrally
    socket.on('complete_wheel_spin', ({ gameId, segmentId }) => {
        const game = games.get(gameId);
        if (!game) return;

        console.log('Server: Completing wheel spin for game:', gameId);

        // Remove wheel layer if segmentId is provided
        if (segmentId && game.wheelSegments) {
            game.wheelSegments = game.wheelSegments.map(segment => {
                if (segment.id === segmentId) {
                    return {
                        ...segment,
                        currentLayerIndex: segment.currentLayerIndex + 1
                    };
                }
                return segment;
            });
        }

        // Clear wheel spin details
        game.wheelSpinDetails = undefined;

        // Clear any active prompt or accusation details
        game.activePromptDetails = undefined;
        game.activeAccusationDetails = undefined;

        // Advance to next player
        const currentActivePlayer = game.players.find(p => p.id === game.activePlayer);

        if (currentActivePlayer) {
            const currentIndex = game.players.findIndex(p => p.id === game.activePlayer);
            if (currentIndex !== -1) {
                let nextIndex = (currentIndex + 1) % game.players.length;
                while (game.players[nextIndex].isHost) {
                    nextIndex = (nextIndex + 1) % game.players.length;
                }
                game.activePlayer = game.players[nextIndex].id;
            }
        }

        // Broadcast updated game state to all players
        io.to(gameId).emit('game_updated', game);

        // Broadcast navigation to game screen for all players
        io.to(gameId).emit('broadcast_navigate_to_screen', {
            screen: 'Game'
        });
    });

    // Remove wheel layer
    socket.on('remove_wheel_layer', ({ gameId, segmentId }) => {
        const game = games.get(gameId);
        if (!game || !game.wheelSegments) return;

        const segment = game.wheelSegments.find(s => s.id === segmentId);
        console.log('Server: Removing wheel layer', segment);
        if (segment) {
            segment.currentLayerIndex = Math.min(segment.currentLayerIndex + 1, segment.layers.length - 1);
            console.log('Server: Updated wheel segments', game.wheelSegments);
            io.to(gameId).emit('game_updated', game);
        }
    });

    // Advance to next player
    socket.on('advance_to_next_player', ({ gameId }) => {
        const game = games.get(gameId);
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
            if (game.activePromptDetails !== undefined) {
                setAllPlayerModals(game, 'PromptPerformance');
            } else {
                setAllPlayerModals(game, undefined);
            }
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




    // Give prompt
    socket.on('give_prompt', ({ gameId, playerId, promptId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const promptedPlayer = game.players.find(p => p.id === playerId);
        const prompt = game.prompts.find(p => p.id === promptId);
        if (promptedPlayer && prompt) {
            prompt.isActive = false;
            game.activePromptDetails = {
                selectedPrompt: prompt,
                selectedPlayer: promptedPlayer,
                isPromptAccepted: undefined
            };
            io.to(gameId).emit('game_updated', game);
        } else if (!promptedPlayer && !prompt) {
            socket.emit('error', { message: 'Player and prompt not found' });
        } else if (!promptedPlayer) {
            socket.emit('error', { message: 'Player not found' });
        } else if (!prompt) {
            socket.emit('error', { message: 'Prompt not found' });
        }
    });

    socket.on('update_active_prompt_details', ({ gameId, details }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activePromptDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // Accept prompt
    socket.on('accept_prompt', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        if (game.activePromptDetails === undefined) return;
        if (game.activePromptDetails.selectedPlayer === undefined) return;
        const promptedPlayer = game.players.find(p => p.id === game.activePromptDetails.selectedPlayer.id);
        game.activePromptDetails.isPromptAccepted = true;
        promptedPlayer.points += 2;
        io.to(gameId).emit('game_updated', game);
    });

    socket.on('possibly_return_to_prompt', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        if (game.activePromptDetails !== undefined) {
            setAllPlayerModals(game, 'PromptPerformance');
        } else {
            setAllPlayerModals(game, undefined);
        }
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

    // End prompt
    socket.on('end_prompt', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activePromptDetails = undefined;
        io.to(gameId).emit('game_updated', game);
    });



    // Initiate clone rule
    socket.on('update_active_cloning_details', ({ gameId, details }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activeCloneRuleDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // Clone rule to player
    socket.on('clone_rule_to_player', ({ gameId, ruleId, targetPlayerId, authorId }) => {
        const game = games.get(gameId);
        if (!game) return;

        const ruleToClone = game.rules.find(r => r.id === ruleId);
        if (!ruleToClone) return;

        const clonedRule = {
            ...ruleToClone,
            id: Math.random().toString(36).substring(2, 15),
            assignedTo: targetPlayerId,
        };
        game.rules.push(clonedRule);
        io.to(gameId).emit('game_updated', game);
    });

    // End clone rule
    socket.on('end_clone_rule', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activeCloneRuleDetails = undefined;
        setAllPlayerModals(game, undefined);
        io.to(gameId).emit('game_updated', game);
    });



    // Update active flipping details
    socket.on('update_active_flipping_details', ({ gameId, details }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activeFlipRuleDetails = details;
        io.to(gameId).emit('game_updated', game);
    });

    // End flip rule
    socket.on('end_flip_rule', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activeFlipRuleDetails = undefined;
        setAllPlayerModals(game, undefined);
        io.to(gameId).emit('game_updated', game);
    });



    socket.on('trigger_up_down_modifier', ({ gameId, direction }) => {
        const game = games.get(gameId);
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
        const game = games.get(gameId);
        if (!game) return;

        game.activeUpDownRuleDetails = details;

        io.to(gameId).emit('game_updated', game);
    });

    // End up/down rule
    socket.on('end_up_down_rule', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activeUpDownRuleDetails = undefined;
        setAllPlayerModals(game, undefined);
        io.to(gameId).emit('game_updated', game);
    });



    function navigatePlayersForSwapeeSelection(game, details) {
        game.players.forEach(player => {
            if (player.id === details.swapper.id) {
                setPlayerModal(game, player.id, 'SwapActionTargetSelection');
            } else {
                setPlayerModal(game, player.id, "AwaitSwapTargetSelection")
            }
        });
    }

    function navigatePlayersForRuleSwapSelection(game, details) {
        game.players.forEach(player => {
            if (player.id === details.swapper.id) {
                setPlayerModal(game, player.id, 'SwapActionRuleSelection');
            } else {
                setPlayerModal(game, player.id, "AwaitSwapRuleSelection")
            }
        });
    }


    // Update active swapping details
    socket.on('update_active_swapping_details', ({ gameId, details }) => {
        const game = games.get(gameId);
        if (!game) return;

        game.activeSwapRuleDetails = details;

        console.log('game.activeSwapRuleDetails', game.activeSwapRuleDetails);

        if (details.swappee === undefined) {
            navigatePlayersForSwapeeSelection(game, details);
        } else if (details.swapperRule === undefined || details.swappeeRule === undefined) {
            navigatePlayersForRuleSwapSelection(game, details);
        } else {
            setAllPlayerModals(game, 'SwapRuleResolution');
        }

        io.to(gameId).emit('game_updated', game);
    });

    // End swap rule
    socket.on('end_swap_rule', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.activeSwapRuleDetails = undefined;
        setAllPlayerModals(game, undefined);
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



    // Broadcast navigation to screen
    socket.on('broadcast_navigate_to_screen', ({ gameId, screen, params }) => {
        const game = games.get(gameId);
        if (!game) return;

        setAllPlayerModals(game, undefined);

        // Broadcast to all players in the game (including sender for consistency)
        io.to(gameId).emit('navigate_to_screen', {
            screen,
            params
        });
    });

    // End game
    socket.on('end_game', ({ gameId, winner }) => {
        const game = games.get(gameId);
        if (!game) return;
        game.gameEnded = true;
        game.winner = winner;
        io.to(gameId).emit('game_updated', game);
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