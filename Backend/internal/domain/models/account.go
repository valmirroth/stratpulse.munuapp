package models

import "time"

type AccountType string
type AccountNature string

const (
	AccountTypeSynthetic  AccountType = "synthetic"
	AccountTypeAnalytical AccountType = "analytical"

	AccountNatureDebit  AccountNature = "debit"
	AccountNatureCredit AccountNature = "credit"
)

type Account struct {
	ID        int64         `json:"id"`
	ParentID  *int64        `json:"parent_id"`
	Code      string        `json:"code"`
	Name      string        `json:"name"`
	Type      AccountType   `json:"type"`
	Nature    AccountNature `json:"nature"`
	Level     int           `json:"level"`
	Active    bool          `json:"active"`
	Children  []*Account    `json:"children,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type CreateAccountRequest struct {
	ParentID *int64        `json:"parent_id"`
	Code     string        `json:"code"`
	Name     string        `json:"name"`
	Type     AccountType   `json:"type"`
	Nature   AccountNature `json:"nature"`
}

type UpdateAccountRequest struct {
	Code   string        `json:"code"`
	Name   string        `json:"name"`
	Type   AccountType   `json:"type"`
	Nature AccountNature `json:"nature"`
	Active bool          `json:"active"`
}
