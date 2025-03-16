import React, { useState, useRef, useEffect } from "react";
import type { AudioContext } from 'standardized-audio-context';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { useOutletContext } from "react-router";
import type { AuthOutletContext } from "./_user";

/**
 * Converts a Blob to a Base64 string.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // Remove "data:audio/wav;base64,"
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Speech-to-Text (Google Speech API)
 */
async function speechToText(audioBlob: Blob): Promise<string> {
  try {
    console.log("Converting audio to base64...");
    const audioContent = await blobToBase64(audioBlob);
    console.log("Audio converted to base64, sending to Google Speech-to-Text API...");

    // Determine the audio encoding based on the blob type
    const mimeType = audioBlob.type;
    let encoding = "LINEAR16";

    if (mimeType.includes("webm")) {
      encoding = "WEBM_OPUS"; // Use WEBM_OPUS for webm audio files
    }

    const requestBody = {
      audio: { content: audioContent },
      config: {
        encoding: encoding,
        sampleRateHertz: 48000, // Standard for most browser recordings
        languageCode: "en-US",
        model: "default"
      }
    };

    console.log("Sending request to Google API...");
    const response = await fetch("https://speech.googleapis.com/v1p1beta1/speech:recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ya29.a0AeXRPp42FxESMBy-92_n8GYy4RvLdydNWEkz2EZ7y1A6-HN0ZSa8ptdEu7ravIzqPy745q0jMAYfZs3YrwRXfHk_nZlGlXg4Xuts3sUkHUXgpZqckk2HAd5lAQq6mJcaCfaL7EfDjn5ratz4v5d-bEn8pb87L51hwrYc2x4poyhXRZEaCgYKASESARMSFQHGX2MiO4mJQAoGh-031ZtJVPvw5w0182`,
        "x-goog-user-project": "kiwicode-431418"
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Google API error:", response.status, await response.text());
      throw new Error(`Google Speech API returned ${response.status}`);
    }

    const result = await response.json();
    const transcript = result.results?.[0]?.alternatives?.[0]?.transcript || "";
    console.log("Received transcript:", transcript);
    return transcript;
  } catch (error) {
    console.error("Speech-to-text error:", error);
    return "";
  }
}

/**
 * Text-to-Speech (Google TTS API)
 */
async function textToSpeech(text: string): Promise<Blob> {
  try {
    const requestBody = {
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" }
    };

    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ya29.a0AeXRPp42FxESMBy-92_n8GYy4RvLdydNWEkz2EZ7y1A6-HN0ZSa8ptdEu7ravIzqPy745q0jMAYfZs3YrwRXfHk_nZlGlXg4Xuts3sUkHUXgpZqckk2HAd5lAQq6mJcaCfaL7EfDjn5ratz4v5d-bEn8pb87L51hwrYc2x4poyhXRZEaCgYKASESARMSFQHGX2MiO4mJQAoGh-031ZtJVPvw5w0182`,
        "x-goog-user-project": "kiwicode-431418"
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Google TTS API error:", response.status, await response.text());
      throw new Error(`Google TTS API returned ${response.status}`);
    }

    const result = await response.json();
    console.log("TTS response received, processing audio data...");

    const byteCharacters = atob(result.audioContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: "audio/mp3" });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    throw new Error("Failed to convert text to speech");
  }
}

/**
 * Plays the given audio Blob.
 */
function playAudio(audioBlob: Blob): void {
  const audioURL = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioURL);
  audio.play();
}

/**
 * Generate a response using Google's Gemini API
 */
async function generateGeminiResponse(text: string): Promise<string> {
  try {
    console.log("Sending to Gemini API:", text);
    
    const prompt = `
      You are a virtual companion for a child who needs comfort and support. 
      You should respond with warmth, understanding, and gentle reassurance, like a caring parent figure.
      Keep responses simple, comforting, and age-appropriate (for ages 5-12).
      Keep responses short - around 1-3 sentences maximum.
      If the child seems distressed, anxious, or scared, prioritize calming them.
      Never include any harmful, inappropriate, or frightening content in your responses.
      
      The child says: "${text}"
      
      Your compassionate response:
    `;
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCTfw9EXfbov2MDkzb-bzmmGd_7z6gvzK4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const result = await response.json();
    console.log("Gemini API response:", result);
    
    // Extract the response text from the Gemini API response
    const generatedResponse = result.candidates[0].content.parts[0].text.trim();
    console.log("Generated response:", generatedResponse);
    
    return generatedResponse;
  } catch (error) {
    console.error("Error generating response:", error);
    return "I'm here with you. I care about you. Would you like to tell me more about how you're feeling?";
  }
}

/**
 * Speech-to-Speech Flow: Convert speech to text, generate a response with Gemini, then back to speech.
 */
async function speechToSpeechFlow(audioBlob: Blob): Promise<void> {
  try {
    console.log("Starting audio processing...");
    console.log("Starting speech-to-text with audio format:", audioBlob.type);

    // Convert speech to text
    const transcript = await speechToText(audioBlob);
    console.log("Transcript from user:", transcript);

    if (!transcript) {
      alert("I didn't quite catch that. Could you try speaking again?");
      console.warn("No transcript detected. Speech recognition failed.");
      return;
    }

    // Generate response with Gemini
    console.log("Generating response with Gemini...");
    const aiResponse = await generateGeminiResponse(transcript);
    console.log("AI response:", aiResponse);

    // Convert the AI response to speech
    console.log("Starting text-to-speech with AI response...");
    const synthesizedAudio = await textToSpeech(aiResponse);
    console.log("Text-to-speech complete. Playing audio...");
    playAudio(synthesizedAudio);
  } catch (err) {
    console.error("Error in speech-to-speech flow:", err);
    alert("There was an error processing your message. Please try again.");
  }
}

export default function() {

  const { gadgetConfig, user } = useOutletContext<AuthOutletContext>();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Set up audio analysis for silence detection
   */
  const setupAudioAnalysis = (stream: MediaStream) => {
    // Store the stream for later cleanup
    streamRef.current = stream;
    
    // Create audio context and analyser
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    
    // Connect the stream to the analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Start monitoring for silence
    detectSilence();
  };

  /**
   * Detect silence to automatically stop recording
   */
  const detectSilence = () => {
    if (!analyserRef.current || !isListening) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    console.log("Current audio level:", average); // For debugging
    
    // Check if volume is below threshold (silence)
    // Lower threshold (5 instead of 10) for better sensitivity
    if (average < 5) { 
      // If already in a silence period, do nothing
      if (silenceTimerRef.current !== null) return;
      
      console.log("Silence detected, starting timer...");
      
      // Start silence timer
      silenceTimerRef.current = window.setTimeout(() => {
        // If we're still listening and silence has passed
        if (isListening) {
          console.log("Silence continued for timeout period, stopping recording...");
          // Stop recording and process
          handleStopListening();
        }
        silenceTimerRef.current = null;
      }, 1500); // 1.5 seconds of silence before stopping (reduced from 2s for quicker response)
    } else {
      // If there's sound, clear any existing silence timer
      if (silenceTimerRef.current !== null) {
        console.log("Sound detected, clearing silence timer");
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    
    // Continue monitoring if still listening
    if (isListening) {
      requestAnimationFrame(detectSilence);
    }
  };

  /**
   * Clean up audio resources
   */
  const cleanupAudio = () => {
    // Clear any silence timer
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    analyserRef.current = null;
  };

  useEffect(() => {
    // This runs only on the client after initial render
    setIsClient(true);
    
    // Cleanup function for when component unmounts
    return () => {
      cleanupAudio();
    };
  }, []);

  // Add an effect to monitor isListening changes
  useEffect(() => {
    // If listening stops (e.g. due to component state changes), ensure cleanup
    if (!isListening) {
      cleanupAudio();
    }
  }, [isListening]);

  const startListening = async () => {
    try {
      setIsListening(true);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for silence detection
      setupAudioAnalysis(stream);
      
      // Set up media recorder
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording with more frequent data capture
      audioChunksRef.current = []; // Reset for new recording
      recorder.start(100); // Capture data every 100ms for more responsive processing
      setMediaRecorder(recorder);
      console.log("Recording started - speak and I'll listen for when you pause");
    } catch (err) {
      console.error("Error starting listening:", err);
      setIsListening(false);
      alert("Could not access your microphone. Please check your permissions and try again.");
    }
  };

  const handleStopListening = async () => {
    if (!mediaRecorder || !isListening) return;
    
    setIsListening(false);
    setProcessing(true);
    
    try {
      // Stop the recorder
      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        console.log("Recording stopped");
        
        // Wait for the onstop event to fire and collect data
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = () => resolve();
        });
      }
      
      // Clean up audio analysis resources
      cleanupAudio();
      
      // Process the recording
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      console.log("Recording captured, size:", audioBlob.size);
      
      // Don't process if the recording is too small (likely just background noise)
      if (audioBlob.size < 1000) {
        console.log("Recording too small, likely just noise. Not processing.");
        setProcessing(false);
        return;
      }
      
      await speechToSpeechFlow(audioBlob);
    } catch (err) {
      console.error("Error stopping and processing recording:", err);
      alert("There was an error processing your speech. Please try again.");
    } finally {
      setMediaRecorder(null);
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="grid gap-8">
        <Card className="overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <div className="flex flex-col md:flex-row items-center justify-center p-8">
            <div className="md:w-1/2 space-y-4 text-center md:text-left md:pr-8">
              <h1 className="text-3xl font-bold text-amber-800">Your Virtual Companion</h1>
              <p className="text-lg text-amber-700">
                I'm here to listen and talk with you anytime you need someone.
              </p>
            </div>
            <div className="w-64 h-64 mx-auto md:mx-0 mt-6 md:mt-0 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                src="https://img.freepik.com/free-photo/portrait-smiling-beautiful-woman-touching-her-face_1150-26676.jpg" 
                alt="Virtual Caregiver"
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-semibold text-blue-700 mb-3">Talk to me about anything</h2>
            <p className="text-blue-600 mb-6 max-w-md">
              I'm here to listen when you're feeling happy, sad, scared, or just want someone to talk to.
            </p>
            
            <div className="flex justify-center space-x-4 my-6">
              <Button 
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? handleStopListening : startListening} 
                disabled={isClient && processing}
                size="lg"
                className={`px-8 py-10 text-xl rounded-full shadow-md transition-all ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {processing ? (
                  <>
                    <span className="animate-pulse">Processing</span>
                    <span className="animate-pulse ml-1">...</span>
                  </>
                ) : isListening ? (
                  <>
                    <span className="animate-pulse">Listening</span>
                    <span className="animate-pulse ml-1">...</span>
                  </>
                ) : (
                  "Start Talking"
                )}
              </Button>
              
              {isListening && (
                <Button 
                  variant="outline" 
                  onClick={handleStopListening}
                  disabled={processing}
                  size="lg"
                  className="px-6 py-10 text-xl rounded-full border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  Done Talking
                </Button>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-white bg-opacity-70 border border-blue-200 rounded-xl text-blue-800 text-md max-w-lg">
              <p className="font-medium mb-2">How to use your companion:</p>
              <ol className="list-decimal list-inside text-left space-y-2">
                <li>Click <b>Start Talking</b> to begin</li>
                <li>Tell me anything that's on your mind</li>
                <li>When you're done speaking, pause for a moment</li>
                <li>I'll listen and respond to you with care</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}