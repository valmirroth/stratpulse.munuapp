package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/services"
	"net/http"
)

type MaintainerHandler struct{ svc services.MaintainerService }

func NewMaintainerHandler(s services.MaintainerService) *MaintainerHandler {
	return &MaintainerHandler{svc: s}
}

func (h *MaintainerHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if list == nil {
		list = []*models.Maintainer{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *MaintainerHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	m, err := h.svc.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, m)
}

func (h *MaintainerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMaintainerRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	m, err := h.svc.Create(&req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, m)
}

func (h *MaintainerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateMaintainerRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	m, err := h.svc.Update(id, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, m)
}

func (h *MaintainerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "manutentor removido"})
}
