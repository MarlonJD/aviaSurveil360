#!/bin/sh
set -eu

read_secret() {
  secret_path=$1
  if [ ! -f "$secret_path" ]; then
    echo "required mounted MinIO credential is unavailable" >&2
    exit 1
  fi
  secret_value=$(tr -d '\r\n' <"$secret_path")
  if [ -z "$secret_value" ]; then
    echo "required mounted MinIO credential is empty" >&2
    exit 1
  fi
  printf '%s' "$secret_value"
}

run_sensitive_mc() {
  if ! "$@" >/dev/null 2>&1; then
    echo "MinIO credential administration failed" >&2
    return 1
  fi
}

root_user=$(read_secret "${MINIO_ROOT_USER_FILE:-/run/secrets/minio_root_user}")
root_password=$(read_secret "${MINIO_ROOT_PASSWORD_FILE:-/run/secrets/minio_root_password}")
api_access_key=$(read_secret "${MINIO_API_ACCESS_KEY_FILE:-/run/secrets/minio_api_access_key}")
api_secret_key=$(read_secret "${MINIO_API_SECRET_KEY_FILE:-/run/secrets/minio_api_secret_key}")
worker_access_key=$(read_secret "${MINIO_WORKER_ACCESS_KEY_FILE:-/run/secrets/minio_worker_access_key}")
worker_secret_key=$(read_secret "${MINIO_WORKER_SECRET_KEY_FILE:-/run/secrets/minio_worker_secret_key}")

export MINIO_ROOT_USER="$root_user"
export MINIO_ROOT_PASSWORD="$root_password"

minio server /data --console-address :9001 &
server_pid=$!

stop_server() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}
trap stop_server EXIT HUP INT TERM

alias=local
until mc alias set "$alias" http://127.0.0.1:9000 "$root_user" "$root_password" >/dev/null 2>&1; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "MinIO stopped before private bucket initialization" >&2
    exit 1
  fi
  sleep 1
done

initialize_bucket() {
  bucket=$1
  mc mb --ignore-existing "$alias/$bucket"
  mc anonymous set none "$alias/$bucket"
  mc version enable "$alias/$bucket"
}

initialize_bucket evidence-quarantine
initialize_bucket evidence-clean
initialize_bucket inspection-attachments
initialize_bucket generated-documents

cat >/tmp/api-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListAllMyBuckets"],
      "Resource": ["arn:aws:s3:::*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::evidence-quarantine",
        "arn:aws:s3:::evidence-clean",
        "arn:aws:s3:::inspection-attachments",
        "arn:aws:s3:::generated-documents"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": ["arn:aws:s3:::evidence-quarantine/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::evidence-quarantine/*",
        "arn:aws:s3:::evidence-clean/*",
        "arn:aws:s3:::inspection-attachments/*",
        "arn:aws:s3:::generated-documents/*"
      ]
    }
  ]
}
EOF

cat >/tmp/worker-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListAllMyBuckets"],
      "Resource": ["arn:aws:s3:::*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::evidence-quarantine",
        "arn:aws:s3:::evidence-clean",
        "arn:aws:s3:::inspection-attachments",
        "arn:aws:s3:::generated-documents"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::evidence-quarantine/*",
        "arn:aws:s3:::evidence-clean/*",
        "arn:aws:s3:::inspection-attachments/*",
        "arn:aws:s3:::generated-documents/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": [
        "arn:aws:s3:::evidence-clean/*",
        "arn:aws:s3:::inspection-attachments/*",
        "arn:aws:s3:::generated-documents/*"
      ]
    }
  ]
}
EOF

run_sensitive_mc mc admin user add "$alias" "$api_access_key" "$api_secret_key"
mc admin policy create "$alias" aviasurveil360-api /tmp/api-policy.json
run_sensitive_mc mc admin policy attach "$alias" aviasurveil360-api --user "$api_access_key"

run_sensitive_mc mc admin user add "$alias" "$worker_access_key" "$worker_secret_key"
mc admin policy create "$alias" aviasurveil360-worker /tmp/worker-policy.json
run_sensitive_mc mc admin policy attach "$alias" aviasurveil360-worker --user "$worker_access_key"

rm -f /tmp/api-policy.json /tmp/worker-policy.json
touch /tmp/minio-initialized
unset root_user root_password api_access_key api_secret_key worker_access_key worker_secret_key

wait "$server_pid"
