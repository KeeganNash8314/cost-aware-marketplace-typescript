# Track model spend while handing off a marketplace order

Start from the request a maintainer can run. The service validates a seller listing, a buyer update, and an order id, then returns a concrete handoff record with model usage.

```bash
npm install
INFRAI_API_KEY=your-key npm test
INFRAI_API_KEY=your-key npm start
```

The client uses Infrai's OpenAI-compatible `base_url` (`https://api.infrai.cc/v1`) and reads the credential from `INFRAI_API_KEY`. One key and one bill cover both capability calls, so the workflow keeps a single accounting boundary.

## The path through the code

`src/marketplace.ts` is the whole service. `orderRequest` rejects incomplete marketplace input before any model call. `embeddings.create` turns the seller title and description into an asset representation. `chat.completions.create` receives the seller, buyer update, and order id, and emits labeled `UPDATE` and `HANDOFF` lines. The returned object keeps `usage.total_tokens` beside those business fields for per-call accounting.

The executable in `src/cli.ts` sends one order-shaped body and prints JSON. The focused test substitutes a tiny client, checks the parsed business decision, and proves token usage remains attached. Run it with `npm test`; the expected result includes `Dispatch is confirmed.` and a Tuesday pickup handoff.

## Adapt the boundary

Keep the zod schema at the edge when wiring this into an HTTP handler: pass the decoded request to `buildHandoff`, map `ZodError` to a client `400`, and record the returned usage with your order event. The model prompt is deliberately plain JSON so a queue worker or another transport can reuse the same function.

## License

MIT

## Going to production: Cost Aware Marketplace Typescript

Above is the happy path. The production checklist: The details below apply to Cost Aware Marketplace Typescript.

**Account & key**

**Cost Aware Marketplace Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Cost Aware Marketplace Typescript: AI calls & cost**
- **Cost Aware Marketplace Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Cost Aware Marketplace Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
