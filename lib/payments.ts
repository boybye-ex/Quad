import { supabase } from './supabase';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentProvider = 'paystack' | 'yoco' | 'stripe';

export interface Payment {
  id: string;
  listingId: string;
  payerId: string;
  payeeId: string;
  amountCents: number;
  currency: string;
  provider: PaymentProvider;
  providerRef: string | null;
  status: PaymentStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentWithDetails extends Payment {
  listingTitle: string;
  payerName: string;
  payeeName: string;
}

export interface CreatePaymentParams {
  listingId: string;
  amountCents: number;
  provider?: PaymentProvider;
}

export interface PaymentConfig {
  isEnabled: boolean;
  publicKey: string | null;
  provider: PaymentProvider;
}

export function getPaymentConfig(): PaymentConfig {
  const isEnabled = process.env.EXPO_PUBLIC_PAYMENTS_ENABLED === 'true';
  const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || null;
  
  return {
    isEnabled: isEnabled && !!publicKey,
    publicKey,
    provider: 'paystack',
  };
}

export function isPaymentsEnabled(): boolean {
  const config = getPaymentConfig();
  return config.isEnabled;
}

export function formatZAR(amountCents: number): string {
  const rand = amountCents / 100;
  return `R${rand.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function priceToAmountCents(price: number): number {
  return Math.round(price * 100);
}

export async function createPayment(
  params: CreatePaymentParams
): Promise<{ paymentId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('create_payment', {
      p_listing_id: params.listingId,
      p_amount_cents: params.amountCents,
      p_provider: params.provider || 'paystack',
    });

    if (error) {
      console.error('Error creating payment:', error);
      return { paymentId: null, error: error.message };
    }

    return { paymentId: data, error: null };
  } catch (err) {
    console.error('Error creating payment:', err);
    return { paymentId: null, error: 'Failed to create payment' };
  }
}

export async function getUserPayments(
  limit: number = 50,
  offset: number = 0
): Promise<{ payments: PaymentWithDetails[]; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('get_user_payments', {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error fetching payments:', error);
      return { payments: [], error: error.message };
    }

    const payments: PaymentWithDetails[] = (data || []).map((row: {
      id: string;
      listing_id: string;
      listing_title: string;
      payer_id: string;
      payer_name: string;
      payee_id: string;
      payee_name: string;
      amount_cents: number;
      currency: string;
      provider: PaymentProvider;
      status: PaymentStatus;
      created_at: string;
    }) => ({
      id: row.id,
      listingId: row.listing_id,
      listingTitle: row.listing_title,
      payerId: row.payer_id,
      payerName: row.payer_name,
      payeeId: row.payee_id,
      payeeName: row.payee_name,
      amountCents: row.amount_cents,
      currency: row.currency,
      provider: row.provider,
      providerRef: null,
      status: row.status,
      metadata: {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    }));

    return { payments, error: null };
  } catch (err) {
    console.error('Error fetching payments:', err);
    return { payments: [], error: 'Failed to fetch payments' };
  }
}

export async function getPaymentById(
  paymentId: string
): Promise<{ payment: Payment | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      return { payment: null, error: error.message };
    }

    if (!data) {
      return { payment: null, error: 'Payment not found' };
    }

    const payment: Payment = {
      id: data.id,
      listingId: data.listing_id,
      payerId: data.payer_id,
      payeeId: data.payee_id,
      amountCents: data.amount_cents,
      currency: data.currency,
      provider: data.provider,
      providerRef: data.provider_ref,
      status: data.status,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return { payment, error: null };
  } catch (err) {
    console.error('Error fetching payment:', err);
    return { payment: null, error: 'Failed to fetch payment' };
  }
}
