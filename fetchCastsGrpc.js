const { getSSLHubRpcClient } = require("@farcaster/hub-nodejs");
const fs = require("fs");
const path = require("path");
const { credentials } = require("@grpc/grpc-js");

const hubRpcEndpoint = "127.0.0.1:2283";

// Workaround for using IP address with SSL by overriding the servername
const options = {
  "grpc.ssl_target_name_override": "localhost",
  "grpc.default_authority": "localhost",
};

const client = getSSLHubRpcClient(
  hubRpcEndpoint,
  credentials.createSsl(),
  options
);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);
    try {
      const castsResult = await client.getCastsByFid({ fid: 2 });
      const casts = castsResult.messages.map((cast) => ({
        text: cast.data?.castAddBody?.text,
        fid: cast.data?.fid,
        timestamp: cast.data?.timestamp,
      }));

      console.log(`Fetched ${casts.length} casts for FID 2`);
      saveCastsToFile(casts, 2);
    } catch (error) {
      console.error("Error fetching casts:", error);
    } finally {
      client.close();
    }
  }
});

const saveCastsToFile = (casts, fid) => {
  const filePath = path.resolve(__dirname, "../dataTest", `casts_${fid}.json`);
  fs.writeFileSync(filePath, JSON.stringify(casts, null, 2), "utf8");
  console.log(`Casts saved to ${filePath}`);
};
