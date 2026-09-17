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

backend.chatApiFunction.resources.lambda.addFunctionUrl({
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
      functionUrl: backend.chatApiFunction.resources.lambda.url,
      region: Stack.of(backend.chatApiFunction.resources.lambda).region,
      functionName: backend.chatApiFunction.resources.lambda.functionName,
    },
  },
});
