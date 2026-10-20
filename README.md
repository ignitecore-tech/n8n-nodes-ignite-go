# n8n-nodes-ignite-go

n8n community nodes for **Ignite GO**, the WhatsApp API by Ignite Core.

The package includes:

- **Ignite GO**: action node to send messages (text, media, location, contact, poll, link with preview), react, edit, delete, mark as read, check numbers, get profile pictures, show "typing", get and connect the instance, and get groups.
- **Ignite GO Trigger**: starts the workflow when the instance receives an event (message received, delivery status, connection and more). When the workflow is activated, the node registers a webhook on the instance by itself; when it is deactivated, the node deletes it. Every delivery is verified with an HMAC signature.
- **Ignite GO API**: credential with the server URL and the key.

## Installation

### From the n8n panel (recommended)

1. Open **Settings > Community Nodes**.
2. Click **Install**.
3. Enter `n8n-nodes-ignite-go` and confirm.

The nodes then show up in the node search as "Ignite GO" and "Ignite GO Trigger".

### n8n in Docker, without the panel

If installing from the panel is disabled, install the package in an extensions folder and point n8n to it with `N8N_CUSTOM_EXTENSIONS`:

```bash
mkdir -p /opt/n8n-extensions && cd /opt/n8n-extensions
npm pack n8n-nodes-ignite-go
tar -xzf n8n-nodes-ignite-go-*.tgz && mv package n8n-nodes-ignite-go
```

In the n8n `docker-compose.yml`:

```yaml
services:
  n8n:
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/extensions
    volumes:
      - /opt/n8n-extensions:/home/node/extensions
```

Restart the container. Installed this way, the node type gets the `CUSTOM.` prefix instead of `n8n-nodes-ignite-go.`, so workflows exported from one setup do not open directly in the other.

## Credential

Create an **Ignite GO API** credential:

| Field | What to enter |
| --- | --- |
| Server URL | Address of the Ignite GO server, without a trailing slash. Default: `https://api.ignitecore.com.br`. Change it only if your account uses a different address. |
| API Key | The **instance token** or the **company API key**, both from the Ignite GO panel. |

Where to find the key:

- **Instance token**: in the Ignite GO panel, open the instance and go to its **Dashboard**; the **Token** button shows and copies the token. It is also returned by `POST /instance`. It works only with that instance, so the **Instance** field of the nodes must be that instance (name or ID).
- **Company API key**: the key of your company account in Ignite GO. It works with any instance of the company.

The key is sent in the `apikey` header on every call. When you save the credential, n8n tests it with `GET /auth/check`, which accepts both kinds of key. The test fails with an authorization error when the key is invalid (401) and with a forbidden error when the account is suspended (403).

## "To" field

- Person: only the number, with country and area code, without `+` or spaces. Example: `5511999999999`.
- Group: the full JID, ending in `@g.us`. Example: `120363012345678901@g.us`.
- Full JIDs ending in `@s.whatsapp.net`, `@lid` or `@newsletter` are also accepted.

## Ignite GO node operations

Every operation uses the **Instance** field (name or ID) and returns the API JSON. Send operations return `{ message_id, timestamp, status }`. Routes that answer 204 become `{ success: true, statusCode: 204 }`.

### Message

| Operation | Ignite GO route | Fields |
| --- | --- | --- |
| Send Text | `POST /message/{instance}/sendText` | to, message, reply to message ID (optional) |
| Send Image | `POST /message/{instance}/sendImage` | to, media, caption, MIME type, reply to |
| Send Video | `POST /message/{instance}/sendVideo` | to, media, caption, MIME type, reply to |
| Send Audio | `POST /message/{instance}/sendAudio?ptt=true\|false` | to, media, voice note (PTT), MIME type, reply to |
| Send Document | `POST /message/{instance}/sendDocument` | to, media, file name, caption, MIME type, reply to |
| Send Sticker | `POST /message/{instance}/sendSticker` | to, media (WebP), MIME type, reply to |
| Send Location | `POST /message/{instance}/sendLocation` | to, latitude, longitude, location name, address |
| Send Contact | `POST /message/{instance}/sendContact` | to, name and phone (the node builds the vCard) or a custom vCard |
| Send Poll | `POST /message/{instance}/sendPoll` | to, question, options (at least 2), max selections |
| Send Link | `POST /message/{instance}/sendLink` | to, text, title, description, thumbnail URL |
| React | `POST /message/{instance}/sendReaction` | to, message ID, emoji (empty removes it), from me (`from_me`), participant in groups |
| Edit | `PUT /message/{instance}/{id}/edit` | to, message ID, new text (up to about 15 minutes after sending) |
| Delete | `DELETE /message/{instance}/{id}` | to, message ID (deletes for everyone) |
| Mark as Read | `POST /message/{instance}/read` | chat, message IDs, sender in groups |

Media source: public **URL** (Ignite GO downloads it, up to 64 MB), **Base64** (with or without the `data:...;base64,` prefix) or **Binary File** (file from the previous node, converted to base64; the file name and type come from the binary data when those fields are empty).

### Chat

| Operation | Ignite GO route | Fields |
| --- | --- | --- |
| Check Numbers | `POST /chat/{instance}/check-numbers` | phone numbers (list); returns one item per number |
| Get Profile Picture | `GET /profile/{instance}/picture?jid=...` | contact or group, thumbnail |
| Send Presence | `POST /presence/{instance}/chat` | to, presence: typing, recording audio or paused |

Be careful when checking numbers: bulk checks look like a cold list to WhatsApp and can get the instance number restricted or banned. Only check people who will receive a message. Ignite GO limits how many numbers you can check per call and per minute (`400 too_many_numbers`, `429 rate_limited`).

### Instance

| Operation | Ignite GO route | Notes |
| --- | --- | --- |
| Get | `GET /instance/{instance}` | status, phone, settings, last event |
| Connect | `GET /instance/{instance}/connect` | returns `status` and, when there is one, `qr_code` and `qr_image`; option to output the QR code as a PNG binary file |

### Group

| Operation | Ignite GO route | Notes |
| --- | --- | --- |
| Get | `GET /group/{instance}/{jid}` | group data and participants |
| Get Invite Link | `GET /group/{instance}/{jid}/invite-link` | option to revoke the link and generate a new one (`reset=true`) |

If the group JID has no `@g.us`, the node adds it.

### Errors

With **On Error > Continue** (or "Continue On Fail"), the failed item comes out with `error`, `description`, `httpCode` and `code`, where `code` is the Ignite GO error code (`daily_limit_reached`, `not_connected`, `send_failed`, `bad_request` and others). Without that option, the workflow stops with the Ignite GO error message.

## Ignite GO Trigger

Parameters: **Instance** and **Events**. Default: `message.received`.

When the workflow is activated, the node:

1. Lists the webhooks of the instance (`GET /webhook/{instance}`). If it already registered one with the same secret and the same events, it reuses it; an older webhook with the same URL is deleted.
2. Registers the webhook (`POST /webhook/{instance}`) with the n8n production URL, the selected events, `webhook_by_events: false` (all events arrive at the same URL) and a random 32-byte secret, stored in the workflow static data.

When the workflow is deactivated, the node deletes the webhook (`DELETE /webhook/{instance}/{id}`).

On every delivery, the node computes the HMAC-SHA256 of the **raw body** with the secret and compares it with the `X-Webhook-Signature` header (`sha256=<hex>`). If they do not match, it answers **401** and the workflow does not run. If they match, it outputs one item like this:

```json
{
  "event": "message.received",
  "type": "message.received",
  "instanceId": "ba6bd24e-...",
  "instanceName": "my-store",
  "messageId": "3EB0C431D5F2A1B2C3D4",
  "phone": "5511988887777",
  "fromMe": false,
  "messageType": "text",
  "text": { "message": "Hello!" }
}
```

`event` comes from the `X-Webhook-Event` header; the rest is the body sent by Ignite GO. Use `event` for routing: the `type` field of the body may carry a legacy name in some events.

Available events: `all`, `instance.boot`, `instance.logout`, `instance.removed`, `instance.health`, `connection.state`, `connection.connected`, `connection.disconnected`, `connection.qr`, `connection.unstable`, `call.incoming`, `call.rejected`, `message.received`, `message.sent`, `message.status`, `message.history`, `message.deleted`, `message.edited`, `message.reaction`, `chat.history`, `chat.created`, `chat.updated`, `chat.deleted`, `contact.history`, `contact.created`, `contact.updated`, `presence.changed`, `group.created`, `group.updated`, `group.participants`, `label.changed`, `label.linked`.

**Include Media as Base64** option: `message.received` and `message.sent` also carry the media file in base64 (`webhook_base64`). The payload gets much larger.

The webhook **Test** button in the Ignite GO panel sends the `webhook.test` event, signed with the same secret; it also triggers the workflow.

Requirements:

- Ignite GO must reach n8n at a public http or https address. Set `WEBHOOK_URL` in n8n if it runs behind a proxy; Ignite GO rejects `localhost` and private IPs.
- Every activation creates a new webhook with a new secret. If the workflow static data is lost (for example, an imported workflow), deactivate and activate the workflow again.

## Compatibility

- Tested on n8n 2.10.3 (Node.js 22), with `n8nNodesApiVersion` 1. The package uses the current `n8n-workflow` API (`NodeConnectionTypes`); older n8n 1.x versions may not load the nodes.
- Ignite GO with the routes of the current public API (`/auth`, `/message`, `/chat`, `/presence`, `/profile`, `/instance`, `/group`, `/webhook`).
- The action node can be used as an AI agent tool (`usableAsTool`).

## Development

```bash
npm install
npm run build      # tsc, then copies icons and codex files to dist/
npm run lint       # same rules as the n8n verification scanner, on the sources
npm run lint:dist  # same rules on the built files that go into the npm package
```

To publish a new version, see [RELEASE.md](RELEASE.md).

## License

MIT
