import type { INodeProperties } from 'n8n-workflow';

export const instanceOperations: INodeProperties[] = [
	{
		displayName: 'Operação',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['instance'] } },
		options: [
			{
				name: 'Conectar',
				value: 'connect',
				description:
					'Inicia a conexão e devolve o status e o QR code quando houver. Chame de novo até virar connected.',
				action: 'Conectar instância',
			},
			{
				name: 'Ver Instância',
				value: 'get',
				description: 'Detalhes, status da conexão e configurações da instância',
				action: 'Ver instância',
			},
		],
		default: 'get',
	},
];

export const instanceFields: INodeProperties[] = [
	{
		displayName: 'QR Code como Binário',
		name: 'qrAsBinary',
		type: 'boolean',
		default: false,
		description:
			'Ligado, também entrega o QR code como binário PNG (propriedade "qr") quando a API devolver um',
		displayOptions: { show: { resource: ['instance'], operation: ['connect'] } },
	},
];
