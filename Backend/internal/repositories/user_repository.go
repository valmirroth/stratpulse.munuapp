package repositories

import (
	"database/sql"
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type userRepository struct{ db *sql.DB }

func NewUserRepository(db *sql.DB) repo.UserRepository { return &userRepository{db: db} }

func (r *userRepository) GetByID(id int64) (*models.User, error) {
	u := &models.User{}
	err := r.db.QueryRow(`SELECT id,name,email,password_hash,role,active,created_at,updated_at FROM users WHERE id=@id`,
		sql.Named("id", id)).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.Active, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("usuário não encontrado")
	}
	return u, err
}

func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	u := &models.User{}
	err := r.db.QueryRow(`SELECT id,name,email,password_hash,role,active,created_at,updated_at FROM users WHERE email=@email`,
		sql.Named("email", email)).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.Active, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("usuário não encontrado")
	}
	return u, err
}

func (r *userRepository) GetAll() ([]*models.User, error) {
	rows, err := r.db.Query(`SELECT id,name,email,password_hash,role,active,created_at,updated_at FROM users ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []*models.User
	for rows.Next() {
		u := &models.User{}
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.Active, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *userRepository) Create(u *models.User) error {
	return r.db.QueryRow(
		`INSERT INTO users(name,email,password_hash,role,active) OUTPUT INSERTED.id VALUES(@name,@email,@hash,@role,@active)`,
		sql.Named("name", u.Name), sql.Named("email", u.Email),
		sql.Named("hash", u.PasswordHash), sql.Named("role", string(u.Role)), sql.Named("active", u.Active),
	).Scan(&u.ID)
}

func (r *userRepository) Update(u *models.User) error {
	_, err := r.db.Exec(`UPDATE users SET name=@name,email=@email,role=@role,active=@active,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("name", u.Name), sql.Named("email", u.Email),
		sql.Named("role", string(u.Role)), sql.Named("active", u.Active), sql.Named("id", u.ID))
	return err
}

func (r *userRepository) UpdatePassword(id int64, hash string) error {
	_, err := r.db.Exec(`UPDATE users SET password_hash=@hash,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("hash", hash), sql.Named("id", id))
	return err
}

func (r *userRepository) Delete(id int64) error {
	_, err := r.db.Exec(`UPDATE users SET active=0,updated_at=GETDATE() WHERE id=@id`, sql.Named("id", id))
	return err
}
