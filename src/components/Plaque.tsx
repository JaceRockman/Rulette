import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../shared/styles';

interface PlaqueProps {
    text: string;
    plaqueColor: string;
    style?: any;
    onPress?: () => void;
}

export default function Plaque({ text, plaqueColor, style, onPress }: PlaqueProps) {
    // Determine text color based on plaque color (same logic as wheel segments)
    const isLightPlaque = plaqueColor === colors.gameChangerWhite;

    const PlaqueContent = (
        <View style={[styles.plaqueBack, { backgroundColor: plaqueColor }, style]}>
            <Text style={styles.plaqueText} numberOfLines={3}>
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
    plaqueBack: {
        minWidth: '40%',
        margin: '5%',
        borderRadius: 15,
        borderWidth: 2,
        minHeight: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plaqueText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 22,
        color: colors.gameChangerBlack,
    },
}); 