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
}: {
  articleIds: string[]
  onComplete: (results: { articleIds: string[]; correct: number; total: number; articles: QuizArticle[] }) => void
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontFamily: "'DM Sans', sans-serif" }}>
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
                    background: i < idx ? '#4F46E5' : i === idx ? '#A5B4FC' : '#E2E8F0',
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
                  let bg = 'white'
                  let border = '1.5px solid #E2E8F0'
                  let color = '#1E293B'

                  if (quizState.phase === 'answer_correct' && opt === q.correct_answer) {
                    bg = '#F0FDF4'; border = '1.5px solid #86EFAC'; color = '#16A34A'
                  }
                  if (quizState.phase === 'answer_shown' && opt === q.correct_answer) {
                    bg = '#F0FDF4'; border = '1.5px solid #86EFAC'; color = '#16A34A'
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
                        fontFamily: "'DM Sans', sans-serif",
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
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#A5B4FC'
                          ;(e.currentTarget as HTMLButtonElement).style.background = '#FAFAFE'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (quizState.phase === 'question') {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'
                          ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
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
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#16A34A', fontFamily: "'DM Sans', sans-serif", marginBottom: '12px' }}>
                    ✓ Correct!
                  </p>
                  <button onClick={() => next(idx, correctCount)} style={primaryBtn}>
                    Next →
                  </button>
                </div>
              )}

              {quizState.phase === 'answer_wrong' && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626', fontFamily: "'DM Sans', sans-serif", marginBottom: '4px' }}>
                    Not quite.
                  </p>
                  <p style={{ fontSize: '13px', color: '#94A3B8', fontFamily: "'DM Sans', sans-serif", marginBottom: '12px' }}>
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
                  <p style={{ fontSize: '13px', color: '#64748B', fontFamily: "'DM Sans', sans-serif", marginBottom: '12px' }}>
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
      {quizState.phase === 'score' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '44px', marginBottom: '16px' }}>
            {quizState.correctCount >= quizState.totalCount * 0.75 ? '🎯' : '📚'}
          </div>
          <h2 style={headingStyle}>
            {quizState.correctCount}/{quizState.totalCount} correct
          </h2>
          <p style={{ ...bodyStyle, marginBottom: '28px' }}>
            {quizState.correctCount >= quizState.totalCount * 0.75
              ? 'Solid. Key insights are unlocked below.'
              : 'Good effort. Read the insights below to reinforce.'}
          </p>
          <button
            onClick={() => finishQuiz(quizState.correctCount)}
            disabled={submitting}
            style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Saving...' : 'See key insights →'}
          </button>
        </div>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '16px',
  padding: '28px 24px',
  marginBottom: '16px',
}

const headingStyle: React.CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: '22px',
  fontWeight: 400,
  color: '#1E293B',
  marginBottom: '12px',
  lineHeight: 1.3,
}

const bodyStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
  color: '#64748B',
  lineHeight: 1.5,
}

const mutedStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12px',
  color: '#94A3B8',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 28px',
  background: '#4F46E5',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '15px',
  fontWeight: 500,
  cursor: 'pointer',
  outline: 'none',
  transition: 'background 150ms ease',
}
