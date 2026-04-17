package services

import (
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type TimeEntryService interface {
	GetAll(filters repo.TimeEntryFilters) ([]*models.TimeEntry, error)
	GetByID(id int64) (*models.TimeEntry, error)
	GetByWorkOrder(workOrderID int64) ([]*models.TimeEntry, error)
	Create(req *models.CreateTimeEntryRequest) (*models.TimeEntry, error)
	Update(id int64, req *models.UpdateTimeEntryRequest) (*models.TimeEntry, error)
	Delete(id int64) error
	Approve(id int64, approvedBy int64) error
	Reject(id int64) error
}

type timeEntryService struct {
	repo   repo.TimeEntryRepository
	woRepo repo.WorkOrderRepository
}

func NewTimeEntryService(r repo.TimeEntryRepository, wo repo.WorkOrderRepository) TimeEntryService {
	return &timeEntryService{repo: r, woRepo: wo}
}

func (s *timeEntryService) GetAll(filters repo.TimeEntryFilters) ([]*models.TimeEntry, error) {
	return s.repo.GetAll(filters)
}

func (s *timeEntryService) GetByID(id int64) (*models.TimeEntry, error) {
	return s.repo.GetByID(id)
}

func (s *timeEntryService) GetByWorkOrder(workOrderID int64) ([]*models.TimeEntry, error) {
	return s.repo.GetByWorkOrder(workOrderID)
}

func (s *timeEntryService) Create(req *models.CreateTimeEntryRequest) (*models.TimeEntry, error) {
	if req.WorkOrderID == 0 {
		return nil, fmt.Errorf("ordem de serviço é obrigatória")
	}
	if req.MaintainerID == 0 {
		return nil, fmt.Errorf("manutentor é obrigatório")
	}
	if req.EndTime != nil && req.EndTime.Before(req.StartTime) {
		return nil, fmt.Errorf("data de término deve ser após a data de início")
	}

	te := &models.TimeEntry{
		WorkOrderID:  req.WorkOrderID,
		MaintainerID: req.MaintainerID,
		StartTime:    req.StartTime,
		EndTime:      req.EndTime,
		Description:  req.Description,
		Status:       models.TimeEntryStatusPending,
	}
	if err := s.repo.Create(te); err != nil {
		return nil, err
	}
	return te, nil
}

func (s *timeEntryService) Update(id int64, req *models.UpdateTimeEntryRequest) (*models.TimeEntry, error) {
	te, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if te.Status != models.TimeEntryStatusPending {
		return nil, fmt.Errorf("apenas lançamentos pendentes podem ser editados")
	}
	if req.EndTime != nil && req.EndTime.Before(req.StartTime) {
		return nil, fmt.Errorf("data de término deve ser após a data de início")
	}
	te.StartTime = req.StartTime
	te.EndTime = req.EndTime
	te.Description = req.Description
	if err := s.repo.Update(te); err != nil {
		return nil, err
	}
	return te, nil
}

func (s *timeEntryService) Delete(id int64) error {
	te, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if te.Status == models.TimeEntryStatusApproved {
		return fmt.Errorf("lançamentos aprovados não podem ser excluídos")
	}
	return s.repo.Delete(id)
}

func (s *timeEntryService) Approve(id int64, approvedBy int64) error {
	te, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if te.Status != models.TimeEntryStatusPending {
		return fmt.Errorf("apenas lançamentos pendentes podem ser aprovados")
	}
	if err := s.repo.Approve(id, approvedBy); err != nil {
		return err
	}
	// Atualizar horas reais na OS
	total, _ := s.repo.GetTotalHoursByWorkOrder(te.WorkOrderID)
	s.woRepo.UpdateStatus(te.WorkOrderID, models.WorkOrderStatusInProgress, "")
	_ = total
	return nil
}

func (s *timeEntryService) Reject(id int64) error {
	te, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if te.Status != models.TimeEntryStatusPending {
		return fmt.Errorf("apenas lançamentos pendentes podem ser rejeitados")
	}
	return s.repo.Reject(id)
}
