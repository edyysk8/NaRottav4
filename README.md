# NaRotta v4

Monorepo da NaRotta com backend Fastify + PostgreSQL/PostGIS + Redis, painel admin Next.js e app mobile Expo.

## Melhorias nesta versão
- correção completa do fluxo de autenticação com refresh token
- compatibilidade com Render usando PostgreSQL com SSL
- mapa gratuito com OpenStreetMap + OSRM
- matching inteligente com score operacional
- rota `POST /rides/estimate` para cotação antes da solicitação
- rota `POST /rides/:id/cancel` com motivo de cancelamento
- healthcheck em `/` e `/health`
- seed inicial de admin e tarifa padrão
- exemplos de `.env` atualizados para Render

## Deploy rápido
### Backend (Render)
- Root Directory: `apps/backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

### Banco
- Rode `sql/schema.sql`
- Ative `postgis`

### Seed
```bash
npm --workspace apps/backend run seed
```

## Variáveis principais
Veja `apps/backend/.env.example`.
