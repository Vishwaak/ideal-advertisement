import { useState } from "react";

export default function AnalyzeTab() {
  const [selectedAnalysis, setSelectedAnalysis] = useState("content");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const analysisTypes = [
    {
      id: "content",
      title: "Content Analysis",
      description: "Analyze video content, objects, scenes, and activities",
      icon: "🎯",
      features: ["Object detection", "Scene recognition", "Activity analysis", "Content categorization"]
    },
    {
      id: "quality",
      title: "Quality Assessment",
      description: "Evaluate video quality, resolution, and technical aspects",
      icon: "📊",
      features: ["Resolution analysis", "Bitrate assessment", "Frame rate evaluation", "Audio quality check"]
    },
    {
      id: "sentiment",
      title: "Sentiment Analysis",
      description: "Analyze emotions, tone, and sentiment in video content",
      icon: "😊",
      features: ["Emotion detection", "Tone analysis", "Sentiment scoring", "Mood classification"]
    },
    {
      id: "engagement",
      title: "Engagement Prediction",
      description: "Predict viewer engagement and retention potential",
      icon: "📈",
      features: ["Engagement scoring", "Retention prediction", "Attention analysis", "Viewer behavior insights"]
    }
  ];

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate analysis process
    setTimeout(() => {
      setAnalysisResults({
        content: {
          objects: ["Person", "Car", "Building", "Tree"],
          scenes: ["Outdoor", "Urban", "Daylight"],
          activities: ["Walking", "Talking", "Driving"],
          categories: ["Lifestyle", "Travel", "Social"]
        },
        quality: {
          resolution: "1920x1080",
          bitrate: "5000 kbps",
          frameRate: "30 fps",
          audioQuality: "High"
        },
        sentiment: {
          emotion: "Positive",
          tone: "Friendly",
          score: 8.5,
          mood: "Energetic"
        },
        engagement: {
          score: 7.8,
          retention: "High",
          attention: "Good",
          recommendation: "Optimize for mobile viewing"
        }
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  const selectedAnalysisType = analysisTypes.find(type => type.id === selectedAnalysis);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Video Analysis</h3>
        <p className="text-gray-600">
          Choose the type of analysis you want to perform on your video content.
        </p>
      </div>

      {/* Analysis Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setSelectedAnalysis(type.id)}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedAnalysis === type.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="text-3xl">{type.icon}</div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {type.title}
                </h4>
                <p className="text-gray-600 mb-3">{type.description}</p>
                <ul className="space-y-1">
                  {type.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-500 flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Analysis Details */}
      {selectedAnalysisType && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{selectedAnalysisType.icon}</span>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {selectedAnalysisType.title}
              </h4>
              <p className="text-gray-600">{selectedAnalysisType.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedAnalysisType.features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-sm text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Button */}
      <div className="text-center">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`px-8 py-4 rounded-lg font-medium transition-colors ${
            isAnalyzing
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>🔍</span>
              <span>Start Analysis</span>
            </div>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Analysis Complete!</h4>
            <p className="text-gray-600">Here are the results for your video:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Analysis Results */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Content Analysis
              </h5>
              <div className="space-y-3">
                <div>
                  <h6 className="font-medium text-gray-700 mb-1">Detected Objects:</h6>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.content.objects.map((obj, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h6 className="font-medium text-gray-700 mb-1">Scenes:</h6>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.content.scenes.map((scene, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                        {scene}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Assessment Results */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Quality Assessment
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Resolution:</span>
                  <span className="font-medium">{analysisResults.quality.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bitrate:</span>
                  <span className="font-medium">{analysisResults.quality.bitrate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frame Rate:</span>
                  <span className="font-medium">{analysisResults.quality.frameRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Audio Quality:</span>
                  <span className="font-medium text-green-600">{analysisResults.quality.audioQuality}</span>
                </div>
              </div>
            </div>

            {/* Sentiment Analysis Results */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">😊</span>
                Sentiment Analysis
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Emotion:</span>
                  <span className="font-medium text-green-600">{analysisResults.sentiment.emotion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tone:</span>
                  <span className="font-medium">{analysisResults.sentiment.tone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-medium">{analysisResults.sentiment.score}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mood:</span>
                  <span className="font-medium">{analysisResults.sentiment.mood}</span>
                </div>
              </div>
            </div>

            {/* Engagement Prediction Results */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📈</span>
                Engagement Prediction
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Engagement Score:</span>
                  <span className="font-medium text-blue-600">{analysisResults.engagement.score}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Retention:</span>
                  <span className="font-medium text-green-600">{analysisResults.engagement.retention}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attention:</span>
                  <span className="font-medium text-yellow-600">{analysisResults.engagement.attention}</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Recommendation:</strong> {analysisResults.engagement.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Download Report
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Analyze Another Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
