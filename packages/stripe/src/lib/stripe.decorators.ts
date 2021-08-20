import Stripe from 'stripe';
import { ClassType } from '@deepkit/core';

interface StripeWebhookHandlerConfig {
  injectableService: ClassType;
  handlerProperty: string | symbol;
}

export const stripeHandlerMap = new Map<string, StripeWebhookHandlerConfig>();

export const StripeWebhookHandler: (
  eventType: Stripe.WebhookEndpointCreateParams.EnabledEvent
) => MethodDecorator = (eventType) => (target, property) => {
  stripeHandlerMap.set(eventType, {
    injectableService: target.constructor as ClassType,
    handlerProperty: property,
  });
};
