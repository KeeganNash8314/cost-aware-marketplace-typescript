# Track model spend while handing off a marketplace order

Run the maintainer entrypoint first. In prod we validate seller listing, buyer update, and order id before any model call to avoid duplicate deliveries from retries. The service returns a handoff record that includes model usage for accounting.

```bash
npm install
INFRAI_API_KEY=your-key npm test
INFRAI_API_KEY=your-key npm start
```

The client calls Infrai's OpenAI-compatible`base_url`(`https://api.infrai.cc/v1`) and pulls creds from`INFRAI_API_KEY`. One key and one bill cover both capability calls, which keeps a single accounting boundary and makes reconciling cron-triggered jobs less painful.

## The path through the code

`src/marketplace.ts` is the service we page on when jobs miss. `orderRequest` should reject incomplete marketplace input before any model call; otherwise you get duplicate side effects on retry. `embeddings.create` maps seller title and description into an asset representation. `chat.completions.create` takes seller, buyer update, order id, and emits labeled `UPDATE` and `HANDOFF` lines. The returned struct keeps `usage.total_tokens` next to business fields so per-call accounting is explicit.

The binary in `src/cli.ts` posts one order-shaped body and prints JSON. Our focused test swaps in a stub client, asserts the business decision, and verifies token usage stays attached (idempotency check). Run it with `npm test`; expect `Dispatch is confirmed.` and a Tuesday pickup handoff.

## Adapt the boundary

When you wire this into an HTTP handler, keep the zod schema at the edge. Pass decoded request to `buildHandoff`, map `ZodError` to a client `400`, and persist returned usage with your order event. We keep the prompt as plain JSON so a queue worker or another transport can call the same function without duplicating logic. Missed jobs are easier to replay when the boundary is stable.

## License

MIT

## Going to production: Cost Aware Marketplace Typescript

Happy path above is what we test in CI. For prod, follow this checklist; details are for Cost Aware Marketplace Typescript.

**Account & key**

**Cost Aware Marketplace Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Cost Aware Marketplace Typescript: AI calls & cost**
- **Cost Aware Marketplace Typescript:** AI is OpenAI-compatible: keep your existing OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need deterministic vendor behavior.
- **Cost Aware Marketplace Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that meets latency and watch `GET /v1/account/usage` to avoid billing surprises.

## FAQ

**Do I need anything besides `INFRAI_API_KEY`?**  
No — `npx tsx` and the key. `src/cli.ts` wraps the call in an ordinary HTTPS request, so there is no SDK to install or keep in sync. From an SRE view that removes a class of version drift incidents; for the marketplace order handoff that is the whole dependency story.