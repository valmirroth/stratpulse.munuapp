package services

import (
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type MaintenancePlanService interface {
	GetAll() ([]*models.MaintenancePlan, error)
	GetByID(id int64) (*models.MaintenancePlan, error)
	GetByAsset(assetID int64) ([]*models.MaintenancePlan, error)
	Create(req *models.CreateMaintenancePlanRequest) (*models.MaintenancePlan, error)
	Update(id int64, req *models.UpdateMaintenancePlanRequest) (*models.MaintenancePlan, error)
	Delete(id int64) error
	GetTasks(planID int64) ([]models.MaintenancePlanTask, error)
	CreateTask(planID int64, req *models.CreateTaskRequest) (*models.MaintenancePlanTask, error)
	UpdateTask(planID, taskID int64, req *models.CreateTaskRequest) (*models.MaintenancePlanTask, error)
	DeleteTask(taskID int64) error
}

type maintenancePlanService struct{ repo repo.MaintenancePlanRepository }

func NewMaintenancePlanService(r repo.MaintenancePlanRepository) MaintenancePlanService {
	return &maintenancePlanService{repo: r}
}

func (s *maintenancePlanService) GetAll() ([]*models.MaintenancePlan, error) { return s.repo.GetAll() }

func (s *maintenancePlanService) GetByID(id int64) (*models.MaintenancePlan, error) {
	return s.repo.GetByID(id)
}

func (s *maintenancePlanService) GetByAsset(assetID int64) ([]*models.MaintenancePlan, error) {
	return s.repo.GetByAsset(assetID)
}

func (s *maintenancePlanService) Create(req *models.CreateMaintenancePlanRequest) (*models.MaintenancePlan, error) {
	if req.Code == "" || req.Name == "" {
		return nil, fmt.Errorf("código e nome são obrigatórios")
	}
	if req.AssetID == 0 {
		return nil, fmt.Errorf("ativo é obrigatório")
	}
	if req.FrequencyValue <= 0 {
		req.FrequencyValue = 1
	}
	priority := req.Priority
	if priority == "" {
		priority = models.PriorityMedium
	}
	p := &models.MaintenancePlan{
		AssetID:        req.AssetID,
		AccountID:      req.AccountID,
		Code:           req.Code,
		Name:           req.Name,
		Description:    req.Description,
		FrequencyType:  req.FrequencyType,
		FrequencyValue: req.FrequencyValue,
		EstimatedHours: req.EstimatedHours,
		Priority:       priority,
		Active:         true,
	}
	if err := s.repo.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *maintenancePlanService) Update(id int64, req *models.UpdateMaintenancePlanRequest) (*models.MaintenancePlan, error) {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	p.AssetID = req.AssetID
	p.AccountID = req.AccountID
	p.Code = req.Code
	p.Name = req.Name
	p.Description = req.Description
	p.FrequencyType = req.FrequencyType
	p.FrequencyValue = req.FrequencyValue
	p.EstimatedHours = req.EstimatedHours
	p.Priority = req.Priority
	p.Active = req.Active
	if err := s.repo.Update(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *maintenancePlanService) Delete(id int64) error { return s.repo.Delete(id) }

func (s *maintenancePlanService) GetTasks(planID int64) ([]models.MaintenancePlanTask, error) {
	return s.repo.GetTasks(planID)
}

func (s *maintenancePlanService) CreateTask(planID int64, req *models.CreateTaskRequest) (*models.MaintenancePlanTask, error) {
	if req.Description == "" {
		return nil, fmt.Errorf("descrição é obrigatória")
	}
	t := &models.MaintenancePlanTask{
		PlanID:           planID,
		Sequence:         req.Sequence,
		Description:      req.Description,
		EstimatedMinutes: req.EstimatedMinutes,
	}
	if err := s.repo.CreateTask(t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *maintenancePlanService) UpdateTask(planID, taskID int64, req *models.CreateTaskRequest) (*models.MaintenancePlanTask, error) {
	t := &models.MaintenancePlanTask{
		ID:               taskID,
		PlanID:           planID,
		Sequence:         req.Sequence,
		Description:      req.Description,
		EstimatedMinutes: req.EstimatedMinutes,
	}
	if err := s.repo.UpdateTask(t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *maintenancePlanService) DeleteTask(taskID int64) error {
	return s.repo.DeleteTask(taskID)
}
