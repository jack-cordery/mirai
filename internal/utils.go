package internal

import (
	"context"
	"errors"
	"math/big"
	"slices"
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

func spanToSlots(startTime time.Time, endTime time.Time, unit int) ([]time.Time, error) {
	// take the two and divide across units
	// provide error if startTime and/or endTime dont sit on a unit
	// i think we want to find the delta in minutes betwee the two
	// divide by units and then for range over that and populate with startTime + units
	// problem is that divide will floor divide in golang so we will just need to check that explicitly
	if !startTime.Before(endTime) {
		return []time.Time{}, errors.New("startTime after endTime")
	}

	if startTime.Second() != int(0) || endTime.Second() != int(0) {
		return []time.Time{}, errors.New("seconds provided")
	}

	allowedMinutes := []int{}
	m := int(0)
	for m < 60 {
		allowedMinutes = append(allowedMinutes, m)
		m += unit
	}

	if !(slices.Contains(allowedMinutes, startTime.Minute()) && slices.Contains(allowedMinutes, endTime.Minute())) {
		return []time.Time{}, errors.New("startTime or endTime isnt one of the allowed minutes")
	}

	delta := endTime.Sub(startTime).Minutes()
	if float64(int32(delta)) != delta {
		return []time.Time{}, errors.New("delta between startTime and endTime is not a whole minute")

	}
	deltaInt := int32(delta)

	numberOfSlots := deltaInt / int32(unit)

	unitDuration := time.Duration(unit) * time.Minute
	slots := []time.Time{}
	slot := startTime
	for range numberOfSlots {
		slots = append(slots, slot)
		slot = slot.Add(unitDuration)
	}

	return slots, nil

}
