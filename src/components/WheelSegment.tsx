import React from 'react';
import { View, Text } from 'react-native';
import { WheelLayer } from '../types/game';

interface WheelSegmentProps {
    text: string;
    isSelected: boolean;
    color: string;
    plaqueColor?: string;
    index?: number;
    currentLayer?: WheelLayer;
    layerCount?: number;
    currentLayerIndex?: number;
}

export default function WheelSegment({
    text,
    isSelected,
    color,
    plaqueColor,
    index,
    currentLayer,
    layerCount = 1,
    currentLayerIndex = 0
}: WheelSegmentProps) {
    // Determine text color based on current layer's plaque color
    const currentPlaqueColor = currentLayer?.plaqueColor || plaqueColor || '#fff';
    const isLightPlaque = currentPlaqueColor === '#fbbf24' || currentPlaqueColor === '#fff';
    const textColor = isLightPlaque ? '#000' : '#fff';

    // Get layer type text
    const getLayerTypeText = () => {
        if (!currentLayer) return text;
        switch (currentLayer.type) {
            case 'rule': return 'RULE';
            case 'prompt': return 'PROMPT';
            case 'modifier': return 'MODIFIER';
            case 'end': return 'END';
            default: return text;
        }
    };

    // Get layer content text
    const getLayerContentText = () => {
        if (!currentLayer) return text;
        if (typeof currentLayer.content === 'string') {
            return currentLayer.content;
        }
        return currentLayer.content.text;
    };

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
                        backgroundColor: currentPlaqueColor,
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
                        {getLayerTypeText()}
                    </Text>
                </View>
            </View>
        </View>
    );
} 