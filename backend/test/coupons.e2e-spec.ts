import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/adapter/http/configure-app';
import { CLOCK } from '../src/ports/clock';

const NOW = new Date('2026-06-15T00:00:00Z');

const item = (unitPriceCents: number, quantity: number) => ({ id: 'p', name: 'Produto', unitPriceCents, quantity });

describe('POST /coupons/validate (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue({ now: () => NOW })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (body: object) => request(app.getHttpServer()).post('/coupons/validate').send(body);

  describe('desfechos de negocio (200)', () => {
    it('cupom valido retorna o desconto', async () => {
      const res = await post({ couponCode: 'LANC10', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toEqual({
        valid: true,
        couponCode: 'LANC10',
        discountType: 'PERCENTAGE',
        subtotalCents: 19900,
        discountCents: 1990,
        finalCents: 17910,
      });
    });

    it('cupom inexistente retorna COUPON_NOT_FOUND', async () => {
      const res = await post({ couponCode: 'NAOEXISTE', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: false, reason: 'COUPON_NOT_FOUND', subtotalCents: 19900 });
      expect(res.body).not.toHaveProperty('missingCents');
      expect(res.body).not.toHaveProperty('couponCode');
    });

    it('cupom inativo retorna COUPON_INACTIVE', async () => {
      const res = await post({ couponCode: 'OFF', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: false, reason: 'COUPON_INACTIVE' });
    });

    it('cupom expirado retorna COUPON_EXPIRED', async () => {
      const res = await post({ couponCode: 'EXPIRED', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: false, reason: 'COUPON_EXPIRED' });
    });

    it('cupom nao iniciado retorna COUPON_NOT_STARTED', async () => {
      const res = await post({ couponCode: 'SOON', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: false, reason: 'COUPON_NOT_STARTED' });
    });

    it('limite atingido retorna REDEMPTION_LIMIT_REACHED', async () => {
      const res = await post({ couponCode: 'FULL', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: false, reason: 'REDEMPTION_LIMIT_REACHED' });
    });

    it('abaixo do minimo retorna MINIMUM_NOT_MET com missingCents', async () => {
      const res = await post({ couponCode: 'LANC10', cart: { items: [item(1000, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: false, reason: 'MINIMUM_NOT_MET', subtotalCents: 1000, missingCents: 4000 });
    });

    it('desconto fixo maior que o subtotal zera o final', async () => {
      const res = await post({ couponCode: 'FIXOVER', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: true, discountCents: 19900, finalCents: 0 });
    });

    it('percentual com teto aplica o teto', async () => {
      const res = await post({ couponCode: 'MEGA90', cart: { items: [item(10000, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: true, discountCents: 3000, finalCents: 7000 });
    });

    it('cupom de 100% zera o final', async () => {
      const res = await post({ couponCode: 'PCT100', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: true, finalCents: 0 });
    });

    it('desconto fixo ecoa discountType FIXED', async () => {
      const res = await post({ couponCode: 'BLACK50', cart: { items: [item(10000, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: true, discountType: 'FIXED', discountCents: 5000, finalCents: 5000 });
    });

    it('normaliza o couponCode (espacos/minusculas)', async () => {
      const res = await post({ couponCode: '  lanc10 ', cart: { items: [item(19900, 1)] } }).expect(200);
      expect(res.body).toMatchObject({ valid: true, couponCode: 'LANC10' });
    });

    it('recomputa o subtotal a partir dos itens', async () => {
      const res = await post({ couponCode: 'NORESTR', cart: { items: [item(1000, 2), item(500, 1)] } }).expect(200);
      expect(res.body.subtotalCents).toBe(2500);
    });
  });

  describe('requisicao malformada (422)', () => {
    it('lista de itens vazia', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [] } }).expect(422);
    });

    it('unitPriceCents negativo', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(-1, 1)] } }).expect(422);
    });

    it('unitPriceCents fracionado', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(100.5, 1)] } }).expect(422);
    });

    it('quantity menor que 1', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(100, 0)] } }).expect(422);
    });

    it('couponCode vazio', async () => {
      await post({ couponCode: '', cart: { items: [item(19900, 1)] } }).expect(422);
    });

    it('campo desconhecido no payload', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(19900, 1)] }, hacker: 1 }).expect(422);
    });

    it('totalCents divergente dos itens', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(19900, 1)], totalCents: 100 } }).expect(422);
    });

    it('totalCents coincidente e aceito', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(19900, 1)], totalCents: 19900 } }).expect(200);
    });

    it('couponCode so com espacos', async () => {
      await post({ couponCode: '   ', cart: { items: [item(19900, 1)] } }).expect(422);
    });

    it('couponCode com caractere fora do charset', async () => {
      await post({ couponCode: 'LANC-10', cart: { items: [item(19900, 1)] } }).expect(422);
    });

    it('unitPriceCents acima do teto retorna 422 (nao 500)', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(1e20, 1)] } }).expect(422);
    });

    it('quantity acima do teto retorna 422', async () => {
      await post({ couponCode: 'LANC10', cart: { items: [item(100, 1_000_000_000)] } }).expect(422);
    });

    it('couponCode acima do tamanho maximo retorna 422', async () => {
      await post({ couponCode: 'A'.repeat(100), cart: { items: [item(19900, 1)] } }).expect(422);
    });
  });
});
