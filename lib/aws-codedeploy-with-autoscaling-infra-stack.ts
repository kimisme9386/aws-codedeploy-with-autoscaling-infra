import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import AwsCodedeployAutoscaling from "./aws-codedeploy-autoscaling";
import AwsCodedeployAutoscalingIAM from "./aws-codedeploy-autoscaling-iam";

export default class AwsCodedeployWithAutoScalingInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "CodeDeploymentBucket");

    new cdk.CfnOutput(this, "DeploymentBucketName", {
      value: bucket.bucketName,
    });

    const awsCodedeployAutoscalingIAM = new AwsCodedeployAutoscalingIAM(
      this,
      "AwsCodedeployAutoscalingIAM",
      { codeDeployBucketName: bucket.bucketName }
    );

    const awsCodedeployAutoscaling = new AwsCodedeployAutoscaling(
      this,
      "AwsCodedeployAutoscaling",
      { awsCodedeployAutoscalingIAM: awsCodedeployAutoscalingIAM }
    );

    awsCodedeployAutoscaling.node.addDependency(awsCodedeployAutoscalingIAM);
  }
}
