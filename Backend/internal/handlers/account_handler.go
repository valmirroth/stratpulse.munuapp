package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/services"
	"net/http"
)

type AccountHandler struct{ svc services.AccountService }

func NewAccountHandler(s services.AccountService) *AccountHandler { return &AccountHandler{svc: s} }

func (h *AccountHandler) GetTree(w http.ResponseWriter, r *http.Request) {
	tree, err := h.svc.GetTree()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tree == nil {
		tree = []*models.Account{}
	}
	respondJSON(w, http.StatusOK, tree)
}

func (h *AccountHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if list == nil {
		list = []*models.Account{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *AccountHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	a, err := h.svc.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, a)
}

func (h *AccountHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAccountRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	a, err := h.svc.Create(&req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, a)
}

func (h *AccountHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateAccountRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	a, err := h.svc.Update(id, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, a)
}

func (h *AccountHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "conta removida"})
}
