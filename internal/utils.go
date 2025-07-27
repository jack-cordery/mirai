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

func getAndCalculateCost(queries *db.Queries, ctx context.Context, typeID int32, availabilitySlotID int32) (int32, error) {
	costAndAvailabilityResult, err := queries.GetCostAndAvailability(ctx, db.GetCostAndAvailabilityParams{ID: typeID, ID_2: availabilitySlotID})
	if err != nil {
		return 0, err
	}

	if costAndAvailabilityResult.Fixed {
		return costAndAvailabilityResult.Cost, nil
	}

	totalCost := calculateCost(costAndAvailabilityResult.Cost, costAndAvailabilityResult.DurationUnits)

	return totalCost, nil

}
