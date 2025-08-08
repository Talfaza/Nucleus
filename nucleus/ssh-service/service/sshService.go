package services

import (
	"fmt"

	"github.com/Talfaza/ssh-service/database"
	"github.com/Talfaza/ssh-service/models"
	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/ssh"
)

func ConnectAndExecute(req models.SSHRequest) (string, error) {
	sshConfig := &ssh.ClientConfig{
		User: req.Username,
		Auth: []ssh.AuthMethod{
			ssh.Password(req.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", fmt.Sprintf("%s:%s", req.Host, req.Port), sshConfig)
	if err != nil {
		return "", fmt.Errorf("failed to dial: %v", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %v", err)
	}
	defer session.Close()

	output, err := session.CombinedOutput(req.Command)
	if err != nil {
		return "", fmt.Errorf("failed to run command: %v", err)
	}

	return string(output), nil
}

func ExecuteCommand(c fiber.Ctx) error {
	var req models.SSHRequest

	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	if database.DB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database not connected",
		})
	}

	config := models.SSHConfig{
		Username: req.Username,
		Host:     req.Host,
		Port:     req.Port,
	}

	if err := database.DB.Create(&config).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store SSH config",
		})
	}

	output, err := ConnectAndExecute(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Error executing command: %v", err),
		})
	}

	return c.JSON(fiber.Map{
		"output": output,
	})
}
