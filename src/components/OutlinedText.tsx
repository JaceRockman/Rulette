import React from 'react';
import { Text, View, StyleSheet, TextProps } from 'react-native';

interface OutlinedTextProps extends TextProps {
    children: React.ReactNode;
    style?: any;
}

export default function OutlinedText({ children, style, ...props }: OutlinedTextProps) {
    // Extract textAlign and color from style
    const textAlign = style?.textAlign || 'center';
    const textColor = style?.color || '#fff';
    const borderColor = style?.borderColor || '#000';
    const fontSize = style?.fontSize || 24;

    return (
        <View style={styles.container}>
            {/* Outline layers - positioned absolutely */}
            {/* Horizontal and vertical outlines */}
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: -1, top: 1 }]} {...props}>{children}</Text>
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: 1, top: 1 }]} {...props}>{children}</Text>
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: 0, top: 0 }]} {...props}>{children}</Text>
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: 0, top: 2 }]} {...props}>{children}</Text>
            {/* Diagonal outlines */}
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: -1, top: 0 }]} {...props}>{children}</Text>
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: 1, top: 0 }]} {...props}>{children}</Text>
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: 1, top: 2 }]} {...props}>{children}</Text>
            <Text style={[styles.baseText, styles.outline, { textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: borderColor, left: 1, top: 2 }]} {...props}>{children}</Text>
            {/* Main text - positioned normally */}
            <Text style={[styles.baseText, { margin: 1, textAlign: textAlign === 'justify' ? 'justify' : textAlign, fontSize, color: textColor }, style]} {...props}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    baseText: {
        fontWeight: 'bold' as const,
    },
    outline: {
        position: 'absolute',
        zIndex: 0,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
}); 