FinIntellect | NotebookLM 🚀

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_React-F56565?style=for-the-badge&logo=lucide&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)

FinIntellect is a high-performance, professional financial intelligence workspace and single-page application (SPA). Designed for financial analysts and auditors, it brings unstructured corporate financial ledgers to life with client-side AI analysis, interactive SVG-rendered trendlines, presentation-ready pitch deck generation, and a voice-enabled conversational copilot.

🌟 Key Features

1. Security & Authentication (BYOK)

Bring Your Own Key: The API connection is entirely client-side, ensuring that sensitive corporate files never touch intermediate servers.

Permissive Verification: Seamlessly connects with valid Google AI Studio API Keys (gemini-3-flash-preview model endpoints).

2. Intelligent Data Orchestration

Heuristic Ledger Parser: Uses regex engines to identify core financial indicators—Revenue, Operating Margin, Free Cash Flow (FCF), and Debt Service Coverage Ratio (DSCR)—instantly from plain text logs.

KPI Matrix & Manual Overrides: Fine-tune financial variables on the fly. Manual edits instantly synchronize across both charts and presentation slides.

3. Dynamic SVG Charting Engine

Dynamic Normalization: Automatically projects Y-axis scales by mapping coordinates dynamically using the formula:


$$y = H_{height} - P_{padding} - \frac{v - V_{min}}{V_{max} - V_{min}} \cdot (H_{height} - 2P_{padding})$$

Interactive Tooltips: High-precision hover-state tracker showcasing precise metric values alongside cubic bezier curves and pulsing coordinate points.

4. Conversational Copilot with Voice Dictation

Contextual Prompting: Automatically serializes your raw ledger text and parsed KPI matrices directly into the model's system instruction, preventing hallucination.

Voice Dictation Mode: Features native speech recognition (SpeechRecognition API) with dynamic pulse animations to talk directly to your data.

Exponential Backoff Retry: Resilience handling built into the fetch middleware to gracefully bypass rate limits ($429$) and connection timeouts.

5. Time-Travel Session Archives

State Persistence: Capture, snapshot, and store active document IDs, customized metrics, and assistant chat logs locally within browser localStorage.

Instant Recovery: Step back to previous audit histories in one click.

🛠️ Technology Stack

UI Framework: React (Hooks-based functional components)

Styling: Tailwind CSS (Premium deep slate & emerald dashboard design system)

Iconography: Lucide React

AI Model Engine: Google Gemini API (gemini-3-flash-preview)

Voice Dictation: HTML5 Web Speech API

Charting: Custom SVG Math

🚀 Quick Start & Installation

Prerequisite

Ensure you have Node.js installed on your machine.

Installation Steps

Clone the repository:

git clone https://github.com/your-username/finintellect-notebooklm.git
cd finintellect-notebooklm


Install dependencies:
Ensure you have React, Lucide React, and Tailwind CSS configured in your environment.

npm install lucide-react


Install Tailwind CSS (if starting from a bare template):
Follow the Tailwind CSS installation guide for your specific project framework.

Run development server:

npm run dev


📊 Application Architecture Grid

The dashboard layout partitions your screen space into three logical, productive zones:

Command Hub (Left Column): Security, local asset directory management, and historic audit timelines.

Workspace (Center Column): Tabbed interface containing document source code, manual override inputs, customizable SVG plots, and slide creators.

Copilot (Right Column): Context-aware prompt window integrating continuous AI processing and microphone-activated dictation.

🔒 Security & Privacy Notice

All files, text documents, and API keys are stored solely inside your browser's private local cache (localStorage). No text contents or secrets are transmitted, saved, or logged onto external database infrastructures.

Engineered with precision for modern corporate audits.
