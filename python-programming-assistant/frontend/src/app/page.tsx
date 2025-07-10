'use client'

import { useState, useRef, useEffect } from 'react'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import 'highlight.js/styles/vs2015.css' // VS Code dark theme

// Register Python language
hljs.registerLanguage('python', python)

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
          content: 'Welcome to PyPal! 🐍\n\nI\'m your Python Programming Assistant with access to comprehensive Python documentation. I can help you with:\n\n• **Python Syntax & Concepts** - Variables, data types, control flow\n• **Code Examples** - Working snippets with explanations\n• **Best Practices** - Pythonic code patterns and conventions\n• **Debugging Help** - Common errors and how to fix them\n• **Standard Library** - Built-in modules and functions\n\nAsk me anything about Python programming!',
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

  // Enhanced message formatting with proper syntax highlighting
  const formatMessage = (content: string) => {
    // Replace code blocks with proper syntax highlighting
    const codeBlockRegex = /```(?:python)?\n?([\s\S]*?)```/g
    const inlineCodeRegex = /`([^`]+)`/g
    
    let formattedContent = content
      .replace(codeBlockRegex, (match, code) => {
        const highlightedCode = hljs.highlight(code.trim(), { language: 'python' }).value
        return `<div class="relative my-3">
          <div class="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
            <span class="text-xs text-gray-400 font-mono">Python</span>
            <button onclick="navigator.clipboard.writeText('${code.trim().replace(/'/g, "\\'")}')" class="text-xs text-gray-400 hover:text-white transition-colors">Copy</button>
          </div>
          <div class="bg-gray-900 p-4 overflow-x-auto">
            <pre class="text-sm leading-relaxed"><code class="font-mono">${highlightedCode}</code></pre>
          </div>
        </div>`
      })
      .replace(inlineCodeRegex, '<code class="bg-gray-800 text-emerald-300 px-2 py-1 rounded text-sm font-mono border border-gray-700">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>')
      .replace(/•/g, '<span class="text-emerald-400">•</span>')
      .replace(/\n/g, '<br>')

    return { __html: formattedContent }
  }

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl shadow-lg shadow-blue-500/25">
                <div className="text-2xl">🐍</div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 font-mono bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">PyPal</h1>
            <p className="text-gray-400 text-lg">Python Programming Assistant</p>
          </div>

          {/* Description Card */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400">✨</span>
              What PyPal Can Do
            </h2>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Answer Python syntax and concept questions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Provide code examples with explanations</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Help debug common Python errors</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Explain Python standard library functions</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                What PyPal Cannot Do
              </h3>
              <div className="text-sm text-gray-500">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Execute or run Python code</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Access external websites or APIs</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Help with non-Python programming languages</span>
                </div>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-blue-400">🔑</span>
              Get Started
            </h3>
            <p className="text-gray-300 mb-4 text-sm">Enter your OpenAI API key to begin chatting with PyPal</p>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                onClick={initializeSystem}
                disabled={!apiKey.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:shadow-none"
              >
                Initialize PyPal
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-2 rounded-lg shadow-lg shadow-blue-500/25">
              <div className="text-lg">🐍</div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-mono">PyPal</h1>
              <p className="text-gray-400 text-xs">Python Programming Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Connected</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <div className="text-xs">🐍</div>
                    </div>
                  )}
                  <div className={`text-xs font-medium ${
                    message.role === 'user' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {message.role === 'user' ? 'You' : 'PyPal'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div className={`rounded-lg p-4 shadow-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/20' 
                    : 'bg-gray-800 text-gray-100 border border-gray-700 shadow-gray-800/50'
                }`}>
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={formatMessage(message.content)}
                  />
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <div className="text-xs">🐍</div>
                </div>
                <div className="text-emerald-400 text-sm">PyPal is thinking...</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-800 p-4 shadow-lg">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask PyPal about Python programming..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                rows={2}
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {input.length}/1000
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] self-end shadow-lg disabled:shadow-none"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>Connected to PyPal backend</span>
          </div>
        </div>
      </div>
    </div>
  )
}
