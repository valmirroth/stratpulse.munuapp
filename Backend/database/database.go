package database

import (
	"database/sql"
	"fmt"

	"manuind/config"

	_ "github.com/denisenkom/go-mssqldb"
)

func Connect(cfg *config.Config) (*sql.DB, error) {
	connStr := fmt.Sprintf(
		"server=%s;user id=%s;password=%s;port=%s;database=%s;encrypt=disable",
		cfg.DBServer, cfg.DBUser, cfg.DBPass, cfg.DBPort, cfg.DBName,
	)

	db, err := sql.Open("sqlserver", connStr)
	if err != nil {
		return nil, fmt.Errorf("erro ao abrir banco: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("erro ao conectar no banco: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}
