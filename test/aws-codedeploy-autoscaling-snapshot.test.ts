import * as s3 from '@aws-cdk/aws-s3';
import { SynthUtils } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';

import AwsCodedeployAutoscalingIAM from '../lib/aws-codedeploy-autoscaling-iam';
import AwsCodedeployAutoscaling from '../lib/aws-codedeploy-autoscaling';

test('Create codedeploy IAM role and user', () => {
  const stack = new Stack();
  const bucket = new s3.Bucket(stack, 'CodeDeploymentBucket');
  const awsCodedeployAutoscalingIAM = new AwsCodedeployAutoscalingIAM(
    stack,
    'TestCodeDeployIAM',
    {
      codeDeployBucketName: bucket.bucketName,
    }
  );

  new AwsCodedeployAutoscaling(stack, 'TestCodeDeploy', {
    awsCodedeployAutoscalingIAM: awsCodedeployAutoscalingIAM,
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
