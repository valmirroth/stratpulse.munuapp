package repositories

import (
	"database/sql"
	"fmt"
	"strings"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type workOrderRepository struct{ db *sql.DB }

func NewWorkOrderRepository(db *sql.DB) repo.WorkOrderRepository {
	return &workOrderRepository{db: db}
}

const woCols = `
	wo.id, wo.code, wo.asset_id, ISNULL(a.name,'') as asset_name,
	wo.plan_id, wo.account_id, wo.type, wo.priority, wo.status,
	wo.requested_date, wo.scheduled_date, wo.started_date, wo.completed_date,
	wo.description, ISNULL(wo.observations,'') as observations,
	wo.estimated_hours, wo.actual_hours, wo.total_cost,
	wo.created_by, ISNULL(u.name,'') as created_by_name,
	wo.created_at, wo.updated_at`

func scanWO(row interface{ Scan(...any) error }, wo *models.WorkOrder) error {
	return row.Scan(
		&wo.ID, &wo.Code, &wo.AssetID, &wo.AssetName,
		&wo.PlanID, &wo.AccountID, &wo.Type, &wo.Priority, &wo.Status,
		&wo.RequestedDate, &wo.ScheduledDate, &wo.StartedDate, &wo.CompletedDate,
		&wo.Description, &wo.Observations,
		&wo.EstimatedHours, &wo.ActualHours, &wo.TotalCost,
		&wo.CreatedBy, &wo.CreatedByName,
		&wo.CreatedAt, &wo.UpdatedAt,
	)
}

func (r *workOrderRepository) GetByID(id int64) (*models.WorkOrder, error) {
	q := `SELECT` + woCols + `
		FROM work_orders wo
		LEFT JOIN assets a ON a.id = wo.asset_id
		LEFT JOIN users u ON u.id = wo.created_by
		WHERE wo.id = @id`
	wo := &models.WorkOrder{}
	if err := scanWO(r.db.QueryRow(q, sql.Named("id", id)), wo); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("ordem de serviço não encontrada")
		}
		return nil, err
	}
	maints, _ := r.GetMaintainers(id)
	wo.Maintainers = maints
	return wo, nil
}

func (r *workOrderRepository) GetAll(filters repo.WorkOrderFilters) ([]*models.WorkOrder, error) {
	where := []string{}
	args := []any{}

	if filters.Status != "" {
		where = append(where, "wo.status = @status")
		args = append(args, sql.Named("status", filters.Status))
	}
	if filters.Type != "" {
		where = append(where, "wo.type = @type")
		args = append(args, sql.Named("type", filters.Type))
	}
	if filters.AssetID > 0 {
		where = append(where, "wo.asset_id = @asset_id")
		args = append(args, sql.Named("asset_id", filters.AssetID))
	}
	if filters.Priority != "" {
		where = append(where, "wo.priority = @priority")
		args = append(args, sql.Named("priority", filters.Priority))
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = " WHERE " + strings.Join(where, " AND ")
	}

	q := `SELECT` + woCols + `
		FROM work_orders wo
		LEFT JOIN assets a ON a.id = wo.asset_id
		LEFT JOIN users u ON u.id = wo.created_by` +
		whereClause + ` ORDER BY wo.requested_date DESC`

	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.WorkOrder
	for rows.Next() {
		wo := &models.WorkOrder{}
		if err := scanWO(rows, wo); err != nil {
			return nil, err
		}
		list = append(list, wo)
	}
	return list, nil
}

func (r *workOrderRepository) Create(wo *models.WorkOrder) error {
	q := `INSERT INTO work_orders
		(code,asset_id,plan_id,account_id,type,priority,status,scheduled_date,description,estimated_hours,created_by)
		OUTPUT INSERTED.id
		VALUES(@code,@asset_id,@plan_id,@account_id,@type,@priority,'open',@sched_date,@desc,@est_hours,@created_by)`
	return r.db.QueryRow(q,
		sql.Named("code", wo.Code),
		sql.Named("asset_id", wo.AssetID),
		sql.Named("plan_id", wo.PlanID),
		sql.Named("account_id", wo.AccountID),
		sql.Named("type", string(wo.Type)),
		sql.Named("priority", string(wo.Priority)),
		sql.Named("sched_date", wo.ScheduledDate),
		sql.Named("desc", wo.Description),
		sql.Named("est_hours", wo.EstimatedHours),
		sql.Named("created_by", wo.CreatedBy),
	).Scan(&wo.ID)
}

func (r *workOrderRepository) Update(wo *models.WorkOrder) error {
	_, err := r.db.Exec(`UPDATE work_orders SET
		asset_id=@asset_id, plan_id=@plan_id, account_id=@account_id,
		type=@type, priority=@priority, status=@status,
		scheduled_date=@sched_date, description=@desc,
		observations=@obs, estimated_hours=@est_hours, updated_at=GETDATE()
		WHERE id=@id`,
		sql.Named("asset_id", wo.AssetID),
		sql.Named("plan_id", wo.PlanID),
		sql.Named("account_id", wo.AccountID),
		sql.Named("type", string(wo.Type)),
		sql.Named("priority", string(wo.Priority)),
		sql.Named("status", string(wo.Status)),
		sql.Named("sched_date", wo.ScheduledDate),
		sql.Named("desc", wo.Description),
		sql.Named("obs", wo.Observations),
		sql.Named("est_hours", wo.EstimatedHours),
		sql.Named("id", wo.ID),
	)
	return err
}

func (r *workOrderRepository) UpdateStatus(id int64, status models.WorkOrderStatus, observations string) error {
	var extraSet string
	switch status {
	case models.WorkOrderStatusInProgress:
		extraSet = ", started_date = GETDATE()"
	case models.WorkOrderStatusCompleted, models.WorkOrderStatusCancelled:
		extraSet = ", completed_date = GETDATE()"
	}

	q := fmt.Sprintf(`UPDATE work_orders SET status=@status, observations=@obs%s, updated_at=GETDATE() WHERE id=@id`, extraSet)
	_, err := r.db.Exec(q,
		sql.Named("status", string(status)),
		sql.Named("obs", observations),
		sql.Named("id", id),
	)
	return err
}

func (r *workOrderRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM work_orders WHERE id=@id`, sql.Named("id", id))
	return err
}

func (r *workOrderRepository) AssignMaintainer(workOrderID, maintainerID int64) error {
	_, err := r.db.Exec(`
		IF NOT EXISTS (SELECT 1 FROM work_order_maintainers WHERE work_order_id=@woid AND maintainer_id=@mid)
		INSERT INTO work_order_maintainers(work_order_id, maintainer_id) VALUES(@woid,@mid)`,
		sql.Named("woid", workOrderID),
		sql.Named("mid", maintainerID),
	)
	return err
}

func (r *workOrderRepository) RemoveMaintainer(workOrderID, maintainerID int64) error {
	_, err := r.db.Exec(`DELETE FROM work_order_maintainers WHERE work_order_id=@woid AND maintainer_id=@mid`,
		sql.Named("woid", workOrderID),
		sql.Named("mid", maintainerID),
	)
	return err
}

func (r *workOrderRepository) GetMaintainers(workOrderID int64) ([]models.Maintainer, error) {
	rows, err := r.db.Query(`
		SELECT m.id,m.user_id,m.name,m.registration,m.specialty,m.phone,m.email,m.hourly_rate,m.active,m.created_at,m.updated_at
		FROM work_order_maintainers wm
		JOIN maintainers m ON m.id = wm.maintainer_id
		WHERE wm.work_order_id = @woid`,
		sql.Named("woid", workOrderID),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.Maintainer
	for rows.Next() {
		m := models.Maintainer{}
		if err := rows.Scan(&m.ID, &m.UserID, &m.Name, &m.Registration, &m.Specialty, &m.Phone, &m.Email, &m.HourlyRate, &m.Active, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *workOrderRepository) CountByStatus() (map[string]int, error) {
	rows, err := r.db.Query(`SELECT status, COUNT(*) as cnt FROM work_orders GROUP BY status`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := map[string]int{}
	for rows.Next() {
		var status string
		var cnt int
		if err := rows.Scan(&status, &cnt); err != nil {
			return nil, err
		}
		m[status] = cnt
	}
	return m, nil
}
