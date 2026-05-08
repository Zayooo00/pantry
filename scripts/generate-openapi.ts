import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import openapiTS, { astToString } from "openapi-typescript";
import { buildRegistry } from "../lib/api/registry";

const OUT_JSON = resolve(__dirname, "../lib/api/openapi.json");
const OUT_TS = resolve(__dirname, "../lib/api/openapi.d.ts");

async function main() {
  const registry = buildRegistry();
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Pantry API", version: "0.1.0" },
    servers: [{ url: "/" }],
  });
  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(document, null, 2));
  console.log(`wrote ${OUT_JSON}`);

  const ast = await openapiTS(document as Parameters<typeof openapiTS>[0]);
  const ts = astToString(ast);
  writeFileSync(OUT_TS, ts);
  console.log(`wrote ${OUT_TS}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
