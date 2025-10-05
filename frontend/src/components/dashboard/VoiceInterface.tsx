import React, { useState, useEffect, useRef } from 'react';

interface VoiceInterfaceProps {
  onVoiceCommand: (command: string) => void;
  colors: Record<string, string>;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onVoiceCommand,
  colors
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(confidence);
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          onVoiceCommand(finalTranscript);
          speakResponse(`Processing: ${finalTranscript}`);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onVoiceCommand]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Use a more natural voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleQuickCommand = (command: string) => {
    onVoiceCommand(command);
    speakResponse(`Executing: ${command}`);
  };

  if (!isSupported) {
    return (
      <div className="p-4 border-t" style={{ borderColor: colors.primary }}>
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.warning + '20' }}>
          <div className="text-sm" style={{ color: colors.warning }}>
            🎤 Voice commands not supported in this browser
          </div>
          <div className="text-xs mt-1" style={{ color: colors.neutral }}>
            Try Chrome, Edge, or Safari for voice features
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t" style={{ borderColor: colors.primary }}>
      {/* Voice Input Section */}
      <div className="p-4">
        <h4 className="text-sm font-medium mb-3" style={{ color: colors.dark }}>
          🎤 Voice Commands
        </h4>
        
        {/* Voice Button */}
        <div className="flex items-center space-x-3 mb-4">
          <button
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isListening ? 'animate-pulse scale-110' : 'hover:scale-105'
            }`}
            style={{
              backgroundColor: isListening ? colors.error : colors.primary,
              color: colors.light
            }}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? '🛑' : '🎤'}
          </button>
          
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: colors.dark }}>
              {isListening ? 'Listening...' : 'Hold to speak'}
            </div>
            {transcript && (
              <div className="text-xs mt-1" style={{ color: colors.neutral }}>
                "{transcript}"
                {confidence > 0 && (
                  <span className="ml-2" style={{ color: colors.success }}>
                    ({Math.round(confidence * 100)}% confident)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Voice Status Indicator */}
        {isListening && (
          <div className="flex items-center justify-center mb-4">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-current animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    color: colors.primary,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.5s'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Voice Commands */}
        <div className="space-y-2">
          <div className="text-xs font-medium" style={{ color: colors.neutral }}>
            Try saying:
          </div>
          
          {[
            "Show me VIP customers",
            "Who needs attention?",
            "Create retention campaign",
            "Analyze customer segments"
          ].map((command, index) => (
            <button
              key={index}
              className="w-full text-left text-xs p-2 rounded hover:opacity-80 transition-opacity"
              style={{ backgroundColor: colors.neutral + '20', color: colors.dark }}
              onClick={() => handleQuickCommand(command)}
            >
              💬 "{command}"
            </button>
          ))}
        </div>
      </div>

      {/* Voice Tips */}
      <div className="p-4 border-t" style={{ borderColor: colors.neutral }}>
        <div className="text-xs space-y-1" style={{ color: colors.neutral }}>
          <div className="font-medium">💡 Voice Tips:</div>
          <div>• Speak clearly and naturally</div>
          <div>• Use customer names: "Analyze Lisa Thompson"</div>
          <div>• Ask questions: "Why is Mike at risk?"</div>
          <div>• Give commands: "Send email to VIP customers"</div>
        </div>
      </div>

      {/* Keyboard Shortcut */}
      <div className="p-4 border-t" style={{ borderColor: colors.neutral }}>
        <div className="text-xs" style={{ color: colors.neutral }}>
          <div className="font-medium mb-1">⌨️ Keyboard Shortcut:</div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 text-xs rounded" style={{ backgroundColor: colors.dark, color: colors.light }}>
              Space
            </kbd>
            <span>Hold to activate voice input</span>
          </div>
        </div>
      </div>
    </div>
  );
};
