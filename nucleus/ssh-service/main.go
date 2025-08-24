package main

import (
	"log"

	"github.com/Talfaza/ssh-service/database"
	"github.com/Talfaza/ssh-service/service"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func main() {
	database.Connect()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowCredentials: true,
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
	}))

	app.Post("/execute", services.ExecuteCommand)

	log.Println("Server running on port 7789")
	log.Fatal(app.Listen(":7789"))
}
