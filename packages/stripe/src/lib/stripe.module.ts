/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AppModule, createModule } from '@deepkit/app';
import Stripe from 'stripe';
import { http, HttpRequest } from '@deepkit/http';
import { StripeWebhookService } from './stripe.webhook.service';
import { stripeModuleConfig } from './stripe.config';
import { ClassType } from '@deepkit/core';
import { stripeHandlerMap } from './stripe.decorators';

const makeController = (prefix: string, route: string, secret: string) => {
  @http.controller(prefix)
  class Controller {
    constructor(
      private readonly webhookService: StripeWebhookService,
      private readonly stripe: Stripe,
    ) {}

    @http.POST(route)
    public async handleEvent(request: HttpRequest) {
      const sig = String(request.headers['stripe-signature']);
      const buffers = [];

      for await (const chunk of request) {
        buffers.push(chunk);
      }

      const bodyBuffer = Buffer.concat(buffers).toString();

      const event = this.stripe.webhooks.constructEvent(
        bodyBuffer,
        sig,
        secret
      );

      return this.webhookService.handleEvent(event);
    }
  }

  return Controller;
};

export class StripeModule extends createModule(
  {
    config: stripeModuleConfig,
    exports: [Stripe],
  },
  'stripe'
) {

  process() {
    this.addProvider({
      provide: Stripe,
      useFactory: () => {
        return new Stripe(this.config.apiKey, {
          typescript: true,
          apiVersion: '2020-08-27',
        });
      },
    });

    if (this.config.webhookConfig) {
      this.addProvider(StripeWebhookService);
      this.addController(
        makeController(
          this.config.webhookConfig.controllerRoutePrefix,
          this.config.webhookConfig.controllerRoute,
          this.config.webhookConfig.secret
        )
      );
    }
  }

  processController(module: AppModule<any>, controller: ClassType) {
    if (!this.config.webhookConfig) return;

    const configs = stripeHandlerMap.get(controller);
    if (!configs) return;

    if (!module.isProvided(controller)) module.addProvider(controller);

    for (const config of configs) {
      this.setupProvider(StripeWebhookService).register(
        config.eventType, module, controller, config.property
      );
    }
  }
}
