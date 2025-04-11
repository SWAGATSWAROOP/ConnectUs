import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Simulated logged-in user
const currentUser = {
  email: "busharma2003@gmail.com",
  name: "You",
};

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

export default function ChatRoom() {
  const [messages, setMessages] = useState([
    {
      id: generateId(),
      text: "Welcome to the chat room!",
      senderEmail: "system",
      senderName: "System",
      time: Math.floor(Date.now() / 1000),
    },
  ]);
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socketUrl = `wss://6w127351-8080.inc1.devtunnels.ms/ws?email=${currentUser.email}&room=room_13.082_80.271`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log("✅ Connected to WebSocket");
    };

    ws.current.onmessage = (event) => {
      console.log("📩 Received from server:", event.data);
      try {
        const data = JSON.parse(event.data); // 👈 FIXED
        if(data.user_id == currentUser.email)return
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: data.content,
            senderEmail: data.user_id,
            senderName: data.user_id === currentUser.email ? "You" : data.user_id,
            time: data.time || Math.floor(Date.now() / 1000),
          },
        ]);
      } catch (err) {
        console.error("❌ JSON parse error:", err);
      }
    };



    ws.current.onerror = (e: any) => {
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

    // Send message as plain text
    ws.current.send(message);

    // Add it locally
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        text: message,
        senderEmail: currentUser.email,
        senderName: currentUser.name,
        time: Math.floor(Date.now() / 1000),
      },
    ]);

    setInput("");
  };

  return (
    <SafeAreaView className="flex-1 mt-4">
      <ImageBackground
        source={require("../../assets/images/chatbackground.jpeg")} 
        resizeMode="cover"
        style={{ flex: 1 }}
      >
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
                        : "bg-lime-500 self-start rounded-bl-none"
                    }`}
                >
                  {!isCurrentUser && msg.senderEmail !== "system" && (
                    <Text className="text-xs text-gray-600 mb-1">
                      {msg.senderName}
                    </Text>
                  )}
                  <Text
                    className={`${isCurrentUser ? "text-white" : "text-gray-800"}`}
                  >
                    {msg.text}
                  </Text>
                  <Text className="text-[10px] text-gray-200 mt-1">
                    {new Date(msg.time * 1000).toLocaleTimeString()}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
      
      <View className="flex-row items-center px-4 py-4 border-t border-gray-200 bg-white">
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-4 mr-2"
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-full"
          onPress={handleSend}
        >
          <Text className="text-white font-bold py-2">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </ImageBackground>
    </SafeAreaView >
  );
}
