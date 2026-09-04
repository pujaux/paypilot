import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const failureScenarios = {
  insufficient_funds: {
    reason: "Insufficient balance in account",
    description: "Customer doesn't have enough money"
  },
  card_expired: {
    reason: "Card has expired",
    description: "Customer's card is no longer valid"
  },
  international_card_blocked: {
    reason: "Your payment could not be completed as this business accepts domestic (Indian) card payments only. Try another payment method.",
    description: "International card blocked by merchant"
  },
  network_error: {
    reason: "Network timeout - please retry",
    description: "Temporary network issue"
  },
  card_declined: {
    reason: "Card was declined by bank",
    description: "Bank declined the transaction"
  }
};

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

  const { type } = req.query;

  if (!type || !failureScenarios[type]) {
    return res.status(400).json({ 
      error: 'Invalid type. Use: ' + Object.keys(failureScenarios).join(', ')
    });
  }

  const scenario = failureScenarios[type];
  const amount = Math.floor(Math.random() * (500 - 100) + 100); // ₹100-500

  try {
    // 1. Create fake payment record
    const { data: paymentRow, error: paymentError } = await supabase
      .from('payments')
      .insert({
        razorpay_payment_id: 'test_' + Date.now(),
        amount,
        currency: 'INR',
        status: 'failed',
        customer_email: 'test@example.com'
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 2. Classify with Groq
    const classification = await classifyFailure(scenario.reason);

    // 3. Create failure record
    const { data: failureRow, error: failureError } = await supabase
      .from('failures')
      .insert({
        payment_id: paymentRow.id,
        reason: scenario.reason,
        category: classification.category
      })
      .select()
      .single();

    if (failureError) throw failureError;

    // 4. Create recovery action
    const { error: recoveryError } = await supabase
      .from('recovery_actions')
      .insert({
        failure_id: failureRow.id,
        strategy: classification.category,
        message: classification.message,
        status: 'simulated_sent'
      });

    if (recoveryError) throw recoveryError;

    return res.status(200).json({
      success: true,
      payment_id: paymentRow.id,
      failure_id: failureRow.id,
      category: classification.category,
      message: classification.message
    });

  } catch (err) {
    console.error('Test failure error:', err);
    return res.status(500).json({ error: err.message });
  }
}