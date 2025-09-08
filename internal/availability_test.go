package internal

import (
	"testing"
	"time"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

func TestPostToDBParams(t *testing.T) {
	t.Run("base", func(t *testing.T) {
		t.Parallel()
		startTime, _ := time.Parse(time.RFC3339, "2025-09-08T14:00:00Z")
		endTime, _ := time.Parse(time.RFC3339, "2025-09-08T15:00:00Z")
		obj := PostAvailabilitySlotRequest{
			EmployeeID: 1,
			StartTime:  startTime,
			EndTime:    endTime,
			TypeID:     2,
		}

		expected := []db.CreateAvailabilitySlotParams{
			{
				EmployeeID: 1,
				Datetime:   pgtype.Timestamp{Time: startTime, Valid: true},
				TypeID:     2,
			},
			{
				EmployeeID: 1,
				Datetime:   pgtype.Timestamp{Time: startTime.Add(time.Duration(30 * time.Minute)), Valid: true},
				TypeID:     2,
			},
		}

		params, err := obj.ToDBParams()
		assert.Nil(t, err)
		assert.Equal(t, expected, params)

	})
}
