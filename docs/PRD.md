# PRD - NaRotta

## Visao
NaRotta e uma plataforma de mobilidade urbana com apps para passageiro e motorista e um painel administrativo para operacao e expansao multi-cidade.

## Objetivos do MVP
- Solicitar corridas com origem e destino
- Encontrar motoristas online por proximidade
- Acompanhar o status da corrida
- Registrar pagamento e fechamento da corrida
- Dar visibilidade operacional ao admin

## Usuarios
- Passageiro
- Motorista
- Operacao/Admin

## Requisitos funcionais
### Passageiro
- Criar conta e autenticar
- Salvar perfil
- Solicitar corrida
- Ver status da corrida
- Cancelar corrida antes do inicio
- Avaliar motorista

### Motorista
- Criar conta e autenticar
- Enviar documentos e dados do carro
- Ficar online/offline
- Atualizar localizacao
- Aceitar ou recusar corridas
- Iniciar e finalizar corridas

### Admin
- Aprovar motoristas
- Consultar usuarios e corridas
- Ver indicadores operacionais
- Ajustar tarifa base e comissao

## Requisitos nao funcionais
- Tempo real com baixa latencia
- API stateless escalavel
- Banco relacional com suporte geoespacial
- Observabilidade desde o inicio
- Base preparada para multi-tenant futuramente
