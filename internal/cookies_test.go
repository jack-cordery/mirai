package internal

import (
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWriteEncryptedCookie(t *testing.T) {
	t.Parallel()
	secretKey := []byte("32_byte_valid_secret_key_1234567")
	cookie := &http.Cookie{
		Name:     "user",
		Value:    "1234",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}

	t.Run("successful encryption", func(t *testing.T) {
		t.Parallel()
		w := httptest.NewRecorder()
		err := WriteEncryptedCookie(w, cookie, secretKey)
		require.NoError(t, err)

		result := w.Result()
		defer result.Body.Close()
		cookies := result.Cookies()
		require.Len(t, cookies, 1)
		assert.Equal(t, "user", cookies[0].Name)
		assert.NotEqual(t, "1234", cookies[0].Value)
		assert.True(t, cookies[0].HttpOnly)
		assert.True(t, cookies[0].Secure)
	})

	t.Run("short key error", func(t *testing.T) {
		t.Parallel()
		w := httptest.NewRecorder()
		err := WriteEncryptedCookie(w, cookie, []byte("short"))
		assert.Error(t, err)
	})
}

func TestReadEncryptedCookie(t *testing.T) {
	t.Parallel()
	secretKey := []byte("32_byte_valid_secret_key_1234567")
	cookie := &http.Cookie{
		Name:     "user",
		Value:    "1234",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}

	t.Run("successful decryption", func(t *testing.T) {
		t.Parallel()
		w := httptest.NewRecorder()
		err := WriteEncryptedCookie(w, cookie, secretKey)
		require.NoError(t, err)

		result := w.Result()
		defer result.Body.Close()
		cookies := result.Cookies()

		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(cookies[0])

		value, err := ReadEncryptedCookie(r, "user", secretKey)
		assert.NoError(t, err)
		assert.Equal(t, "1234", value)
	})

	t.Run("invalid encrypted value", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "user",
			Value: "invalid_encrypted_value",
		})
		_, err := ReadEncryptedCookie(r, "user", secretKey)
		assert.Error(t, err)
	})

	t.Run("missing cookie", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		_, err := ReadEncryptedCookie(r, "user", secretKey)
		assert.Error(t, err)
	})
}

func TestWriteSignedCookie(t *testing.T) {
	t.Parallel()
	secretKey := []byte("32_byte_valid_secret_key_1234567")
	cookie := &http.Cookie{
		Name:     "user",
		Value:    "1234",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}

	t.Run("successful signing", func(t *testing.T) {
		t.Parallel()
		w := httptest.NewRecorder()
		err := WriteSignedCookie(w, cookie, secretKey)
		require.NoError(t, err)

		result := w.Result()
		defer result.Body.Close()
		cookies := result.Cookies()

		require.Len(t, cookies, 1)
		assert.Equal(t, "user", cookies[0].Name)
		assert.True(t, cookies[0].HttpOnly)
		assert.True(t, cookies[0].Secure)
	})

	t.Run("short key error", func(t *testing.T) {
		t.Parallel()
		w := httptest.NewRecorder()
		err := WriteSignedCookie(w, cookie, []byte("short"))
		assert.Error(t, err)
	})
}

func TestReadSignedCookie(t *testing.T) {
	t.Parallel()
	secretKey := []byte("32_byte_valid_secret_key_1234567")
	cookie := &http.Cookie{
		Name:     "user",
		Value:    "1234",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}

	t.Run("successful verification", func(t *testing.T) {
		t.Parallel()
		w := httptest.NewRecorder()
		err := WriteSignedCookie(w, cookie, secretKey)
		require.NoError(t, err)

		result := w.Result()
		defer result.Body.Close()
		cookies := result.Cookies()

		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(cookies[0])

		value, err := ReadSignedCookie(r, "user", secretKey)
		assert.NoError(t, err)
		assert.Equal(t, "1234", value)
	})

	t.Run("tampered value", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "user",
			Value: "tampered_value",
		})
		_, err := ReadSignedCookie(r, "user", secretKey)
		assert.Error(t, err)
	})

	t.Run("missing cookie", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		_, err := ReadSignedCookie(r, "user", secretKey)
		assert.Error(t, err)
	})
}

func TestWriteCookie(t *testing.T) {
	t.Parallel()
	t.Run("value too long", func(t *testing.T) {
		t.Parallel()
		cookie := &http.Cookie{
			Name:  "user",
			Value: strings.Repeat("x", 4097),
		}
		w := httptest.NewRecorder()
		err := WriteCookie(w, cookie)
		assert.Equal(t, ErrValueTooLong, err)
	})

	t.Run("successful write", func(t *testing.T) {
		t.Parallel()
		cookie := &http.Cookie{
			Name:     "user",
			Value:    "1234",
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
		}
		w := httptest.NewRecorder()
		err := WriteCookie(w, cookie)

		result := w.Result()
		defer result.Body.Close()
		cookies := result.Cookies()

		assert.NoError(t, err)
		assert.Len(t, cookies, 1)
	})
}

func TestReadCookie(t *testing.T) {
	t.Parallel()
	t.Run("successful read", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "testCookie",
			Value: base64.RawURLEncoding.EncodeToString([]byte("testValue")),
		})

		value, err := ReadCookie(r, "testCookie")
		assert.NoError(t, err)
		assert.Equal(t, "testValue", value)
	})

	t.Run("non-existent cookie", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		_, err := ReadCookie(r, "nonExistentCookie")
		assert.Error(t, err)
		assert.Equal(t, http.ErrNoCookie, err)
	})

	t.Run("invalid base64 value", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "invalidCookie",
			Value: "invalid base64!",
		})

		_, err := ReadCookie(r, "invalidCookie")
		assert.Error(t, err)
	})

	t.Run("empty value", func(t *testing.T) {
		t.Parallel()
		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "emptyCookie",
			Value: base64.RawURLEncoding.EncodeToString([]byte("")),
		})

		value, err := ReadCookie(r, "emptyCookie")
		assert.NoError(t, err)
		assert.Equal(t, "", value)
	})

	t.Run("special characters", func(t *testing.T) {
		t.Parallel()
		specialValue := "!@#$%^&*()_+"
		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "specialCookie",
			Value: base64.RawURLEncoding.EncodeToString([]byte(specialValue)),
		})

		value, err := ReadCookie(r, "specialCookie")
		assert.NoError(t, err)
		assert.Equal(t, specialValue, value)
	})

	t.Run("long value", func(t *testing.T) {
		t.Parallel()
		longValue := strings.Repeat("a", 1000)
		r := httptest.NewRequest("GET", "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "longCookie",
			Value: base64.RawURLEncoding.EncodeToString([]byte(longValue)),
		})

		value, err := ReadCookie(r, "longCookie")
		assert.NoError(t, err)
		assert.Equal(t, longValue, value)
	})
}
