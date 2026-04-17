package models

import "time"

type AssetType string

const (
	AssetTypePlant     AssetType = "plant"
	AssetTypeArea      AssetType = "area"
	AssetTypeSystem    AssetType = "system"
	AssetTypeSubSystem AssetType = "subsystem"
	AssetTypeEquipment AssetType = "equipment"
	AssetTypeComponent AssetType = "component"
)

type Asset struct {
	ID          int64     `json:"id"`
	ParentID    *int64    `json:"parent_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        AssetType `json:"type"`
	Level       int       `json:"level"`
	Active      bool      `json:"active"`
	Children    []*Asset  `json:"children,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateAssetRequest struct {
	ParentID    *int64    `json:"parent_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        AssetType `json:"type"`
}

type UpdateAssetRequest struct {
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        AssetType `json:"type"`
	Active      bool      `json:"active"`
}
