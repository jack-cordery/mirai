package internal

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/lib/pq"
)

type HealthResponse struct {
	Status string `json:"status"`
}

func liveHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	err := json.NewEncoder(w).Encode(HealthResponse{Status: "alive"})
	if err != nil {
		log.Fatal(err)
	}
}

func readyHandler(conn *pgxpool.Conn, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		err := conn.Ping(ctx)
		if err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			err = json.NewEncoder(w).Encode(HealthResponse{Status: "not ready"})
			if err != nil {
				log.Fatal(err)
			}
			return
		}

		w.WriteHeader(http.StatusOK)
		err = json.NewEncoder(w).Encode(HealthResponse{Status: "ready"})
		if err != nil {
			log.Fatal(err)
		}
	}
}

func SetupServer() {
	randomHex := os.Getenv("RANDOM_HEX")
	secretKey, err := hex.DecodeString(randomHex)
	if secretKey == nil || err != nil || len(secretKey) == 0 {
		log.Fatal(errors.New("valid secret key must be provided"))
		return
	}
	p := HashParams{
		Memory:      64 * 1024,
		Iterations:  3,
		Parallelism: 2,
		SaltLength:  16,
		KeyLength:   32,
	}
	c := CookieParams{
		Name:     "miraiSessionToken",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}
	a := &AuthParams{
		SessionDuration: 1,
		TokenLength:     64,
		SecretKey:       secretKey,
		RedirectPath:    "/home",
		LoginPath:       "/login",
		CParams:         c,
		HParams:         p,
	}
	appUrl := os.Getenv("APP_URL")
	ctx := context.Background()

	log.Printf("appURL for CORS is %s \n", appUrl)

	log.Printf("inital admin email is %s \n", os.Getenv("INITIAL_ADMIN_EMAIL"))

	pool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Println(err)
	}
	defer pool.Close()

	mux := http.NewServeMux()

	baseConn, err := pool.Acquire(ctx)
	if err != nil {
		log.Println(err)
	}
	defer baseConn.Release()

	mux.HandleFunc("GET /readyz", readyHandler(baseConn, ctx))
	mux.HandleFunc("GET /livez", liveHandler)

	mux.HandleFunc("POST /booking", authMiddleware(postBooking(pool, ctx), ctx, pool, a, "USER"))
	mux.HandleFunc("GET /booking", authMiddleware(getBooking(pool, ctx), ctx, pool, a, "USER"))
	mux.HandleFunc("GET /booking/user", authMiddleware(getBookingUser(pool, ctx, a), ctx, pool, a, "USER"))
	mux.HandleFunc("GET /booking/{booking_id}", authMiddleware(getBooking(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("PUT /booking/{booking_id}", authMiddleware(putBooking(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("DELETE /booking/{booking_id}", authMiddleware(deleteBooking(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("POST /booking/{booking_id}/payment/manual", authMiddleware(postManualPayment(pool, ctx, a), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("POST /booking/{booking_id}/cancel", authMiddleware(postManualStatus(pool, ctx, a, db.BookingStatusCancelled), ctx, pool, a, "USER"))
	mux.HandleFunc("POST /booking/{booking_id}/confirm", authMiddleware(postManualStatus(pool, ctx, a, db.BookingStatusConfirmed), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("POST /booking/{booking_id}/complete", postManualStatus(pool, ctx, a, db.BookingStatusCompleted))

	mux.HandleFunc("POST /user", authMiddleware(postUser(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /user/{user_id}", authMiddleware(getUser(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("PUT /user/{user_id}", authMiddleware(putUser(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("DELETE /user/{user_id}", authMiddleware(deleteUser(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /userByEmail", getUserByEmail(pool, ctx))

	mux.HandleFunc("POST /auth/login", postLogin(pool, ctx, a))
	mux.HandleFunc("POST /auth/logout", postLogout(pool, ctx, a))
	mux.HandleFunc("POST /auth/register", postRegister(pool, ctx, a))
	mux.HandleFunc("GET /auth/session/status", getSessionStatus(pool, ctx, a))
	mux.HandleFunc("POST /auth/raise", authMiddleware(postRaise(pool, ctx, a), ctx, pool, a, "USER"))
	mux.HandleFunc("GET /auth/requests", authMiddleware(getAllRequests(pool, ctx, a), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("POST /auth/request/approve/{request_id}", authMiddleware(postApproveRequest(pool, ctx, a), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("POST /auth/request/reject/{request_id}", authMiddleware(postRejectRequest(pool, ctx, a), ctx, pool, a, "ADMIN"))
	// mux.HandleFunc("POST /auth/change-password", postChangePassword())
	// mux.HandleFunc("POST /auth/reset-password", postResetPassword())
	// mux.HandleFunc("POST /auth/forgot-password", postForgotPassword())

	mux.HandleFunc("POST /employee", authMiddleware(postEmployee(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /employee/{employee_id}", authMiddleware(getEmployee(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /employee", authMiddleware(getEmployee(pool, ctx), ctx, pool, a, "USER"))
	mux.HandleFunc("PUT /employee/{employee_id}", authMiddleware(putEmployee(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("DELETE /employee/{employee_id}", authMiddleware(deleteEmployee(pool, ctx), ctx, pool, a, "ADMIN"))

	mux.HandleFunc("POST /booking_type", authMiddleware(postBookingType(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /booking_type/{type_id}", authMiddleware(getBookingType(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /booking_type/", authMiddleware(getBookingType(pool, ctx), ctx, pool, a, "USER"))
	mux.HandleFunc("PUT /booking_type/{type_id}", authMiddleware(putBookingType(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("DELETE /booking_type/{type_id}", authMiddleware(deleteBookingType(pool, ctx), ctx, pool, a, "ADMIN"))

	mux.HandleFunc("POST /availability", authMiddleware(postAvailabilitySlot(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /availability/{availability_slot_id}", authMiddleware(getAvailabilitySlot(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("GET /availability/free", authMiddleware(getFreeAvailabilitySlots(pool, ctx, a), ctx, pool, a, "USER"))
	mux.HandleFunc("GET /availability/", authMiddleware(getAvailabilitySlot(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("PUT /availability/", authMiddleware(putAvailabilitySlot(pool, ctx), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("DELETE /availability/{availability_slot_id}", authMiddleware(deleteAvailabilitySlot(pool, ctx, a, false), ctx, pool, a, "ADMIN"))
	mux.HandleFunc("DELETE /availability/", authMiddleware(deleteAvailabilitySlot(pool, ctx, a, false), ctx, pool, a, "ADMIN"))

	err = http.ListenAndServe(":8000", corsMiddleware(jsonContentTypeMiddleware(mux), appUrl))
	if err != nil {
		log.Println(err)
	}
}
