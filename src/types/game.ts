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

export interface WheelLayer {
    type: 'rule' | 'prompt' | 'modifier' | 'end';
    content: Rule | Prompt | string;
    isActive: boolean;
    plaqueColor: string;
}

export interface WheelSegment {
    id: string;
    layers: WheelLayer[];
    currentLayerIndex: number;
    color: string;
    plaqueColor: string;
}

export interface GameState {
    id: string;
    code: string;
    players: Player[];
    prompts: Prompt[];
    rules: Rule[];
    wheelSegments: WheelSegment[];
    currentPlayer?: string;
    isGameStarted: boolean;
    isWheelSpinning: boolean;
    currentStack: StackItem[];
    roundNumber: number;
    numRules: number;
    numPrompts: number;
    gameEnded: boolean;
    winner?: Player;
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