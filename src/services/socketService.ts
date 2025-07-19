import io, { Socket } from 'socket.io-client';
import { ActiveAccusationDetails, ActiveCloneRuleDetails, ActiveFlipRuleDetails, ActivePromptDetails, ActiveSwapRuleDetails, ActiveUpDownRuleDetails, GameState, Plaque, Player, Prompt, Rule, WheelSpinDetails } from '../types/game';

const SERVER_URL = 'http://192.168.1.57:3001'; // Your computer's IP address

class SocketService {
    private socket: Socket | null = null;
    private gameState: GameState | null = null;
    private currentUserId: string | null = null;

    connect() {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
        });

        this.setupEventListeners();
    }

    // Event callbacks
    private onGameUpdated: ((gameState: GameState) => void) | null = null;
    private onError: ((error: string) => void) | null = null;
    private onJoinedLobby: ((data: { playerId: string; game: GameState }) => void) | null = null;
    private onLobbyCreated: ((data: { playerId: string; game: GameState }) => void) | null = null;
    private onGameStarted: (() => void) | null = null;
    private onWheelSpun: ((stack: any[]) => void) | null = null;
    private onSynchronizedWheelSpin: ((data: { spinningPlayerId: string; finalIndex: number; scrollAmount: number; duration: number }) => void) | null = null;
    private onNavigateToScreen: ((data: { screen: string; params?: any }) => void) | null = null;
    private onEndGameContinue: (() => void) | null = null;
    private onEndGameEnd: (() => void) | null = null;


    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('error', (error: { message: string }) => {
            console.error('Socket error:', error);
            this.onError?.(error.message);
        });

        this.socket.on('game_updated', (gameState: GameState) => {
            // console.log('SocketService: Game updated:', gameState);
            this.gameState = gameState;
            this.onGameUpdated?.(gameState);
        });

        this.socket.on('joined_lobby', (data: { playerId: string; game: GameState }) => {
            this.currentUserId = data.playerId;
            this.gameState = data.game;
            this.onJoinedLobby?.(data);
        });

        this.socket.on('lobby_created', (data: { playerId: string; game: GameState }) => {
            console.log('SocketService: Lobby created:', data);
            this.currentUserId = data.playerId;
            this.gameState = data.game;
            this.onLobbyCreated?.(data);
        });

        this.socket.on('broadcast_navigate_to_screen', (data: { screen: string; params?: any }) => {
            this.onNavigateToScreen?.(data);
        });

        this.socket.on('game_started', () => {
            this.onGameStarted?.();
        });

        this.socket.on('wheel_spun', (stack: any[]) => {
            this.onWheelSpun?.(stack);
        });

        this.socket.on('synchronized_wheel_spin', (data: { spinningPlayerId: string; finalIndex: number; scrollAmount: number; duration: number }) => {
            this.onSynchronizedWheelSpin?.(data);
        });

        this.socket.on('navigate_to_screen', (data: { screen: string; params?: any }) => {
            this.onNavigateToScreen?.(data);
        });

        this.socket.on('end_game_continue', () => {
            this.onEndGameContinue?.();
        });

        this.socket.on('end_game_end', () => {
            this.onEndGameEnd?.();
        });
    }

    // Event setters
    setOnGameUpdated(callback: (gameState: GameState) => void) {
        this.onGameUpdated = callback;
    }

    setOnError(callback: (error: string) => void) {
        this.onError = callback;
    }

    setOnJoinedLobby(callback: (data: { playerId: string; game: GameState }) => void) {
        this.onJoinedLobby = callback;
    }

    setOnLobbyCreated(callback: (data: { playerId: string; game: GameState }) => void) {
        this.onLobbyCreated = callback;
    }

    setOnGameStarted(callback: () => void) {
        this.onGameStarted = callback;
    }

    setOnWheelSpun(callback: (stack: any[]) => void) {
        this.onWheelSpun = callback;
    }

    setOnSynchronizedWheelSpin(callback: ((data: { spinningPlayerId: string; finalIndex: number; scrollAmount: number; duration: number }) => void) | null) {
        this.onSynchronizedWheelSpin = callback;
    }

    setOnNavigateToScreen(callback: ((data: { screen: string; params?: any }) => void) | null) {
        this.onNavigateToScreen = callback;
    }

    setOnEndGameContinue(callback: (() => void) | null) {
        this.onEndGameContinue = callback;
    }

    setOnEndGameEnd(callback: (() => void) | null) {
        this.onEndGameEnd = callback;
    }

    // Game actions
    createLobby(playerName: string) {
        if (!this.socket) return;
        this.socket.emit('create_lobby', { playerName });
    }

    joinLobby(lobbyCode: string, playerName: string) {
        if (!this.socket) return;
        this.socket.emit('join_lobby', { lobbyCode, playerName });
    }



    markRulesCompletedForUser(userId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('rules_completed', { gameId: this.gameState.id, playerId: userId });
    }

    markPromptsCompletedForUser(userId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('prompts_completed', { gameId: this.gameState.id, playerId: userId });
    }

    addPlaque(plaque: Plaque) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('add_plaque', {
            gameId: this.gameState.id,
            plaque
        });
    }

    addPrompt(plaqueObject: { id: string; text: string; category?: string; authorId: string; plaqueColor: string }) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('add_prompt', {
            gameId: this.gameState.id,
            plaqueObject
        });
    }

    addRule(plaqueObject: { id: string; text: string; isActive: boolean; authorId: string; plaqueColor: string }) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('add_rule', {
            gameId: this.gameState.id,
            plaqueObject
        });
    }

    updatePlaque(plaque: { id: string; type: 'rule' | 'prompt' | 'modifier' | 'end'; text: string; category?: string; authorId: string; plaqueColor: string; isActive?: boolean }) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_plaque', {
            gameId: this.gameState.id,
            plaque
        });
    }

    startGame(settings?: { numRules?: number; numPrompts?: number; startingPoints?: number }) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('start_game', { gameId: this.gameState.id, settings });
    }

    setAllPlayerModals(gameId: string, modal: string | undefined) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('set_all_player_modals', {
            gameId,
            modal
        });
    }

    setSelectedRule(ruleId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('set_selected_rule', {
            gameId: this.gameState.id,
            ruleId
        });
    }

    setSelectedPlayerForAction(playerId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('set_selected_player_for_action', {
            gameId: this.gameState.id,
            playerId
        });
    }

    assignRule(ruleId: string, playerId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('assign_rule', {
            gameId: this.gameState.id,
            ruleId,
            playerId
        });
    }

    updateWheelSpinDetails(wheelSpinDetails: WheelSpinDetails | undefined) {
        if (!this.socket || !this.gameState || !this.currentUserId) return;
        this.socket.emit('update_wheel_spin_details', {
            gameId: this.gameState.id,
            wheelSpinDetails
        });
    }

    initiateAccusation(accusationDetails: ActiveAccusationDetails) {
        if (!this.socket || !this.gameState) return;

        const { rule, accuser, accused } = accusationDetails;

        this.socket.emit('initiate_accusation', {
            gameId: this.gameState.id,
            ruleId: rule.id,
            accuserId: accuser.id,
            accusedId: accused.id
        });
    }

    acceptAccusation() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('accept_accusation', {
            gameId: this.gameState.id,
        });
    }

    endAccusation() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('end_accusation', {
            gameId: this.gameState.id,
        });
    }

    broadcastNavigateToScreen(screen: string, params?: any) {
        if (!this.socket || !this.gameState || !this.currentUserId) return;
        this.socket.emit('broadcast_navigate_to_screen', {
            gameId: this.gameState.id,
            screen,
            params
        });
    }

    endGame(winner?: Player) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('end_game', {
            gameId: this.gameState.id,
            winner
        });
    }

    broadcastEndGameContinue() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('broadcast_end_game_continue', {
            gameId: this.gameState.id
        });
    }

    broadcastEndGameEnd() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('broadcast_end_game_end', {
            gameId: this.gameState.id
        });
    }

    advanceToNextPlayer() {
        if (!this.socket || !this.gameState) {
            console.log('SocketService: Cannot advance to next player - socket or gameState not available');
            return;
        }
        this.socket.emit('advance_to_next_player', {
            gameId: this.gameState.id
        });
    }

    updateGameSettings(settings: { numRules?: number; numPrompts?: number; startingPoints?: number }) {
        if (!this.socket || !this.gameState) {
            console.log('SocketService: Cannot update game settings - socket or gameState not available');
            return;
        }
        this.socket.emit('update_game_settings', {
            gameId: this.gameState.id,
            settings
        });
    }

    updatePoints(playerId: string, pointChange: number) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_points', {
            gameId: this.gameState.id,
            playerId,
            pointChange
        });
    }

    givePrompt(playerId: string, promptId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('give_prompt', {
            gameId: this.gameState.id,
            playerId,
            promptId
        });
    }

    updateActivePromptDetails(details: ActivePromptDetails | undefined) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_active_prompt_details', {
            gameId: this.gameState.id,
            details
        });
    }

    acceptPrompt() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('accept_prompt', {
            gameId: this.gameState.id
        });
    }

    possiblyReturnToPrompt() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('possibly_return_to_prompt', {
            gameId: this.gameState.id
        });
    }

    endPrompt() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('end_prompt', {
            gameId: this.gameState.id
        });
    }

    shredRule(ruleId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('shred_rule', {
            gameId: this.gameState.id,
            ruleId
        });
    }

    updateActiveCloningDetails(details: ActiveCloneRuleDetails) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_active_cloning_details', {
            gameId: this.gameState.id,
            details
        });
    }

    cloneRuleToPlayer(ruleId: string, targetPlayerId: string, authorId?: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('clone_rule_to_player', {
            gameId: this.gameState.id,
            ruleId,
            targetPlayerId,
            authorId
        });
    }

    endCloneRule() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('end_clone_rule', {
            gameId: this.gameState.id
        });
    }


    updateActiveFlippingDetails(details: ActiveFlipRuleDetails) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_active_flipping_details', {
            gameId: this.gameState.id,
            details
        });
    }

    endFlipRule() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('end_flip_rule', {
            gameId: this.gameState.id
        });
    }



    triggerSwapModifier(player: Player, modifierId?: string) {
        if (!this.socket || !this.gameState) return;
        const details: ActiveSwapRuleDetails = {
            swapper: player,
        }
        this.updateActiveSwappingDetails(details);
    }

    updateActiveSwappingDetails(details: ActiveSwapRuleDetails) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_active_swapping_details', {
            gameId: this.gameState.id,
            details
        });
    }


    swapRules(player1Id: string, player1RuleId: string, player2Id: string, player2RuleId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('swap_rules', {
            gameId: this.gameState.id,
            player1Id,
            player1RuleId,
            player2Id,
            player2RuleId
        });
    }

    endSwapRule() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('end_swap_rule', {
            gameId: this.gameState.id
        });
    }

    updateActiveUpDownDetails(details: ActiveUpDownRuleDetails) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_active_up_down_details', {
            gameId: this.gameState.id,
            details
        });
    }

    triggerUpDownModifier(direction: 'up' | 'down') {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('trigger_up_down_modifier', {
            gameId: this.gameState.id,
            direction
        });
    }

    endUpDownRule() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('end_up_down_rule', {
            gameId: this.gameState.id
        });
    }




    removeWheelLayer(segmentId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('remove_wheel_layer', {
            gameId: this.gameState.id,
            segmentId
        });
    }

    completeWheelSpin(segmentId?: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('complete_wheel_spin', {
            gameId: this.gameState.id,
            segmentId
        });
    }

    syncWheelSegments(wheelSegments: any[]) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('sync_wheel_segments', {
            gameId: this.gameState.id,
            wheelSegments
        });
    }

    // Getters
    getCurrentUserId(): string | null {
        return this.currentUserId;
    }

    getGameState(): GameState | null {
        return this.gameState;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.gameState = null;
        this.currentUserId = null;
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService; 