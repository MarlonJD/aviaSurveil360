package assistant

import (
	"context"
	"fmt"
)

const DeterministicProviderID = "deterministic-advisory-v1"

type DeterministicProvider struct{}

func NewDeterministicProvider() DeterministicProvider {
	return DeterministicProvider{}
}

func (DeterministicProvider) Generate(
	_ context.Context,
	request ProviderRequest,
) (ProviderResponse, error) {
	return ProviderResponse{
		Text: fmt.Sprintf(
			"Advisory draft for %s: review the configured finding basis and request only the expected evidence.",
			request.FindingReference,
		),
		ProviderID: DeterministicProviderID,
	}, nil
}
