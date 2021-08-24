import { HttpNotFoundError } from '@deepkit/http';
import { injectable, InjectorContext } from '@deepkit/injector';
import { stripeHandlerMap } from './stripe.decorators';

@injectable()
export class StripeWebhookService {
  constructor(private readonly injector: InjectorContext) {}

  handleEvent(payload: { type: string }) {
    const { type } = payload;
    const config = stripeHandlerMap.get(type);
    if (!config) {
      throw new HttpNotFoundError();
    }

    const { injectableService, handlerProperty } = config;
    const service = this.injector.get(injectableService);
    const handler = service[handlerProperty];

    return handler(payload);
  }
}
