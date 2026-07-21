package uploadpolicy

import "testing"

func TestValidateDeclarationAcceptsCanonicalPlainFileName(t *testing.T) {
	if err := ValidateDeclaration(
		"Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf",
		"application/pdf",
		64,
		25*1024*1024,
		"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	); err != nil {
		t.Fatalf("canonical plain file name rejected: %v", err)
	}
}

func TestValidateDeclarationRejectsPathCharacters(t *testing.T) {
	for _, fileName := range []string{"../record.pdf", `folder\\record.pdf`, "record\x00.pdf"} {
		if err := ValidateDeclaration(
			fileName,
			"application/pdf",
			64,
			25*1024*1024,
			"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		); err == nil {
			t.Fatalf("path-shaped file name %q accepted", fileName)
		}
	}
}
