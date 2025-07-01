"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import styles from "./page.module.css";

// Helper function to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Message type with timestamp
interface Message {
  role: string;
  content: string;
  timestamp: number;
}

// Theme types
type Theme = 'dark-ice' | 'light-snow' | 'neon-ice';

// System prompt presets
const SYSTEM_PROMPTS = {
  'default': '',
  'coding-assistant': 'You are an expert programming assistant. Provide clear, well-commented code examples and explain complex concepts simply.',
  'creative-writer': 'You are a creative writing assistant. Help with storytelling, character development, and writing techniques.',
  'data-analyst': 'You are a data analysis expert. Help interpret data, suggest visualizations, and explain statistical concepts.',
  'teacher': 'You are a patient, encouraging teacher. Break down complex topics into easy-to-understand steps.',
  'business-advisor': 'You are a business consultant. Provide strategic advice, market insights, and practical business solutions.',
  'researcher': 'You are a thorough researcher. Provide well-sourced information and multiple perspectives on topics.'
};

function MessageContent({ content, isBot, theme }: { content: string; isBot: boolean; theme: Theme }) {
  if (!isBot) {
    return <span>{content}</span>;
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Extract code content more reliably
  const extractCodeContent = (element: React.ReactNode): string => {
    if (typeof element === 'string') return element;
    if (element && typeof element === 'object' && 'props' in element) {
      const elementWithProps = element as { props?: { children?: React.ReactNode } };
      if (elementWithProps.props?.children) {
        if (Array.isArray(elementWithProps.props.children)) {
          return elementWithProps.props.children.map((child: React.ReactNode) => extractCodeContent(child)).join('');
        }
        return extractCodeContent(elementWithProps.props.children);
      }
    }
    return '';
  };

  return (
    <div className={`${styles.markdownContent} ${styles[`theme-${theme}`]}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className={styles.mdH1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.mdH2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.mdH3}>{children}</h3>,
          p: ({ children }) => <p className={styles.mdParagraph}>{children}</p>,
          strong: ({ children }) => <strong className={styles.mdBold}>{children}</strong>,
          em: ({ children }) => <em className={styles.mdItalic}>{children}</em>,
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className={styles.mdInlineCode}>{children}</code>
            ) : (
              <code className={`${styles.mdCodeBlock} ${className}`}>{children}</code>
            );
          },
          pre: ({ children }) => {
            const codeContent = extractCodeContent(children);
            const lines = codeContent.split('\n');
            
            return (
              <div className={styles.codeBlockContainer}>
                <div className={styles.codeHeader}>
                  <span className={styles.codeLanguage}>Code</span>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(codeContent)}
                    title="Copy code"
                  >
                    Copy
                  </button>
                </div>
                <pre className={styles.mdPreBlock}>
                  <div className={styles.codeWithLineNumbers}>
                    <div className={styles.lineNumbers}>
                      {lines.map((_, index) => (
                        <span key={index} className={styles.lineNumber}>
                          {index + 1}
                        </span>
                      ))}
                    </div>
                    <div className={styles.codeContent}>
                      {children}
                    </div>
                  </div>
                </pre>
              </div>
            );
          },
          ul: ({ children }) => <ul className={styles.mdList}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.mdOrderedList}>{children}</ol>,
          li: ({ children }) => <li className={styles.mdListItem}>{children}</li>,
          blockquote: ({ children }) => <blockquote className={styles.mdBlockquote}>{children}</blockquote>,
          a: ({ children, href }) => (
            <a href={href} className={styles.mdLink} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function FunnyError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className={styles.error}>
      <span role="img" aria-label="Oops">😅</span> {message}
    </div>
  );
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [developerMessage, setDeveloperMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hey, what's up?", timestamp: Date.now() },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<Theme>('dark-ice');
  const [selectedPrompt, setSelectedPrompt] = useState('default');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Character and token counts
  const charCount = userMessage.length;
  const tokenCount = estimateTokens(userMessage);
  const isLongMessage = charCount > 1000;

  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (!chatContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 50;
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll events
  const handleScroll = () => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    
    if (atBottom) {
      setUnreadCount(0);
    }
  };

  // Smart scroll to bottom
  const scrollToBottom = (force = false) => {
    if (force || isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  };

  // Auto-scroll effect for new messages - Fix unread count logic
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(true);
    } else {
      // Only increment count for actual new bot messages with content
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "bot" && lastMessage.content.trim() && !loading) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isAtBottom, loading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [userMessage]);

  // Handle preset selection
  const handlePresetChange = (preset: string) => {
    setSelectedPrompt(preset);
    setDeveloperMessage(SYSTEM_PROMPTS[preset as keyof typeof SYSTEM_PROMPTS]);
  };

  const handleSend = async () => {
    setError("");
    if (!userMessage.trim()) return;
    if (!apiKey) {
      setError("You forgot your API key! (Don't worry, I won't tell anyone.)");
      return;
    }
    
    const currentUserMessage = userMessage;
    setUserMessage("");
    setLoading(true);
    
    const newUserMessage: Message = { role: "user", content: currentUserMessage, timestamp: Date.now() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    try {
      const conversationHistory = updatedMessages.map(msg => ({
        role: msg.role === "bot" ? "assistant" : msg.role,
        content: msg.content
      }));
      
      const messagesToSend = [];
      if (developerMessage.trim()) {
        messagesToSend.push({ role: "system", content: developerMessage });
      }
      messagesToSend.push(...conversationHistory);
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          model,
          api_key: apiKey,
        }),
      });
      
      if (!res.body) throw new Error("No response body. The AI is being shy.");
      
      let botMsg = "";
      const reader = res.body.getReader();
      
      setMessages(prev => [...prev, { role: "bot", content: "", timestamp: Date.now() }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        botMsg += chunk;
        
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex] && newMessages[lastIndex].role === "bot") {
            newMessages[lastIndex] = { role: "bot", content: botMsg, timestamp: newMessages[lastIndex].timestamp };
          }
          return newMessages;
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      setError(
        errorMessage ||
          "Something went wrong! Maybe the AI is on a coffee break? ☕️"
      );
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === "bot" && !newMessages[newMessages.length - 1]?.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add clear chat function
  const clearChat = () => {
    setMessages([
      { role: "bot", content: "Hey, what's up?", timestamp: Date.now() },
    ]);
    setUnreadCount(0);
    setError("");
    setUserMessage("");
  };

  return (
    <div className={`${styles.chatPage} ${styles[`theme-${theme}`]}`}>
      <div className={styles.leftPanel}>
        <form
          className={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          autoComplete="off"
        >
          <label className={styles.label}>
            API 🔑
            <input
              type="password"
              className={styles.input}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              required
            />
          </label>
          
          <label className={styles.label}>
            ✨ What&apos;s your vibe?
            <select
              className={styles.input}
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              <option value="dark-ice">❄️ Dark Ice</option>
              <option value="light-snow">☁️ Light Snow</option>
              <option value="neon-ice">⚡ Neon Ice</option>
            </select>
          </label>

          <label className={styles.label}>
            🎭 Personality Preset
            <select
              className={styles.input}
              value={selectedPrompt}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="default">Custom</option>
              <option value="coding-assistant">👨‍💻 Coding Assistant</option>
              <option value="creative-writer">✍️ Creative Writer</option>
              <option value="data-analyst">📊 Data Analyst</option>
              <option value="teacher">🎓 Teacher</option>
              <option value="business-advisor">💼 Business Advisor</option>
              <option value="researcher">🔬 Researcher</option>
            </select>
          </label>

          <label className={styles.label}>
            🎭 Bot Personality
            <input
              className={styles.input}
              value={developerMessage}
              onChange={(e) => {
                setDeveloperMessage(e.target.value);
                setSelectedPrompt('default');
              }}
              placeholder="Set how your AI should behave..."
            />
          </label>
          
          <label className={styles.label}>
            🤖 AI Brain
            <select
              className={styles.input}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              <option value="gpt-4.1-nano">gpt-4.1-nano</option>
            </select>
          </label>

          <button
            type="button"
            className={styles.clearButton}
            onClick={clearChat}
            title="Clear conversation"
          >
            🗑️ Clear Chat
          </button>
        </form>
        
        <div className={styles.logoContainer}>
          <img 
            src="/my_logo.png" 
            alt="ChillGPT Logo" 
            className={styles.logo}
          />
          <h1 className={styles.logoTitle}>ChillGPT</h1>
        </div>
        
        <FunnyError message={error} />
      </div>
      
      <div className={styles.rightPanel}>
        <div className={styles.conversationArea}>
          <div className={styles.chatContainerWrapper}>
            <div 
              ref={chatContainerRef}
              className={styles.chatContainer}
              onScroll={handleScroll}
            >
              {messages.map((msg, i) => (
                <div key={i} className={styles.messageWrapper}>
                  <div
                    className={
                      msg.role === "bot"
                        ? styles.botMessage
                        : styles.userMessage
                    }
                    style={{
                      animation: "fadeIn 0.5s",
                    }}
                  >
                    <MessageContent content={msg.content} isBot={msg.role === "bot"} theme={theme} />
                  </div>
                  <div className={styles.timestamp}>
                    {formatRelativeTime(msg.timestamp)}
                  </div>
                </div>
              ))}
              {loading && (
                <div className={styles.messageWrapper}>
                  <div className={styles.botMessage} style={{ opacity: 0.7 }}>
                    <span className={styles.typing}>AI is typing…</span>
                  </div>
                  <div className={styles.timestamp}>
                    now
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {!isAtBottom && (
              <button
                className={styles.scrollToBottomButton}
                onClick={() => scrollToBottom(true)}
                title="Scroll to bottom"
              >
                <span className={styles.scrollIcon}>↓</span>
                {unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{unreadCount}</span>
                )}
              </button>
            )}
          </div>
          
          <div className={styles.userInputArea}>
            <label className={styles.label}>
              💬 Say Something...
            </label>
            <div className={styles.inputRow}>
              <div className={styles.textareaContainer}>
                <textarea
                  ref={inputRef}
                  className={styles.textarea}
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  rows={2}
                  required
                />
                <div className={styles.counterContainer}>
                  <span className={`${styles.counter} ${isLongMessage ? styles.counterWarning : ''}`}>
                    {charCount} chars • ~{tokenCount} tokens
                  </span>
                </div>
              </div>
              <button
                className={styles.compactSendButton}
                onClick={handleSend}
                disabled={loading}
                type="button"
              >
                <img src="/send_button.png" alt="Send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
