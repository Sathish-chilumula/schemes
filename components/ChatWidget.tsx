'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  '🇮🇳 What schemes exist for farmers in India?',
  '🇬🇧 How do I apply for UK Universal Credit?',
  '🇺🇸 What is SNAP and who qualifies?',
  '💰 What benefits can I get for my family?',
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm **SchemeBot** — your AI guide to government benefits worldwide.\n\nTell me a bit about yourself (country, age, profession) and I'll find schemes you may qualify for!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Small delay for animation
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasNew(false);
    }
  }, [isOpen, messages]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: messageText },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ Sorry, I ran into an issue. Please try again in a moment.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Network error. Please check your connection and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (content: string) => {
    // Simple markdown-like rendering for bold
    return content
      .split('\n')
      .map((line, i) => {
        const rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: rendered }} />
            {i < content.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="chat-widget-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="chat-fab"
        aria-label="Open SchemeBot chat assistant"
        title="Chat with SchemeBot"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
          <div className="chat-ai-icon-wrapper">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="url(#botGradient)" fillOpacity="0.15"/>
              <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="7" y="10" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 13H9.01M15 13H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 8V10M10 6H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <defs>
                <linearGradient id="botGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white"/>
                  <stop offset="1" stopColor="white" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="chat-ai-glow"></div>
            {hasNew && <span className="chat-fab-badge" />}
          </div>
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`chat-panel ${isOpen ? 'chat-panel-open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-avatar">
            <span>🤖</span>
          </div>
          <div className="chat-header-info">
            <p className="chat-header-name">SchemeBot</p>
            <span className="chat-header-status">
              <span className="chat-status-dot" />
              AI-powered · Always online
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="chat-close-btn"
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages" id="chat-messages-container">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-message-row ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-bot'}`}
            >
              {msg.role === 'assistant' && (
                <div className="chat-bot-avatar">🤖</div>
              )}
              <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                {renderMessage(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message-row chat-message-bot">
              <div className="chat-bot-avatar">🤖</div>
              <div className="chat-bubble chat-bubble-bot">
                <div className="chat-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          {/* Show suggested questions after first bot message only */}
          {messages.length === 1 && !loading && (
            <div className="chat-suggestions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="chat-suggestion-btn"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            id="chat-input-field"
            type="text"
            placeholder="Ask about schemes, benefits..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="chat-input"
            maxLength={500}
            autoComplete="off"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="chat-send-btn"
            aria-label="Send message"
            id="chat-send-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <p className="chat-footer-note">
          Powered by Groq AI · SchemeAtlas
        </p>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="chat-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
