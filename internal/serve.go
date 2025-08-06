package internal

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/lib/pq"
)

type HealthResponse struct {
	Status string `json:"status"`
}

func jsonContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler, appUrl string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", appUrl)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})

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
	appUrl := os.Getenv("APP_URL")
	ctx := context.Background()

	log.Printf("appURL for CORS is %s \n", appUrl)

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

	mux.HandleFunc("POST /booking", postBooking(pool, ctx))
	mux.HandleFunc("GET /booking/{booking_id}", getBooking(pool, ctx))
	mux.HandleFunc("PUT /booking/{booking_id}", putBooking(pool, ctx))
	mux.HandleFunc("DELETE /booking/{booking_id}", deleteBooking(pool, ctx))

	mux.HandleFunc("POST /user", postUser(pool, ctx))
	mux.HandleFunc("GET /user/{user_id}", getUser(pool, ctx))
	mux.HandleFunc("PUT /user/{user_id}", putUser(pool, ctx))
	mux.HandleFunc("DELETE /user/{user_id}", deleteUser(pool, ctx))
	mux.HandleFunc("GET /userByEmail", getUserByEmail(pool, ctx))

	mux.HandleFunc("POST /employee", postEmployee(pool, ctx))
	mux.HandleFunc("GET /employee/{employee_id}", getEmployee(pool, ctx))
	mux.HandleFunc("PUT /employee/{employee_id}", putEmployee(pool, ctx))
	mux.HandleFunc("DELETE /employee/{employee_id}", deleteEmployee(pool, ctx))

	mux.HandleFunc("POST /booking_type", postBookingType(pool, ctx))
	mux.HandleFunc("GET /booking_type/{type_id}", getBookingType(pool, ctx))
	mux.HandleFunc("GET /booking_type/", getBookingType(pool, ctx))
	mux.HandleFunc("PUT /booking_type/{type_id}", putBookingType(pool, ctx))
	mux.HandleFunc("DELETE /booking_type/{type_id}", deleteBookingType(pool, ctx))

	mux.HandleFunc("POST /availability", postAvailabilitySlot(pool, ctx))
	mux.HandleFunc("GET /availability/{availability_slot_id}", getAvailabilitySlot(pool, ctx))
	mux.HandleFunc("PUT /availability/{availability_slot_id}", putAvailabilitySlot(pool, ctx))
	mux.HandleFunc("DELETE /availability/{availability_slot_id}", deleteAvailabilitySlot(pool, ctx))

	err = http.ListenAndServe(":8000", corsMiddleware(jsonContentTypeMiddleware(mux), appUrl))
	if err != nil {
		log.Println(err)
	}
}
