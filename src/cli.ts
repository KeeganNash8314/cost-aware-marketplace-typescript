import { buildHandoff } from "./marketplace.js";

const body = {
  orderId: "order-42",
  seller: { id: "seller-7", title: "Oak desk", description: "Solid oak desk, 120cm wide, ships in two days." },
  buyer: { name: "Mina", update: "Please confirm the dispatch window." }
};

if (!process.env.INFRAI_API_KEY) throw new Error("Set INFRAI_API_KEY before running the example");
console.log(JSON.stringify(await buildHandoff(body), null, 2));
