import type { INestApplication } from '@nestjs/common';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { RejectionCode } from '../../../core/models';
import type { ValidateCouponResponse } from '../mappers/result-to-http';
import { CouponAcceptedResponse, CouponMinimumNotMetResponse, CouponRejectedResponse } from './swagger';
import { buildOpenApiConfig } from './swagger';

describe('Documento OpenAPI', () => {
  let app: INestApplication;
  let doc: OpenAPIObject;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    doc = SwaggerModule.createDocument(app, buildOpenApiConfig());
  });

  afterAll(async () => {
    await app.close();
  });

  const operation = () => doc.paths['/coupons/validate'].post!;
  const okJson = () => (operation().responses['200'] as any).content['application/json'];
  const errJson = () => (operation().responses['422'] as any).content['application/json'];
  const schemas = () => doc.components!.schemas as Record<string, any>;

  it('documenta o POST /coupons/validate na tag coupons', () => {
    expect(operation()).toBeDefined();
    expect(operation().tags).toContain('coupons');
  });

  it('modela a resposta 200 como oneOf das tres variantes', () => {
    const oneOf = okJson().schema.oneOf as Array<{ $ref: string }>;
    expect(oneOf).toHaveLength(3);
    const refs = oneOf.map((s) => s.$ref);
    expect(refs.some((r) => r.endsWith('CouponAcceptedResponse'))).toBe(true);
    expect(refs.some((r) => r.endsWith('CouponRejectedResponse'))).toBe(true);
    expect(refs.some((r) => r.endsWith('CouponMinimumNotMetResponse'))).toBe(true);
  });

  it('expoe exemplos 200 com missingCents apenas no minimo', () => {
    const examples = okJson().examples as Record<string, { value: Record<string, unknown> }>;
    expect(examples).toHaveProperty('valido');
    expect(examples).toHaveProperty('nao-encontrado');
    expect(examples).toHaveProperty('minimo-nao-atingido');
    expect(typeof examples['minimo-nao-atingido'].value.missingCents).toBe('number');
    expect(examples['nao-encontrado'].value).not.toHaveProperty('missingCents');
    expect(examples['nao-encontrado'].value).not.toHaveProperty('couponCode');
  });

  it('referencia ValidationErrorResponse no 422 com varios exemplos', () => {
    expect(errJson().schema.$ref).toMatch(/ValidationErrorResponse$/);
    expect(Object.keys(errJson().examples).length).toBeGreaterThan(3);
  });

  it('gera componentes nomeados e mantem as variantes de rejeicao disjuntas', () => {
    expect(schemas().DiscountType.enum).toEqual(['PERCENTAGE', 'FIXED']);
    expect(schemas().RejectionReason.enum).toHaveLength(5);
    expect(schemas().RejectionReason.enum).not.toContain('MINIMUM_NOT_MET');
    expect(schemas().RejectionReason.enum).toEqual(
      expect.arrayContaining([
        'COUPON_NOT_FOUND',
        'COUPON_INACTIVE',
        'COUPON_NOT_STARTED',
        'COUPON_EXPIRED',
        'REDEMPTION_LIMIT_REACHED',
      ]),
    );
    expect(schemas().CouponMinimumNotMetResponse.properties.reason.enum).toEqual(['MINIMUM_NOT_MET']);
  });

  it('classes documentais permanecem alinhadas ao contrato de runtime', () => {
    type Accepted = Extract<ValidateCouponResponse, { valid: true }>;
    type MinimumNotMet = Extract<ValidateCouponResponse, { reason: RejectionCode.MinimumNotMet }>;
    type SimpleRejected = Exclude<ValidateCouponResponse, Accepted | MinimumNotMet>;

    const accepted: CouponAcceptedResponse = {} as Accepted;
    const rejected: CouponRejectedResponse = {} as SimpleRejected;
    const minimum: CouponMinimumNotMetResponse = {} as MinimumNotMet;

    expect([accepted, rejected, minimum]).toHaveLength(3);
  });

  it('espelha as constraints dos DTOs no schema', () => {
    expect(schemas().CartItemDto.properties.unitPriceCents.minimum).toBe(0);
    expect(schemas().CartItemDto.properties.unitPriceCents.maximum).toBe(100_000_000);
    expect(schemas().CartItemDto.properties.quantity.maximum).toBe(1000);
    expect(schemas().ValidateCouponDto.properties.couponCode.maxLength).toBe(64);
    expect(schemas().CartDto.properties.items.minItems).toBe(1);
    expect(schemas().CartDto.properties.items.maxItems).toBe(200);
  });

  it('tem descricao rica cobrindo as decisoes de design', () => {
    expect(doc.info.title).toBeTruthy();
    expect(doc.info.version).toBeTruthy();
    expect(doc.info.description).toContain('200');
    expect(doc.info.description).toContain('totalCents');
    expect(doc.info.description).toContain('LANC10');
  });
});
