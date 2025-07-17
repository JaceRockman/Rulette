import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Plaque as PlaqueType } from '../types/game';
import Plaque from './Plaque';

interface WheelSegmentProps {
    plaque: PlaqueType;
    color: string;
}

export default function WheelSegment({ plaque, color }: WheelSegmentProps) {
    console.log('WheelSegment: Rendering plaque:', { type: plaque?.type, text: plaque?.text, concealed: true });

    return (
        <View style={[styles.wheelSegment, { backgroundColor: color }]}>
            <Plaque
                plaque={plaque}
                concealed={true}
            />

            {/* Peg at the top right */}
            <View style={styles.peg} />
        </View >
    );
}

const styles = StyleSheet.create({
    wheelSegment: {
        height: 120, // Should match ITEM_HEIGHT
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'black',
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