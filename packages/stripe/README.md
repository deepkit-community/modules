# @deepkit-community/stripe

Interacting with the Stripe API or consuming Stripe webhooks in your Deepkit applications is now easy as pie 🥧

<p align="center">
<a href="https://www.npmjs.com/package/@deepkit-community/stripe"><img src="https://img.shields.io/npm/v/@deepkit-community/stripe.svg?style=flat" alt="version" /></a>
<a href="https://www.npmjs.com/package/@deepkit-community/stripe"><img alt="downloads" src="https://img.shields.io/npm/dt/@deepkit-community/stripe.svg?style=flat"></a>
<img alt="license" src="https://img.shields.io/npm/l/@deepkit-community/stripe.svg">
</p>

## Features

- 💉 Injectable Stripe client for interacting with the Stripe API in Controllers

- 🎉 Optionally exposes an API endpoint from your Deepkit application at to be used for webhook event processing from Stripe. Defaults to `/stripe/webhook/` but can be easily configured

- 🔒 Automatically validates that the event payload was actually sent from Stripe using the configured webhook signing secret

- 🕵️ Discovers controllers from your application decorated with `StripeWebhookHandler` and routes incoming events to them

- 🧭 Route events to logical services easily simply by providing the Stripe webhook event type

## Getting Started

### Install

#### NPM

- Install the package along with the stripe peer dependency
  `npm install --save @deepkit-community/stripe stripe`

#### YARN

- Install the package using yarn with the stripe peer dependency
  `yarn add @deepkit-community/stripe stripe`

### Import

Import and add `stripeModule` to the `imports` section of the consuming module. Your Stripe API key is required, and you can optionally include a webhook configuration if you plan on consuming Stripe webhook events inside your app.

```typescript
import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import { StripeModule } from '@deepkit-community/stripe';

new App({
  imports: [
    new StripeModule({
      apiKey: 'test',
      webhookConfig: {
        secret: STRIPE_SECRET,
      },
    }),
    new FrameworkModule
  ],
});
```

### Configuration

Configuration can be provided inline as seen in the example above or using ENV variables with a prefix of `stripe`.

### Injectable Providers

The module exposes an injectable Stripe instance that is pre-configured with your API Key based on module configuration. To inject it, use the `Stripe` injection token:

```typescript
@injectable
class MyService {
  constructor(private readonly stripe: Stripe) {}
}
```

## Consuming Webhooks

### Included API Endpoint

This module will automatically add a new API endpoint to your Deepkit application for processing webhooks. By default, the route for this endpoint will be `stripe/webhook` but you can modify this to use a different prefix using the `controllerRoutePrefix` and `controllerRoute` configuration when importing the module.

### Decorate Methods For Processing Webhook Events

Exposing provider/service methods to be used for processing Stripe events is easy! Simply use the provided decorator and indicate the event type that the handler should receive.

[Review the Stripe documentation](https://stripe.com/docs/api/events/types) for more information about the types of events available.

```typescript
class PaymentCreatedController {
  @StripeWebhookHandler('payment_intent.created')
  handlePaymentIntentCreated(evt: StripeEvent) {
    // execute your custom business logic
  }
}

new App({
  controller: [PaymentCreatedController],
  imports: [
    new StripeModule({
      apiKey: 'test',
      webhookConfig: {
        secret: STRIPE_SECRET,
      },
    }),
    new FrameworkModule
  ]
}).run();
```

### Configure Webhooks in the Stripe Dashboard

Follow the instructions from the [Stripe Documentation](https://stripe.com/docs/webhooks) for remaining integration steps such as testing your integration with the CLI before you go live and properly configuring the endpoint from the Stripe dashboard so that the correct events are sent to your Deepkit app.

## License

[MIT License](../../LICENSE)
