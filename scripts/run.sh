#!/usr/bin/env bash
# Bash 3.x compatible conversion of run.sh

DART_PID=0
DOCKER_MINIO_ID=''
DOCKER_SFTP_ID=''
MINIO_STARTED=false
SFTP_STARTED=false
CLEANUP_DONE=false
MINIO_USER="minioadmin"
MINIO_PASSWORD="minioadmin"

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

log_file_path() {
    local service_name="$1"
    local log_dir="$HOME/tmp/logs"
    mkdir -p "$log_dir"
    echo "$log_dir/${service_name}.log"
}

make_test_dirs() {
    local base="$HOME/tmp"
    # Check ends with "tmp" to avoid accidentally deleting home dir
    case "$base" in
        *tmp)
            echo "Deleting $base"
            ;;
    esac
    rm -rf "$base"
    for dir in bags bin logs; do
        local full_dir="$base/$dir"
        echo "Creating $full_dir"
        mkdir -p "$full_dir"
    done
}

sftp_image_name() {
    local machine
    machine=$(uname -m)
    case "$machine" in
        arm64)
            echo 'jmcombs/sftp'
            ;;
        *)
            echo 'atmoz/sftp'
            ;;
    esac
}

start_minio() {
    echo "Starting Minio container"
    DOCKER_MINIO_ID=$(docker run -p 9899:9000 -p 9001:9001 -d \
        quay.io/minio/minio server /data \
        --console-address ":9001")
    local exit_code=$?
    DOCKER_MINIO_ID=$(echo "$DOCKER_MINIO_ID" | tr -d '\n')
    if [ $exit_code -eq 0 ]; then
        echo "Started Minio server with id $DOCKER_MINIO_ID"
        echo "Minio is running on localhost:9899. User/Pwd: $MINIO_USER/$MINIO_PASSWORD"
        echo "Minio console available at http://127.0.0.1:9001"
        MINIO_STARTED=true
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/test
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/dart-runner.test
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/preservation-or
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/preservation-va
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/glacier-oh
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/glacier-or
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/glacier-va
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/glacier-deep-oh
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/glacier-deep-or
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/glacier-deep-va
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/wasabi-or
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/wasabi-tx
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/wasabi-va
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/receiving
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/staging
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.receiving.test.test.edu
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.restore.test.test.edu
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.receiving.test.institution1.edu
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.restore.test.institution1.edu
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.receiving.test.institution2.edu
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.restore.test.institution2.edu
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.receiving.test.example.edu
        docker exec -it "$DOCKER_MINIO_ID" mkdir /data/aptrust.restore.test.example.edu
    else
        echo "Error starting Minio docker container. Is one already running?"
        echo "$DOCKER_MINIO_ID"
    fi
}

stop_minio() {
    if [ "$MINIO_STARTED" = true ]; then
        docker stop "$DOCKER_MINIO_ID"
        if [ $? -eq 0 ]; then
            echo "Stopped docker Minio service"
        else
            echo "Failed to stop docker Minio service with id $DOCKER_MINIO_ID"
            echo "See if you can kill it."
            echo "Hint: run \`docker ps\` and look for the image named 'minio/minio'"
        fi
    else
        echo "Not killing Minio service because it failed to start"
    fi
}

start_sftp() {
    local sftp_dir="$PROJECT_ROOT/testdata/sftp"
    local image
    image=$(sftp_image_name)
    echo "Using SFTP config options from $sftp_dir"
    DOCKER_SFTP_ID=$(docker run \
        -v "$sftp_dir/sftp_user_key.pub:/home/key_user/.ssh/keys/sftp_user_key.pub:ro" \
        -v "$sftp_dir/users.conf:/etc/sftp/users.conf:ro" \
        -p 2222:22 -d "$image")
    local exit_code=$?
    DOCKER_SFTP_ID=$(echo "$DOCKER_SFTP_ID" | tr -d '\n')
    if [ $exit_code -eq 0 ]; then
        echo "Started SFTP server with id $DOCKER_SFTP_ID"
        echo "To log in and view the contents, use:"
        echo "sftp -P 2222 pw_user@localhost"
        echo "The password is 'password' without the quotes"
        SFTP_STARTED=true
    else
        echo "Error starting SFTP docker container. Is one already running?"
        echo "$DOCKER_SFTP_ID"
    fi
}

stop_sftp() {
    if [ "$SFTP_STARTED" = true ]; then
        docker stop "$DOCKER_SFTP_ID"
        if [ $? -eq 0 ]; then
            echo "Stopped docker SFTP service"
        else
            echo "Failed to stop docker SFTP service with id $DOCKER_SFTP_ID"
            echo "See if you can kill it."
            echo "Hint: run \`docker ps\` and look for the image named 'atmoz/sftp'"
        fi
    else
        echo "Not killing SFTP service because it failed to start"
    fi
}

stop_dart() {
    if [ "$DART_PID" -eq 0 ]; then
        echo "Pid for DART is zero. Can't kill that..."
        return
    fi
    echo "Stopping DART service (pid $DART_PID)"
    kill -TERM "$DART_PID" 2>/dev/null || echo "Could not kill DART. :("
}

stop_all_services() {
    if [ "$DART_PID" -gt 0 ]; then
        stop_dart
    fi
    stop_minio
    stop_sftp
}

cleanup() {
    if [ "$CLEANUP_DONE" = false ]; then
        CLEANUP_DONE=true
        stop_all_services
    fi
}

run_tests() {
    make_test_dirs
    start_minio
    start_sftp
    go clean -testcache
    go test -race -p 1 ./... -coverprofile c.out
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "😊 PASSED 😊"
        echo "To generate HTML report: > go tool cover -html=c.out"
    else
        echo "😡 FAILED 😡"
    fi
    exit $exit_code
}

run_dart() {
    go run -race dart/main.go -port 8444 &
    DART_PID=$!
    sleep 1
    echo ""
    echo ""
    echo ""
    echo "DART is running at http://localhost:8444"
    start_minio
    start_sftp
    echo ""
    echo "Control-C will stop DART, SFTP and Minio"
    echo ""
    wait $DART_PID || true
}

run_services() {
    start_minio
    start_sftp
    echo ""
    echo "Control-C will stop SFTP and Minio containers"
    echo ""
    # Snooze until we get Ctrl-C interrupt from the user.
    while true; do
        sleep 1
    done
}

show_help() {
    echo "To run unit and integration tests:"
    echo "    run.sh tests"
    echo ""
    echo "To run DART, SFTP and Minio for interactive testing:"
    echo "    run.sh dart"
    echo ""
    echo "To run SFTP and Minio (but not DART) for interactive testing:"
    echo "    run.sh services"
    echo ""
    echo "This allows you to launch DART separately from VS Code in debug mode."
}

trap cleanup EXIT
trap 'exit 130' INT TERM

# Run all Go commands from the project root.
cd "$PROJECT_ROOT"

ACTION="${1:-}"
if [ "$ACTION" = "tests" ]; then
    run_tests
elif [ "$ACTION" = "services" ]; then
    run_services
elif [ "$ACTION" = "dart" ]; then
    run_dart
else
    show_help
fi
