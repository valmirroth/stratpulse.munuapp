package models

import "time"

type WorkOrderType string
type WorkOrderStatus string

const (
	WorkOrderTypePreventive WorkOrderType = "preventive"
	WorkOrderTypeCorrective WorkOrderType = "corrective"
	WorkOrderTypePredictive WorkOrderType = "predictive"

	WorkOrderStatusOpen       WorkOrderStatus = "open"
	WorkOrderStatusInProgress WorkOrderStatus = "in_progress"
	WorkOrderStatusCompleted  WorkOrderStatus = "completed"
	WorkOrderStatusCancelled  WorkOrderStatus = "cancelled"
)

type WorkOrder struct {
	ID             int64           `json:"id"`
	Code           string          `json:"code"`
	AssetID        int64           `json:"asset_id"`
	AssetName      string          `json:"asset_name,omitempty"`
	PlanID         *int64          `json:"plan_id"`
	AccountID      *int64          `json:"account_id"`
	Type           WorkOrderType   `json:"type"`
	Priority       Priority        `json:"priority"`
	Status         WorkOrderStatus `json:"status"`
	RequestedDate  time.Time       `json:"requested_date"`
	ScheduledDate  *time.Time      `json:"scheduled_date"`
	StartedDate    *time.Time      `json:"started_date"`
	CompletedDate  *time.Time      `json:"completed_date"`
	Description    string          `json:"description"`
	Observations   string          `json:"observations"`
	EstimatedHours float64         `json:"estimated_hours"`
	ActualHours    float64         `json:"actual_hours"`
	TotalCost      float64         `json:"total_cost"`
	CreatedBy      int64           `json:"created_by"`
	CreatedByName  string          `json:"created_by_name,omitempty"`
	Maintainers    []Maintainer    `json:"maintainers,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type CreateWorkOrderRequest struct {
	AssetID        int64          `json:"asset_id"`
	PlanID         *int64         `json:"plan_id"`
	AccountID      *int64         `json:"account_id"`
	Type           WorkOrderType  `json:"type"`
	Priority       Priority       `json:"priority"`
	ScheduledDate  *time.Time     `json:"scheduled_date"`
	Description    string         `json:"description"`
	EstimatedHours float64        `json:"estimated_hours"`
}

type UpdateWorkOrderRequest struct {
	AssetID        int64           `json:"asset_id"`
	PlanID         *int64          `json:"plan_id"`
	AccountID      *int64          `json:"account_id"`
	Type           WorkOrderType   `json:"type"`
	Priority       Priority        `json:"priority"`
	Status         WorkOrderStatus `json:"status"`
	ScheduledDate  *time.Time      `json:"scheduled_date"`
	Description    string          `json:"description"`
	Observations   string          `json:"observations"`
	EstimatedHours float64         `json:"estimated_hours"`
}

type UpdateWorkOrderStatusRequest struct {
	Status       WorkOrderStatus `json:"status"`
	Observations string          `json:"observations"`
}

type AssignMaintainerRequest struct {
	MaintainerID int64 `json:"maintainer_id"`
}
