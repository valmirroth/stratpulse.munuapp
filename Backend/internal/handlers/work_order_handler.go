package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/domain/repositories"
	"manuind/internal/services"
	"manuind/middleware"
	"net/http"
)

type WorkOrderHandler struct{ svc services.WorkOrderService }

func NewWorkOrderHandler(s services.WorkOrderService) *WorkOrderHandler {
	return &WorkOrderHandler{svc: s}
}

func (h *WorkOrderHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filters := repositories.WorkOrderFilters{
		Status:   q.Get("status"),
		Type:     q.Get("type"),
		Priority: q.Get("priority"),
	}
	list, err := h.svc.GetAll(filters)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if list == nil {
		list = []*models.WorkOrder{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *WorkOrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	wo, err := h.svc.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, wo)
}

func (h *WorkOrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req models.CreateWorkOrderRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	wo, err := h.svc.Create(userID, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, wo)
}

func (h *WorkOrderHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateWorkOrderRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	wo, err := h.svc.Update(id, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, wo)
}

func (h *WorkOrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateWorkOrderStatusRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	if err := h.svc.UpdateStatus(id, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "status atualizado"})
}

func (h *WorkOrderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "OS removida"})
}

func (h *WorkOrderHandler) AssignMaintainer(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.AssignMaintainerRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	if err := h.svc.AssignMaintainer(id, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "manutentor vinculado"})
}

func (h *WorkOrderHandler) RemoveMaintainer(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	maintainerID, err := getIDParam(r, "maintainerId")
	if err != nil {
		respondError(w, http.StatusBadRequest, "maintainerId inválido")
		return
	}
	if err := h.svc.RemoveMaintainer(id, maintainerID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "manutentor removido"})
}

func (h *WorkOrderHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.CountByStatus()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, stats)
}
