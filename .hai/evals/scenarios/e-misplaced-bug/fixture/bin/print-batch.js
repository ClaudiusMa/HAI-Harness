#!/usr/bin/env node
import fs from "node:fs";
import { buildInvoice } from "../src/invoice.js";
import { renderInvoice } from "../src/render.js";

const orders = JSON.parse(fs.readFileSync(new URL("../data/orders.json", import.meta.url), "utf8"));
const only = process.argv[2];
for (const order of orders) {
  if (only && order.id !== only) continue;
  console.log(renderInvoice(buildInvoice(order)));
  console.log("");
}
