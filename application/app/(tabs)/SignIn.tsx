import React from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { useNavigation } from '@react-navigation/native';

// import { login } from "@/lib/appwrite";
// import { useGlobalContext } from "@/lib/global-provider";
// import { Redirect } from "expo-router";

const SignIn = () => {
    const navigation = useNavigation();
    //   const { refetch, loading, isLoggedIn } = useGlobalContext();

    //   if (!loading && isLoggedIn) return <Redirect href="/" />;

    const handleLogin = async () => {
        // const result = await login();

        // if (result) {
        //   console.log("Login SuccessFull");
        //   refetch();
        // } else {
        //   Alert.alert("Error", "Failed To Login");
        // }
    };

    return (
        <SafeAreaView className="bg-white h-full">
            <ScrollView contentContainerClassName="h-full">
                <Image
                    source={images.login}
                    className="w-full h-3/5"
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

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        className="bg-yellow-400 py-4 mt-4 rounded-full"
                    >
                        <Text className="text-center text-black font-semibold">Login</Text>
                    </TouchableOpacity>
                    <Text className="text-base text-center uppercase font-rubik text-black-200 mt-1">
                        or
                    </Text>

                    <TouchableOpacity
                        onPress={handleLogin}
                        className="bg-white shadow-xl border border-1 shadow-zinc-300 rounded-full w-full py-4 mt-1"
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
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignIn;