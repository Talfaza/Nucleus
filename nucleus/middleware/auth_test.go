package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
)

func TestAuthRequired(t *testing.T) {
	// Setup
	_ = os.Setenv("JWT_SECRET", "test_secret")
	app := fiber.New()
	app.Use(AuthRequired)
	app.Get("/protected", func(c fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Create valid JWT token
	claims := jwt.MapClaims{
		"sub": 123,
		"exp": time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	validToken, _ := token.SignedString([]byte("test_secret"))

	t.Run("valid token", func(t *testing.T) {
		// Prepare
		req := httptest.NewRequest("GET", "/protected", nil)
		req.AddCookie(&http.Cookie{
			Name:  "jwt",
			Value: validToken,
		})

		// Execute
		resp, _ := app.Test(req)

		// Verify
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	})

	t.Run("missing token", func(t *testing.T) {
		// Execute
		req := httptest.NewRequest("GET", "/protected", nil)
		resp, _ := app.Test(req)

		// Verify
		assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("invalid token", func(t *testing.T) {
		// Prepare
		req := httptest.NewRequest("GET", "/protected", nil)
		req.AddCookie(&http.Cookie{
			Name:  "jwt",
			Value: "invalid.token.value",
		})

		// Execute
		resp, _ := app.Test(req)

		// Verify
		assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("expired token", func(t *testing.T) {
		// Create expired token
		expiredClaims := jwt.MapClaims{
			"sub": 123,
			"exp": time.Now().Add(-time.Hour).Unix(),
		}
		expiredToken := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
		expiredTokenString, _ := expiredToken.SignedString([]byte("test_secret"))

		// Prepare
		req := httptest.NewRequest("GET", "/protected", nil)
		req.AddCookie(&http.Cookie{
			Name:  "jwt",
			Value: expiredTokenString,
		})

		// Execute
		resp, _ := app.Test(req)

		// Verify
		assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
	})
}
