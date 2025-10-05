import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import UploadVideoTab from "../components/UploadVideoTab";
import AnalyzeTab from "../components/AnalyzeTab";
import UploadAds from "../components/UploadAds";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [activeTab, setActiveTab] = useState("Ads");
  const [uploadedAds, setUploadedAds] = useState([]);

  const tabs = [
    { id: "Ads", label: "Ads", icon: "🏠" },
    { id: "Video", label: "Video", icon: "📹" },
    { id: "analyze", label: "Analyze", icon: "🔍" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">IdealAdvertisement</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Live Streams with AI
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your Ads and let our advanced AI analyze, enhance, and optimize them for maximum impact.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-2 text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === "Ads" && <UploadAds onAdsUpdate={setUploadedAds} onSwitchTab={setActiveTab} />}
              {activeTab === "Video" && <UploadVideoTab uploadedAds={uploadedAds} />}
              {activeTab === "analyze" && <AnalyzeTab />}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Processing</h3>
            <p className="text-gray-600">Upload and process your videos in seconds with our optimized AI pipeline.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Analysis</h3>
            <p className="text-gray-600">Get detailed insights about your video content, quality, and optimization opportunities.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Enhancement</h3>
            <p className="text-gray-600">Automatically enhance video quality, add effects, and optimize for different platforms.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 VideoAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
