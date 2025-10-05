import { useState, useCallback, useRef, useEffect } from "react";

export default function UploadVideoTab() {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [segments, setSegments] = useState([]);
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [segmentDuration, setSegmentDuration] = useState(30); // Default 30 seconds per segment
    const [apiResponse, setApiResponse] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [videoAnalysis, setVideoAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

    const videoRef = useRef(null);
    const progressIntervalRef = useRef(null);

    // API Upload function
    const uploadToTwelveLabs = async (file) => {

        const url = 'https://api.twelvelabs.io/v1.3/tasks';
        // Use multipart/form-data for the payload
        const payload = new FormData();
        payload.append('index_id', '68e16c4864ff05606e152396');
        payload.append('video_file', file);

        const options = {
            method: 'POST',
            headers: {
                'x-api-key': process.env.NEXT_PUBLIC_TWELVE_LABS_API_KEY || 'your-api-key-here'
            }
        };
        options.body = payload;

        try {
            return { id: '68e1702417b39f617835d1b6', video_id: '68e1702417b39f617835d1b6' }
            const response = await fetch(url, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            setApiResponse(data);
            setApiError(null);
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            setApiError(error.message);
            setApiResponse(null);
            throw error;

        }
    };

    const getVideoAnalysis = async (videoid) => {
        const url = 'https://api.twelvelabs.io/v1.3/analyze';
        const options = {
            method: 'POST',
            headers: {
                'x-api-key': process.env.NEXT_PUBLIC_TWELVE_LABS_API_KEY || 'your-api-key-here',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_id: videoid,
                prompt: "Analyze this video and provide timestamps for key events, scenes, or segments. Break down the video by main events with their start and end times in seconds.",
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        type: "object",
                        properties: {
                            segments: { type: "array", items: { type: "object", properties: { start_time: { type: "number" }, end_time: { type: "number" }, description: { type: "string" } } } }
                        }
                    }
                },
                temperature: 0.2,
                stream: false,
                max_tokens: 2000,
            })
        };

        try {
            return {
                segments: [
                    { start_time: 0, end_time: 3, description: "hits a goal" },
                    { start_time: 3, end_time: 4, description: "goal celebration" },
                    { start_time: 4, end_time: 8, description: "celebration" }
                ]
            };
            const response = await fetch(url, options);
            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            // Return dummy segment data on error for development/testing
            console.warn("Returning dummy segment data due to error:", error);
            throw error;
            
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setUploadedFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);

            // Reset previous API state
            setApiResponse(null);
            setApiError(null);
            setVideoAnalysis(null);
            setAnalysisError(null);

            // Start upload process
            setIsUploading(true);
            setIsApiLoading(true);
            setUploadProgress(0);

            try {
                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 70) {
                            clearInterval(progressInterval);
                            return 70; // Stop at 70% until upload completes
                        }
                        return prev + 10;
                    });
                }, 200);

                // Upload to TwelveLabs API
                const uploadResult = await uploadToTwelveLabs(file);

                // Update progress to 80% after upload
                setUploadProgress(80);
                clearInterval(progressInterval);

                // Get video ID from upload response
                const videoId = uploadResult.id || uploadResult.video_id;
                if (videoId) {
                    // Start analysis
                    setIsAnalyzing(true);
                    setUploadProgress(90);

                    try {
                        const analysisResult = await getVideoAnalysis(videoId);
                        console.log(analysisResult);
                        setVideoAnalysis(analysisResult);
                        setAnalysisError(null);
                        setUploadProgress(100);
                    } catch (analysisError) {
                        console.error('Analysis failed:', analysisError);
                        setAnalysisError(analysisError.message);
                        setUploadProgress(100);
                    } finally {
                        setIsAnalyzing(false);
                    }
                } else {
                    console.error('No video ID found in upload response');
                    setAnalysisError('No video ID received from upload');
                    setUploadProgress(100);
                }

            } catch (error) {
                console.error('Upload failed:', error);
                // Keep progress at current state on error
            } finally {
                setIsUploading(false);
                setIsApiLoading(false);
            }
        }
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        onDrop(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        onDrop(files);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const resetUpload = () => {
        setUploadedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        setVideoUrl(null);
        setVideoDuration(0);
        setCurrentTime(0);
        setIsPlaying(false);
        setSegments([]);
        setSelectedSegment(null);
        setApiResponse(null);
        setApiError(null);
        setIsApiLoading(false);
        setVideoAnalysis(null);
        setIsAnalyzing(false);
        setAnalysisError(null);
        if (videoRef.current) {
            videoRef.current.pause();
        }
    };

    // Video event handlers
    const handleVideoLoadedMetadata = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
            generateSegments(videoRef.current.duration);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // Generate video segments based on analysis or duration
    const generateSegments = (duration) => {
        let newSegments = [];

        // If we have video analysis with segments, use those timestamps
        if (videoAnalysis && videoAnalysis.segments && videoAnalysis.segments.length > 0) {
            newSegments = videoAnalysis.segments.map((segment, index) => ({
                id: index,
                start: segment.start_time,
                end: segment.end_time,
                duration: segment.end_time - segment.start_time,
                description: segment.description || `Segment ${index + 1}`,
                selected: false
            }));
        } else {
            // Fallback to regular time-based segments
            for (let start = 0; start < duration; start += segmentDuration) {
                const end = Math.min(start + segmentDuration, duration);
                newSegments.push({
                    id: newSegments.length,
                    start: start,
                    end: end,
                    duration: end - start,
                    description: `Segment ${newSegments.length + 1}`,
                    selected: false
                });
            }
        }
        setSegments(newSegments);
    };

    // Update segments when segment duration changes or video analysis is available
    useEffect(() => {
        if (videoDuration > 0) {
            generateSegments(videoDuration);
        }
    }, [segmentDuration, videoDuration, videoAnalysis]);

    // Select/deselect segment
    const toggleSegmentSelection = (segmentId) => {
        setSegments(prev => prev.map(seg =>
            seg.id === segmentId ? { ...seg, selected: !seg.selected } : seg
        ));
    };

    // Play selected segment
    const playSegment = (segment) => {
        if (videoRef.current) {
            videoRef.current.currentTime = segment.start;
            videoRef.current.play();
            setIsPlaying(true);
            setSelectedSegment(segment);
        }
    };

    // Format time helper
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Video</h3>
                <p className="text-gray-600">
                    Drag and drop your video file or click to browse. We support MP4, MOV, AVI, and more.
                </p>
            </div>

            {!uploadedFile ? (
                <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragOver
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">📹</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                {isDragOver ? "Drop your video here" : "Choose a video file"}
                            </h4>
                            <p className="text-gray-600 mb-4">
                                Drag and drop your video file here, or click the button below to browse
                            </p>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileInput}
                                className="hidden"
                                id="video-upload"
                            />
                            <label
                                htmlFor="video-upload"
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                            >
                                <span className="mr-2">📁</span>
                                Choose File
                            </label>
                        </div>
                        <p className="text-sm text-gray-500">
                            Maximum file size: 500MB • Supported formats: MP4, MOV, AVI, MKV, WebM
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {isAnalyzing ? 'Analyzing video...' : isApiLoading ? 'Uploading to TwelveLabs...' : 'Uploading...'}
                                </span>
                                <span className="text-sm text-gray-500">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* API Response */}
                    {apiResponse && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-green-900 mb-3">✅ Upload Successful</h4>
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">API Response:</h5>
                                <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded overflow-x-auto">
                                    {JSON.stringify(apiResponse, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* API Error */}
                    {apiError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-red-900 mb-3">❌ Upload Failed</h4>
                            <div className="bg-white rounded-lg p-4 border border-red-200">
                                <p className="text-sm text-red-700 mb-2">Error message:</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    {apiError}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Analysis Error */}
                    {analysisError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Analysis Failed</h4>
                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                                <p className="text-sm text-yellow-700 mb-2">Error message:</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    {analysisError}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Video Analysis Results */}
                    {videoAnalysis && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-blue-900 mb-3">🎯 Video Analysis Complete</h4>
                            <div className="space-y-4">
                                {videoAnalysis.title && (
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-1">Title:</h5>
                                        <p className="text-sm text-gray-700">{videoAnalysis.title}</p>
                                    </div>
                                )}
                                {videoAnalysis.summary && (
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-1">Summary:</h5>
                                        <p className="text-sm text-gray-700">{videoAnalysis.summary}</p>
                                    </div>
                                )}
                                {videoAnalysis.keywords && videoAnalysis.keywords.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-1">Keywords:</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {videoAnalysis.keywords.map((keyword, index) => (
                                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {videoAnalysis.segments && videoAnalysis.segments.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-900 mb-2">Detected Segments:</h5>
                                        <p className="text-xs text-gray-600">
                                            {videoAnalysis.segments.length} segments found based on video content analysis
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* File Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🎬</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                    {uploadedFile.name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                    {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                                </p>
                                <div className="flex items-center space-x-2">
                                    {videoAnalysis ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Analysis Complete
                                        </span>
                                    ) : analysisError ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            ⚠️ Analysis Failed
                                        </span>
                                    ) : isAnalyzing ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            🔍 Analyzing...
                                        </span>
                                    ) : apiResponse ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Uploaded to TwelveLabs
                                        </span>
                                    ) : apiError ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            ✗ Upload failed
                                        </span>
                                    ) : isApiLoading ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            ⏳ Uploading...
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            📹 Ready for upload
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={resetUpload}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>
                    </div>

                    {/* Video Player */}
                    {videoUrl && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Video Preview</h4>
                            <div className="space-y-4">
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    className="w-full rounded-lg"
                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                    controls
                                />

                                {/* Custom Video Controls */}
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handlePlayPause}
                                            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                        >
                                            {isPlaying ? '⏸️' : '▶️'}
                                        </button>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>/</span>
                                                <span>{formatTime(videoDuration)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                                                    style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video Segmentation */}
                    {segments.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    {videoAnalysis && videoAnalysis.segments ? 'AI-Generated Segments' : 'Video Segments'}
                                </h4>
                                {!(videoAnalysis && videoAnalysis.segments) && (
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm text-gray-600">Segment Duration:</label>
                                        <select
                                            value={segmentDuration}
                                            onChange={(e) => setSegmentDuration(Number(e.target.value))}
                                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        >
                                            <option value={15}>15s</option>
                                            <option value={30}>30s</option>
                                            <option value={60}>1m</option>
                                            <option value={120}>2m</option>
                                            <option value={300}>5m</option>
                                        </select>
                                    </div>
                                )}
                                {videoAnalysis && videoAnalysis.segments && (
                                    <div className="text-sm text-gray-600">
                                        Segments based on video content analysis
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {segments.map((segment) => (
                                    <div
                                        key={segment.id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${segment.selected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => toggleSegmentSelection(segment.id)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                {segment.description || `Segment ${segment.id + 1}`}
                                            </span>
                                            {segment.selected && (
                                                <span className="text-blue-600 text-sm">✓ Selected</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-600 mb-3">
                                            {formatTime(segment.start)} - {formatTime(segment.end)}
                                            <span className="ml-2">({formatTime(segment.duration)})</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    playSegment(segment);
                                                }}
                                                className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                                            >
                                                Play
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Add edit functionality here
                                                }}
                                                className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {segments.some(seg => seg.selected) && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-blue-800">
                                            {segments.filter(seg => seg.selected).length} segment(s) selected
                                        </span>
                                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                                            Analyze Selected Segments
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={resetUpload}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Upload Another
                        </button>
                        <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Start Analysis
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Tips */}
            <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Upload Tips</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>• For best results, use high-quality video files (1080p or higher)</li>
                    <li>• Ensure good lighting and clear audio in your videos</li>
                    <li>• Keep videos under 10 minutes for faster processing</li>
                    <li>• Supported formats: MP4, MOV, AVI, MKV, WebM, FLV</li>
                </ul>
            </div>
        </div>
    );
}
