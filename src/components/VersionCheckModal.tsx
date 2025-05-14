// src/components/VersionCheckModal.tsx
import React, {useEffect, useState} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {checkForUpdate} from '../utils/checkVersion.ts';
import {useTheme} from '../context/ThemeContext';
import {getNotifyOnNewVersion} from '../utils/settingLoader';

const VersionCheckModal: React.FC = () => {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      if (await getNotifyOnNewVersion()) {
        const needsUpdate = await checkForUpdate();
        if (needsUpdate) {
          setShowModal(true); // Show modal if there's a version mismatch
        }
      }
    };
    checkVersion();
  }, []);

  const handleBackgroundPress = () => {
    setShowModal(false);
  };

  return (
    <Modal visible={showModal} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View style={styles.modalBackground}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>
                New version available on GitHub
              </Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setShowModal(false)}>
                  <Text style={styles.buttonIgnoreText}>Ignore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    Linking.openURL(
                      'https://github.com/hxpe-dev/Tsukiyo/releases',
                    )
                  }>
                  <Text style={styles.buttonDownloadText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    modalBackground: {
      flex: 1,
      backgroundColor: theme.lowOpacity,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.background,
      padding: 24,
      borderRadius: 12,
      width: '80%',
      alignItems: 'center',
    },
    modalText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
      color: theme.text,
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    button: {
      backgroundColor: theme.buttonSecondary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    buttonIgnoreText: {
      color: theme.warning,
      fontSize: 16,
    },
    buttonDownloadText: {
      color: theme.text,
      fontSize: 16,
    },
  });

export default VersionCheckModal;
