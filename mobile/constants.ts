import Constants from "expo-constants";

let ip = "localhost"; // default fallback

// Extract the debuggerHost (used when running in dev)
const debuggerHost = Constants.manifest?.extra?.expoGo?.debuggerHost
  || Constants.manifest?.debuggerHost;

// It usually looks like "192.168.x.x:19000"
if (debuggerHost) {
  ip = debuggerHost.split(":")[0];
}

// Construct the base URL to your backend (assumed port 5000)
export const API_BASE_URL = __DEV__ ? `http://${ip}:5000` : `https://your-production-url.com`;

console.log("✅ constants.ts loaded");
