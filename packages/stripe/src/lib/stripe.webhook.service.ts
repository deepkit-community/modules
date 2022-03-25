import { HttpNotFoundError } from '@deepkit/http';
import { InjectorContext } from '@deepkit/injector';
import { ClassType } from '@deepkit/core';
import { AppModule } from '@deepkit/app';
import Stripe from 'stripe';

interface RegistryEntry {
  module: AppModule<any>,
  controller: ClassType,
  property: string | symbol;
}

export class StripeWebhookService {
  protected registry = new Map<Stripe.WebhookEndpointCreateParams.EnabledEvent, RegistryEntry>();

  constructor(private readonly injector: InjectorContext) {
  }

  register(
    eventType: Stripe.WebhookEndpointCreateParams.EnabledEvent,
    module: AppModule<any>,
    controller: ClassType,
    property: string | symbol
  ) {
    this.registry.set(eventType, { module, controller, property });
  }

  handleEvent(payload: { type: string }) {
    const { type } = payload;
    const config = this.registry.get(type as Stripe.WebhookEndpointCreateParams.EnabledEvent);
    if (!config) {
      throw new HttpNotFoundError();
    }

    const service = this.injector.get(config.controller, config.module);
    const handler = service[config.property];
    return handler(payload);
  }
}
