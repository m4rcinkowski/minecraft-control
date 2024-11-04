import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { DateTime, Duration } from 'luxon';

const ddb = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddb);
const TTL_IN_DAYS = 30;

const ACTIVITY_TABLE = process.env['SERVER_ACTIVITY_TABLE'];

const MINUTES_TO_STOP = 5;

type ActivityItem = {
  id: string;
  cat: number;
  players: number;
  ttl: number;
  stop: boolean;
  start?: boolean;
  author?: string;
};

const getActivityItems = async (
  date: Date = new Date(),
  limit?: number,
  reverse = true,
): Promise<ActivityItem[]> => {
  try {
    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        Limit: limit ?? MINUTES_TO_STOP,
        ScanIndexForward: !reverse,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': `PING##${date.toISOString().slice(0, 10)}`,
        },
      }),
    );

    return Items as ActivityItem[];
  } catch (e) {
    console.log('Failed to fetch activity items', e);
    return [];
  }
};

const calculatePredictedStopTime = (
  activityItems: ActivityItem[],
  now: DateTime,
): number | undefined => {
  // A special case - server has just been stopped, but is still in the "running" state.
  // And yet, we can tell from the most recent activity item that it was stopped
  if (
    activityItems.at(0)?.stop &&
    now.toUnixInteger() - activityItems.at(0).cat <= 60
  ) {
    return activityItems.at(0).cat;
  } else {
    // let's calculate the predicted stop time based on the most recent activity items
    let inactiveMinutes = 0;

    activityItems.some((item) => {
      const inactive = item.players === 0 && !item.stop && !item.start;

      if (inactive) inactiveMinutes += 1;

      return !inactive;
    });

    const justStarted = !!activityItems.at(0)?.start;

    if (!inactiveMinutes && !justStarted) {
      return undefined;
    }

    // it's either the most recent inactivity OR the start of the server
    const mostRecentDT = DateTime.fromSeconds(activityItems.at(0).cat);

    const base = justStarted ? mostRecentDT.startOf('minute') : mostRecentDT;

    return base
      .plus(
        Duration.fromObject({
          minutes: MINUTES_TO_STOP - inactiveMinutes,
        }),
      )
      .toUnixInteger();
  }
};

export const getStatusActivity = async (now: DateTime = DateTime.now()) => {
  const activityItems = await getActivityItems(now.toJSDate());
  const playersCount = activityItems.at(0)?.players;
  const author = activityItems.at(0)?.author;
  let predictedStop: number | undefined;

  if (playersCount === 0) {
    predictedStop = calculatePredictedStopTime(activityItems, now);
  }

  return {
    playersCount,
    predictedStop,
    author,
  };
};

export const addActivityItem = async (
  activityType: 'start' | 'stop',
  now: DateTime = DateTime.now(),
  author: string,
) => {
  try {
    await Promise.any([
      docClient.send(
        new PutCommand({
          TableName: ACTIVITY_TABLE,
          Item: {
            id: `PING##${now.toISODate()}`,
            cat: now.toUnixInteger(),
            author,
            stop: activityType === 'stop',
            start: activityType === 'start',
            players: activityType === 'start' ? 0 : undefined,
            ttl: now.plus({ days: TTL_IN_DAYS }).toUnixInteger(),
          },
        }),
      ),
      docClient.send(
        new PutCommand({
          TableName: ACTIVITY_TABLE,
          Item: {
            id: `${activityType.toUpperCase()}##${now.toISODate()}`,
            cat: now.toUnixInteger(),
            author,
            ttl: now.plus({ days: TTL_IN_DAYS }).toUnixInteger(),
          },
        }),
      ),
    ]);
  } catch (e) {
    console.log('Failed to add activity item', e);
  }
};
