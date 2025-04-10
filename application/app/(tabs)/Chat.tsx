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

// Simulated user for now
const currentUser = { id: "user-123", name: "You" };

export default function ChatRoom() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to the chat room!", senderId: "system", senderName: "System" },
    { id: 2, text: "Hi everyone!", senderId: "user-456", senderName: "Alex" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const message = input.trim();
    if (!message) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      senderId: currentUser.id,
      senderName: currentUser.name,
    };

    setMessages([...messages, newMessage]);
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
          {messages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUser.id;
            return (
              <View
                key={msg.id}
                className={`max-w-[70%] px-4 py-3 my-2 rounded-2xl ${
                  isCurrentUser
                    ? "bg-blue-600 self-end rounded-br-none"
                    : msg.senderId === "system"
                    ? "bg-yellow-100 self-center rounded-xl"
                    : "bg-gray-300 self-start rounded-bl-none"
                }`}
              >
                {msg.senderId !== "system" && (
                  <Text className="text-xs text-gray-600 mb-1">{msg.senderName}</Text>
                )}
                <Text
                  className={`${
                    isCurrentUser ? "text-white" : "text-gray-800"
                  }`}
                >
                  {msg.text}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View className="flex-row items-center px-4 py-2 border-t border-gray-200 bg-white">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-full"
            onPress={handleSend}
          >
            <Text className="text-white font-bold">Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
