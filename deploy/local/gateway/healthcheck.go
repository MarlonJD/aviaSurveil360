package main

import (
	"crypto/tls"
	"io"
	"net/http"
	"os"
	"time"
)

func main() {
	target := "https://127.0.0.1:8443/"
	if len(os.Args) == 2 {
		target = os.Args[1]
	}
	client := &http.Client{
		Timeout: 3 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // Local Caddy uses its isolated development CA.
		},
	}
	response, err := client.Get(target)
	if err != nil {
		os.Exit(1)
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, response.Body)
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusBadRequest {
		os.Exit(1)
	}
}
