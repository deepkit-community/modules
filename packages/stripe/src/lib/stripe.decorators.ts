import Stripe from 'stripe';
import { ClassType } from '@deepkit/core';

interface StripeWebhookHandlerConfig {
  eventType: Stripe.WebhookEndpointCreateParams.EnabledEvent;
  property: string | symbol;
}

export const stripeHandlerMap = new Map<ClassType, StripeWebhookHandlerConfig[]>();

export const StripeWebhookHandler: (
  eventType: Stripe.WebhookEndpointCreateParams.EnabledEvent
) => MethodDecorator = (eventType) => (target, property) => {
  const classType = target.constructor as ClassType;
  let configs = stripeHandlerMap.get(classType);
  if (!configs) stripeHandlerMap.set(classType, configs = []);
  configs.push({ eventType, property });
};
