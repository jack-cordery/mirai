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

type GetEmployeeResponse struct {
	EmployeeID  int32            `json:"employee_id"`
	Name        string           `json:"name"`
	Surname     string           `json:"surname"`
	Email       string           `json:"email"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	CreatedAt   pgtype.Timestamp `json:"created_at"`
	LastLogin   pgtype.Timestamp `json:"last_login"`
}

func responseFromDBEmployee(employee db.Employee) GetEmployeeResponse {
	return GetEmployeeResponse{
		EmployeeID:  employee.ID,
		Name:        employee.Name,
		Surname:     employee.Surname,
		Email:       employee.Email,
		Title:       employee.Title,
		Description: employee.Description,
		CreatedAt:   employee.CreatedAt,
		LastLogin:   employee.LastLogin,
	}
}

type PostEmployeeRequest struct {
	Name        string `json:"name"`
	Surname     string `json:"surname"`
	Email       string `json:"email"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

func (p PostEmployeeRequest) ToDBParams() db.CreateEmployeeParams {
	return db.CreateEmployeeParams{
		Name:        p.Name,
		Surname:     p.Surname,
		Email:       p.Email,
		Title:       p.Title,
		Description: p.Description,
	}
}

type PostEmployeeResponse struct {
	EmployeeID int32 `json:"employee_id"`
}

type PutEmployeeRequest struct {
	Name        string `json:"name"`
	Surname     string `json:"surname"`
	Email       string `json:"email"`
	Title       string `json:"title"`
	Description string `json:"description"`
}
type PutEmployeeResponse struct {
	EmployeeID int32 `json:"employee_id"`
}

func (r PutEmployeeRequest) ToDBParams(employeeID int32) db.UpdateEmployeeParams {
	return db.UpdateEmployeeParams{
		ID:          employeeID,
		Name:        r.Name,
		Surname:     r.Surname,
		Email:       r.Email,
		Title:       r.Title,
		Description: r.Description,
	}
}
func postEmployee(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// use create employee sql query to insert
		// need to check employee doesnt already exist
		// need to ensure the request is valid
		// need to ensure that the tx was completed
		var employeeRequest PostEmployeeRequest

		err := json.NewDecoder(r.Body).Decode(&employeeRequest)
		if err != nil {
			log.Printf("error decoding body in postEmployee: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in postEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in postEmployee: %v", err)
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

		employeeID, err := qtx.CreateEmployee(ctx, employeeRequest.ToDBParams())
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				log.Printf("uniqueness constraint violated in postEmployee. name: %s surname: %s tile: %s",
					employeeRequest.Name,
					employeeRequest.Surname,
					employeeRequest.Title,
				)
				w.WriteHeader(http.StatusConflict)
				return
			}
			log.Printf("general error when trying to create employee in postEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in postEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PostEmployeeResponse{
			EmployeeID: employeeID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in postEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func getEmployee(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		employeeID := r.PathValue("employee_id")
		id, err := strconv.ParseInt(employeeID, 10, 32)
		if err != nil {
			log.Printf("error: %v converting employee id to int in getEmployee: %s", err, employeeID)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in getEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)

		employee, err := queries.GetEmployeeById(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error querying employees table in getEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("employee id: %d was requested in getEmployee and does not exist", id)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		err = json.NewEncoder(w).Encode(responseFromDBEmployee(employee))
		if err != nil {
			log.Printf("error encoding json in getEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func putEmployee(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		employeeId := r.PathValue("employee_id")
		id, err := strconv.ParseInt(employeeId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting employee id to int in putEmployee: %s", err, employeeId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		var employeeRequest PutEmployeeRequest

		err = json.NewDecoder(r.Body).Decode(&employeeRequest)
		if err != nil {
			log.Printf("error decoding body in putEmployee: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in putEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in putEmployee: %v", err)
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

		employeeID, err := qtx.UpdateEmployee(ctx, employeeRequest.ToDBParams(int32(id)))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("employee id: %d, which does not exist, was attemped to be updated by putEmployee", id)
				w.WriteHeader(http.StatusNotFound)
				return
			}
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					log.Printf("uniqueness constraint violated in putEmployee. Name: %s Surname: %s Title: %s",
						employeeRequest.Name,
						employeeRequest.Surname,
						employeeRequest.Title,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}
			log.Printf("general error when trying to update row in putEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in putEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PutEmployeeResponse{
			EmployeeID: employeeID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in putEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

}

func deleteEmployee(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		employeeId := r.PathValue("employee_id")
		id, err := strconv.ParseInt(employeeId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting employee id to int in deleteEmployee: %s", err, employeeId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in deleteEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in deleteEmployee: %v", err)
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

		_, err = qtx.DeleteEmployee(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("general error when trying to delete employee in deleteEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("employee id: %d, which does not exist, was attemped to be deleted by deleteEmployee", id)
			w.WriteHeader(http.StatusNotFound)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in deleteEmployee: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}

}
