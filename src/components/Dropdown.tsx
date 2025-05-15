import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

type DropdownProps = {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder?: string;
};

const Dropdown = ({ options, selected, onSelect, placeholder }: DropdownProps) => {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.button} onPress={toggleDropdown} activeOpacity={0.8}>
        <View style={styles.buttonRow}>
          <Text style={styles.buttonText}>{selected?.toUpperCase() || placeholder}</Text>
          <Icon
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            style={styles.chevronIcon}
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)} activeOpacity={0.7}>
                <Text style={styles.optionText}>{item.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          />
        </View>
      )}
    </View>
  );
};

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      position: 'relative',
      zIndex: 1000,          // very high zIndex to overlay everything
    },
    button: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.elevatedBackground,
      justifyContent: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      textAlign: 'center',
      justifyContent: 'space-between',
    },
    buttonText: {
      color: theme.text,
      fontSize: 16,
    },
    dropdown: {
      position: 'absolute',
      top: 50,
      width: '100%',
      backgroundColor: theme.elevatedBackground,
      borderRadius: 8,
      elevation: 5,
      zIndex: 1001,          // even higher than wrapper for sure
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    option: {
      padding: 12,
      borderBottomColor: theme.elevatedBackground,
      borderBottomWidth: 1,
    },
    optionText: {
      color: theme.text,
      fontSize: 16,
    },
    chevronIcon: {
      color: theme.button,
    },
  });

export default Dropdown;
