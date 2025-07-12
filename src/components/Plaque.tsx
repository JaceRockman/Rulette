import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../shared/styles';

interface PlaqueProps {
    text: string;
    plaqueColor: string;
    style?: any;
    onPress?: () => void;
    onClose?: () => void;
    onHold?: () => void;
}

export default function Plaque({ text, plaqueColor, style, onPress, onClose, onHold }: PlaqueProps) {
    // Determine text color based on plaque color (same logic as wheel segments)
    const isLightPlaque = plaqueColor === colors.gameChangerWhite;
    const textColor = isLightPlaque ? colors.gameChangerBlack : colors.gameChangerWhite;

    const PlaqueContent = (
        <View style={[styles.plaqueContainer, { backgroundColor: plaqueColor }, style]}>
            <Text style={[styles.plaqueText, { color: textColor }]} numberOfLines={3}>
                {text}
            </Text>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {PlaqueContent}
            </TouchableOpacity>
        );
    }

    return PlaqueContent;
}

const styles = StyleSheet.create({
    plaqueContainer: {
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderWidth: 2,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        minHeight: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plaqueText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 22,
    },
}); 