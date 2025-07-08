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

// API Key Entry Screen Component
function ApiKeyScreen({ onApiKeySubmit, error, theme, setTheme }: {
  onApiKeySubmit: (apiKey: string) => void;
  error: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    
    setIsValidating(true);
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    onApiKeySubmit(apiKey);
    setIsValidating(false);
  };

  return (
    <div className={`${styles.apiKeyScreen} ${styles[`theme-${theme}`]}`}>
      <div className={styles.apiKeyContainer}>
        {/* Top Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logoContainer}>
            <img 
              src="/my_logo.png" 
              alt="ChillGPT Logo" 
              className={styles.logo}
            />
            <h1 className={styles.logoTitle}>ChillGPT</h1>
            <p className={styles.subtitle}>Your AI-powered document assistant</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles.mainContent}>
          {/* Left Side - API Key Form */}
          <div className={styles.leftSide}>
            <form onSubmit={handleSubmit} className={styles.apiKeyForm}>
              <div className={styles.apiKeySection}>
                <label className={styles.apiKeyLabel}>
                  <span className={styles.apiKeyTitle}>🔑 Enter your OpenAI API Key</span>
                  <input
                    type="password"
                    className={styles.apiKeyInput}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    required
                    disabled={isValidating}
                  />
                  <span className={styles.apiKeyHint}>
                    Your API key is stored locally and never shared
                  </span>
                </label>
              </div>

              <div className={styles.themeSection}>
                <label className={styles.themeLabel}>
                  ✨ Choose your vibe
                  <select
                    className={styles.themeSelect}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as Theme)}
                    disabled={isValidating}
                  >
                    <option value="dark-ice">❄️ Dark Ice</option>
                    <option value="light-snow">☁️ Light Snow</option>
                    <option value="neon-ice">⚡ Neon Ice</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className={styles.continueButton}
                disabled={!apiKey.trim() || isValidating}
              >
                {isValidating ? (
                  <>
                    <span className={styles.spinner}>⏳</span>
                    Connecting...
                  </>
                ) : (
                  <>
                    Continue to Chat
                    <span className={styles.arrow}>→</span>
                  </>
                )}
              </button>
            </form>

            <FunnyError message={error} />
          </div>

          {/* Right Side - Feature Preview */}
          <div className={styles.rightSide}>
            <div className={styles.featurePreview}>
              <h3 className={styles.featureTitle}>What you can do:</h3>
              <ul className={styles.featureList}>
                <li>📄 Upload PDF documents</li>
                <li>🧠 Ask questions about your documents</li>
                <li>💬 Get intelligent, context-aware responses</li>
                <li>🎨 Enjoy beautiful markdown formatting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Chat Interface Component
function ChatInterface({ 
  apiKey, 
  onBack, 
  theme, 
  setTheme 
}: {
  apiKey: string;
  onBack: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hey! I'm your document assistant. Upload some PDFs and I'll help you with questions about them! 📄", timestamp: Date.now() },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // RAG-related state
  const [hasDocuments, setHasDocuments] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{filename: string, timestamp: number}>>([]);
  
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
        setDocumentCount(data.document_count);
        setUploadedDocuments(data.uploaded_documents || []);
      }
    } catch (error) {
      console.error('Error checking document status:', error);
    }
  };

  // Remove individual document
  const removeDocument = async (filename: string) => {
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setUploadSuccess(`✅ Removed ${filename}`);
        setTimeout(() => setUploadSuccess(""), 3000);
        await checkDocumentStatus();
      } else {
        setError(`Failed to remove ${filename}`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error removing document:', error);
      setError(`Error removing ${filename}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      setTimeout(() => setError(""), 3000);
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

      if (response.ok) {
        const result = await response.json();
        setUploadSuccess(`✅ Successfully uploaded ${file.name}`);
        setTimeout(() => setUploadSuccess(""), 3000);
        
        // Refresh document status
        await checkDocumentStatus();
      } else {
        const errorData = await response.json();
        setError(`Upload failed: ${errorData.detail || 'Unknown error'}`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error uploading file. Please try again.');
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Clear all documents
  const clearDocuments = async () => {
    try {
      const response = await fetch('/api/documents/clear', {
        method: 'POST',
      });
      
      if (response.ok) {
        setUploadSuccess('✅ All documents cleared');
        setTimeout(() => setUploadSuccess(""), 3000);
        await checkDocumentStatus();
      } else {
        setError('Failed to clear documents');
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error clearing documents:', error);
      setError('Error clearing documents');
      setTimeout(() => setError(""), 3000);
    }
  };

  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      return scrollHeight - scrollTop - clientHeight < 50;
    }
    return true;
  };

  // Handle scroll event
  const handleScroll = () => {
    const atBottom = checkIfAtBottom();
    if (atBottom !== isAtBottom) {
      setIsAtBottom(atBottom);
      if (atBottom) {
        setUnreadCount(0);
      }
    }
  };

  // Scroll to bottom of chat
  const scrollToBottom = (force = false) => {
    if (chatEndRef.current && (isAtBottom || force)) {
      chatEndRef.current.scrollIntoView({ 
        behavior: force ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    } else {
      // Increment unread count if not at bottom
      setUnreadCount(prev => prev + 1);
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [userMessage]);

  // Handle sending messages
  const handleSend = async () => {
    if (!userMessage.trim() || loading) return;
    
    setError("");
    setLoading(true);

    const newMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setUserMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model,
          api_key: apiKey,
          use_rag: hasDocuments, // Always use RAG when documents are available
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let botResponse = "";
      const botMessage: Message = {
        role: "bot",
        content: "",
        timestamp: Date.now(),
      };

      setMessages([...updatedMessages, botMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                botResponse += parsed.choices[0].delta.content;
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { ...botMessage, content: botResponse }
                ]);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Oops! Something went wrong. Please try again.");
      setMessages(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear chat messages
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
        <div className={styles.userInfo}>
          <span className={styles.apiKeyStatus}>🔑 Connected</span>
          <button 
            className={styles.changeApiKeyButton}
            onClick={onBack}
            title="Change API Key"
          >
            Change Key
          </button>
        </div>

        <FunnyError message={error} />
        {uploadSuccess && (
          <div className={styles.successMessage}>
            {uploadSuccess}
          </div>
        )}

        <form
          className={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          autoComplete="off"
        >
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

          {/* Document Assistant Section */}
          <div className={styles.ragSection}>
            <label className={styles.label}>
              📄 Document Assistant
            </label>
            
            {/* Document Status */}
            <div className={styles.documentStatus}>
              {hasDocuments ? (
                <span className={styles.statusIndicator}>
                  🧠 Document Assistant Mode - {documentCount} chunks ready
                </span>
              ) : (
                <span className={styles.statusIndicator}>
                  📄 Upload documents to activate assistant
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

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className={styles.documentsList}>
                <h4 className={styles.documentsListTitle}>Uploaded Documents:</h4>
                {uploadedDocuments.map((doc, index) => (
                  <div key={index} className={styles.documentItem}>
                    <span className={styles.documentName}>📄 {doc.filename}</span>
                    <button
                      type="button"
                      className={styles.removeDocButton}
                      onClick={() => removeDocument(doc.filename)}
                      title={`Remove ${doc.filename}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                      {hasDocuments ? "AI is searching documents..." : "AI is typing…"}
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
            </label>
            <div className={styles.inputRow}>
              <div className={styles.textareaContainer}>
                <textarea
                  ref={inputRef}
                  className={styles.textarea}
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={hasDocuments ? "Ask about your documents..." : "Type your message here..."}
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

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<Theme>('dark-ice');
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  const handleApiKeySubmit = (key: string) => {
    // Basic validation
    if (!key.startsWith('sk-') || key.length < 20) {
      setError("Please enter a valid OpenAI API key (starts with 'sk-')");
      return;
    }
    
    setApiKey(key);
    setIsApiKeySet(true);
    setError("");
  };

  const handleBack = () => {
    setIsApiKeySet(false);
    setApiKey("");
    setError("");
  };

  if (!isApiKeySet) {
    return (
      <ApiKeyScreen
        onApiKeySubmit={handleApiKeySubmit}
        error={error}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <ChatInterface
      apiKey={apiKey}
      onBack={handleBack}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
