import type { INodeProperties } from 'n8n-workflow';

export const instanceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['instance'] } },
		options: [
			{
				name: 'Connect',
				value: 'connect',
				description:
					'Start the connection and return the status, plus the QR code when there is one. Call it again until the status is connected.',
				action: 'Connect an instance',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get instance details, connection status and settings',
				action: 'Get an instance',
			},
		],
		default: 'get',
	},
];

export const instanceFields: INodeProperties[] = [
	{
		displayName: 'QR Code as Binary',
		name: 'qrAsBinary',
		type: 'boolean',
		default: false,
		description:
			'Whether to also output the QR code as a PNG binary file (binary property "qr") when the API returns one',
		displayOptions: { show: { resource: ['instance'], operation: ['connect'] } },
	},
];
