package service

import (
    "encoding/json"
    "github.com/Talfaza/lxc-service/database"
    "github.com/Talfaza/lxc-service/models"
    "github.com/gofiber/fiber/v3"
)

func CreateConfig(c fiber.Ctx) error {
    var body struct {
        Name     string            `json:"name"`
        Packages map[string]string `json:"packages"`
    }
    if err := c.Bind().Body(&body); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
    }

    userID := c.Locals("userID")
    if userID == nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated"})
    }
    packagesJSON, _ := json.Marshal(body.Packages)
    cfg := models.LXCConfig{
        UserID:   uint(userID.(float64)),
        Name:     body.Name,
        Packages: string(packagesJSON),
    }

    if err := database.DB.Create(&cfg).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save config"})
    }

    return c.Status(fiber.StatusCreated).JSON(cfg)
}

func ListConfigs(c fiber.Ctx) error {
    userID := c.Locals("userID")
    if userID == nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated"})
    }

    var cfgs []models.LXCConfig
    if err := database.DB.Where("user_id = ?", uint(userID.(float64))).Find(&cfgs).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve configs"})
    }
    return c.JSON(cfgs)
}

// DeleteConfig deletes a specific LXC config for the authenticated user
func DeleteConfig(c fiber.Ctx) error {
    userID := c.Locals("userID")
    if userID == nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated"})
    }

    id := c.Params("id")
    if id == "" {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Config ID is required"})
    }

    // Ensure the config belongs to the user before deleting
    result := database.DB.Where("id = ? AND user_id = ?", id, uint(userID.(float64))).Delete(&models.LXCConfig{})
    if result.Error != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete config"})
    }
    if result.RowsAffected == 0 {
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Configuration not found"})
    }

    return c.JSON(fiber.Map{"message": "Configuration deleted successfully"})
}


