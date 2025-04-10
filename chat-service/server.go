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
	r.GET("/ws", func(c *gin.Context) {
		handleWebSocket(c.Writer, c.Request)
	})
	r.Run()
}

func bulkInsertRoutine() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	var messages []interface{}
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
	_, err = rdb.GeoAdd(ctx, geoKey, &redis.GeoLocation{
		Name:      userID,
		Longitude: lng,
		Latitude:  lat,
	}).Result()
	if err != nil {
		log.Println("Redis GEOADD error:", err)
	}

	nearbyUsers, err := rdb.GeoRadius(ctx, geoKey, lng, lat, &redis.GeoRadiusQuery{
		Radius:    250,
		Unit:      "m",
		WithCoord: true,
	}).Result()
	if err != nil {
		log.Println("Redis GEORADIUS error:", err)
	}
	log.Printf("User %s at (%.5f, %.5f) has %d nearby users\n", userID, lat, lng, len(nearbyUsers))

	roomID := fmt.Sprintf("room_%.3f_%.3f", lat, lng)
	log.Println("Assigned room:", roomID)

	kafkaWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    roomID,
		Balancer: &kafka.LeastBytes{},
	})
	defer kafkaWriter.Close()

	groupID := fmt.Sprintf("ws-%s-%d", userID, time.Now().UnixNano())
	kafkaReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    roomID,
		GroupID:  groupID,
		MinBytes: 10,
		MaxBytes: 10e6,
	})
	defer kafkaReader.Close()

	kafkaMsgChan := make(chan ChatMessage)
	exitChan := make(chan struct{})

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

			chatMsg := ChatMessage{
				UserID:  userID,
				Content: string(messageBytes),
				Time:    time.Now().Unix(),
			}

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

			select {
			case mongoInsertChan <- chatMsg:
			default:
				log.Println("MongoDB insert channel full; dropping message")
			}
		}
	}
}
