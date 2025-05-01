import React, { useRef/*, useState */ } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MainStackParamList } from '../screens/MainLayout';

const screenWidth = Dimensions.get('window').width;
const BUTTON_MARGIN_HORIZONTAL = 10;
const BUTTON_COUNT = 3;
const NAVBAR_SIDE_MARGIN = 24; // Same as left/right in navbar style

// Calculation for button width based on screen size and margins
const buttonWidth = (screenWidth - NAVBAR_SIDE_MARGIN * 2 - BUTTON_MARGIN_HORIZONTAL * 2 * BUTTON_COUNT) / BUTTON_COUNT;
const sliderWidth = 50;

export default function Navbar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // currentScreen works but is not used for the moment
  // const [currentScreen, setCurrentScreen] = useState<keyof MainStackParamList>('Home');
  const translateX = useRef(new Animated.Value(0)).current;

  const handleNavigate = (screen: keyof MainStackParamList, index: number) => {
    navigation.navigate('Main', { screen });
    // setCurrentScreen(screen);

    Animated.spring(translateX, {
      toValue: (index - 1) * (buttonWidth + BUTTON_MARGIN_HORIZONTAL * 2),
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.navbar}>
      {/* Sliding blue background */}
      <Animated.View
        style={[
          styles.slider,
          {
            transform: [{ translateX }],
          },
        ]}
      />

      <TouchableOpacity
        onPress={() => handleNavigate('Explorer', 0)}
        style={styles.button}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>
          Explorer
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleNavigate('Home', 1)}
        style={styles.button}
        activeOpacity={0.7}
      >
        <Text style={styles.textCenter}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleNavigate('Profile', 2)}
        style={styles.button}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    bottom: NAVBAR_SIDE_MARGIN,
    left: NAVBAR_SIDE_MARGIN,
    right: NAVBAR_SIDE_MARGIN,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginHorizontal: BUTTON_MARGIN_HORIZONTAL,
  },
  text: {
    fontSize: 14,
    color: '#4b5563',
  },
  textCenter: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: 'bold',
  },
  slider: {
    position: 'absolute',
    bottom: '15%',
    width: sliderWidth,
    backgroundColor: '#4f46e5',
    borderRadius: 30,
    height: 4,
  },
});
