package services

import (
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type AccountService interface {
	GetTree() ([]*models.Account, error)
	GetAll() ([]*models.Account, error)
	GetByID(id int64) (*models.Account, error)
	Create(req *models.CreateAccountRequest) (*models.Account, error)
	Update(id int64, req *models.UpdateAccountRequest) (*models.Account, error)
	Delete(id int64) error
}

type accountService struct{ repo repo.AccountRepository }

func NewAccountService(r repo.AccountRepository) AccountService { return &accountService{repo: r} }

func buildAccountTree(accounts []*models.Account) []*models.Account {
	m := make(map[int64]*models.Account, len(accounts))
	for _, a := range accounts {
		m[a.ID] = a
	}
	var roots []*models.Account
	for _, a := range accounts {
		if a.ParentID == nil {
			roots = append(roots, a)
		} else if parent, ok := m[*a.ParentID]; ok {
			parent.Children = append(parent.Children, a)
		}
	}
	return roots
}

func (s *accountService) GetTree() ([]*models.Account, error) {
	all, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	return buildAccountTree(all), nil
}

func (s *accountService) GetAll() ([]*models.Account, error)          { return s.repo.GetAll() }
func (s *accountService) GetByID(id int64) (*models.Account, error)   { return s.repo.GetByID(id) }

func (s *accountService) Create(req *models.CreateAccountRequest) (*models.Account, error) {
	if req.Code == "" || req.Name == "" {
		return nil, fmt.Errorf("código e nome são obrigatórios")
	}
	level := 1
	if req.ParentID != nil {
		parent, err := s.repo.GetByID(*req.ParentID)
		if err != nil {
			return nil, fmt.Errorf("conta pai não encontrada")
		}
		level = parent.Level + 1
	}
	a := &models.Account{
		ParentID: req.ParentID, Code: req.Code, Name: req.Name,
		Type: req.Type, Nature: req.Nature, Level: level, Active: true,
	}
	if err := s.repo.Create(a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *accountService) Update(id int64, req *models.UpdateAccountRequest) (*models.Account, error) {
	a, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	a.Code = req.Code
	a.Name = req.Name
	a.Type = req.Type
	a.Nature = req.Nature
	a.Active = req.Active
	if err := s.repo.Update(a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *accountService) Delete(id int64) error { return s.repo.Delete(id) }
