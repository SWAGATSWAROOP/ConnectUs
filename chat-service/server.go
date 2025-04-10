package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections by default (for testing; use a proper check in prod)
		return true
	},
}

func main() {
	r := gin.Default()
	// Test
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	r.GET("/ws", func(c *gin.Context) {
		handleWebSocket(c.Writer, c.Request)
	})

	r.Run()
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for {
		// Read message
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		// Echo the message back
		err = conn.WriteMessage(messageType, message)
		if err != nil {
			break
		}
	}
}
