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
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hey! I'm your document assistant. Upload some PDFs and I'll help you with questions about them! 📄", timestamp: Date.now() },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<Theme>('dark-ice');
  
  // RAG-related state
  const [ragEnabled, setRagEnabled] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState("");
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character and token counts
  const charCount = userMessage.length;
  const tokenCount = estimateTokens(userMessage);
  const isLongMessage = charCount > 1000;

  // Check document status on component mount
  useEffect(() => {
    checkDocumentStatus();
  }, []);

  // Check document status from backend
  const checkDocumentStatus = async () => {
    try {
      const response = await fetch('/api/documents/status');
      if (response.ok) {
        const data = await response.json();
        setHasDocuments(data.has_documents);
        setDocumentCount(data.document_count || 0);
      }
    } catch (error) {
      console.error('Error checking document status:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError("Only PDF files are supported for now! 📄");
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your OpenAI API key first! 🔑");
      return;
    }

    setIsUploadingFile(true);
    setError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      setUploadSuccess(`✅ ${data.message} (${data.chunks} chunks processed)`);
      setHasDocuments(true);
      setDocumentCount(data.chunks);
      
      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(""), 5000);
      
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document. Please try again! 🔄";
      setError(errorMessage);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Clear documents
  const clearDocuments = async () => {
    try {
      const response = await fetch('/api/documents/clear', {
        method: 'POST',
      });
      
      if (response.ok) {
        setHasDocuments(false);
        setDocumentCount(0);
        setRagEnabled(false);
        setUploadSuccess("📄 Documents cleared successfully!");
        setTimeout(() => setUploadSuccess(""), 3000);
      }
    } catch (error) {
      console.error('Error clearing documents:', error);
      setError("Failed to clear documents! 🔄");
    }
  };

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

  const handleSend = async () => {
    if (!userMessage.trim() || loading) return;

    const currentMessage = userMessage.trim();
    setUserMessage("");
    setError("");

    // Add user message
    const userMsg: Message = {
      role: "user",
      content: currentMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Add empty bot message that will be filled
    const botMsg: Message = {
      role: "bot",
      content: "",
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, botMsg]);

    // Scroll to bottom and increment unread count if not at bottom
    if (!checkIfAtBottom()) {
      setUnreadCount(prev => prev + 1);
    }

    try {
      const conversationMessages = [
        ...messages.map(msg => ({ role: msg.role === "bot" ? "assistant" : "user", content: msg.content })),
        { role: "user", content: currentMessage }
      ];

      const requestBody = {
        messages: conversationMessages,
        model: model,
        api_key: apiKey,
        use_rag: ragEnabled && hasDocuments
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to read response");
      }

      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Update the last message with the current response
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: fullResponse
            };
          }
          return newMessages;
        });
      }

      // Scroll to bottom after response
      setTimeout(() => scrollToBottom(), 100);

    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
      { role: "bot", content: "Hey! I'm your document assistant. Upload some PDFs and I'll help you with questions about them! 📄", timestamp: Date.now() },
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

          {/* RAG Section */}
          <div className={styles.ragSection}>
            <label className={styles.label}>
              📄 Document Knowledge
            </label>
            
            {/* Document Status */}
            <div className={styles.documentStatus}>
              {hasDocuments ? (
                <span className={styles.statusIndicator}>
                  ✅ {documentCount} document chunks loaded
                </span>
              ) : (
                <span className={styles.statusIndicator}>
                  📄 No documents uploaded
                </span>
              )}
            </div>

            {/* File Upload Area */}
            <div 
              className={styles.fileUploadArea}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <div className={styles.uploadContent}>
                {isUploadingFile ? (
                  <div className={styles.uploadingIndicator}>
                    <span className={styles.spinner}>⏳</span>
                    <span>Processing PDF...</span>
                  </div>
                ) : (
                  <>
                    <span className={styles.uploadIcon}>📎</span>
                    <span>Drop PDF here or click to browse</span>
                  </>
                )}
              </div>
            </div>

            {/* RAG Toggle */}
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={ragEnabled}
                onChange={(e) => setRagEnabled(e.target.checked)}
                disabled={!hasDocuments}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleText}>
                {ragEnabled ? "🧠 Document mode ON" : "💭 Chat mode only"}
              </span>
            </label>

            {/* Clear Documents Button */}
            {hasDocuments && (
              <button
                type="button"
                className={styles.clearDocsButton}
                onClick={clearDocuments}
                title="Clear all documents"
              >
                🗑️ Clear Documents
              </button>
            )}
          </div>

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
        {uploadSuccess && (
          <div className={styles.successMessage}>
            {uploadSuccess}
          </div>
        )}
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
                    <span className={styles.typing}>
                      {ragEnabled && hasDocuments ? "AI is searching documents..." : "AI is typing…"}
                    </span>
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
              {ragEnabled && hasDocuments && (
                <span className={styles.ragIndicator}>🧠 Document mode active</span>
              )}
            </label>
            <div className={styles.inputRow}>
              <div className={styles.textareaContainer}>
                <textarea
                  ref={inputRef}
                  className={styles.textarea}
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={ragEnabled && hasDocuments ? "Ask about your documents..." : "Type your message here..."}
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
