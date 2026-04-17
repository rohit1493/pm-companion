'use client'

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        e.currentTarget.style.position = 'fixed'
        e.currentTarget.style.top = '8px'
        e.currentTarget.style.left = '8px'
        e.currentTarget.style.width = 'auto'
        e.currentTarget.style.height = 'auto'
        e.currentTarget.style.padding = '8px 16px'
        e.currentTarget.style.background = '#ff6b35'
        e.currentTarget.style.color = 'white'
        e.currentTarget.style.zIndex = '9999'
        e.currentTarget.style.borderRadius = '8px'
        e.currentTarget.style.fontFamily = 'Inter, sans-serif'
        e.currentTarget.style.fontSize = '14px'
        e.currentTarget.style.fontWeight = '600'
      }}
      onBlur={(e) => {
        e.currentTarget.style.position = 'absolute'
        e.currentTarget.style.left = '-9999px'
        e.currentTarget.style.width = '1px'
        e.currentTarget.style.height = '1px'
      }}
    >
      Skip to main content
    </a>
  )
}
