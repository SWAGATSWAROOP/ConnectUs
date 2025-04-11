import React, { useState } from 'react';
import { Image, Text, StyleSheet, TouchableOpacity, Alert, FlatList, View } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [rooms, setRooms] = useState<string[]>([]);
  const router = useRouter();

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is needed to proceed.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    Alert.alert('Location retrieved', `Lat: ${latitude}, Lng: ${longitude}`);
    fetchNearbyRooms(latitude, longitude);
  };

  const fetchNearbyRooms = async (lat: number, lng: number) => {
    try {
      const email = "test1@example.com";
      const response = await fetch(`https://6w127351-8080.inc1.devtunnels.ms/rooms?email=${email}&lat=${lat}&lng=${lng}`);
      const data = await response.json();
      setRooms(data.nearby_rooms || []);
    } catch (error) {
      // Alert.alert('Error fetching rooms', error.message);
    }finally{
      // router.push('./(tabs)/Chat');
    }
  };

  const handleRoomPress = (roomId: string) => {
    router.push('./(tabs)/Chat');
  };

  const renderHeader = () => (
    <View className="px-4 pt-6 pb-2">
      <Image
        source={require('@/assets/images/connectus_logo.png')}
        style={styles.reactLogo}
      />
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Connect with your surrounding people!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Click the button to allow location access</ThemedText>
      </ThemedView>

      <TouchableOpacity
        onPress={requestLocationPermission}
        className="bg-yellow-400 py-4 mt-4 rounded-full mb-4"
      >
        <Text className="text-center font-semibold text-black">Get Nearby Rooms</Text>
      </TouchableOpacity>

      {rooms.length > 0 && (
        <Text className="text-xl font-semibold mb-2">Nearby Rooms:</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={rooms}
      keyExtractor={(item) => item}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => handleRoomPress(item)}
          className="bg-blue-200 px-4 py-3 my-1 rounded"
        >
          <Text className="text-black text-lg">{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 200,
    width: 280,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginBottom: 10,
  },
});
