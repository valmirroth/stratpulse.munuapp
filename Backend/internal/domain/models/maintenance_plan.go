package models

import "time"

type FrequencyType string
type Priority string

const (
	FrequencyDaily   FrequencyType = "daily"
	FrequencyWeekly  FrequencyType = "weekly"
	FrequencyMonthly FrequencyType = "monthly"
	FrequencyHours   FrequencyType = "hours"

	PriorityLow      Priority = "low"
	PriorityMedium   Priority = "medium"
	PriorityHigh     Priority = "high"
	PriorityCritical Priority = "critical"
)

type MaintenancePlanTask struct {
	ID               int64  `json:"id"`
	PlanID           int64  `json:"plan_id"`
	Sequence         int    `json:"sequence"`
	Description      string `json:"description"`
	EstimatedMinutes int    `json:"estimated_minutes"`
}

type MaintenancePlan struct {
	ID             int64                 `json:"id"`
	AssetID        int64                 `json:"asset_id"`
	AssetName      string                `json:"asset_name,omitempty"`
	AccountID      *int64                `json:"account_id"`
	Code           string                `json:"code"`
	Name           string                `json:"name"`
	Description    string                `json:"description"`
	FrequencyType  FrequencyType         `json:"frequency_type"`
	FrequencyValue int                   `json:"frequency_value"`
	EstimatedHours float64               `json:"estimated_hours"`
	Priority       Priority              `json:"priority"`
	Active         bool                  `json:"active"`
	Tasks          []MaintenancePlanTask `json:"tasks,omitempty"`
	CreatedAt      time.Time             `json:"created_at"`
	UpdatedAt      time.Time             `json:"updated_at"`
}

type CreateMaintenancePlanRequest struct {
	AssetID        int64         `json:"asset_id"`
	AccountID      *int64        `json:"account_id"`
	Code           string        `json:"code"`
	Name           string        `json:"name"`
	Description    string        `json:"description"`
	FrequencyType  FrequencyType `json:"frequency_type"`
	FrequencyValue int           `json:"frequency_value"`
	EstimatedHours float64       `json:"estimated_hours"`
	Priority       Priority      `json:"priority"`
}

type UpdateMaintenancePlanRequest struct {
	AssetID        int64         `json:"asset_id"`
	AccountID      *int64        `json:"account_id"`
	Code           string        `json:"code"`
	Name           string        `json:"name"`
	Description    string        `json:"description"`
	FrequencyType  FrequencyType `json:"frequency_type"`
	FrequencyValue int           `json:"frequency_value"`
	EstimatedHours float64       `json:"estimated_hours"`
	Priority       Priority      `json:"priority"`
	Active         bool          `json:"active"`
}

type CreateTaskRequest struct {
	Sequence         int    `json:"sequence"`
	Description      string `json:"description"`
	EstimatedMinutes int    `json:"estimated_minutes"`
}
