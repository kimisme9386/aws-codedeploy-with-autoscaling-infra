import * as s3 from '@aws-cdk/aws-s3';
import { SynthUtils } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';

import AwsCodedeployAutoscalingIAM from '../lib/aws-codedeploy-autoscaling-iam';

test('Create codedeploy IAM role and user', () => {
  const stack = new Stack();
  const bucket = new s3.Bucket(stack, 'CodeDeploymentBucket');

  new AwsCodedeployAutoscalingIAM(stack, 'TestCodeDeployIAM', {
    codeDeployBucketName: bucket.bucketName,
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
