package internal

import (
	"math/big"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

func TestTimeToTimeStamp(t *testing.T) {
	t.Run("base", func(t *testing.T) {
		t.Parallel()
		in := time.Now()
		expected := pgtype.Timestamp{
			Time:  in,
			Valid: true,
		}
		actual, err := timeToTimeStamp(in)
		assert.NoError(t, err)
		assert.Equal(t, expected, actual)
	})
}

func TestIntToNumeric(t *testing.T) {
	t.Run("base", func(t *testing.T) {

		t.Parallel()
		in := int64(160)
		out := intToNumeric(in)
		expected := float64(1.60)

		outFloat, err := out.Float64Value()
		if err != nil {
			assert.Fail(t, "the function has returned a non-valid float64")
		}
		assert.Equal(t, expected, outFloat.Float64)
	})

	t.Run("zero", func(t *testing.T) {

		t.Parallel()
		in := int64(0)
		out := intToNumeric(in)
		expected := float64(0.00)

		outFloat, err := out.Float64Value()
		if err != nil {
			assert.Fail(t, "the function has returned a non-valid float64")
		}
		assert.Equal(t, expected, outFloat.Float64)
	})

	t.Run("large", func(t *testing.T) {

		t.Parallel()
		in := int64(9999899998)
		out := intToNumeric(in)
		expected := float64(99998999.98)

		outFloat, err := out.Float64Value()
		if err != nil {
			assert.Fail(t, "the function has returned a non-valid float64")
		}
		assert.Equal(t, expected, outFloat.Float64)
	})

}

func TestBigIntToNumeric(t *testing.T) {
	t.Run("base", func(t *testing.T) {
		t.Parallel()
		in := big.NewInt(160)
		out := bigIntToNumeric(in)
		expected := float64(1.60)

		outFloat, err := out.Float64Value()
		if err != nil {
			assert.Fail(t, "the function has returned a non-valid float64")
		}
		assert.Equal(t, expected, outFloat.Float64)

	})
	t.Run("zero", func(t *testing.T) {
		t.Parallel()
		in := big.NewInt(0)
		out := bigIntToNumeric(in)
		expected := float64(0.00)

		outFloat, err := out.Float64Value()
		if err != nil {
			assert.Fail(t, "the function has returned a non-valid float64")
		}
		assert.Equal(t, expected, outFloat.Float64)

	})
	t.Run("large", func(t *testing.T) {
		t.Parallel()
		in := big.NewInt(9999899998)
		out := bigIntToNumeric(in)
		expected := float64(99998999.98)

		outFloat, err := out.Float64Value()
		if err != nil {
			assert.Fail(t, "the function has returned a non-valid float64")
		}
		assert.Equal(t, expected, outFloat.Float64)

	})
}

func TestCalculateTest(t *testing.T) {
	t.Run("base", func(t *testing.T) {
		t.Parallel()
		cpu, duration := int32(100), int32(5)
		expected := int32(500)
		actual := calculateCost(cpu, duration)

		assert.Equal(t, expected, actual)

	})
	t.Run("zero cpu", func(t *testing.T) {
		t.Parallel()
		cpu, duration := int32(0), int32(5)
		expected := int32(0)
		actual := calculateCost(cpu, duration)

		assert.Equal(t, expected, actual)

	})
	t.Run("zero duration", func(t *testing.T) {
		t.Parallel()
		cpu, duration := int32(50), int32(0)
		expected := int32(0)
		actual := calculateCost(cpu, duration)

		assert.Equal(t, expected, actual)

	})
}
