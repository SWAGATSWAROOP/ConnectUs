import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const suggestions = [
  "Find people near me",
];

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey, how can I help you today?", sender: "other" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text?: string) => {
    const message = text || input.trim();
    if (!message) return;

    setMessages([
      ...messages,
      { id: messages.length + 1, text: message, sender: "user" },
    ]);
    setInput("");
  };

  return (
    <SafeAreaView className="flex-1 mt-4">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 px-4 py-2"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`max-w-[70%] px-4 py-4 my-2 rounded-2xl ${
                msg.sender === "user"
                  ? "bg-blue-600 self-end rounded-br-none"
                  : "bg-gray-300 self-start rounded-bl-none"
              }`}
            >
              <Text
                className={`${
                  msg.sender === "user" ? "text-white" : "text-gray-800"
                }`}
              >
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View className="mt-4 space-y-2 px-4 py-2">
            <Text className="text-gray-600 font-semibold">Try asking:</Text>
            <View className="flex-row flex-wrap gap-2 mt-2">
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  className="bg-blue-100 px-4 py-2 rounded-full"
                  onPress={() => handleSend(s)}
                >
                  <Text className="text-blue-600 text-sm font-medium">{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        <View className="flex-row items-center px-4 py-2 border-t border-gray-200 bg-white">
        
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-full"
            onPress={() => handleSend()}
          >
            <Text className="text-white font-bold">Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
