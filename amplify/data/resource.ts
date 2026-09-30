import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { priceTracker } from "../functions/price-tracker/resource";
import { chatApiFunction } from "../functions/chat-api/resource";
import { preIpoTracker } from "../functions/pre-ipo-tracker/resource";
import { ohlcvFetcherFunction } from "../functions/ohlcv-fetcher/resource";
import { riskReviewFunction } from "../functions/risk-review/resource";

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
  PreIpoSnapshot: a
    .model({
      symbol: a.string().required(),
      markPrice: a.float().required(),
      markValuation: a.float().required(),
      impliedValuation: a.float().required(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
    ])
    .secondaryIndexes((index) => [
      index("symbol").queryField("bySymbol"),
    ]),
  AgentSession: a
    .model({
      walletAddress: a.string().required(),
      sessionName: a.string().required(),
      items: a.json().required(),
      transactions: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update", "delete"])])
    .secondaryIndexes((index) => [
      index("walletAddress").queryField("bySessionWallet"),
    ]),
  UserProfile: a
    .model({
      walletAddress: a.string().required(),
      profileName: a.string(),
      credits: a.float().required(),
      experience: a.enum(["newcomer", "regular", "lite_degen", "full_degen"]),
      writingStyle: a.enum(["default", "journalist", "storytelling", "ct_vibes", "concise"]),
      sources: a.string().array(),
      portfolios: a.hasMany("Portfolio", "userProfileId"),
      reviews: a.hasMany("SavedReview", "userProfileId"),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update"])])
    .secondaryIndexes((index) => [index("walletAddress").queryField("byWallet")]),

  TrackedToken: a
    .model({
      walletAddress: a.string().required(),
      symbol: a.string().required(),
      name: a.string(),
      logo: a.string(),
      industry: a.string(),
      contractAddress: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "delete"])])
    .secondaryIndexes((index) => [index("walletAddress").queryField("byTrackedWallet")]),

  SavedReview: a
    .model({
      userProfileId: a.id().required(),
      userProfile: a.belongsTo("UserProfile", "userProfileId"),
      portfolioName: a.string().required(),
      prompt: a.string().required(),
      holdings: a.json().required(),
      answers: a.json().required(),
      report: a.json().required(),
      overallScore: a.integer().required(),
      overallLabel: a.string().required(),
      chats: a.json().required(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update", "delete"])])
    .secondaryIndexes((index) => [index("userProfileId").queryField("bySavedReviewUser")]),

  Portfolio: a
    .model({
      userProfileId: a.id().required(),
      userProfile: a.belongsTo("UserProfile", "userProfileId"),
      name: a.string().required(),
      tokens: a.hasMany("PortfolioToken", "portfolioId"),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "delete"])])
    .secondaryIndexes((index) => [index("userProfileId").queryField("byPortfolioOwner")]),

  PortfolioToken: a
    .model({
      portfolioId: a.id().required(),
      portfolio: a.belongsTo("Portfolio", "portfolioId"),
      symbol: a.string().required(),
      name: a.string(),
      cmcId: a.integer().required(),
      customValue: a.float().required(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "delete"])])
    .secondaryIndexes((index) => [index("portfolioId").queryField("byPortfolio")]),

  riskReview: a
    .query()
    .arguments({
      action: a.string(),
      userProfileId: a.string().required(),
      prompt: a.string().required(),
      holdings: a.string().required(),
      answers: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(riskReviewFunction)),

  ohlcvFetcher: a
    .query()
    .arguments({
      cryptoId: a.string(),
      interval: a.string(),
      timeStart: a.string(),
      timeEnd: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(ohlcvFetcherFunction)),

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
  allow.resource(preIpoTracker),
  allow.resource(ohlcvFetcherFunction),
  allow.resource(riskReviewFunction),
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
