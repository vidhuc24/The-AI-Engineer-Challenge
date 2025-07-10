'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function PyPal() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeSystem = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key')
      return
    }

    try {
      const response = await fetch('http://localhost:8001/api/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      })

      if (response.ok) {
        setIsInitialized(true)
        setShowApiKeyInput(false)
        setMessages([{
          role: 'assistant',
          content: 'Hi! I\'m PyPal, your Python Programming Assistant! 🐍\n\nI have access to comprehensive Python documentation and I\'m here to help you with:\n\n• Python syntax and concepts\n• Code examples and explanations\n• Best practices and patterns\n• Debugging and troubleshooting\n\nWhat Python question can I help you with today?',
          timestamp: new Date()
        }])
      } else {
        const error = await response.text()
        alert(`Failed to initialize: ${error}`)
      }
    } catch (error) {
      alert(`Connection error: ${error}`)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isInitialized) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: input,
          api_key: apiKey,
          model: 'gpt-4o-mini'
        })
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        let assistantContent = ''

        const assistantMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            assistantContent += chunk

            setMessages(prev => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                ...assistantMessage,
                content: assistantContent
              }
              return newMessages
            })
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error}`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showApiKeyInput) {
        initializeSystem()
      } else {
        sendMessage()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🐍</div>
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">PyPal</h1>
              <p className="text-slate-400 text-sm">Python Programming Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-6 h-[calc(100vh-120px)] flex flex-col">
        
        {/* API Key Input */}
        {showApiKeyInput && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Initialize PyPal</h3>
            <p className="text-slate-300 mb-4">Enter your OpenAI API key to start chatting with PyPal</p>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={initializeSystem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Initialize
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="flex flex-col">
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'text-right' 
                    : 'text-left'
                }`}>
                  <div className={`font-semibold text-sm mb-1 ${
                    message.role === 'user' 
                      ? 'text-blue-400' 
                      : 'text-emerald-400'
                  }`}>
                    {message.role === 'user' ? 'You' : 'PyPal'}
                  </div>
                  <div className={`text-white whitespace-pre-wrap ${
                    message.role === 'user' 
                      ? 'font-medium' 
                      : 'leading-relaxed'
                  }`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-slate-500 italic mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="text-emerald-400 text-sm font-semibold mb-1">PyPal</div>
              <div className="text-slate-400">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {isInitialized && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about Python..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 resize-none focus:border-blue-500 focus:outline-none"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors self-end"
              >
                Send
              </button>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{input.length} characters</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
