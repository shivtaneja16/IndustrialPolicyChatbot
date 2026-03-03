export default function MessageBubble({ role, content }) {
  const isUser = role === 'human'
  return (
    <div className={`bubble-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      <div className={`bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
        <span className="bubble-label">{isUser ? 'You' : 'Assistant'}</span>
        <p className="bubble-content">{content}</p>
      </div>
    </div>
  )
}
