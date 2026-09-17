import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { Function as LambdaFunction, FunctionUrl, InvokeMode, FunctionUrlAuthType, HttpMethod } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib"
import { data } from "./data/resource";
import { priceTracker } from "./functions/price-tracker/resource";
import { chatApiFunction } from "./functions/chat-api/resource";

const backend = defineBackend({
  data,
  priceTracker,
  chatApiFunction,
});

const lambdaFunction = backend.chatApiFunction.resources.lambda as LambdaFunction;

const functionUrl = lambdaFunction.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  invokeMode: InvokeMode.RESPONSE_STREAM,
  cors: {
    allowCredentials: true,
    allowedOrigins: ["*"],
    allowedMethods: [HttpMethod.ALL],
    allowedHeaders: ["*"],
    maxAge: Duration.minutes(5),
  },
});

backend.addOutput({
  custom: {
    ChatAPI: {
      functionUrl: functionUrl.url,
      region: Stack.of(lambdaFunction).region,
      functionName: lambdaFunction.functionName,
    },
  },
});
