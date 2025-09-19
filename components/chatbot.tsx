"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { alumniChatbot, type ChatMessage, type ChatbotResponse } from "@/lib/chatbot"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ChatbotProps {
  className?: string
}

export function Chatbot({ className }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize chatbot with welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your LegacyLink assistant. How can I help you today?",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])

    // Get user ID
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Stream from real AI API via server route
      const streamResp = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are LegacyLink assistant. Be concise and helpful.' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputValue.trim() }
          ]
        })
      })

      if (!streamResp.ok || !streamResp.body) throw new Error('Stream error')

      const reader = streamResp.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      // Push a placeholder assistant message we update as chunks arrive
      const baseId = (Date.now() + 1).toString()
      setMessages(prev => [...prev, { id: baseId, role: 'assistant', content: '', timestamp: new Date() } as any])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        assistantText += chunk
        setMessages(prev => prev.map(m => m.id === baseId ? { ...m, content: assistantText } : m))
      }
    } catch (error) {
      console.error('Error processing message:', error)
      toast.error('Failed to get response from chatbot')
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const handleActionClick = (action: any) => {
    if (action.type === 'navigate') {
      window.location.href = action.data.path
    }
  }

  const getQuickSuggestions = () => {
    return alumniChatbot.getQuickSuggestions()
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`glass-card border-border/50 shadow-xl transition-all duration-200 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">LegacyLink Assistant</CardTitle>
              </div>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>AI</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[400px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Suggestions */}
                        {message.metadata?.suggestions && (
                          <div className="mt-2 space-y-1">
                            {message.metadata.suggestions.map((suggestion: string, index: number) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 text-xs justify-start"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {message.metadata?.actions && (
                          <div className="mt-2 space-y-1">
                            {message.metadata.actions.map((action: any, index: number) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="h-auto p-1 text-xs"
                                onClick={() => handleActionClick(action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Suggestions */}
            {messages.length === 1 && (
              <div className="p-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-1">
                  {getQuickSuggestions().slice(0, 3).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

