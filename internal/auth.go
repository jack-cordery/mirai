package internal

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/jack-cordery/mirai/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/argon2"
)

const (
	RoleAdmin = "ADMIN"
	RoleUser  = "USER"
)

type Permissions struct {
	Roles []string `json:"role"`
}

type Creds struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type HashParams struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}
type CookieParams struct {
	Name     string
	Path     string
	HttpOnly bool
	Secure   bool
	SameSite http.SameSite
}

type AuthParams struct {
	SessionDuration uint8
	TokenLength     uint32
	SecretKey       []byte
	RedirectPath    string
	LoginPath       string
	CParams         CookieParams
	HParams         HashParams
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterResponse struct {
	Message string `json:"message"`
}

type LoginResponse struct {
	Message string      `json:"message"`
	Email   string      `json:"email"`
	ID      int32       `json:"id"`
	Perms   Permissions `json:"permissions"`
}

type LogoutResponse struct {
	Message string `json:"message"`
}

type StatusResponse struct {
	UserID int32       `json:"userID"`
	Email  string      `json:"email"`
	Perms  Permissions `json:"permissions"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

var (
	ErrInvalidHash         = errors.New("the encoded hash is not in the correct format")
	ErrIncompatibleVersion = errors.New("incompatible version of argon2")
	ErrInvalidTokenLength  = errors.New("invalid token length")
)

func HandleLogout(w http.ResponseWriter, r *http.Request, ctx context.Context, queries *db.Queries, a *AuthParams) error {
	token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
	if err != nil {
		err = handleEarlyLogout(w, a)
		return err
	}

	err = queries.DeleteSessionByToken(ctx, token)
	if err != nil {
		err = handleEarlyLogout(w, a)
		return err
	}

	err = InvalidateAuthCookie(w, a)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(LogoutResponse{Message: "Logged out successfully"})
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}
	return nil
}

func HandleRegister(w http.ResponseWriter, ctx context.Context, queries *db.Queries, creds RegisterRequest, a *AuthParams) error {
	// TODO: Add validation step

	// 1. Check DB to see they are new
	_, err := queries.GetUserByEmail(ctx, creds.Email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}
	if errors.Is(err, pgx.ErrNoRows) {
		hashedPassword, err := HashPassword(creds.Password, &a.HParams)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		userId, err := queries.CreateUser(ctx, db.CreateUserParams{
			Name:           creds.Name,
			Surname:        creds.Surname,
			Email:          creds.Email,
			HashedPassword: hashedPassword,
		})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		roleId, err := queries.GetRoleByName(ctx, RoleUser)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		err = queries.AssignRoleToUser(ctx, db.AssignRoleToUserParams{
			UserID: userId,
			RoleID: roleId,
		})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}

		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(RegisterResponse{Message: "User registered successfully"})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return nil
	}

	http.Error(w, "Registration unsuccessful. Please check your details and try again.", http.StatusBadRequest)
	return nil
}

func HandleLogin(w http.ResponseWriter, ctx context.Context, queries *db.Queries, creds Creds, a *AuthParams) error {
	// Params will be everything needed for a login e.g. username, password

	// 1. Check user exists in DB -> If not, respond with User does not exist, please register
	user, err := queries.GetUserByEmail(ctx, creds.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			err := InvalidateAuthCookie(w, a)
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return err
			}
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return err
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	// 2. If the user exists, check the password against the hash
	match, err := VerifyPassword(creds.Password, user.HashedPassword)
	if err != nil {
		http.Error(w, "Internal server errror", http.StatusInternalServerError)
		return err
	}
	if !match {
		err := InvalidateAuthCookie(w, a)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return err
	}

	// 3. Create Session token/ Update Session token
	latestSession, err := queries.GetLatestSession(ctx, user.ID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	var isCurr bool
	if errors.Is(err, pgx.ErrNoRows) {
		isCurr = false
	} else {
		isCurr, err = IsTokenCurrent(latestSession.ExpiresAt)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
	}

	if err == pgx.ErrNoRows || !isCurr {
		err := HandleNewSession(w, ctx, queries, a, user.ID)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		roles, err := queries.GetRolesForUser(ctx, user.ID)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}

		w.WriteHeader(http.StatusOK)

		err = json.NewEncoder(w).Encode(LoginResponse{
			Message: "Login successful",
			Email:   creds.Email,
			ID:      latestSession.UserID,
			Perms:   Permissions{Roles: roles}})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return nil
	}

	// Serve existing with a new token with extended expiry
	err = ServeAuthCookie(w, latestSession.SessionToken, a)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	roles, err := queries.GetRolesForUser(ctx, user.ID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	w.WriteHeader(http.StatusOK)

	err = json.NewEncoder(w).Encode(LoginResponse{
		Message: "Login successful",
		Email:   creds.Email,
		ID:      latestSession.UserID,
		Perms:   Permissions{Roles: roles}})
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}
	return nil

}

func HandleSessionStatus(w http.ResponseWriter, r *http.Request, ctx context.Context, queries *db.Queries, a *AuthParams) error {
	token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
	if err != nil {
		log.Printf("The token provided failed: %v", token)
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return err
	}

	valid, err := VerifySession(ctx, queries, token)
	if err != nil {
		log.Printf("verifying session in HandleSessionStatus failed with %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	if !valid {
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			log.Printf("writing json in HandleSessionStatus failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return nil
	} else {
		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("getting session by token in HandleSessionStatus failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		roles, err := queries.GetRolesForUser(ctx, session.UserID)
		if err != nil {
			log.Printf("getting roles for user in HandleSessionStatus failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		user, err := queries.GetUserById(ctx, session.UserID)
		if err != nil {
			log.Printf("getting employee by id for user in HandleSessionStatus failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}

		w.WriteHeader(http.StatusOK)
		err = json.NewEncoder(w).Encode(StatusResponse{
			UserID: session.UserID,
			Email:  user.Email,
			Perms:  Permissions{Roles: roles}})
		if err != nil {
			log.Printf("writing Status Response in HandleSessionStatus failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return nil
	}
}

func HandleRaise(w http.ResponseWriter, r *http.Request, ctx context.Context, queries *db.Queries, a *AuthParams) error {
	initialAdminEmail := os.Getenv("INITIAL_ADMIN_EMAIL")
	token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
	if err != nil {
		log.Printf("The token provided failed: %v", token)
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return err
	}

	valid, err := VerifySession(ctx, queries, token)
	if err != nil {
		log.Printf("verifying session in HandleRaise failed with %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	if !valid {
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			log.Printf("writing json in HandleRaise failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return nil
	} else {
		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("getting session by token in HandleRaise failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}

		user, err := queries.GetUserById(ctx, session.UserID)
		if err != nil {
			log.Printf("getting employee by id for user in HandleSessionStatus failed with %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}

		role, err := queries.GetRoleByName(ctx, RoleAdmin)
		if err != nil {
			log.Printf("error getting role by name in HandleRaise with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		if user.Email == initialAdminEmail {
			err := queries.AssignRoleToUser(ctx, db.AssignRoleToUserParams{
				UserID: user.ID,
				RoleID: role,
			})
			if err != nil {
				log.Printf("error assigning role by name in HandleRaise with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return err
			}
			w.WriteHeader(http.StatusCreated)
			return nil
		} else {
			_, err := queries.CreateNewRoleRequest(ctx, db.CreateNewRoleRequestParams{
				UserID:          user.ID,
				RequestedRoleID: role,
			})
			if err != nil {
				log.Printf("error creating new role request in HandleRaise with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return err
			}
			w.WriteHeader(http.StatusAccepted)
			return nil
		}
	}
}

func HandleGetAllRequests(w http.ResponseWriter, r *http.Request, ctx context.Context, queries *db.Queries, a *AuthParams) error {
	token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
	if err != nil {
		log.Printf("The token provided failed: %v", token)
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			log.Printf("encoding response in HandleGetAllRequests failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		return err
	}

	valid, err := VerifySession(ctx, queries, token)
	if err != nil {
		log.Printf("verifying session in HandleGetAllRequests failed with %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return err
	}

	if !valid {
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			log.Printf("writing json in HandleGetAllRequests failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		return nil
	} else {
		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("getting session by token in HandleRaise failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		user, err := queries.GetUserById(ctx, session.UserID)
		if err != nil {
			log.Printf("getting user by id for user in HandleGetAllRequests failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		userRoles, err := queries.GetRolesForUser(ctx, user.ID)
		if err != nil {
			log.Printf("getting user roles by id for user in HandleGetAllRequests failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		isAdmin := slices.Contains(userRoles, RoleAdmin)

		if !isAdmin {
			log.Printf("user %d has requests HandleGetAllRequests and doesnt have permission to", user.ID)
			w.WriteHeader(http.StatusUnauthorized)
			return errors.New("unauthorised request")
		}

		data, err := queries.GetAllRoleRequestsWithJoin(ctx)
		if err != nil {
			log.Printf("getting all role requests with join in HandleGetAllRequests failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		err = json.NewEncoder(w).Encode(data)
		if err != nil {
			log.Printf("encoding all role requests with join in HandleGetAllRequests failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		return nil
	}
}

func HandleRequestReview(w http.ResponseWriter, r *http.Request, ctx context.Context, queries *db.Queries, a *AuthParams, review db.RoleRequestStatus) error {

	// path id is the id we want to approve and then
	// also need to check that the user is admin
	// it should justoken, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
	// so i need the approver id and the request id and rthe change
	// i also actually need to update the users role
	id := r.PathValue("request_id")
	if id == "" {
		log.Printf("request_id is empty")
		w.WriteHeader(http.StatusBadRequest)
		return errors.New("request_id is empty")
	}
	request_id, err := strconv.ParseInt(id, 10, 32)
	if err != nil {
		log.Printf("request_id is not an integer")
		w.WriteHeader(http.StatusBadRequest)
		return err
	}

	token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
	if err != nil {
		log.Printf("The token provided failed: %v", token)
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			log.Printf("encoding response in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		return err
	}

	valid, err := VerifySession(ctx, queries, token)
	if err != nil {
		log.Printf("verifying session in HandleRequestReview failed with %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return err
	}

	if !valid {
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			log.Printf("writing json in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		return nil
	} else {
		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			log.Printf("getting session by token in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		approver, err := queries.GetUserById(ctx, session.UserID)
		if err != nil {
			log.Printf("getting user by id for user in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		userRoles, err := queries.GetRolesForUser(ctx, approver.ID)
		if err != nil {
			log.Printf("getting user roles by id for user in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		isAdmin := slices.Contains(userRoles, RoleAdmin)

		if !isAdmin {
			log.Printf("user %d has requests HandleRequestReview and doesnt have permission to", approver.ID)
			w.WriteHeader(http.StatusUnauthorized)
			return errors.New("unauthorised request")
		}

		new_row, err := queries.ReviewRequest(ctx, db.ReviewRequestParams{
			ID:     int32(request_id),
			Status: review,
			ApprovedBy: pgtype.Int4{
				Int32: int32(approver.ID),
				Valid: true,
			},
		})
		if err != nil {
			log.Printf("updating row for request in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		adminID, err := queries.GetRoleByName(ctx, RoleAdmin)
		if err != nil {
			log.Printf("getting adminId in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}

		if review == db.RoleRequestStatusAPPROVED {
			err = queries.AssignRoleToUser(ctx, db.AssignRoleToUserParams{
				UserID: new_row.UserID,
				RoleID: adminID,
			})
			if err != nil {
				log.Printf("error assigning role by name in HandleRequestReview with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return err
			}
		}
		if review == db.RoleRequestStatusREJECTED {
			err = queries.RemoveRoleToUser(ctx, db.RemoveRoleToUserParams{
				UserID: new_row.UserID,
				RoleID: adminID,
			})
			if err != nil {
				log.Printf("error removing role by name in HandleRequestReview with %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return err
			}
		}

		err = json.NewEncoder(w).Encode(new_row)
		if err != nil {
			log.Printf("encoding new row in HandleRequestReview failed with %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return err
		}
		return nil
	}
}

func HandleSessionRefresh(w http.ResponseWriter, r *http.Request, ctx context.Context, queries *db.Queries, a *AuthParams) error {
	token, err := ReadEncryptedCookie(r, a.CParams.Name, a.SecretKey)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return err
	}

	valid, err := VerifySession(ctx, queries, token)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}

	if !valid {
		w.WriteHeader(http.StatusUnauthorized)
		err = json.NewEncoder(w).Encode(ErrorResponse{Message: "Invalid session"})
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		return nil
	} else {
		session, err := queries.GetSessionByToken(ctx, token)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		err = HandleNewSession(w, ctx, queries, a, session.UserID)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return err
		}
		// TODO: Potentially we need to expire the previous token from the DB

		return nil
	}
}

func HashPassword(password string, p *HashParams) (string, error) {
	salt, err := GenerateRandomBytes(p.SaltLength)
	if err != nil {
		return "", err
	}
	encodedHash := EncodeHash(password, p, salt)

	return encodedHash, nil
}

func VerifyPassword(password, storedHash string) (match bool, err error) {
	p, salt, hash, err := DecodeHash(storedHash)
	if err != nil {
		return false, err
	}

	otherHash := argon2.IDKey([]byte(password), salt, p.Iterations, p.Memory, p.Parallelism, p.KeyLength)

	if subtle.ConstantTimeCompare(hash, otherHash) == 1 {
		return true, nil
	}
	return false, nil
}

func EncodeHash(password string, p *HashParams, salt []byte) string {
	hash := argon2.IDKey([]byte(password), salt, p.Iterations, p.Memory, p.Parallelism, p.KeyLength)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	encodedHash := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s", argon2.Version, p.Memory, p.Iterations, p.Parallelism, b64Salt, b64Hash)
	return encodedHash
}

func DecodeHash(encodedHash string) (p *HashParams, salt []byte, hash []byte, err error) {
	vals := strings.Split(encodedHash, "$")
	if len(vals) != 6 {
		return nil, nil, nil, ErrInvalidHash
	}

	var version int
	_, err = fmt.Sscanf(vals[2], "v=%d", &version)
	if err != nil {
		return nil, nil, nil, err
	}
	if version != argon2.Version {
		return nil, nil, nil, ErrIncompatibleVersion
	}

	p = &HashParams{}
	_, err = fmt.Sscanf(vals[3], "m=%d,t=%d,p=%d", &p.Memory, &p.Iterations, &p.Parallelism)
	if err != nil {
		return nil, nil, nil, ErrInvalidHash
	}

	salt, err = base64.RawStdEncoding.DecodeString(vals[4])
	if err != nil {
		return nil, nil, nil, ErrInvalidHash
	}
	p.SaltLength = uint32(len(salt))

	hash, err = base64.RawStdEncoding.DecodeString(vals[5])
	if err != nil {
		return nil, nil, nil, ErrInvalidHash
	}
	p.KeyLength = uint32(len(hash))

	return p, salt, hash, nil
}

func GenerateSessionToken(n uint32) (string, error) {
	if n == 0 {
		return "", ErrInvalidTokenLength
	}
	b, err := GenerateRandomBytes(n)
	if err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}

func IsTokenCurrent(expiry pgtype.Timestamp) (bool, error) {
	if !expiry.Valid {
		return false, errors.New("invalid expiry timestamp")
	}

	now := time.Now().UTC()

	isCurr := now.Before(expiry.Time)

	return isCurr, nil

}

func handleEarlyLogout(w http.ResponseWriter, a *AuthParams) error {
	err := InvalidateAuthCookie(w, a)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(LogoutResponse{Message: "Logged out successfully"})
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return err
	}
	return nil
}

func InvalidateAuthCookie(w http.ResponseWriter, a *AuthParams) error {
	cookie := &http.Cookie{
		Name:     a.CParams.Name,
		Value:    "",
		Path:     a.CParams.Path,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
		HttpOnly: a.CParams.HttpOnly,
		Secure:   a.CParams.Secure,
		SameSite: a.CParams.SameSite,
	}
	http.SetCookie(w, cookie)
	return nil
}

func ServeAuthCookie(w http.ResponseWriter, token string, a *AuthParams) error {
	cookie := http.Cookie{
		Name:     a.CParams.Name,
		Value:    token,
		Path:     a.CParams.Path,
		MaxAge:   int(a.SessionDuration) * 60 * 60,
		HttpOnly: a.CParams.HttpOnly,
		Secure:   a.CParams.Secure,
		SameSite: a.CParams.SameSite,
	}
	err := WriteEncryptedCookie(w, &cookie, a.SecretKey)
	if err != nil {
		return err
	}
	return nil
}

func HandleNewSession(w http.ResponseWriter, ctx context.Context, queries *db.Queries, a *AuthParams, userId int32) error {
	// Create Session Token
	token, err := GenerateSessionToken(a.TokenLength)
	if err != nil {
		return err
	}
	expiryTime := time.Now().UTC().Add(time.Duration(a.SessionDuration) * time.Hour)
	// Write Session to DB
	_, err = queries.CreateSession(ctx, db.CreateSessionParams{
		UserID:       userId,
		SessionToken: token,
		ExpiresAt:    pgtype.Timestamp{Time: expiryTime, Valid: true},
	})
	if err != nil {
		return err
	}
	err = ServeAuthCookie(w, token, a)
	if err != nil {
		return err
	}
	return nil
}

func VerifySession(ctx context.Context, queries *db.Queries, cookieToken string) (bool, error) {
	session, err := queries.GetSessionByToken(ctx, cookieToken)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return false, err
	}
	if errors.Is(err, pgx.ErrNoRows) || session.SessionToken != cookieToken {
		return false, nil
	}
	isCurr, err := IsTokenCurrent(session.ExpiresAt)
	if err != nil {
		return false, err
	}
	if !isCurr {
		return false, nil
	}
	return true, nil
}

func GenerateRandomBytes(n uint32) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}

	return b, nil
}
