package internal

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GetUserResponse struct {
	UserID    int32            `json:"user_id"`
	Name      string           `json:"name"`
	Surname   string           `json:"surname"`
	Email     string           `json:"email"`
	CreatedAt pgtype.Timestamp `json:"created_at"`
	LastLogin pgtype.Timestamp `json:"last_login"`
}

func responseFromDBUser(user db.User) GetUserResponse {
	return GetUserResponse{
		UserID:    user.ID,
		Name:      user.Name,
		Surname:   user.Surname,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
		LastLogin: user.LastLogin,
	}
}

type PostUserRequest struct {
	Name    string `json:"name"`
	Surname string `json:"surname"`
	Email   string `json:"email"`
}

func (p PostUserRequest) ToDBParams() db.CreateUserParams {
	return db.CreateUserParams{
		Name:    p.Name,
		Surname: p.Surname,
		Email:   p.Email,
	}
}

type PostUserResponse struct {
	UserID int32 `json:"user_id"`
}

type PutUserRequest struct {
	Name    string `json:"name"`
	Surname string `json:"surname"`
	Email   string `json:"email"`
}
type PutUserResponse struct {
	UserID int32 `json:"user_id"`
}

func (r PutUserRequest) ToDBParams(userID int32) db.UpdateUserParams {
	return db.UpdateUserParams{
		ID:      userID,
		Name:    r.Name,
		Surname: r.Surname,
		Email:   r.Email,
	}
}

func postUser(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var userRequest PostUserRequest

		err := json.NewDecoder(r.Body).Decode(&userRequest)
		if err != nil {
			log.Printf("error decoding body in postUser: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in postUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in postUser: %v", err)
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

		userID, err := qtx.CreateUser(ctx, userRequest.ToDBParams())
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				log.Printf("uniqueness constraint violated in postUser. name: %s surname: %s tile: %s",
					userRequest.Name,
					userRequest.Surname,
					userRequest.Email,
				)
				w.WriteHeader(http.StatusConflict)
				return
			}
			log.Printf("general error when trying to create user in postUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in postUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PostUserResponse{
			UserID: userID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in postUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func getUser(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("user_id")
		id, err := strconv.ParseInt(userID, 10, 32)
		if err != nil {
			log.Printf("error: %v converting user id to int in getUser: %s", err, userID)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in getUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)

		user, err := queries.GetUserById(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error querying users table in getUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("user id: %d was requested in getUser and does not exist", id)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		err = json.NewEncoder(w).Encode(responseFromDBUser(user))
		if err != nil {
			log.Printf("error encoding json in getUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func putUser(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := r.PathValue("user_id")
		id, err := strconv.ParseInt(userId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting user id to int in putUser: %s", err, userId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		var userRequest PutUserRequest

		err = json.NewDecoder(r.Body).Decode(&userRequest)
		if err != nil {
			log.Printf("error decoding body in putUser: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in putUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in putUser: %v", err)
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

		userID, err := qtx.UpdateUser(ctx, userRequest.ToDBParams(int32(id)))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("user id: %d, which does not exist, was attemped to be updated by putUser", id)
				w.WriteHeader(http.StatusNotFound)
				return
			}
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					log.Printf("uniqueness constraint violated in putUser. Name: %s Surname: %s Email: %s",
						userRequest.Name,
						userRequest.Surname,
						userRequest.Email,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}
			log.Printf("general error when trying to update row in putUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in putUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PutUserResponse{
			UserID: userID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in putUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

}

func deleteUser(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := r.PathValue("user_id")
		id, err := strconv.ParseInt(userId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting user id to int in deleteUser: %s", err, userId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in deleteUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in deleteUser: %v", err)
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

		_, err = qtx.DeleteUser(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("general error when trying to delete user in deleteUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("user id: %d, which does not exist, was attemped to be deleted by deleteUser", id)
			w.WriteHeader(http.StatusNotFound)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in deleteUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}

}
