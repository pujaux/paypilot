import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Step 1: Verify the webhook signature
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Step 2: Parse the event
  const event = req.body.event;
  const payload = req.body.payload.payment.entity;

  // Step 3: Insert into payments table (every event)
  const { data: paymentRow, error: paymentError } = await supabase
    .from('payments')
    .insert({
      razorpay_payment_id: payload.id,
      amount: payload.amount / 100, // Razorpay sends amount in paise
      currency: payload.currency,
      status: payload.status,
      customer_email: payload.email || null
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Error inserting payment:', paymentError);
    return res.status(500).json({ error: 'Failed to log payment' });
  }

  // Step 4: If it's a failure, also log into failures table
  if (event === 'payment.failed') {
    const { error: failureError } = await supabase
      .from('failures')
      .insert({
        payment_id: paymentRow.id,
        reason: payload.error_description || payload.error_reason || 'unknown',
        category: null // Day 3 will fill this in via classifier
      });

    if (failureError) {
      console.error('Error inserting failure:', failureError);
      return res.status(500).json({ error: 'Failed to log failure' });
    }
  }

  return res.status(200).json({ received: true });
}