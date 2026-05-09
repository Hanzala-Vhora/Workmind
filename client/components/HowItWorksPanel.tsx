import React from 'react';

export default function HowItWorksPanel() {
  const steps = [
    {
      title: "1. Upload Global Business Knowledge",
      description:
        "Start by uploading company-wide knowledge that all AI experts can access. This includes SOPs, company policies, brand guidelines, strategy documents, presentations, workflows, and operational manuals.",
      icon: "📁"
    },
    {
      title: "2. Department AI Experts",
      description:
        "Each department has its own dedicated AI workspace and expert. HR, Finance, Marketing, Operations, Procurement, and other teams work inside focused environments instead of fragmented chats.",
      icon: "🤖"
    },
    {
      title: "3. Add Department-Specific Context",
      description:
        "Inside each agent workspace, upload department-specific files, PDFs, spreadsheets, meeting notes, reports, and operational documents to make responses more accurate and context-aware.",
      icon: "📋"
    },
    {
      title: "4. Website & Social Media Knowledge",
      description:
        "Use the Context section inside each AI workspace to add website URLs, Instagram pages, LinkedIn pages, or other online sources for scraping and knowledge extraction.",
      icon: "🔗",
    },
    {
      title: "5. Important: Use the Context Panel",
      description:
        "Do NOT paste website links or Instagram profiles directly into the chat prompt area. The AI cannot properly scrape or structure knowledge from links pasted into normal chat messages. Always use the dedicated Context upload section.",
      icon: "⚠️"
    },
    {
      title: "6. Persistent Team Knowledge",
      description:
        "Uploaded context stays organized inside each workspace, allowing your teams to build long-term operational memory instead of repeating the same information across chats.",
      icon: "🧠"
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1020] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            How TheWorkimnd Works
          </h1>

          <p className="text-lg text-gray-300 max-w-3xl leading-relaxed">
            TheWorkimnd is designed around structured business knowledge and
            department-focused AI workspaces. Instead of disconnected chats,
            your organization operates through focused AI environments with
            persistent operational context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-[#121A30] border border-[#1E2945] rounded-3xl p-7 hover:border-[#4F7CFF] transition-all duration-300"
            >
              <div className="text-4xl mb-5">{step.icon}</div>

              <h2 className="text-2xl font-semibold mb-4 leading-snug">
                {step.title}
              </h2>

              <p className="text-gray-300 leading-relaxed text-[15px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#1B2A52] to-[#13203D] rounded-3xl p-8 border border-[#2A4275]">
          <h2 className="text-3xl font-bold mb-4">
            Why This Matters
          </h2>

          <p className="text-gray-200 leading-relaxed text-lg max-w-4xl">
            Traditional AI tools operate through isolated conversations.
            TheWorkimnd organizes your business knowledge into structured AI
            workspaces so every department can operate with focused context,
            better execution, and long-term organizational memory.
          </p>
        </div>
      </div>
    </div>
  );
}
