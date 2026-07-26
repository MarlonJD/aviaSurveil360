package documents

import (
	"bytes"
	"strings"
	"testing"
)

func TestReportTemplateIsServerOwnedVersionedEscapedAndAdvisoryOnly(t *testing.T) {
	t.Parallel()
	snapshot := validRenderSnapshot()
	snapshot.Kind = "CLOSURE"
	snapshot.ReportID = `Closure & <unsafe>`
	snapshot.FindingIDs = []string{`FND-"quoted"`}

	html, templateHash, sourceHash, err := renderReportHTML(snapshot)
	if err != nil {
		t.Fatalf("renderReportHTML() error = %v", err)
	}
	if !bytes.Contains(html, []byte("AviaSurveil360")) ||
		!bytes.Contains(html, []byte("CLOSURE REPORT")) ||
		!bytes.Contains(html, []byte("REPORT-VERSION-001")) ||
		!bytes.Contains(html, []byte("sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")) {
		t.Fatalf("rendered template missing exact version source:\n%s", html)
	}
	if bytes.Contains(html, []byte(`<unsafe>`)) ||
		!bytes.Contains(html, []byte("&lt;unsafe&gt;")) ||
		!bytes.Contains(html, []byte("FND-&#34;quoted&#34;")) {
		t.Fatalf("rendered template did not HTML-escape source values:\n%s", html)
	}
	if !strings.HasPrefix(templateHash, "sha256:") ||
		!strings.HasPrefix(sourceHash, "sha256:") ||
		templateHash == sourceHash {
		t.Fatalf("template/source hashes = %q / %q", templateHash, sourceHash)
	}

	lower := strings.ToLower(string(html))
	for _, forbidden := range []string{
		"digitally signed",
		"electronic signature",
		"legally binding",
		"rendering approved",
		"rendering closed",
	} {
		if strings.Contains(lower, forbidden) {
			t.Fatalf("rendered template contains forbidden authority claim %q", forbidden)
		}
	}
	if !strings.Contains(lower, "does not approve, sign, close, or confer legal validity") {
		t.Fatalf("rendered template lacks explicit non-authority boundary:\n%s", html)
	}
}

func TestReportTemplateRejectsIncompleteOrUnsupportedSourceSnapshots(t *testing.T) {
	t.Parallel()
	cases := map[string]RenderSnapshot{
		"missing exact report version": {
			ReportID: "RPT-1", Kind: "FINAL", OrganizationID: "ORG-1",
			AuditID: "AUD-1", ContentHash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc", Version: 1,
			CreatedBySubject: "subject-1",
		},
		"unsupported kind": {
			ReportVersionID: "RPT-V1", ReportID: "RPT-1", Kind: "CERTIFICATE",
			OrganizationID: "ORG-1", AuditID: "AUD-1", ContentHash: "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
			Version: 1, CreatedBySubject: "subject-1",
		},
		"missing source hash": {
			ReportVersionID: "RPT-V1", ReportID: "RPT-1", Kind: "FINAL",
			OrganizationID: "ORG-1", AuditID: "AUD-1", Version: 1,
			CreatedBySubject: "subject-1",
		},
	}
	for name, snapshot := range cases {
		t.Run(name, func(t *testing.T) {
			if _, _, _, err := renderReportHTML(snapshot); err == nil {
				t.Fatal("renderReportHTML() unexpectedly succeeded")
			}
		})
	}
}
