import io, { Socket } from 'socket.io-client';
import { GameState, Player, Prompt, Rule } from '../types/game';

const SERVER_URL = 'http://192.168.1.201:3001'; // Your computer's IP address

class SocketService {
    private socket: Socket | null = null;
    private gameState: GameState | null = null;
    private currentPlayerId: string | null = null;

    // Event callbacks
    private onGameUpdated: ((gameState: GameState) => void) | null = null;
    private onError: ((error: string) => void) | null = null;
    private onJoinedLobby: ((data: { playerId: string; game: GameState }) => void) | null = null;
    private onLobbyCreated: ((data: { playerId: string; game: GameState }) => void) | null = null;
    private onGameStarted: (() => void) | null = null;
    private onWheelSpun: ((stack: any[]) => void) | null = null;
    private onSynchronizedWheelSpin: ((data: { spinningPlayerId: string; finalIndex: number; scrollAmount: number; duration: number }) => void) | null = null;
    private onNavigateToScreen: ((data: { screen: string; params?: any }) => void) | null = null;

    connect() {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
        });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('error', (error: { message: string }) => {
            console.error('Socket error:', error);
            this.onError?.(error.message);
        });

        this.socket.on('game_updated', (gameState: GameState) => {
            this.gameState = gameState;
            this.onGameUpdated?.(gameState);
        });

        this.socket.on('joined_lobby', (data: { playerId: string; game: GameState }) => {
            this.currentPlayerId = data.playerId;
            this.gameState = data.game;
            this.onJoinedLobby?.(data);
        });

        this.socket.on('lobby_created', (data: { playerId: string; game: GameState }) => {
            this.currentPlayerId = data.playerId;
            this.gameState = data.game;
            this.onLobbyCreated?.(data);
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

    // Game actions
    createLobby(playerName: string) {
        if (!this.socket) return;
        this.socket.emit('create_lobby', { playerName });
    }

    joinLobby(code: string, playerName: string) {
        if (!this.socket) return;
        this.socket.emit('join_lobby', { code, playerName });
    }

    markRulesCompleted() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('rules_completed', { gameId: this.gameState.id, playerId: this.currentPlayerId });
    }

    markPromptsCompleted() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('prompts_completed', { gameId: this.gameState.id, playerId: this.currentPlayerId });
    }

    addPlaque(plaque: { id: string; type: 'rule' | 'prompt'; text: string; category?: string; authorId: string; plaqueColor: string; isActive?: boolean }) {
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

    updatePlaque(plaque: { id: string; type: 'rule' | 'prompt'; text: string; category?: string; authorId: string; plaqueColor: string; isActive?: boolean }) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_plaque', {
            gameId: this.gameState.id,
            plaque
        });
    }

    updateRule(plaqueObject: { id: string; text: string; isActive: boolean; authorId: string; plaqueColor: string }) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_rule', {
            gameId: this.gameState.id,
            plaqueObject
        });
    }

    updatePrompt(plaqueObject: { id: string; text: string; category?: string; authorId: string; plaqueColor: string }) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_prompt', {
            gameId: this.gameState.id,
            plaqueObject
        });
    }

    startGame() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('start_game', { gameId: this.gameState.id });
    }

    spinWheel() {
        if (!this.socket || !this.gameState || !this.currentPlayerId) return;
        this.socket.emit('spin_wheel', { gameId: this.gameState.id, playerId: this.currentPlayerId });
    }

    broadcastSynchronizedWheelSpin(finalIndex: number, scrollAmount: number, duration: number) {
        if (!this.socket || !this.gameState || !this.currentPlayerId) return;
        this.socket.emit('broadcast_synchronized_wheel_spin', {
            gameId: this.gameState.id,
            spinningPlayerId: this.gameState.activePlayer || this.currentPlayerId,
            finalIndex,
            scrollAmount,
            duration
        });
    }

    broadcastNavigateToScreen(screen: string, params?: any) {
        if (!this.socket || !this.gameState || !this.currentPlayerId) return;
        this.socket.emit('broadcast_navigate_to_screen', {
            gameId: this.gameState.id,
            screen,
            params
        });
    }

    advanceToNextPlayer() {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('advance_to_next_player', {
            gameId: this.gameState.id
        });
    }

    updatePoints(playerId: string, points: number) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('update_points', {
            gameId: this.gameState.id,
            playerId,
            points
        });
    }

    swapRules(player1Id: string, player2Id: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('swap_rules', {
            gameId: this.gameState.id,
            player1Id,
            player2Id
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

    assignRuleToCurrentPlayer(ruleId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('assign_rule_to_current_player', {
            gameId: this.gameState.id,
            ruleId
        });
    }

    removeWheelLayer(segmentId: string) {
        if (!this.socket || !this.gameState) return;
        this.socket.emit('remove_wheel_layer', {
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
    getCurrentPlayerId(): string | null {
        return this.currentPlayerId;
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
        this.currentPlayerId = null;
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService; 