import '@aws-cdk/assert/jest';
import * as s3 from '@aws-cdk/aws-s3';
import { Stack } from '@aws-cdk/core';
import AwsCodedeployAutoscalingIAM from '../lib/aws-codedeploy-autoscaling-iam';
import AwsCodedeployAutoscaling from '../lib/aws-codedeploy-autoscaling';

test('AWS CodeDeploy Autoscaling IAM Role and User', () => {
  const stack = new Stack(undefined, undefined, {
    env: { region: 'ap-northeast-1' },
  });
  const bucket = new s3.Bucket(stack, 'CodeDeploymentBucket');

  const awsCodedeployAutoscalingIAM = new AwsCodedeployAutoscalingIAM(
    stack,
    'AwsCodedeployAutoscalingIAM',
    {
      codeDeployBucketName: bucket.bucketName,
    }
  );

  new AwsCodedeployAutoscaling(stack, 'AwsCodedeployAutoscaling', {
    awsCodedeployAutoscalingIAM: awsCodedeployAutoscalingIAM,
  });

  expect(stack).toHaveResource('AWS::SSM::Association');
  expect(stack).toHaveResource('AWS::AutoScaling::LaunchConfiguration');
  expect(stack).toHaveResource('AWS::EC2::VPC');
  expect(stack).toHaveResource('AWS::AutoScaling::AutoScalingGroup');
  expect(stack).toHaveResource('AWS::CodeDeploy::Application');
  expect(stack).toHaveResource('AWS::CodeDeploy::DeploymentGroup');
});
