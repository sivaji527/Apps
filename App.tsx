import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Keyboard, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import SoundPlayer from 'react-native-sound-player';

const App = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [limit, setLimit] = useState<string>('');
  const [savedLimit, setSavedLimit] = useState<number | null>(null);
  const [alarmDismissed, setAlarmDismissed] = useState<boolean>(false);
  const colorScheme = Appearance.getColorScheme();

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

  // Handle limit input change
  const handleLimitChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    setLimit(numericValue);
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

    if (limitNumber > 90) {
      Alert.alert(
        'High Limit Warning',
        'Setting a limit above 90% may not be optimal for battery health.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveLimitToStorage(limitNumber) },
        ]
      );
    } else {
      saveLimitToStorage(limitNumber);
    }
  };

  // Save limit to AsyncStorage
  const saveLimitToStorage = async (limitNumber: number) => {
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

  // Reset the saved limit
  const resetLimit = async () => {
    try {
      await AsyncStorage.removeItem('batteryLimit');
      setSavedLimit(null);
      setAlarmDismissed(false);
    } catch (error) {
      console.log('Failed to reset limit', error);
    }
  };

  // Stop sound when component unmounts
  useEffect(() => {
    return () => {
      SoundPlayer.stop();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }]}>
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
        Battery Charge Limit
      </Text>
      <Text style={[styles.batteryLevel, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
        Current Battery Level: {batteryLevel}%
      </Text>
      {savedLimit !== null && (
        <Text style={[styles.savedLimit, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
          Saved Limit: {savedLimit}%
        </Text>
      )}
      <Text style={[styles.alarmStatus, { color: alarmDismissed ? 'green' : 'red' }]}>
        {alarmDismissed ? 'Alarm Dismissed' : 'Alarm Active'}
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFFFFF', color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}
        placeholder="Enter battery limit (0-100)"
        placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#CCCCCC'}
        keyboardType="numeric"
        value={limit}
        onChangeText={handleLimitChange}
      />
      <Button title="SET" onPress={saveLimit} />
      <Button title="RESET" onPress={resetLimit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  batteryLevel: {
    fontSize: 18,
    marginBottom: 10,
  },
  savedLimit: {
    fontSize: 18,
    marginBottom: 20,
  },
  alarmStatus: {
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});

export default App;