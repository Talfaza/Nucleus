package main

import (
	"log"

	"github.com/Talfaza/prox-service/database"
	"github.com/Talfaza/prox-service/middleware"
	"github.com/Talfaza/prox-service/service"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func main() {
	database.Connect()

	app := fiber.New()

	// Enable CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowCredentials: true,
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	}))

	// Protected routes
	protected := app.Group("/", middleware.AuthRequired)
	protected.Post("/prox", services.ExecuteCommand)
	protected.Get("/prox", services.GetUserConfigs)
	protected.Put("/prox/:id", services.UpdateUserConfig)
	protected.Delete("/prox/:id", services.DeleteUserConfig)

	log.Println("Server running on port 7790 !")
	log.Fatal(app.Listen(":7790"))
}

