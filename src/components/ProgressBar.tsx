import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const ProgressBar = ({
  currentPage,
  totalPages,
  onPressPage,
}: {
  currentPage: number;
  totalPages: number;
  onPressPage: (pageIndex: number) => void;
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(theme);

  if (totalPages === 0) {return null;}

  const barWidth = screenWidth;
  const blockWidth = barWidth / totalPages;

  return (
    <View style={styles.progressBarContainer}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <TouchableOpacity
          key={index}
          style={{ width: blockWidth }}
          onPress={() => onPressPage(index)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.progressBlock,
              {
                backgroundColor: index <= currentPage ? theme.textSecondary : theme.elevatedBackground,
              },
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ProgressBar;

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    progressBarContainer: {
      flexDirection: 'row',
      height: 5,
      backgroundColor: theme.background,
    },

    progressBlock: {
      height: '100%',
      marginHorizontal: 0.5,
      borderRadius: 2,
    },
  });
