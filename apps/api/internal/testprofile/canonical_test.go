package testprofile

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
)

func TestRetryCanonicalResetRetriesOnlyPostgresDeadlocks(t *testing.T) {
	t.Run("deadlock then success", func(t *testing.T) {
		attempts := 0
		err := retryCanonicalReset(context.Background(), func() error {
			attempts++
			if attempts == 1 {
				return &pgconn.PgError{Code: "40P01", Message: "deadlock detected"}
			}
			return nil
		})
		if err != nil || attempts != 2 {
			t.Fatalf("retry result = attempts %d, err %v", attempts, err)
		}
	})

	t.Run("non-deadlock fails without retry", func(t *testing.T) {
		expected := errors.New("seed validation failed")
		attempts := 0
		err := retryCanonicalReset(context.Background(), func() error {
			attempts++
			return expected
		})
		if !errors.Is(err, expected) || attempts != 1 {
			t.Fatalf("non-deadlock result = attempts %d, err %v", attempts, err)
		}
	})

	t.Run("deadlock retry is bounded", func(t *testing.T) {
		attempts := 0
		err := retryCanonicalReset(context.Background(), func() error {
			attempts++
			return &pgconn.PgError{Code: "40P01", Message: "deadlock detected"}
		})
		var postgresError *pgconn.PgError
		if !errors.As(err, &postgresError) || postgresError.Code != "40P01" || attempts != 3 {
			t.Fatalf("bounded retry result = attempts %d, err %v", attempts, err)
		}
	})
}
