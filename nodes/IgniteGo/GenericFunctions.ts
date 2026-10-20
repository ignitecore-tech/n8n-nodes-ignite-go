import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IWebhookFunctions,
} from 'n8n-workflow';

export type IgniteGoContext =
	| IExecuteFunctions
	| IHookFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

export interface IgniteGoResponse {
	statusCode: number;
	body: unknown;
}

/**
 * Escapa um segmento de caminho do jeito que o Go (net/url) escaparia.
 *
 * O roteador do GO (chi) passa a usar o caminho cru quando o caminho recebido difere do
 * escape padrão do Go, e aí os parâmetros chegam sem decodificar. Exemplo: um JID de grupo
 * mandado como "123%40g.us" chegaria ao handler com o "%40" literal. Por isso o "@" (e os
 * outros reservados que o Go deixa como estão) vão sem escape, e !'()* vão escapados.
 */
export function goPathSegment(value: string): string {
	return encodeURIComponent(value)
		.replace(/%(24|26|2B|2C|3A|3B|3D|40)/gi, (match) => decodeURIComponent(match))
		.replace(/[!'()*]/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** URL base da credencial, sem barra no final. */
export async function getBaseUrl(this: IgniteGoContext): Promise<string> {
	const credentials = await this.getCredentials('igniteGoApi');
	return String(credentials.serverUrl ?? '')
		.trim()
		.replace(/\/+$/, '');
}

/**
 * Chamada autenticada à API do Ignite GO (header `apikey` vem da credencial).
 * Devolve status e corpo; erros HTTP sobem como NodeApiError, lançado pelo helper do n8n.
 */
export async function igniteGoApiRequest(
	this: IgniteGoContext,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IgniteGoResponse> {
	const baseUrl = await getBaseUrl.call(this);
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${path}`,
		json: true,
		returnFullResponse: true,
	};
	if (body !== undefined) options.body = body;
	if (qs !== undefined && Object.keys(qs).length > 0) options.qs = qs;

	let response: { statusCode: number; body: unknown };
	try {
		response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'igniteGoApi',
			options,
		)) as { statusCode: number; body: unknown };
	} catch (error) {
		// O GO responde erro como { error: "codigo", message: "texto" }; o n8n guarda esse corpo
		// em context.data. Leva o texto e o código para a mensagem, que o padrão do n8n deixa genérica.
		const data = goErrorBody(error);
		if (data !== undefined && typeof data.message === 'string' && data.message !== '') {
			const code = typeof data.error === 'string' && data.error !== '' ? ` (${data.error})` : '';
			(error as Error).message = `Ignite GO${code}: ${data.message}`;
		}
		throw error;
	}

	return { statusCode: response.statusCode, body: response.body };
}

/** Corpo de erro do GO ({ error, message }) guardado pelo NodeApiError, quando houver. */
export function goErrorBody(error: unknown): IDataObject | undefined {
	const data = (error as { context?: { data?: unknown } } | undefined)?.context?.data;
	return data !== null && typeof data === 'object' && !Array.isArray(data)
		? (data as IDataObject)
		: undefined;
}

/** Remove chaves com string vazia, undefined ou null, para não mandar campo vazio ao GO. */
export function compact(obj: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value === undefined || value === null) continue;
		if (typeof value === 'string' && value.trim() === '') continue;
		out[key] = value;
	}
	return out;
}

/** Lê uma lista vinda de um campo texto (vírgula, ponto e vírgula, espaço ou quebra de linha) ou de um array. */
export function toList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((v) => String(v).trim()).filter((v) => v !== '');
	}
	return String(value ?? '')
		.split(/[\s,;]+/)
		.map((v) => v.trim())
		.filter((v) => v !== '');
}

/**
 * Eventos de webhook do GO (internal/models/webhook.go, AllEvents), com rótulo em pt-BR.
 * "all" assina todos.
 */
export const WEBHOOK_EVENTS: INodePropertyOptions[] = [
	{ name: 'Todos os Eventos (all)', value: 'all', description: 'Assina todos os eventos da instância' },
	{ name: 'Instância Iniciada (instance.boot)', value: 'instance.boot' },
	{ name: 'Instância Deslogada (instance.logout)', value: 'instance.logout' },
	{ name: 'Instância Removida (instance.removed)', value: 'instance.removed' },
	{ name: 'Saúde da Instância (instance.health)', value: 'instance.health', description: 'Sinal de saúde: ban, trava, restrição ou falha de envio' },
	{ name: 'Conexão: Mudança de Estado (connection.state)', value: 'connection.state' },
	{ name: 'Conexão: Conectada (connection.connected)', value: 'connection.connected' },
	{ name: 'Conexão: Desconectada (connection.disconnected)', value: 'connection.disconnected' },
	{ name: 'Conexão: QR Code (connection.qr)', value: 'connection.qr' },
	{ name: 'Conexão: Instável (connection.unstable)', value: 'connection.unstable', description: 'Muitas quedas numa janela curta' },
	{ name: 'Chamada Recebida (call.incoming)', value: 'call.incoming' },
	{ name: 'Chamada Rejeitada (call.rejected)', value: 'call.rejected' },
	{ name: 'Mensagem Recebida (message.received)', value: 'message.received' },
	{ name: 'Mensagem Enviada (message.sent)', value: 'message.sent', description: 'Mensagem enviada pela API' },
	{ name: 'Status da Mensagem (message.status)', value: 'message.status', description: 'Entregue ou lida' },
	{ name: 'Histórico de Mensagens (message.history)', value: 'message.history' },
	{ name: 'Mensagem Apagada (message.deleted)', value: 'message.deleted' },
	{ name: 'Mensagem Editada (message.edited)', value: 'message.edited' },
	{ name: 'Reação em Mensagem (message.reaction)', value: 'message.reaction' },
	{ name: 'Histórico de Conversas (chat.history)', value: 'chat.history' },
	{ name: 'Conversa Criada (chat.created)', value: 'chat.created' },
	{ name: 'Conversa Atualizada (chat.updated)', value: 'chat.updated' },
	{ name: 'Conversa Apagada (chat.deleted)', value: 'chat.deleted' },
	{ name: 'Histórico de Contatos (contact.history)', value: 'contact.history' },
	{ name: 'Contato Criado (contact.created)', value: 'contact.created' },
	{ name: 'Contato Atualizado (contact.updated)', value: 'contact.updated' },
	{ name: 'Presença Alterada (presence.changed)', value: 'presence.changed' },
	{ name: 'Grupo Criado (group.created)', value: 'group.created' },
	{ name: 'Grupo Atualizado (group.updated)', value: 'group.updated' },
	{ name: 'Participantes do Grupo (group.participants)', value: 'group.participants' },
	{ name: 'Etiqueta Alterada (label.changed)', value: 'label.changed' },
	{ name: 'Etiqueta Vinculada (label.linked)', value: 'label.linked' },
];
