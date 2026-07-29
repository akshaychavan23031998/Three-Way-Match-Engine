# Synthetic sample documents

These JSON files are safe, synthetic fixtures for development and QA. The three
`sample-*` documents form a matched PO/GRN/invoice set. The remaining files
describe quantity, price, unmapped-SKU, and duplicate-document scenarios.

The production upload endpoint accepts PDF and supported image formats, not JSON.
Tests mock the Gemini parsing boundary and return these parsed shapes; no external
Gemini request is made.
