import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

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
 * Escapes a path segment the same way Go's net/url would.
 *
 * The Ignite GO router (chi) switches to the raw path when the received path differs from Go's
 * default escaping, and then the route parameters arrive still encoded. Example: a group JID sent
 * as "123%40g.us" would reach the handler with a literal "%40". That is why "@" (and the other
 * reserved characters Go leaves as they are) are sent unescaped, while !'()* are escaped.
 */
export function goPathSegment(value: string): string {
	return encodeURIComponent(value)
		.replace(/%(24|26|2B|2C|3A|3B|3D|40)/gi, (match) => decodeURIComponent(match))
		.replace(/[!'()*]/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** Base URL from the credential, without a trailing slash. */
export async function getBaseUrl(this: IgniteGoContext): Promise<string> {
	const credentials = await this.getCredentials('igniteGoApi');
	return String(credentials.serverUrl ?? '')
		.trim()
		.replace(/\/+$/, '');
}

/**
 * Authenticated call to the Ignite GO API (the `apikey` header comes from the credential).
 * Returns the status code and body. Failures are thrown as NodeApiError, carrying the Ignite GO
 * error message and code.
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
		// Ignite GO answers errors as { error: "code", message: "text" } and n8n keeps that body in
		// context.data. The default n8n message is generic, so the Ignite GO text and code go into it.
		const data = goErrorBody(error);
		const goMessage =
			data !== undefined && typeof data.message === 'string' && data.message !== ''
				? `Ignite GO${typeof data.error === 'string' && data.error !== '' ? ` (${data.error})` : ''}: ${data.message}`
				: undefined;

		// When the n8n helper already threw a NodeApiError, the constructor returns that same error.
		const apiError = new NodeApiError(this.getNode(), error as JsonObject, {
			message: goMessage,
		});
		if (goMessage !== undefined) apiError.message = goMessage;
		if (data !== undefined && apiError.context.data === undefined) apiError.context.data = data;
		throw apiError;
	}

	return { statusCode: response.statusCode, body: response.body };
}

/** Ignite GO error body ({ error, message }) kept by NodeApiError, when there is one. */
export function goErrorBody(error: unknown): IDataObject | undefined {
	const data = (error as { context?: { data?: unknown } } | undefined)?.context?.data;
	return data !== null && typeof data === 'object' && !Array.isArray(data)
		? (data as IDataObject)
		: undefined;
}

/** Drops keys holding an empty string, undefined or null, so no empty field is sent to Ignite GO. */
export function compact(obj: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value === undefined || value === null) continue;
		if (typeof value === 'string' && value.trim() === '') continue;
		out[key] = value;
	}
	return out;
}

/** Reads a list from a text field (commas, semicolons, spaces or line breaks) or from an array. */
export function toList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((v) => String(v).trim()).filter((v) => v !== '');
	}
	return String(value ?? '')
		.split(/[\s,;]+/)
		.map((v) => v.trim())
		.filter((v) => v !== '');
}

/** Ignite GO webhook events. "all" subscribes to every event. */
export const WEBHOOK_EVENTS: INodePropertyOptions[] = [
	{ name: 'All Events (all)', value: 'all', description: 'Subscribe to every event of the instance' },
	{ name: 'Instance Started (instance.boot)', value: 'instance.boot' },
	{ name: 'Instance Logged Out (instance.logout)', value: 'instance.logout' },
	{ name: 'Instance Removed (instance.removed)', value: 'instance.removed' },
	{ name: 'Instance Health (instance.health)', value: 'instance.health', description: 'Health signal: ban, lock, restriction or send failure' },
	{ name: 'Connection: State Changed (connection.state)', value: 'connection.state' },
	{ name: 'Connection: Connected (connection.connected)', value: 'connection.connected' },
	{ name: 'Connection: Disconnected (connection.disconnected)', value: 'connection.disconnected' },
	{ name: 'Connection: QR Code (connection.qr)', value: 'connection.qr' },
	{ name: 'Connection: Unstable (connection.unstable)', value: 'connection.unstable', description: 'Many disconnections in a short time window' },
	{ name: 'Call Received (call.incoming)', value: 'call.incoming' },
	{ name: 'Call Rejected (call.rejected)', value: 'call.rejected' },
	{ name: 'Message Received (message.received)', value: 'message.received' },
	{ name: 'Message Sent (message.sent)', value: 'message.sent', description: 'Message sent through the API' },
	{ name: 'Message Status (message.status)', value: 'message.status', description: 'Delivered or read' },
	{ name: 'Message History (message.history)', value: 'message.history' },
	{ name: 'Message Deleted (message.deleted)', value: 'message.deleted' },
	{ name: 'Message Edited (message.edited)', value: 'message.edited' },
	{ name: 'Message Reaction (message.reaction)', value: 'message.reaction' },
	{ name: 'Chat History (chat.history)', value: 'chat.history' },
	{ name: 'Chat Created (chat.created)', value: 'chat.created' },
	{ name: 'Chat Updated (chat.updated)', value: 'chat.updated' },
	{ name: 'Chat Deleted (chat.deleted)', value: 'chat.deleted' },
	{ name: 'Contact History (contact.history)', value: 'contact.history' },
	{ name: 'Contact Created (contact.created)', value: 'contact.created' },
	{ name: 'Contact Updated (contact.updated)', value: 'contact.updated' },
	{ name: 'Presence Changed (presence.changed)', value: 'presence.changed' },
	{ name: 'Group Created (group.created)', value: 'group.created' },
	{ name: 'Group Updated (group.updated)', value: 'group.updated' },
	{ name: 'Group Participants (group.participants)', value: 'group.participants' },
	{ name: 'Label Changed (label.changed)', value: 'label.changed' },
	{ name: 'Label Linked (label.linked)', value: 'label.linked' },
];
