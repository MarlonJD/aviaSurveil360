# Evidence Repository — Türkçe

## Amaç

Demo Evidence filename kayıtlarını version history korunarak review eder.

## Ana alanlar

- Evidence ID
- File name
- File type
- Version
- Uploaded by
- Upload date
- Review status
- Review comment

## Ana aksiyonlar

- Upload
- Replace/supersede
- Latest version review et
- Close
- Partially Close
- Not Close

## İş kuralları

- Never delete submitted evidence
- Old evidence marked superseded
- Reject requires reason
- Internal notes separate from auditee comments
- Close evidence-verified Finding closure kaydeder; Partially Close ve Not
  Close Finding'i açık tutar
- Frontend-only demo dosya değil, yalnız filename saklar

## UX yönü

Ekran secondary detail öncesinde status, owner, due date ve next action göstermeli. Advanced configuration admin permission arkasında kalmalı.

## MVP acceptance criteria

- Operator audit demo senaryosunu destekler.
- Kritik aksiyonlar audit log'a yazılır.
- Auditee-visible ve internal bilgi ayrılır.
- Kullanıcı primary task'ı ekrandan çıkmadan tamamlayabilir.
