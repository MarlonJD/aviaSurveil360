package uploadpolicy

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
)

var ErrInvalid = errors.New("invalid upload")

var sha256Pattern = regexp.MustCompile(`^sha256:[a-f0-9]{64}$`)

var allowedMediaTypes = map[string]bool{
	"application/pdf": true,
	"image/jpeg":      true,
	"image/png":       true,
}

func ValidateDeclaration(fileName, mediaType string, size, maximum int64, digest string) error {
	trimmedName := strings.TrimSpace(fileName)
	if trimmedName == "" || filepath.Base(trimmedName) != trimmedName || strings.ContainsAny(trimmedName, "/\\\\\x00") {
		return fmt.Errorf("%w: a plain file name is required", ErrInvalid)
	}
	if !allowedMediaTypes[mediaType] {
		return fmt.Errorf("%w: media type %q is not allowed", ErrInvalid, mediaType)
	}
	if size <= 0 || maximum <= 0 || size > maximum {
		return fmt.Errorf("%w: byte size must be between 1 and %d", ErrInvalid, maximum)
	}
	if !sha256Pattern.MatchString(digest) {
		return fmt.Errorf("%w: a lowercase sha256 digest is required", ErrInvalid)
	}
	return nil
}

type Observation struct {
	Size        int64
	SHA256      string
	ContentType string
}

func Observe(reader io.Reader, maximum int64) (Observation, error) {
	limited := io.LimitReader(reader, maximum+1)
	hasher := sha256.New()
	probe := make([]byte, 512)
	read, readErr := io.ReadFull(limited, probe)
	if readErr != nil && !errors.Is(readErr, io.ErrUnexpectedEOF) && !errors.Is(readErr, io.EOF) {
		return Observation{}, readErr
	}
	probe = probe[:read]
	if _, err := hasher.Write(probe); err != nil {
		return Observation{}, err
	}
	remainder, err := io.Copy(hasher, limited)
	if err != nil {
		return Observation{}, err
	}
	size := int64(read) + remainder
	if size > maximum {
		return Observation{}, fmt.Errorf("%w: observed object exceeds %d bytes", ErrInvalid, maximum)
	}
	return Observation{
		Size:        size,
		SHA256:      "sha256:" + hex.EncodeToString(hasher.Sum(nil)),
		ContentType: http.DetectContentType(probe),
	}, nil
}

func MatchesDeclaration(observed Observation, mediaType, digest string, size int64) bool {
	return observed.Size == size && observed.SHA256 == digest && observed.ContentType == mediaType
}
