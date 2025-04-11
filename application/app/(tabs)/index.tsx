import { Image, Text, StyleSheet, Platform } from 'react-native';
import { TouchableOpacity, Alert } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is needed to proceed.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    console.log(location);
    Alert.alert(
      'Location retrieved',
      `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`
    );
  };
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/connectus_logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Connect with your surrounding peoples!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Click on the button to give your location permission</ThemedText>
      </ThemedView>
      <TouchableOpacity
        onPress={requestLocationPermission}
        className="bg-yellow-400 py-4 mt-8 rounded-full"
      >
        <Text className="text-center font-semibold text-black">Location Permission</Text>
      </TouchableOpacity>

    </ParallaxScrollView>
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
    bottom: 0,
    left: 50,
    position: 'absolute',
  },
});
