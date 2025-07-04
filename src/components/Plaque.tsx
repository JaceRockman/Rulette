import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface PlaqueProps {
    text: string;
    plaqueColor: string;
    onPress?: () => void;
    style?: any;
}

export default function Plaque({ text, plaqueColor, onPress, style }: PlaqueProps) {
    // Determine text color based on plaque color (same logic as wheel segments)
    const isLightPlaque = plaqueColor === '#fbbf24' || plaqueColor === '#fff';
    const textColor = isLightPlaque ? '#000' : '#fff';

    const PlaqueContent = (
        <View
            style={[
                {
                    backgroundColor: plaqueColor,
                    borderRadius: 15,
                    paddingHorizontal: 20,
                    paddingVertical: 15,
                    borderWidth: 2,
                    borderColor: '#000',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    minHeight: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                style
            ]}
        >
            <Text
                style={{
                    color: textColor,
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    lineHeight: 22,
                }}
                numberOfLines={3}
            >
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