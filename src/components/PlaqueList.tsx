import { ScrollView, StyleSheet, View } from "react-native";
import Plaque from "./Plaque";
import { Plaque as PlaqueType } from "../types/game";
import { colors } from "../shared/styles";

interface PlaqueListProps {
    plaques: PlaqueType[];
    selectedPlaque?: PlaqueType | null;
    onPress: (plaque: PlaqueType) => void;
}

export const render2ColumnPlaqueList = ({ plaques, selectedPlaque, onPress }: PlaqueListProps) => {
    if (plaques.length === 0) return null;

    return (
        <ScrollView style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.plaqueListContainer}
        >
            {plaques.map((plaque) => (
                <Plaque
                    key={plaque.id}
                    plaque={plaque}
                    onPress={() => onPress(plaque)}
                    selected={selectedPlaque?.id === plaque.id}
                />
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        width: '100%',
        marginBottom: 8,
        overflow: 'hidden',
    },
    plaqueListContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
    }
});