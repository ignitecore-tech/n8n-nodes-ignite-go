# n8n-nodes-ignite-go

Nós da comunidade do n8n para o **Ignite GO**, a API de WhatsApp da Ignite Core.

O pacote traz:

- **Ignite GO**: nó de ação para enviar mensagens (texto, mídia, localização, contato, enquete, link com prévia), reagir, editar, apagar, marcar como lida, validar números, buscar foto de perfil, mostrar "digitando", ver e conectar a instância e consultar grupos.
- **Ignite GO Trigger**: inicia o workflow quando a instância recebe um evento (mensagem recebida, status de entrega, conexão e outros). Ao ativar o workflow, o nó cadastra sozinho um webhook na instância; ao desativar, apaga. Cada entrega é conferida pela assinatura HMAC.
- **Ignite GO API**: credencial com a URL do servidor e a chave.

## Instalação

### Pelo painel do n8n (recomendado)

1. Abra **Settings > Community Nodes**.
2. Clique em **Install**.
3. Digite `n8n-nodes-ignite-go` e confirme.

Depois disso os nós aparecem na busca como "Ignite GO" e "Ignite GO Trigger".

### n8n self-hosted em Docker, sem o painel

Se a instalação pelo painel estiver desligada, instale o pacote numa pasta de extensões e aponte o n8n para ela com `N8N_CUSTOM_EXTENSIONS`:

```bash
mkdir -p /opt/n8n-extensions && cd /opt/n8n-extensions
npm pack n8n-nodes-ignite-go
tar -xzf n8n-nodes-ignite-go-*.tgz && mv package n8n-nodes-ignite-go
```

No `docker-compose.yml` do n8n:

```yaml
services:
  n8n:
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/extensions
    volumes:
      - /opt/n8n-extensions:/home/node/extensions
```

Reinicie o container. Instalado assim, o tipo do nó fica com o prefixo `CUSTOM.` em vez de `n8n-nodes-ignite-go.`; workflows exportados de um jeito não abrem direto no outro.

## Credencial

Crie uma credencial **Ignite GO API**:

| Campo | O que colocar |
| --- | --- |
| URL do Servidor | Endereço do GO, sem barra no final. Padrão: `https://api.ignitecore.com.br`. Troque só se a sua conta usar outro endereço. |
| API Key | O **token da instância** ou a **api_key da organização**. |

Onde achar a chave:

- **Token da instância**: no painel do GO, entre na instância e abra o **Dashboard**; o botão **Token** mostra e copia o token. Ele também vem na resposta do `POST /instance`. Opera só aquela instância, então o campo **Instância** dos nós precisa ser ela (nome ou ID).
- **api_key da organização**: entregue pelo administrador da plataforma. Opera qualquer instância da organização.

A chave vai no header `apikey` em todas as chamadas. A credencial não tem botão de teste: a única rota do GO que valida chave sem instância aceita só a chave de organização e recusaria o token de instância. Para conferir, rode a operação **Instância > Ver Instância**.

## Campo "Para"

- Pessoa: só o número, com DDI e DDD, sem `+` nem espaços. Exemplo: `5511999999999`.
- Grupo: o JID completo, terminado em `@g.us`. Exemplo: `120363012345678901@g.us`.
- Também aceita JID completo `@s.whatsapp.net`, `@lid` ou `@newsletter`.

## Operações do nó Ignite GO

Todas usam o campo **Instância** (nome ou ID) e devolvem o JSON da API. Os envios devolvem `{ message_id, timestamp, status }`. Rotas que respondem 204 viram `{ success: true, statusCode: 204 }`.

### Mensagem

| Operação | Rota no GO | Campos |
| --- | --- | --- |
| Enviar Texto | `POST /message/{instância}/sendText` | para, mensagem, responder à mensagem (opcional) |
| Enviar Imagem | `POST /message/{instância}/sendImage` | para, mídia, legenda, tipo MIME, responder |
| Enviar Vídeo | `POST /message/{instância}/sendVideo` | para, mídia, legenda, tipo MIME, responder |
| Enviar Áudio | `POST /message/{instância}/sendAudio?ptt=true\|false` | para, mídia, nota de voz (PTT), tipo MIME, responder |
| Enviar Documento | `POST /message/{instância}/sendDocument` | para, mídia, nome do arquivo, legenda, tipo MIME, responder |
| Enviar Figurinha | `POST /message/{instância}/sendSticker` | para, mídia (WebP), tipo MIME, responder |
| Enviar Localização | `POST /message/{instância}/sendLocation` | para, latitude, longitude, nome do local, endereço |
| Enviar Contato | `POST /message/{instância}/sendContact` | para, nome e telefone (o nó monta o vCard) ou vCard pronto |
| Enviar Enquete | `POST /message/{instância}/sendPoll` | para, pergunta, opções (pelo menos 2), máximo de escolhas |
| Enviar Link com Prévia | `POST /message/{instância}/sendLink` | para, texto, título, descrição, URL da miniatura |
| Reagir | `POST /message/{instância}/sendReaction` | para, ID da mensagem, emoji (vazio remove), enviada por mim (`from_me`), participante em grupo |
| Editar | `PUT /message/{instância}/{id}/edit` | para, ID da mensagem, novo texto (até cerca de 15 minutos após o envio) |
| Apagar | `DELETE /message/{instância}/{id}` | para, ID da mensagem (apaga para todos) |
| Marcar como Lida | `POST /message/{instância}/read` | conversa, IDs das mensagens, remetente em grupo |

Fonte da mídia: **URL** pública (o GO baixa, até 64 MB), **Base64** (com ou sem o prefixo `data:...;base64,`) ou **Binário de Entrada** (arquivo vindo do nó anterior, convertido para base64; nome e tipo do arquivo saem do binário quando os campos ficam vazios).

### Conversa

| Operação | Rota no GO | Campos |
| --- | --- | --- |
| Validar Números | `POST /chat/{instância}/check-numbers` | números (lista); devolve um item por número |
| Foto de Perfil | `GET /profile/{instância}/picture?jid=...` | contato ou grupo, miniatura |
| Presença no Chat | `POST /presence/{instância}/chat` | para, presença: digitando, gravando áudio ou pausado |

Atenção na validação de números: consulta em massa parece lista fria para o WhatsApp e pode restringir ou banir o número da instância. Confira só quem vai receber mensagem. O GO limita a quantidade por chamada e por minuto (`400 too_many_numbers`, `429 rate_limited`).

### Instância

| Operação | Rota no GO | Observação |
| --- | --- | --- |
| Ver Instância | `GET /instance/{instância}` | status, telefone, configurações, último evento |
| Conectar | `GET /instance/{instância}/connect` | devolve `status` e, quando houver, `qr_code` e `qr_image`; opção para entregar o QR como binário PNG |

### Grupo

| Operação | Rota no GO | Observação |
| --- | --- | --- |
| Ver Grupo | `GET /group/{instância}/{jid}` | dados e participantes |
| Link de Convite | `GET /group/{instância}/{jid}/invite-link` | opção para revogar e gerar um novo (`reset=true`) |

Sem o `@g.us` no JID do grupo, o nó completa.

### Erros

Com **On Error > Continue** (ou "Continue On Fail"), o item com erro sai com `error`, `description`, `httpCode` e `code`, onde `code` é o código do GO (`daily_limit_reached`, `not_connected`, `send_failed`, `bad_request` e outros). Sem essa opção, o workflow para com a mensagem do GO.

## Ignite GO Trigger

Parâmetros: **Instância** e **Eventos**. Padrão: `message.received`.

Ao ativar o workflow, o nó:

1. Lista os webhooks da instância (`GET /webhook/{instância}`). Se já existe um cadastrado por ele, com o mesmo segredo e os mesmos eventos, reaproveita; um cadastro antigo com a mesma URL é apagado.
2. Cadastra o webhook (`POST /webhook/{instância}`) com a URL de produção do n8n, os eventos escolhidos, `webhook_by_events: false` (todos os eventos chegam na mesma URL) e um segredo aleatório de 32 bytes, guardado nos dados estáticos do workflow.

Ao desativar, apaga o webhook (`DELETE /webhook/{instância}/{id}`).

A cada entrega, o nó calcula o HMAC-SHA256 do **corpo bruto** com o segredo e compara com o header `X-Webhook-Signature` (`sha256=<hex>`). Se não bater, responde **401** e o workflow não roda. Se bater, sai um item no formato:

```json
{
  "event": "message.received",
  "type": "message.received",
  "instanceId": "ba6bd24e-...",
  "instanceName": "minha-loja",
  "messageId": "3EB0C431D5F2A1B2C3D4",
  "phone": "5511988887777",
  "fromMe": false,
  "messageType": "text",
  "text": { "message": "Olá!" }
}
```

`event` vem do header `X-Webhook-Event`; o resto é o corpo enviado pelo GO. Use `event` para rotear: o campo `type` do corpo pode vir com nome antigo em alguns eventos.

Eventos disponíveis: `all`, `instance.boot`, `instance.logout`, `instance.removed`, `instance.health`, `connection.state`, `connection.connected`, `connection.disconnected`, `connection.qr`, `connection.unstable`, `call.incoming`, `call.rejected`, `message.received`, `message.sent`, `message.status`, `message.history`, `message.deleted`, `message.edited`, `message.reaction`, `chat.history`, `chat.created`, `chat.updated`, `chat.deleted`, `contact.history`, `contact.created`, `contact.updated`, `presence.changed`, `group.created`, `group.updated`, `group.participants`, `label.changed`, `label.linked`.

Opção **Incluir Mídia em Base64**: `message.received` e `message.sent` passam a trazer o arquivo da mídia em base64 (`webhook_base64`). O corpo fica bem maior.

O botão **Test** do webhook no painel do GO manda o evento `webhook.test`, assinado com o mesmo segredo; ele também dispara o workflow.

Requisitos:

- O GO precisa alcançar o n8n por um endereço público em http ou https. Configure `WEBHOOK_URL` no n8n se ele estiver atrás de proxy; o GO recusa `localhost` e IPs privados.
- Cada ativação cria um webhook novo com segredo novo. Se os dados estáticos do workflow se perderem (por exemplo, workflow importado), desative e ative de novo.

## Compatibilidade

- Testado no n8n 2.10.3 (Node.js 22), com `n8nNodesApiVersion` 1. O pacote usa a API atual do `n8n-workflow` (`NodeConnectionTypes`); versões antigas do n8n 1.x podem não carregar os nós.
- Ignite GO com as rotas da API pública atual (`/message`, `/chat`, `/presence`, `/profile`, `/instance`, `/group`, `/webhook`).
- O nó de ação pode ser usado como ferramenta de agente de IA (`usableAsTool`).

## Desenvolvimento

```bash
npm install
npm run build   # tsc e cópia de ícones e codex para dist/
npm run lint    # eslint-plugin-n8n-nodes-base
```

Para publicar uma versão nova, veja o [RELEASE.md](RELEASE.md).

## Licença

MIT
