# Quickstart NaRotta

1. Crie o Postgres e habilite `postgis`.
2. Configure `apps/backend/.env` com o `DATABASE_URL` da Render.
3. Rode `npm install`, `npm run build` e `npm run seed` em `apps/backend`.
4. Suba o backend no Render usando `apps/backend` como root.
5. Configure `NEXT_PUBLIC_API_URL` no admin apontando para a URL pública da API.
6. Configure `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_MAPBOX_TOKEN` no mobile.
