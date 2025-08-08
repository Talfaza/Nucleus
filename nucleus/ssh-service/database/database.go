package database

import (
	"fmt"
	"log"
	"os"

	"github.com/Talfaza/ssh-service/models"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := os.Getenv("DSN")
	if dsn == "" {
		log.Fatal("DSN not found in .env")
	}

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Database connected :3")

	DB = database
	if err := DB.AutoMigrate(&models.SSHConfig{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

}
