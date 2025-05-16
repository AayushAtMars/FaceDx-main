import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use(request => {
  console.log('Starting Request:', { url: request.url, method: request.method, data: request.data });
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', { status: response.status, data: response.data });
    return response;
  },
  error => {
    console.log('Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

const SUGGESTION_PROMPTS = [
  "I'm feeling anxious today",
  'How can I manage stress?',
  'Tips for better sleep',
  'Ways to stay positive',
  'Help with depression',
  'Dealing with work pressure',
];

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      content:
        "Hi! I'm your mental health assistant. How can I help you today? Feel free to choose a topic below or type your own message.",
      sender: 'bot',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = () => {
    setIsOpen(true);
    if (window.innerWidth < 640) {
      setIsFullscreen(true);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsFullscreen(false);
  };

  const onBackdropClick = e => {
    if (e.target.id === 'chatbot-backdrop') {
      closeChat();
    }
  };

  const handleSuggestionClick = suggestion => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
    handleSendMessage(null, suggestion);
  };

  const resetChat = () => {
    setMessages([
      {
        content:
          "Hi! I'm your mental health assistant. How can I help you today? Feel free to choose a topic below or type your own message.",
        sender: 'bot',
      },
    ]);
    setShowSuggestions(true);
    setInputMessage('');
  };

  const handleSendMessage = async (e, suggestedMessage = null) => {
    if (e) e.preventDefault();
    const messageText = suggestedMessage || inputMessage.trim();
    if (!messageText) return;

    const userMessage = {
      content: messageText,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Add concise prompt instruction here
      const promptForBackend = `Please answer concisely and clearly in 2-3 sentences: ${messageText}`;

      const response = await api.post('/api/chatbot/chat', { message: promptForBackend });
      const botMessage = {
        content: response.data?.response || 'Sorry, I didn’t understand that.',
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { content: 'Sorry, I encountered an error. Please try again.', sender: 'bot', isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-5 right-5 z-[9999] bg-teal-600 text-white py-2 px-4 rounded-full shadow hover:bg-teal-700 transition-colors"
        >
          💬 Mental Health Assistant
        </button>
      )}

      {isOpen && (
        <>
          {isFullscreen && (
            <div
              id="chatbot-backdrop"
              onClick={onBackdropClick}
              className="fixed inset-0 bg-black bg-opacity-40 z-[9998]"
            />
          )}

          <div
            className={`
              fixed z-[9999] flex flex-col bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg shadow-lg overflow-hidden
              ${isFullscreen ? 'top-0 left-0 w-full h-full rounded-none' : 'bottom-20 right-5'}
              transition-all duration-300
              ${
                isFullscreen
                  ? ''
                  : 'w-[90vw] sm:w-[380px] md:w-[420px] lg:w-[480px] max-h-[90vh] h-[70vh]'
              }
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-teal-300">
              <div>
                <h3 className="text-lg font-semibold text-teal-900">Mental Health Assistant</h3>
                <p className="text-teal-700 text-sm">I'm here to support you</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleFullscreen}
                  className="text-teal-700 hover:text-teal-900 text-lg transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Go Fullscreen'}
                >
                  {isFullscreen ? '🗗' : '🗖'}
                </button>

                <button
                  onClick={resetChat}
                  className="text-teal-700 hover:text-teal-900 text-lg transition-colors"
                  title="Reset Chat"
                >
                  ↻
                </button>

                <button
                  onClick={closeChat}
                  className="text-teal-700 hover:text-red-500 text-xl font-bold transition-colors"
                  title="Close Chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-teal-400">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`
                    px-4 py-2 rounded-lg max-w-[80%] break-words
                    ${msg.sender === 'bot' ? 'bg-teal-300 text-teal-900 self-start' : 'bg-teal-600 text-white self-end'}
                    ${msg.isError ? 'bg-red-600 text-red-100' : ''}
                  `}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="flex space-x-1 items-center bg-teal-300 px-4 py-2 rounded self-start">
                  <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-75" />
                  <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-150" />
                  <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-300" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && (
              <div className="p-3 bg-teal-100 border-t border-teal-300 flex flex-wrap gap-2">
                {SUGGESTION_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(prompt)}
                    disabled={isLoading}
                    className="text-sm bg-teal-300 hover:bg-teal-400 px-3 py-1 rounded-full text-teal-900 transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="flex p-3 bg-teal-100 border-t border-teal-300"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-grow rounded-l-lg border border-teal-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-teal-600 text-white px-4 py-2 rounded-r-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default ChatBot;
