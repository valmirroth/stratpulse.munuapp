package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"manuind/config"
	"manuind/database"
	"manuind/internal/handlers"
	"manuind/internal/repositories"
	"manuind/internal/services"
	"manuind/middleware"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

//go:embed docs
var docsFS embed.FS

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Falha ao conectar no banco: %v", err)
	}
	defer db.Close()

	// ── Repositórios ──────────────────────────────────────────
	userRepo       := repositories.NewUserRepository(db)
	assetRepo      := repositories.NewAssetRepository(db)
	accountRepo    := repositories.NewAccountRepository(db)
	maintainerRepo := repositories.NewMaintainerRepository(db)
	planRepo       := repositories.NewMaintenancePlanRepository(db)
	workOrderRepo  := repositories.NewWorkOrderRepository(db)
	timeEntryRepo  := repositories.NewTimeEntryRepository(db)

	// ── Serviços ──────────────────────────────────────────────
	authSvc       := services.NewAuthService(userRepo, cfg.JWTSecret)
	userSvc       := services.NewUserService(userRepo)
	assetSvc      := services.NewAssetService(assetRepo)
	accountSvc    := services.NewAccountService(accountRepo)
	maintainerSvc := services.NewMaintainerService(maintainerRepo)
	planSvc       := services.NewMaintenancePlanService(planRepo)
	workOrderSvc  := services.NewWorkOrderService(workOrderRepo)
	timeEntrySvc  := services.NewTimeEntryService(timeEntryRepo, workOrderRepo)

	// ── Handlers ──────────────────────────────────────────────
	authH        := handlers.NewAuthHandler(authSvc, userSvc)
	userH        := handlers.NewUserHandler(userSvc)
	assetH       := handlers.NewAssetHandler(assetSvc)
	accountH     := handlers.NewAccountHandler(accountSvc)
	maintainerH  := handlers.NewMaintainerHandler(maintainerSvc)
	planH        := handlers.NewMaintenancePlanHandler(planSvc)
	workOrderH   := handlers.NewWorkOrderHandler(workOrderSvc)
	timeEntryH   := handlers.NewTimeEntryHandler(timeEntrySvc)
	dashboardH   := handlers.NewDashboardHandler(db)

	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// ── Swagger UI (docs/) ────────────────────────────────────
	docsContent, _ := fs.Sub(docsFS, "docs")
	r.Handle("/docs", http.RedirectHandler("/docs/", http.StatusMovedPermanently))
	r.Handle("/docs/*", http.StripPrefix("/docs/", http.FileServer(http.FS(docsContent))))

	// ── Rotas públicas ────────────────────────────────────────
	r.Post("/api/auth/login", authH.Login)

	// ── Rotas protegidas ──────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))

		// Auth
		r.Get("/api/auth/me", authH.Me)
		r.Put("/api/auth/password", authH.ChangePassword)

		// Dashboard
		r.Get("/api/dashboard/stats", dashboardH.GetStats)

		// Usuários
		r.Get("/api/users", userH.GetAll)
		r.Post("/api/users", userH.Create)
		r.Get("/api/users/{id}", userH.GetByID)
		r.Put("/api/users/{id}", userH.Update)
		r.Delete("/api/users/{id}", userH.Delete)

		// Ativos
		r.Get("/api/assets", assetH.GetTree)
		r.Post("/api/assets", assetH.Create)
		r.Get("/api/assets/{id}", assetH.GetByID)
		r.Put("/api/assets/{id}", assetH.Update)
		r.Delete("/api/assets/{id}", assetH.Delete)

		// Plano de Contas
		r.Get("/api/accounts", accountH.GetTree)
		r.Get("/api/accounts/flat", accountH.GetAll)
		r.Post("/api/accounts", accountH.Create)
		r.Get("/api/accounts/{id}", accountH.GetByID)
		r.Put("/api/accounts/{id}", accountH.Update)
		r.Delete("/api/accounts/{id}", accountH.Delete)

		// Manutentores
		r.Get("/api/maintainers", maintainerH.GetAll)
		r.Post("/api/maintainers", maintainerH.Create)
		r.Get("/api/maintainers/{id}", maintainerH.GetByID)
		r.Put("/api/maintainers/{id}", maintainerH.Update)
		r.Delete("/api/maintainers/{id}", maintainerH.Delete)

		// Planos de Manutenção
		r.Get("/api/maintenance-plans", planH.GetAll)
		r.Post("/api/maintenance-plans", planH.Create)
		r.Get("/api/maintenance-plans/{id}", planH.GetByID)
		r.Put("/api/maintenance-plans/{id}", planH.Update)
		r.Delete("/api/maintenance-plans/{id}", planH.Delete)
		r.Get("/api/maintenance-plans/{id}/tasks", planH.GetTasks)
		r.Post("/api/maintenance-plans/{id}/tasks", planH.AddTask)
		r.Put("/api/maintenance-plans/{id}/tasks/{taskId}", planH.UpdateTask)
		r.Delete("/api/maintenance-plans/{id}/tasks/{taskId}", planH.DeleteTask)

		// Ordens de Serviço
		r.Get("/api/work-orders", workOrderH.GetAll)
		r.Post("/api/work-orders", workOrderH.Create)
		r.Get("/api/work-orders/stats", workOrderH.GetStats)
		r.Get("/api/work-orders/{id}", workOrderH.GetByID)
		r.Put("/api/work-orders/{id}", workOrderH.Update)
		r.Delete("/api/work-orders/{id}", workOrderH.Delete)
		r.Put("/api/work-orders/{id}/status", workOrderH.UpdateStatus)
		r.Post("/api/work-orders/{id}/maintainers", workOrderH.AssignMaintainer)
		r.Delete("/api/work-orders/{id}/maintainers/{maintainerId}", workOrderH.RemoveMaintainer)
		r.Get("/api/work-orders/{id}/time-entries", timeEntryH.GetByWorkOrder)

		// Lançamento de Horas
		r.Get("/api/time-entries", timeEntryH.GetAll)
		r.Post("/api/time-entries", timeEntryH.Create)
		r.Get("/api/time-entries/{id}", timeEntryH.GetByID)
		r.Put("/api/time-entries/{id}", timeEntryH.Update)
		r.Delete("/api/time-entries/{id}", timeEntryH.Delete)
		r.Put("/api/time-entries/{id}/approve", timeEntryH.Approve)
		r.Put("/api/time-entries/{id}/reject", timeEntryH.Reject)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("╔══════════════════════════════════════════════╗")
	log.Printf("║  ManuInd API  →  http://localhost%s         ║", addr)
	log.Printf("║  Swagger UI   →  http://localhost%s/docs    ║", addr)
	log.Printf("╚══════════════════════════════════════════════╝")
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Servidor falhou: %v", err)
	}
}
