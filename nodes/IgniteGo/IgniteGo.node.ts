import type {
	IBinaryKeyData,
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { chatFields, chatOperations } from './descriptions/ChatDescription';
import { groupFields, groupOperations } from './descriptions/GroupDescription';
import { instanceFields, instanceOperations } from './descriptions/InstanceDescription';
import { messageFields, messageOperations } from './descriptions/MessageDescription';
import { compact, goErrorBody, goPathSegment, igniteGoApiRequest, toList } from './GenericFunctions';

/** Ignite GO media route for each operation. */
const MEDIA_ROUTES: Record<string, string> = {
	sendImage: 'sendImage',
	sendVideo: 'sendVideo',
	sendAudio: 'sendAudio',
	sendDocument: 'sendDocument',
	sendSticker: 'sendSticker',
};

/** Media operations where Ignite GO uses the caption. */
const CAPTION_OPERATIONS = ['sendImage', 'sendVideo', 'sendDocument'];

/** Chat presence: node option mapped to the Ignite GO state/media fields. */
const PRESENCE_MAP: Record<string, { state: string; media: string }> = {
	composing: { state: 'composing', media: 'text' },
	recording: { state: 'composing', media: 'audio' },
	paused: { state: 'paused', media: 'text' },
};

function buildVcard(name: string, phone: string): string {
	const digits = phone.replace(/\D/g, '');
	const safeName = name.replace(/[\r\n]+/g, ' ').trim();
	return [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`FN:${safeName}`,
		`TEL;type=CELL;waid=${digits}:+${digits}`,
		'END:VCARD',
	].join('\n');
}

export class IgniteGo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ignite GO',
		name: 'igniteGo',
		icon: { light: 'file:ignitego.svg', dark: 'file:ignitego.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Send WhatsApp messages and work with chats, instances and groups in Ignite GO',
		defaults: {
			name: 'Ignite GO',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'igniteGoApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Chat', value: 'chat' },
					{ name: 'Group', value: 'group' },
					{ name: 'Instance', value: 'instance' },
					{ name: 'Message', value: 'message' },
				],
				default: 'message',
			},
			...messageOperations,
			...chatOperations,
			...instanceOperations,
			...groupOperations,
			{
				displayName: 'Instance',
				name: 'instance',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'my-store',
				description:
					'Name or ID of the Ignite GO instance. With an instance token in the credential, it must be the instance that owns the token.',
			},
			...messageFields,
			...chatFields,
			...instanceFields,
			...groupFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const instanceRef = String(this.getNodeParameter('instance', i, '')).trim();
				if (instanceRef === '') {
					throw new NodeOperationError(this.getNode(), 'Enter the instance (name or ID)', {
						itemIndex: i,
					});
				}
				const inst = goPathSegment(instanceRef);

				let method: IHttpRequestMethods = 'GET';
				let path = '';
				let body: IDataObject | undefined;
				let qs: IDataObject | undefined;
				let binaryOut: IBinaryKeyData | undefined;

				if (resource === 'message') {
					const to =
						operation === 'markAsRead' ? '' : String(this.getNodeParameter('to', i, '')).trim();

					if (operation === 'sendText') {
						const options = this.getNodeParameter('textOptions', i, {}) as IDataObject;
						method = 'POST';
						path = `/message/${inst}/sendText`;
						body = compact({
							to,
							message: this.getNodeParameter('message', i) as string,
							reply_to: options.replyTo as string,
						});
					} else if (MEDIA_ROUTES[operation] !== undefined) {
						const source = this.getNodeParameter('mediaSource', i) as string;
						const options = this.getNodeParameter('mediaOptions', i, {}) as IDataObject;
						let mimeType = String(options.mimeType ?? '').trim();
						let fileName =
							operation === 'sendDocument'
								? String(this.getNodeParameter('fileName', i, '')).trim()
								: '';
						const media: IDataObject = {};

						if (source === 'url') {
							media.url = String(this.getNodeParameter('mediaUrl', i)).trim();
						} else if (source === 'base64') {
							media.base64 = String(this.getNodeParameter('mediaBase64', i)).trim();
						} else {
							const propertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const binaryData = this.helpers.assertBinaryData(i, propertyName);
							const buffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
							media.base64 = buffer.toString('base64');
							if (mimeType === '' && binaryData.mimeType) mimeType = binaryData.mimeType;
							if (fileName === '' && binaryData.fileName) fileName = binaryData.fileName;
						}

						if (operation === 'sendDocument' && fileName === '') {
							throw new NodeOperationError(
								this.getNode(),
								'File name is required to send a document',
								{ itemIndex: i },
							);
						}

						method = 'POST';
						path = `/message/${inst}/${MEDIA_ROUTES[operation]}`;
						body = compact({
							to,
							...media,
							caption: CAPTION_OPERATIONS.includes(operation)
								? (this.getNodeParameter('caption', i, '') as string)
								: undefined,
							filename: operation === 'sendDocument' ? fileName : undefined,
							mime_type: mimeType,
							reply_to: options.replyTo as string,
						});
						if (operation === 'sendAudio') {
							qs = { ptt: (this.getNodeParameter('ptt', i, true) as boolean) ? 'true' : 'false' };
						}
					} else if (operation === 'sendLocation') {
						const options = this.getNodeParameter('locationOptions', i, {}) as IDataObject;
						method = 'POST';
						path = `/message/${inst}/sendLocation`;
						body = compact({
							to,
							latitude: this.getNodeParameter('latitude', i) as number,
							longitude: this.getNodeParameter('longitude', i) as number,
							name: options.name as string,
							address: options.address as string,
						});
					} else if (operation === 'sendContact') {
						const options = this.getNodeParameter('contactOptions', i, {}) as IDataObject;
						const displayName = String(this.getNodeParameter('contactName', i)).trim();
						const customVcard = String(options.vcard ?? '').trim();
						const vcard =
							customVcard !== ''
								? customVcard
								: buildVcard(displayName, String(this.getNodeParameter('contactPhone', i)));
						method = 'POST';
						path = `/message/${inst}/sendContact`;
						body = compact({ to, display_name: displayName, vcard });
					} else if (operation === 'sendPoll') {
						const collection = this.getNodeParameter('pollOptions', i, {}) as IDataObject;
						const values = (collection.values as IDataObject[] | undefined) ?? [];
						const options = values
							.map((v) => String(v.option ?? '').trim())
							.filter((v) => v !== '');
						if (options.length < 2) {
							throw new NodeOperationError(this.getNode(), 'A poll needs at least 2 options', {
								itemIndex: i,
							});
						}
						method = 'POST';
						path = `/message/${inst}/sendPoll`;
						body = {
							to,
							name: this.getNodeParameter('pollName', i) as string,
							options,
							selectable_count: this.getNodeParameter('selectableCount', i, 1) as number,
						};
					} else if (operation === 'sendLink') {
						const options = this.getNodeParameter('linkOptions', i, {}) as IDataObject;
						method = 'POST';
						path = `/message/${inst}/sendLink`;
						body = compact({
							to,
							text: this.getNodeParameter('linkText', i) as string,
							title: options.title as string,
							description: options.description as string,
							thumbnail_url: options.thumbnailUrl as string,
						});
					} else if (operation === 'react') {
						const options = this.getNodeParameter('reactOptions', i, {}) as IDataObject;
						method = 'POST';
						path = `/message/${inst}/sendReaction`;
						body = {
							to,
							message_id: String(this.getNodeParameter('messageId', i)).trim(),
							emoji: this.getNodeParameter('emoji', i, '') as string,
							from_me: this.getNodeParameter('fromMe', i, false) as boolean,
						};
						const participant = String(options.participant ?? '').trim();
						if (participant !== '') body.participant = participant;
					} else if (operation === 'edit') {
						const messageId = String(this.getNodeParameter('messageId', i)).trim();
						method = 'PUT';
						path = `/message/${inst}/${goPathSegment(messageId)}/edit`;
						body = { to, text: this.getNodeParameter('newText', i) as string };
					} else if (operation === 'delete') {
						const messageId = String(this.getNodeParameter('messageId', i)).trim();
						method = 'DELETE';
						path = `/message/${inst}/${goPathSegment(messageId)}`;
						body = { to };
					} else if (operation === 'markAsRead') {
						const options = this.getNodeParameter('readOptions', i, {}) as IDataObject;
						const messageIds = toList(this.getNodeParameter('messageIds', i));
						if (messageIds.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Enter at least one message ID', {
								itemIndex: i,
							});
						}
						method = 'POST';
						path = `/message/${inst}/read`;
						body = compact({
							chat: String(this.getNodeParameter('chat', i)).trim(),
							sender: options.sender as string,
						});
						body.message_ids = messageIds;
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}
				} else if (resource === 'chat') {
					if (operation === 'checkNumbers') {
						const phones = toList(this.getNodeParameter('phones', i));
						if (phones.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Enter at least one phone number', {
								itemIndex: i,
							});
						}
						method = 'POST';
						path = `/chat/${inst}/check-numbers`;
						body = { phones };
					} else if (operation === 'getProfilePicture') {
						method = 'GET';
						path = `/profile/${inst}/picture`;
						qs = { jid: String(this.getNodeParameter('jid', i)).trim() };
						if (this.getNodeParameter('preview', i, false) as boolean) qs.preview = 'true';
					} else if (operation === 'sendPresence') {
						const presence = PRESENCE_MAP[this.getNodeParameter('presence', i) as string];
						if (presence === undefined) {
							throw new NodeOperationError(this.getNode(), 'Invalid presence', { itemIndex: i });
						}
						method = 'POST';
						path = `/presence/${inst}/chat`;
						body = {
							to: String(this.getNodeParameter('to', i)).trim(),
							state: presence.state,
							media: presence.media,
						};
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}
				} else if (resource === 'instance') {
					if (operation === 'get') {
						method = 'GET';
						path = `/instance/${inst}`;
					} else if (operation === 'connect') {
						method = 'GET';
						path = `/instance/${inst}/connect`;
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}
				} else if (resource === 'group') {
					let groupJid = String(this.getNodeParameter('groupJid', i)).trim();
					if (groupJid !== '' && !groupJid.includes('@')) groupJid = `${groupJid}@g.us`;
					const group = goPathSegment(groupJid);
					if (operation === 'get') {
						method = 'GET';
						path = `/group/${inst}/${group}`;
					} else if (operation === 'getInviteLink') {
						method = 'GET';
						path = `/group/${inst}/${group}/invite-link`;
						if (this.getNodeParameter('reset', i, false) as boolean) qs = { reset: 'true' };
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				const response = await igniteGoApiRequest.call(this, method, path, body, qs);
				const responseBody = response.body;

				// Connect: optionally output the QR code (PNG data URL) as binary data.
				if (
					resource === 'instance' &&
					operation === 'connect' &&
					(this.getNodeParameter('qrAsBinary', i, false) as boolean) &&
					responseBody !== null &&
					typeof responseBody === 'object'
				) {
					const qrImage = String((responseBody as IDataObject).qr_image ?? '');
					const match = /^data:([^;]+);base64,(.+)$/.exec(qrImage);
					if (match) {
						binaryOut = {
							qr: await this.helpers.prepareBinaryData(
								Buffer.from(match[2], 'base64'),
								'qr.png',
								match[1],
							),
						};
					}
				}

				let jsonItems: IDataObject[];
				if (Array.isArray(responseBody)) {
					jsonItems = responseBody.map((entry) =>
						entry !== null && typeof entry === 'object' ? (entry as IDataObject) : { value: entry },
					);
				} else if (responseBody !== null && typeof responseBody === 'object') {
					jsonItems = [responseBody as IDataObject];
				} else if (responseBody === undefined || responseBody === null || responseBody === '') {
					// 204 without a body (mark as read, presence).
					jsonItems = [{ success: true, statusCode: response.statusCode }];
				} else {
					jsonItems = [{ data: responseBody }];
				}

				for (const json of jsonItems) {
					const item: INodeExecutionData = { json, pairedItem: { item: i } };
					if (binaryOut !== undefined) item.binary = binaryOut;
					returnData.push(item);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const failure: IDataObject = { error: (error as Error).message };
					const details = error as { description?: unknown; httpCode?: unknown };
					if (details.description) failure.description = details.description as string;
					if (details.httpCode) failure.httpCode = details.httpCode as string;
					const goError = goErrorBody(error);
					if (typeof goError?.error === 'string') failure.code = goError.error;
					returnData.push({ json: failure, pairedItem: { item: i } });
					continue;
				}
				if (error instanceof NodeApiError) {
					if (error.context.itemIndex === undefined) error.context.itemIndex = i;
					// Returns the same error: NodeApiError does not wrap itself again.
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: i });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
