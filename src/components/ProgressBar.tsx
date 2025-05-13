import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const HORIZONTAL_MARGIN = 0.5;

const ProgressBar = ({
  height,
  currentPage,
  totalPages,
}: {
  height: number;
  currentPage: number;
  totalPages: number;
}) => {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  if (totalPages === 0) {
    return null;
  }

  const barWidth = screenWidth;
  const totalMargin = 2 * HORIZONTAL_MARGIN * totalPages;
  const blockWidth = (barWidth - totalMargin) / totalPages;

  return (
    <View style={[styles.progressBarContainer, {height}]}>
      {Array.from({length: totalPages}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressBlock,
            {
              backgroundColor:
                index <= currentPage
                  ? theme.textSecondary
                  : theme.elevatedBackground,
              width: blockWidth,
            },
          ]}
        />
      ))}
    </View>
  );
};

export default ProgressBar;

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    progressBarContainer: {
      flexDirection: 'row',
      backgroundColor: theme.background,
    },

    progressBlock: {
      height: '100%',
      marginHorizontal: HORIZONTAL_MARGIN,
      borderRadius: 2,
    },
  });
