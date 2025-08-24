package routes

import (
	"github.com/Talfaza/authentification/controller"
	"github.com/gofiber/fiber/v3"
)

func Setup(app *fiber.App) {
	auth := app.Group("/auth")

	auth.Post("/register", controller.Register)
	auth.Post("/login", controller.Login)
	auth.Get("/logout", controller.Logout)
	auth.Get("/verify", controller.Verify)
	auth.Get("/mailcheck", controller.MailCheck)
}
