import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, SCREEN_WIDTH } from '../shared/styles';
import { Plaque as PlaqueType } from '../types/game';

interface PlaqueProps {
    plaque?: PlaqueType | null;
    concealed?: boolean;
    style?: any;
    onPress?: () => void;
    selected?: boolean;
}

export default function Plaque({ plaque, concealed, style, onPress, selected }: PlaqueProps) {
    if (!plaque) return null;

    const PlaqueContent = (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1} style={styles.plaquePress}>
            <View style={[
                styles.plaqueBack,
                onPress && styles.selectablePlaque,
                selected && styles.selectedPlaque,
                { backgroundColor: plaque.isFlipped ? colors.gameChangerGray : plaque.plaqueColor },
                style
            ]}>
                <Text style={[styles.plaqueText,
                plaque?.type === 'modifier' && { color: colors.gameChangerWhite },
                plaque?.type === 'end' && { color: colors.gameChangerWhite },
                plaque?.isFlipped && { color: plaque.plaqueColor }
                ]}
                    numberOfLines={3}>
                    {concealed ? plaque?.type.toUpperCase() : plaque?.text}
                </Text>
            </View>
        </TouchableOpacity>
    );

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
    plaquePress: {
        width: '46%',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '2%',
    },
    plaqueBack: {
        minWidth: '100%',
        minHeight: 100,
        borderRadius: 15,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plaqueText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 22,
        color: colors.gameChangerBlack,
        flexWrap: 'wrap',
    },
    endPlaqueText: {
        color: colors.gameChangerWhite,
    },
}); 