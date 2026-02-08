import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Send, Bot, X, Copy, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  suggestions?: string[];
}

interface ConsultancyAssistantProps {
  projectData: {
    id: string;
    name: string;
    description: string;
    sector: string;
    structure: string;
    location: string;
    roadmapData: any[];
  };
  isLoading?: boolean;
}

const ConsultancyAssistant = ({ projectData, isLoading = false }: ConsultancyAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hello! I'm your AI Consultancy Assistant. I've analyzed your project "${projectData.name}" (${projectData.sector}, ${projectData.structure} in ${projectData.location}). I can help you with roadmap suggestions, compliance advice, and business strategy. How can I assist you today?`,
      sender: "ai",
      timestamp: new Date(),
      suggestions: [
        "Analyze my current roadmap and suggest improvements",
        "What are the best compliance practices for my sector?",
        "Suggest alternative business structures for my startup",
        "Help me understand timeline optimizations",
        "What other registrations or licenses do I need?"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [analyzingRoadmap, setAnalyzingRoadmap] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const suggestionQuestions = [
    "Should I consider ESOPs for early employees?",
    "What's the optimal timeline for fundraising?",
    "Which tax benefits can I leverage?",
    "How to structure founder agreements?",
    "What compliance risks should I watch for?"
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response (replace with actual Gemini API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(input),
        sender: "ai",
        timestamp: new Date(),
        suggestions: Math.random() > 0.5 ? suggestionQuestions.slice(0, 3) : undefined
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleAnalyzeRoadmap = async () => {
    setAnalyzingRoadmap(true);
    
    // Simulate roadmap analysis
    setTimeout(() => {
      const analysisMessage: Message = {
        id: Date.now().toString(),
        content: `Based on your ${projectData.roadmapData.length} roadmap categories and ${projectData.roadmapData.reduce((acc, cat) => acc + cat.tasks.length, 0)} tasks, I recommend:
        
1. **Priority Shift**: Consider moving "Tax Registration" before "Company Registration" to optimize timeline by ~15 days
2. **Missing Items**: Add "Data Protection Compliance" for ${projectData.sector} sector
3. **Cost Optimization**: Bundle similar compliance tasks to save approximately ₹8,000-12,000
4. **Risk Areas**: Your ${projectData.structure} structure may need additional shareholder agreements
        
Would you like me to generate an optimized roadmap?`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, analysisMessage]);
      setAnalyzingRoadmap(false);
    }, 2000);
  };

  const getAIResponse = (query: string): string => {
    const responses = [
      `Based on your ${projectData.structure} structure in ${projectData.location}, I recommend focusing on compliance timelines first. Most startups in your sector benefit from early-stage tax planning.`,
      `Your roadmap looks comprehensive! For ${projectData.sector}, consider adding intellectual property protection early in the process.`,
      `I notice you're using a ${projectData.structure}. Have you considered the compliance implications for fundraising? This might affect your timeline.`,
      `Based on similar successful startups in ${projectData.sector}, optimizing your compliance roadmap could save 20-30 days in launch time.`,
      `Your business DNA suggests you'd benefit from exploring R&D tax credits and startup recognition schemes available in ${projectData.location}.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Bot className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading consultancy assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Consultancy Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Gemini • Analyzing: {projectData.name}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeRoadmap}
            disabled={analyzingRoadmap}
          >
            {analyzingRoadmap ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Roadmap
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${
                      message.sender === "user"
                        ? "text-primary-foreground/60 hover:text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => handleCopyMessage(message.content)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                
                {message.suggestions && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm opacity-80 mb-2">Quick suggestions:</p>
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant={message.sender === "ai" ? "secondary" : "outline"}
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3 mb-2 hover:bg-accent"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-opacity-20">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.sender === "ai" && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-2xl p-4 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about compliance, business strategy, or roadmap optimization..."
            className="min-h-[60px] resize-none"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Prompts */}
        <div className="mt-3">
          <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestionQuestions.slice(0, 3).map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(question)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultancyAssistant;