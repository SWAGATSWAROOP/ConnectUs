import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const navigation = useNavigation();
  const handleSignUp = async () => {
    if (password !== rePassword) {
      console.warn("Passwords do not match!");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Signup successful:", data);
        navigation.navigate("Login");
      } else {
        console.warn("Signup failed:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };


  const handleLoginNavigation = () => {
    navigation.navigate("Login");
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">Sign Up</Text>

      <Text className="text-base mb-2">Full Name</Text>
      <TextInput
        className="border border-gray-300 rounded px-4 py-4 mb-4"
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

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
        className="border border-gray-300 rounded px-4 py-4 mb-4"
        placeholder="Create a password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text className="text-base mb-2">Re-enter Password</Text>
      <TextInput
        className="border border-gray-300 rounded px-4 py-4 mb-6"
        placeholder="Re-enter your password"
        secureTextEntry
        value={rePassword}
        onChangeText={setRePassword}
      />

      <TouchableOpacity
        onPress={handleSignUp}
        className="bg-yellow-400 py-4 mt-4 rounded-full mb-4 "
      >
        <Text className="text-center font-semibold text-black">Sign Up</Text>
      </TouchableOpacity>

      <Text className="text-center text-gray-600">
        Already have an account?{' '}
        <Text
          className="text-blue-500 font-semibold"
          onPress={handleLoginNavigation}
        >
          Login
        </Text>
      </Text>
    </View>
  );
}
