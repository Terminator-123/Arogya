import React, { useState } from 'react';
import { Mic, MicOff, CheckCircle, Sparkles } from 'lucide-react';

interface VoiceNoteProps {
  onTranscribed: (text: string) => void;
  lang: 'en' | 'mr' | 'hi';
}

export const VoiceNoteRecorder: React.FC<VoiceNoteProps> = ({ onTranscribed, lang }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscript('');
      // Simulate live recording waveform
      setTimeout(() => {
        setIsRecording(false);
        setRecordedAudio(true);

        let sampleTranscript = '';
        if (lang === 'mr') {
          sampleTranscript = "रुग्णाला ३ दिवसांपासून तीव्र ताप, छातीत दुखणे आणि श्वास घेण्यास त्रास होत आहे. घरातील रस्ता कच्चा आहे.";
        } else if (lang === 'hi') {
          sampleTranscript = "मरीज को 3 दिनों से तेज बुखार, सीने में दर्द और सांस लेने में कठिनाई है। सड़क कच्ची है।";
        } else {
          sampleTranscript = "Patient presenting with acute chest pain, 3-day high fever, and severe dyspnea. Remote road access.";
        }

        setTranscript(sampleTranscript);
        onTranscribed(sampleTranscript);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-green-600" />
            {lang === 'mr' ? 'आशा सेविका व्हॉईस नोट (मराठी)' : lang === 'hi' ? 'वॉयस नोट (हिंदी)' : 'Frontline Regional Voice Note'}
          </span>
          <p className="text-[11px] text-slate-500">
            {lang === 'mr' ? 'बोलून नोंद करा - मराठीतून आपोआप भाषांतर' : 'Hands-free clinical recording with on-device NLP'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleRecord}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
            isRecording
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-green-700 hover:bg-green-800 text-white'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-3.5 h-3.5" /> Recording (Listening)...
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" /> {recordedAudio ? 'Record Again' : 'Record Audio Note'}
            </>
          )}
        </button>
      </div>

      {isRecording && (
        <div className="flex items-center justify-center gap-1.5 py-2">
          <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" />
          <span className="w-1.5 h-10 bg-red-600 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s]" />
          <span className="w-1.5 h-8 bg-red-600 rounded-full animate-bounce [animation-delay:0.45s]" />
          <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="text-xs text-red-600 font-semibold ml-2">Transcribing speech locally...</span>
        </div>
      )}

      {recordedAudio && transcript && (
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" /> On-Device Voice Transcribed:
            </span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">Marathi/Hindi NLP</span>
          </div>
          <p className="text-slate-800 font-medium italic">"{transcript}"</p>
          <div className="text-[11px] text-green-700 font-semibold flex items-center gap-1 pt-1 border-t">
            <Sparkles className="w-3 h-3 text-amber-500" /> Auto-attached to encrypted clinical outbox queue.
          </div>
        </div>
      )}
    </div>
  );
};
