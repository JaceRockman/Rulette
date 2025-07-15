import { StyleSheet, View } from "react-native";
import Plaque from "./Plaque";
import { Plaque as PlaqueType } from "../types/game";
import { colors } from "../shared/styles";

interface PlaqueListProps {
    plaques: PlaqueType[];
    selectedPlaque?: PlaqueType | null;
    onPress: (plaque: PlaqueType) => void;
}

export const render2ColumnPlaqueList = ({ plaques, selectedPlaque, onPress }: PlaqueListProps) => {
    const rows = [];
    if (plaques.length === 0) return null;
    for (let i = 0; i < plaques.length; i += 2) {
        const hasSecondItem = plaques[i + 1];
        const row = (
            <View key={i} style={styles.plaqueList}>
                <Plaque
                    text={plaques[i].text}
                    plaqueColor={plaques[i].plaqueColor || '#fff'}
                    onPress={() => onPress(plaques[i])}
                    selected={selectedPlaque?.id === plaques[i].id}
                />
                {hasSecondItem && (
                    <Plaque
                        text={plaques[i + 1].text}
                        plaqueColor={plaques[i + 1].plaqueColor || '#fff'}
                        onPress={() => onPress(plaques[i + 1])}
                        selected={selectedPlaque?.id === plaques[i + 1].id}
                    />
                )}
            </View>
        );
        rows.push(row);
    }
    return rows;
};

const styles = StyleSheet.create({
    plaqueList: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
    }
});