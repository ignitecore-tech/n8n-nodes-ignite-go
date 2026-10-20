import type { INodeProperties } from 'n8n-workflow';

export const groupOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['group'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get group details with participants',
				action: 'Get a group',
			},
			{
				name: 'Get Invite Link',
				value: 'getInviteLink',
				description: 'Get the invite link of a group',
				action: 'Get a group invite link',
			},
		],
		default: 'get',
	},
];

export const groupFields: INodeProperties[] = [
	{
		displayName: 'Group JID',
		name: 'groupJid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '120363012345678901@g.us',
		description: 'JID of the group. Without @g.us, the suffix is added.',
		displayOptions: { show: { resource: ['group'] } },
	},
	{
		displayName: 'Reset Link',
		name: 'reset',
		type: 'boolean',
		default: false,
		description: 'Whether to revoke the current link and generate a new one',
		displayOptions: { show: { resource: ['group'], operation: ['getInviteLink'] } },
	},
];
