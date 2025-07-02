export interface Player {
    id: string;
    name: string;
    points: number;
    rules: Rule[];
    isHost: boolean;
}

export interface Prompt {
    id: string;
    text: string;
    category?: string;
}

export interface Rule {
    id: string;
    text: string;
    assignedTo?: string; // player id (optional - assigned when wheel lands on it)
    isActive: boolean;
}

export interface GameState {
    id: string;
    code: string;
    players: Player[];
    prompts: Prompt[];
    rules: Rule[];
    currentPlayer?: string;
    isGameStarted: boolean;
    isWheelSpinning: boolean;
    currentStack: StackItem[];
    roundNumber: number;
}

export interface StackItem {
    type: 'rule' | 'prompt' | 'modifier';
    content: Rule | Prompt | string;
}

export interface LobbySettings {
    maxPlayers: number;
    startingPoints: number;
    pointsPerPrompt: number;
    pointsPerRuleBreak: number;
}

export interface GameEvent {
    type: 'player_joined' | 'player_left' | 'game_started' | 'wheel_spun' | 'points_changed' | 'rule_assigned' | 'rule_swapped';
    data: any;
    timestamp: number;
} 