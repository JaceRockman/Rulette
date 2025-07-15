import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../shared/styles';

interface PlaqueProps {
    text: string;
    plaqueColor: string;
    style?: any;
    onPress?: () => void;
    selected?: boolean;
}

export default function Plaque({ text, plaqueColor, style, onPress, selected }: PlaqueProps) {
    const PlaqueContent = (
        <View style={[
            styles.plaqueBack,
            onPress && styles.selectablePlaque,
            selected && styles.selectedPlaque,
            { backgroundColor: plaqueColor },
            style
        ]}>
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
    selectedPlaque: {
        boxShadow: '8px 8px 8px 0 rgba(0, 0, 0, 0.5)',
        transform: [{ translateY: -4 }],
    },
    selectablePlaque: {
        boxShadow: '3px 3px 3px 0 rgba(0, 0, 0, 0.5)',
    },
    plaqueBack: {
        minWidth: '40%',
        margin: '5%',
        borderRadius: 15,
        borderWidth: 3,
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