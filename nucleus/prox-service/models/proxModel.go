package models

import "gorm.io/gorm"

type ProxConfig struct {
	gorm.Model
	Username string `json:"username"`
	Host     string `json:"host"`
	Port     string `json:"port"`
	Password string `json:"password"`
}

