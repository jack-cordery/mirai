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
	ctx := context.Background()

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

	err = http.ListenAndServe(":8000", jsonContentTypeMiddleware(mux))
	if err != nil {
		log.Println(err)
	}
}
