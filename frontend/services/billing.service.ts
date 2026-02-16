import { callBackendFunction } from './functions-api.service'

export type BillingCycle = 'monthly' | 'yearly'

export async function createCheckoutSession(billingCycle: BillingCycle): Promise<{ url: string }> {
  return callBackendFunction<{ url: string }>('createStripeCheckoutSession', {
    billingCycle,
  })
}

export async function createPortalSession(): Promise<{ url: string }> {
  return callBackendFunction<{ url: string }>('createStripePortalSession')
}
