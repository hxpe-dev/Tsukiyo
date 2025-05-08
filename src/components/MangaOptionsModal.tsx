import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from 'react-native';
import {MangaProgressItem} from '../types/mangadex';
import {useTheme} from '../context/ThemeContext';

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
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const [slideAnim] = useState(new Animated.Value(100)); // Initial position off-screen
  const [opacityAnim] = useState(new Animated.Value(0)); // Initially hidden

  useEffect(() => {
    if (visible) {
      // Animate to visible state
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200, // Fade in the content
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate back to off-screen and fade out
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200, // Fade out the content
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacityAnim, slideAnim, visible]);

  return (
    <Modal
      animationType="none" // No animation for the overlay
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{translateY: slideAnim}], // Apply slide animation to the content
                  opacity: opacityAnim, // Apply fade-in/fade-out effect
                },
              ]}>
              <Text style={styles.title}>{manga?.title}</Text>

              <TouchableOpacity style={styles.button} onPress={onContinue}>
                <Text style={styles.buttonText}>Continue Reading</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={onInfo}>
                <Text style={styles.buttonText}>Open Information</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.removeButton]}
                onPress={onRemove}>
                <Text style={[styles.buttonText, styles.removeText]}>
                  Remove from Reading
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
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
      backgroundColor: 'rgba(0,0,0,0.5)', // The overlay stays fixed
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
