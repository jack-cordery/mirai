package internal

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"slices"
	"strconv"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GetBookingResponse struct {
	BookingID       int32            `json:"booking_id"`
	UserID          int32            `json:"user_id"`
	TypeID          int32            `json:"type_id"`
	Paid            bool             `json:"paid"`
	Cost            int32            `json:"cost"`
	Status          db.BookingStatus `json:"status"`
	StatusUpdatedAt pgtype.Timestamp `json:"status_updated_at"`
	StatusUpdatedBy string           `json:"status_updated_by"`
	Notes           pgtype.Text      `json:"notes"`
	SlotIDs         []int32          `json:"slot_ids"`
	CreatedAt       pgtype.Timestamp `json:"created_at"`
	LastEdited      pgtype.Timestamp `json:"last_edited"`
}

func responseFromDBBooking(booking db.GetBookingByIdRow) GetBookingResponse {
	return GetBookingResponse{
		BookingID:       booking.ID,
		UserID:          booking.UserID,
		TypeID:          booking.TypeID,
		Paid:            booking.Paid,
		Cost:            booking.Cost,
		Status:          booking.Status,
		StatusUpdatedAt: booking.StatusUpdatedAt,
		StatusUpdatedBy: booking.StatusUpdatedBy,
		Notes:           booking.Notes,
		SlotIDs:         booking.SlotIds,
		CreatedAt:       booking.CreatedAt,
		LastEdited:      booking.LastEdited,
	}
}

type PostBookingRequest struct {
	UserID            int32       `json:"user_id"`
	AvailabilitySlots []int32     `json:"availability_slots"`
	TypeID            int32       `json:"type_id"`
	Notes             pgtype.Text `json:"notes"`
}

type PostBookingResponse struct {
	BookingID int32 `json:"booking_id"`
}

func (r PostBookingRequest) ToDBParams(cost int32, paid bool) db.CreateBookingParams {
	return db.CreateBookingParams{
		UserID:  r.UserID,
		TypeID:  r.TypeID,
		Notes:   r.Notes,
		Cost:    cost,
		Paid:    paid,
		Column6: r.AvailabilitySlots,
		Column7: Unit,
	}
}

type PutBookingRequest struct {
	UserID int32       `json:"user_id"`
	TypeID int32       `json:"type_id"`
	Notes  pgtype.Text `json:"notes"`
	Cost   int32       `json:"cost"`
	Paid   bool        `json:"bool"`
	Slots  []int32     `json:"availability_slots"`
}

type PutBookingResponse struct {
	BookingID int32 `json:"booking_id"`
}

func (r PutBookingRequest) ToDBParams(bookingID int32) db.UpdateBookingParams {
	return db.UpdateBookingParams{
		ID:     bookingID,
		UserID: r.UserID,
		TypeID: r.TypeID,
		Notes:  r.Notes,
		Cost:   r.Cost,
		Paid:   r.Paid,
	}
}

func postBooking(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var bookingRequest PostBookingRequest

		err := json.NewDecoder(r.Body).Decode(&bookingRequest)
		if err != nil {
			log.Printf("error decoding body in postBooking: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in postBooking: %v", err)
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
		duration := len(bookingRequest.AvailabilitySlots)
		if duration < 1 {
			log.Printf("requested a booking with no slots")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		cost, err := getAndCalculateCost(queries, ctx, bookingRequest.TypeID, int32(duration))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error getting cost and availability in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if err != nil && errors.Is(err, pgx.ErrNoRows) {
			log.Printf("invalid BookingTypeID: %d and/or AvailabilitySlotID: %d",
				bookingRequest.TypeID,
				bookingRequest.AvailabilitySlots,
			)
		}

		bookingRow, err := qtx.CreateBooking(ctx, bookingRequest.ToDBParams(cost, false))
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					log.Printf("uniqueness constraint violated in postBooking. userID: %d availabilitySlot: %d",
						bookingRequest.UserID,
						bookingRequest.AvailabilitySlots,
					)
					w.WriteHeader(http.StatusConflict)
					return
				}
				if pgErr.Code == "23503" {
					log.Printf("either the booking type id: %d or user id: %d, or availabilitySlotID %d does not exist",
						bookingRequest.TypeID,
						bookingRequest.UserID,
						bookingRequest.AvailabilitySlots,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}
			log.Printf("general error when trying to create booking in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		user, err := qtx.GetUserById(ctx, bookingRequest.UserID)
		if err != nil {
			log.Printf("error getting user email in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = qtx.CreateBookingHistory(ctx, db.CreateBookingHistoryParams{
			BookingID:      bookingRow.BookingID,
			StartTime:      bookingRow.StartTime,
			EndTime:        bookingRow.EndTime,
			Status:         db.BookingStatusCreated,
			ChangedByEmail: user.Email,
		})
		if err != nil {
			log.Printf("error creating booking history in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PostBookingResponse{
			BookingID: bookingRow.BookingID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func getBooking(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bookingId := r.PathValue("booking_id")
		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in getBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()
		queries := db.New(conn)

		if bookingId == "" {
			// we just want to return all bookings
			// TODO:
			// - add filtering and pagination through query params
			// - merge return types to be the same

			bookings, err := queries.GetAllBookingsWithJoin(ctx, Unit)
			if err != nil {
				log.Printf("error querying GetAllBookingsWithJoin in getBooking: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			err = json.NewEncoder(w).Encode(bookings)
			if err != nil {
				log.Printf("error encoding json in all branch of getBooking: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return

		}

		id, err := strconv.ParseInt(bookingId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting booking id to int in getBooking: %s", err, bookingId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		booking, err := queries.GetBookingById(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error querying bookings table in getBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("booking id: %d was requested in getBooking and does not exist", id)
			w.WriteHeader(http.StatusNotFound)
			return
		}

		err = json.NewEncoder(w).Encode(responseFromDBBooking(booking))
		if err != nil {
			log.Printf("error encoding json in getBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func getBookingUser(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
		if err != nil {
			log.Printf("The token provided failed in getBookingUser: %v with %v", token, err)
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("encoding response in getBookingUser failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in getBookingUser: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		queries := db.New(conn)

		valid, err := VerifySession(ctx, queries, token)
		if err != nil {
			log.Printf("verifying session in getBookingUser failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !valid {
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("writing json in getBookingUser failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		} else {
			session, err := queries.GetSessionByToken(ctx, token)
			if err != nil {
				log.Printf("getting session by token in getBookingUser failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			approver, err := queries.GetUserById(ctx, session.UserID)
			if err != nil {
				log.Printf("getting user by id for user in getBookingUser failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			userRoles, err := queries.GetRolesForUser(ctx, approver.ID)
			if err != nil {
				log.Printf("getting user roles by id for user in getBookingUser failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			isUser := slices.Contains(userRoles, RoleUser)

			if !isUser {
				log.Printf("user %d has requested to get booking data and doesnt have permission to", approver.ID)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			bookingData, err := queries.GetAllBookingsWithJoinByID(ctx, db.GetAllBookingsWithJoinByIDParams{
				UserID:  approver.ID,
				Column2: Unit,
			})
			if err != nil {
				log.Printf("getting booking data in getBookingUser failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			err = json.NewEncoder(w).Encode(bookingData)
			if err != nil {
				log.Printf("encoding booking data in getBookingUser failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}
	}

}

func putBooking(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		bookingId := r.PathValue("booking_id")
		id, err := strconv.ParseInt(bookingId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting booking id to int in deleteBooking: %s", err, bookingId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		var bookingRequest PutBookingRequest

		err = json.NewDecoder(r.Body).Decode(&bookingRequest)
		if err != nil {
			log.Printf("error decoding body in putBooking: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in putBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in putBooking: %v", err)
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

		bookingID, err := qtx.UpdateBooking(ctx, bookingRequest.ToDBParams(int32(id)))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("booking id: %d, which does not exist, was attemped to be updated by putBooking", id)
				w.WriteHeader(http.StatusNotFound)
				return
			}
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					log.Printf("uniqueness constraint violated in putBooking. userID: %d availabilitySlot: %v",
						bookingRequest.UserID,
						bookingRequest.Slots,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
				if pgErr.Code == "23503" {
					log.Printf("putBooking: either the booking type id: %d or user id: %d, or availabilitySlotID %v does not exist",
						bookingRequest.TypeID,
						bookingRequest.UserID,
						bookingRequest.Slots,
					)
					w.WriteHeader(http.StatusBadRequest)
					return
				}
			}
			log.Printf("general error when trying to update booking in putBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in putBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		response := PutBookingResponse{
			BookingID: bookingID,
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(response)
		if err != nil {
			log.Printf("error encoding json in putBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

func deleteBooking(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bookingId := r.PathValue("booking_id")
		id, err := strconv.ParseInt(bookingId, 10, 32)
		if err != nil {
			log.Printf("error: %v converting booking id to int in deleteBooking: %s", err, bookingId)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in deleteBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in deleteBooking: %v", err)
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

		_, err = qtx.DeleteBooking(ctx, int32(id))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("general error when trying to delete booking in deleteBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("booking id: %d, which does not exist, was attemped to be deleted by deleteBooking", id)
			w.WriteHeader(http.StatusNotFound)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting tx in deleteBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}

}

func postManualPayment(pool *pgxpool.Pool, ctx context.Context, a *AuthParams) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("booking_id")
		if id == "" {
			log.Printf("booking_id in postManualPayment is empty")
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		booking_id, err := strconv.ParseInt(id, 10, 32)
		if err != nil {
			log.Printf("booking_id is not an integer")
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in deleteBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in deleteBooking: %v", err)
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
			log.Printf("The token provided failed in postManualPayment: %v", token)
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("encoding response in postManualPayment failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		valid, err := VerifySession(ctx, qtx, token)
		if err != nil {
			log.Printf("verifying session in postManualPayment failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !valid {
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("writing json in postManualPayment failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		} else {
			session, err := qtx.GetSessionByToken(ctx, token)
			if err != nil {
				log.Printf("getting session by token in postManualPayment failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			approver, err := qtx.GetUserById(ctx, session.UserID)
			if err != nil {
				log.Printf("getting user by id for user in postManualPayment failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			userRoles, err := qtx.GetRolesForUser(ctx, approver.ID)
			if err != nil {
				log.Printf("getting user roles by id for user in postManualPayment failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			isAdmin := slices.Contains(userRoles, RoleAdmin)

			if !isAdmin {
				log.Printf("user %d has requested to post a manual payment and doesnt have permission to", approver.ID)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			err = qtx.PostManualPayment(ctx, int32(booking_id))
			if err != nil {
				log.Printf("posting manual payment failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			err = tx.Commit(ctx)
			if err != nil {
				log.Printf("error commiting tx in postManualPayment: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			return
		}
	}
}

func postManualStatus(pool *pgxpool.Pool, ctx context.Context, a *AuthParams, newStatus db.BookingStatus) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("booking_id")
		if id == "" {
			log.Printf("booking_id in postManualStatus is empty")
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		booking_id, err := strconv.ParseInt(id, 10, 32)
		if err != nil {
			log.Printf("booking_id is not an integer")
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring pool in deleteBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in deleteBooking: %v", err)
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
			log.Printf("The token provided failed in postManualStatus: %v", token)
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("encoding response in postManualStatus failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		}

		valid, err := VerifySession(ctx, qtx, token)
		if err != nil {
			log.Printf("verifying session in postManualStatus failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !valid {
			w.WriteHeader(http.StatusUnauthorized)
			err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
			if err != nil {
				log.Printf("writing json in postManualStatus failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			return
		} else {
			session, err := qtx.GetSessionByToken(ctx, token)
			if err != nil {
				log.Printf("getting session by token in postManualStatus failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			approver, err := qtx.GetUserById(ctx, session.UserID)
			if err != nil {
				log.Printf("getting user by id for user in postManualStatus failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			userRoles, err := qtx.GetRolesForUser(ctx, approver.ID)
			if err != nil {
				log.Printf("getting user roles by id for user in postManualStatus failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			isAdmin := slices.Contains(userRoles, RoleAdmin)

			if !isAdmin {
				log.Printf("user %d has requested to post a manual status and doesnt have permission to", approver.ID)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			err = qtx.UpdateBookingStatus(ctx, db.UpdateBookingStatusParams{
				ID:              int32(booking_id),
				Status:          newStatus,
				StatusUpdatedBy: approver.Email,
			})
			if err != nil {
				log.Printf("updating booking status failed with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			bookingRow, err := qtx.GetBookingWithJoin(ctx, db.GetBookingWithJoinParams{
				Column1: Unit,
				ID:      int32(booking_id),
			})

			if err != nil {
				log.Printf("getting booking data in post manual status with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			err = qtx.CreateBookingHistory(ctx, db.CreateBookingHistoryParams{
				BookingID:      bookingRow.ID,
				StartTime:      bookingRow.StartTime,
				EndTime:        bookingRow.EndTime,
				Status:         newStatus,
				ChangedByEmail: bookingRow.StatusUpdatedBy,
			})
			if err != nil {
				log.Printf("creating booking history in post manual status with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			if newStatus == db.BookingStatusCancelled {
				err = qtx.FreeAvailabilitySlot(ctx, int32(booking_id))
				if err != nil {
					log.Printf("freeing availability slots failed with %v", err)
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
			}
			err = tx.Commit(ctx)
			if err != nil {
				log.Printf("error commiting tx in postManualStatus: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			return
		}
	}
}
