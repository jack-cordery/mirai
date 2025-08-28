package internal

import (
	"context"
	"math/big"
	"time"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5/pgtype"
)

func timeToTimeStamp(t time.Time) (pgtype.Timestamp, error) {
	var result pgtype.Timestamp
	err := result.Scan(t)
	if err != nil {
		return pgtype.Timestamp{}, err
	}
	return result, nil
}

func intToNumeric(value int64) pgtype.Numeric {
	bigInt := big.NewInt(value)
	return pgtype.Numeric{
		Int:   bigInt,
		Exp:   -2,
		Valid: true,
	}
}

func bigIntToNumeric(bigInt *big.Int) pgtype.Numeric {
	return pgtype.Numeric{
		Int:   bigInt,
		Exp:   -2,
		Valid: true,
	}
}

func calculateCost(costPerUnit int32, durationUnits int32) int32 {
	return costPerUnit * durationUnits
}

func checkUserExists(queries *db.Queries, ctx context.Context, userID int32) (bool, error) {
	_, err := queries.GetUserById(ctx, userID)
	if err != nil {
		return false, err
	}
	return true, nil
}

func getAndCalculateCost(queries *db.Queries, ctx context.Context, typeID int32, duration int32) (int32, error) {
	bookingType, err := queries.GetBookingTypeById(ctx, typeID)
	if err != nil {
		return 0, err
	}

	if bookingType.Fixed {
		return bookingType.Cost, nil
	}

	totalCost := calculateCost(bookingType.Cost, duration)

	return totalCost, nil

}
