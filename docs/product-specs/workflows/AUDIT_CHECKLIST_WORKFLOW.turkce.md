# Audit Checklist Workflow — Türkçe

## Amaç

Inspector'ların exact Audit checklist'ini yürütmesini ve Non-Compliant veya
Observation sonuçlarından review edilebilir Potential Finding göndermesini
sağlar.

## Adımlar

1. Open audit
2. Start checklist
3. Answer question
4. Zorunlu comment ve isteğe bağlı mock Evidence filename ekle
5. Uygun sonuç için audit-scoped Potential Finding oluştur
6. Lead Inspector Potential Finding'i return, dismiss veya convert eder
7. Section'ı tamamla
8. Checklist'i submit et
9. Draft report oluştur

## Kurallar

- Answers: Compliant, Non-Compliant, Observation, Not Applicable, Not Checked
- Non-Compliant ve Observation, yalnız exact Audit için zorunlu comment
  kaydedildikten sonra `Create Potential Finding` sunar
- Kanonik Finding'i Lead conversion oluşturur; Inspector execution doğrudan
  issue etmez veya rol değiştirmez
- Her configured checklist control yalnız exact Audit'e yazar; execution
  package bulunmayan template açıkça disabled gösterilir
- Submitted checklist yalnız Inspector veya Lead Inspector valid stage'de bir
  reason kaydederek reopen ederse tekrar düzenlenebilir

## UX notları

- Current owner, due date ve next action ekranın üstünde gösterilmeli.
- History timeline/tab içinde kalmalı, primary content olmamalı.
- Primary button next action ile aynı dili kullanmalı.
