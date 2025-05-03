import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { MangaProgress } from '../types/mangadex';

type Props = {
  visible: boolean;
  manga: MangaProgress | null;
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f2f2f2',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  removeText: {
    color: 'white',
  },
  removeButton: {
    backgroundColor: '#e53935',
  },
  cancelText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 12,
  },
});
