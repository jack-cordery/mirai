package internal

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

func getStats(pool *pgxpool.Pool, ctx context.Context) http.HandlerFunc {
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

		queryResponse, err := statsQuery(qtx, ctx)
		if err != nil {
			log.Printf("error getting query response in GetStats: %v", err)
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
	Cost      int64 `json:"cost"`
}

type QueryResponse struct {
	Totals Data       `json:"totals"`
	ByDate DataByDate `json:"by_date"`
}

// / statsQuery queries the db and returns the stats required by the client
func statsQuery(query *db.Queries, ctx context.Context) (QueryResponse, error) {
	// TODO: use concurrency
	var qr QueryResponse

	allBookings, err := query.TotalBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.TotalBookings = TotalPair{allBookings.TotalCount, allBookings.TotalCost}

	cancelledBookings, err := query.TotalCancelledBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.TotalCancelledBookings = TotalPair{cancelledBookings.TotalCount, cancelledBookings.TotalCost}

	confirmedBookings, err := query.TotalConfirmedBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.TotalConfirmedBookings = TotalPair{confirmedBookings.TotalCount, confirmedBookings.TotalCost}

	completedBookings, err := query.TotalCompletedBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.TotalCompletedBookings = TotalPair{completedBookings.TotalCount, completedBookings.TotalCost}

	createdBookings, err := query.TotalCreatedBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.TotalCreatedBookings = TotalPair{createdBookings.TotalCount, createdBookings.TotalCost}

	openBookings, err := query.TotalOpenBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.OpenBookings = TotalPair{openBookings.TotalCount, openBookings.TotalCost}

	openPaidBookings, err := query.TotalOpenPaidBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.OpenPaidBookings = TotalPair{openPaidBookings.TotalCount, openPaidBookings.TotalCost}

	notOpenPaidBookings, err := query.TotalOpenNotPaidBookings(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return QueryResponse{}, err
	}
	qr.Totals.OpenNotPaidBookings = TotalPair{notOpenPaidBookings.TotalCount, notOpenPaidBookings.TotalCost}

	return qr, nil
}
