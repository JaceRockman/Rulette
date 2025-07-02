import React from 'react';
import { Text, View, StyleSheet, TextProps } from 'react-native';

interface OutlinedTextProps extends TextProps {
    children: React.ReactNode;
    style?: any;
}

export default function OutlinedText({ children, style, ...props }: OutlinedTextProps) {
    return (
        <View style={styles.container}>
            {/* Outline layers */}
            <Text style={[styles.text, styles.outline, { left: -1, top: 0 }]} {...props}>{children}</Text>
            <Text style={[styles.text, styles.outline, { left: 1, top: 0 }]} {...props}>{children}</Text>
            <Text style={[styles.text, styles.outline, { left: 0, top: -1 }]} {...props}>{children}</Text>
            <Text style={[styles.text, styles.outline, { left: 0, top: 1 }]} {...props}>{children}</Text>
            {/* Main text */}
            <Text style={[styles.text, style]} {...props}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: 'bold',
        fontSize: 24,
        color: '#fff',
        textAlign: 'left',
    },
    outline: {
        color: '#000',
        position: 'absolute',
        zIndex: 0,
    },
}); 