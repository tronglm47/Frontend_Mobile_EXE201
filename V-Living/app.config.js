import "dotenv/config";

export default {
  expo: {
    name: "MyApp",
    slug: "my-app",
    version: "1.0.0",
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
    },
  },
};
