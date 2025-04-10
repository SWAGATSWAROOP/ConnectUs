import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { useNavigation } from "@react-navigation/native";

const SignIn = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSignupNavigation = () => {
    navigation.navigate('SignUp')
  };
  
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
          onPress: () => navigation.navigate('Chat'),
        },
      ]);
    } catch (error: any) {
      console.error("Error during login:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full">
        <Image
          source={images.login}
          className="w-full h-2/5"
          resizeMode="contain"
        />
        <View className="px-10">
          <Text className="text-base text-center uppercase font-rubik text-black-200">
            Welcome to ConnectUs
          </Text>
          <Text className="text-3xl font-rubik-bold text-black-300 text-center mt-2">
            Travel anywhere with {"\n"}
            <Text className="text-primary-300">ease and pocket friendly</Text>
          </Text>

          {/* Email input */}
          <TextInput
            placeholder="Email"
            className="border border-gray-300 rounded px-4 py-4 mt-6"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password input */}
          <TextInput
            placeholder="Password"
            className="border border-gray-300 rounded px-4 py-4 mt-4"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={handleLogin}
            className="bg-yellow-400 py-4 mt-6 rounded-full"
          >
            <Text className="text-center text-black font-semibold">Login</Text>
          </TouchableOpacity>

          <Text className="text-base text-center uppercase font-rubik text-black-200 mt-2">
            or
          </Text>

          <TouchableOpacity
            onPress={() => Alert.alert("Info", "Google Login Coming Soon")}
            className="bg-white shadow-xl border border-1 shadow-zinc-300 rounded-full w-full py-4 mt-2"
          >
            <View className="flex flex-row items-center justify-center">
              <Image
                source={icons.google}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-lg font-rubik-medium text-black-300 ml-2">
                Continue with Google
              </Text>
            </View>
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
