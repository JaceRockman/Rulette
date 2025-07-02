import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StripedBackgroundProps {
    children: React.ReactNode;
}

export default function StripedBackground({ children }: StripedBackgroundProps) {
    return (
        <View style={styles.stripedBackground}>
            {/* Vertical stripes */}
            <View style={[styles.stripe, styles.redStripe]} />
            <View style={[styles.stripe, styles.yellowStripe]} />
            <View style={[styles.stripe, styles.orangeStripe]} />
            <View style={[styles.stripe, styles.blueStripe]} />
            <View style={[styles.stripe, styles.maroonStripe]} />
            {/* Content overlays the stripes */}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    stripedBackground: {
        flex: 1,
        position: 'absolute',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
    },
    stripe: {
        top: 0,
        bottom: 0,
        width: '11.11%',
    },
    maroonStripe: {
        backgroundColor: '#b6475e', // maroon
        width: '11.11%',
        position: 'absolute',
        left: "44.44%"
    },
    blueStripe: {
        backgroundColor: '#6bb9d3', // blue
        width: '33.33%',
        position: 'absolute',
        left: "33.33%"
    },
    orangeStripe: {
        backgroundColor: '#f3a962', // orange
        width: '55.55%',
        position: 'absolute',
        left: "22.22%"
    },
    yellowStripe: {
        backgroundColor: '#f6d170', // yellow
        width: '77.77%',
        position: 'absolute',
        left: "11.11%"
    },
    redStripe: {
        backgroundColor: '#ed5c5d', // red
        width: '100%',
        position: 'absolute',
        left: "0%"
    },
}); 