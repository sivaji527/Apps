import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  Alert,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load the sound from the assets folder using `require`
const notificationSound = new Sound(require('./assets/alert.mp3'), Sound.MAIN_BUNDLE, (error) => {
  if (error) {
    console.log('Error loading sound:', error);
  }
});

const BatteryAlertApp = () => {
  const [limit, setLimit] = useState<string>(''); // Input from the user
  const [savedLimit, setSavedLimit] = useState<number | null>(null); // Stored limit value
  const [batteryLevel, setBatteryLevel] = useState<number>(0); // Current battery level
  const [isLimitSet, setIsLimitSet] = useState<boolean>(false); // Whether the limit is explicitly set
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false); // Track alert state

  const colorScheme = useColorScheme(); // Detect system theme

  useEffect(() => {
    // Fetch the saved limit when the app is reopened
    const fetchSavedLimit = async () => {
      const saved = await AsyncStorage.getItem('batteryLimit');
      if (saved) {
        setSavedLimit(Number(saved));
      }
    };
    fetchSavedLimit();

    // Fetch the current battery level when app loads
    const checkBattery = async () => {
      const level = await DeviceInfo.getBatteryLevel();
      setBatteryLevel(Math.round(level * 100)); // Ensure battery level is an integer
    };
    checkBattery();
  }, []);

  useEffect(() => {
    // Trigger the alert only when a limit is explicitly set
    if (
      isLimitSet && // Check if limit is explicitly set
      savedLimit !== null && // Ensure the limit exists
      batteryLevel >= savedLimit && // Compare battery level
      !isAlertActive // Prevent multiple alerts
    ) {
      notificationSound.play(() => {
        setIsAlertActive(true); // Set alert state
      });

      Alert.alert(
        'Battery Alert',
        `Your battery has reached ${batteryLevel}%! Please unplug.`,
        [
          {
            text: 'Unplug',
            onPress: () => {
              notificationSound.stop(() => {
                setIsAlertActive(false); // Stop the sound when "Unplug" is pressed
              });
            },
          },
        ]
      );
    }
  }, [batteryLevel, savedLimit, isAlertActive, isLimitSet]);

  const handleLimitChange = (text: string) => {
    setLimit(text); // Update the input field
  };

  const handleSetButtonPress = async () => {
    const value = parseInt(limit);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setSavedLimit(value); // Save the limit in state
      await AsyncStorage.setItem('batteryLimit', String(value)); // Store in AsyncStorage
      setIsLimitSet(true); // Mark that the limit is explicitly set
      setIsAlertActive(false); // Reset alert state
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid battery limit between 0 and 100.');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#ffffff' : '#ffffff' }, // Override background color for light theme
      ]}
    >
      <Text style={styles.header}>Set Charge Limit</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={limit}
        onChangeText={handleLimitChange}
        placeholder="Enter battery limit."
        placeholderTextColor="#888"
      />
      <Text style={styles.currentBattery}>Current Battery: {batteryLevel}%</Text>
      <Button title="SET" onPress={handleSetButtonPress} color="#007BFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 18,
    color: '#000000', // Text color for light theme
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 10,
    color: '#000000', // Input text color for light theme
    backgroundColor: '#f5f5f5', // Light background for input
  },
  currentBattery: {
    marginTop: 10,
    color: '#000000', // Text color for light theme
  },
});

export default BatteryAlertApp;
