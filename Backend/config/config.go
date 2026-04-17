package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	DBServer  string
	DBPort    string
	DBName    string
	DBUser    string
	DBPass    string
	JWTSecret string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis de ambiente")
	}
	return &Config{
		Port:      getEnv("PORT", "8080"),
		DBServer:  getEnv("DB_SERVER", "localhost"),
		DBPort:    getEnv("DB_PORT", "1433"),
		DBName:    getEnv("DB_NAME", "manuind"),
		DBUser:    getEnv("DB_USER", "sa"),
		DBPass:    getEnv("DB_PASSWORD", ""),
		JWTSecret: getEnv("JWT_SECRET", "manuind-secret-key"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
