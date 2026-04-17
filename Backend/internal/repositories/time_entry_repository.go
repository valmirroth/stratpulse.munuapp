package repositories

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type timeEntryRepository struct{ db *sql.DB }

func NewTimeEntryRepository(db *sql.DB) repo.TimeEntryRepository {
	return &timeEntryRepository{db: db}
}

const teCols = `
	te.id, te.work_order_id, ISNULL(wo.code,'') as wo_code,
	te.maintainer_id, ISNULL(m.name,'') as maint_name,
	te.start_time, te.end_time, te.hours, ISNULL(te.description,'') as description,
	te.status, te.approved_by, te.approved_at,
	te.created_at, te.updated_at`

func scanTE(row interface{ Scan(...any) error }, te *models.TimeEntry) error {
	return row.Scan(
		&te.ID, &te.WorkOrderID, &te.WorkOrderCode,
		&te.MaintainerID, &te.MaintainerName,
		&te.StartTime, &te.EndTime, &te.Hours, &te.Description,
		&te.Status, &te.ApprovedBy, &te.ApprovedAt,
		&te.CreatedAt, &te.UpdatedAt,
	)
}

func (r *timeEntryRepository) GetByID(id int64) (*models.TimeEntry, error) {
	q := `SELECT` + teCols + `
		FROM time_entries te
		LEFT JOIN work_orders wo ON wo.id = te.work_order_id
		LEFT JOIN maintainers m ON m.id = te.maintainer_id
		WHERE te.id = @id`
	te := &models.TimeEntry{}
	if err := scanTE(r.db.QueryRow(q, sql.Named("id", id)), te); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("lançamento não encontrado")
		}
		return nil, err
	}
	return te, nil
}

func (r *timeEntryRepository) GetAll(filters repo.TimeEntryFilters) ([]*models.TimeEntry, error) {
	where := []string{}
	args := []any{}

	if filters.WorkOrderID > 0 {
		where = append(where, "te.work_order_id = @woid")
		args = append(args, sql.Named("woid", filters.WorkOrderID))
	}
	if filters.MaintainerID > 0 {
		where = append(where, "te.maintainer_id = @mid")
		args = append(args, sql.Named("mid", filters.MaintainerID))
	}
	if filters.Status != "" {
		where = append(where, "te.status = @status")
		args = append(args, sql.Named("status", filters.Status))
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = " WHERE " + strings.Join(where, " AND ")
	}

	q := `SELECT` + teCols + `
		FROM time_entries te
		LEFT JOIN work_orders wo ON wo.id = te.work_order_id
		LEFT JOIN maintainers m ON m.id = te.maintainer_id` +
		whereClause + ` ORDER BY te.start_time DESC`

	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.TimeEntry
	for rows.Next() {
		te := &models.TimeEntry{}
		if err := scanTE(rows, te); err != nil {
			return nil, err
		}
		list = append(list, te)
	}
	return list, nil
}

func (r *timeEntryRepository) GetByWorkOrder(workOrderID int64) ([]*models.TimeEntry, error) {
	return r.GetAll(repo.TimeEntryFilters{WorkOrderID: workOrderID})
}

func (r *timeEntryRepository) Create(te *models.TimeEntry) error {
	// calcular horas se end_time informado
	if te.EndTime != nil {
		duration := te.EndTime.Sub(te.StartTime)
		te.Hours = duration.Hours()
	}

	q := `INSERT INTO time_entries(work_order_id,maintainer_id,start_time,end_time,hours,description,status)
		OUTPUT INSERTED.id
		VALUES(@woid,@mid,@start,@end,@hours,@desc,'pending')`
	return r.db.QueryRow(q,
		sql.Named("woid", te.WorkOrderID),
		sql.Named("mid", te.MaintainerID),
		sql.Named("start", te.StartTime),
		sql.Named("end", te.EndTime),
		sql.Named("hours", te.Hours),
		sql.Named("desc", te.Description),
	).Scan(&te.ID)
}

func (r *timeEntryRepository) Update(te *models.TimeEntry) error {
	if te.EndTime != nil {
		duration := te.EndTime.Sub(te.StartTime)
		te.Hours = duration.Hours()
	}
	_, err := r.db.Exec(`UPDATE time_entries SET start_time=@start,end_time=@end,hours=@hours,description=@desc,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("start", te.StartTime),
		sql.Named("end", te.EndTime),
		sql.Named("hours", te.Hours),
		sql.Named("desc", te.Description),
		sql.Named("id", te.ID),
	)
	return err
}

func (r *timeEntryRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM time_entries WHERE id=@id`, sql.Named("id", id))
	return err
}

func (r *timeEntryRepository) Approve(id int64, approvedBy int64) error {
	now := time.Now()
	_, err := r.db.Exec(`UPDATE time_entries SET status='approved',approved_by=@by,approved_at=@at,updated_at=GETDATE() WHERE id=@id`,
		sql.Named("by", approvedBy),
		sql.Named("at", now),
		sql.Named("id", id),
	)
	return err
}

func (r *timeEntryRepository) Reject(id int64) error {
	_, err := r.db.Exec(`UPDATE time_entries SET status='rejected',updated_at=GETDATE() WHERE id=@id`, sql.Named("id", id))
	return err
}

func (r *timeEntryRepository) GetTotalHoursByWorkOrder(workOrderID int64) (float64, error) {
	var total float64
	err := r.db.QueryRow(`SELECT ISNULL(SUM(hours),0) FROM time_entries WHERE work_order_id=@woid AND status='approved'`,
		sql.Named("woid", workOrderID)).Scan(&total)
	return total, err
}
