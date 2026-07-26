package database

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5"
)

func TestOpenWithTracerInstallsTheQueryTracer(t *testing.T) {
	t.Parallel()

	tracer := queryTracerStub{}
	pool, err := OpenWithTracer(
		context.Background(),
		"postgres://127.0.0.1/aviasurveil360?connect_timeout=1",
		tracer,
	)
	if err != nil {
		t.Fatalf("OpenWithTracer() error = %v", err)
	}
	t.Cleanup(pool.Close)
	if pool.Config().ConnConfig.Tracer == nil {
		t.Fatal("query tracer was not installed")
	}
}

type queryTracerStub struct{}

func (queryTracerStub) TraceQueryStart(
	ctx context.Context,
	_ *pgx.Conn,
	_ pgx.TraceQueryStartData,
) context.Context {
	return ctx
}

func (queryTracerStub) TraceQueryEnd(
	context.Context,
	*pgx.Conn,
	pgx.TraceQueryEndData,
) {
}
