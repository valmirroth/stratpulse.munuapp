package handlers

import (
	"manuind/internal/domain/models"
	"manuind/internal/services"
	"manuind/middleware"
	"net/http"
)

type AuthHandler struct {
	authSvc services.AuthService
	userSvc services.UserService
}

func NewAuthHandler(a services.AuthService, u services.UserService) *AuthHandler {
	return &AuthHandler{authSvc: a, userSvc: u}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	resp, err := h.authSvc.Login(&req)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	user, err := h.userSvc.GetByID(userID)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req models.ChangePasswordRequest
	if err := decodeBody(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	if err := h.authSvc.ChangePassword(userID, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "senha alterada com sucesso"})
}
