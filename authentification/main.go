package main

import (
	"github.com/Talfaza/authentification/database"
	"github.com/Talfaza/authentification/routes"
	"github.com/gofiber/fiber/v3"
	"github.com/joho/godotenv"
	"log"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env")
	}

	app := fiber.New()
	database.Connect()
	routes.Setup(app)

	log.Fatal(app.Listen(":9872"))
}
