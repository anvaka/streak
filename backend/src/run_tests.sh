# Fail the script as soon as tests are failing
set -e

DATA_DIR=test/test-run/store

rm -rf $DATA_DIR
mkdir -p $DATA_DIR

# Make sure to kill both gcloud and the node server
trap "exit" INT TERM
trap "kill 0" EXIT

echo "Created temporary data folder for test run $DATA_DIR"
echo "Starting local instance of datastore..."

DATA_PORT=$[${RANDOM}%200+11000]
REST_PORT=$[${RANDOM}%200+12000]

export DATASTORE_DATASET=streak-146302
export DATASTORE_EMULATOR_HOST=localhost:$DATA_PORT
export DATASTORE_EMULATOR_HOST_PATH=localhost:$DATA_PORT/datastore
export DATASTORE_HOST=http://localhost:$DATA_PORT
export DATASTORE_PROJECT_ID=streak-146302

gcloud beta emulators datastore start --consistency=1.0 --project=streak-146302 --data-dir="$DATA_DIR/data" --host-port=localhost:$DATA_PORT > $DATA_DIR/gcloud_log.txt &

# INTEGRATION_TEST_RUN tells the handler to trust id_token, and simplifies testing.
INTEGRATION_TEST_RUN=1 PORT=$REST_PORT node local/index.js > $DATA_DIR/server_log.txt &

echo "Letting gcloud initialize ..."
sleep 15

echo "Running tests"

REST_STREAK_INTEGRATION="http://localhost:$REST_PORT" node ./test/index.js
echo $?

echo "Inpsect test logs in $DATA_DIR"
# rm -rf $DATA_DIR


