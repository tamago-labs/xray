import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { priceTracker } from "../functions/price-tracker/resource";

const schema = a.schema({
  PriceSnapshot: a
    .model({
      symbol: a.string().required(),
      rwa_id: a.integer().required(),
      token_symbol: a.string().required(),
      crypto_id: a.integer().required(),
      price: a.float(),
      market_cap: a.float(),
      volume_24h: a.float(),
      percent_1h: a.float(),
      percent_24h: a.float(),
      percent_7d: a.float(),
      percent_30d: a.float(),
      circulating_supply: a.float(),
      total_supply: a.float(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
    ])
    .secondaryIndexes((index) => [
      index("rwa_id").queryField("byRwaId"),
      index("token_symbol").queryField("byTokenSymbol"),
    ]),
  UserProfile: a
    .model({
      walletAddress: a.string().required(),
      profileName: a.string(),
      credits: a.float().required(),
      experience: a.enum(["newcomer", "regular", "lite_degen", "full_degen"]),
      writingStyle: a.enum(["default", "journalist", "storytelling", "ct_vibes", "concise"]),
      sources: a.string().array(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update"])])
    .secondaryIndexes((index) => [index("walletAddress").queryField("byWallet")]),

}).authorization((allow) => [
  allow.resource(priceTracker),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
