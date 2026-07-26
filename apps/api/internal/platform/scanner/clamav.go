package scanner

import (
	"bufio"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"strings"
	"time"
)

const (
	defaultDialTimeout = 5 * time.Second
	defaultChunkSize   = 64 * 1024
)

type ClamAVConfig struct {
	Address             string
	DialTimeout         time.Duration
	MaximumSignatureAge time.Duration
	Clock               func() time.Time
}

type ClamAV struct {
	address             string
	dialTimeout         time.Duration
	maximumSignatureAge time.Duration
	clock               func() time.Time
}

type versionInfo struct {
	engine       string
	signatures   string
	databaseTime time.Time
}

func NewClamAV(config ClamAVConfig) (*ClamAV, error) {
	if strings.TrimSpace(config.Address) == "" {
		return nil, errors.New("ClamAV address is required")
	}
	if config.MaximumSignatureAge <= 0 {
		return nil, errors.New("ClamAV maximum signature age must be positive")
	}
	dialTimeout := config.DialTimeout
	if dialTimeout <= 0 {
		dialTimeout = defaultDialTimeout
	}
	clock := config.Clock
	if clock == nil {
		clock = time.Now
	}
	return &ClamAV{
		address:             strings.TrimSpace(config.Address),
		dialTimeout:         dialTimeout,
		maximumSignatureAge: config.MaximumSignatureAge,
		clock:               clock,
	}, nil
}

func (client *ClamAV) Ready(ctx context.Context) error {
	response, err := client.command(ctx, "zPING\x00")
	if err != nil {
		return fmt.Errorf("ClamAV PING: %w", err)
	}
	if response != "PONG" {
		return fmt.Errorf("ClamAV PING returned %q", response)
	}
	_, err = client.currentVersion(ctx)
	return err
}

func (client *ClamAV) Scan(ctx context.Context, reader io.Reader) (Result, error) {
	if reader == nil {
		return Result{}, errors.New("ClamAV scan reader is required")
	}
	version, err := client.currentVersion(ctx)
	if err != nil {
		return Result{}, err
	}
	connection, err := client.dial(ctx)
	if err != nil {
		return Result{}, fmt.Errorf("connect to ClamAV: %w", err)
	}
	defer connection.Close()
	if _, err := io.WriteString(connection, "zINSTREAM\x00"); err != nil {
		return Result{}, client.contextError(ctx, "start ClamAV INSTREAM", err)
	}
	buffer := make([]byte, defaultChunkSize)
	for {
		count, readErr := reader.Read(buffer)
		if count > 0 {
			if err := binary.Write(connection, binary.BigEndian, uint32(count)); err != nil {
				return Result{}, client.contextError(ctx, "write ClamAV chunk length", err)
			}
			if _, err := connection.Write(buffer[:count]); err != nil {
				return Result{}, client.contextError(ctx, "write ClamAV chunk", err)
			}
		}
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return Result{}, fmt.Errorf("read scan input: %w", readErr)
		}
	}
	if err := binary.Write(connection, binary.BigEndian, uint32(0)); err != nil {
		return Result{}, client.contextError(ctx, "finish ClamAV INSTREAM", err)
	}
	response, err := bufio.NewReader(connection).ReadString(0)
	if err != nil {
		return Result{}, client.contextError(ctx, "read ClamAV scan result", err)
	}
	response = strings.TrimSuffix(response, "\x00")
	result := Result{
		EngineVersion:    version.engine,
		SignatureVersion: version.signatures,
		ScannedAt:        client.clock().UTC(),
	}
	switch {
	case strings.HasSuffix(response, ": OK"):
		result.Clean = true
		return result, nil
	case strings.HasSuffix(response, " FOUND"):
		signature := strings.TrimSuffix(response, " FOUND")
		if _, value, ok := strings.Cut(signature, ": "); ok {
			signature = value
		}
		result.Reason = signature
		return result, nil
	case strings.HasSuffix(response, " ERROR"):
		return Result{}, fmt.Errorf("ClamAV scan failed: %s", response)
	default:
		return Result{}, fmt.Errorf("unrecognized ClamAV scan response %q", response)
	}
}

func (client *ClamAV) currentVersion(ctx context.Context) (versionInfo, error) {
	response, err := client.command(ctx, "zVERSION\x00")
	if err != nil {
		return versionInfo{}, fmt.Errorf("read ClamAV version: %w", err)
	}
	parts := strings.SplitN(response, "/", 3)
	if len(parts) != 3 || !strings.HasPrefix(parts[0], "ClamAV ") {
		return versionInfo{}, fmt.Errorf("unrecognized ClamAV version response %q", response)
	}
	databaseTime, err := time.ParseInLocation(
		"Mon Jan 2 15:04:05 2006",
		strings.TrimSpace(parts[2]),
		time.UTC,
	)
	if err != nil {
		return versionInfo{}, fmt.Errorf("parse ClamAV signature timestamp: %w", err)
	}
	now := client.clock().UTC()
	if databaseTime.After(now.Add(5 * time.Minute)) {
		return versionInfo{}, fmt.Errorf("ClamAV signature timestamp is in the future: %s", databaseTime)
	}
	if now.Sub(databaseTime) > client.maximumSignatureAge {
		return versionInfo{}, fmt.Errorf(
			"ClamAV signatures are stale: database age %s exceeds %s",
			now.Sub(databaseTime).Round(time.Second),
			client.maximumSignatureAge,
		)
	}
	return versionInfo{
		engine:       strings.TrimPrefix(parts[0], "ClamAV "),
		signatures:   parts[1],
		databaseTime: databaseTime,
	}, nil
}

func (client *ClamAV) command(ctx context.Context, command string) (string, error) {
	connection, err := client.dial(ctx)
	if err != nil {
		return "", err
	}
	defer connection.Close()
	if _, err := io.WriteString(connection, command); err != nil {
		return "", client.contextError(ctx, "write ClamAV command", err)
	}
	response, err := bufio.NewReader(connection).ReadString(0)
	if err != nil {
		return "", client.contextError(ctx, "read ClamAV command response", err)
	}
	return strings.TrimSuffix(response, "\x00"), nil
}

func (client *ClamAV) dial(ctx context.Context) (net.Conn, error) {
	dialer := net.Dialer{Timeout: client.dialTimeout}
	connection, err := dialer.DialContext(ctx, "tcp", client.address)
	if err != nil {
		return nil, err
	}
	if deadline, ok := ctx.Deadline(); ok {
		if err := connection.SetDeadline(deadline); err != nil {
			connection.Close()
			return nil, err
		}
	}
	return connection, nil
}

func (client *ClamAV) contextError(ctx context.Context, operation string, err error) error {
	if contextErr := ctx.Err(); contextErr != nil {
		return fmt.Errorf("%s: %w", operation, contextErr)
	}
	if deadline, ok := ctx.Deadline(); ok && !time.Now().Before(deadline) {
		return fmt.Errorf("%s: %w", operation, context.DeadlineExceeded)
	}
	return fmt.Errorf("%s: %w", operation, err)
}

var _ Scanner = (*ClamAV)(nil)
