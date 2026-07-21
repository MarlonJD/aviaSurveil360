package main

import (
	"context"
	"errors"
	"testing"
)

type scriptedProcessor struct {
	results []bool
	errAt   int
	calls   int
}

func (processor *scriptedProcessor) ProcessNext(context.Context) (bool, error) {
	processor.calls++
	if processor.errAt > 0 && processor.calls == processor.errAt {
		return false, errors.New("scanner unavailable")
	}
	if len(processor.results) == 0 {
		return false, nil
	}
	result := processor.results[0]
	processor.results = processor.results[1:]
	return result, nil
}

func TestProcessAvailableReportsBatchCountAndFailure(t *testing.T) {
	t.Parallel()
	processor := &scriptedProcessor{results: []bool{true, true, false}}
	processed, err := processAvailable(context.Background(), processor)
	if err != nil || processed != 2 || processor.calls != 3 {
		t.Fatalf("processAvailable() = (%d, %v), calls %d", processed, err, processor.calls)
	}

	failing := &scriptedProcessor{results: []bool{true}, errAt: 2}
	processed, err = processAvailable(context.Background(), failing)
	if err == nil || processed != 1 || failing.calls != 2 {
		t.Fatalf("failing processAvailable() = (%d, %v), calls %d", processed, err, failing.calls)
	}
}
