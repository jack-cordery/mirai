package internal

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

func getStats(pool *pgxpool.Pool, ctx context.Context, t string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// ok so in here we need to get various stats which will be
		// some kind of sequence of SQL queries
		// we will begin a tx just for best pracitce

		conn, err := pool.Acquire(ctx)
		if err != nil {
			log.Printf("error aquiring connection in getStats: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer conn.Release()

		tx, err := conn.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			log.Printf("error beginning tx in postStats: %v", err)
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

		queryResponse, err := statsQuery(qtx, ctx, t)
		if err != nil {
			log.Printf("error getting query response in GetStats: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			log.Printf("error commiting query response in GetStats: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = json.NewEncoder(w).Encode(queryResponse)
		if err != nil {
			log.Printf("error encoding query response in GetStats: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

	}
}

// i also want data that looks like {date: "", total, cancelled, confirmed, ...}}
// write queires for date stuff, and call it below

type DataByDate struct {
	Date pgtype.Timestamp `json:"date"`
	Data Data             `json:"data"`
}

type Data struct {
	TotalBookings          TotalPair `json:"all"`
	TotalCancelledBookings TotalPair `json:"cancelled"`
	TotalConfirmedBookings TotalPair `json:"confirmed"`
	TotalCompletedBookings TotalPair `json:"completed"`
	TotalCreatedBookings   TotalPair `json:"created"`
	OpenBookings           TotalPair `json:"open"`
	OpenNotPaidBookings    TotalPair `json:"open_not_paid"`
	OpenPaidBookings       TotalPair `json:"open_paid"`
	TotalPaidBookings      TotalPair `json:"paid"`
}

type TotalPair struct {
	Frequency int64 `json:"frequency"`
	Cost      int32 `json:"cost"`
}

type QueryResponse struct {
	Totals Data         `json:"totals"`
	ByDate []DataByDate `json:"by_date"`
}

// / statsQuery queries the db and returns the stats required by the client
func statsQuery(query *db.Queries, ctx context.Context, t string) (QueryResponse, error) {
	// TODO: use concurrency
	var qr QueryResponse

	allBookings, err := query.TotalBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting all bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.TotalBookings = TotalPair{allBookings.TotalCount, allBookings.TotalCost}

	cancelledBookings, err := query.TotalCancelledBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting cancelled bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.TotalCancelledBookings = TotalPair{cancelledBookings.TotalCount, cancelledBookings.TotalCost}

	confirmedBookings, err := query.TotalConfirmedBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting confirmed bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.TotalConfirmedBookings = TotalPair{confirmedBookings.TotalCount, confirmedBookings.TotalCost}

	completedBookings, err := query.TotalCompletedBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting completed bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.TotalCompletedBookings = TotalPair{completedBookings.TotalCount, completedBookings.TotalCost}

	createdBookings, err := query.TotalCreatedBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting created bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.TotalCreatedBookings = TotalPair{createdBookings.TotalCount, createdBookings.TotalCost}

	openBookings, err := query.TotalOpenBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting open bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.OpenBookings = TotalPair{openBookings.TotalCount, openBookings.TotalCost}

	openPaidBookings, err := query.TotalOpenPaidBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting open paid bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.OpenPaidBookings = TotalPair{openPaidBookings.TotalCount, openPaidBookings.TotalCost}

	notOpenPaidBookings, err := query.TotalOpenNotPaidBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting open not paid bookings in statsQuery")
		return QueryResponse{}, err
	}
	qr.Totals.OpenNotPaidBookings = TotalPair{notOpenPaidBookings.TotalCount, notOpenPaidBookings.TotalCost}

	dataByDay, err := GetDataByTime(ctx, query, t)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting data by date in statsQuery")
		return QueryResponse{}, err
	}
	qr.ByDate = dataByDay
	return qr, nil
}

func GetDataByTime(ctx context.Context, query *db.Queries, t string) ([]DataByDate, error) {
	if t != "hour" && t != "day" && t != "week" && t != "month" && t != "year" {
		return []DataByDate{}, errors.New("invalid date frequency")
	}
	totalByDay, err := query.TotalBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting total bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalCancelledByDay, err := query.TotalCancelledBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting cancelled bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalConfirmedByDay, err := query.TotalConfirmedBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting confirmed bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalCompletedByDay, err := query.TotalCompletedBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting completed bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalCreatedByDay, err := query.TotalCreatedBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting created bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalOpenByDay, err := query.TotalOpenBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting open bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalOpenPaidByDay, err := query.TotalOpenPaidBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting open paid bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalOpenNotPaidByDay, err := query.TotalOpenNotPaidBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting open not paid bookings in getdatabytime")
		return []DataByDate{}, err
	}
	totalPaidByDay, err := query.TotalPaidBookingsBy(ctx, t)
	if err != err && !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("error getting open bookings in getdatabytime")
		return []DataByDate{}, err
	}

	if len(totalByDay) == 0 && len(totalCancelledByDay) == 0 {
		log.Printf("no dates")
		return []DataByDate{}, nil
	}

	minDate := time.Now().AddDate(10, 0, 0)
	maxDate := time.Now().AddDate(-10, 0, 0)

	for _, t := range totalByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalCancelledByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalConfirmedByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalCompletedByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalCreatedByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalOpenByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalOpenPaidByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalOpenNotPaidByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}
	for _, t := range totalPaidByDay {
		if t.Date.Time.Before(minDate) {
			minDate = t.Date.Time
		}
		if maxDate.Before(t.Date.Time) {
			maxDate = t.Date.Time
		}

	}

	resultData := []DataByDate{}

	for minDate.Before(maxDate) || minDate.Equal(maxDate) {
		currData := Data{}

		for _, v := range totalByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.TotalBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalCreatedByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.TotalCreatedBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalCancelledByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.TotalCancelledBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalConfirmedByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.TotalConfirmedBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalCompletedByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.TotalCompletedBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalOpenByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.OpenBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalOpenPaidByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.OpenPaidBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalOpenNotPaidByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.OpenNotPaidBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}
		for _, v := range totalPaidByDay {
			if v.Date.Time.UTC().Equal(minDate.UTC()) {
				currData.TotalPaidBookings = TotalPair{Cost: v.Sum, Frequency: int64(v.Count)}
			}
		}

		resultData = append(resultData, DataByDate{Date: pgtype.Timestamp{Time: minDate, Valid: true}, Data: currData})
		switch t {
		case "hour":
			minDate = minDate.Add(time.Hour * 1)
		case "day":

			minDate = minDate.AddDate(0, 0, 1)
		case "week":
			minDate = minDate.AddDate(0, 0, 7)
		case "month":
			minDate = minDate.AddDate(0, 1, 0)
		case "year":
			minDate = minDate.AddDate(1, 0, 0)
		default:
			return []DataByDate{}, errors.New("invalid input choice")
		}
	}

	return resultData, nil

}
