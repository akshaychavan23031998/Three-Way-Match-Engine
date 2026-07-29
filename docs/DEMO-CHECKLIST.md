# Demo checklist

- [ ] MongoDB is ready and `npm run seed:sku` reports created/updated/unchanged counts.
- [ ] `/api/health`, `/api/ready`, and `/api/docs` load.
- [ ] Login accepts a valid email/password and opens the dashboard.
- [ ] Seeded SKUs appear; create/edit an SKU with a string identifier.
- [ ] Upload a PO and show its pending audit.
- [ ] Upload a GRN and show partial matching.
- [ ] Upload an invoice and show a matched result, quantities, totals, and references.
- [ ] Show a quantity/price/unmapped or duplicate mismatch reason.
- [ ] Open audit history and trigger manual recomputation.
- [ ] Delete a document and show recalculation feedback and refreshed summary.
- [ ] Log out and confirm protected navigation returns to login.
- [ ] Mention static authentication, synchronous processing, and ephemeral local uploads.
