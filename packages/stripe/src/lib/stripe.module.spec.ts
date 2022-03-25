import { StripeModule } from './stripe.module';
import { StripeWebhookHandler } from './stripe.decorators';
import { App } from '@deepkit/app';
import Stripe from 'stripe';
import { HttpKernel, HttpModule, HttpRequest, Router } from '@deepkit/http';

const STRIPE_SECRET = 'whsec_test_secret';
const ACCOUNT_CREATED = 'account.external_account.created';
const ACCOUNT_DELETED = 'account.external_account.deleted';

Error.stackTraceLimit = 100;

describe('Stripe Module', () => {
  it('provides an injectable stripe instance', () => {
    const app = new App({
      imports: [new StripeModule({ apiKey: 'test' })]
    });

    const stripe = app.get(Stripe);
    expect(stripe).toBeDefined();
    expect(stripe).toBeInstanceOf(Stripe);
  });

  describe('webhook configuration', () => {
    const defaultConfig = {
      apiKey: 'test',
      webhookConfig: {
        secret: '123'
      }
    };

    it('adds a controller with default routes', async () => {
      const app = new App({
        imports: [new StripeModule(defaultConfig), new HttpModule()],
      });

      const router = app.get(Router);

      expect(router.resolve('POST', '/stripe/webhook')).toBeDefined();
    });

    it('adds a controller with user provided routes', async () => {
      const app = new App({
        imports: [
          new StripeModule({
            apiKey: 'test',
            webhookConfig: {
              secret: '123',
              controllerRoutePrefix: 'custom-prefix',
              controllerRoute: 'custom-route'
            }
          }),
          new HttpModule()
        ]
      });

      const router = app.get(Router);

      expect(
        router.resolve('POST', '/custom-prefix/custom-route')
      ).toBeDefined();
    });

    describe('webhook payload handling', () => {
      class ExampleWebhookHandler {
        @StripeWebhookHandler(ACCOUNT_CREATED)
        handle() {
          return { handled: true };
        }
      }

      let app: App<any>;
      let httpHandler: HttpKernel;
      let stripe: Stripe;

      beforeAll(() => {
        app = new App({
          controllers: [ExampleWebhookHandler],
          imports: [
            new StripeModule({
              apiKey: 'test',
              webhookConfig: {
                secret: STRIPE_SECRET
              }
            }),
            new HttpModule()
          ]
        });

        httpHandler = app.get(HttpKernel);
        stripe = app.get(Stripe);
      });

      it('validates payloads and passes incoming events to the service if a handler is registered', async () => {
        const payload = {
          id: 'evt_test_webhook',
          object: 'event',
          type: ACCOUNT_CREATED
        };

        const payloadString = JSON.stringify(payload, null, 2);

        const response = await httpHandler.request(
          HttpRequest.POST('/stripe/webhook')
            .body(payloadString)
            .header(
              'stripe-signature',
              stripe.webhooks.generateTestHeaderString({
                payload: payloadString,
                secret: STRIPE_SECRET
              })
            )
        );

        expect(response.json).toEqual({ handled: true });
      });

      it('throws an error if no handler is registered for the event type', async () => {
        const payload = {
          id: 'evt_test_webhook',
          object: 'event',
          type: ACCOUNT_DELETED
        };

        const payloadString = JSON.stringify(payload, null, 2);

        const response = await httpHandler.request(
          HttpRequest.POST('/stripe/webhook')
            .body(payloadString)
            .header(
              'stripe-signature',
              stripe.webhooks.generateTestHeaderString({
                payload: payloadString,
                secret: 'whsec_test_secret'
              })
            )
        );

        expect(response.statusCode).toEqual(404);
      });
    });
  });
});
