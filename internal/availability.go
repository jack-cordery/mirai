package internal

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"slices"
	"strconv"
	"time"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

const Unit = 30 // number of minutes per unit i.e 1 duration unit in this case would be 30minutes.

type GetAvailiabilitySlotResponse struct {
	AvailabilitySlotID int32            `json:"availability_slot_id"`
	EmployeeID         int32            `json:"employee_id"`
	Datetime           pgtype.Timestamp `json:"datetime"`
	TypeID             int32            `json:"type_id"`
	CreatedAt          pgtype.Timestamp `json:"created_at"`
	LastEdited         pgtype.Timestamp `json:"last_edited"`
}

func responseFromDBAvailability(availabilitySlot db.Availability) GetAvailiabilitySlotResponse {
	return GetAvailiabilitySlotResponse{
		AvailabilitySlotID: availabilitySlot.ID,
		EmployeeID:         availabilitySlot.EmployeeID,
		Datetime:           availabilitySlot.Datetime,
		TypeID:             availabilitySlot.TypeID,
		CreatedAt:          availabilitySlot.CreatedAt,
		LastEdited:         availabilitySlot.LastEdited,
	}
}

type PostAvailabilitySlotRequest struct {
	EmployeeID int32     `json:"employee_id"`
	StartTime  time.Time `json:"start_time"` // this expects RFC 3339 format, just need to sure it is encoded like this
	EndTime    time.Time `json:"end_time"`   // this expects RFC 3339 format, just need to sure it is encoded like this
	TypeID     int32     `json:"type_id"`
}

func (p PostAvailabilitySlotRequest) ToDBParams() ([]db.CreateAvailabilitySlotParams, error) {
	params := []db.CreateAvailabilitySlotParams{}
	slots, err := spanToSlots(p.StartTime, p.EndTime, Unit)
	if err != nil {
		return []db.CreateAvailabilitySlotParams{}, err
	}
	for _, slot := range slots {
		slotTimeStamp, err := timeToTimeStamp(slot)
		if err != nil {
			return []db.CreateAvailabilitySlotParams{}, err
		}
		params = append(params,
			db.CreateAvailabilitySlotParams{
				EmployeeID: p.EmployeeID,
				Datetime:   slotTimeStamp,
				TypeID:     p.TypeID,
			})
	}
	return params, nil
}

type PostAvailabilitySlotResponse struct {
	AvailabilitySlotIDs []int32 `json:"availability_slot_ids"`
}

type PutAvailabilitySlotRequest struct {
	AvailabilitySlotIDs []int32   `json:"availability_slot_ids"`
	EmployeeID          int32     `json:"employee_id"`
	StartTime           time.Time `json:"start_time"` // this expects RFC 3339 format, just need to sure it is encoded like this
	EndTime             time.Time `json:"end_time"`   // this expects RFC 3339 format, just need to sure it is encoded like this
	TypeID              int32     `json:"type_id"`
}

type PutAvailabilitySlotResponse struct {
	AvailabilitySlotIDs []int32 `json:"availability_slot_ids"`
}

func (p PutAvailabilitySlotRequest) ToCreationParams() ([]db.CreateAvailabilitySlotParams, error) {
	params := []db.CreateAvailabilitySlotParams{}
	slots, err := spanToSlots(p.StartTime, p.EndTime, Unit)
	if err != nil {
		return []db.CreateAvailabilitySlotParams{}, err
	}
	for _, slot := range slots {
		slotTimeStamp, err := timeToTimeStamp(slot)
		if err != nil {
			return []db.CreateAvailabilitySlotParams{}, err
		}
		params = append(params,
			db.CreateAvailabilitySlotParams{
				EmployeeID: p.EmployeeID,
				Datetime:   slotTimeStamp,
				TypeID:     p.TypeID,
			})
	}
	return params, nil
}

type DeleteAvailabilityRequest struct {
	AvailabilitySlotIDs []int32 `json:"availability_slot_ids"`
}

func handleCreation(params []db.CreateAvailabilitySlotParams, qtx *db.Queries, ctx context.Context) ([]int32, error) {
	slotIDs := []int32{}
	for _, param := range params {
		availabilitySlotID, err := qtx.CreateAvailabilitySlot(ctx, param)
		if err != nil {
			return nil, err
		}
		slotIDs = append(slotIDs, availabilitySlotID)
	}

	return slotIDs, nil

}

func postAvailabilitySlot(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var availabilitySlotRequest PostAvailabilitySlotRequest

		err := json.NewDecoder(r.Body).Decode(&availabilitySlotRequest)
		if err != nil {
			log.Printf("error decoding body in postAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in postAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in postAvailabilitySlot : %v", err)
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

		params, err := availabilitySlotRequest.ToDBParams()
		if err != nil {
			log.Printf("error creating params in postAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		slotIDs, err := handleCreation(params, qtx, ctx)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					log.Printf("uniqueness constraint violated in postAvailabilitySlot. employeeID: %d Datetime: %s",
						availabilitySlotRequest.EmployeeID,
						availabilitySlotRequest.StartTime,
					)
					w.WriteHeader(http.StatusConflict)
					return
				}
				if pgErr.Code == "23503" {
					log.Printf("either the booking type id: %d or employee id: %d does not exist",
						availabilitySlotRequest.TypeID,
						availabilitySlotRequest.EmployeeID,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}
			log.Printf("general error when trying to create booking type in postAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in postAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PostAvailabilitySlotResponse{
			AvailabilitySlotIDs: slotIDs,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in postAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func getAvailabilitySlot(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		availabilitySlotID := r.PathValue("availability_slot_id")
		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in getAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)
		if availabilitySlotID == "" {
			availabilitySlots, err := queries.GetAllAvailabilitySlots(ctx)
			if err != nil && !errors.Is(err, pgx.ErrNoRows) {
				log.Printf("error querying availability table in getAllAvailabilitySlots: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			resp := []GetAvailiabilitySlotResponse{}

			for _, a := range availabilitySlots {
				resp = append(resp, responseFromDBAvailability(a))
			}

			err = json.NewEncoder(w).Encode(resp)
			if err != nil {
				log.Printf("error encoding json in getAllAvailiability: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return

		}

		id, err := strconv.ParseInt(availabilitySlotID, 10, 32)
		if err != nil {
			log.Printf("error: %v converting user id to int in getAvailabilitySlot: %s", err, availabilitySlotID)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		availabilitySlot, err := queries.GetAvailabilitySlotById(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error querying availability table in getAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("availability id: %d was requested in getAvailabilitySlot and does not exist", id)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		err = json.NewEncoder(w).Encode(responseFromDBAvailability(availabilitySlot))
		if err != nil {
			log.Printf("error encoding json in getAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func getFreeAvailabilitySlots(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// ok so we first want to check the user is a user and then we just
		// need a query that gets all availability that doesnt have an entry
		// in the join table
		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in getFreeAvailabilitySlots: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)

		// get session token, validate token, and validate user role
		token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
		if err != nil {
			log.Printf("The token provided failed in getFreeAvailabilitySlots: %v with %v", token, err)
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("encoding response in getFreeAvailabilitySlots failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		valid, err := VerifySession(ctx, queries, token)
		if err != nil {
			log.Printf("error verfying session in getFreeAvailabilitySlots failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !valid {
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("writing json in getFreeAvailabilitySlots failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("error getting session in getFreeAvailabilitySlots failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		user, err := queries.GetUserByIdWithRoles(ctx, session.UserID)
		if err != nil {
			log.Printf("error getting user in getFreeAvailabilitySlots failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !(slices.Contains(user.RoleNames, RoleUser)) {
			log.Printf("user %v has requested permission to getFreeAvailability without permissions USER", user.ID)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		availabilitySlots, err := queries.GetAllFreeAvailabilitySlots(ctx)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error querying availability table in getFreeAvailabilitySlots: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		resp := []GetAvailiabilitySlotResponse{}

		for _, a := range availabilitySlots {
			resp = append(resp, responseFromDBAvailability(a))
		}

		err = json.NewEncoder(w).Encode(resp)
		if err != nil {
			log.Printf("error encoding json in getFreeAvailabilitySlots: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		return

	}
}

func putAvailabilitySlot(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		var availabilitySlotRequest PutAvailabilitySlotRequest
		err := json.NewDecoder(r.Body).Decode(&availabilitySlotRequest)
		if err != nil {
			log.Printf("error decoding body in putAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in putAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in putAvailabilitySlot: %v", err)
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

		for _, id := range availabilitySlotRequest.AvailabilitySlotIDs {
			_, err = qtx.DeleteAvailabilitySlot(ctx, id)
			if err != nil {
				log.Printf("error deleting id %d in putAvailabilitySlot: %v", id, err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}

		params, err := availabilitySlotRequest.ToCreationParams()
		if err != nil {
			log.Printf("error creating params in putAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		slotIDs, err := handleCreation(params, qtx, ctx)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					log.Printf("uniqueness constraint violated in postAvailabilitySlot. employeeID: %d Datetime: %s",
						availabilitySlotRequest.EmployeeID,
						availabilitySlotRequest.StartTime,
					)
					w.WriteHeader(http.StatusConflict)
					return
				}
				if pgErr.Code == "23503" {
					log.Printf("either the booking type id: %d or employee id: %d does not exist",
						availabilitySlotRequest.TypeID,
						availabilitySlotRequest.EmployeeID,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}
			log.Printf("general error when trying to create booking type in postAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in putAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PutAvailabilitySlotResponse{
			AvailabilitySlotIDs: slotIDs,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in putAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

}

func deleteAvailabilitySlot(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var availabilitySlotIDs []int32
		availabilitySlotId := r.PathValue("availability_slot_id")

		if availabilitySlotId != "" {
			id, err := strconv.ParseInt(availabilitySlotId, 10, 32)
			if err != nil {
				log.Printf("error: %v converting availabilitySlot id to int in deleteAvailabilitySlot: %s", err, availabilitySlotId)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			availabilitySlotIDs = []int32{int32(id)}
		} else {
			var deleteRequest DeleteAvailabilityRequest
			err := json.NewDecoder(r.Body).Decode(&deleteRequest)
			if err != nil {
				log.Printf("error decoding request body in deleteAvailabilitySlot: %v", err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			availabilitySlotIDs = deleteRequest.AvailabilitySlotIDs
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in deleteAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in deleteAvailabilitySlot: %v", err)
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

		token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
		if err != nil {
			log.Printf("The token provided failed in deleteAvailabilitySlots: %v with %v", token, err)
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("encoding response in deleteAvailabilitySlots failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		valid, err := VerifySession(ctx, queries, token)
		if err != nil {
			log.Printf("error verfying session in deleteAvailabilitySlots failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !valid {
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("writing json in deleteAvailabilitySlots failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("error getting session in deleteAvailabilitySlots failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		user, err := queries.GetUserByIdWithRoles(ctx, session.UserID)
		if err != nil {
			log.Printf("error getting user in deleteAvailabilitySlots failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !(slices.Contains(user.RoleNames, RoleAdmin)) {
			log.Printf("user %v has requested permission to deleteAvailability without permissions Admin", user.ID)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// update booking status to cancelled and
		// need to get booking_id from the join table

		bookingIDs, err := qtx.GetBookingSlotsFromAvailability(ctx, availabilitySlotIDs)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error getting booking id deleteAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if err != nil && errors.Is(err, pgx.ErrNoRows) {
			// no booking associated to it so no need to delete
		} else {
			for _, bookingID := range bookingIDs {
				booking, err := qtx.GetBookingWithJoin(ctx, db.GetBookingWithJoinParams{
					Column1: Unit,
					ID:      bookingID,
				})
				if err != nil {
					log.Printf("error getting booking with join in deleteAvailabilitySlots failed with %v", err)
					w.WriteHeader(http.StatusInternalServerError)
					return
				}

				err = qtx.UpdateBookingStatus(ctx, db.UpdateBookingStatusParams{
					ID:              bookingID,
					Status:          db.BookingStatusCancelled,
					StatusUpdatedBy: user.Email,
				})
				if err != nil {
					log.Printf("error updating booking booking status in deleteAvailabilitySlot: %v", err)
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
				err = qtx.CreateBookingHistory(ctx, db.CreateBookingHistoryParams{
					BookingID:       bookingID,
					EmployeeID:      booking.EmployeeID,
					EmployeeName:    booking.EmployeeName,
					EmployeeSurname: booking.EmployeeSurname,
					EmployeeEmail:   booking.EmployeeEmail,
					StartTime:       booking.StartTime,
					EndTime:         booking.EndTime,
					Status:          db.BookingStatusCancelled,
					ChangedByEmail:  user.Email,
				})
			}
		}

		for _, id := range availabilitySlotIDs {
			_, err = qtx.DeleteAvailabilitySlot(ctx, int32(id))
			if err != nil && !errors.Is(err, pgx.ErrNoRows) {
				log.Printf("general error when trying to delete availabilitySlot id: %v in deleteAvailabilitySlot: %v", id, err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("availabilitySlot id: %d, which does not exist, was attemped to be deleted by deleteAvailabilitySlot", id)
				w.WriteHeader(http.StatusNotFound)
				return
			}
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in deleteAvailabilitySlot: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}

}
