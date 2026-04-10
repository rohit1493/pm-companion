export const INTERVIEW_ANGLES: Record<string, { question: string; tip: string }> = {
  'PM Career': {
    question: 'Tell me about a time you grew as a PM.',
    tip: 'Frame key takeaways as examples of PM maturity — prioritization, influence without authority, or stakeholder alignment.',
  },
  'Product Strategy': {
    question: 'Walk me through how you\'d prioritize a product roadmap.',
    tip: 'Connect the article\'s framework to a real product decision. Interviewers love concrete examples over theory.',
  },
  'Growth': {
    question: 'How have you driven growth on a product you owned?',
    tip: 'Use the concepts here to articulate a growth lever — acquisition, activation, retention, or referral.',
  },
  'Design & UX': {
    question: 'How do you advocate for users in product decisions?',
    tip: 'Tie UX insights to business outcomes. Show you balance user needs with company goals.',
  },
  'B2B/SaaS': {
    question: 'How do you handle enterprise customer feedback vs. product vision?',
    tip: 'B2B PMs are judged on navigating competing stakeholder needs — show that nuance.',
  },
  'AI': {
    question: 'How would you build a product feature using AI responsibly?',
    tip: 'Interviewers want PMs who understand AI\'s limits, not just its potential. Address trust and accuracy.',
  },
  'GTM': {
    question: 'Walk me through how you\'d launch a new feature.',
    tip: 'GTM is about sequencing: who hears it first, what\'s the narrative, how do you measure success.',
  },
  'Startups': {
    question: 'How do you decide what NOT to build?',
    tip: 'Startup PMs must say no constantly. Show judgment and ruthless focus over trying to do everything.',
  },
  'Analytics': {
    question: 'How do you measure the success of a product change?',
    tip: 'Pick one north-star metric and explain guardrail metrics. Avoid vague answers like "engagement".',
  },
  'Case Studies & Teardowns': {
    question: 'What would you have done differently as the PM here?',
    tip: 'Use teardowns to show product intuition. Critique with specifics — not "I would\'ve done better".',
  },
}

export function getInterviewAngle(topics: string[]): { question: string; tip: string } | null {
  for (const topic of topics) {
    if (INTERVIEW_ANGLES[topic]) return INTERVIEW_ANGLES[topic]
  }
  return null
}
