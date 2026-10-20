import type { INodeProperties } from 'n8n-workflow';

const TO_DESCRIPTION =
	'Destino. Pessoa: só o número com DDI e DDD, sem + nem espaços (ex.: 5511999999999). Grupo: JID completo terminado em @g.us (ex.: 120363012345678901@g.us). Também aceita JID completo @s.whatsapp.net, @lid ou @newsletter.';

const MEDIA_OPERATIONS = ['sendImage', 'sendVideo', 'sendAudio', 'sendDocument', 'sendSticker'];

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operação',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['message'] } },
		options: [
			{
				name: 'Apagar',
				value: 'delete',
				description: 'Apaga uma mensagem para todos (revoke)',
				action: 'Apagar mensagem',
			},
			{
				name: 'Editar',
				value: 'edit',
				description: 'Edita o texto de uma mensagem enviada pela instância (até cerca de 15 minutos após o envio)',
				action: 'Editar mensagem',
			},
			{
				name: 'Enviar Áudio',
				value: 'sendAudio',
				description: 'Envia áudio, como nota de voz (PTT) ou como arquivo',
				action: 'Enviar áudio',
			},
			{
				name: 'Enviar Contato',
				value: 'sendContact',
				description: 'Envia um cartão de contato (vCard)',
				action: 'Enviar contato',
			},
			{
				name: 'Enviar Documento',
				value: 'sendDocument',
				description: 'Envia um arquivo como documento',
				action: 'Enviar documento',
			},
			{
				name: 'Enviar Enquete',
				value: 'sendPoll',
				description: 'Envia uma enquete com opções',
				action: 'Enviar enquete',
			},
			{
				name: 'Enviar Figurinha',
				value: 'sendSticker',
				description: 'Envia uma figurinha (WebP)',
				action: 'Enviar figurinha',
			},
			{
				name: 'Enviar Imagem',
				value: 'sendImage',
				description: 'Envia uma imagem com legenda opcional',
				action: 'Enviar imagem',
			},
			{
				name: 'Enviar Link com Prévia',
				value: 'sendLink',
				description: 'Envia texto com prévia de link',
				action: 'Enviar link com prévia',
			},
			{
				name: 'Enviar Localização',
				value: 'sendLocation',
				description: 'Envia uma localização no mapa',
				action: 'Enviar localização',
			},
			{
				name: 'Enviar Texto',
				value: 'sendText',
				description: 'Envia uma mensagem de texto',
				action: 'Enviar texto',
			},
			{
				name: 'Enviar Vídeo',
				value: 'sendVideo',
				description: 'Envia um vídeo com legenda opcional',
				action: 'Enviar vídeo',
			},
			{
				name: 'Marcar como Lida',
				value: 'markAsRead',
				description: 'Marca mensagens recebidas como lidas',
				action: 'Marcar mensagem como lida',
			},
			{
				name: 'Reagir',
				value: 'react',
				description: 'Reage a uma mensagem com um emoji (vazio remove a reação)',
				action: 'Reagir a mensagem',
			},
		],
		default: 'sendText',
	},
];

export const messageFields: INodeProperties[] = [
	/* ---------------------------------------------------------------- */
	/* Destino (todas as operações, exceto Marcar como Lida)            */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Para',
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
	/* Enviar Texto                                                     */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Mensagem',
		name: 'message',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 4 },
		description: 'Texto da mensagem',
		displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Mídia (imagem, vídeo, áudio, documento, figurinha)              */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Fonte da Mídia',
		name: 'mediaSource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'URL',
				value: 'url',
				description: 'URL pública do arquivo; o GO baixa (até 64 MB)',
			},
			{
				name: 'Base64',
				value: 'base64',
				description: 'Conteúdo em base64, com ou sem o prefixo data:...;base64,',
			},
			{
				name: 'Binário de Entrada',
				value: 'binary',
				description: 'Arquivo binário vindo do nó anterior, convertido para base64',
			},
		],
		default: 'url',
		displayOptions: { show: { resource: ['message'], operation: MEDIA_OPERATIONS } },
	},
	{
		displayName: 'URL da Mídia',
		name: 'mediaUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://exemplo.com/foto.jpg',
		description: 'URL pública do arquivo',
		displayOptions: {
			show: { resource: ['message'], operation: MEDIA_OPERATIONS, mediaSource: ['url'] },
		},
	},
	{
		displayName: 'Conteúdo Base64',
		name: 'mediaBase64',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		description: 'Conteúdo do arquivo em base64, com ou sem o prefixo data:...;base64,',
		displayOptions: {
			show: { resource: ['message'], operation: MEDIA_OPERATIONS, mediaSource: ['base64'] },
		},
	},
	{
		displayName: 'Propriedade Binária',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		description: 'Nome da propriedade binária do item de entrada que contém o arquivo',
		displayOptions: {
			show: { resource: ['message'], operation: MEDIA_OPERATIONS, mediaSource: ['binary'] },
		},
	},
	{
		displayName: 'Nome do Arquivo',
		name: 'fileName',
		type: 'string',
		default: '',
		placeholder: 'contrato.pdf',
		description:
			'Nome do arquivo exibido no WhatsApp. Obrigatório para documento; com fonte binária, vazio usa o nome do arquivo do binário.',
		displayOptions: { show: { resource: ['message'], operation: ['sendDocument'] } },
	},
	{
		displayName: 'Legenda',
		name: 'caption',
		type: 'string',
		default: '',
		typeOptions: { rows: 2 },
		description: 'Legenda da mídia (opcional)',
		displayOptions: {
			show: { resource: ['message'], operation: ['sendImage', 'sendVideo', 'sendDocument'] },
		},
	},
	{
		displayName: 'Nota de Voz (PTT)',
		name: 'ptt',
		type: 'boolean',
		default: true,
		description:
			'Ligado, envia como nota de voz (PTT). Desligado, vai como arquivo de áudio.',
		displayOptions: { show: { resource: ['message'], operation: ['sendAudio'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Enviar Localização                                              */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 7, minValue: -90, maxValue: 90 },
		placeholder: '-23.5505',
		description: 'Latitude em graus decimais',
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
		description: 'Longitude em graus decimais',
		displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Enviar Contato                                                  */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Nome do Contato',
		name: 'contactName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Fulano de Tal',
		description: 'Nome exibido no cartão de contato',
		displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
	},
	{
		displayName: 'Telefone do Contato',
		name: 'contactPhone',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511988887777',
		description:
			'Telefone com DDI e DDD, usado para montar o vCard. Ignorado se você informar um vCard pronto nas opções.',
		displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Enviar Enquete                                                  */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Pergunta',
		name: 'pollName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Qual horário?',
		description: 'Título da enquete',
		displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
	},
	{
		displayName: 'Opções da Enquete',
		name: 'pollOptions',
		type: 'fixedCollection',
		required: true,
		default: {},
		placeholder: 'Adicionar Opção',
		typeOptions: { multipleValues: true },
		description: 'Opções de resposta (pelo menos 2)',
		displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
		options: [
			{
				displayName: 'Opção',
				name: 'values',
				values: [
					{
						displayName: 'Texto da Opção',
						name: 'option',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Máximo de Escolhas',
		name: 'selectableCount',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
		description: 'Quantas opções cada pessoa pode marcar',
		displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Enviar Link com Prévia                                          */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Texto',
		name: 'linkText',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		placeholder: 'Veja: https://exemplo.com/oferta',
		description: 'Texto da mensagem, com o link',
		displayOptions: { show: { resource: ['message'], operation: ['sendLink'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Reagir, Editar, Apagar                                          */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'ID da Mensagem',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3EB0C431D5F2A1B2C3D4',
		description: 'ID da mensagem alvo (message_id / messageId do evento)',
		displayOptions: { show: { resource: ['message'], operation: ['react', 'edit', 'delete'] } },
	},
	{
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '',
		description: 'Emoji da reação. Vazio remove a reação.',
		displayOptions: { show: { resource: ['message'], operation: ['react'] } },
	},
	{
		displayName: 'Mensagem Enviada por Mim',
		name: 'fromMe',
		type: 'boolean',
		default: false,
		description:
			'Ligado quando a mensagem alvo foi enviada por esta instância (from_me). Precisa estar certo para o WhatsApp associar a reação à mensagem.',
		displayOptions: { show: { resource: ['message'], operation: ['react'] } },
	},
	{
		displayName: 'Novo Texto',
		name: 'newText',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		description: 'Texto que substitui o da mensagem',
		displayOptions: { show: { resource: ['message'], operation: ['edit'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Marcar como Lida                                                */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Conversa',
		name: 'chat',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5511999999999@s.whatsapp.net',
		description:
			'Conversa das mensagens: número com DDI e DDD ou JID completo (grupo termina em @g.us)',
		displayOptions: { show: { resource: ['message'], operation: ['markAsRead'] } },
	},
	{
		displayName: 'IDs das Mensagens',
		name: 'messageIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3EB0C431D5F2A1B2C3D4, 3EB0C431D5F2A1B2C3D5',
		description:
			'IDs separados por vírgula, espaço ou quebra de linha. Também aceita uma lista (array) via expressão.',
		displayOptions: { show: { resource: ['message'], operation: ['markAsRead'] } },
	},

	/* ---------------------------------------------------------------- */
	/* Opções adicionais                                               */
	/* ---------------------------------------------------------------- */
	{
		displayName: 'Opções',
		name: 'textOptions',
		type: 'collection',
		placeholder: 'Adicionar Opção',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
		options: [
			{
				displayName: 'Responder à Mensagem (ID)',
				name: 'replyTo',
				type: 'string',
				default: '',
				description: 'ID da mensagem citada (quoted reply)',
			},
		],
	},
	{
		displayName: 'Opções',
		name: 'mediaOptions',
		type: 'collection',
		placeholder: 'Adicionar Opção',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: MEDIA_OPERATIONS } },
		options: [
			{
				displayName: 'Responder à Mensagem (ID)',
				name: 'replyTo',
				type: 'string',
				default: '',
				description: 'ID da mensagem citada (quoted reply)',
			},
			{
				displayName: 'Tipo MIME',
				name: 'mimeType',
				type: 'string',
				default: '',
				placeholder: 'image/jpeg',
				description:
					'Tipo do arquivo. Vazio deixa o GO detectar; com fonte binária, vazio usa o tipo do binário.',
			},
		],
	},
	{
		displayName: 'Opções',
		name: 'locationOptions',
		type: 'collection',
		placeholder: 'Adicionar Opção',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
		options: [
			{
				displayName: 'Endereço',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: 'Av. Paulista, 1000, São Paulo',
			},
			{
				displayName: 'Nome do Local',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'Loja Paulista',
			},
		],
	},
	{
		displayName: 'Opções',
		name: 'contactOptions',
		type: 'collection',
		placeholder: 'Adicionar Opção',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
		options: [
			{
				displayName: 'vCard Pronto',
				name: 'vcard',
				type: 'string',
				default: '',
				typeOptions: { rows: 4 },
				placeholder: 'BEGIN:VCARD\nVERSION:3.0\nFN:Fulano\nTEL:+5511988887777\nEND:VCARD',
				description: 'Conteúdo do vCard completo. Quando preenchido, substitui o vCard montado com nome e telefone.',
			},
		],
	},
	{
		displayName: 'Opções',
		name: 'linkOptions',
		type: 'collection',
		placeholder: 'Adicionar Opção',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['sendLink'] } },
		options: [
			{
				displayName: 'Descrição',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Descrição exibida na prévia',
			},
			{
				displayName: 'Título',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Título exibido na prévia',
			},
			{
				displayName: 'URL da Miniatura',
				name: 'thumbnailUrl',
				type: 'string',
				default: '',
				placeholder: 'https://exemplo.com/thumb.jpg',
				description: 'Imagem exibida na prévia',
			},
		],
	},
	{
		displayName: 'Opções',
		name: 'reactOptions',
		type: 'collection',
		placeholder: 'Adicionar Opção',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['react'] } },
		options: [
			{
				displayName: 'Participante (Grupo)',
				name: 'participant',
				type: 'string',
				default: '',
				placeholder: '5511988887777@s.whatsapp.net',
				description:
					'Em grupo, quando a mensagem alvo é de outra pessoa: JID de quem enviou a mensagem',
			},
		],
	},
	{
		displayName: 'Opções',
		name: 'readOptions',
		type: 'collection',
		placeholder: 'Adicionar Opção',
		default: {},
		displayOptions: { show: { resource: ['message'], operation: ['markAsRead'] } },
		options: [
			{
				displayName: 'Remetente (Grupo)',
				name: 'sender',
				type: 'string',
				default: '',
				placeholder: '5511988887777@s.whatsapp.net',
				description: 'Em grupo: JID de quem enviou as mensagens',
			},
		],
	},
];
