import React, { useState, useRef, useEffect } from 'react';
import { TRANSLATIONS, type Language } from '../utils/i18n';
import { playHospitalChime } from '../utils/audioAlert';
import { API_BASE_URL } from '../config/api';
import { Bot, User, Send, Sparkles, HelpCircle, ShieldAlert, RefreshCw, Mic, MicOff } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
}

interface AIChatbotProps {
  lang?: Language;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: t.botWelcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const voiceRecognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleVoiceInput = () => {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(lang === 'mr' ? 'या ब्राउझरमध्ये व्हॉईस इनपुट उपलब्ध नाही. कृपया Chrome वापरा.' : 'Voice recognition is not supported on this browser. Please use Chrome.');
      return;
    }

    if (isVoiceListening) {
      try {
        voiceRecognitionRef.current?.stop();
      } catch {}
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };
      recognition.onerror = () => setIsVoiceListening(false);
      recognition.onend = () => setIsVoiceListening(false);

      voiceRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsVoiceListening(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, lang })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEmergency: query.toLowerCase().includes('snake') || query.toLowerCase().includes('सर्प') || query.toLowerCase().includes('chest')
        };
        setMessages(prev => [...prev, botMsg]);
        playHospitalChime('CONFIRM');
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      // Local Offline Emergency Protocol Fallback
      setTimeout(() => {
        let fallbackReply = "";
        const q = query.toLowerCase();

        if (q.includes("snake") || q.includes("सर्प") || q.includes("साप")) {
          fallbackReply = lang === 'mr'
            ? "🐍 सर्पदंश प्रथमोपचार (ऑफलाइन मार्गदर्शक तत्त्वे):\n१. अवयव लाकडी पट्टीने (Splint) स्थिर करा, हालचाल पूर्णपणे थांबवा.\n२. दोरीने घट्ट आवळू नका (No Tourniquet) किंवा ब्लेडने कापू नका.\n३. तातडीने १०८ रुग्णवाहिकेतून प्राथमिक आरोग्य केंद्रात (PHC) हलवून १० कुप्या (Vials) Polyvalent ASV सलाईनमधून सुरू करा."
            : "🐍 Snakebite Emergency Protocol (Offline Fallback):\n1. Immobilize limb with a splint at heart level; keep patient completely at rest.\n2. Do NOT apply tourniquets or incisions.\n3. Immediately transport via 108 Ambulance to start 10 vials of Polyvalent ASV.";
        } else if (q.includes("ors") || q.includes("जुलाब") || q.includes("diarrhea")) {
          fallbackReply = lang === 'mr'
            ? "💧 जलसंजीवन (ORS) द्रावण:\n१. १ पाकीट WHO ORS १ लिटर स्वच्छ पाण्यात विरघळवावे.\n२. बालकांसाठी प्रत्येक जुलाबानंतर अर्धा कप, प्रौढांसाठी १ कप हळूहळू पाजावे.\n३. सोबत लहान मुलांना झिंक गोळी (२० मिग्रॅ) सलग १४ दिवस द्यावी."
            : "💧 Dehydration & ORS Guidelines:\n1. Mix 1 full sachet WHO ORS in exactly 1 Liter of clean boiled/cooled water.\n2. Give 100-200ml after each loose stool.\n3. Co-administer Zinc 20mg daily for 14 days in pediatric cases.";
        } else {
          fallbackReply = lang === 'mr'
            ? `🏥 आरोग्य साथी ऑफलाइन सहाय्यक:\n'${query}' या प्रश्नासाठी: रुग्णाचे प्राथमिक Vitals (SpO2, BP, नाडी) तपासा. रुग्ण अस्वस्थ असल्यास १०८ ला कॉल करा व जिल्हा डॉक्टरांशी संपर्क साधा.`
            : `🏥 Arogya Sathi Offline Assistant:\nRegarding '${query}': Monitor patient vitals immediately. If SpO2 < 92% or BP < 90, escalate to Code Red and mobilize 108 ALS Ambulance.`;
        }

        const botMsg: ChatMessage = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEmergency: q.includes('snake') || q.includes('सर्प')
        };
        setMessages(prev => [...prev, botMsg]);
        playHospitalChime('CONFIRM');
      }, 800);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { label: t.quick1, query: lang === 'mr' ? 'सर्पदंश तातडीचे प्रथमोपचार काय करावे?' : 'What are the emergency snakebite first-aid steps?' },
    { label: t.quick2, query: lang === 'mr' ? 'बालकांसाठी ORS पाण्याचे प्रमाण किती?' : 'What is the pediatric ORS dosage guide?' },
    { label: t.quick3, query: lang === 'mr' ? 'गरोदरपणात उच्च रक्तदाब असल्यास काय करावे?' : 'Management of high blood pressure in 32-week pregnancy?' },
    { label: t.quick4, query: lang === 'mr' ? 'छातीत दुखणे आणीबाणी ट्रायज चेकलिस्ट' : 'Emergency chest pain triage checklist?' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 pb-12 font-sans">
      {/* Formal Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-slate-800" /> {t.chatTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.chatDesc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Gemini & Offline Clinical AI
          </span>
        </div>
      </div>

      {/* Quick Clinical Prompts */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> {t.quickQuestions}:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log Container */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col h-[460px] overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              <div className={`max-w-[80%] rounded-xl p-3.5 text-xs shadow-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                  : msg.isEmergency
                  ? 'bg-red-50 text-red-950 border border-red-300 rounded-tl-none'
                  : 'bg-white text-slate-800 border border-slate-300 rounded-tl-none'
              }`}>
                {msg.isEmergency && (
                  <div className="flex items-center gap-1 text-red-700 font-black text-[11px] mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Emergency Clinical Protocol Active
                  </div>
                )}
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
              <span>{t.typing}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 text-slate-900"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isVoiceListening ? 'Stop Listening' : 'Voice Input (Marathi / Hindi / English)'}
              className={`p-2.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                isVoiceListening
                  ? 'bg-red-600 text-white border-red-700 animate-pulse ring-2 ring-red-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {isVoiceListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-slate-700" />}
            </button>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.sendChat}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
