package main

import (
	"log"

	"github.com/Talfaza/ssh-service/database"
	"github.com/Talfaza/ssh-service/service"
	"github.com/gofiber/fiber/v3"
)

func main() {
	database.Connect()

	app := fiber.New()

	app.Post("/execute", services.ExecuteCommand)

	log.Println("Server running on port 7789")
	log.Fatal(app.Listen(":7789"))
}
