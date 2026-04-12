'use client'

import { useState, useEffect } from 'react'

type Question = {
  id: string
  article_id: string
  article_title: string
  question: string
  correct_answer: string
  options: string[]
}

type QuizArticle = {
  id: string
  title: string
  key_insight: string | null
}

type QuizState =
  | { phase: 'intro' }
  | { phase: 'question'; index: number; retake: boolean }
  | { phase: 'answer_correct'; index: number }
  | { phase: 'answer_wrong'; index: number; firstTry: boolean }
  | { phase: 'answer_shown'; index: number }
  | { phase: 'score'; correctCount: number; totalCount: number }

export default function QuizCard({
  articleIds,
  onComplete,
  onReRead,
}: {
  articleIds: string[]
  onComplete: (results: { articleIds: string[]; correct: number; total: number; articles: QuizArticle[] }) => void
  onReRead?: () => void
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [articles, setArticles] = useState<QuizArticle[]>([])
  const [quizState, setQuizState] = useState<QuizState>({ phase: 'intro' })
  const [correctCount, setCorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/quiz?article_ids=${articleIds.join(',')}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load quiz')
        return r.json()
      })
      .then((data) => {
        setQuestions(data.questions || [])
        setArticles(data.articles || [])
        setLoading(false)
      })
      .catch(() => {
        setFetchError(true)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleIds.join(',')])

  async function finishQuiz(finalCorrect: number) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_ids: articleIds,
          total_questions: questions.length,
          correct_answers: finalCorrect,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
    } catch {
      setSubmitting(false)
      setFetchError(true)
      return
    }

    setSubmitting(false)
    onComplete({
      articleIds,
      correct: finalCorrect,
      total: questions.length,
      articles,
    })
  }

  function handleAnswer(selected: string) {
    if (quizState.phase !== 'question') return
    const { index, retake } = quizState
    const q = questions[index]
    const isCorrect = selected === q.correct_answer

    if (isCorrect) {
      const newCorrect = correctCount + 1
      setCorrectCount(newCorrect)
      setQuizState({ phase: 'answer_correct', index })
    } else if (!retake) {
      // First wrong — offer retake
      setQuizState({ phase: 'answer_wrong', index, firstTry: true })
    } else {
      // Second wrong — show answer
      setQuizState({ phase: 'answer_shown', index })
    }
  }

  function next(from: number, newCorrect: number) {
    const nextIndex = from + 1
    if (nextIndex >= questions.length) {
      setQuizState({ phase: 'score', correctCount: newCorrect, totalCount: questions.length })
    } else {
      setQuizState({ phase: 'question', index: nextIndex, retake: false })
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7685', fontFamily: "'Inter', sans-serif" }}>
          Loading quiz...
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ ...bodyStyle, fontWeight: 500, color: '#DC2626', marginBottom: '8px' }}>
            Couldn&apos;t load quiz
          </p>
          <p style={{ ...mutedStyle, marginBottom: '20px' }}>
            Check your connection and try again.
          </p>
          <button
            onClick={() => {
              setFetchError(false)
              setLoading(true)
              fetch(`/api/quiz?article_ids=${articleIds.join(',')}`)
                .then((r) => {
                  if (!r.ok) throw new Error('Failed to load quiz')
                  return r.json()
                })
                .then((data) => {
                  setQuestions(data.questions || [])
                  setArticles(data.articles || [])
                  setLoading(false)
                })
                .catch(() => {
                  setFetchError(true)
                  setLoading(false)
                })
            }}
            style={primaryBtn}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    // No questions seeded — skip quiz silently
    finishQuiz(0)
    return null
  }

  return (
    <div style={containerStyle}>

      {/* INTRO */}
      {quizState.phase === 'intro' && (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <div style={{ fontSize: '44px', marginBottom: '20px' }}>⚡</div>
          <h2 style={headingStyle}>Quick check.</h2>
          <p style={{ ...bodyStyle, marginBottom: '8px' }}>
            {articleIds.length} articles · {questions.length} questions · ~2 minutes
          </p>
          <p style={{ ...mutedStyle, marginBottom: '32px' }}>
            Retakes allowed. No pressure.
          </p>
          <button
            onClick={() => setQuizState({ phase: 'question', index: 0, retake: false })}
            style={primaryBtn}
          >
            Let&apos;s go →
          </button>
        </div>
      )}

      {/* QUESTION */}
      {(quizState.phase === 'question' || quizState.phase === 'answer_correct' || quizState.phase === 'answer_wrong' || quizState.phase === 'answer_shown') && (
        () => {
          const idx = (quizState as { index: number }).index
          const q = questions[idx]
          return (
            <div>
              {/* Progress */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: '3px',
                    borderRadius: '99px',
                    background: i < idx ? '#ff6b35' : i === idx ? '#ffb89a' : '#2a3340',
                  }} />
                ))}
              </div>

              <p style={{ ...mutedStyle, marginBottom: '8px' }}>
                From: {q.article_title.length > 50 ? q.article_title.slice(0, 50) + '…' : q.article_title}
              </p>

              <p style={{ ...headingStyle, fontSize: '17px', marginBottom: '24px', textAlign: 'left' }}>
                {q.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map((opt) => {
                  let bg = '#161e28'
                  let border = '1.5px solid #2a3340'
                  let color = '#f6fafe'

                  if (quizState.phase === 'answer_correct' && opt === q.correct_answer) {
                    bg = 'rgba(74,222,128,0.1)'; border = '1.5px solid rgba(74,222,128,0.3)'; color = '#4ade80'
                  }
                  if (quizState.phase === 'answer_shown' && opt === q.correct_answer) {
                    bg = 'rgba(74,222,128,0.1)'; border = '1.5px solid rgba(74,222,128,0.3)'; color = '#4ade80'
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={quizState.phase !== 'question'}
                      style={{
                        padding: '14px 16px',
                        background: bg,
                        border,
                        borderRadius: '10px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        color,
                        cursor: quizState.phase === 'question' ? 'pointer' : 'default',
                        textAlign: 'left',
                        outline: 'none',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (quizState.phase === 'question') {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#ff6b35'
                          ;(e.currentTarget as HTMLButtonElement).style.background = '#1a2332'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (quizState.phase === 'question') {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a3340'
                          ;(e.currentTarget as HTMLButtonElement).style.background = '#161e28'
                        }
                      }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

              {/* Feedback */}
              {quizState.phase === 'answer_correct' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#4ade80', fontFamily: "'Inter', sans-serif", marginBottom: '12px' }}>
                    ✓ Correct!
                  </p>
                  <button onClick={() => next(idx, correctCount)} style={primaryBtn}>
                    Next →
                  </button>
                </div>
              )}

              {quizState.phase === 'answer_wrong' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626', fontFamily: "'Inter', sans-serif", marginBottom: '4px' }}>
                    Not quite.
                  </p>
                  <p style={{ fontSize: '13px', color: '#6b7685', fontFamily: "'Inter', sans-serif", marginBottom: '12px' }}>
                    Try again?
                  </p>
                  <button
                    onClick={() => setQuizState({ phase: 'question', index: idx, retake: true })}
                    style={{ ...primaryBtn, background: '#EF4444' }}
                  >
                    Retry →
                  </button>
                </div>
              )}

              {quizState.phase === 'answer_shown' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#8b96a5', fontFamily: "'Inter', sans-serif", marginBottom: '12px' }}>
                    The correct answer is highlighted above.
                  </p>
                  <button onClick={() => next(idx, correctCount)} style={primaryBtn}>
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )
        }
      )()}

      {/* SCORE */}
      {quizState.phase === 'score' && (() => {
        const { correctCount: cc, totalCount: tc } = quizState
        const pct = tc > 0 ? cc / tc : 0
        const stars = Math.round(pct * 4)
        const starDisplay = '★'.repeat(stars) + '☆'.repeat(4 - stars)
        const isLow = pct <= 0.25

        let emoji = '🎯'
        let copy = 'Sharp. Key insights unlocked below.'
        if (pct < 0.75 && pct > 0.25) { emoji = '📚'; copy = 'Good effort. Read the insights to reinforce.' }
        if (isLow) { emoji = '😅'; copy = 'You may want to re-read before continuing.' }

        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>{emoji}</div>
            <div style={{
              fontSize: '22px',
              letterSpacing: '4px',
              color: pct >= 0.75 ? '#F59E0B' : pct > 0.25 ? '#6b7685' : '#2a3340',
              marginBottom: '12px',
            }}>
              {starDisplay}
            </div>
            <h2 style={headingStyle}>{cc}/{tc} correct</h2>
            <p style={{ ...bodyStyle, marginBottom: '28px' }}>{copy}</p>

            {isLow && onReRead ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={onReRead}
                  style={{ ...primaryBtn, background: '#f6fafe', color: '#0b0f14' }}
                >
                  Re-read the articles →
                </button>
                <button
                  onClick={() => finishQuiz(cc)}
                  disabled={submitting}
                  style={{
                    ...primaryBtn,
                    background: 'none',
                    color: '#6b7685',
                    border: '1px solid #2a3340',
                    opacity: submitting ? 0.7 : 1,
                    fontSize: '13px',
                    padding: '12px 24px',
                  }}
                >
                  {submitting ? 'Saving...' : 'Continue anyway'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => finishQuiz(cc)}
                disabled={submitting}
                style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Saving...' : 'See key insights →'}
              </button>
            )}
          </div>
        )
      })()}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  background: '#121821',
  border: '1px solid #2a3340',
  borderRadius: '16px',
  padding: '28px 24px',
  marginBottom: '16px',
}

const headingStyle: React.CSSProperties = {
  fontFamily: "'Manrope', sans-serif",
  fontSize: '22px',
  fontWeight: 400,
  color: '#f6fafe',
  marginBottom: '12px',
  lineHeight: 1.3,
}

const bodyStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  color: '#8b96a5',
  lineHeight: 1.5,
}

const mutedStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '12px',
  color: '#6b7685',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 28px',
  background: '#ff6b35',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontFamily: "'Inter', sans-serif",
  fontSize: '15px',
  fontWeight: 500,
  cursor: 'pointer',
  outline: 'none',
  transition: 'background 150ms ease',
}
