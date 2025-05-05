import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { MangaProgressItem } from '../types/mangadex';
import { useTheme } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  manga: MangaProgressItem | null;
  onClose: () => void;
  onContinue: () => void;
  onInfo: () => void;
  onRemove: () => void;
};

const MangaOptionsModal = ({
  visible,
  manga,
  onClose,
  onContinue,
  onInfo,
  onRemove,
}: Props) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(theme);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.sheet}>
              <Text style={styles.title}>{manga?.title}</Text>

              <TouchableOpacity style={styles.button} onPress={onContinue}>
                <Text style={styles.buttonText}>Continue Reading</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={onInfo}>
                <Text style={styles.buttonText}>Open Information</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.removeButton]}
                onPress={onRemove}
              >
                <Text style={[styles.buttonText, styles.removeText]}>
                  Remove from Reading
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default MangaOptionsModal;

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: theme.background,
      padding: 20,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.text,
    },
    button: {
      backgroundColor: theme.buttonSecondary,
      padding: 14,
      borderRadius: 8,
      marginBottom: 8,
    },
    buttonText: {
      fontSize: 16,
      textAlign: 'center',
      color: theme.text,
    },
    removeText: {
      color: theme.buttonText,
    },
    removeButton: {
      backgroundColor: theme.error,
    },
    cancelText: {
      fontSize: 16,
      textAlign: 'center',
      color: theme.textSecondary,
      marginTop: 12,
    },
  });
