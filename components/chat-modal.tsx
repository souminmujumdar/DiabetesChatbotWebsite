"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Download, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jsPDF } from "jspdf";

// Define types for user data based on questions
interface UserData {
  Pregnancies?: number;
  Glucose?: number;
  BloodPressure?: number;
  SkinThickness?: number;
  Insulin?: number;
  BMI?: number;
  DiabetesPedigreeFunction?: number;
  Age?: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PredictionResponse {
  prediction: number;
  probability: number;
  riskLevel: string;
}

interface Doctor {
  name: string;
  address: string;
  rating: number;
  total_reviews: number;
  experience: string;
  phone: string;
  website: string;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    time: string;
  }>;
}

interface DoctorSearchResponse {
  doctors: Doctor[];
  location: string;
  radius: number;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const questions = [
  {
    key: "Pregnancies",
    text: "How many times have you been pregnant? (Enter 0 if male or not applicable)",
    options: [
      { name: "0", value: 0 },
      { name: "1-2", value: 1.5 },
      { name: "3-5", value: 4 },
      { name: "6+", value: 6 },
      { name: "Unknown", value: 0 },
    ],
  },
  {
    key: "Glucose",
    text: "What was your last glucose level (mg/dL)?",
    options: [
      { name: "<100", value: 80 },
      { name: "100-125", value: 112.5 },
      { name: ">125", value: 150 },
      { name: "Unknown", value: 100 },
    ],
  },
  {
    key: "BloodPressure",
    text: "What is your typical blood pressure (mmHg)?",
    options: [
      { name: "<80", value: 70 },
      { name: "80-89", value: 84.5 },
      { name: "90+", value: 100 },
      { name: "Unknown", value: 80 },
    ],
  },
  {
    key: "SkinThickness",
    text: "What is your skin thickness (triceps mm)?",
    options: [
      { name: "<20", value: 15 },
      { name: "20-30", value: 25 },
      { name: "30+", value: 35 },
      { name: "Unknown", value: 20 },
    ],
  },
  {
    key: "Insulin",
    text: "What is your insulin level (mu U/ml)?",
    options: [
      { name: "<50", value: 30 },
      { name: "50-100", value: 75 },
      { name: ">100", value: 120 },
      { name: "Unknown", value: 50 },
    ],
  },
  {
    key: "BMI",
    text: "What is your BMI?",
    options: [
      { name: "<18.5", value: 18 },
      { name: "18.5-24.9", value: 21.7 },
      { name: "25-29.9", value: 27.5 },
      { name: "30+", value: 35 },
      { name: "Unknown", value: 25 },
    ],
  },
  {
    key: "DiabetesPedigreeFunction",
    text: "Do you have a family history of diabetes?",
    options: [
      { name: "No", value: 0.2 },
      { name: "Yes", value: 0.8 },
      { name: "Unknown", value: 0.5 },
    ],
  },
  {
    key: "Age",
    text: "How old are you?",
    options: [
      { name: "Young (<30)", value: 25 },
      { name: "Middle (30-50)", value: 40 },
      { name: "Older (>50)", value: 60 },
      { name: "Unknown", value: 33 },
    ],
  },
];

const generatePDFReport = (
  riskLevel: string,
  probability: number,
  userData: UserData,
  preventionStrategies: string
) => {
  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text("Your Diabetes Risk Report", 20, 20);
  doc.setFontSize(12);
  doc.text(`Risk Level: ${riskLevel}`, 20, 30);
  doc.text(`Probability: ${(probability * 100).toFixed(2)}%`, 20, 40);
  doc.text("Your Risk Factors", 20, 50);

  let yPosition = 60;
  for (const key in userData) {
    if (userData[key as keyof UserData] !== undefined) {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${key}: ${userData[key as keyof UserData]}`, 20, yPosition);
      yPosition += 10;
    }
  }

  doc.text("Prevention Strategies", 20, yPosition);
  yPosition += 10;
  const strategies = preventionStrategies
    .split("\n")
    .filter((s) => s.trim())
    .map((s) => s.replace(/^\*\s*/, ""));
  if (strategies.length > 0) {
    strategies.forEach((strategy) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      const lines = doc.splitTextToSize(strategy, 170);
      lines.forEach((line: string | string[]) => {
        doc.text(line, 20, yPosition);
        yPosition += 7;
      });
    });
  } else {
    doc.text("No specific prevention strategies available.", 20, yPosition);
    yPosition += 10;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  if (yPosition > 260) {
    doc.addPage();
    yPosition = 20;
  }
  doc.text(
    "Disclaimer: This report is for informational purposes only and not a substitute for professional medical advice.",
    20,
    yPosition,
    { maxWidth: 170 }
  );

  return doc.output("blob");
};

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Diabetes Assistant. Click 'Start Assessment' to check your diabetes risk, or type 'nutrition advice' for diabetes-friendly meal ideas. You can also ask about other conditions like 'hypertension and diabetes', or type 'find doctors in [location]' to locate specialists near you (or click 'Search Doctors').",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({});
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getGeminiResponse = async (question: string, context?: string) => {
    try {
      let prompt = "";
      if (context === "welcome") {
        prompt =
          "You are a friendly Diabetes Chatbot. Introduce yourself briefly and mention that users can click 'Start Assessment' to check their diabetes risk, type 'nutrition advice' for meal ideas, ask about other conditions, or type 'find doctors in [location]' to find specialists. Keep it under 3 sentences.";
      } else if (context === "prediction") {
        prompt = `You are a supportive Diabetes Chatbot. The user got this diabetes risk prediction: ${question}. Explain it in a warm, clear way and suggest next steps (e.g., see a doctor if high risk, or keep up healthy habits if low risk). Keep it brief.`;
      } else if (context === "education") {
        prompt = `You are a Diabetes Chatbot. Give a short, friendly explanation about ${question} related to diabetes. Be concise but helpful.`;
      } else {
        prompt = `You are a Diabetes Chatbot. Answer this question in a friendly, clear way: ${question}. Be concise but helpful.`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBWVhpheEDlakzInmo78_jF_imwx1Y8asA`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      console.log("Gemini API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error details:", errorText);
        throw new Error(`Gemini API HTTP error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error("No response from Gemini API");
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return `Sorry, I couldn't connect to the information source: ${error.message}. Please try again later.`;
    }
  };

  const getPrediction = async (userData: UserData) => {
    try {
      console.log("Prediction request data:", userData);
      const apiUrl = "http://127.0.0.1:5000";
      console.log(`Using API URL: ${apiUrl}/predict`);
      console.log("Sending data to server:", JSON.stringify(userData));
      
      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Prediction request failed: ${response.status} ${errorText}`);
      }

      const resultData = await response.json();
      console.log("Received prediction response:", resultData);
      if (resultData.riskLevel === undefined || resultData.probability === undefined) {
        throw new Error("Invalid response format from server");
      }
      return resultData as PredictionResponse;
    } catch (error: any) {
      console.error("Prediction error:", error);
      throw new Error(`Failed to get prediction: ${error.message}`);
    }
  };

  const searchDoctors = async (location: string) => {
    try {
      const apiUrl = "http://127.0.0.1:5000";
      const radius = 5000;
      const url = `${apiUrl}/doctors/search?location=${encodeURIComponent(location)}&radius=${radius}`;
      console.log(`Attempting to search doctors at: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      console.log("Doctor search response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Doctor search error response:", errorText);
        throw new Error(`Doctor search failed: ${response.status} - ${errorText}`);
      }

      const resultData = await response.json();
      console.log("Received doctor search response:", resultData);
      
      if (!resultData.doctors || !Array.isArray(resultData.doctors)) {
        throw new Error("Invalid doctor search response format from server");
      }

      return resultData as DoctorSearchResponse;
    } catch (error: any) {
      console.error("Detailed doctor search error:", error);
      throw new Error(`Failed to search for doctors: ${error.message}. Please ensure the backend server is running and the Google Maps API key is valid.`);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    console.log("Input received:", input);
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const lowerInput = input.toLowerCase().trim();
      if (lowerInput === "start assessment") {
        console.log("Starting assessment");
        setAssessmentActive(true);
        setStep(0);
        setUserData({});
        setPdfBlob(null);
        setDoctors([]);
        const firstQuestion = questions[0].text;
        console.log("Adding first question:", firstQuestion);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: firstQuestion },
        ]);
      } else if (
        lowerInput.includes("find doctors") ||
        lowerInput.includes("search doctors") ||
        lowerInput.includes("locate doctors") ||
        lowerInput.includes("doctors in") ||
        lowerInput.includes("doctors near") ||
        lowerInput.includes("specialists in") ||
        lowerInput.includes("specialists near")
      ) {
        // Enhanced regex to capture location after various phrases
        const match = lowerInput.match(
          /(?:find|search|locate)\s*(?:doctors|specialists|physicians)?\s*(?:near|in|around|at)?\s*(.+)/i
        ) || lowerInput.match(
          /(?:doctors|specialists|physicians)\s*(?:in|near|around|at)\s*(.+)/i
        );
        let location = match ? match[1].trim() : "";

        if (!location) {
          // Fallback: assume the entire input after "doctors" or "specialists" is the location
          const fallbackMatch = lowerInput.match(
            /(?:find|search|locate|doctors|specialists|physicians)\s*(.+)/i
          );
          location = fallbackMatch ? fallbackMatch[1].trim() : "";
        }

        if (!location) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Please specify a location (e.g., 'find doctors in Mumbai' or 'search doctors near Delhi'). Alternatively, click the 'Search Doctors' button above.",
            },
          ]);
          setIsLoading(false);
          return;
        }

        console.log(`Searching for doctors near: ${location}`);
        const doctorResponse = await searchDoctors(location);
        console.log(`Setting doctors state with ${doctorResponse.doctors.length} doctors`);
        setDoctors(doctorResponse.doctors);

        if (doctorResponse.doctors.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `No diabetes specialists found near ${location}. Try a different location or increase the search radius.`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I found ${doctorResponse.doctors.length} diabetes specialists near ${location}:`,
            },
          ]);
        }
      } else {
        console.log("Fetching Gemini response for:", input);
        const response = await getGeminiResponse(input, "education");
        setDoctors([]);
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      }
    } catch (error: any) {
      console.error("Error in handleSendMessage:", error);
      setError(`Error: ${error.message}`);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `I apologize, but I encountered an error: ${error.message}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
      console.log("Current state:", { assessmentActive, step, messages: messages.length, doctors: doctors.length });
    }
  };

  const handleOptionSelect = async (key: string, value: number, optionName: string) => {
    console.log("Option selected:", { key, value, optionName, step });
    const newUserData = { ...userData, [key]: value };
    setUserData(newUserData);
    setMessages((prev) => [...prev, { role: "user", content: optionName }]);
    setError("");
    setDoctors([]);

    const nextStep = step + 1;
    if (nextStep < questions.length) {
      setStep(nextStep);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: questions[nextStep].text },
      ]);
    } else {
      setIsLoading(true);
      try {
        console.log("Assessment complete, sending data for prediction:", newUserData);
        const predictionResponse = await getPrediction(newUserData);
        console.log("Received prediction:", predictionResponse);
        
        const { prediction, probability, riskLevel } = predictionResponse;
        const predictionText = `Risk Level: ${riskLevel}, Probability: ${(probability * 100).toFixed(2)}%`;
        
        console.log("Getting prediction explanation for:", predictionText);
        const predictionExplanation = await getGeminiResponse(predictionText, "prediction");

        let response = `Based on your answers, your diabetes risk is: **${riskLevel}** (Probability: ${(probability * 100).toFixed(2)}%)\n\n`;
        response += predictionExplanation;
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);

        const preventionStrategies = await getGeminiResponse("How to prevent diabetes", "education");
        const pdf = generatePDFReport(riskLevel, probability, newUserData, preventionStrategies || "No specific strategies available.");
        console.log("PDF blob generated:", pdf);
        setPdfBlob(pdf);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I've prepared a detailed report for you that you can download below. If you'd like, I can also help you find diabetes specialists near your location—just click the 'Search Doctors' button!",
          },
        ]);
        setAssessmentActive(false);
        setStep(0);
      } catch (error: any) {
        console.error("Assessment error:", error);
        setError(`Assessment failed: ${error.message}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I encountered an error processing your assessment: ${error.message}. Please try again or ask a question.`,
          },
        ]);
        setStep(questions.length - 1);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleManualDoctorSearch = async () => {
    const location = prompt("Please enter your location (e.g., Mumbai):");
    if (!location || !location.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Location cannot be empty. Please try again (e.g., 'find doctors in Mumbai')." },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `find doctors in ${location}` },
    ]);
    setIsLoading(true);
    setError("");

    try {
      const doctorResponse = await searchDoctors(location);
      console.log(`Setting doctors state with ${doctorResponse.doctors.length} doctors`);
      setDoctors(doctorResponse.doctors);

      if (doctorResponse.doctors.length === 0) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `No diabetes specialists found near ${location}. Try a different location or increase the search radius.` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `I found ${doctorResponse.doctors.length} diabetes specialists near ${location}:` },
        ]);
      }
    } catch (error: any) {
      console.error("Error in handleManualDoctorSearch:", error);
      setError(`Error: ${error.message}`);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `I apologize, but I encountered an error: ${error.message}. Please ensure the backend server is running and try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col h-[600px] max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Diabetes Assistant</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="flex justify-center gap-2 mb-4">
              <Button
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    { role: "user", content: "start assessment" },
                  ]);
                  handleSendMessage();
                }}
                disabled={isLoading || assessmentActive}
                className="bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Start diabetes risk assessment"
              >
                Start Assessment
              </Button>
              <Button
                onClick={handleManualDoctorSearch}
                disabled={isLoading || assessmentActive}
                className="bg-green-600 text-white hover:bg-green-700"
                aria-label="Search for doctors near your location"
              >
                <Stethoscope className="h-4 w-4 mr-2" aria-hidden="true" />
                Search Doctors
              </Button>
            </div>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "assistant" ? (
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <User className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === "user" ? "You" : "Assistant"}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {doctors.length > 0 && (
              <div className="space-y-3">
                {doctors.map((doctor, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-100 text-foreground rounded-lg p-3 max-w-[80%]"
                  >
                    <p className="text-sm font-semibold">{doctor.name}</p>
                    <p className="text-sm">{doctor.address}</p>
                    <p className="text-sm">Rating: {doctor.rating} ({doctor.total_reviews} reviews)</p>
                    <p className="text-sm">Experience: {doctor.experience}</p>
                    <p className="text-sm">Phone: {doctor.phone}</p>
                    {doctor.website !== "Not available" && (
                      <a
                        href={doctor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Website
                      </a>
                    )}
                    {doctor.reviews.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium">Top Review:</p>
                        <p className="text-xs italic">
                          "{doctor.reviews[0].text}" - {doctor.reviews[0].author} ({doctor.reviews[0].rating}/5)
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-medium">Assistant</span>
                  </div>
                  <div
                    className="flex space-x-1"
                    role="status"
                    aria-label="Loading"
                  >
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-red-100 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            {assessmentActive && step < questions.length && (
              <div className="flex flex-wrap gap-2 justify-start">
                {questions[step].options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="bg-white border-gray-300 text-gray-700 hover:bg-blue-50"
                    onClick={() =>
                      handleOptionSelect(
                        questions[step].key,
                        option.value,
                        option.name
                      )
                    }
                    disabled={isLoading}
                    aria-label={`Select ${option.name} for ${questions[step].key}`}
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            )}
            {pdfBlob && (
              <div className="flex justify-center mt-4">
                <a
                  href={URL.createObjectURL(pdfBlob)}
                  download="Diabetes_Risk_Report.pdf"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  aria-label="Download your diabetes risk report"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download Risk Report (PDF)
                </a>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                assessmentActive && step < questions.length
                  ? "Please select an option above"
                  : "Ask about diabetes, type 'start assessment', or 'find doctors in [location]'..."
              }
              className="min-h-[60px] flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading || (assessmentActive && step < questions.length)}
              aria-label="Chat input for diabetes assistant"
            />
            <Button
              type="submit"
              size="icon"
              disabled={
                isLoading ||
                !input.trim() ||
                (assessmentActive && step < questions.length)
              }
              className="h-[60px] w-[60px]"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by Gemini AI. For informational purposes only, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}