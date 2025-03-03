import {
  DescribeInstanceStatusCommand,
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
} from '@aws-sdk/client-ec2';
import { jwtDecode } from 'jwt-decode';
import { DateTime } from 'luxon';

import { addActivityItem, getStatusActivity } from './model/activity';
import auth from './mw/auth';

const ec2 = new EC2Client();
const instanceId = process.env['INSTANCE_ID'];

export const getStatus = async () => {
  const [ec2Data, activityData] = await Promise.all([
    ec2.send(
      new DescribeInstanceStatusCommand({
        InstanceIds: [instanceId],
        IncludeAllInstances: true,
      }),
    ),
    getStatusActivity(),
  ]);
  const instance = ec2Data.InstanceStatuses[0];

  return { ...instance.InstanceState, ...activityData };
};

export const startInstance = async (ctx: { tokenPayload: TokenPayload }) => {
  const data = await ec2.send(
    new StartInstancesCommand({
      InstanceIds: [instanceId],
    }),
  );
  await addActivityItem('start', DateTime.now(), ctx.tokenPayload.given_name);

  return {
    current: data.StartingInstances[0].CurrentState,
    previous: data.StartingInstances[0].PreviousState,
    author: ctx.tokenPayload.given_name,
  };
};

export const stopInstance = async (ctx: { tokenPayload: TokenPayload }) => {
  const data = await ec2.send(
    new StopInstancesCommand({
      InstanceIds: [instanceId],
    }),
  );
  await addActivityItem('start', DateTime.now(), ctx.tokenPayload.given_name);

  return {
    current: data.StoppingInstances[0].CurrentState,
    previous: data.StoppingInstances[0].PreviousState,
    author: ctx.tokenPayload.given_name,
  };
};

type TokenPayload = { email: string; given_name: string };

export default async (event: AWSLambda.APIGatewayProxyEvent) => {
  let actionMethod;
  const resHeaders = {};

  switch (event.queryStringParameters?.['action']) {
    case 'start':
      actionMethod = startInstance;
      break;
    case 'stop':
      actionMethod = stopInstance;
      break;
    default:
      actionMethod = getStatus;
  }

  const ctx = {
    request: { headers: { authorization: event.headers?.authorization } },
    status: 200,
    body: '',
    set: (key, value) => {
      resHeaders[key] = value;
    },
  };

  try {
    await auth(ctx, () => Promise.resolve());
  } catch (e) {
    console.log('My new middleware failed :-(', e);
    resHeaders['middleware'] = JSON.stringify(e);
  }

  if (ctx.status !== 200) {
    return {
      statusCode: ctx.status,
      error: ctx.body,
      headers: resHeaders,
    };
  }

  try {
    const result = await actionMethod(ctx);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: resHeaders,
    };
  } catch (error) {
    return {
      statusCode: 500,
      error: error.message,
      headers: resHeaders,
    };
  }
};
