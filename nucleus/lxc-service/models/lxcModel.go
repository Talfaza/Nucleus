package models

import (
    "gorm.io/gorm"
)

type LXCConfig struct {
    gorm.Model
    UserID   uint   `json:"user_id"`
    Name     string `json:"name"`
    // JSON string persisted in MySQL JSON/TEXT column
    Packages string `json:"packages" gorm:"type:JSON"`
}


