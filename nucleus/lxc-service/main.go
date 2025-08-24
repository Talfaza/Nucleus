package main

import (
    "log"

    "github.com/Talfaza/lxc-service/database"
    "github.com/Talfaza/lxc-service/middleware"
    "github.com/Talfaza/lxc-service/service"
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
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    }))

    protected := app.Group("/", middleware.AuthRequired)
    protected.Post("/lxc", service.CreateConfig)
    protected.Get("/lxc", service.ListConfigs)
    protected.Delete("/lxc/:id", service.DeleteConfig)

    log.Println("LXC service running on port 7402")
    log.Fatal(app.Listen(":7402"))
}


