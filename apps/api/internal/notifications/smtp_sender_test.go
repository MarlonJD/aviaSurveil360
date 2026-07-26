package notifications

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net"
	"strings"
	"sync"
	"testing"
	"time"
)

type smtpFixture struct {
	address string
	body    string
	mu      sync.Mutex
	close   func()
}

func startSMTPFixture(
	t *testing.T,
	rcptStatus string,
	holdData bool,
) *smtpFixture {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen SMTP fixture: %v", err)
	}
	fixture := &smtpFixture{
		address: listener.Addr().String(),
		close:   func() { _ = listener.Close() },
	}
	t.Cleanup(fixture.close)
	go func() {
		connection, acceptErr := listener.Accept()
		if acceptErr != nil {
			return
		}
		defer connection.Close()
		reader := bufio.NewReader(connection)
		writer := bufio.NewWriter(connection)
		write := func(value string) {
			_, _ = writer.WriteString(value)
			_ = writer.Flush()
		}
		write("220 smtp.fixture ESMTP\r\n")
		for {
			line, readErr := reader.ReadString('\n')
			if readErr != nil {
				return
			}
			switch {
			case strings.HasPrefix(line, "EHLO"):
				write("250-smtp.fixture\r\n250-AUTH PLAIN\r\n250 OK\r\n")
			case strings.HasPrefix(line, "AUTH PLAIN"):
				write("235 2.7.0 authenticated\r\n")
			case strings.HasPrefix(line, "MAIL FROM"):
				write("250 2.1.0 sender accepted\r\n")
			case strings.HasPrefix(line, "RCPT TO"):
				if rcptStatus != "" {
					write(rcptStatus + "\r\n")
					return
				}
				write("250 2.1.5 recipient accepted\r\n")
			case strings.HasPrefix(line, "DATA"):
				write("354 send message\r\n")
				if holdData {
					_, _ = io.Copy(io.Discard, reader)
					return
				}
				var message strings.Builder
				for {
					dataLine, dataErr := reader.ReadString('\n')
					if dataErr != nil {
						return
					}
					if dataLine == ".\r\n" {
						break
					}
					message.WriteString(dataLine)
				}
				fixture.mu.Lock()
				fixture.body = message.String()
				fixture.mu.Unlock()
				write("250 2.0.0 queued\r\n")
			case strings.HasPrefix(line, "QUIT"):
				write("221 2.0.0 bye\r\n")
				return
			default:
				write("250 OK\r\n")
			}
		}
	}()
	return fixture
}

func TestSMTPSenderDeliversBoundedMultipartMessageWithStableMessageID(t *testing.T) {
	t.Parallel()
	fixture := startSMTPFixture(t, "", false)
	sender, err := NewSMTPSender(SMTPConfig{
		Address: fixture.address, From: "no-reply@aviasurveil360.local",
		Username: "aviasurveil360", Password: "test-secret",
		Timeout: time.Second, PrivateNetwork: true,
	})
	if err != nil {
		t.Fatalf("NewSMTPSender() error = %v", err)
	}
	err = sender.Deliver(context.Background(), EmailDelivery{
		JobID: "job-001", NotificationID: "notification-001",
		RecipientSubjectID: "auditee-001",
		RecipientEmail:     "auditee@example.test",
		RecipientAudience:  EmailAudienceAuditee,
		OrganizationID:     "ORG-001",
		Title:              "CAP update",
		Body:               "Open the authorized record.",
		RelatedEntityType:  "FINDING",
		RelatedEntityID:    "FND-001",
		ProviderMessageID:  "<notification-job-001@aviasurveil360.local>",
		Attempt:            1,
	})
	if err != nil {
		t.Fatalf("Deliver() error = %v", err)
	}
	fixture.mu.Lock()
	message := fixture.body
	fixture.mu.Unlock()
	for _, expected := range []string{
		"Message-ID: <notification-job-001@aviasurveil360.local>",
		"To: auditee@example.test",
		"Subject: CAP update",
		"multipart/alternative",
		"Open the authorized record.",
	} {
		if !strings.Contains(message, expected) {
			t.Fatalf("SMTP message omitted %q:\n%s", expected, message)
		}
	}
	if strings.Contains(message, "test-secret") {
		t.Fatal("SMTP message leaked credentials")
	}
}

func TestSMTPSenderClassifiesRefusalAndTimeoutWithoutLeakingProviderText(t *testing.T) {
	t.Parallel()
	refusing := startSMTPFixture(t, "550 5.1.1 private provider detail", false)
	sender, err := NewSMTPSender(SMTPConfig{
		Address: refusing.address, From: "no-reply@aviasurveil360.local",
		Username: "aviasurveil360", Password: "test-secret",
		Timeout: time.Second, PrivateNetwork: true,
	})
	if err != nil {
		t.Fatalf("NewSMTPSender() error = %v", err)
	}
	delivery := EmailDelivery{
		JobID: "job-refused", NotificationID: "notification-refused",
		RecipientSubjectID: "auditee-refused",
		RecipientEmail:     "refused@example.test",
		RecipientAudience:  EmailAudienceAuditee,
		Title:              "Notification",
		Body:               "Open the authorized record.",
		ProviderMessageID:  "<notification-job-refused@aviasurveil360.local>",
	}
	err = sender.Deliver(context.Background(), delivery)
	if err == nil || !IsPermanentDeliveryFailure(err) ||
		DeliveryFailureCode(err) != "SMTP_RECIPIENT_REJECTED" {
		t.Fatalf("SMTP refusal classification = %T %v", err, err)
	}
	if strings.Contains(err.Error(), "private provider detail") {
		t.Fatalf("SMTP refusal leaked provider response: %v", err)
	}

	holding := startSMTPFixture(t, "", true)
	timeoutSender, err := NewSMTPSender(SMTPConfig{
		Address: holding.address, From: "no-reply@aviasurveil360.local",
		Username: "aviasurveil360", Password: "test-secret",
		Timeout: 50 * time.Millisecond, PrivateNetwork: true,
	})
	if err != nil {
		t.Fatalf("NewSMTPSender(timeout) error = %v", err)
	}
	timeoutDelivery := delivery
	timeoutDelivery.JobID = "job-timeout"
	timeoutDelivery.ProviderMessageID = "<notification-job-timeout@aviasurveil360.local>"
	err = timeoutSender.Deliver(context.Background(), timeoutDelivery)
	if err == nil || IsPermanentDeliveryFailure(err) ||
		DeliveryFailureCode(err) != "SMTP_DATA_REJECTED_TIMEOUT" {
		t.Fatalf("SMTP timeout classification = %T %v", err, err)
	}
	if strings.Contains(err.Error(), holding.address) ||
		strings.Contains(err.Error(), "test-secret") {
		t.Fatalf("SMTP timeout leaked transport detail: %v", err)
	}
}

func TestSMTPSenderRequiresExplicitPrivateNetworkForPlaintextCredentials(t *testing.T) {
	t.Parallel()
	_, err := NewSMTPSender(SMTPConfig{
		Address: "mailpit:1025", From: "no-reply@aviasurveil360.local",
		Username: "aviasurveil360", Password: "test-secret",
		Timeout: time.Second,
	})
	if err == nil || !strings.Contains(err.Error(), "private network") {
		t.Fatalf("plaintext SMTP config error = %v", err)
	}
}

func ExampleDeliveryFailureCode() {
	err := NewPermanentDeliveryFailure("SMTP_RECIPIENT_REJECTED")
	fmt.Println(DeliveryFailureCode(err))
	// Output: SMTP_RECIPIENT_REJECTED
}
