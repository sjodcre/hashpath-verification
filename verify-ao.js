import fetch from "node-fetch";
import crypto from "crypto";

const TX_ID = "eaUAvulzZPrdh6_cHwUYV473OhvCumqT3K7eWI8tArk";

function sha256(obj) {
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash("sha256").update(json).digest("hex");
}

async function verifyAoMessage(txId) {
  const res = await fetch(`https://arweave.net/${txId}`);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error("❌ Not JSON. Content:\n", text);
    return;
  }

  const message = await res.json();
  const input = message.InputState;
  const output = message.OutputState;
  const claimed = message["Hash-Chain"] || message["HashChain"];

  if (!input || !output || !claimed) {
    console.error("❌ Missing InputState, OutputState, or Hash-Chain field.");
    return;
  }

  const recomputed = sha256({ input, output });

  console.log("Claimed:   ", claimed);
  console.log("Recomputed:", recomputed);
  console.log(
    claimed === recomputed ? "✅ Hashpath is valid." : "❌ Hashpath mismatch."
  );
}

verifyAoMessage(TX_ID).catch((err) => console.error("Error:", err));
