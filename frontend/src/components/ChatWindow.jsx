import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import Spinner from './Spinner'

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="chat-window">
      {messages.length === 0 && !loading && (
        <div className="empty-state">
          <span className="empty-state-sub">Welcome to the</span>
          <span className="empty-state-title">App</span>
        </div>
      )}
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} role={msg.role} content={msg.content} />
      ))}
      {loading && <Spinner />}
      <div ref={bottomRef} />
    </div>
  )
}
