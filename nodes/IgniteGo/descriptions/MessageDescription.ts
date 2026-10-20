import type { INodeProperties } from 'n8n-workflow';

const TO_DESCRIPTION =
	'Recipient. Person: only the number with country and area code, without + or spaces (e.g. 5511999999999). Group: full JID ending in @g.us (e.g. 120363012345678901@g.us). Full JIDs ending in @s.whatsapp.net, @lid or @newsletter are also accepted.';

const MEDIA_OPERATIONS = ['sendImage', 'sendVideo', 'sendAudio', 'sendDocument', 'sendSticker'];

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['message'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a message for everyone',
				action: 'Delete a message',
			},
			{
				name: 'Edit',
				value: 'edit',
				description:
					'Edit the text of a message sent by the instance (up to about 15 minutes after sending)',
				action: 'Edit a message',
			},
			{
				name: 'Mark as Read',
				value: 'markAsRead',
				description: 'Mark received messages as read',
				action: 'Mark messages as read',
			},
			{
				name: 'React',
				value: 'react',
				description: 'React to a message with an emoji (empty removes the reaction)',
				action: 'React to a message',
			},
			{
				name: 'Send Audio',
				value: 'sendAudio',
				description: 'Send audio as a voice note (PTT) or as a file',
				action: 'Send an audio message',
			},
			{
				name: 'Send Contact',
				value: 'sendContact',
				description: 'Send a contact card (vCard)',
				action: 'Send a contact',
			},
			{
				name: 'Send Document',
				value: 'sendDocument',
				description: 'Send a file as a document',
				action: 'Send a document',
			},
			{
				name: 'Send Image',
				value: 'sendImage',
				description: 'Send an image with an optional caption',
				action: 'Send an image',
			},
			{
				name: 'Send Link',
				value: 'sendLink',
				description: 'Send text with a link preview',
				action: 'Send a link with preview',
			},
			{
				name: 'Send Location',
				value: 'sendLocation',
				description: 'Send a location on the map',
				action: 'Send a location',
			},
			{
				name: 'Send Poll',
				value: 'sendPoll',
				description: 'Send a poll with answer options',
				action: 'Send a poll',
			},
			{
				name: 'Send Sticker',
				value: 'sendSticker',
				description: 'Send a sticker (WebP)',
				action: 'Send a sticker',
			},
			{
				name: 'Send Text',
				value: 'sendText',
				description: 'Send a text message',
				action: 'Send a text message',
			},
			{
				name: 'Send Video',
				value: 'sendVideo',
				description: 'Send a video with an optional caption',
				action: 'Send a video',
			},
		],
		default: 'sendText',
	},
];

export const messageFields: INodeProperties[] = [
	/* ---------------------------------------------------------------- */
	/* Recipient (every operation except Mark as Read)                  */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511999999999',
		description: TO_DESCRIPTION,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: [
					'sendText',
					...MEDIA_OPERATIONS,
					'sendLocation',
					'sendContact',
					'sendPoll',
					'sendLink',
					'react',
					'edit',
					'delete',
				],
			},
		},
	},

	/* ---------------------------------------------------------------- */
	/* Send Text                                                        */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 4 },
		description: 'Text of the message',
		displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Media (image, video, audio, document, sticker)                   */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Media Source',
		name: 'mediaSource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'URL',
				value: 'url',
				description: 'Public URL of the file, downloaded by Ignite GO (up to 64 MB)',
			},
			{
				name: 'Base64',
				value: 'base64',
				description: 'File content in base64, with or without the data:...;base64, prefix',
			},
			{
				name: 'Binary File',
				value: 'binary',
				description: 'Binary file from the previous node, converted to base64',
			},
		],
		default: 'url',
		displayOptions: { show: { resource: ['message'], operation: MEDIA_OPERATIONS } },
	},
	{
		displayName: 'Media URL',
		name: 'mediaUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/photo.jpg',
		description: 'Public URL of the file',
		displayOptions: {
			show: { resource: ['message'], operation: MEDIA_OPERATIONS, mediaSource: ['url'] },
		},
	},
	{
		displayName: 'Base64 Content',
		name: 'mediaBase64',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		description: 'File content in base64, with or without the data:...;base64, prefix',
		displayOptions: {
			show: { resource: ['message'], operation: MEDIA_OPERATIONS, mediaSource: ['base64'] },
		},
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		description: 'Name of the binary field of the input item that contains the file',
		displayOptions: {
			show: { resource: ['message'], operation: MEDIA_OPERATIONS, mediaSource: ['binary'] },
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		placeholder: 'contract.pdf',
		description:
			'File name shown in WhatsApp. Required for documents. With a binary source, leave it empty to use the file name of the binary data.',
		displayOptions: { show: { resource: ['message'], operation: ['sendDocument'] } },
	},
	{
		displayName: 'Caption',
		name: 'caption',
		type: 'string',
		default: '',
		typeOptions: { rows: 2 },
		description: 'Caption of the media (optional)',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendImage', 'sendVideo', 'sendDocument'] },
		},
	},
	{
		displayName: 'Voice Note (PTT)',
		name: 'ptt',
		type: 'boolean',
		default: true,
		description:
			'Whether to send the audio as a voice note (PTT). When off, it is sent as an audio file.',
		displayOptions: { show: { resource: ['message'], operation: ['sendAudio'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Send Location                                                    */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 7, minValue: -90, maxValue: 90 },
		placeholder: '-23.5505',
		description: 'Latitude in decimal degrees',
		displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 7, minValue: -180, maxValue: 180 },
		placeholder: '-46.6333',
		description: 'Longitude in decimal degrees',
		displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Send Contact                                                     */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Contact Name',
		name: 'contactName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'John Doe',
		description: 'Name shown on the contact card',
		displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
	},
	{
		displayName: 'Contact Phone',
		name: 'contactPhone',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511988887777',
		description:
			'Phone number with country and area code, used to build the vCard. Ignored when you provide a custom vCard in the options.',
		displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Send Poll                                                        */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Question',
		name: 'pollName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Which time works best?',
		description: 'Title of the poll',
		displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
	},
	{
		displayName: 'Poll Options',
		name: 'pollOptions',
		type: 'fixedCollection',
		required: true,
		default: {},
		placeholder: 'Add Option',
		typeOptions: { multipleValues: true },
		description: 'Answer options (at least 2)',
		displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
		options: [
			{
				displayName: 'Option',
				name: 'values',
				values: [
					{
						displayName: 'Option Text',
						name: 'option',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Max Selections',
		name: 'selectableCount',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
		description: 'How many options each person can select',
		displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Send Link                                                        */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Text',
		name: 'linkText',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		placeholder: 'See: https://example.com/offer',
		description: 'Text of the message, including the link',
		displayOptions: { show: { resource: ['message'], operation: ['sendLink'] } },
	},

	/* ---------------------------------------------------------------- */
	/* React, Edit, Delete                                              */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3EB0C431D5F2A1B2C3D4',
		description: 'ID of the target message (message_id or messageId in the event)',
		displayOptions: { show: { resource: ['message'], operation: ['react', 'edit', 'delete'] } },
	},
	{
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '',
		description: 'Emoji of the reaction. Leave it empty to remove the reaction.',
		displayOptions: { show: { resource: ['message'], operation: ['react'] } },
	},
	{
		displayName: 'From Me',
		name: 'fromMe',
		type: 'boolean',
		default: false,
		description:
			'Whether the target message was sent by this instance (from_me). It must be correct for WhatsApp to attach the reaction to the message.',
		displayOptions: { show: { resource: ['message'], operation: ['react'] } },
	},
	{
		displayName: 'New Text',
		name: 'newText',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		description: 'Text that replaces the text of the message',
		displayOptions: { show: { resource: ['message'], operation: ['edit'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Mark as Read                                                     */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Chat',
		name: 'chat',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511999999999@s.whatsapp.net',
		description:
			'Chat of the messages: number with country and area code, or full JID (groups end in @g.us)',
		displayOptions: { show: { resource: ['message'], operation: ['markAsRead'] } },
	},
	{
		displayName: 'Message IDs',
		name: 'messageIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3EB0C431D5F2A1B2C3D4, 3EB0C431D5F2A1B2C3D5',
		description:
			'IDs separated by commas, spaces or line breaks. An array from an expression is also accepted.',
		displayOptions: { show: { resource: ['message'], operation: ['markAsRead'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Additional options                                               */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Options',
		name: 'textOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
		options: [
			{
				displayName: 'Reply to Message ID',
				name: 'replyTo',
				type: 'string',
				default: '',
				description: 'ID of the message to quote (quoted reply)',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'mediaOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: MEDIA_OPERATIONS } },
		options: [
			{
				displayName: 'MIME Type',
				name: 'mimeType',
				type: 'string',
				default: '',
				placeholder: 'image/jpeg',
				description:
					'Type of the file. Leave it empty to let Ignite GO detect it. With a binary source, empty uses the type of the binary data.',
			},
			{
				displayName: 'Reply to Message ID',
				name: 'replyTo',
				type: 'string',
				default: '',
				description: 'ID of the message to quote (quoted reply)',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'locationOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
		options: [
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '1000 Paulista Avenue, Sao Paulo',
			},
			{
				displayName: 'Location Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'Paulista Store',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'contactOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
		options: [
			{
				displayName: 'Custom vCard',
				name: 'vcard',
				type: 'string',
				default: '',
				typeOptions: { rows: 4 },
				placeholder: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+5511988887777\nEND:VCARD',
				description:
					'Full vCard content. When filled in, it replaces the vCard built from the contact name and phone.',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'linkOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendLink'] } },
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description shown in the preview',
			},
			{
				displayName: 'Thumbnail URL',
				name: 'thumbnailUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/thumb.jpg',
				description: 'Image shown in the preview',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title shown in the preview',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'reactOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['react'] } },
		options: [
			{
				displayName: 'Participant (Group)',
				name: 'participant',
				type: 'string',
				default: '',
				placeholder: '5511988887777@s.whatsapp.net',
				description:
					'In groups, when the target message was sent by someone else: JID of the sender of that message',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'readOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['markAsRead'] } },
		options: [
			{
				displayName: 'Sender (Group)',
				name: 'sender',
				type: 'string',
				default: '',
				placeholder: '5511988887777@s.whatsapp.net',
				description: 'In groups: JID of the sender of the messages',
			},
		],
	},
];
