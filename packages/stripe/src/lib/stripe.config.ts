import { AppModuleConfig } from '@deepkit/app';
import { t } from '@deepkit/type';

export const webhookConfigSchema = t.type({
  secret: t.string.description(
    'The webhook secret provided through your Stripe developer portal for processing incoming webhooks'
  ),
  controllerRoutePrefix: t.string
    .default('stripe')
    .description(
      'The route prefix that will be applied to the webhook handling controller'
    ),
  controllerRoute: t.string
    .default('webhook')
    .description(
      'The route that will be applied to the webhook handling route'
    ),
});

export const stripeModuleConfig = new AppModuleConfig({
  apiKey: t.string.required,
  webhookConfig: webhookConfigSchema.optional,
});

export class WebhookConfig extends stripeModuleConfig.slice([
  'webhookConfig',
]) {}
