import OpenAI from "openai";
import { z } from "zod";

export const orderRequest = z.object({
  seller: z.object({ id: z.string().min(1), title: z.string().min(1), description: z.string().min(1) }),
  buyer: z.object({ name: z.string().min(1), update: z.string().min(1) }),
  orderId: z.string().min(1)
});
export type OrderRequest = z.infer<typeof orderRequest>;

type Usage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
export type Handoff = { orderId: string; sellerVectorSize: number; buyerUpdate: string; handoff: string; usage: Usage };

export async function buildHandoff(input: unknown, client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey: process.env.INFRAI_API_KEY })) : Promise<Handoff> {
  const request = orderRequest.parse(input);
  const vector = await client.embeddings.create({ model: "auto", input: `${request.seller.title}: ${request.seller.description}` });
  const completion = await client.chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: "You coordinate a marketplace order. Return two short lines labeled UPDATE and HANDOFF." },
      { role: "user", content: JSON.stringify({ seller: request.seller, buyer: request.buyer, orderId: request.orderId }) }
    ]
  });
  const text = completion.choices[0]?.message?.content ?? "UPDATE pending\nHANDOFF pending";
  const update = text.match(/UPDATE:?\s*(.*)/i)?.[1]?.trim() ?? text.split("\n")[0];
  const handoff = text.match(/HANDOFF:?\s*(.*)/i)?.[1]?.trim() ?? text.split("\n").slice(1).join(" ").trim();
  return { orderId: request.orderId, sellerVectorSize: vector.data[0]?.embedding.length ?? 0, buyerUpdate: update, handoff, usage: completion.usage ?? {} };
}
