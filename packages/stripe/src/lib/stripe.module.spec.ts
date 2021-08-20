import { stripeModule } from './stripe.module';
import { StripeWebhookHandler } from './stripe.decorators';
import { AppModule, CommandApplication } from '@deepkit/app';
import Stripe from 'stripe';
import { HttpKernel, Router, HttpRequest } from '@deepkit/http';
import { Application } from '@deepkit/framework';
import { injectable } from '@deepkit/injector';

const STRIPE_SECRET = 'whsec_test_secret';
const ACCOUNT_CREATED = 'account.external_account.created';
const ACCOUNT_DELETED = 'account.external_account.deleted';

describe('Stripe Module', () => {
  it('provides an injectable stripe instance', () => {
    const app = new CommandApplication(
      new AppModule({ imports: [stripeModule.configure({ apiKey: 'test' })] })
    );

    const stripe = app.get<string, Stripe>('Stripe');
    expect(stripe).toBeDefined();
    expect(stripe).toBeInstanceOf(Stripe);
  });

  describe('webhook configuration', () => {
    const defaultConfig = {
      apiKey: 'test',
      webhookConfig: {
        secret: '123',
      },
    };

    it('adds a controller with default routes', async () => {
      const app = new Application(
        new AppModule({
          imports: [stripeModule.configure(defaultConfig)],
        })
      );

      const router = app.get(Router);

      expect(router.resolve('POST', '/stripe/webhook')).toBeDefined();
    });

    it('adds a controller with user provided routes', async () => {
      const app = new Application(
        new AppModule({
          imports: [
            stripeModule.configure({
              apiKey: 'test',
              webhookConfig: {
                secret: '123',
                controllerRoutePrefix: 'custom-prefix',
                controllerRoute: 'custom-route',
              },
            }),
          ],
        })
      );

      const router = app.get(Router);

      expect(
        router.resolve('POST', '/custom-prefix/custom-route')
      ).toBeDefined();
    });

    describe('webhook payload handling', () => {
      @injectable()
      class ExampleWebhookHandler {
        @StripeWebhookHandler(ACCOUNT_CREATED)
        handle() {
          return { handled: true };
        }
      }

      let app: Application<any>;
      let httpHandler: HttpKernel;
      let stripe: Stripe;

      beforeAll(() => {
        app = new Application(
          new AppModule({
            providers: [ExampleWebhookHandler],
            imports: [
              stripeModule.configure({
                apiKey: 'test',
                webhookConfig: {
                  secret: STRIPE_SECRET,
                },
              }),
            ],
          })
        );

        httpHandler = app.get(HttpKernel);
        stripe = app.get<string, Stripe>('Stripe');
      });

      it('validates payloads and passes incoming events to the service if a handler is registered', async () => {
        const payload = {
          id: 'evt_test_webhook',
          object: 'event',
          type: ACCOUNT_CREATED,
        };

        const payloadString = JSON.stringify(payload, null, 2);

        const response = await httpHandler.request(
          HttpRequest.POST('/stripe/webhook')
            .body(payloadString)
            .header(
              'stripe-signature',
              stripe.webhooks.generateTestHeaderString({
                payload: payloadString,
                secret: STRIPE_SECRET,
              })
            )
        );

        expect(response.json).toEqual({ handled: true });
      });

      it('throws an error if no handler is registered for the event type', async () => {
        const payload = {
          id: 'evt_test_webhook',
          object: 'event',
          type: ACCOUNT_DELETED,
        };

        const payloadString = JSON.stringify(payload, null, 2);

        const response = await httpHandler.request(
          HttpRequest.POST('/stripe/webhook')
            .body(payloadString)
            .header(
              'stripe-signature',
              stripe.webhooks.generateTestHeaderString({
                payload: payloadString,
                secret: 'whsec_test_secret',
              })
            )
        );

        expect(response.statusCode).toEqual(404);
      });
    });
  });
});
