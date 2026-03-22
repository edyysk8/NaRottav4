# NaRotta Architecture v3

## Backend
- Fastify API
- PostgreSQL + PostGIS
- Redis para presenca e tempo real
- JWT + refresh token rotativo
- Webhooks Mercado Pago assinados

## Apps
- Admin em Next.js com cookies httpOnly
- Mobile em Expo com WebView Mapbox

## Fluxos de producao
1. Admin autentica em `/auth/login`.
2. Admin renova sessao por `/auth/refresh` quando necessario.
3. Passageiro pede corrida.
4. API calcula rota com Mapbox Directions.
5. Matching ranqueia motoristas por score.
6. PIX e webhook atualizam `payments`.
