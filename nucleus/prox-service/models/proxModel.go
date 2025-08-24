package models

import "gorm.io/gorm"

type ProxConfig struct {
	gorm.Model
	UserID     uint   `json:"user_id"`
	ServerName string `json:"server_name"`
	Username   string `json:"username"`
	Host       string `json:"host"`
	Port       string `json:"port"`
	Password   string `json:"password"`
}

