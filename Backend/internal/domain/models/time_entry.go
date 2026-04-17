package models

import "time"

type TimeEntryStatus string

const (
	TimeEntryStatusPending  TimeEntryStatus = "pending"
	TimeEntryStatusApproved TimeEntryStatus = "approved"
	TimeEntryStatusRejected TimeEntryStatus = "rejected"
)

type TimeEntry struct {
	ID             int64           `json:"id"`
	WorkOrderID    int64           `json:"work_order_id"`
	WorkOrderCode  string          `json:"work_order_code,omitempty"`
	MaintainerID   int64           `json:"maintainer_id"`
	MaintainerName string          `json:"maintainer_name,omitempty"`
	StartTime      time.Time       `json:"start_time"`
	EndTime        *time.Time      `json:"end_time"`
	Hours          float64         `json:"hours"`
	Description    string          `json:"description"`
	Status         TimeEntryStatus `json:"status"`
	ApprovedBy     *int64          `json:"approved_by"`
	ApprovedAt     *time.Time      `json:"approved_at"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type CreateTimeEntryRequest struct {
	WorkOrderID  int64      `json:"work_order_id"`
	MaintainerID int64      `json:"maintainer_id"`
	StartTime    time.Time  `json:"start_time"`
	EndTime      *time.Time `json:"end_time"`
	Description  string     `json:"description"`
}

type UpdateTimeEntryRequest struct {
	StartTime   time.Time  `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Description string     `json:"description"`
}
