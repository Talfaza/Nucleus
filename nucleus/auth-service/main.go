package main

import (
	"github.com/Talfaza/authentification/database"
	"github.com/Talfaza/authentification/routes"
	"github.com/gofiber/fiber/v3"
	"github.com/joho/godotenv"
  "github.com/gofiber/fiber/v3/middleware/cors"

	"log"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env")
	}

	app := fiber.New()


	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "HEAD", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	database.Connect()
	routes.Setup(app)

	log.Fatal(app.Listen(":9872"))
}
