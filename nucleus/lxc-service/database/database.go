package database

import (
    "fmt"
    "log"
    "os"

    "github.com/Talfaza/lxc-service/models"
    "github.com/joho/godotenv"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
    _ = godotenv.Load()

    dsn := os.Getenv("DSN")
    if dsn == "" {
        log.Fatal("DSN not found in .env")
    }

    database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    fmt.Println("Database connected (lxc-service)")

    DB = database
    if err := DB.AutoMigrate(&models.LXCConfig{}); err != nil {
        log.Fatalf("Failed to migrate database: %v", err)
    }
}




