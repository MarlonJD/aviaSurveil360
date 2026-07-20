# Go Ve PostgreSQL Temel Kanıtı — 2026-07-21

## Sonuç

- Kanıt durumu: `verified locally`
- Artefakt durumu: `candidate-only`
- Sürüm durumu: `release pending`
- Üretim dağıtımı, cutover ve eski demonun kaldırılması: `blocked`
- Kanonik domain geçişleri, gerçek OIDC, nesne yükleme/tarama, gerçek HTTP eşliği, çevrimdışı depolama, sync ve üretim operasyonları: `not run`

Task 9, sonraki dilim davranışlarını tamamlanmış saymadan tek modüllü Go runtime ve PostgreSQL temelini kurar. Kök Vanilla demo davranış referansı olarak korunmuştur.

## Test-First Kanıtı

İlk testler hedeflenen eksik yetenekler nedeniyle başarısız oldu: kontrol edilen Go OpenAPI üreticisi/çıktısı, Go runtime paketleri, sözleşmede kapalı başarısız olan readiness yanıtı, platform session/idempotency/audit/outbox sınırları ve sabitlenmiş yerel PostgreSQL profili yoktu. İlk tam profil ayrıca gerçek bir üretici kusurunu yakaladı: `pushFieldOperation` operasyon isteği `PushFieldOperationRequest` şemasıyla çakışıyordu. Operasyon tipleri ayrı bir üretilen ad alanına alındıktan sonra tam profil geçti.

## Doğrulanan Temel

- Bağımsız derlenebilen `cmd/api` ve `cmd/worker` komutlarını içeren Go `1.26` modülü.
- `chi` sağlık yönlendirmesi ve `pgx` pool/transaction ilkelleri.
- PostgreSQL'den bağımsız liveness; erişilemeyen bağımlılık veya uyumsuz migration sürümünde kapalı başarısız olan readiness.
- Production yapılandırmasında test principal, test session ve development-secret bypass reddi.
- Açık test yapılandırmasında tek bir deterministik PostgreSQL identity/session çifti; idempotent bootstrap boyunca korunan ilk sekiz saatlik süre ve production yapılandırmasından erişilemezlik.
- TypeScript ile aynı OpenAPI 3.1 kaynağından sürümlü Go request/response/model/handler üretimi, SHA-256 kaynak bağı ve temiz yeniden üretim kontrolü.
- Go tool grafiğinde kilitli SQLC `1.30.0`, modül sahipli Organization/Inspection sorgu paketleri ve temiz yeniden üretim kontrolü.
- Task 9 platform/workflow tablolarını kapsayan iki ileri yönlü migration; canlı PostgreSQL üzerinde boş kurulum ve saklanan N-1 yükseltme kontrolü.
- Çoklu mimari digest'e sabitlenmiş PostgreSQL `17.6-alpine3.22`, izole volume, health check, deterministik kimlik bilgileri ve cleanup trap.

## Taze Doğrulama

Son komut:

```bash
./scripts/test-http-profile.sh
```

Komut `0` çıkış koduyla tamamlandı ve şunları kanıtladı:

- API ve worker build: geçti
- Go race suite: geçti
- Boş migration kurulumu: geçti
- Saklanan N-1 yükseltme fixture'ı: geçti
- Health/config/platform testleri: geçti
- Deterministik test identity/session bootstrap: geçti
- OpenAPI örnekleri ve TypeScript/Go üretim drift'i: geçti
- SQLC üretim drift'i: geçti
- Task'e ait PostgreSQL container, network ve volume temizliği: geçti

Bu kanıt yalnızca yerel aday temelini destekler. `production-ready` iddiası ayrı release/operations kapısında `blocked` kalır.
