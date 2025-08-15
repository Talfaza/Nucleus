package services

import (
	"github.com/Talfaza/prox-service/database"
	"github.com/Talfaza/prox-service/models"
	"github.com/gofiber/fiber/v3"
)

// ExecuteCommand handles adding SSH credentials into the database
func ExecuteCommand(c fiber.Ctx) error {
	var config models.ProxConfig

	// Parse JSON body into struct
	if err := c.BodyParser(&config); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Save to database
	if err := database.DB.Create(&config).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save credentials",
		})
	}

	// Return saved record
	return c.Status(fiber.StatusCreated).JSON(config)
}
