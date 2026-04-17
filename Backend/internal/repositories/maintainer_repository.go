package repositories

import (
	"database/sql"
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type maintainerRepository struct{ db *sql.DB }

func NewMaintainerRepository(db *sql.DB) repo.MaintainerRepository {
	return &maintainerRepository{db: db}
}

const maintainerSelect = `SELECT id,user_id,name,registration,specialty,phone,email,hourly_rate,active,created_at,updated_at FROM maintainers`

func scanMaintainer(row interface{ Scan(...any) error }, m *models.Maintainer) error {
	return row.Scan(&m.ID, &m.UserID, &m.Name, &m.Registration, &m.Specialty, &m.Phone, &m.Email, &m.HourlyRate, &m.Active, &m.CreatedAt, &m.UpdatedAt)
}

func (r *maintainerRepository) GetByID(id int64) (*models.Maintainer, error) {
	m := &models.Maintainer{}
	err := scanMaintainer(r.db.QueryRow(maintainerSelect+` WHERE id=@id`, sql.Named("id", id)), m)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("manutentor não encontrado")
	}
	return m, err
}

func (r *maintainerRepository) list(query string, args ...any) ([]*models.Maintainer, error) {
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Maintainer
	for rows.Next() {
		m := &models.Maintainer{}
		if err := rows.Scan(&m.ID, &m.UserID, &m.Name, &m.Registration, &m.Specialty, &m.Phone, &m.Email, &m.HourlyRate, &m.Active, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *maintainerRepository) GetAll() ([]*models.Maintainer, error) {
	return r.list(maintainerSelect + ` ORDER BY name`)
}

func (r *maintainerRepository) GetActive() ([]*models.Maintainer, error) {
	return r.list(maintainerSelect + ` WHERE active=1 ORDER BY name`)
}

func (r *maintainerRepository) Create(m *models.Maintainer) error {
	return r.db.QueryRow(
		`INSERT INTO maintainers(user_id,name,registration,specialty,phone,email,hourly_rate) OUTPUT INSERTED.id VALUES(@uid,@name,@reg,@spec,@phone,@email,@rate)`,
		sql.Named("uid", m.UserID), sql.Named("name", m.Name), sql.Named("reg", m.Registration),
		sql.Named("spec", m.Specialty), sql.Named("phone", m.Phone), sql.Named("email", m.Email), sql.Named("rate", m.HourlyRate),
	).Scan(&m.ID)
}

func (r *maintainerRepository) Update(m *models.Maintainer) error {
	_, err := r.db.Exec(`UPDATE maintainers SET name=@name,registration=@reg,specialty=@spec,phone=@phone,email=@email,hourly_rate=@rate,active=@active,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("name", m.Name), sql.Named("reg", m.Registration), sql.Named("spec", m.Specialty),
		sql.Named("phone", m.Phone), sql.Named("email", m.Email), sql.Named("rate", m.HourlyRate),
		sql.Named("active", m.Active), sql.Named("id", m.ID))
	return err
}

func (r *maintainerRepository) Delete(id int64) error {
	_, err := r.db.Exec(`UPDATE maintainers SET active=0,updated_at=GETDATE() WHERE id=@id`, sql.Named("id", id))
	return err
}
