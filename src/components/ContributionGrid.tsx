import React from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { GridCell } from '../streaks';
import { useTheme } from '../ThemeContext';

interface Props {
  weeks: GridCell[][];
  color: string;
  cellSize?: number;
  gap?: number;
  scrollable?: boolean;
  onCellPress?: (date: string) => void;
  todayDate?: string;
}

export default function ContributionGrid({
  weeks,
  color,
  cellSize = 12,
  gap = 3,
  scrollable = false,
  onCellPress,
  todayDate,
}: Props) {
  const theme = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', gap }}>
      {weeks.map((col, wi) => (
        <View key={wi} style={{ gap }}>
          {col.map((cell, ci) => {
            const isToday = todayDate === cell.date;
            const canPress = !!onCellPress && !cell.future;
            return (
              <Pressable
                key={ci}
                disabled={!canPress}
                onPress={() => onCellPress && onCellPress(cell.date)}
                hitSlop={2}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cell.future
                      ? 'transparent'
                      : cell.completed
                      ? color
                      : theme.gridEmpty,
                    borderColor: isToday ? color : 'transparent',
                    borderWidth: isToday ? 2 : 0,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 2 }}
      >
        {content}
      </ScrollView>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  cell: { borderRadius: 3 },
});
