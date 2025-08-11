import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import socketService from '../services/socketService';
import { useGame } from '../context/GameContext';

export default function ExitModalButton() {
    const { currentUser } = useGame();

    const handlePress = () => {
        // Clear all player modals
        socketService.setAllPlayerModals(null);
        // Clear all active modifier/prompt/accusation details
        socketService.endCloneRule();
        socketService.endFlipRule();
        socketService.endSwapRule();
        socketService.endUpDownRule();
        socketService.endPrompt();
        socketService.updateWheelSpinDetails(null);
        socketService.updateActiveAccusationDetails(null);
        socketService.updateActivePromptDetails(null);
    };

    if (!currentUser?.isHost) return null;

    return (
        <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.8}>
            <View style={styles.circle}>
                <View style={[styles.line, styles.lineOne]} />
                <View style={[styles.line, styles.lineTwo]} />
            </View>
        </TouchableOpacity>
    );
}

const SIZE = 36;
const LINE_THICKNESS = 2.5;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 9999,
    },
    circle: {
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    line: {
        position: 'absolute',
        width: SIZE * 0.55,
        height: LINE_THICKNESS,
        backgroundColor: '#fff',
        borderRadius: LINE_THICKNESS,
    },
    lineOne: {
        transform: [{ rotate: '45deg' }],
    },
    lineTwo: {
        transform: [{ rotate: '-45deg' }],
    },
});
