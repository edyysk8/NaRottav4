# NaRotta v3 - Deploy cloud

## Componentes
- `apps/backend`: Fastify + PostgreSQL + Redis
- `apps/admin`: Next.js com login real de admin
- `apps/mobile`: Expo para app operacional

## Variaveis essenciais
### API
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `MAPBOX_ACCESS_TOKEN`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `API_URL`
- `APP_URL`

### Admin
- `NEXT_PUBLIC_API_URL`

## Fluxo recomendado em cloud
1. Subir Postgres gerenciado com PostGIS.
2. Subir Redis gerenciado.
3. Deploy da API com healthcheck em `/health`.
4. Deploy do admin apontando para a API publica.
5. Configurar webhook do Mercado Pago para `/payments/webhooks/mercado-pago`.
6. Rodar `sql/schema.sql` no banco antes do bootstrap.

## Targets prontos neste repositório
- `infra/cloud/Dockerfile.api`
- `infra/cloud/Dockerfile.admin`
- `infra/cloud/railway.json`
- `infra/cloud/github-actions-api.yml`

## Check de producao
- TLS habilitado
- secrets em cofre da nuvem
- logs centralizados
- alertas para erro 5xx e falha de webhook
- backup automatico do Postgres
