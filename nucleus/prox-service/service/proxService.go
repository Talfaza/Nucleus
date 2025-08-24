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
	if err := c.Bind().Body(&config); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get user ID from middleware
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Convert userID to uint
	config.UserID = uint(userID.(float64))

	// Save to database
	if err := database.DB.Create(&config).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save credentials",
		})
	}

	// Return saved record
	return c.Status(fiber.StatusCreated).JSON(config)
}

// GetUserConfigs retrieves all configurations for a specific user
func GetUserConfigs(c fiber.Ctx) error {
	// Get user ID from middleware
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	var configs []models.ProxConfig
	
	// Find all configurations for this user
	if err := database.DB.Where("user_id = ?", uint(userID.(float64))).Find(&configs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve configurations",
		})
	}

	return c.JSON(configs)
}

// UpdateUserConfig updates a specific configuration for a user
func UpdateUserConfig(c fiber.Ctx) error {
	// Get user ID from middleware
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Get config ID from URL parameter
	configID := c.Params("id")
	if configID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Config ID is required",
		})
	}

	var config models.ProxConfig
	
	// Parse JSON body into struct
	if err := c.Bind().Body(&config); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Find existing config that belongs to this user
	var existingConfig models.ProxConfig
	if err := database.DB.Where("id = ? AND user_id = ?", configID, uint(userID.(float64))).First(&existingConfig).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Configuration not found",
		})
	}

	// Update the config
	existingConfig.ServerName = config.ServerName
	existingConfig.Username = config.Username
	existingConfig.Host = config.Host
	existingConfig.Port = config.Port
	if config.Password != "" { // Only update password if provided
		existingConfig.Password = config.Password
	}

	if err := database.DB.Save(&existingConfig).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update configuration",
		})
	}

	return c.JSON(existingConfig)
}

// DeleteUserConfig deletes a specific configuration for a user
func DeleteUserConfig(c fiber.Ctx) error {
	// Get user ID from middleware
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Get config ID from URL parameter
	configID := c.Params("id")
	if configID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Config ID is required",
		})
	}

	// Delete config that belongs to this user
	result := database.DB.Where("id = ? AND user_id = ?", configID, uint(userID.(float64))).Delete(&models.ProxConfig{})
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete configuration",
		})
	}

	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Configuration not found",
		})
	}

	return c.JSON(fiber.Map{"message": "Configuration deleted successfully"})
}
