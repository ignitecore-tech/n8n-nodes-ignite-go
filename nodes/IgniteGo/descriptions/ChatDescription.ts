import type { INodeProperties } from 'n8n-workflow';

export const chatOperations: INodeProperties[] = [
	{
		displayName: 'Operação',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chat'] } },
		options: [
			{
				name: 'Foto de Perfil',
				value: 'getProfilePicture',
				description: 'Busca a URL da foto de perfil de um contato ou grupo',
				action: 'Buscar foto de perfil',
			},
			{
				name: 'Presença no Chat',
				value: 'sendPresence',
				description: 'Mostra digitando, gravando áudio ou pausa num chat',
				action: 'Enviar presença no chat',
			},
			{
				name: 'Validar Números',
				value: 'checkNumbers',
				description:
					'Confere quais números têm WhatsApp. Validação em massa pode restringir ou banir o número.',
				action: 'Validar números no WhatsApp',
			},
		],
		default: 'checkNumbers',
	},
];

export const chatFields: INodeProperties[] = [
	/* ---------------------------------------------------------------- */
	/* Validar Números                                                  */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Números',
		name: 'phones',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		placeholder: '5511999999999, 5511888888888',
		description:
			'Números com DDI e DDD, separados por vírgula, espaço ou quebra de linha. Também aceita uma lista (array) via expressão. Atenção: consulta em massa parece lista fria para o WhatsApp e pode restringir ou banir o número da instância. Confira só quem vai receber mensagem. O GO limita a quantidade por chamada e por minuto (400 too_many_numbers e 429 rate_limited).',
		displayOptions: { show: { resource: ['chat'], operation: ['checkNumbers'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Foto de Perfil                                                   */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Contato ou Grupo',
		name: 'jid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511999999999',
		description: 'Número com DDI e DDD, ou JID completo (grupo termina em @g.us)',
		displayOptions: { show: { resource: ['chat'], operation: ['getProfilePicture'] } },
	},
	{
		displayName: 'Miniatura',
		name: 'preview',
		type: 'boolean',
		default: false,
		description: 'Ligado, devolve a miniatura em vez da foto original',
		displayOptions: { show: { resource: ['chat'], operation: ['getProfilePicture'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Presença no Chat                                                 */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Para',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511999999999',
		description:
			'Chat onde a presença aparece. Pessoa: só o número com DDI e DDD (ex.: 5511999999999). Grupo: JID completo terminado em @g.us.',
		displayOptions: { show: { resource: ['chat'], operation: ['sendPresence'] } },
	},
	{
		displayName: 'Presença',
		name: 'presence',
		type: 'options',
		options: [
			{ name: 'Digitando', value: 'composing', description: 'Mostra "digitando..."' },
			{ name: 'Gravando Áudio', value: 'recording', description: 'Mostra "gravando áudio..."' },
			{ name: 'Pausado', value: 'paused', description: 'Para de mostrar digitando ou gravando' },
		],
		default: 'composing',
		displayOptions: { show: { resource: ['chat'], operation: ['sendPresence'] } },
	},
];
