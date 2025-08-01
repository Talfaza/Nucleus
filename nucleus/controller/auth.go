package controller

import (
	"github.com/Talfaza/authentification/database"
	"github.com/Talfaza/authentification/models"
	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"
	"time"
	"os"
)

func Register(c fiber.Ctx) error {
	data := new(map[string]string)

	if err := c.Bind().Body(data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	password, _ := bcrypt.GenerateFromPassword([]byte((*data)["password"]), 14)

	user := models.User{
		Username: (*data)["username"],
		Email:    (*data)["email"],
		Password: string(password),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "User already exists"})
	}

	return c.JSON(user)
}

func Login(c fiber.Ctx) error {
	data := new(map[string]string)

	if err := c.Bind().Body(data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	var user models.User
	database.DB.Where("email = ?", (*data)["email"]).First(&user)

	if user.ID == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte((*data)["password"])); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid password"})
	}

	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := os.Getenv("JWT_SECRET")
	t, err := token.SignedString([]byte(secret))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    t,
		Expires:  time.Now().Add(time.Hour * 24),
		HTTPOnly: true,
	})

	return c.JSON(fiber.Map{"message": "Login successful"})
}

func MailCheck(c fiber.Ctx) error {
	email := c.Query("email")
	var user models.User

	database.DB.Where("email = ?", email).First(&user)
	if user.ID != 0 {
		return c.JSON(fiber.Map{"exists": true})
	}
	return c.JSON(fiber.Map{"exists": false})
}

func Logout(c fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
	})
	return c.JSON(fiber.Map{"message": "Logged out"})
}
