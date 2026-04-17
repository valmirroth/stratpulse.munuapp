package handlers

import (
	"database/sql"
	"net/http"
)

type DashboardHandler struct{ db *sql.DB }

func NewDashboardHandler(db *sql.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

type DashboardStats struct {
	WorkOrders    WorkOrderStats   `json:"work_orders"`
	TimeEntries   TimeEntryStats   `json:"time_entries"`
	Assets        int              `json:"assets_total"`
	Maintainers   int              `json:"maintainers_active"`
	RecentOrders  []RecentOrder    `json:"recent_orders"`
	TopMaintainers []TopMaintainer `json:"top_maintainers"`
	MonthlyHours  []MonthlyHour    `json:"monthly_hours"`
}

type WorkOrderStats struct {
	Open       int `json:"open"`
	InProgress int `json:"in_progress"`
	Completed  int `json:"completed"`
	Cancelled  int `json:"cancelled"`
	Total      int `json:"total"`
}

type TimeEntryStats struct {
	Pending  int     `json:"pending"`
	Approved int     `json:"approved"`
	Rejected int     `json:"rejected"`
	TotalH   float64 `json:"total_hours"`
}

type RecentOrder struct {
	ID        int64  `json:"id"`
	Code      string `json:"code"`
	AssetName string `json:"asset_name"`
	Type      string `json:"type"`
	Priority  string `json:"priority"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type TopMaintainer struct {
	Name  string  `json:"name"`
	Hours float64 `json:"hours"`
	Orders int    `json:"orders"`
}

type MonthlyHour struct {
	Month string  `json:"month"`
	Hours float64 `json:"hours"`
}

func (h *DashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats := DashboardStats{}

	// Work orders por status
	rows, err := h.db.Query(`SELECT status, COUNT(*) FROM work_orders GROUP BY status`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var status string
			var cnt int
			rows.Scan(&status, &cnt)
			switch status {
			case "open":
				stats.WorkOrders.Open = cnt
			case "in_progress":
				stats.WorkOrders.InProgress = cnt
			case "completed":
				stats.WorkOrders.Completed = cnt
			case "cancelled":
				stats.WorkOrders.Cancelled = cnt
			}
		}
	}
	stats.WorkOrders.Total = stats.WorkOrders.Open + stats.WorkOrders.InProgress +
		stats.WorkOrders.Completed + stats.WorkOrders.Cancelled

	// Time entries stats
	h.db.QueryRow(`
		SELECT
			SUM(CASE WHEN status='pending'  THEN 1 ELSE 0 END),
			SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),
			SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END),
			ISNULL(SUM(CASE WHEN status='approved' THEN hours ELSE 0 END),0)
		FROM time_entries`).Scan(
		&stats.TimeEntries.Pending,
		&stats.TimeEntries.Approved,
		&stats.TimeEntries.Rejected,
		&stats.TimeEntries.TotalH,
	)

	// Ativos ativos
	h.db.QueryRow(`SELECT COUNT(*) FROM assets WHERE active=1`).Scan(&stats.Assets)

	// Manutentores ativos
	h.db.QueryRow(`SELECT COUNT(*) FROM maintainers WHERE active=1`).Scan(&stats.Maintainers)

	// OSs recentes
	recentRows, err := h.db.Query(`
		SELECT TOP 8
			wo.id, wo.code, ISNULL(a.name,'') as asset_name,
			wo.type, wo.priority, wo.status,
			FORMAT(wo.created_at, 'yyyy-MM-ddTHH:mm:ss') as created_at
		FROM work_orders wo
		LEFT JOIN assets a ON a.id = wo.asset_id
		ORDER BY wo.created_at DESC`)
	if err == nil {
		defer recentRows.Close()
		for recentRows.Next() {
			ro := RecentOrder{}
			recentRows.Scan(&ro.ID, &ro.Code, &ro.AssetName, &ro.Type, &ro.Priority, &ro.Status, &ro.CreatedAt)
			stats.RecentOrders = append(stats.RecentOrders, ro)
		}
	}
	if stats.RecentOrders == nil {
		stats.RecentOrders = []RecentOrder{}
	}

	// Top manutentores por horas aprovadas
	topRows, err := h.db.Query(`
		SELECT TOP 5
			m.name,
			ISNULL(SUM(te.hours),0) as total_hours,
			COUNT(DISTINCT te.work_order_id) as total_orders
		FROM maintainers m
		LEFT JOIN time_entries te ON te.maintainer_id = m.id AND te.status = 'approved'
		WHERE m.active = 1
		GROUP BY m.id, m.name
		ORDER BY total_hours DESC`)
	if err == nil {
		defer topRows.Close()
		for topRows.Next() {
			tm := TopMaintainer{}
			topRows.Scan(&tm.Name, &tm.Hours, &tm.Orders)
			stats.TopMaintainers = append(stats.TopMaintainers, tm)
		}
	}
	if stats.TopMaintainers == nil {
		stats.TopMaintainers = []TopMaintainer{}
	}

	// Horas por mês (últimos 6 meses)
	monthRows, err := h.db.Query(`
		SELECT TOP 6
			FORMAT(start_time, 'yyyy-MM') as month,
			ISNULL(SUM(hours), 0) as total_hours
		FROM time_entries
		WHERE status = 'approved'
			AND start_time >= DATEADD(MONTH, -6, GETDATE())
		GROUP BY FORMAT(start_time, 'yyyy-MM')
		ORDER BY month ASC`)
	if err == nil {
		defer monthRows.Close()
		for monthRows.Next() {
			mh := MonthlyHour{}
			monthRows.Scan(&mh.Month, &mh.Hours)
			stats.MonthlyHours = append(stats.MonthlyHours, mh)
		}
	}
	if stats.MonthlyHours == nil {
		stats.MonthlyHours = []MonthlyHour{}
	}

	respondJSON(w, http.StatusOK, stats)
}
