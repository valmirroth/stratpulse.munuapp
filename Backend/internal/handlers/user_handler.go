package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/services"
	"net/http"
)

type UserHandler struct{ svc services.UserService }

func NewUserHandler(s services.UserService) *UserHandler { return &UserHandler{svc: s} }

func (h *UserHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if users == nil {
		users = []*models.User{}
	}
	respondJSON(w, http.StatusOK, users)
}

func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	u, err := h.svc.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, u)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	u, err := h.svc.Create(&req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, u)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateUserRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	u, err := h.svc.Update(id, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, u)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "usuário removido"})
}
