package notifications

import (
	"reflect"
	"strings"
	"testing"
)

func TestAuditeeTemplateIsBoundedEscapedAndCannotReceiveInternalCAAFields(t *testing.T) {
	t.Parallel()

	rendered, err := RenderAuditeeEmail(AuditeeTemplateData{
		Title:             `CAP <script>alert("x")</script>`,
		Summary:           `Open the authorized <record> for the requested Evidence.`,
		OrganizationName:  `Fly & Namibia`,
		RelatedRecordType: "FINDING",
		RelatedRecordID:   "FND-001",
	})
	if err != nil {
		t.Fatalf("RenderAuditeeEmail() error = %v", err)
	}
	if strings.Contains(rendered.HTML, "<script>") ||
		strings.Contains(rendered.HTML, "<record>") ||
		!strings.Contains(rendered.HTML, "&lt;script&gt;") ||
		!strings.Contains(rendered.HTML, "Fly &amp; Namibia") {
		t.Fatalf("Auditee HTML was not escaped: %s", rendered.HTML)
	}
	if strings.Contains(strings.ToLower(rendered.HTML), "internal caa note") ||
		strings.Contains(strings.ToLower(rendered.Text), "enforcement deliberation") {
		t.Fatalf("Auditee template leaked internal-only content: %+v", rendered)
	}
	auditeeType := reflect.TypeOf(AuditeeTemplateData{})
	for index := 0; index < auditeeType.NumField(); index++ {
		fieldName := strings.ToLower(auditeeType.Field(index).Name)
		if strings.Contains(fieldName, "internal") ||
			strings.Contains(fieldName, "enforcement") ||
			strings.Contains(fieldName, "risk") {
			t.Fatalf("Auditee template accepts forbidden field %q", fieldName)
		}
	}

	_, err = RenderAuditeeEmail(AuditeeTemplateData{
		Title:   strings.Repeat("T", MaximumEmailTitleBytes+1),
		Summary: "bounded",
	})
	if err == nil || !strings.Contains(err.Error(), "title") {
		t.Fatalf("oversized title error = %v", err)
	}
}

func TestInternalCAATemplateKeepsInternalContextInTheCAAArtifact(t *testing.T) {
	t.Parallel()

	rendered, err := RenderInternalCAAEmail(InternalCAATemplateData{
		Title:           "Potential Finding review",
		Summary:         "Open the authorized record.",
		InternalContext: "Internal CAA Note: enforcement deliberation remains CAA-only.",
		RelatedRecordID: "PF-001",
	})
	if err != nil {
		t.Fatalf("RenderInternalCAAEmail() error = %v", err)
	}
	if !strings.Contains(rendered.Text, "Internal CAA Note") ||
		!strings.Contains(rendered.HTML, "Internal CAA Note") {
		t.Fatalf("CAA template omitted internal context: %+v", rendered)
	}
}
