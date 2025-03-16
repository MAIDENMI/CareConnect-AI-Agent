import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the interface for the Web Speech API
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

const SpeechToAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAIResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition on component mount
  useEffect(() => {
    // Check browser support for SpeechRecognition
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      setError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }

    // Initialize SpeechRecognition
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      setTranscript(text);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      if (transcript) {
        processWithAI(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setError(`Error occurred: ${event.error}`);
    };

    // Store the recognition instance
    setSpeechRecognition(recognition);

    // Clean up on component unmount
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  // Mock function for processing with AI
  const processWithAI = async (text: string) => {
    setIsProcessing(true);
    setAIResponse("");

    try {
      // This is where you would call your AI service
      // For now, we'll just simulate a delay and return a mock response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI response based on the transcript
      let response = "";
      if (text.toLowerCase().includes("hello") || text.toLowerCase().includes("hi")) {
        response = "Hello there! How can I assist you today?";
      } else if (text.toLowerCase().includes("weather")) {
        response = "I'm sorry, I don't have access to real-time weather data in this demo.";
      } else if (text.toLowerCase().includes("time")) {
        response = `The current time is ${new Date().toLocaleTimeString()}.`;
      } else {
        response = `I received: "${text}". How else can I help you?`;
      }

      setAIResponse(response);
    } catch (err) {
      setError("Failed to process your speech with AI. Please try again.");
      console.error("AI processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!speechRecognition) return;

    if (isListening) {
      speechRecognition.stop();
    } else {
      // Clear previous results
      setTranscript("");
      setAIResponse("");
      speechRecognition.start();
    }
  };

  // Detect silence automatically (stop after 2 seconds of silence)
  useEffect(() => {
    let silenceTimer: NodeJS.Timeout;

    if (isListening) {
      silenceTimer = setTimeout(() => {
        if (speechRecognition && isListening) {
          speechRecognition.stop();
        }
      }, 2000); // 2 seconds of silence
    }

    return () => {
      clearTimeout(silenceTimer);
    };
  }, [isListening, speechRecognition, transcript]);

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">Speech to AI Assistant</h2>
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={toggleListening}
            disabled={!speechRecognition || isProcessing}
            className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
          >
            {isListening ? "Listening..." : "Start Speaking"}
          </Button>
        </div>

        {transcript && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-500">You said:</h3>
            <p className="p-2 bg-gray-100 rounded">{transcript}</p>
          </div>
        )}

        {isProcessing && (
          <div className="text-center text-sm text-gray-500">
            Processing your request...
          </div>
        )}

        {aiResponse && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-500">AI Response:</h3>
            <p className="p-2 bg-blue-50 rounded">{aiResponse}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Click the button and speak. The recording will stop automatically after 2 seconds of silence.
        </p>
      </div>
    </Card>
  );
};

export default SpeechToAI;