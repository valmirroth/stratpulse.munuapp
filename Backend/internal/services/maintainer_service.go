package services

import (
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type MaintainerService interface {
	GetAll() ([]*models.Maintainer, error)
	GetActive() ([]*models.Maintainer, error)
	GetByID(id int64) (*models.Maintainer, error)
	Create(req *models.CreateMaintainerRequest) (*models.Maintainer, error)
	Update(id int64, req *models.UpdateMaintainerRequest) (*models.Maintainer, error)
	Delete(id int64) error
}

type maintainerService struct{ repo repo.MaintainerRepository }

func NewMaintainerService(r repo.MaintainerRepository) MaintainerService {
	return &maintainerService{repo: r}
}

func (s *maintainerService) GetAll() ([]*models.Maintainer, error)        { return s.repo.GetAll() }
func (s *maintainerService) GetActive() ([]*models.Maintainer, error)     { return s.repo.GetActive() }
func (s *maintainerService) GetByID(id int64) (*models.Maintainer, error) { return s.repo.GetByID(id) }

func (s *maintainerService) Create(req *models.CreateMaintainerRequest) (*models.Maintainer, error) {
	if req.Name == "" || req.Registration == "" {
		return nil, fmt.Errorf("nome e matrícula são obrigatórios")
	}
	m := &models.Maintainer{
		UserID: req.UserID, Name: req.Name, Registration: req.Registration,
		Specialty: req.Specialty, Phone: req.Phone, Email: req.Email,
		HourlyRate: req.HourlyRate, Active: true,
	}
	if err := s.repo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *maintainerService) Update(id int64, req *models.UpdateMaintainerRequest) (*models.Maintainer, error) {
	m, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	m.Name = req.Name
	m.Registration = req.Registration
	m.Specialty = req.Specialty
	m.Phone = req.Phone
	m.Email = req.Email
	m.HourlyRate = req.HourlyRate
	m.Active = req.Active
	if err := s.repo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *maintainerService) Delete(id int64) error { return s.repo.Delete(id) }
