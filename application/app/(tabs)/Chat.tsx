import React, { useEffect, useRef, useState } from "react";
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

// Simulated logged-in user
const currentUser = {
  email: "test3@example.com",
  name: "You",
};

export default function ChatRoom() {
  const [messages, setMessages] = useState([
    {
      text: "Welcome to the chat room!",
    },
  ]);
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socketUrl = `wss://6w127351-8080.inc1.devtunnels.ms/ws?email=${currentUser.email}&room=room_13.082_80.271`;
    ws.current = new WebSocket(socketUrl);
    // console.log(ws.current);
    ws.current.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.current.onmessage = (event) => {
      const content = event.data;

      // Ignore if this is the message sent by current user (optional if server echoes back)
      if (content === input) return;

      setMessages((prev) => [
        ...prev,
        {
          text: content,
          senderEmail: "other",
          senderName: "Anonymous",
          time: Math.floor(Date.now() / 1000),
        },
      ]);
    };



    ws.current.onerror = (e) => {
      console.error("WebSocket error", e.message);
    };

    ws.current.onclose = () => {
      console.log("🔌 Disconnected from WebSocket");
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleSend = () => {
    const message = input.trim();
    if (!message || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    // Send just the plain string
    ws.current.send(message);

    // Add to local messages
    setMessages((prev) => [
      ...prev,
      {
        text: message,
        senderEmail: currentUser.email,
        senderName: currentUser.name,
        time: Math.floor(Date.now() / 1000), // optional
      },
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
          {messages.map((msg) => {
            const isCurrentUser = msg.senderEmail === currentUser.email;
            return (
              <View
                key={msg.id}
                className={`max-w-[70%] px-4 py-3 my-2 rounded-2xl ${isCurrentUser
                  ? "bg-blue-600 self-end rounded-br-none"
                  : msg.senderEmail === "system"
                    ? "bg-yellow-100 self-center rounded-xl"
                    : "bg-gray-300 self-start rounded-bl-none"
                  }`}
              >
                {!isCurrentUser && msg.senderEmail !== "system" && (
                  <Text className="text-xs text-gray-500 mb-1">
                    {msg.senderName}
                  </Text>
                )}
                <Text className={`${isCurrentUser ? "text-white" : "text-gray-600"}`}>
                  {msg.text}
                </Text>
                <Text className="text-[10px] text-gray-200 mt-1">
                  {new Date(msg.time * 1000).toLocaleTimeString()}
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
