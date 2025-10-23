package internal

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var testParams = &HashParams{
	Memory:      64 * 1024,
	Iterations:  3,
	Parallelism: 2,
	SaltLength:  16,
	KeyLength:   32,
}

func TestHashPassword(t *testing.T) {
	t.Parallel()
	password := "securePassword123!"

	hash, err := HashPassword(password, testParams)

	require.NoError(t, err)
	assert.Contains(t, hash, "$argon2id$")
	assert.NotEmpty(t, hash)
	assert.Len(t, strings.Split(hash, "$"), 6)
}

func TestVerifyPassword_CorrectPassword(t *testing.T) {
	t.Parallel()
	password := "securePassword123!"

	// Hash the password
	hash, err := HashPassword(password, testParams)
	require.NoError(t, err)

	// Verify with the correct password
	match, err := VerifyPassword(password, hash)

	require.NoError(t, err)
	assert.True(t, match, "Password should match the hash")
}

func TestVerifyPassword_IncorrectPassword(t *testing.T) {
	t.Parallel()
	password := "securePassword123!"
	wrongPassword := "wrongPassword456!"

	// Hash the original password
	hash, err := HashPassword(password, testParams)
	require.NoError(t, err)

	// Verify with an incorrect password
	match, err := VerifyPassword(wrongPassword, hash)

	require.NoError(t, err)
	assert.False(t, match, "Password should not match the hash")
}

func TestDecodeHash_ValidHash(t *testing.T) {
	t.Parallel()
	password := "testPassword123!"

	// Generate a valid hash
	hash, err := HashPassword(password, testParams)
	require.NoError(t, err)

	// Decode the hash
	params, salt, decodedHash, err := DecodeHash(hash)

	require.NoError(t, err)
	assert.Equal(t, testParams.Memory, params.Memory)
	assert.Equal(t, testParams.Iterations, params.Iterations)
	assert.Equal(t, testParams.Parallelism, params.Parallelism)
	assert.Equal(t, testParams.SaltLength, uint32(len(salt)))
	assert.Equal(t, testParams.KeyLength, uint32(len(decodedHash)))
}

func TestDecodeHash_InvalidHash(t *testing.T) {
	t.Parallel()
	invalidHash := "$argon2id$v=19m=65536,t=3,p=2$invalidsalt$invalidhash"

	_, _, _, err := DecodeHash(invalidHash)

	assert.ErrorIs(t, err, ErrInvalidHash)
}

func TestGenerateRandomBytes(t *testing.T) {
	t.Parallel()
	length := uint32(16)
	randomBytes, err := GenerateRandomBytes(length)

	require.NoError(t, err)
	assert.Equal(t, int(length), len(randomBytes))
}

func TestEncodeAndDecodeHash(t *testing.T) {
	t.Parallel()
	password := "testPassword123!"
	salt, err := GenerateRandomBytes(testParams.SaltLength)
	require.NoError(t, err)

	encodedHash := EncodeHash(password, testParams, salt)

	params, decodedSalt, decodedHash, err := DecodeHash(encodedHash)
	require.NoError(t, err)

	assert.Equal(t, salt, decodedSalt)
	assert.Equal(t, testParams.Memory, params.Memory)
	assert.Equal(t, testParams.Iterations, params.Iterations)
	assert.Equal(t, testParams.Parallelism, params.Parallelism)
	assert.Equal(t, testParams.SaltLength, uint32(len(decodedSalt)))
	assert.Equal(t, testParams.KeyLength, uint32(len(decodedHash)))
}

func TestGenerateSessionToken(t *testing.T) {
	t.Parallel()
	t.Run("Generate Token Successfully", func(t *testing.T) {
		t.Parallel()
		token, err := GenerateSessionToken(32)
		assert.NoError(t, err)
		assert.Len(t, token, 43) // base64 encoded 32 bytes
	})

	t.Run("Generate Token with Zero Length", func(t *testing.T) {
		t.Parallel()
		token, err := GenerateSessionToken(0)
		assert.Error(t, err)
		assert.Empty(t, token)
	})
}

func TestIsTokenCurrent(t *testing.T) {
	t.Parallel()
	t.Run("Valid Future Token", func(t *testing.T) {
		t.Parallel()
		futureTime := time.Now().UTC().Add(time.Hour)
		expiryTimestamp := pgtype.Timestamp{
			Time:  futureTime,
			Valid: true,
		}

		isCurrent, err := IsTokenCurrent(expiryTimestamp)
		assert.NoError(t, err)
		assert.True(t, isCurrent)
	})

	t.Run("Valid Expired Token", func(t *testing.T) {
		t.Parallel()
		pastTime := time.Now().UTC().Add(-time.Hour)
		expiryTimestamp := pgtype.Timestamp{
			Time:  pastTime,
			Valid: true,
		}

		isCurrent, err := IsTokenCurrent(expiryTimestamp)
		assert.NoError(t, err)
		assert.False(t, isCurrent)
	})

	t.Run("Invalid Timestamp", func(t *testing.T) {
		t.Parallel()
		invalidTimestamp := pgtype.Timestamp{
			Valid: false,
		}

		isCurrent, err := IsTokenCurrent(invalidTimestamp)
		assert.Error(t, err)
		assert.False(t, isCurrent)
	})
}

func TestInvalidateAuthCookie(t *testing.T) {
	t.Parallel()
	w := httptest.NewRecorder()
	authParams := &AuthParams{
		CParams: CookieParams{
			Name:     "test_cookie",
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		},
	}

	err := InvalidateAuthCookie(w, authParams)
	assert.NoError(t, err)

	result := w.Result()
	defer result.Body.Close()
	cookies := result.Cookies()
	assert.Len(t, cookies, 1)
	assert.Equal(t, "", cookies[0].Value)
	assert.Equal(t, -1, cookies[0].MaxAge)
}

func TestServeAuthCookie_InvalidSecretKey(t *testing.T) {
	t.Parallel()
	w := httptest.NewRecorder()
	token := "test_token"

	invalidSecretKey := []byte("short_key")

	authParams := &AuthParams{
		CParams: CookieParams{
			Name:     "test_cookie",
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		},
		SessionDuration: 1,
		SecretKey:       invalidSecretKey,
	}

	err := ServeAuthCookie(w, token, authParams)
	assert.Error(t, err)
}

func TestServeAuthCookie_ValidSecretKey(t *testing.T) {
	t.Parallel()
	w := httptest.NewRecorder()
	token := "test_token"

	validSecretKey := []byte("32_byte_valid_secret_key_1234567")

	authParams := &AuthParams{
		CParams: CookieParams{
			Name:     "test_cookie",
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		},
		SessionDuration: 1,
		SecretKey:       validSecretKey,
	}

	err := ServeAuthCookie(w, token, authParams)
	assert.NoError(t, err)

	result := w.Result()
	defer result.Body.Close()
	cookies := result.Cookies()
	assert.Len(t, cookies, 1)
	assert.Equal(t, 3600, cookies[0].MaxAge) // 1 hour = 3600 seconds
	assert.Equal(t, "/", cookies[0].Path)
	assert.Equal(t, http.SameSiteStrictMode, cookies[0].SameSite)
	assert.True(t, cookies[0].HttpOnly)
	assert.True(t, cookies[0].Secure)
}
