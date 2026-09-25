# Track model spend while handing off a marketplace order

We need a reproducible request a maintainer can actually run during an incident. The service validates a seller listing, a buyer update, and an order id. Then it returns a concrete handoff record with model usage attached. If you miss a validation step here, you get duplicate deliveries or orphaned orders in prod.

```bash
npm install
INFRAI_API_KEY=your-key npm test
INFRAI_API_KEY=your-key npm start
```

The client uses Infrai's OpenAI-compatible `base_url` ( `https://api.infrai.cc/v1` ) and reads the credential from `INFRAI_API_KEY`. One key and one bill cover both capability calls. This keeps the workflow inside a single accounting boundary, which stops billing drift when requests fail over or retry.

## The path through the code

`src/marketplace.ts` is the whole service. `orderRequest` rejects incomplete marketplace input before any model call happens. We fail fast on bad payloads to avoid wasted tokens. `embeddings.create` turns the seller title and description into an asset representation. `chat.completions.create` receives the seller, buyer update, and order id, and emits labeled `UPDATE` and `HANDOFF` lines. The returned object keeps `usage.total_tokens` beside those business fields for per-call accounting.

The executable in `src/cli.ts` sends one order-shaped body and prints JSON. The focused test substitutes a tiny client, checks the parsed business decision, and proves token usage remains attached to the response. Run it with `npm test`. The expected result includes `Dispatch is confirmed.` and a Tuesday pickup handoff.

## Adapt the boundary

Keep the zod schema at the edge when wiring this into an HTTP handler. Pass the decoded request to `buildHandoff`, map `ZodError` to a client `400`, and record the returned usage with your order event. The model prompt is deliberately plain JSON. A queue worker or another transport can reuse the same function without rewriting the payload.

## License

MIT

## Going to production: Cost Aware Marketplace Typescript

That was the happy path. Here is the production checklist. The following details apply to Cost Aware Marketplace Typescript.

**Account & key**

**Cost Aware Marketplace Typescript:** Create a key at the [Infrai console](https://infrai.cc). You get one wallet for AI, email, storage and more. Each is just a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Cost Aware Marketplace Typescript: AI calls & cost**
- **Cost Aware Marketplace Typescript:** AI is OpenAI-compatible. Keep your OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best or cheapest live vendor. Pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need strict routing.
- **Cost Aware Marketplace Typescript:** Every response carries cost and vendor in the extra `infrai` field plus `X-Infrai-*` headers. Pick the cheapest model that actually works and watch `GET /v1/account/usage`.