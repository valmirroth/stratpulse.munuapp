package repositories

import (
	"database/sql"
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type accountRepository struct{ db *sql.DB }

func NewAccountRepository(db *sql.DB) repo.AccountRepository { return &accountRepository{db: db} }

func (r *accountRepository) GetByID(id int64) (*models.Account, error) {
	a := &models.Account{}
	err := r.db.QueryRow(`SELECT id,parent_id,code,name,type,nature,level,active,created_at,updated_at FROM account_plan WHERE id=@id`,
		sql.Named("id", id)).Scan(&a.ID, &a.ParentID, &a.Code, &a.Name, &a.Type, &a.Nature, &a.Level, &a.Active, &a.CreatedAt, &a.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conta não encontrada")
	}
	return a, err
}

func (r *accountRepository) GetAll() ([]*models.Account, error) {
	rows, err := r.db.Query(`SELECT id,parent_id,code,name,type,nature,level,active,created_at,updated_at FROM account_plan ORDER BY code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Account
	for rows.Next() {
		a := &models.Account{}
		if err := rows.Scan(&a.ID, &a.ParentID, &a.Code, &a.Name, &a.Type, &a.Nature, &a.Level, &a.Active, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

func (r *accountRepository) Create(a *models.Account) error {
	return r.db.QueryRow(
		`INSERT INTO account_plan(parent_id,code,name,type,nature,level) OUTPUT INSERTED.id VALUES(@parent_id,@code,@name,@type,@nature,@level)`,
		sql.Named("parent_id", a.ParentID), sql.Named("code", a.Code), sql.Named("name", a.Name),
		sql.Named("type", string(a.Type)), sql.Named("nature", string(a.Nature)), sql.Named("level", a.Level),
	).Scan(&a.ID)
}

func (r *accountRepository) Update(a *models.Account) error {
	_, err := r.db.Exec(`UPDATE account_plan SET code=@code,name=@name,type=@type,nature=@nature,active=@active,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("code", a.Code), sql.Named("name", a.Name), sql.Named("type", string(a.Type)),
		sql.Named("nature", string(a.Nature)), sql.Named("active", a.Active), sql.Named("id", a.ID))
	return err
}

func (r *accountRepository) Delete(id int64) error {
	_, err := r.db.Exec(`UPDATE account_plan SET active=0,updated_at=GETDATE() WHERE id=@id`, sql.Named("id", id))
	return err
}
