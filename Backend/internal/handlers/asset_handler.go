package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/services"
	"net/http"
)

type AssetHandler struct{ svc services.AssetService }

func NewAssetHandler(s services.AssetService) *AssetHandler { return &AssetHandler{svc: s} }

func (h *AssetHandler) GetTree(w http.ResponseWriter, r *http.Request) {
	tree, err := h.svc.GetTree()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tree == nil {
		tree = []*models.Asset{}
	}
	respondJSON(w, http.StatusOK, tree)
}

func (h *AssetHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

func (h *AssetHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAssetRequest
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

func (h *AssetHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	var req models.UpdateAssetRequest
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

func (h *AssetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := getIDParam(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "ativo removido"})
}
