import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { goPathSegment, igniteGoApiRequest, WEBHOOK_EVENTS } from './GenericFunctions';

interface GoWebhook {
	id?: string;
	url?: string;
	events?: string[];
}

interface RawBodyRequest {
	rawBody?: Buffer;
	readRawBody?: () => Promise<void>;
	body?: unknown;
}

function sameEvents(a: string[] = [], b: string[] = []): boolean {
	if (a.length !== b.length) return false;
	const sorted = [...b].sort();
	return [...a].sort().every((value, index) => value === sorted[index]);
}

function selectedEvents(this: IHookFunctions): string[] {
	const events = (this.getNodeParameter('events', []) as string[]).filter((e) => e !== '');
	if (events.length === 0 || events.includes('all')) return ['all'];
	return events;
}

function instancePath(this: IHookFunctions, stored?: unknown): string {
	const ref =
		typeof stored === 'string' && stored !== ''
			? stored
			: String(this.getNodeParameter('instance', '')).trim();
	if (ref === '') {
		throw new NodeOperationError(this.getNode(), 'Informe a instância (nome ou ID)');
	}
	return goPathSegment(ref);
}

export class IgniteGoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ignite GO Trigger',
		name: 'igniteGoTrigger',
		icon: 'file:ignitego.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{($parameter["events"] || []).join(", ")}}',
		description:
			'Inicia o workflow quando o Ignite GO envia um evento da instância (mensagem recebida, status, conexão e outros)',
		defaults: {
			name: 'Ignite GO Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'igniteGoApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Instância',
				name: 'instance',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'minha-loja',
				description:
					'Nome ou ID da instância no GO. Com o token de instância na credencial, precisa ser a instância dona do token.',
			},
			{
				displayName: 'Eventos',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: WEBHOOK_EVENTS,
				default: ['message.received'],
				description:
					'Eventos que disparam o workflow. Ao ativar, o nó cadastra um webhook na instância com esses eventos e um segredo próprio; ao desativar, apaga o webhook.',
			},
			{
				displayName: 'Opções',
				name: 'options',
				type: 'collection',
				placeholder: 'Adicionar Opção',
				default: {},
				options: [
					{
						displayName: 'Incluir Mídia em Base64',
						name: 'webhookBase64',
						type: 'boolean',
						default: false,
						description:
							'Ligado, os eventos message.received e message.sent trazem o arquivo da mídia em base64 (bloco media). Deixa o corpo bem maior.',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const inst = instancePath.call(this);

				const response = await igniteGoApiRequest.call(this, 'GET', `/webhook/${inst}`);
				const hooks = Array.isArray(response.body) ? (response.body as GoWebhook[]) : [];
				const events = selectedEvents.call(this);

				let found = false;
				for (const hook of hooks) {
					if (hook.url !== webhookUrl || !hook.id) continue;
					const isOurs =
						hook.id === webhookData.webhookId &&
						typeof webhookData.secret === 'string' &&
						webhookData.secret !== '' &&
						sameEvents(hook.events, events);
					if (isOurs && !found) {
						found = true;
						continue;
					}
					// Webhook com a URL deste nó mas sem segredo conhecido, com eventos antigos ou
					// duplicado: apaga para o create() cadastrar um novo, assinado.
					await igniteGoApiRequest.call(this, 'DELETE', `/webhook/${inst}/${goPathSegment(hook.id)}`);
				}
				return found;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const instanceRef = String(this.getNodeParameter('instance', '')).trim();
				const inst = instancePath.call(this);
				const options = this.getNodeParameter('options', {}) as IDataObject;
				const secret = randomBytes(32).toString('hex');

				const workflow = this.getWorkflow();
				const name = `n8n: ${workflow.name ?? workflow.id ?? 'workflow'}`.slice(0, 60);

				const response = await igniteGoApiRequest.call(this, 'POST', `/webhook/${inst}`, {
					name,
					url: webhookUrl,
					events: selectedEvents.call(this),
					secret,
					enabled: true,
					webhook_by_events: false,
					webhook_base64: options.webhookBase64 === true,
				});

				const created = response.body as GoWebhook | undefined;
				if (!created || typeof created.id !== 'string' || created.id === '') {
					throw new NodeOperationError(
						this.getNode(),
						'O GO não devolveu o ID do webhook criado',
					);
				}

				webhookData.webhookId = created.id;
				webhookData.secret = secret;
				webhookData.instance = instanceRef;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (typeof webhookData.webhookId === 'string' && webhookData.webhookId !== '') {
					const inst = instancePath.call(this, webhookData.instance);
					try {
						await igniteGoApiRequest.call(
							this,
							'DELETE',
							`/webhook/${inst}/${goPathSegment(webhookData.webhookId)}`,
						);
					} catch (error) {
						// 404: o webhook já não existe no GO, segue limpando o estado local.
						const httpCode = String((error as { httpCode?: unknown }).httpCode ?? '');
						if (httpCode !== '404') return false;
					}
				}
				delete webhookData.webhookId;
				delete webhookData.secret;
				delete webhookData.instance;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject() as unknown as RawBodyRequest;
		const res = this.getResponseObject();
		const headers = this.getHeaderData();
		const webhookData = this.getWorkflowStaticData('node');
		const secret = typeof webhookData.secret === 'string' ? webhookData.secret : '';

		const reject = (message: string): IWebhookResponseData => {
			res.status(401).json({ error: 'unauthorized', message });
			return { noWebhookResponse: true };
		};

		if (secret === '') {
			return reject('webhook sem segredo cadastrado no n8n; desative e ative o workflow');
		}

		if (!req.rawBody && typeof req.readRawBody === 'function') {
			await req.readRawBody();
		}
		const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody : undefined;
		if (rawBody === undefined) {
			return reject('corpo bruto indisponível para conferir a assinatura');
		}

		const received = String(headers['x-webhook-signature'] ?? '');
		const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
		const valid =
			received.length === expected.length &&
			timingSafeEqual(Buffer.from(received), Buffer.from(expected));
		if (!valid) {
			return reject('assinatura X-Webhook-Signature inválida');
		}

		let body: IDataObject = {};
		const parsed = this.getBodyData();
		if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
			body = parsed;
		} else if (rawBody.length > 0) {
			try {
				const decoded = JSON.parse(rawBody.toString('utf8')) as unknown;
				body = decoded !== null && typeof decoded === 'object' ? (decoded as IDataObject) : { data: decoded as string };
			} catch {
				body = { data: rawBody.toString('utf8') };
			}
		}

		const event = String(headers['x-webhook-event'] ?? '');

		return {
			workflowData: [this.helpers.returnJsonArray([{ event, ...body }])],
		};
	}
}
