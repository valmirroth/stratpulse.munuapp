package services

import (
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"
)

type AssetService interface {
	GetTree() ([]*models.Asset, error)
	GetByID(id int64) (*models.Asset, error)
	Create(req *models.CreateAssetRequest) (*models.Asset, error)
	Update(id int64, req *models.UpdateAssetRequest) (*models.Asset, error)
	Delete(id int64) error
}

type assetService struct{ repo repo.AssetRepository }

func NewAssetService(r repo.AssetRepository) AssetService { return &assetService{repo: r} }

func buildAssetTree(assets []*models.Asset) []*models.Asset {
	m := make(map[int64]*models.Asset, len(assets))
	for _, a := range assets {
		m[a.ID] = a
	}
	var roots []*models.Asset
	for _, a := range assets {
		if a.ParentID == nil {
			roots = append(roots, a)
		} else if parent, ok := m[*a.ParentID]; ok {
			parent.Children = append(parent.Children, a)
		}
	}
	return roots
}

func (s *assetService) GetTree() ([]*models.Asset, error) {
	all, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	return buildAssetTree(all), nil
}

func (s *assetService) GetByID(id int64) (*models.Asset, error) { return s.repo.GetByID(id) }

func (s *assetService) Create(req *models.CreateAssetRequest) (*models.Asset, error) {
	if req.Code == "" || req.Name == "" {
		return nil, fmt.Errorf("código e nome são obrigatórios")
	}
	level := 1
	if req.ParentID != nil {
		parent, err := s.repo.GetByID(*req.ParentID)
		if err != nil {
			return nil, fmt.Errorf("ativo pai não encontrado")
		}
		level = parent.Level + 1
		if level > 15 {
			return nil, fmt.Errorf("nível máximo de hierarquia (15) atingido")
		}
	}
	a := &models.Asset{
		ParentID: req.ParentID, Code: req.Code, Name: req.Name,
		Description: req.Description, Type: req.Type, Level: level, Active: true,
	}
	if err := s.repo.Create(a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *assetService) Update(id int64, req *models.UpdateAssetRequest) (*models.Asset, error) {
	a, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	a.Code = req.Code
	a.Name = req.Name
	a.Description = req.Description
	a.Type = req.Type
	a.Active = req.Active
	if err := s.repo.Update(a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *assetService) Delete(id int64) error { return s.repo.Delete(id) }
