import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

export const InfoPopup = ({
  visible,
  onClose,
  description,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  description: string;
  theme: any;
}) => (
  <Modal transparent visible={visible} animationType="fade">
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={popupStyles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View
            style={[popupStyles.popup, {backgroundColor: theme.background}]}>
            <Text style={{color: theme.text}}>{description}</Text>
            <TouchableOpacity onPress={onClose} style={popupStyles.closeButton}>
              <Text style={{color: theme.button}}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    padding: 20,
    borderRadius: 10,
    maxWidth: '80%',
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
});
