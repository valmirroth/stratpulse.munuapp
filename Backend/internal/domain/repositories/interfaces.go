package repositories

import "manuind/internal/domain/models"

type UserRepository interface {
	GetByID(id int64) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetAll() ([]*models.User, error)
	Create(user *models.User) error
	Update(user *models.User) error
	UpdatePassword(id int64, passwordHash string) error
	Delete(id int64) error
}

type AssetRepository interface {
	GetByID(id int64) (*models.Asset, error)
	GetAll() ([]*models.Asset, error)
	Create(asset *models.Asset) error
	Update(asset *models.Asset) error
	Delete(id int64) error
}

type AccountRepository interface {
	GetByID(id int64) (*models.Account, error)
	GetAll() ([]*models.Account, error)
	Create(account *models.Account) error
	Update(account *models.Account) error
	Delete(id int64) error
}

type MaintainerRepository interface {
	GetByID(id int64) (*models.Maintainer, error)
	GetAll() ([]*models.Maintainer, error)
	GetActive() ([]*models.Maintainer, error)
	Create(m *models.Maintainer) error
	Update(m *models.Maintainer) error
	Delete(id int64) error
}

type MaintenancePlanRepository interface {
	GetByID(id int64) (*models.MaintenancePlan, error)
	GetAll() ([]*models.MaintenancePlan, error)
	GetByAsset(assetID int64) ([]*models.MaintenancePlan, error)
	Create(plan *models.MaintenancePlan) error
	Update(plan *models.MaintenancePlan) error
	Delete(id int64) error
	GetTasks(planID int64) ([]models.MaintenancePlanTask, error)
	CreateTask(task *models.MaintenancePlanTask) error
	UpdateTask(task *models.MaintenancePlanTask) error
	DeleteTask(taskID int64) error
}

type WorkOrderFilters struct {
	Status   string
	Type     string
	AssetID  int64
	Priority string
}

type WorkOrderRepository interface {
	GetByID(id int64) (*models.WorkOrder, error)
	GetAll(filters WorkOrderFilters) ([]*models.WorkOrder, error)
	Create(wo *models.WorkOrder) error
	Update(wo *models.WorkOrder) error
	UpdateStatus(id int64, status models.WorkOrderStatus, observations string) error
	Delete(id int64) error
	AssignMaintainer(workOrderID, maintainerID int64) error
	RemoveMaintainer(workOrderID, maintainerID int64) error
	GetMaintainers(workOrderID int64) ([]models.Maintainer, error)
	CountByStatus() (map[string]int, error)
}

type TimeEntryFilters struct {
	WorkOrderID  int64
	MaintainerID int64
	Status       string
}

type TimeEntryRepository interface {
	GetByID(id int64) (*models.TimeEntry, error)
	GetAll(filters TimeEntryFilters) ([]*models.TimeEntry, error)
	GetByWorkOrder(workOrderID int64) ([]*models.TimeEntry, error)
	Create(entry *models.TimeEntry) error
	Update(entry *models.TimeEntry) error
	Delete(id int64) error
	Approve(id int64, approvedBy int64) error
	Reject(id int64) error
	GetTotalHoursByWorkOrder(workOrderID int64) (float64, error)
}
