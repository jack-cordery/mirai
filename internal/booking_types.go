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

type GetBookingTypeResponse struct {
	TypeID      int32            `json:"type_id"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	Fixed       bool             `json:"fixed"`
	Cost        int32            `json:"cost"`
	CreatedAt   pgtype.Timestamp `json:"created_at"`
	LastEdited  pgtype.Timestamp `json:"last_edited"`
}

func responseFromDBBookingType(bookingType db.BookingType) GetBookingTypeResponse {
	return GetBookingTypeResponse{
		TypeID:      bookingType.ID,
		Title:       bookingType.Title,
		Description: bookingType.Description,
		Fixed:       bookingType.Fixed,
		Cost:        bookingType.Cost,
		CreatedAt:   bookingType.CreatedAt,
		LastEdited:  bookingType.LastEdited,
	}
}

// const MUST be provided in pennies! i.e. 100 = £1.00
type PostBookingTypeRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Fixed       bool   `json:"fixed"`
	Cost        int32  `json:"cost"`
}

func (p PostBookingTypeRequest) ToDBParams() db.CreateBookingTypeParams {
	return db.CreateBookingTypeParams{
		Title:       p.Title,
		Description: p.Description,
		Fixed:       p.Fixed,
		Cost:        p.Cost,
	}
}

type PostBookingTypeResponse struct {
	BookingTypeID int32 `json:"booking_type_id"`
}

type PutBookingTypeRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Fixed       bool   `json:"fixed"`
	Cost        int32  `json:"cost"`
}

type PutBookingTypeResponse struct {
	BookingTypeID int32 `json:"booking_type_id"`
}

func (r PutBookingTypeRequest) ToDBParams(bookingTypeID int32) db.UpdateBookingTypeParams {

	return db.UpdateBookingTypeParams{
		ID:          bookingTypeID,
		Title:       r.Title,
		Description: r.Description,
		Fixed:       r.Fixed,
		Cost:        r.Cost,
	}
}
func postBookingType(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var bookingTypeRequest PostBookingTypeRequest

		err := json.NewDecoder(r.Body).Decode(&bookingTypeRequest)
		if err != nil {
			log.Printf("error decoding body in postBookingType: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in postBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in postBookingType: %v", err)
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

		bookingTypeID, err := qtx.CreateBookingType(ctx, bookingTypeRequest.ToDBParams())
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				log.Printf("uniqueness constraint violated in postBookingType. title: %s description: %s",
					bookingTypeRequest.Title,
					bookingTypeRequest.Description,
				)
				w.WriteHeader(http.StatusConflict)
				return
			}
			log.Printf("general error when trying to create booking type in postBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in postBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PostBookingTypeResponse{
			BookingTypeID: bookingTypeID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in postBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func getBookingType(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		typeID := r.PathValue("type_id")
		id, err := strconv.ParseInt(typeID, 10, 32)
		if err != nil {
			log.Printf("error: %v converting type id to int in getBookingType: %s", err, typeID)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in getBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)

		bookingType, err := queries.GetBookingTypeById(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error querying booking type table in getBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("type id: %d was requested in getBookingType and does not exist", id)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		err = json.NewEncoder(w).Encode(responseFromDBBookingType(bookingType))
		if err != nil {
			log.Printf("error encoding json in getBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func putBookingType(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		typeId := r.PathValue("type_id")
		id, err := strconv.ParseInt(typeId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting type id to int in putBookingType: %s", err, typeId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		var bookingTypeRequest PutBookingTypeRequest

		err = json.NewDecoder(r.Body).Decode(&bookingTypeRequest)
		if err != nil {
			log.Printf("error decoding body in putBookingType: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in putBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in putBookingType: %v", err)
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

		bookingTypeID, err := qtx.UpdateBookingType(ctx, bookingTypeRequest.ToDBParams(int32(id)))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf(
					"bookingType id: %d, which does not exist, was attemped to be updated by putBookingType",
					id,
				)
				w.WriteHeader(http.StatusNotFound)
				return
			}
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					log.Printf("uniqueness constraint violated in putBookingType. Title: %s Description: %s",
						bookingTypeRequest.Title,
						bookingTypeRequest.Description,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}
			log.Printf("general error when trying to update row in putBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in putBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PutBookingTypeResponse{
			BookingTypeID: bookingTypeID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in putBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

}

func deleteBookingType(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bookingTypeId := r.PathValue("type_id")
		id, err := strconv.ParseInt(bookingTypeId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting bookingType id to int in deleteBookingType: %s", err, bookingTypeId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in deleteBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in deleteBookingType: %v", err)
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

		_, err = qtx.DeleteBookingType(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("general error when trying to delete bookingType in deleteBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("bookingType id: %d, which does not exist, was attemped to be deleted by deleteBookingType", id)
			w.WriteHeader(http.StatusNotFound)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in deleteBookingType: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}

}
