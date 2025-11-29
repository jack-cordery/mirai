package internal

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"slices"
	"time"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

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

func authMiddleware(next http.Handler, ctx context.Context, pool *pgxpool.Pool, a *AuthParams, level string) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// validate session
		token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
		if err != nil {
			log.Printf("The token provided failed in authMiddleware: %v with %v", token, err)
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("encoding response in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			err = InvalidateAuthCookie(w, a)
			if err != nil {
				log.Printf("invalidating cookie in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in authMiddleware: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in authMiddleware: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		defer func() {
			err := tx.Rollback(ctx)
			if err != nil && err != pgx.ErrTxClosed {
				panic(err)
			}
		}()

		queries := db.New(conn)
		qtx := queries.WithTx(tx)

		valid, err := VerifySession(ctx, qtx, token)
		if err != nil {
			log.Printf("verifying session in authMiddleware failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !valid {
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("writing json in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			err = InvalidateAuthCookie(w, a)
			if err != nil {
				log.Printf("invalidating cookie in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			err = qtx.DeleteSessionByToken(ctx, token)
			if err != nil {
				log.Printf("deleting cookie in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		} else {
			session, err := qtx.GetSessionByToken(ctx, token)
			if err != nil {
				log.Printf("getting session by token in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			approver, err := qtx.GetUserById(ctx, session.UserID)
			if err != nil {
				log.Printf("getting user by id for user in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			userRoles, err := qtx.GetRolesForUser(ctx, approver.ID)
			if err != nil {
				log.Printf("getting user roles by id for user in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			isLevel := slices.Contains(userRoles, level)

			if !isLevel {
				log.Printf("user %d has requested to get booking data and doesnt have permission to", approver.ID)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			// Serve existing with a new token with extended expiry
			err = ServeAuthCookie(w, token, a)
			if err != nil {
				log.Printf("serving updated cookie in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
			}

			expiryTime := time.Now().UTC().Add(time.Duration(a.SessionDuration) * time.Hour)
			err = queries.UpdateSession(ctx, db.UpdateSessionParams{
				SessionToken: token,
				ExpiresAt:    pgtype.Timestamp{Time: expiryTime, Valid: true},
			})
			if err != nil {
				log.Printf("persisting updated cookie in authMiddleware failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in authMiddleware: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		next.ServeHTTP(w, r)
	})
}
