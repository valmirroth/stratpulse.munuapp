package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/services"
	"net/http"
)

type MaintenancePlanHandler struct{ svc services.MaintenancePlanService }

func NewMaintenancePlanHandler(s services.MaintenancePlanService) *MaintenancePlanHandler {
	return &MaintenancePlanHandler{svc: s}
}

func (h *MaintenancePlanHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if list == nil {
		list = []*models.MaintenancePlan{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *MaintenancePlanHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	p, err := h.svc.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, p)
}

func (h *MaintenancePlanHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMaintenancePlanRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	p, err := h.svc.Create(&req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, p)
}

func (h *MaintenancePlanHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateMaintenancePlanRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	p, err := h.svc.Update(id, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, p)
}

func (h *MaintenancePlanHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "plano desativado"})
}

func (h *MaintenancePlanHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	tasks, err := h.svc.GetTasks(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tasks == nil {
		tasks = []models.MaintenancePlanTask{}
	}
	respondJSON(w, http.StatusOK, tasks)
}

func (h *MaintenancePlanHandler) AddTask(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.CreateTaskRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	t, err := h.svc.CreateTask(id, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, t)
}

func (h *MaintenancePlanHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	taskID, err := getIDParam(r, "taskId")
	if err != nil {
		respondError(w, http.StatusBadRequest, "taskId inválido")
		return
	}
	var req models.CreateTaskRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	t, err := h.svc.UpdateTask(id, taskID, &req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, t)
}

func (h *MaintenancePlanHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	taskID, err := getIDParam(r, "taskId")
	if err != nil {
		respondError(w, http.StatusBadRequest, "taskId inválido")
		return
	}
	if err := h.svc.DeleteTask(taskID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "tarefa removida"})
}
