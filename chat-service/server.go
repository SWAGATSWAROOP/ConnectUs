package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Redis client for geospatial indexing
var rdb = redis.NewClient(&redis.Options{
	Addr: "localhost:6379",
})

// Key for storing user locations in Redis
const geoKey = "user_locations"

// Upgrader for WebSocket connections
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// ChatMessage represents a chat message from a user.
type ChatMessage struct {
	UserID  string `json:"user_id"`
	Content string `json:"content"`
	Time    int64  `json:"time"`
}

// Global MongoDB objects
var mongoClient *mongo.Client
var chatCollection *mongo.Collection

// Channel to buffer chat messages for bulk insert into MongoDB.
var mongoInsertChan chan ChatMessage

func main() {
	// Initialize MongoDB client and collection.
	ctx := context.Background()
	var err error
	mongoClient, err = mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal("Mongo connection error:", err)
	}
	// Use a time series collection if available. In production, set proper options.
	chatCollection = mongoClient.Database("chatDB").Collection("messages")

	// Initialize the MongoDB insertion channel (buffer capacity of 1000 messages).
	mongoInsertChan = make(chan ChatMessage, 1000)
	go bulkInsertRoutine()

	// Setup Gin router.
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})
	r.GET("/ws", func(c *gin.Context) {
		handleWebSocket(c.Writer, c.Request)
	})
	r.Run() // Listen on default port 8080.
}

// bulkInsertRoutine accumulates messages from the mongoInsertChan and
// performs a bulk insert into MongoDB every second.
func bulkInsertRoutine() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	var messages []interface{}
	for {
		select {
		case msg := <-mongoInsertChan:
			// Append the received message into our bulk slice.
			messages = append(messages, msg)
		case <-ticker.C:
			// If there are messages, perform a bulk insert.
			if len(messages) > 0 {
				if _, err := chatCollection.InsertMany(context.Background(), messages); err != nil {
					log.Println("MongoDB bulk insert error:", err)
				} else {
					log.Printf("Inserted %d messages into MongoDB\n", len(messages))
				}
				// Reset the messages slice.
				messages = nil
			}
		}
	}
}

// handleWebSocket handles a WebSocket connection, integrates Kafka for chat,
// Redis for geospatial checks, and buffers messages for MongoDB.
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket.
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	// Retrieve query parameters.
	userID := r.URL.Query().Get("userid")
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	if userID == "" || latStr == "" || lngStr == "" {
		log.Println("Missing query parameters: userid, lat, lng required")
		conn.WriteMessage(websocket.TextMessage, []byte("Missing query parameters"))
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		log.Println("Invalid latitude:", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid latitude"))
		return
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		log.Println("Invalid longitude:", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid longitude"))
		return
	}

	ctx := context.Background()
	// Update user location in Redis.
	_, err = rdb.GeoAdd(ctx, geoKey, &redis.GeoLocation{
		Name:      userID,
		Longitude: lng,
		Latitude:  lat,
	}).Result()
	if err != nil {
		log.Println("Redis GEOADD error:", err)
	}

	// Retrieve nearby users (within 250 meters).
	nearbyUsers, err := rdb.GeoRadius(ctx, geoKey, lng, lat, &redis.GeoRadiusQuery{
		Radius:    250,
		Unit:      "m",
		WithCoord: true,
	}).Result()
	if err != nil {
		log.Println("Redis GEORADIUS error:", err)
	}
	log.Printf("User %s at (%.5f, %.5f) has %d nearby users\n", userID, lat, lng, len(nearbyUsers))

	// Compute a room id from rounded coordinates.
	roomID := fmt.Sprintf("room_%.3f_%.3f", lat, lng)
	log.Println("Assigned room:", roomID)

	// Set up Kafka writer (producer) for the room topic.
	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    roomID,
		Balancer: &kafka.LeastBytes{},
	})
	defer kafkaWriter.Close()

	// Set up Kafka reader (consumer) for the same topic.
	groupID := fmt.Sprintf("ws-%s-%d", userID, time.Now().UnixNano())
	kafkaReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    roomID,
		GroupID:  groupID,
		MinBytes: 10,
		MaxBytes: 10e6,
	})
	defer kafkaReader.Close()

	// Channel for forwarding Kafka messages to the WebSocket.
	kafkaMsgChan := make(chan ChatMessage)
	// Exit channel to signal termination of goroutines.
	exitChan := make(chan struct{})

	// Start a goroutine to consume Kafka messages.
	go func() {
		for {
			select {
			case <-exitChan:
				return
			default:
				m, err := kafkaReader.ReadMessage(ctx)
				if err != nil {
					log.Println("Kafka reader error:", err)
					close(exitChan)
					return
				}
				var msg ChatMessage
				if err := json.Unmarshal(m.Value, &msg); err != nil {
					log.Println("Unmarshal error:", err)
					continue
				}
				kafkaMsgChan <- msg
			}
		}
	}()

	// Start a goroutine to forward Kafka messages to the WebSocket client.
	go func() {
		for {
			select {
			case msg := <-kafkaMsgChan:
				msgBytes, err := json.Marshal(msg)
				if err != nil {
					log.Println("Marshal error:", err)
					continue
				}
				if err := conn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
					log.Println("WebSocket write error:", err)
					close(exitChan)
					return
				}
			case <-exitChan:
				return
			}
		}
	}()

	// Main loop: read from the WebSocket connection.
	for {
		select {
		case <-exitChan:
			return
		default:
			messageType, messageBytes, err := conn.ReadMessage()
			if err != nil {
				log.Println("WebSocket read error:", err)
				close(exitChan)
				return
			}
			if messageType != websocket.TextMessage {
				continue
			}

			// Create a chat message with the current timestamp.
			chatMsg := ChatMessage{
				UserID:  userID,
				Content: string(messageBytes),
				Time:    time.Now().Unix(),
			}

			// Publish the message to Kafka.
			msgPayload, err := json.Marshal(chatMsg)
			if err != nil {
				log.Println("JSON marshal error:", err)
				continue
			}
			err = kafkaWriter.WriteMessages(ctx, kafka.Message{
				Key:   []byte(userID),
				Value: msgPayload,
				Time:  time.Now(),
			})
			if err != nil {
				log.Println("Kafka write error:", err)
				close(exitChan)
				return
			}

			// Buffer the message for MongoDB bulk insertion.
			select {
			case mongoInsertChan <- chatMsg:
			default:
				log.Println("MongoDB insert channel full; dropping message")
			}
		}
	}
}
