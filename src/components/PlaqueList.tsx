import { StyleSheet, View } from "react-native";
import Plaque from "./Plaque";
import { Plaque as PlaqueType } from "../types/game";

interface PlaqueListProps {
    plaques: PlaqueType[];
    onPress: Function;
    authorId: string;
}

export const render2ColumnPlaqueList = ({ plaques, onPress, authorId }: PlaqueListProps) => {
    const rows = [];
    for (let i = 0; i < plaques.length; i += 2) {
        const hasSecondItem = plaques[i + 1];
        const row = (
            <View key={i} style={styles.plaqueList}>
                <Plaque
                    text={plaques[i].text}
                    plaqueColor={plaques[i].plaqueColor || '#fff'}
                    onPress={() => onPress(plaques[i].id, plaques[i].text, plaques[i].plaqueColor || '#fff')}
                    style={{ minHeight: 100 }}
                />
                {hasSecondItem && (
                    <Plaque
                        text={plaques[i + 1].text}
                        plaqueColor={plaques[i + 1].plaqueColor || '#fff'}
                        onPress={() => onPress(plaques[i + 1].id, plaques[i + 1].text, plaques[i + 1].plaqueColor || '#fff')}
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
        flexDirection: 'row',
        marginBottom: 24,
        justifyContent: 'flex-start',
        marginLeft: '5%'
    }
});