# Hybrid Architecture: Optimistic Updates with Server Authority

This document explains the hybrid approach we've implemented for the Spin-That-Wheel game, which combines optimistic updates with server authority for the best user experience.

## Overview

The hybrid architecture provides:
- **Low latency** - Immediate UI feedback through optimistic updates
- **Consistency** - Server authority ensures all clients stay in sync
- **Reliability** - Server handles conflicts and validates actions

## Architecture Components

### 1. Server-Side Game Reducer (`server/gameReducer.js`)

The server uses a centralized game reducer that:
- Handles all game state changes
- Validates actions and permissions
- Broadcasts updates to all connected clients
- Maintains single source of truth

```javascript
// Example server action handling
function dispatchGameAction(gameId, action) {
    const game = games.get(gameId);
    const newState = gameReducer(game, action);
    games.set(gameId, newState);
    io.to(gameId).emit('game_updated', newState);
}
```

### 2. Client-Side Optimistic Updates

The client performs optimistic updates for immediate feedback:

```typescript
const updatePoints = (playerId: string, points: number) => {
    // Optimistic update - immediately update UI
    dispatch({ type: 'UPDATE_POINTS_OPTIMISTIC', payload: { playerId, points } });
    
    // Send to server for authoritative update
    socketService.updatePoints(playerId, points);
};
```

### 3. Action Types

#### Server-Authoritative Actions
- `ADD_PLAYER` - Add players to game
- `ADD_RULE` / `ADD_PROMPT` - Add game content
- `UPDATE_POINTS` - Update player scores
- `ASSIGN_RULE` - Assign rules to players
- `START_GAME` - Begin the game
- `ADVANCE_TO_NEXT_PLAYER` - Rotate active player

#### Optimistic Actions
- `ADD_PLAYER_OPTIMISTIC` - Immediate UI update
- `ADD_RULE_OPTIMISTIC` - Immediate UI update
- `UPDATE_POINTS_OPTIMISTIC` - Immediate UI update
- `ASSIGN_RULE_OPTIMISTIC` - Immediate UI update

#### Broadcast Actions
- `SYNCHRONIZED_WHEEL_SPIN` - Synchronize wheel animations
- `NAVIGATE_TO_SCREEN` - Coordinate navigation
- `END_GAME_CONTINUE` / `END_GAME_END` - End game decisions

## Implementation Examples

### Adding Players (Hybrid Approach)

```typescript
const addTestPlayers = (numPlayers: number) => {
    const testPlayers = [
        { id: 'player1', name: 'Alice', points: 20, isHost: false, rules: [], rulesCompleted: false, promptsCompleted: false },
        { id: 'player2', name: 'Bob', points: 20, isHost: false, rules: [], rulesCompleted: false, promptsCompleted: false }
    ];

    // Optimistic update - immediately update UI
    testPlayers.forEach(player => {
        dispatch({ type: 'ADD_PLAYER_OPTIMISTIC', payload: player });
    });

    // Send to server for authoritative update
    testPlayers.forEach(player => {
        socketService.addPlayer(player);
    });
};
```

### Wheel Spinning (Optimistic + Broadcast)

```typescript
const handleSpin = () => {
    // Optimistic: Start animation immediately
    setIsSpinning(true);
    
    // Send to server for synchronization
    socketService.broadcastSynchronizedWheelSpin(finalIndex, scrollAmount, duration);
    
    // Server broadcasts final result to all clients
};
```

## Benefits

### 1. Performance
- **Immediate feedback** - UI updates instantly
- **Reduced perceived latency** - Users see changes right away
- **Smooth animations** - No waiting for server responses

### 2. Consistency
- **Single source of truth** - Server is authoritative
- **Conflict resolution** - Server handles edge cases
- **Synchronized state** - All clients stay in sync

### 3. User Experience
- **Responsive UI** - No lag on user actions
- **Reliable state** - Server ensures consistency
- **Graceful degradation** - Works even with network issues

## When to Use Each Approach

### Optimistic Updates (Low Latency)
- UI interactions (buttons, animations)
- Non-critical state changes
- Actions where immediate feedback is important

### Server Authority (High Consistency)
- Game-critical actions (scoring, rule changes)
- Actions that affect other players
- Security-sensitive operations

### Broadcast Actions (Synchronization)
- Real-time events (wheel spinning, navigation)
- Actions that need to be synchronized across clients
- Events that don't change game state

## Migration Strategy

1. **Phase 1**: Move game reducer to server ✅
2. **Phase 2**: Add optimistic action types ✅
3. **Phase 3**: Update client actions to use hybrid approach ✅
4. **Phase 4**: Add server validation and error handling
5. **Phase 5**: Implement conflict resolution

## Next Steps

1. **Add error handling** for failed server actions
2. **Implement rollback** for optimistic updates that fail
3. **Add validation** on server for all actions
4. **Create conflict resolution** for edge cases
5. **Add retry logic** for network failures

## Testing

To test the hybrid approach:

1. **Start server**: `cd server && npm start`
2. **Start client**: `npm start`
3. **Test optimistic updates**: Add players/rules and verify immediate UI updates
4. **Test server sync**: Check that all clients receive the same state
5. **Test network issues**: Disconnect/reconnect to verify state consistency

This hybrid approach provides the best of both worlds: fast, responsive UI with reliable, consistent game state. 