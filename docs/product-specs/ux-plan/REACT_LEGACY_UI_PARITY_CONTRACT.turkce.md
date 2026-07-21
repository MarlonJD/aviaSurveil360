# React Legacy UI Parity Sozlesmesi

## Durum

Durum: `candidate-only`, `release pending`.

Bu sozlesme AviaSurveil360 icin mevcut React iyilestirme kapsamını sabitler.
Stakeholder kabulü, production hazirligi, deploy, trafik kesintisi veya legacy
demo kaldirma iddiasi degildir.

## Kullanici Sonucu

Kabul edilmis root Vanilla arayuzu gorsel ve davranissal oracle olarak kalir.
Mevcut React candidate, zaten route edilmis 17 yuzeyi kabul edilen root
workbench ile taninir bicimde eslestirmeli ve bunu yaparken React/Go candidate
otorite, privacy, offline ve artifact sinirlarini korumalidir.

Bu tam bir 86 ekranlik React replacement degildir. Commit edilen source
inventory 86 audit satirinin tamamini icerir, fakat bu planda yalniz 17 satir
`react-parity` olarak siniflandirilir. Kalan 69 satir, Product tam bir
route-family dilimini onaylayana kadar yalniz saglam root demoda erisilebilir.

## Baglayici Kapsam

- 86 sirali audit satiri yalniz
  `docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md` kaynagindan cikarilir.
- 17 satir `apps/web/src/app/route-contracts.ts` altindaki typed React route
  contracts ile eslesir.
- 69 satir `reactPath: null`, `reactSurfaceId: null` ve bos reference screenshot
  ID listesiyle kalir.
- `New Inspection Planning Intake`, Department Manager Planning ile
  `ui-audit-047` - `ui-audit-051` satirlarina baglanir; bu wizard satirlari
  `later-legacy-only` kalir.
- Bu planda intake flow icin React create/intake control veya placeholder route
  eklenemez.

## Kaynak Onceligi

1. `AGENTS.md` ve `docs/product-specs/` altindaki product/security/data
   otoritesi.
2. Dogrulanmis root behavior testleri ve kabul edilmis browser-scenario kaniti.
3. Root `index.html`, `css/styles.css` ve `js/` davranisi.
4. Sirali 86 satirlik audit ve kritik `qa/screenshots/` kaniti.
5. Tarihsel planlar veya screenshot'lar.

Gorsel kopyalama hicbir zaman otorite, privacy, lifecycle, immutable history,
truthful action state veya offline recovery kurallarini gecersiz kilmaz.

## Gorsel Ve Aksiyon Kurallari

- Otomatik screenshot'lar gorsel migration oncesi tracked ve hash-verified
  legacy baseline kullanir.
- Shell diff ratio en fazla `0.03` olmalidir.
- `content-adapted` bolgeler yalniz onceden ilan edilmis semantic ve geometry
  kanitiyle en fazla `0.08` kullanabilir.
- Mask'ler explicit, leaf-scoped olmali, genis shell/body selector'larini
  reddetmeli ve viewport pixel'lerinin en fazla yuzde 5'ini kapsamalidir.
- Her gorunur control Backend, beyan edilmis local/offline boundary,
  navigation, form davranisi veya gorunur local state uzerinden calismali ya da
  exact reason ile disabled olmalidir.
- Yalniz toast feedback, etiketli bir aksiyonu karsilamaz.

## Privacy Ve Lifecycle

- Potential Finding donusumu Lead Inspector otoritesi olarak kalir.
- CAP acceptance, Finding closure degildir.
- CAP revisions, Evidence versions, checklist-template versions ve report
  versions immutable kalir.
- Auditee projection'lari organization-scoped olmali ve `Internal CAA Note`
  alanini yapisal olarak disarida birakmalidir.
- `Comment to Auditee` ve `Internal CAA Note` ayri kalir.
- Report issue, Finding kapatmaz.
- Offline field work local, pending, acknowledged, conflict ve rejected
  durumlarini ayirmalidir.

## Gelecek Route Promotion Kurali

Legacy-only bir satir yalniz Product authority, OpenAPI, generated transport,
mock ve Go persistence/authorization, React route/UI, mock ve HTTP browser
testleri, privacy testleri, visible-action kaniti, guncellenmis manifest
disposition'i ve senkronize English/Turkish evidence iceren incelenmis bir
dilimle promote edilebilir. Route-name parity tek basina yeterli degildir.
