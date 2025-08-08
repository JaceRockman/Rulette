import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../shared/styles';
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
        shadowColor: '#000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        transform: [{ translateY: -4 }],
    },
    selectablePlaque: {
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
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