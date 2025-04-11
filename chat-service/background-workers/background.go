package backgroundworkers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/go-redis/redis"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"gopkg.in/mgo.v2/bson"
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

type ScheduledJoin struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Email     string             `bson:"email"`
	Lat       float64            `bson:"lat"`
	Lng       float64            `bson:"lng"`
	Scheduled time.Time          `bson:"scheduled"`
	Joined    bool               `bson:"joined"`
}

func startScheduler() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for {
			<-ticker.C

			now := time.Now()
			bufferStart := now.Add(-1 * time.Hour)
			bufferEnd := now.Add(1 * time.Hour)

			ctx := context.Background()
			cursor, err := mongoClient.Database("chatDB").Collection("schedules").Find(ctx, bson.M{
				"joined":    false,
				"scheduled": bson.M{"$gte": bufferStart, "$lte": bufferEnd},
			})
			if err != nil {
				log.Println("Scheduler query error:", err)
				continue
			}

			var jobs []ScheduledJoin
			if err := cursor.All(ctx, &jobs); err != nil {
				log.Println("Cursor decode error:", err)
				continue
			}

			for _, job := range jobs {
				// Simulate call to /rooms (or directly perform the logic)
				_, err := rdb.GeoAdd(ctx, geoKey, &redis.GeoLocation{
					Name:      job.Email,
					Longitude: job.Lng,
					Latitude:  job.Lat,
				}).Result()
				if err != nil {
					log.Println("GeoAdd error for", job.Email, ":", err)
					continue
				}
				log.Println("Auto joined user:", job.Email)

				// Mark as joined
				_, err = mongoClient.Database("chatDB").Collection("schedules").UpdateByID(ctx, job.ID, bson.M{
					"$set": bson.M{"joined": true},
				})
				if err != nil {
					log.Println("Update join status error:", err)
				}
			}
		}
	}()
}
