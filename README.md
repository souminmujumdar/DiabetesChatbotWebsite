Diabetes Assistant Chatbot

A web-based chatbot application designed to assist users in assessing their diabetes risk and finding nearby diabetes specialists. Built with Next.js for the frontend and Flask for the backend, this tool integrates the Gemini AI API for educational responses and the Google Maps API for doctor search functionality. Users can initiate a diabetes risk assessment by typing "start assessment" or search for specialists by typing "find doctors in [location]," with results displayed interactively. The app also generates a downloadable PDF report summarizing the user's risk assessment and prevention strategies.

Features:

Interactive diabetes risk assessment with user-provided health data.
Real-time search for diabetes specialists based on location.
AI-powered educational responses about diabetes.
PDF report generation for risk assessment results.
Responsive and user-friendly interface.
Technologies Used:

Frontend: Next.js, TypeScript, Tailwind CSS, lucide-react, jsPDF
Backend: Flask, Python
APIs: Gemini AI, Google Maps API
Setup:

Clone the repository: git clone <repository-url>
Install dependencies: npm install (frontend) and pip install -r requirements.txt (backend)
Set up environment variables (e.g., Google Maps API key, Gemini API key)
Run the backend: python app.py (on http://127.0.0.1:5000)
Run the frontend: npm run dev
Contributing:
Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request with your changes.

Created by students of SIT
Soumin Mujumdar 22070122190 
Vidhi Binwal 22070122249
