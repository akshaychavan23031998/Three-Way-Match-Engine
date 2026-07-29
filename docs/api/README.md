# API notes

Interactive OpenAPI documentation is served at `http://localhost:5000/api/docs`.
Application endpoints use `/api`, return a consistent success/error envelope, and require a bearer
token except for health, login, and documentation.
