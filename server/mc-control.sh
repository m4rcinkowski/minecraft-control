#!/bin/bash

## Put this script in the home directory of the user that runs the minecraft server.
# Run every minute with cron as:
# * * * * * /home/minecraft/mc-control.sh

MINUTES_TO_STOP=5
INSTANCE_ID="" # Put your instance id here
SS="/usr/sbin/ss"
AWS_CLI="/usr/bin/aws"

cd ~
COUNT=$($SS -tuno state established | grep ':5555' | wc -l)

if [[ "$COUNT" > 0 ]]; then
        echo "$(date), minecraft in use ($COUNT)" >> mc-control.log
else
        echo "$(date), IDLE no connections" >> mc-control.log
fi

ID="PING##$(date -u +%F)"
CAT=$(date -u +%s)
TTL=$(date -d '+30 days' -u +%s)
STOP=`test "$(tail -n$MINUTES_TO_STOP mc-control.log | grep 'no conn' | wc -l)" -eq "$MINUTES_TO_STOP" && echo true || echo false`

$AWS_CLI dynamodb put-item --table-name=mc-control-dev-activity \
        --item '{"id": {"S": "'$ID'"}, "cat": {"N": "'$CAT'"}, "players": {"N": "'$COUNT'"}, "stop": {"BOOL": '$STOP'}, "ttl": {"N": "'$TTL'"}}'


if [[ "$STOP" == "true" ]]; then
        echo "$(date), MINECRAFT IDLE for some time - stopping instance :-)" >> mc-control.log
        $AWS_CLI ec2 stop-instances --instance-ids $INSTANCE_ID
fi
