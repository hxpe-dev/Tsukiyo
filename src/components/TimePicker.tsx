import React, {useState} from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  theme: any;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  theme,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value.split(':')[0]);
  const [selectedMinute, setSelectedMinute] = useState(value.split(':')[1]);

  const applyTime = () => {
    const time = `${selectedHour.padStart(2, '0')}:${selectedMinute.padStart(
      2,
      '0',
    )}`;
    onChange(time);
    setModalVisible(false);
  };

  const generateNumberArray = (max: number) =>
    Array.from({length: max}, (_, i) => i.toString().padStart(2, '0'));

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles(theme).value}>{value}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles(theme).modalBackground}>
          <View style={styles(theme).modalContainer}>
            <Text style={styles(theme).modalTitle}>Select Time</Text>
            <View style={styles(theme).pickerRow}>
              <ScrollView style={styles(theme).picker}>
                {generateNumberArray(24).map(hour => (
                  <TouchableOpacity
                    key={hour}
                    onPress={() => setSelectedHour(hour)}>
                    <Text
                      style={[
                        styles(theme).pickerItem,
                        hour === selectedHour && styles(theme).selectedItem,
                      ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles(theme).colon}>:</Text>
              <ScrollView style={styles(theme).picker}>
                {generateNumberArray(60).map(min => (
                  <TouchableOpacity
                    key={min}
                    onPress={() => setSelectedMinute(min)}>
                    <Text
                      style={[
                        styles(theme).pickerItem,
                        min === selectedMinute && styles(theme).selectedItem,
                      ]}>
                      {min}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={styles(theme).applyButton}
              onPress={applyTime}>
              <Text style={styles(theme).applyButtonText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles(theme).cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    value: {
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.elevatedBackground,
      borderRadius: 10,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: theme.lowOpacity,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: 300,
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.text,
    },
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    picker: {
      height: 100,
      width: 80,
    },
    pickerItem: {
      fontSize: 24,
      textAlign: 'center',
      paddingVertical: 4,
      color: theme.text,
    },
    selectedItem: {
      color: theme.button,
      fontWeight: 'bold',
    },
    colon: {
      fontSize: 24,
      color: theme.text,
      marginHorizontal: 10,
    },
    applyButton: {
      backgroundColor: theme.button,
      borderRadius: 6,
      paddingHorizontal: 24,
      paddingVertical: 10,
      marginBottom: 10,
    },
    applyButtonText: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    cancelButtonText: {
      color: theme.textSecondary,
      marginTop: 4,
    },
  });
