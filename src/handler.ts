import {
  DescribeInstanceStatusCommand,
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
} from '@aws-sdk/client-ec2';
import { jwtDecode } from 'jwt-decode';
import { addActivityItem, getStatusActivity } from './model/activity';
import { DateTime } from 'luxon';

const ec2 = new EC2Client();

const instanceId = process.env['INSTANCE_ID'];
const restrictedEmails = process.env['RESTRICTED_EMAILS']?.split(',') ?? [];

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

  let userEmail;
  let tokenPayload;

  try {
    tokenPayload = jwtDecode<TokenPayload>(event.headers?.authorization);
    userEmail = event.headers?.authorization && tokenPayload?.email;
  } catch (e) {
    console.log('Failed to decode JWT', {
      e,
      token: event.headers?.authorization?.slice(0, 20),
    });
  }

  if (!userEmail || !restrictedEmails.includes(userEmail)) {
    return {
      statusCode: 401,
      error: 'Unauthorized',
    };
  }

  try {
    const result = await actionMethod({ tokenPayload });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      error: error.message,
    };
  }
};
