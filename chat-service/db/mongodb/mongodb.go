// db/mongodb.go
package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	moptions "go.mongodb.org/mongo-driver/mongo/options"
)

// ChatMessage represents a chat message stored in MongoDB.
// To leverage time series collection features, we store the message timestamp
// as well as a metadata field that holds the room information.
type ChatMessage struct {
	Sender    string    `bson:"sender"`    // sender of the message
	Content   string    `bson:"content"`   // message content
	Timestamp time.Time `bson:"timestamp"` // timestamp when the message is sent
	Metadata  Metadata  `bson:"metadata"`  // additional meta data (here, the chat room)
}

// Metadata holds extra information for the time series collection.
type Metadata struct {
	Room string `bson:"room"`
}

// MongoDB wraps the mongo.Collection and Client.
type MongoDB struct {
	Collection *mongo.Collection
	Client     *mongo.Client
}

// ConnectMongo connects to MongoDB and ensures that the specified collection
// exists as a time series collection. The time series options specify the
// "timestamp" field as the timeField and "metadata" as the metaField.
func ConnectMongo(ctx context.Context, uri, dbName, collName string) (*MongoDB, error) {
	// Create a new MongoDB client
	clientOpts := moptions.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return nil, err
	}

	db := client.Database(dbName)

	// Check if the collection exists.
	collections, err := db.ListCollectionNames(ctx, bson.M{"name": collName})
	if err != nil {
		return nil, err
	}

	// If it doesn't exist, create a time series collection.
	if len(collections) == 0 {
		log.Printf("Collection %s not found. Creating time series collection...", collName)
		createOpts := moptions.CreateCollection().
			SetTimeSeriesOptions(&moptions.TimeSeriesOptions{
				TimeField:   "timestamp",
				MetaField:   moptions.String("metadata"),
				Granularity: moptions.String("seconds"),
			})
		if err := db.CreateCollection(ctx, collName, createOpts); err != nil {
			return nil, err
		}
	}

	collection := db.Collection(collName)
	return &MongoDB{
		Collection: collection,
		Client:     client,
	}, nil
}

// InsertChatMessage inserts a single ChatMessage into the time series collection.
func (mdb *MongoDB) InsertChatMessage(ctx context.Context, msg ChatMessage) error {
	_, err := mdb.Collection.InsertOne(ctx, msg)
	return err
}

// GetChatHistory retrieves all chat messages for a given room.
func (mdb *MongoDB) GetChatHistory(ctx context.Context, room string) ([]ChatMessage, error) {
	// Query on the meta field ("metadata.room")
	filter := bson.M{"metadata.room": room}
	cursor, err := mdb.Collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []ChatMessage
	for cursor.Next(ctx) {
		var msg ChatMessage
		if err := cursor.Decode(&msg); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}
	return messages, nil
}
