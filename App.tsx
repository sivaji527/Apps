import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import SoundPlayer from 'react-native-sound-player';

const App = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [limit, setLimit] = useState<string>('');
  const [savedLimit, setSavedLimit] = useState<number | null>(null);
  const [alarmDismissed, setAlarmDismissed] = useState<boolean>(false);

  // Load saved limit on app start
  useEffect(() => {
    const loadSavedLimit = async () => {
      try {
        const savedLimit = await AsyncStorage.getItem('batteryLimit');
        if (savedLimit) {
          setSavedLimit(parseInt(savedLimit, 10));
        }
      } catch (error) {
        console.log('Failed to load saved limit', error);
      }
    };
    loadSavedLimit();
  }, []);

  // Monitor battery level every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const level = await DeviceInfo.getBatteryLevel();
        setBatteryLevel(Math.round(level * 100));
      } catch (error) {
        console.log('Failed to get battery level', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Check if battery level reaches the limit and the alarm hasn't been dismissed
  useEffect(() => {
    if (
      savedLimit !== null &&
      batteryLevel !== null &&
      batteryLevel >= savedLimit &&
      !alarmDismissed
    ) {
      triggerAlert();
    }
  }, [batteryLevel, savedLimit, alarmDismissed]);

  // Trigger alert and play sound
  const triggerAlert = () => {
    try {
      SoundPlayer.playSoundFile('alert', 'mp3');
    } catch (error) {
      console.log('Failed to play sound', error);
    }

    Alert.alert(
      'Battery Limit Reached',
      `Your battery has reached ${batteryLevel}%! Please unplug.`,
      [
        {
          text: 'Unplug',
          onPress: () => {
            SoundPlayer.stop();
            setAlarmDismissed(true); // Dismiss the alarm
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Save the battery limit
  const saveLimit = async () => {
    const limitNumber = parseInt(limit, 10);
    if (
      isNaN(limitNumber) ||
      limitNumber <= (batteryLevel || 0) ||
      limitNumber < 0 ||
      limitNumber > 100
    ) {
      Alert.alert(
        'Invalid Limit',
        'Please enter a valid limit greater than the current battery level.'
      );
      return;
    }

    try {
      await AsyncStorage.setItem('batteryLimit', limitNumber.toString());
      setSavedLimit(limitNumber);
      setLimit('');
      setAlarmDismissed(false); // Reset alarm dismissal when a new limit is set
      Keyboard.dismiss(); // Dismiss the keyboard
    } catch (error) {
      console.log('Failed to save limit', error);
    }
  };

  return (
    <View style={styles.container} >
      <Text style={styles.title}> Battery Charge Limit </Text>
      < Text style={styles.batteryLevel} > Current Battery Level : {batteryLevel}% </Text>
      {savedLimit !== null && <Text style={styles.savedLimit}> Saved Limit: {savedLimit}% </Text>}

      <TextInput
        style={styles.input}
        placeholder="Enter battery limit (0-100)"
        keyboardType="numeric"
        value={limit}
        onChangeText={setLimit}
      />
      <Button title="SET" onPress={saveLimit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF', // Always light background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000', // Always dark text
  },
  batteryLevel: {
    fontSize: 18,
    marginBottom: 10,
    color: '#000000', // Always dark text
  },
  savedLimit: {
    fontSize: 18,
    marginBottom: 20,
    color: '#000000', // Always dark text
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF', // Input background remains light
    color: '#000000', // Input text remains dark
  },
});

export default App;
