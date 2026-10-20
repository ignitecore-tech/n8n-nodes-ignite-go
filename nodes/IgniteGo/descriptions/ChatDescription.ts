import type { INodeProperties } from 'n8n-workflow';

export const chatOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chat'] } },
		options: [
			{
				name: 'Check Numbers',
				value: 'checkNumbers',
				description:
					'Check which numbers have WhatsApp. Bulk checks can get the number restricted or banned.',
				action: 'Check phone numbers',
			},
			{
				name: 'Get Profile Picture',
				value: 'getProfilePicture',
				description: 'Get the profile picture URL of a contact or group',
				action: 'Get a profile picture',
			},
			{
				name: 'Send Presence',
				value: 'sendPresence',
				description: 'Show typing, recording audio or paused in a chat',
				action: 'Send chat presence',
			},
		],
		default: 'checkNumbers',
	},
];

export const chatFields: INodeProperties[] = [
	/* ---------------------------------------------------------------- */
	/* Check Numbers                                                    */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Phone Numbers',
		name: 'phones',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		placeholder: '5511999999999, 5511888888888',
		description:
			'Numbers with country and area code, separated by commas, spaces or line breaks. An array from an expression is also accepted. Warning: bulk checks look like a cold list to WhatsApp and can get the instance number restricted or banned, so only check people who will receive a message. Ignite GO limits how many numbers you can check per call and per minute (400 too_many_numbers and 429 rate_limited).',
		displayOptions: { show: { resource: ['chat'], operation: ['checkNumbers'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Get Profile Picture                                              */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Contact or Group',
		name: 'jid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511999999999',
		description: 'Number with country and area code, or full JID (groups end in @g.us)',
		displayOptions: { show: { resource: ['chat'], operation: ['getProfilePicture'] } },
	},
	{
		displayName: 'Thumbnail',
		name: 'preview',
		type: 'boolean',
		default: false,
		description: 'Whether to return the thumbnail instead of the full-size picture',
		displayOptions: { show: { resource: ['chat'], operation: ['getProfilePicture'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Send Presence                                                    */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511999999999',
		description:
			'Chat where the presence is shown. Person: only the number with country and area code (e.g. 5511999999999). Group: full JID ending in @g.us.',
		displayOptions: { show: { resource: ['chat'], operation: ['sendPresence'] } },
	},
	{
		displayName: 'Presence',
		name: 'presence',
		type: 'options',
		options: [
			{ name: 'Typing', value: 'composing', description: 'Show "typing..."' },
			{ name: 'Recording Audio', value: 'recording', description: 'Show "recording audio..."' },
			{ name: 'Paused', value: 'paused', description: 'Stop showing typing or recording' },
		],
		default: 'composing',
		displayOptions: { show: { resource: ['chat'], operation: ['sendPresence'] } },
	},
];
