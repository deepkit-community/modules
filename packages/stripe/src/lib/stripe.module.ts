/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AppModule } from '@deepkit/app';
import Stripe from 'stripe';
import { http, HttpRequest } from '@deepkit/http';
import { inject } from '@deepkit/injector';
import { StripeWebhookService } from './stripe.webhook.service';
import { stripeModuleConfig, WebhookConfig } from './stripe.config';

const makeController = (prefix: string, route: string) => {
  @http.controller(prefix)
  class Controller {
    constructor(
      private readonly webhookService: StripeWebhookService,
      @inject('Stripe') private readonly stripe: Stripe,
      private readonly webhookConfig: WebhookConfig
    ) {}

    @http.POST(route)
    public async handleEvent(request: HttpRequest) {
      const sig = request.headers['stripe-signature'];
      const buffers = [];

      for await (const chunk of request) {
        buffers.push(chunk);
      }

      const bodyBuffer = Buffer.concat(buffers).toString();

      const event = this.stripe.webhooks.constructEvent(
        bodyBuffer,
        sig as any,
        this.webhookConfig.webhookConfig!.secret
      );

      return this.webhookService.handleEvent(event);
    }
  }

  return Controller;
};

export const stripeModule = new AppModule(
  {
    config: stripeModuleConfig,
    providers: [
      {
        provide: 'Stripe',
        deps: [stripeModuleConfig.all()],
        useFactory: (config: typeof stripeModuleConfig.type) => {
          const { apiKey } = config;
          return new Stripe(apiKey, {
            typescript: true,
            apiVersion: '2020-08-27',
          });
        },
      },
    ],
    exports: ['Stripe'],
  },
  'stripe'
).setup((stripeModule, config) => {
  if (config.webhookConfig) {
    const webhookConfig = config.webhookConfig!;
    stripeModule.addProvider(StripeWebhookService);
    stripeModule.addController(
      makeController(
        webhookConfig.controllerRoutePrefix!,
        webhookConfig.controllerRoute!
      )
    );
  }
});
