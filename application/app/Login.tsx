import React, { useState } from 'react';
import { Alert } from 'react-native';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("http://10.10.195.18:8000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Login failed");
      }

      console.log("Login successful:", data);

      Alert.alert("Success", "Login successful!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("/"), 
        },
      ]);
    } catch (error: any) {
      console.error("Error during login:", error.message);
      // Alert.alert("Error", error.message);
    }
  };

  const handleSignupNavigation = () => {
    navigation.navigate('SignUp')
  };


  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">Login</Text>

      <Text className="text-base mb-2">Email</Text>
      <TextInput
        className="border border-gray-300 rounded px-4 py-4 mb-4"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="text-base mb-2">Password</Text>
      <TextInput
        className="border border-gray-300 rounded px-4 py-4 mb-6"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={handleLogin}
        className="bg-yellow-400 py-4 mt-4 rounded-full"
      >
        <Text className="text-center font-semibold text-black">Login</Text>
      </TouchableOpacity>

      <Text className="text-center text-gray-600 mt-4">
        Don't have an account?{' '}
        <Text
          className="text-blue-500 font-semibold"
          onPress={handleSignupNavigation}
        >
          Sign up
        </Text>
      </Text>
    </View>
  );
}
