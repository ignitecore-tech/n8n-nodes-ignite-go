import type { INodeProperties } from 'n8n-workflow';

export const groupOperations: INodeProperties[] = [
	{
		displayName: 'Operação',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['group'] } },
		options: [
			{
				name: 'Link de Convite',
				value: 'getInviteLink',
				description: 'Busca o link de convite do grupo',
				action: 'Buscar link de convite do grupo',
			},
			{
				name: 'Ver Grupo',
				value: 'get',
				description: 'Detalhes do grupo com participantes',
				action: 'Ver grupo',
			},
		],
		default: 'get',
	},
];

export const groupFields: INodeProperties[] = [
	{
		displayName: 'JID do Grupo',
		name: 'groupJid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '120363012345678901@g.us',
		description: 'JID do grupo. Sem o @g.us, o sufixo é adicionado.',
		displayOptions: { show: { resource: ['group'] } },
	},
	{
		displayName: 'Gerar Novo Link',
		name: 'reset',
		type: 'boolean',
		default: false,
		description: 'Ligado, revoga o link atual e gera outro',
		displayOptions: { show: { resource: ['group'], operation: ['getInviteLink'] } },
	},
];
