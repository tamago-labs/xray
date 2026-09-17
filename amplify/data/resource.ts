import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { priceTracker } from "../functions/price-tracker/resource";
import { chatApiFunction } from "../functions/chat-api/resource";

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
  AgentSession: a
    .model({
      userProfileId: a.id().required(),
      userProfile: a.belongsTo("UserProfile", "userProfileId"),
      sessionName: a.string().required(),
      items: a.json().required(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update", "delete"])])
    .secondaryIndexes((index) => [
      index("userProfileId").queryField("ByUser"),
    ]),
  UserProfile: a
    .model({
      walletAddress: a.string().required(),
      profileName: a.string(),
      credits: a.float().required(),
      experience: a.enum(["newcomer", "regular", "lite_degen", "full_degen"]),
      writingStyle: a.enum(["default", "journalist", "storytelling", "ct_vibes", "concise"]),
      sources: a.string().array(),
      tokenRegistries: a.hasMany("UserTokenRegistry", "userProfileId"),
      agentSessions: a.hasMany("AgentSession", "userProfileId"),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update"])])
    .secondaryIndexes((index) => [index("walletAddress").queryField("byWallet")]),

  UserTokenRegistry: a
    .model({
      userProfileId: a.id().required(),
      userProfile: a.belongsTo("UserProfile", "userProfileId"),
      contractAddress: a.string().required(),
      symbol: a.string().required(),
      name: a.string(),
      decimals: a.integer(),
      chainId: a.integer().required(),
      addedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "delete"])])
    .secondaryIndexes((index) => [index("userProfileId").queryField("byUser")]),

  SystemStatus: a
    .model({
      id: a.string().required(),
      status: a.enum(["ready", "busy", "down"]),
      activeUsers: a.integer().required(),
      avgResponseMs: a.integer().required(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "update"])]),

  NewsArticle: a
    .model({
      title: a.string().required(),
      source: a.string().required(),
      theme: a.string().required(),
      summary: a.string().required(),
      url: a.string(),
      publishedAt: a.datetime().required(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read"])])
    .secondaryIndexes((index) => [
      index("theme").queryField("byTheme"),
      index("publishedAt").queryField("byPublishedAt"),
    ]),

}).authorization((allow) => [
  allow.resource(priceTracker),
  allow.resource(chatApiFunction),
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
