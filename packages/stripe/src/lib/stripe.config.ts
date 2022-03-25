class StripeWebhookConfig {
  /**
   * @description The webhook secret provided through your Stripe developer portal for processing incoming webhooks
   */
  secret!: string;

  /**
   * @description The route prefix that will be applied to the webhook handling controller
   */
  controllerRoutePrefix: string = 'stripe';

  /**
   * @description The route that will be applied to the webhook handling route
   */
  controllerRoute: string = 'webhook';
}

export class StripeConfig {
  apiKey!: string;

  webhookConfig?: StripeWebhookConfig
}
