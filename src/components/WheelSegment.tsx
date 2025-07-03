import React from 'react';
import { View, Text } from 'react-native';

interface WheelSegmentProps {
    text: string;
    isSelected: boolean;
    color: string;
    plaqueColor?: string;
    index?: number;
}

export default function WheelSegment({ text, isSelected, color, plaqueColor, index }: WheelSegmentProps) {
    // Determine text color based on plaque color
    const isLightPlaque = plaqueColor === '#fbbf24' || plaqueColor === '#fff';
    const textColor = isLightPlaque ? '#000' : '#fff';

    return (
        <View
            style={{
                height: 120,
                backgroundColor: color,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 4,
                borderColor: '#000',
                marginVertical: 2,
                paddingHorizontal: 8,
                flexDirection: 'row',
                position: 'relative',
            }}
        >
            {/* Peg at the top right */}
            <View
                style={{
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
                }}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
                {/* Plaque */}
                <View
                    style={{
                        backgroundColor: plaqueColor || '#fff',
                        borderRadius: 18,
                        paddingHorizontal: 30,
                        paddingVertical: 25,
                        width: "60%",
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#000',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                    }}
                >
                    <Text
                        style={{
                            color: textColor,
                            fontSize: 18,
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                        numberOfLines={2}
                    >
                        {text}
                    </Text>
                </View>
            </View>
        </View>
    );
} 