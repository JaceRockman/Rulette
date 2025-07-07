import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DigitalClockProps {
    value: number;
    style?: any;
}

// Define the segments for each digit (0-9)
const digitSegments = {
    0: [true, true, true, true, true, true, false], // a,b,c,d,e,f (g is false)
    1: [false, true, true, false, false, false, false], // b,c
    2: [true, true, false, true, true, false, true], // a,b,d,e,g
    3: [true, true, true, true, false, false, true], // a,b,c,d,g
    4: [false, true, true, false, false, true, true], // b,c,f,g
    5: [true, false, true, true, false, true, true], // a,c,d,f,g
    6: [true, false, true, true, true, true, true], // a,c,d,e,f,g
    7: [true, true, true, false, false, false, false], // a,b,c
    8: [true, true, true, true, true, true, true], // all segments
    9: [true, true, true, true, false, true, true], // a,b,c,d,f,g
};

const DigitalClock: React.FC<DigitalClockProps> = ({ value, style }) => {
    // Ensure value is within bounds (0-99)
    const clampedValue = Math.max(0, Math.min(99, value));
    const digits = clampedValue.toString().padStart(2, '0').split('').map(Number);

    const renderDigit = (digit: number, index: number) => {
        const segments = digitSegments[digit as keyof typeof digitSegments] || digitSegments[0];

        return (
            <View key={index} style={styles.digitContainer}>
                {/* Top horizontal segment (a) */}
                <View style={[styles.segment, styles.horizontalSegment, styles.segmentA, segments[0] ? styles.activeSegment : styles.inactiveSegment]} />

                {/* Top right vertical segment (b) */}
                <View style={[styles.segment, styles.verticalSegment, styles.segmentB, segments[1] ? styles.activeSegment : styles.inactiveSegment]} />

                {/* Bottom right vertical segment (c) */}
                <View style={[styles.segment, styles.verticalSegment, styles.segmentC, segments[2] ? styles.activeSegment : styles.inactiveSegment]} />

                {/* Bottom horizontal segment (d) */}
                <View style={[styles.segment, styles.horizontalSegment, styles.segmentD, segments[3] ? styles.activeSegment : styles.inactiveSegment]} />

                {/* Bottom left vertical segment (e) */}
                <View style={[styles.segment, styles.verticalSegment, styles.segmentE, segments[4] ? styles.activeSegment : styles.inactiveSegment]} />

                {/* Top left vertical segment (f) */}
                <View style={[styles.segment, styles.verticalSegment, styles.segmentF, segments[5] ? styles.activeSegment : styles.inactiveSegment]} />

                {/* Middle horizontal segment (g) */}
                <View style={[styles.segment, styles.horizontalSegment, styles.segmentG, segments[6] ? styles.activeSegment : styles.inactiveSegment]} />
            </View>
        );
    };

    return (
        <View style={[styles.container, style]}>
            {digits.map((digit, index) => renderDigit(digit, index))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    digitContainer: {
        width: 20,
        height: 35,
        marginHorizontal: 1,
        position: 'relative',
    },
    segment: {
        position: 'absolute',
        backgroundColor: '#ff0000',
        borderRadius: 1,
    },
    horizontalSegment: {
        height: 3,
        width: 16,
    },
    verticalSegment: {
        width: 3,
        height: 14,
    },
    activeSegment: {
        backgroundColor: '#ff0000',
        shadowColor: '#ff0000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 8,
    },
    inactiveSegment: {
        backgroundColor: '#330000',
    },
    // Segment positioning
    segmentA: { top: 0, left: 2 }, // Top horizontal
    segmentB: { top: 2, right: 0 }, // Top right vertical
    segmentC: { bottom: 2, right: 0 }, // Bottom right vertical
    segmentD: { bottom: 0, left: 2 }, // Bottom horizontal
    segmentE: { bottom: 2, left: 0 }, // Bottom left vertical
    segmentF: { top: 2, left: 0 }, // Top left vertical
    segmentG: { top: 16, left: 2 }, // Middle horizontal
});

export default DigitalClock; 