import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as AwsCodedeployWithEc2Infra from "../lib/aws-codedeploy-with-autoscaling-infra-stack";

test("Empty Stack", () => {
  // const app = new cdk.App();
  // // WHEN
  // const stack = new AwsCodedeployWithEc2Infra.AwsCodedeployWithEc2InfraStack(app, 'MyTestStack');
  // // THEN
  // expectCDK(stack).to(matchTemplate({
  //   "Resources": {}
  // }, MatchStyle.EXACT))
  const azs = cdk.Fn.getAzs("ap-northeast-1");
  console.log("length", azs.length);
  azs.forEach((v: any) => console.log("available zone:", v));
});
