import { applyDecorators, type INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  DocumentBuilder,
  getSchemaPath,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import {
  CouponAcceptedResponse,
  CouponMinimumNotMetResponse,
  CouponRejectedResponse,
  ERROR_EXAMPLES,
  OK_EXAMPLES,
  REQUEST_EXAMPLES,
  ValidationErrorResponse,
} from './response.schemas';

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

export function setupSwagger(app: INestApplication): OpenAPIObject | undefined {
  if (process.env.SWAGGER_ENABLED === 'false') {
    return undefined;
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/docs/') {
      res.redirect('/docs');
      return;
    }
    next();
  });

  const document = SwaggerModule.createDocument(app, buildOpenApiConfig());
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
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
    ApiTags('coupons'),
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
