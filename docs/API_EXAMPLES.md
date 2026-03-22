# API Examples

## Login admin
```bash
curl -X POST http://localhost:4000/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@narotta.com","password":"123456"}'
```

## Refresh token
```bash
curl -X POST http://localhost:4000/auth/refresh   -H "Content-Type: application/json"   -d '{"refreshToken":"SEU_REFRESH_TOKEN"}'
```

## Rota com Mapbox Directions
```bash
curl "http://localhost:4000/mapbox/directions?pickupLat=-23.5614&pickupLng=-46.6559&destinationLat=-23.5558&destinationLng=-46.6621"
```

## Solicitar corrida com rota persistida
```bash
curl -X POST http://localhost:4000/rides/request   -H "Authorization: Bearer TOKEN_PASSAGEIRO"   -H "Content-Type: application/json"   -d '{
    "pickupAddress":"Av. Paulista, 1000",
    "destinationAddress":"Rua Augusta, 200",
    "pickupLat":-23.5614,
    "pickupLng":-46.6559,
    "destinationLat":-23.5558,
    "destinationLng":-46.6621,
    "cityCode":"default"
  }'
```

## PIX Mercado Pago
```bash
curl -X POST http://localhost:4000/payments/RIDE_ID/pix   -H "Authorization: Bearer TOKEN_PASSAGEIRO"
```
