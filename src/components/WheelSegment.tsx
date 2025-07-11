import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WheelLayer } from '../types/game';
import Plaque from './Plaque';

interface WheelSegmentProps {
    currentPlaque: WheelLayer;
    color: string;
}

export default function WheelSegment({ currentPlaque, color }: WheelSegmentProps) {

    const currentPlaqueColor = currentPlaque?.plaqueColor || '#fff';

    // Get layer type text
    const getLayerTypeText = () => {
        switch (currentPlaque.type) {
            case 'rule': return 'RULE';
            case 'prompt': return 'PROMPT';
            case 'modifier': return 'MODIFIER';
            case 'end': return 'END';
            default: return '';
        }
    };

    return (
        <View style={[styles.wheelSegment, { backgroundColor: color }]}>
            <Plaque
                text={getLayerTypeText()}
                plaqueColor={currentPlaqueColor}
            />

            {/* Peg at the top right */}
            <View style={styles.peg} />
        </View >
    );
}

const styles = StyleSheet.create({
    wheelSegment: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#000',
        marginVertical: 2,
        paddingHorizontal: 8,
        flexDirection: 'row',
        position: 'relative',
    },
    peg: {
        position: 'absolute',
        top: -8,
        right: 8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        zIndex: 2,
    }
});