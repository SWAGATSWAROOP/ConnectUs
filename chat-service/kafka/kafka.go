package kafka

import (
	"context"

	"github.com/segmentio/kafka-go"
)

var kafkaWriter = kafka.Writer{
	Addr:     kafka.TCP("localhost:9092"),
	Topic:    "chat-messages",
	Balancer: &kafka.LeastBytes{},
}

func sendToKafka(message string) error {
	return kafkaWriter.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte("key"),
			Value: []byte(message),
		},
	)
}
