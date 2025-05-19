import fetch from "node-fetch";
import fs from "fs/promises";

const GRAPHQL_ENDPOINT = "https://arweave.net/graphql";
const MAX_TX = 50;

async function fetchTxIds() {
  let txIds = [];
  let cursor = null;

  while (txIds.length < MAX_TX) {
    const query = {
      query: `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["ao"] },
              { name: "Type", values: ["Message"] },
              { name: "Content-Type", values: ["application/json"] }
            ],
            first: 25,
            ${cursor ? `after: "${cursor}",` : ""}
          ) {
            pageInfo {
              hasNextPage
            }
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `
    };

    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query)
    });

    const json = await res.json();
    const edges = json.data.transactions.edges;

    for (const edge of edges) {
      txIds.push(edge.node.id);
      cursor = edge.cursor;
      if (txIds.length >= MAX_TX) break;
    }

    if (!json.data.transactions.pageInfo.hasNextPage) break;
  }

  await fs.writeFile("txids.json", JSON.stringify(txIds, null, 2));
  console.log(`✅ Saved ${txIds.length} TXIDs to txids.json`);
}

fetchTxIds().catch(console.error);
