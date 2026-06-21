import { applyDecorators, type INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiUnprocessableEntityResponse,
  DocumentBuilder,
  getSchemaPath,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { DiscountType, RejectionCode } from '../../../core/models';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { INVALID_COUPON_CODE_MESSAGE, TOTAL_CENTS_MISMATCH_MESSAGE } from '../error-messages';
import { MESSAGES } from '../mappers/result-to-http';

type ExampleMap = Record<string, { summary: string; value: unknown }>;

const NON_MINIMUM_REASONS = Object.values(RejectionCode).filter((reason) => reason !== RejectionCode.MinimumNotMet);

export class CouponAcceptedResponse {
  @ApiProperty({ enum: [true], example: true })
  valid!: true;

  @ApiProperty({ example: 'LANC10' })
  couponCode!: string;

  @ApiProperty({ enum: DiscountType, enumName: 'DiscountType', example: DiscountType.Percentage })
  discountType!: DiscountType;

  @ApiProperty({ type: 'integer', minimum: 0, example: 19900 })
  subtotalCents!: number;

  @ApiProperty({ type: 'integer', minimum: 0, example: 1990 })
  discountCents!: number;

  @ApiProperty({ type: 'integer', minimum: 0, example: 17910 })
  finalCents!: number;
}

export class CouponRejectedResponse {
  @ApiProperty({ enum: [false], example: false })
  valid!: false;

  @ApiProperty({ enum: NON_MINIMUM_REASONS, enumName: 'RejectionReason', example: RejectionCode.NotFound })
  reason!: Exclude<RejectionCode, RejectionCode.MinimumNotMet>;

  @ApiProperty({ example: MESSAGES[RejectionCode.NotFound] })
  message!: string;

  @ApiProperty({ type: 'integer', minimum: 0, example: 19900 })
  subtotalCents!: number;
}

export class CouponMinimumNotMetResponse {
  @ApiProperty({ enum: [false], example: false })
  valid!: false;

  @ApiProperty({ enum: [RejectionCode.MinimumNotMet], example: RejectionCode.MinimumNotMet })
  reason!: RejectionCode.MinimumNotMet;

  @ApiProperty({ example: MESSAGES[RejectionCode.MinimumNotMet] })
  message!: string;

  @ApiProperty({ type: 'integer', minimum: 0, example: 1000 })
  subtotalCents!: number;

  @ApiProperty({ type: 'integer', minimum: 0, example: 4000, description: 'Quanto falta em centavos para atingir o minimo' })
  missingCents!: number;
}

export class ValidationErrorResponse {
  @ApiProperty({ type: 'integer', example: 422 })
  statusCode!: number;

  @ApiProperty({ example: 'Unprocessable Entity' })
  error!: string;

  @ApiProperty({
    description: 'String unica (codigo/totalCents invalidos) ou lista de violacoes do ValidationPipe',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'codigo de cupom invalido',
  })
  message!: string | string[];
}

const item = (id: string, name: string, unitPriceCents: number, quantity: number) => ({ id, name, unitPriceCents, quantity });

const REQUEST_EXAMPLES: ExampleMap = {
  valido: {
    summary: 'Cupom valido',
    value: { couponCode: 'LANC10', cart: { items: [item('sku-1', 'Camiseta', 19900, 1)] } },
  },
  'abaixo-do-minimo': {
    summary: 'Carrinho abaixo do minimo do cupom',
    value: { couponCode: 'LANC10', cart: { items: [item('sku-1', 'Chaveiro', 1000, 1)] } },
  },
  'com-total-conferido': {
    summary: 'Com totalCents (deve bater com o subtotal recalculado)',
    value: { couponCode: '  lanc10 ', cart: { items: [item('sku-1', 'Camiseta', 9950, 2)], totalCents: 19900 } },
  },
};

const OK_EXAMPLES: ExampleMap = {
  valido: {
    summary: 'Percentual aplicado',
    value: { valid: true, couponCode: 'LANC10', discountType: DiscountType.Percentage, subtotalCents: 19900, discountCents: 1990, finalCents: 17910 },
  },
  'valido-fixo': {
    summary: 'Desconto fixo',
    value: { valid: true, couponCode: 'BLACK50', discountType: DiscountType.Fixed, subtotalCents: 10000, discountCents: 5000, finalCents: 5000 },
  },
  'valido-com-teto': {
    summary: 'Percentual limitado pelo teto',
    value: { valid: true, couponCode: 'MEGA90', discountType: DiscountType.Percentage, subtotalCents: 10000, discountCents: 3000, finalCents: 7000 },
  },
  'valido-cem-por-cento': {
    summary: 'Cupom de 100% zera o final',
    value: { valid: true, couponCode: 'PCT100', discountType: DiscountType.Percentage, subtotalCents: 19900, discountCents: 19900, finalCents: 0 },
  },
  'valido-fixo-acima-do-subtotal': {
    summary: 'Fixo maior que o subtotal (clamp em [0, subtotal])',
    value: { valid: true, couponCode: 'FIXOVER', discountType: DiscountType.Fixed, subtotalCents: 19900, discountCents: 19900, finalCents: 0 },
  },
  'codigo-normalizado': {
    summary: 'Codigo normalizado ecoa em maiusculas',
    value: { valid: true, couponCode: 'LANC10', discountType: DiscountType.Percentage, subtotalCents: 19900, discountCents: 1990, finalCents: 17910 },
  },
  'nao-encontrado': {
    summary: 'Cupom inexistente',
    value: { valid: false, reason: RejectionCode.NotFound, message: MESSAGES[RejectionCode.NotFound], subtotalCents: 19900 },
  },
  inativo: {
    summary: 'Cupom inativo',
    value: { valid: false, reason: RejectionCode.Inactive, message: MESSAGES[RejectionCode.Inactive], subtotalCents: 19900 },
  },
  expirado: {
    summary: 'Cupom expirado',
    value: { valid: false, reason: RejectionCode.Expired, message: MESSAGES[RejectionCode.Expired], subtotalCents: 19900 },
  },
  'nao-iniciado': {
    summary: 'Cupom ainda nao iniciado',
    value: { valid: false, reason: RejectionCode.NotStarted, message: MESSAGES[RejectionCode.NotStarted], subtotalCents: 19900 },
  },
  'limite-atingido': {
    summary: 'Limite de usos atingido',
    value: { valid: false, reason: RejectionCode.LimitReached, message: MESSAGES[RejectionCode.LimitReached], subtotalCents: 19900 },
  },
  'minimo-nao-atingido': {
    summary: 'Abaixo do minimo (inclui missingCents)',
    value: { valid: false, reason: RejectionCode.MinimumNotMet, message: MESSAGES[RejectionCode.MinimumNotMet], subtotalCents: 1000, missingCents: 4000 },
  },
};

const pipeError = (message: string[]) => ({ statusCode: 422, error: 'Unprocessable Entity', message });
const borderError = (message: string) => ({ statusCode: 422, error: 'Unprocessable Entity', message });

const ERROR_EXAMPLES: ExampleMap = {
  'itens-vazios': { summary: 'Lista de itens vazia', value: pipeError(['cart.items must contain at least 1 elements']) },
  'cents-negativo': { summary: 'unitPriceCents negativo', value: pipeError(['cart.items.0.unitPriceCents must not be less than 0']) },
  'cents-fracionado': { summary: 'unitPriceCents fracionado', value: pipeError(['cart.items.0.unitPriceCents must be an integer number']) },
  'quantidade-invalida': { summary: 'quantity menor que 1', value: pipeError(['cart.items.0.quantity must not be less than 1']) },
  'campo-desconhecido': { summary: 'Campo extra no payload', value: pipeError(['property hacker should not exist']) },
  'cents-overflow': { summary: 'unitPriceCents acima do teto', value: pipeError(['cart.items.0.unitPriceCents must not be greater than 100000000']) },
  'codigo-muito-longo': { summary: 'couponCode acima de 64 caracteres', value: pipeError(['couponCode must be shorter than or equal to 64 characters']) },
  'total-divergente': { summary: 'totalCents nao bate com os itens', value: borderError(TOTAL_CENTS_MISMATCH_MESSAGE) },
  'codigo-invalido': { summary: 'Charset invalido apos normalizacao', value: borderError(INVALID_COUPON_CODE_MESSAGE) },
};

const DESCRIPTION = `API de validacao de cupom de desconto (**somente leitura**).

- **Nao consome uso** do cupom (nao incrementa \`redemptionCount\`).
- O **subtotal e recalculado no servidor** a partir de \`cart.items\` (Sigma \`unitPriceCents x quantity\`); o cliente nunca e a fonte da verdade.
- \`cart.totalCents\` e **opcional**; se enviado e divergir do subtotal recalculado, a resposta e **422**.
- **Rejeicoes de negocio retornam 200** com \`valid: false\` (cupom inexistente, inativo, expirado, etc.) — nao sao 4xx.
- \`missingCents\` aparece **apenas** quando \`reason = MINIMUM_NOT_MET\`.
- Dinheiro sempre em **centavos inteiros** (sem ponto flutuante).
- \`couponCode\` e normalizado (trim, remocao de zero-width, maiusculas) e deve conter apenas A-Z e 0-9 apos normalizar, senao **422**.

### Cupons disponiveis (seed) para testar

| Codigo | Regra | Resultado esperado |
| --- | --- | --- |
| \`LANC10\` | 10%, minimo R$50 | valido (ou \`MINIMUM_NOT_MET\` abaixo de R$50) |
| \`BLACK50\` | R$50 fixo, minimo R$100 | valido com \`discountType: FIXED\` |
| \`MEGA90\` | 90% com teto de R$30 | desconto limitado ao teto |
| \`FIXOVER\` | R$500 fixo | final R$0 em carrinhos pequenos |
| \`NORESTR\` | 10% sem restricao | valido |
| \`PCT100\` | 100% | final R$0 |
| \`EXPIRED\` | expirado | \`COUPON_EXPIRED\` |
| \`SOON\` | inicia no futuro | \`COUPON_NOT_STARTED\` |
| \`FULL\` | limite de usos atingido | \`REDEMPTION_LIMIT_REACHED\` |
| \`OFF\` | inativo | \`COUPON_INACTIVE\` |`;

export function buildOpenApiConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Mibbers — API de Validacao de Cupom')
    .setDescription(DESCRIPTION)
    .setVersion('0.1.0')
    .addTag('coupons', 'Validacao de cupom de desconto no checkout (somente leitura).')
    .build();
}

const DOCS_PATH = 'docs';

export function setupSwagger(app: INestApplication): OpenAPIObject | undefined {
  if (process.env.SWAGGER_ENABLED === 'false') {
    return undefined;
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === `/${DOCS_PATH}/`) {
      res.redirect(`/${DOCS_PATH}`);
      return;
    }
    next();
  });

  const document = SwaggerModule.createDocument(app, buildOpenApiConfig());
  SwaggerModule.setup(DOCS_PATH, app, document, {
    jsonDocumentUrl: `${DOCS_PATH}-json`,
    yamlDocumentUrl: `${DOCS_PATH}-yaml`,
    customSiteTitle: 'Mibbers — API de Validacao de Cupom',
    swaggerOptions: {
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  });

  return document;
}

export function ApiValidateCoupon(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiExtraModels(CouponAcceptedResponse, CouponRejectedResponse, CouponMinimumNotMetResponse, ValidationErrorResponse),
    ApiOperation({
      summary: 'Valida um cupom contra um carrinho (somente leitura)',
      description: 'Nao consome uso. Subtotal recalculado no servidor. Rejeicoes de negocio retornam 200 com valid:false; apenas payload malformado ou codigo invalido retornam 422.',
    }),
    ApiBody({ type: ValidateCouponDto, examples: REQUEST_EXAMPLES }),
    ApiOkResponse({
      description: 'Desfecho da validacao: cupom valido OU rejeicao de negocio (valid:false).',
      content: {
        'application/json': {
          schema: {
            oneOf: [
              { $ref: getSchemaPath(CouponAcceptedResponse) },
              { $ref: getSchemaPath(CouponRejectedResponse) },
              { $ref: getSchemaPath(CouponMinimumNotMetResponse) },
            ],
          },
          examples: OK_EXAMPLES,
        },
      },
    }),
    ApiUnprocessableEntityResponse({
      description: 'Payload malformado, fora dos limites, totalCents divergente ou codigo de cupom invalido.',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ValidationErrorResponse) },
          examples: ERROR_EXAMPLES,
        },
      },
    }),
  );
}
