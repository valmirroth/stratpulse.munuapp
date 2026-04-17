package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/domain/repositories"
	"manuind/internal/services"
	"manuind/middleware"
	"net/http"
)

type TimeEntryHandler struct{ svc services.TimeEntryService }

func NewTimeEntryHandler(s services.TimeEntryService) *TimeEntryHandler {
	return &TimeEntryHandler{svc: s}
}

func (h *TimeEntryHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filters := repositories.TimeEntryFilters{
		Status: q.Get("status"),
	}
	list, err := h.svc.GetAll(filters)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if list == nil {
		list = []*models.TimeEntry{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *TimeEntryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	te, err := h.svc.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, te)
}

func (h *TimeEntryHandler) GetByWorkOrder(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	list, err := h.svc.GetByWorkOrder(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if list == nil {
		list = []*models.TimeEntry{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *TimeEntryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTimeEntryRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	te, err := h.svc.Create(&req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, te)
}

func (h *TimeEntryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateTimeEntryRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	te, err := h.svc.Update(id, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, te)
}

func (h *TimeEntryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "lançamento removido"})
}

func (h *TimeEntryHandler) Approve(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	approvedBy := middleware.GetUserID(r)
	if err := h.svc.Approve(id, approvedBy); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "lançamento aprovado"})
}

func (h *TimeEntryHandler) Reject(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Reject(id); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "lançamento rejeitado"})
}
