package services

import (
	"fmt"

	"manuind/internal/domain/models"
	repo "manuind/internal/domain/repositories"

	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	GetAll() ([]*models.User, error)
	GetByID(id int64) (*models.User, error)
	Create(req *models.CreateUserRequest) (*models.User, error)
	Update(id int64, req *models.UpdateUserRequest) (*models.User, error)
	Delete(id int64) error
}

type userService struct{ repo repo.UserRepository }

func NewUserService(r repo.UserRepository) UserService { return &userService{repo: r} }

func (s *userService) GetAll() ([]*models.User, error)           { return s.repo.GetAll() }
func (s *userService) GetByID(id int64) (*models.User, error)    { return s.repo.GetByID(id) }

func (s *userService) Create(req *models.CreateUserRequest) (*models.User, error) {
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return nil, fmt.Errorf("nome, email e senha são obrigatórios")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	role := req.Role
	if role == "" {
		role = models.RoleMaintainer
	}
	u := &models.User{Name: req.Name, Email: req.Email, PasswordHash: string(hash), Role: role, Active: true}
	if err := s.repo.Create(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *userService) Update(id int64, req *models.UpdateUserRequest) (*models.User, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	u.Name = req.Name
	u.Email = req.Email
	u.Role = req.Role
	u.Active = req.Active
	if err := s.repo.Update(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *userService) Delete(id int64) error { return s.repo.Delete(id) }
