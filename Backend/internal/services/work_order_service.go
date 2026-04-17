package services

import (
	"fmt"
	"time"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type WorkOrderService interface {
	GetAll(filters repo.WorkOrderFilters) ([]*models.WorkOrder, error)
	GetByID(id int64) (*models.WorkOrder, error)
	Create(createdBy int64, req *models.CreateWorkOrderRequest) (*models.WorkOrder, error)
	Update(id int64, req *models.UpdateWorkOrderRequest) (*models.WorkOrder, error)
	UpdateStatus(id int64, req *models.UpdateWorkOrderStatusRequest) error
	Delete(id int64) error
	AssignMaintainer(workOrderID int64, req *models.AssignMaintainerRequest) error
	RemoveMaintainer(workOrderID, maintainerID int64) error
	GetMaintainers(workOrderID int64) ([]models.Maintainer, error)
	CountByStatus() (map[string]int, error)
}

type workOrderService struct{ repo repo.WorkOrderRepository }

func NewWorkOrderService(r repo.WorkOrderRepository) WorkOrderService {
	return &workOrderService{repo: r}
}

func (s *workOrderService) GetAll(filters repo.WorkOrderFilters) ([]*models.WorkOrder, error) {
	return s.repo.GetAll(filters)
}

func (s *workOrderService) GetByID(id int64) (*models.WorkOrder, error) {
	return s.repo.GetByID(id)
}

func (s *workOrderService) Create(createdBy int64, req *models.CreateWorkOrderRequest) (*models.WorkOrder, error) {
	if req.AssetID == 0 {
		return nil, fmt.Errorf("ativo é obrigatório")
	}
	if req.Description == "" {
		return nil, fmt.Errorf("descrição é obrigatória")
	}
	priority := req.Priority
	if priority == "" {
		priority = models.PriorityMedium
	}

	// Gerar código único baseado em timestamp
	code := fmt.Sprintf("OS-%s", time.Now().Format("20060102-150405"))

	wo := &models.WorkOrder{
		Code:           code,
		AssetID:        req.AssetID,
		PlanID:         req.PlanID,
		AccountID:      req.AccountID,
		Type:           req.Type,
		Priority:       priority,
		Status:         models.WorkOrderStatusOpen,
		RequestedDate:  time.Now(),
		ScheduledDate:  req.ScheduledDate,
		Description:    req.Description,
		EstimatedHours: req.EstimatedHours,
		CreatedBy:      createdBy,
	}
	if err := s.repo.Create(wo); err != nil {
		return nil, err
	}
	return wo, nil
}

func (s *workOrderService) Update(id int64, req *models.UpdateWorkOrderRequest) (*models.WorkOrder, error) {
	wo, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	wo.AssetID = req.AssetID
	wo.PlanID = req.PlanID
	wo.AccountID = req.AccountID
	wo.Type = req.Type
	wo.Priority = req.Priority
	wo.Status = req.Status
	wo.ScheduledDate = req.ScheduledDate
	wo.Description = req.Description
	wo.Observations = req.Observations
	wo.EstimatedHours = req.EstimatedHours
	if err := s.repo.Update(wo); err != nil {
		return nil, err
	}
	return wo, nil
}

func (s *workOrderService) UpdateStatus(id int64, req *models.UpdateWorkOrderStatusRequest) error {
	validTransitions := map[models.WorkOrderStatus][]models.WorkOrderStatus{
		models.WorkOrderStatusOpen:       {models.WorkOrderStatusInProgress, models.WorkOrderStatusCancelled},
		models.WorkOrderStatusInProgress: {models.WorkOrderStatusCompleted, models.WorkOrderStatusCancelled},
		models.WorkOrderStatusCompleted:  {},
		models.WorkOrderStatusCancelled:  {},
	}

	wo, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	allowed := validTransitions[wo.Status]
	valid := false
	for _, s := range allowed {
		if s == req.Status {
			valid = true
			break
		}
	}
	if !valid {
		return fmt.Errorf("transição de status inválida: %s -> %s", wo.Status, req.Status)
	}

	return s.repo.UpdateStatus(id, req.Status, req.Observations)
}

func (s *workOrderService) Delete(id int64) error { return s.repo.Delete(id) }

func (s *workOrderService) AssignMaintainer(workOrderID int64, req *models.AssignMaintainerRequest) error {
	if req.MaintainerID == 0 {
		return fmt.Errorf("manutentor é obrigatório")
	}
	return s.repo.AssignMaintainer(workOrderID, req.MaintainerID)
}

func (s *workOrderService) RemoveMaintainer(workOrderID, maintainerID int64) error {
	return s.repo.RemoveMaintainer(workOrderID, maintainerID)
}

func (s *workOrderService) GetMaintainers(workOrderID int64) ([]models.Maintainer, error) {
	return s.repo.GetMaintainers(workOrderID)
}

func (s *workOrderService) CountByStatus() (map[string]int, error) {
	return s.repo.CountByStatus()
}
