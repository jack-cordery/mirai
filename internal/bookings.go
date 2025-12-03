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
	EmployeeID int32       `json:"employee_id"`
	TypeID     int32       `json:"type_id"`
	Notes      pgtype.Text `json:"notes"`
	Paid       bool        `json:"bool"`
	StartTime  time.Time   `json:"start_time"` // this expects RFC 3339 format, just need to sure it is encoded like this
	EndTime    time.Time   `json:"end_time"`   // this expects RFC 3339 format, just need to sure it is encoded like this
}

type PutBookingResponse struct {
	BookingID int32 `json:"booking_id"`
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

		sequentialCheckSlots, err := qtx.GetAvailabilitySlotByIds(ctx, bookingRequest.AvailabilitySlots)
		if err != nil {
			log.Printf("getting slots for sequential check failed in postBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return

		}

		sequentialCheckTimes := []time.Time{}
		for _, s := range sequentialCheckSlots {
			sequentialCheckTimes = append(sequentialCheckTimes, s.Datetime.Time)
		}

		if !isSequential(sequentialCheckTimes, Unit) {
			log.Printf("slot request is not sequential in postBooking")
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
			BookingID:       bookingRow.BookingID,
			StartTime:       bookingRow.StartTime,
			EmployeeID:      bookingRow.EmployeeID,
			EmployeeName:    bookingRow.EmployeeName,
			EmployeeSurname: bookingRow.EmployeeSurname,
			EmployeeEmail:   bookingRow.EmployeeEmail,
			EndTime:         bookingRow.EndTime,
			Status:          db.BookingStatusCreated,
			ChangedByEmail:  user.Email,
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

		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("getting session by token in getBookingUser failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		user, err := queries.GetUserById(ctx, session.UserID)
		if err != nil {
			log.Printf("getting user by id for user in getBookingUser failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		bookingData, err := queries.GetAllBookingsWithJoinByID(ctx, db.GetAllBookingsWithJoinByIDParams{
			UserID:  user.ID,
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

		duration := bookingRequest.EndTime.Sub(bookingRequest.StartTime).Nanoseconds()
		if duration%(30*1e9) != 0 {
			log.Println("duration is not in unit intervals")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		duration = duration / (30 * 1e9)
		cost, err := getAndCalculateCost(queries, ctx, bookingRequest.TypeID, int32(duration))
		if err != nil {
			log.Printf("error getting cost in putBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		bookingRow, err := qtx.GetBookingWithJoin(ctx, db.GetBookingWithJoinParams{
			Column1: Unit,
			ID:      int32(id),
		})
		if err != nil {
			log.Printf("getting booking data in putBooking failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = qtx.ClearBookingSlots(ctx, int32(id))
		if err != nil {
			log.Printf("error clearing booking slots in putBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		log.Printf("putBooking with %v and %v ", int32(id), Unit)
		bookingID, err := qtx.UpdateBooking(ctx, db.UpdateBookingParams{
			ID:              int32(id),
			TypeID:          bookingRequest.TypeID,
			Paid:            bookingRequest.Paid,
			Cost:            cost,
			Notes:           bookingRequest.Notes,
			StatusUpdatedBy: bookingRow.StatusUpdatedBy,
		})
		if err != nil {
			log.Printf("updating booking data in putBooking failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		startTimestamp, err := timeToTimeStamp(bookingRequest.StartTime)
		if err != nil {
			log.Printf("converting startTime to timestamp failed with: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		endTimestamp, err := timeToTimeStamp(bookingRequest.EndTime)
		if err != nil {
			log.Printf("converting endTime to timestamp failed with: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		err = qtx.CreateBookingHistory(ctx, db.CreateBookingHistoryParams{
			BookingID:       bookingRow.ID,
			EmployeeID:      bookingRequest.EmployeeID,
			EmployeeName:    bookingRow.EmployeeName,
			EmployeeSurname: bookingRow.EmployeeSurname,
			EmployeeEmail:   bookingRow.EmployeeEmail,
			StartTime:       startTimestamp,
			EndTime:         endTimestamp,
			Status:          db.BookingStatusRescheduled,
			ChangedByEmail:  bookingRow.StatusUpdatedBy,
		})

		slots, err := spanToSlots(bookingRequest.StartTime, bookingRequest.EndTime, Unit)
		if err != nil {
			log.Printf("creating slots from span in putBooking failed with %v:", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		slotsAsTimestamp := []pgtype.Timestamp{}
		for _, s := range slots {
			t, err := timeToTimeStamp(s)
			if err != nil {
				log.Printf("error converting slot time to timestamp in putBooking")
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			slotsAsTimestamp = append(slotsAsTimestamp, t)
		}

		slotIDs, err := qtx.GetAvailabilitySlotsFromSpanSlots(ctx, db.GetAvailabilitySlotsFromSpanSlotsParams{
			Column1:    slotsAsTimestamp,
			TypeID:     bookingRequest.TypeID,
			EmployeeID: bookingRequest.EmployeeID,
		})
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("error getting availability slots from span in putBooking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if len(slotIDs) != len(slots) {
			log.Printf("user requested a new slot that is not available for that employee/type")
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		for _, s := range slotIDs {
			err := qtx.CreateBookingSlot(ctx, db.CreateBookingSlotParams{
				BookingID:          int32(id),
				AvailabilitySlotID: s.ID,
			})
			if err != nil {
				log.Printf("error creating booking slot in putBooking: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
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

		session, err := qtx.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("getting session by token in postManualStatus failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		approver, err := qtx.GetUserByIdWithRoles(ctx, session.UserID)
		if err != nil {
			log.Printf("getting user by id with roles for user in postManualStatus failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		booking, err := qtx.GetBookingWithJoin(ctx, db.GetBookingWithJoinParams{Column1: Unit, ID: int32(booking_id)})
		if err != nil {
			log.Printf("getting booking by id with join for booking_id in postManualStatus failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		isAdmin := slices.Contains(approver.RoleNames, RoleAdmin)
		isCorrectUser := slices.Contains(approver.RoleNames, RoleUser) && (approver.ID == booking.UserID)

		if !isAdmin && !isCorrectUser {
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
			BookingID:       bookingRow.ID,
			EmployeeID:      bookingRow.EmployeeID,
			EmployeeName:    bookingRow.EmployeeName,
			EmployeeSurname: bookingRow.EmployeeSurname,
			EmployeeEmail:   bookingRow.EmployeeEmail,
			StartTime:       bookingRow.StartTime,
			EndTime:         bookingRow.EndTime,
			Status:          newStatus,
			ChangedByEmail:  bookingRow.StatusUpdatedBy,
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

	}
}
