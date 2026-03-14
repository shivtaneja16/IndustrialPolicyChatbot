import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function generateSessionId() {
  return "session_" + Math.random().toString(36).slice(2) + Date.now();
}

function getSessionId() {
  const existing = localStorage.getItem("rag_session_id");
  if (existing) return existing;
  const newId = generateSessionId();
  localStorage.setItem("rag_session_id", newId);
  return newId;
}

const sessionId = getSessionId();

// Map backend history ({role, content}) → display messages ({text, sender})
function toDisplayMessages(history) {
  return history.map((m) => ({
    text: m.content,
    sender: m.role === "human" ? "user" : "bot",
  }));
}

export default function ChatbotUI() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isTyping) return;

    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, session_id: sessionId }),
      });
      if (!res.ok) {
        let detail = `Server error (${res.status})`;
        try {
          const err = await res.json();
          detail = err.detail || detail;
        } catch { /* response was not JSON (e.g. proxy/network error) */ }
        throw new Error(detail);
      }
      const data = await res.json();
      setMessages(toDisplayMessages(data.history));
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  }

  async function handleReset() {
    try {
      await fetch(`/history/${sessionId}`, { method: "DELETE" });
      setMessages([]);
      setInput("");
      setError(null);
    } catch {
      setError("Failed to clear history.");
    }
  }

  return (
    <div className="flex flex-col h-screen text-white bg-gray-900 relative overflow-hidden">
      {/* Welcome screen */}
      <AnimatePresence>
        {messages.length === 0 && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col justify-center items-center text-center text-white z-0 pointer-events-none"
          >
            <p className="text-5xl font-semibold leading-tight">Welcome to the</p>
            <p className="text-6xl font-bold mt-2">Industrial Policy Chatbot</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div className="flex-grow overflow-y-auto px-6 pt-6 pb-28 space-y-4 z-0">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                w-fit px-4 py-2.5 text-sm leading-relaxed shadow-lg
                ${msg.sender === "user"
                  ? "max-w-[65%] bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-2xl rounded-tr-sm"
                  : "max-w-[78%] bg-gray-800 border border-gray-700/60 text-gray-200 rounded-2xl rounded-tl-sm"
                }
              `}
            >
              {msg.sender === "user" ? (
                msg.text
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p:          ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    h1:         ({ children }) => <h1 className="text-lg font-bold mb-2 mt-1 text-white">{children}</h1>,
                    h2:         ({ children }) => <h2 className="text-base font-semibold mb-2 mt-1 text-white">{children}</h2>,
                    h3:         ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1 text-white">{children}</h3>,
                    ul:         ({ children }) => <ul className="list-disc list-outside pl-4 mb-2 space-y-1">{children}</ul>,
                    ol:         ({ children }) => <ol className="list-decimal list-outside pl-4 mb-2 space-y-1">{children}</ol>,
                    li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
                    code:       ({ inline, children }) => inline
                      ? <code className="bg-gray-900 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                      : <code className="block bg-gray-900 text-emerald-400 p-3 rounded-xl text-xs font-mono overflow-x-auto mb-2 border border-gray-700">{children}</code>,
                    pre:        ({ children }) => <pre className="mb-2">{children}</pre>,
                    strong:     ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em:         ({ children }) => <em className="italic text-gray-300">{children}</em>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-500 pl-3 italic text-gray-400 mb-2">{children}</blockquote>,
                    a:          ({ href, children }) => <a href={href} className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors" target="_blank" rel="noreferrer">{children}</a>,
                    table:      ({ children }) => <div className="overflow-x-auto mb-2"><table className="w-full text-xs border-collapse">{children}</table></div>,
                    th:         ({ children }) => <th className="border border-gray-600 px-3 py-1.5 bg-gray-700/80 font-semibold text-left text-gray-200">{children}</th>,
                    td:         ({ children }) => <td className="border border-gray-600 px-3 py-1.5 text-gray-300">{children}</td>,
                    hr:         () => <hr className="border-gray-600 my-2" />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="bg-gray-800 text-gray-300 px-4 py-2 rounded-2xl w-fit"
          >
            <span className="inline-flex space-x-1">
              <span className="animate-bounce delay-0">•</span>
              <span className="animate-bounce delay-150">•</span>
              <span className="animate-bounce delay-300">•</span>
            </span>
          </motion.div>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center py-2">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="absolute bottom-6 w-full flex justify-center z-10">
        <div className="flex items-center justify-between border border-gray-700 bg-gray-900 rounded-2xl px-3 py-2 w-[80%] shadow-lg shadow-gray-800/50">
          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 hover:opacity-80 transition flex-shrink-0"
            title="Clear history"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>

          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            disabled={isTyping}
            className="flex-grow mx-3 bg-gray-800 text-white placeholder-gray-400 outline-none text-lg px-3 py-2 rounded-lg focus:bg-gray-800 focus:ring-2 focus:ring-gray-600 transition-all duration-150 z-10 disabled:opacity-50"
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 hover:opacity-80 transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
