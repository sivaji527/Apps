import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
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
  const [limit, setLimit] = useState<string>(''); // Keep it as string initially
  const [savedLimit, setSavedLimit] = useState<number | null>(null); // Store the saved limit
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false); // Track alert state

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
    if (savedLimit !== null && batteryLevel >= savedLimit && !isAlertActive) {
      notificationSound.play(() => {
        setIsAlertActive(true);
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
  }, [batteryLevel, savedLimit, isAlertActive]);

  const handleLimitChange = (text: string) => {
    setLimit(text);
  };

  const handleSetButtonPress = async () => {
    const value = parseInt(limit);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setSavedLimit(value); // Save the limit in state
      await AsyncStorage.setItem('batteryLimit', String(value)); // Store in AsyncStorage
      setIsAlertActive(false); // Reset alert state
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid battery limit between 0 and 100.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18 }}>Set Charge Limit</Text>
      <TextInput
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          marginTop: 10,
          paddingLeft: 10,
        }}
        keyboardType="numeric"
        value={limit}
        onChangeText={handleLimitChange}
        placeholder="Enter battery limit."
      />
      <Text style={{ marginTop: 10 }}>Current Battery: {batteryLevel}%</Text>
      <Button title="SET" onPress={handleSetButtonPress} />
    </View>
  );
};

export default BatteryAlertApp;
