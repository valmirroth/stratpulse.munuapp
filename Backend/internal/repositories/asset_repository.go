package repositories

import (
	"database/sql"
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type assetRepository struct{ db *sql.DB }

func NewAssetRepository(db *sql.DB) repo.AssetRepository { return &assetRepository{db: db} }

func (r *assetRepository) GetByID(id int64) (*models.Asset, error) {
	a := &models.Asset{}
	err := r.db.QueryRow(`SELECT id,parent_id,code,name,description,type,level,active,created_at,updated_at FROM assets WHERE id=@id`,
		sql.Named("id", id)).Scan(&a.ID, &a.ParentID, &a.Code, &a.Name, &a.Description, &a.Type, &a.Level, &a.Active, &a.CreatedAt, &a.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("ativo não encontrado")
	}
	return a, err
}

func (r *assetRepository) GetAll() ([]*models.Asset, error) {
	rows, err := r.db.Query(`SELECT id,parent_id,code,name,description,type,level,active,created_at,updated_at FROM assets ORDER BY level,code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Asset
	for rows.Next() {
		a := &models.Asset{}
		if err := rows.Scan(&a.ID, &a.ParentID, &a.Code, &a.Name, &a.Description, &a.Type, &a.Level, &a.Active, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

func (r *assetRepository) Create(a *models.Asset) error {
	return r.db.QueryRow(
		`INSERT INTO assets(parent_id,code,name,description,type,level) OUTPUT INSERTED.id VALUES(@parent_id,@code,@name,@desc,@type,@level)`,
		sql.Named("parent_id", a.ParentID), sql.Named("code", a.Code), sql.Named("name", a.Name),
		sql.Named("desc", a.Description), sql.Named("type", string(a.Type)), sql.Named("level", a.Level),
	).Scan(&a.ID)
}

func (r *assetRepository) Update(a *models.Asset) error {
	_, err := r.db.Exec(`UPDATE assets SET code=@code,name=@name,description=@desc,type=@type,active=@active,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("code", a.Code), sql.Named("name", a.Name), sql.Named("desc", a.Description),
		sql.Named("type", string(a.Type)), sql.Named("active", a.Active), sql.Named("id", a.ID))
	return err
}

func (r *assetRepository) Delete(id int64) error {
	_, err := r.db.Exec(`UPDATE assets SET active=0,updated_at=GETDATE() WHERE id=@id`, sql.Named("id", id))
	return err
}
