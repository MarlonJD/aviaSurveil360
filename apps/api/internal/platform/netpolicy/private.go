package netpolicy

import (
	"net"
	"strings"
)

// IsPrivateHost accepts loopback/private IPs and names scoped to a local
// container, workstation, or service-discovery domain.
func IsPrivateHost(host string) bool {
	normalized := strings.ToLower(strings.TrimSuffix(strings.TrimSpace(host), "."))
	if normalized == "" {
		return false
	}
	if address := net.ParseIP(normalized); address != nil {
		return address.IsPrivate() || address.IsLoopback() || address.IsLinkLocalUnicast()
	}
	if normalized == "localhost" || strings.HasSuffix(normalized, ".localhost") {
		return true
	}
	if !strings.Contains(normalized, ".") {
		return true
	}
	for _, suffix := range []string{".internal", ".local", ".svc", ".cluster.local"} {
		if strings.HasSuffix(normalized, suffix) {
			return true
		}
	}
	return false
}
