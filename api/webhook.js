import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Groq from 'groq-sdk';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function classifyFailure(reason) {
  const prompt = `You are a payment failure classifier. Given a payment failure reason, respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "category": "one of: insufficient_funds, card_declined, expired_card, network_error, international_card_blocked, invalid_card, other",
  "message": "a short, friendly 1-2 sentence message to send the customer encouraging them to retry payment, tailored to this specific failure reason"
}

Failure reason: "${reason}"`;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });

  const text = completion.choices[0].message.content.trim();
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body.event;
  const payload = req.body.payload.payment.entity;

  const { data: paymentRow, error: paymentError } = await supabase
    .from('payments')
    .insert({
      razorpay_payment_id: payload.id,
      amount: payload.amount / 100,
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

  if (event === 'payment.failed') {
    const rawReason = payload.error_description || payload.error_reason || 'unknown';

    let classification;
    try {
      classification = await classifyFailure(rawReason);
    } catch (err) {
      console.error('Groq classification error:', err);
      classification = { category: 'other', message: 'We noticed your payment did not go through. Please try again.' };
    }

    const { data: failureRow, error: failureError } = await supabase
      .from('failures')
      .insert({
        payment_id: paymentRow.id,
        reason: rawReason,
        category: classification.category
      })
      .select()
      .single();

    if (failureError) {
      console.error('Error inserting failure:', failureError);
      return res.status(500).json({ error: 'Failed to log failure' });
    }

    const { error: recoveryError } = await supabase
      .from('recovery_actions')
      .insert({
        failure_id: failureRow.id,
        strategy: classification.category,
        message: classification.message,
        status: 'simulated_sent'
      });

    if (recoveryError) {
      console.error('Error inserting recovery action:', recoveryError);
    }
  }

  return res.status(200).json({ received: true });
}