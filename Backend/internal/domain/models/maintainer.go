package models

import "time"

type Maintainer struct {
	ID           int64     `json:"id"`
	UserID       *int64    `json:"user_id"`
	Name         string    `json:"name"`
	Registration string    `json:"registration"`
	Specialty    string    `json:"specialty"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	HourlyRate   float64   `json:"hourly_rate"`
	Active       bool      `json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateMaintainerRequest struct {
	UserID       *int64  `json:"user_id"`
	Name         string  `json:"name"`
	Registration string  `json:"registration"`
	Specialty    string  `json:"specialty"`
	Phone        string  `json:"phone"`
	Email        string  `json:"email"`
	HourlyRate   float64 `json:"hourly_rate"`
}

type UpdateMaintainerRequest struct {
	Name         string  `json:"name"`
	Registration string  `json:"registration"`
	Specialty    string  `json:"specialty"`
	Phone        string  `json:"phone"`
	Email        string  `json:"email"`
	HourlyRate   float64 `json:"hourly_rate"`
	Active       bool    `json:"active"`
}
