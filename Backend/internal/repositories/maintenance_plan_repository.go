package repositories

import (
	"database/sql"
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type maintenancePlanRepository struct{ db *sql.DB }

func NewMaintenancePlanRepository(db *sql.DB) repo.MaintenancePlanRepository {
	return &maintenancePlanRepository{db: db}
}

const planCols = `
	mp.id, mp.asset_id, ISNULL(a.name,'') as asset_name, mp.account_id,
	mp.code, mp.name, mp.description, mp.frequency_type, mp.frequency_value,
	mp.estimated_hours, mp.priority, mp.active, mp.created_at, mp.updated_at`

func scanPlan(row interface{ Scan(...any) error }, p *models.MaintenancePlan) error {
	return row.Scan(
		&p.ID, &p.AssetID, &p.AssetName, &p.AccountID,
		&p.Code, &p.Name, &p.Description, &p.FrequencyType, &p.FrequencyValue,
		&p.EstimatedHours, &p.Priority, &p.Active, &p.CreatedAt, &p.UpdatedAt,
	)
}

func (r *maintenancePlanRepository) GetByID(id int64) (*models.MaintenancePlan, error) {
	q := `SELECT` + planCols + `
		FROM maintenance_plans mp
		LEFT JOIN assets a ON a.id = mp.asset_id
		WHERE mp.id = @id`
	p := &models.MaintenancePlan{}
	if err := scanPlan(r.db.QueryRow(q, sql.Named("id", id)), p); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("plano não encontrado")
		}
		return nil, err
	}
	tasks, _ := r.GetTasks(id)
	p.Tasks = tasks
	return p, nil
}

func (r *maintenancePlanRepository) GetAll() ([]*models.MaintenancePlan, error) {
	q := `SELECT` + planCols + `
		FROM maintenance_plans mp
		LEFT JOIN assets a ON a.id = mp.asset_id
		ORDER BY mp.code`
	rows, err := r.db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.MaintenancePlan
	for rows.Next() {
		p := &models.MaintenancePlan{}
		if err := scanPlan(rows, p); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *maintenancePlanRepository) GetByAsset(assetID int64) ([]*models.MaintenancePlan, error) {
	q := `SELECT` + planCols + `
		FROM maintenance_plans mp
		LEFT JOIN assets a ON a.id = mp.asset_id
		WHERE mp.asset_id = @asset_id
		ORDER BY mp.code`
	rows, err := r.db.Query(q, sql.Named("asset_id", assetID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.MaintenancePlan
	for rows.Next() {
		p := &models.MaintenancePlan{}
		if err := scanPlan(rows, p); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *maintenancePlanRepository) Create(p *models.MaintenancePlan) error {
	q := `INSERT INTO maintenance_plans
		(asset_id, account_id, code, name, description, frequency_type, frequency_value, estimated_hours, priority)
		OUTPUT INSERTED.id
		VALUES (@asset_id,@account_id,@code,@name,@desc,@freq_type,@freq_val,@est_hours,@priority)`
	return r.db.QueryRow(q,
		sql.Named("asset_id", p.AssetID),
		sql.Named("account_id", p.AccountID),
		sql.Named("code", p.Code),
		sql.Named("name", p.Name),
		sql.Named("desc", p.Description),
		sql.Named("freq_type", string(p.FrequencyType)),
		sql.Named("freq_val", p.FrequencyValue),
		sql.Named("est_hours", p.EstimatedHours),
		sql.Named("priority", string(p.Priority)),
	).Scan(&p.ID)
}

func (r *maintenancePlanRepository) Update(p *models.MaintenancePlan) error {
	_, err := r.db.Exec(`UPDATE maintenance_plans SET
		asset_id=@asset_id, account_id=@account_id, code=@code, name=@name,
		description=@desc, frequency_type=@freq_type, frequency_value=@freq_val,
		estimated_hours=@est_hours, priority=@priority, active=@active, updated_at=GETDATE()
		WHERE id=@id`,
		sql.Named("asset_id", p.AssetID),
		sql.Named("account_id", p.AccountID),
		sql.Named("code", p.Code),
		sql.Named("name", p.Name),
		sql.Named("desc", p.Description),
		sql.Named("freq_type", string(p.FrequencyType)),
		sql.Named("freq_val", p.FrequencyValue),
		sql.Named("est_hours", p.EstimatedHours),
		sql.Named("priority", string(p.Priority)),
		sql.Named("active", p.Active),
		sql.Named("id", p.ID),
	)
	return err
}

func (r *maintenancePlanRepository) Delete(id int64) error {
	_, err := r.db.Exec(`UPDATE maintenance_plans SET active=0,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("id", id))
	return err
}

func (r *maintenancePlanRepository) GetTasks(planID int64) ([]models.MaintenancePlanTask, error) {
	rows, err := r.db.Query(`SELECT id,plan_id,sequence,description,estimated_minutes
		FROM maintenance_plan_tasks WHERE plan_id=@plan_id ORDER BY sequence`,
		sql.Named("plan_id", planID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tasks []models.MaintenancePlanTask
	for rows.Next() {
		t := models.MaintenancePlanTask{}
		if err := rows.Scan(&t.ID, &t.PlanID, &t.Sequence, &t.Description, &t.EstimatedMinutes); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func (r *maintenancePlanRepository) CreateTask(t *models.MaintenancePlanTask) error {
	return r.db.QueryRow(`INSERT INTO maintenance_plan_tasks(plan_id,sequence,description,estimated_minutes)
		OUTPUT INSERTED.id VALUES(@plan_id,@seq,@desc,@mins)`,
		sql.Named("plan_id", t.PlanID),
		sql.Named("seq", t.Sequence),
		sql.Named("desc", t.Description),
		sql.Named("mins", t.EstimatedMinutes),
	).Scan(&t.ID)
}

func (r *maintenancePlanRepository) UpdateTask(t *models.MaintenancePlanTask) error {
	_, err := r.db.Exec(`UPDATE maintenance_plan_tasks SET sequence=@seq,description=@desc,estimated_minutes=@mins WHERE id=@id`,
		sql.Named("seq", t.Sequence),
		sql.Named("desc", t.Description),
		sql.Named("mins", t.EstimatedMinutes),
		sql.Named("id", t.ID),
	)
	return err
}

func (r *maintenancePlanRepository) DeleteTask(taskID int64) error {
	_, err := r.db.Exec(`DELETE FROM maintenance_plan_tasks WHERE id=@id`, sql.Named("id", taskID))
	return err
}
