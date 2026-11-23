# Kiln invoices

Prints the weekly invoices for the studio's wholesale mug and bowl orders. Node only, no
dependencies.

- `node bin/print-batch.js` prints every order in `data/orders.json`.
- `node bin/print-batch.js <order id>` prints one order.
- `npm test` (or `node --test`) runs the tests in `test/`.

Volume discounts: 5% from 10 items, 10% from 25 items, per order.
