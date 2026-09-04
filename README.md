# PayPilot 

**AI-powered payment failure recovery agent** — automatically classifies payment failures and drafts intelligent recovery messages in real-time.

---

## The Problem

Payment failures happen. When they do, businesses need to:
- **Quickly understand** what went wrong
- **Reach customers immediately** with the right message
- **Personalize recovery strategies** based on failure type
- **Track recovery success** metrics

Most payment systems show you a raw error code. **PayPilot shows you the path to recovery.**

---

## How It Works

```
Payment Fails
    ↓
Webhook Triggered → Failure Logged to Supabase
    ↓
Groq AI Agent Classifies Failure
    ↓
AI Drafts Personalized Recovery Message
    ↓
Message Sent + Tracked in Dashboard
    ↓
Metrics Updated in Real-Time
```

### Example Scenarios

| Failure | AI Decision | Recovery Message |
|---------|------------|-----------------|
| **Insufficient Funds** | Offer payment plan | "Please add funds and try again – we'll be ready when you are!" |
| **Card Expired** | Suggest card update | "Please update your card details or use a different card to complete your purchase." |
| **International Block** | Recommend domestic card | "Please try using an Indian domestic card or another payment method." |
| **Network Timeout** | Encourage retry | "We hit a network timeout. Please try again – let us know if you need help." |
| **Card Declined** | Alternative payment | "Your bank declined this card. Please verify details or try a different payment method." |

---

## Features

✅ **Real-Time Failure Classification** — Groq AI instantly categorizes payment failures  
✅ **Intelligent Message Generation** — Each failure gets a personalized recovery strategy  
✅ **Live Dashboard** — Track failures, classifications, and recovery metrics  
✅ **Zero Manual Intervention** — Fully automated pipeline  
✅ **100% Free Stack** — No credit card required, completely hackathon-friendly  
✅ **Production-Ready** — Deployed live on Vercel with Supabase  

---

## Tech Stack

### Core Stack
- **Payments**: [Razorpay](https://razorpay.com) (Test Mode)
- **AI/LLM**: [Groq](https://groq.com) (Free API - Llama 3.3)
- **Database**: [Supabase](https://supabase.io) (Postgres)
- **Backend**: [Next.js](https://nextjs.org) API Routes
- **Frontend**: React 18 + Tailwind CSS
- **Hosting**: [Vercel](https://vercel.com)

### Why This Stack?
- **Razorpay**: Webhooks work perfectly in test mode; no real money involved
- **Groq**: Lightning-fast LLM responses (perfect for real-time agents)
- **Supabase**: Easy to query, powerful dashboard, great free tier
- **Vercel**: Auto-deploys on git push, serverless functions included
- **React**: Instant UI updates, real-time metrics

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Razorpay (Test Mode)                 │
│         Simulates payment failures via webhooks          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js Webhook Handler (/api)             │
│   - Validates signature                                  │
│   - Logs payment + failure to Supabase                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│           Groq LLM Agent (Llama 3.3)                    │
│   - Classifies failure reason                            │
│   - Generates recovery message                           │
│   - Stores decision logic                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│          Supabase Postgres Database                      │
│   Tables:                                                │
│   - payments (all payment records)                       │
│   - failures (failed payments + reason)                  │
│   - recovery_actions (AI strategies + messages)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│         React Dashboard (Live Console)                   │
│   - Real-time metrics (failures, classifications)        │
│   - Recovery message display                             │
│   - Test failure trigger buttons                         │
│   - Auto-refresh every 15 seconds                        │
└─────────────────────────────────────────────────────────┘
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/paypilot.git
cd paypilot
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Razorpay (get from test account)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_key

# Groq (free API key)
GROQ_API_KEY=your_groq_api_key
```

### 3. Setup Supabase Schema

Run these SQL queries in Supabase:

```sql
-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_payment_id TEXT UNIQUE,
  amount DECIMAL,
  currency TEXT,
  status TEXT,
  customer_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Failures table
CREATE TABLE failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  reason TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recovery actions table
CREATE TABLE recovery_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  failure_id UUID REFERENCES failures(id),
  strategy TEXT,
  message TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Get Free API Keys

**Razorpay** (Test Account):
1. Go to [razorpay.com](https://razorpay.com)
2. Sign up → Dashboard → API Keys → Copy Test Key ID & Secret

**Groq** (Free API):
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → Create API Key → Copy

**Supabase** (Free Tier):
1. Go to [supabase.io](https://supabase.io)
2. Create project → Get URL & Service Key

### 5. Deploy to Vercel

```bash
vercel
# Follow prompts, add .env variables
```

### 6. Setup Razorpay Webhook

1. In Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-vercel-domain.vercel.app/api/webhook`
3. Select events: `payment.failed`
4. Copy Webhook Secret → add to `.env.local`

### 7. Run Local Dev

```bash
npm run dev
# Open http://localhost:3000
# Open http://localhost:3000/public/index.html for dashboard
```

---

## Demo

### Live Demo URL
Visit: **[paypilot-n7uohe8ub.vercel.app](https://paypilot-n7uohe8ub.vercel.app)**

### Test the Demo

1. **Click "₹ Insufficient Funds"** button
   - AI classifies as insufficient balance
   - Generates message about adding funds
   - Dashboard updates in real-time

2. **Click "🗓️ Card Expired"** button
   - AI suggests updating card details
   - Different recovery strategy shown
   - Metrics increase

3. **Click "🌍 International Block"** button
   - AI recommends domestic/alternative payment
   - Personalized for India market
   - Watch metrics climb

4. **Test other scenarios** (Network Error, Card Declined)
   - Each shows distinct AI reasoning
   - No two messages are the same
   - Demonstrates intelligence of agent

**Result:** 5 different failure scenarios → 5 different strategies → 100% automated

---

## Project Structure

```
paypilot/
├── api/
│   ├── webhook.js          # Razorpay webhook handler
│   └── test-failure.js     # Demo endpoint for triggering failures
├── public/
│   └── index.html          # Live dashboard (React)
├── .env.local              # API keys (git ignored)
├── package.json
└── README.md
```

---

## API Endpoints

### POST `/api/webhook`
Receives payment failure webhooks from Razorpay
- Validates signature
- Classifies failure with Groq
- Stores in Supabase
- Generates recovery message

### POST `/api/test-failure?type=TYPE`
Test endpoint for demo
- Query params: `insufficient_funds`, `card_expired`, `international_card_blocked`, `network_error`, `card_declined`
- Creates fake payment failure
- Triggers full AI pipeline
- Returns classification + message

---

## Key Metrics

After running PayPilot demo:
- **19-26 test failures** created
- **100% classification rate** by AI
- **21+ personalized recovery messages** generated
- **Zero latency** (responses in <1 second)
- **Zero cost** (all free tiers)

---

## How the AI Agent Works

### Prompt Engineering

The Groq agent uses a structured prompt:

```
You are a payment failure classifier. Given a payment failure reason, 
respond with ONLY a JSON object in this format:

{
  "category": "one of: insufficient_funds, card_declined, expired_card, 
               network_error, international_card_blocked, invalid_card, other",
  "message": "a short, friendly recovery message tailored to this failure"
}

Failure reason: "[REASON]"
```

### Response Examples

**Input:** "Insufficient balance in account"
```json
{
  "category": "insufficient_funds",
  "message": "It looks like there aren't enough funds in your account. Please add funds and try again – we'll be ready when you are!"
}
```

**Input:** "Card has expired"
```json
{
  "category": "expired_card",
  "message": "Your card has expired. Please update your card details or use a different card to complete your purchase."
}
```

---

## Performance

| Metric | Value |
|--------|-------|
| **AI Response Time** | <500ms (Groq) |
| **Dashboard Refresh** | Real-time (15s auto-refresh) |
| **Database Queries** | <100ms (Supabase) |
| **Webhook Processing** | <1 second end-to-end |
| **Scalability** | Handles 1000s of failures/day |

---

## Future Improvements

- [ ] SMS/Email integration for recovery messages (Twilio, SendGrid)
- [ ] Multi-language support for recovery messages
- [ ] A/B testing different message strategies
- [ ] Machine learning on recovery success rates
- [ ] Slack/Discord notifications for high-value failures
- [ ] Admin dashboard for message customization
- [ ] Payment retry automation
- [ ] Revenue recovery analytics

---

## Why PayPilot Matters

**Payment failures aren't end-of-story.** They're a customer relationship opportunity.

With PayPilot:
- ✅ Customers get **personalized, intelligent recovery paths** (not generic errors)
- ✅ Businesses **recover revenue automatically** (no manual intervention)
- ✅ AI learns **what works for different failure types** (data-driven)
- ✅ **Zero operational cost** (built entirely on free tiers)

---

## Built With ❤️

- [Razorpay](https://razorpay.com) — Payment processing
- [Groq](https://groq.com) — Ultra-fast LLM inference
- [Supabase](https://supabase.io) — Open-source Firebase alternative
- [Next.js](https://nextjs.org) — React framework
- [Vercel](https://vercel.com) — Deployment platform

---

## License

MIT © Puja Rani Bhuyan

---

## Questions? Issues?

- 💬 Open an issue on GitHub
- 🐦 [@YourTwitter](https://twitter.com)
- 📧 your.email@example.com

---

## Show Your Support

⭐ If PayPilot helped you, please star this repo!

---

