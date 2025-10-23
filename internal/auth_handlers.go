package internal

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

func postLogin(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var creds Creds

		err := json.NewDecoder(r.Body).Decode(&creds)
		if err != nil {
			http.Error(w, "Invalid body, expects email and password", http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)

		err = HandleLogin(w, ctx, queries, creds, a)
		if err != nil {
			log.Fatal(err)
			return
		}
	}
}

func postRegister(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var creds RegisterRequest

		err := json.NewDecoder(r.Body).Decode(&creds)
		if err != nil {
			http.Error(w, "Invalid body, expects email and password", http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)

		_ = HandleRegister(w, ctx, queries, creds, a)
	}
}

func postLogout(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := pool.Acquire(ctx)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)
		_ = HandleLogout(w, r, ctx, queries, a)
	}
}

func getSessionStatus(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := pool.Acquire(ctx)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)
		_ = HandleSessionStatus(w, r, ctx, queries, a)
	}
}

func postSessionRefresh(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := pool.Acquire(ctx)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)
		_ = HandleSessionRefresh(w, r, ctx, queries, a)
	}
}
