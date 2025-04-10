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

var rdb = redis.NewClient(&redis.Options{
	Addr: "localhost:6379",
})

const geoKey = "user_locations"

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type ChatMessage struct {
	UserID  string `json:"user_id"`
	Content string `json:"content"`
	Time    int64  `json:"time"`
}

var mongoClient *mongo.Client
var chatCollection *mongo.Collection
var mongoInsertChan chan ChatMessage

func main() {
	ctx := context.Background()
	var err error
	mongoClient, err = mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal("Mongo connection error:", err)
	}
	chatCollection = mongoClient.Database("chatDB").Collection("messages")

	mongoInsertChan = make(chan ChatMessage, 1000)
	go bulkInsertRoutine()

	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	r.GET("/rooms", func(c *gin.Context) {
		email := c.Query("email")
		latStr := c.Query("lat")
		lngStr := c.Query("lng")

		if email == "" || latStr == "" || lngStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email, lat, and lng are required"})
			return
		}

		lat, err1 := strconv.ParseFloat(latStr, 64)
		lng, err2 := strconv.ParseFloat(lngStr, 64)
		if err1 != nil || err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lat/lng"})
			return
		}

		ctx := context.Background()
		_, err := rdb.GeoAdd(ctx, geoKey, &redis.GeoLocation{
			Name:      email,
			Longitude: lng,
			Latitude:  lat,
		}).Result()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "GeoAdd failed"})
			return
		}

		nearby, err := rdb.GeoRadius(ctx, geoKey, lng, lat, &redis.GeoRadiusQuery{
			Radius:    250,
			Unit:      "m",
			WithCoord: true,
		}).Result()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "GeoRadius failed"})
			return
		}

		roomMap := make(map[string]bool)
		var rooms []string
		for _, loc := range nearby {
			room := fmt.Sprintf("room_%.3f_%.3f", loc.Latitude, loc.Longitude)
			if !roomMap[room] {
				roomMap[room] = true
				rooms = append(rooms, room)
			}
		}

		c.JSON(http.StatusOK, gin.H{"nearby_rooms": rooms})
	})

	r.GET("/ws", func(c *gin.Context) {
		handleWebSocket(c.Writer, c.Request)
	})

	r.Run()
}

func bulkInsertRoutine() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	var messages []any
	for {
		select {
		case msg := <-mongoInsertChan:
			messages = append(messages, msg)
		case <-ticker.C:
			if len(messages) > 0 {
				if _, err := chatCollection.InsertMany(context.Background(), messages); err != nil {
					log.Println("MongoDB bulk insert error:", err)
				} else {
					log.Printf("Inserted %d messages into MongoDB\n", len(messages))
				}
				messages = nil
			}
		}
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	email := r.URL.Query().Get("email")
	roomID := r.URL.Query().Get("room")

	if email == "" || roomID == "" {
		log.Println("Missing query parameters: email and room required")
		conn.WriteMessage(websocket.TextMessage, []byte("Missing query parameters"))
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    roomID,
		Balancer: &kafka.LeastBytes{},
	})
	defer kafkaWriter.Close()

	kafkaReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:     []string{"localhost:9092"},
		Topic:       roomID,
		GroupID:     fmt.Sprintf("ws-%s-%d", email, time.Now().UnixNano()),
		MinBytes:    10,
		MaxBytes:    10e6,
		StartOffset: kafka.LastOffset, // Only new messages
	})
	defer kafkaReader.Close()

	kafkaMsgChan := make(chan ChatMessage)

	go func() {
		defer cancel() // trigger cancel on Kafka read error or disconnection
		for {
			m, err := kafkaReader.ReadMessage(ctx)
			if err != nil {
				log.Println("Kafka reader error:", err)
				return
			}
			var msg ChatMessage
			if err := json.Unmarshal(m.Value, &msg); err != nil {
				log.Println("Unmarshal error:", err)
				continue
			}
			kafkaMsgChan <- msg
		}
	}()

	go func() {
		defer cancel() // close on WS write error
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
					return
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		default:
			messageType, messageBytes, err := conn.ReadMessage()
			if err != nil {
				log.Println("WebSocket read error:", err)
				cancel() // clean exit
				return
			}
			if messageType != websocket.TextMessage {
				continue
			}

			chatMsg := ChatMessage{
				UserID:  email,
				Content: string(messageBytes),
				Time:    time.Now().Unix(),
			}

			msgPayload, err := json.Marshal(chatMsg)
			if err != nil {
				log.Println("JSON marshal error:", err)
				continue
			}
			err = kafkaWriter.WriteMessages(ctx, kafka.Message{
				Key:   []byte(email),
				Value: msgPayload,
				Time:  time.Now(),
			})
			if err != nil {
				log.Println("Kafka write error:", err)
				cancel()
				return
			}

			select {
			case mongoInsertChan <- chatMsg:
			default:
				log.Println("MongoDB insert channel full; dropping message")
			}
		}
	}
}
