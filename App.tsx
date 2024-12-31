import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BatteryAlertApp = () => {
  const [limit, setLimit] = useState<string>(''); // Keep it as string initially
  const [savedLimit, setSavedLimit] = useState<number | null>(null); // Store the saved limit
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false); // Track alert state
  const [notificationSound, setNotificationSound] = useState<Sound | null>(null);

  useEffect(() => {
    // Load sound on component mount
    const sound = new Sound(require('./assets/alert.mp3'), Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Error loading sound:', error);
      }
    });
    setNotificationSound(sound);

    // Cleanup sound on unmount
    return () => {
      sound.release();
    };
  }, []);

  useEffect(() => {
    // Fetch the saved limit when the app is reopened
    const fetchSavedLimit = async () => {
      try {
        const saved = await AsyncStorage.getItem('batteryLimit');
        if (saved) {
          setSavedLimit(Number(saved));
        }
      } catch (error) {
        console.error('Error fetching saved limit:', error);
      }
    };
    fetchSavedLimit();

    // Fetch the current battery level and set up interval for updates
    const fetchBatteryLevel = async () => {
      try {
        const level = await DeviceInfo.getBatteryLevel();
        setBatteryLevel(Math.round(level * 100)); // Ensure battery level is an integer
      } catch (error) {
        console.error('Error fetching battery level:', error);
      }
    };
    fetchBatteryLevel();

    const interval = setInterval(fetchBatteryLevel, 10000); // Update every 10 seconds
    return () => clearInterval(interval); // Clear interval on unmount
  }, []);

  useEffect(() => {
    if (savedLimit !== null && batteryLevel >= savedLimit && !isAlertActive) {
      notificationSound?.play(() => {
        setIsAlertActive(true);
      });

      Alert.alert(
        'Battery Alert',
        `Your battery has reached ${batteryLevel}%! Please unplug.`,
        [
          {
            text: 'Unplug',
            onPress: () => {
              notificationSound?.stop(() => {
                setIsAlertActive(false); // Stop the sound when "Unplug" is pressed
              });
            },
          },
        ]
      );
    }
  }, [batteryLevel, savedLimit, isAlertActive, notificationSound]);

  const handleLimitChange = (text: string) => {
    setLimit(text);
  };

  const handleSetButtonPress = async () => {
    const value = parseInt(limit, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      try {
        setSavedLimit(value); // Save the limit in state
        await AsyncStorage.setItem('batteryLimit', String(value)); // Store in AsyncStorage
        setIsAlertActive(false); // Reset alert state
        Alert.alert('Success', 'Battery limit set successfully.');
      } catch (error) {
        console.error('Error saving limit:', error);
      }
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid battery limit between 0 and 100.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Charge Limit</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={limit}
        onChangeText={handleLimitChange}
        placeholder="Enter battery limit."
      />
      <Text style={styles.info}>Current Battery: {batteryLevel}%</Text>
      <Button title="SET" onPress={handleSetButtonPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 10,
  },
  info: {
    marginTop: 10,
  },
});

export default BatteryAlertApp;
