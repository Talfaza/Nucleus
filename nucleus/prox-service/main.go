package main

import (
	"log"

	"github.com/Talfaza/prox-service/database"
	"github.com/Talfaza/prox-service/service"
	"github.com/gofiber/fiber/v3"
)

func main() {
	database.Connect()

	app := fiber.New()

	app.Post("/prox", services.ExecuteCommand)

	log.Println("Server running on port 7790")
	log.Fatal(app.Listen(":7790"))
}
