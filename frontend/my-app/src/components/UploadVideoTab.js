import { useState, useCallback, useRef, useEffect } from "react";

export default function UploadVideoTab({ uploadedAds = [] }) {
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
    const [adConfidenceScores, setAdConfidenceScores] = useState({});
    const [isDragging, setIsDragging] = useState(false);
    const [draggedSegment, setDraggedSegment] = useState(null);
    const [segmentOrder, setSegmentOrder] = useState([]);
    const [isAnalyzingSegments, setIsAnalyzingSegments] = useState(false);
    const [stitchedVideoUrl, setStitchedVideoUrl] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
    const [isSequencePlaying, setIsSequencePlaying] = useState(false);

    const videoRef = useRef(null);
    const progressIntervalRef = useRef(null);

    // Get ad confidence score function
    const get_ad_confidence = async (videoId, segmentId, adSegmentId) => {
        // For demo purposes, return a mock confidence score
        // In a real implementation, this would call an API
        const mockScores = [85, 92, 78, 88, 95, 82, 90, 87];
        const randomScore = mockScores[Math.floor(Math.random() * mockScores.length)];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            confidence: randomScore,
            reasoning: `Ad segment matches well with video segment ${segmentId}`,
            timestamp: new Date().toISOString()
        };
    };

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
        const url = `http://127.0.0.1:8000/ad_placement?video_id=${videoid}`;
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        try {
            console.log('Making request to:', url);
            console.log('Video ID:', videoid);
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Analysis response:', data);
            return data;
        } catch (error) {
            console.error("Video analysis failed:", error);
            throw error;
        }
    };

    // dummmy data segments: [
        // { start_time: 0, end_time: 3, description: "hits a goal" },
       // { start_time: 3, end_time: 4, description: "goal celebration" },
       // { start_time: 4, end_time: 8, description: "celebration" }
    //]

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

    const handleFileDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleFileDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleFileDrop = (e) => {
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

        // First, add uploaded ads as segments
        if (uploadedAds && uploadedAds.length > 0) {
            uploadedAds.forEach((ad, index) => {
                const adSegment = {
                    id: `ad_${ad.id}`,
                    start: 0, // Ads don't have specific start/end times in the main video
                    end: ad.duration || 0,
                    duration: ad.duration || 0,
                    description: `Ad: ${ad.name}`,
                    selected: false,
                    type: 'ad',
                    adData: ad,
                    isAd: true,
                    confidence: null, // Will be calculated
                    draggable: true
                };
                newSegments.push(adSegment);
                
                // Calculate confidence score for this ad
                if (videoAnalysis && videoAnalysis.segments && videoAnalysis.segments.length > 0) {
                    // Calculate confidence against each video segment
                    videoAnalysis.segments.forEach((videoSegment, segIndex) => {
                        get_ad_confidence('main_video', segIndex, ad.id).then(result => {
                            setAdConfidenceScores(prev => ({
                                ...prev,
                                [`${ad.id}_${segIndex}`]: result.confidence
                            }));
                        });
                    });
                }
            });
        }

        // If we have video analysis with segments, use those timestamps
        if (videoAnalysis && videoAnalysis.segments && videoAnalysis.segments.length > 0) {
            const analysisSegments = videoAnalysis.segments.map((segment, index) => ({
                id: `analysis_${index}`,
                start: segment.start_time,
                end: segment.end_time,
                duration: segment.end_time - segment.start_time,
                description: segment.description || `Segment ${index + 1}`,
                selected: false,
                type: 'analysis',
                isAd: false
            }));
            newSegments = [...newSegments, ...analysisSegments];
        } else if (duration > 0) {
            // Fallback to regular time-based segments
            for (let start = 0; start < duration; start += segmentDuration) {
                const end = Math.min(start + segmentDuration, duration);
                newSegments.push({
                    id: `time_${newSegments.length}`,
                    start: start,
                    end: end,
                    duration: end - start,
                    description: `Segment ${newSegments.length + 1}`,
                    selected: false,
                    type: 'time',
                    isAd: false
                });
            }
        }
        setSegments(newSegments);
    };

    // Update segments when segment duration changes, video analysis is available, or uploaded ads change
    useEffect(() => {
        if (videoDuration > 0) {
            generateSegments(videoDuration);
        } else if (uploadedAds && uploadedAds.length > 0) {
            // Generate segments even without main video if we have ads
            generateSegments(0);
        }
    }, [segmentDuration, videoDuration, videoAnalysis, uploadedAds]);

    // Select/deselect segment
    const toggleSegmentSelection = (segmentId) => {
        setSegments(prev => prev.map(seg =>
            seg.id === segmentId ? { ...seg, selected: !seg.selected } : seg
        ));
    };

    // Play selected segment
    const playSegment = (segment) => {
        if (segment.isAd && segment.adData) {
            // For ads, open in a new tab or show in a modal
            window.open(segment.adData.url, '_blank');
            setSelectedSegment(segment);
        } else if (videoRef.current) {
            videoRef.current.currentTime = segment.start;
            videoRef.current.play();
            setIsPlaying(true);
            setSelectedSegment(segment);
        }
    };

    // Play segments in order (for timeline playback)
    const playSegmentSequence = () => {
        if (segments.length === 0) return;
        
        // Get segments in the correct order (selected segments first, then by order)
        const orderedSegments = segments
            .filter(seg => seg.selected || seg.order !== undefined)
            .sort((a, b) => {
                // First by selection status, then by order
                if (a.selected && !b.selected) return -1;
                if (!a.selected && b.selected) return 1;
                return (a.order || 0) - (b.order || 0);
            });
        
        if (orderedSegments.length === 0) {
            alert('No segments selected for playback. Please select segments first.');
            return;
        }
        
        setIsSequencePlaying(true);
        setCurrentPlayingIndex(0);
        
        const playNextSegment = (index) => {
            if (index >= orderedSegments.length) {
                console.log('Sequence playback complete');
                setIsPlaying(false);
                setIsSequencePlaying(false);
                setSelectedSegment(null);
                setCurrentPlayingIndex(null);
                return;
            }
            
            const segment = orderedSegments[index];
            setCurrentPlayingIndex(index);
            setSelectedSegment(segment);
            
            if (segment.isAd && segment.adData) {
                // For ads, show a modal or overlay instead of new tab
                showAdModal(segment, () => {
                    // Callback when ad is "finished"
                    setTimeout(() => playNextSegment(index + 1), 500);
                });
            } else if (videoRef.current && segment.start !== undefined && segment.end !== undefined) {
                // For video segments, play the specific time range
                videoRef.current.currentTime = segment.start;
                videoRef.current.play();
                setIsPlaying(true);
                
                // Set up automatic transition to next segment
                const handleTimeUpdate = () => {
                    if (videoRef.current && videoRef.current.currentTime >= segment.end) {
                        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                        playNextSegment(index + 1);
                    }
                };
                
                videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
            } else {
                // Skip invalid segments
                playNextSegment(index + 1);
            }
        };
        
        // Start playing from the first segment
        playNextSegment(0);
    };
    
    // Show ad modal for better UX
    const showAdModal = (segment, onComplete) => {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">📺 Ad: ${segment.description}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div class="mb-4">
                    <video 
                        src="${segment.adData.url}" 
                        controls 
                        className="w-full rounded-lg"
                        onended="this.closest('.fixed').remove(); ${onComplete.toString()}()"
                    ></video>
                </div>
                <div class="flex justify-between items-center text-sm text-gray-600">
                    <span>Ad ${currentIndex + 1} of ${segments.filter(s => s.selected).length}</span>
                    <button 
                        onclick="this.closest('.fixed').remove(); ${onComplete.toString()}()"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Skip Ad
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-close after ad duration
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
                onComplete();
            }
        }, (segment.duration || 5) * 1000);
    };

    // API function to create stitched video
    const createStitchedVideo = async (segmentsData) => {
        console.log('Sending segments data to API:', segmentsData);
        const url = 'http://127.0.0.1:8000/create-stitched-video'; // Backend API endpoint for stitching
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(segmentsData)
        };

        try {
            console.log('Making API request to:', url);
            console.log('Request options:', options);
            
            const response = await fetch(url, options);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Stitched video creation failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                url: url,
                options: options
            });
            throw error;
        }
    };

    // Analyze selected segments and create stitched video
    const analyzeSelectedSegments = async () => {
        const selectedSegments = segments.filter(seg => seg.selected);
        
        if (selectedSegments.length === 0) {
            alert('Please select at least one segment to analyze.');
            return;
        }

        setIsAnalyzingSegments(true);
        setAnalysisResult(null);
        setStitchedVideoUrl(null);

        try {
            // Prepare data for API call
            const segmentsData = {
                mainVideo: {
                    url: videoUrl,
                    duration: videoDuration,
                    segments: selectedSegments.filter(seg => !seg.isAd).map(segment => ({
                        id: segment.id,
                        start: segment.start,
                        end: segment.end,
                        duration: segment.duration,
                        description: segment.description,
                        type: 'video'
                    }))
                },
                adSegments: selectedSegments.filter(seg => seg.isAd).map(segment => ({
                    id: segment.id,
                    adData: segment.adData,
                    duration: segment.duration,
                    description: segment.description,
                    confidence: getConfidenceScore(segment),
                    type: 'ad'
                })),
                sequence: selectedSegments.map((segment, index) => ({
                    id: segment.id,
                    order: index,
                    type: segment.isAd ? 'ad' : 'video',
                    startTime: index * 10, // This will be calculated by the backend
                    endTime: (index * 10) + (segment.duration || 5)
                })),
                metadata: {
                    totalSegments: selectedSegments.length,
                    adSegments: selectedSegments.filter(seg => seg.isAd).length,
                    videoSegments: selectedSegments.filter(seg => !seg.isAd).length,
                    averageConfidence: selectedSegments.reduce((sum, seg) => {
                        const score = getConfidenceScore(seg);
                        return sum + (score || 0);
                    }, 0) / selectedSegments.length,
                    timestamp: new Date().toISOString()
                }
            };

            console.log('Sending segments data to API:', segmentsData);

            // Call API to create stitched video
            const apiResponse = await createStitchedVideo(segmentsData);
            
            console.log('API Response:', apiResponse);

            // Handle API response
            if (apiResponse.success && apiResponse.stitchedVideoUrl) {
                setStitchedVideoUrl(apiResponse.stitchedVideoUrl);
                
                // Update segments with new order from API response
                if (apiResponse.sequence) {
                    setSegments(prev => prev.map(seg => {
                        const apiSegment = apiResponse.sequence.find(s => s.id === seg.id);
                        if (apiSegment) {
                            return {
                                ...seg,
                                order: apiSegment.order,
                                startTime: apiSegment.startTime,
                                endTime: apiSegment.endTime,
                                selected: true
                            };
                        }
                        return seg;
                    }));
                }

                // Set analysis result
                setAnalysisResult({
                    totalSegments: apiResponse.metadata?.totalSegments || selectedSegments.length,
                    totalDuration: apiResponse.metadata?.totalDuration || selectedSegments.reduce((sum, seg) => sum + (seg.duration || 5), 0),
                    adSegments: apiResponse.metadata?.adSegments || selectedSegments.filter(seg => seg.isAd).length,
                    videoSegments: apiResponse.metadata?.videoSegments || selectedSegments.filter(seg => !seg.isAd).length,
                    confidence: apiResponse.metadata?.averageConfidence || selectedSegments.reduce((sum, seg) => {
                        const score = getConfidenceScore(seg);
                        return sum + (score || 0);
                    }, 0) / selectedSegments.length,
                    timestamp: apiResponse.metadata?.timestamp || new Date().toISOString(),
                    stitchedVideoId: apiResponse.stitchedVideoId,
                    processingTime: apiResponse.processingTime
                });

            } else {
                throw new Error(apiResponse.message || 'Failed to create stitched video');
            }

        } catch (error) {
            console.error('Analysis failed:', error);
            
            // Fallback to demo mode if API fails
            console.log('Falling back to demo mode...');
            
            // Create new segment order based on selected segments
            const newSegmentOrder = selectedSegments.map((segment, index) => ({
                ...segment,
                order: index,
                startTime: index * 10,
                endTime: (index * 10) + (segment.duration || 5),
                selected: true
            }));

            // Update segments with new order
            setSegments(prev => prev.map(seg => {
                const selectedSeg = selectedSegments.find(s => s.id === seg.id);
                if (selectedSeg) {
                    const newOrder = selectedSegments.indexOf(selectedSeg);
                    return {
                        ...seg,
                        order: newOrder,
                        startTime: newOrder * 10,
                        endTime: (newOrder * 10) + (seg.duration || 5),
                        selected: true
                    };
                }
                return seg;
            }));

            // Use main video as fallback stitched video
            if (videoUrl) {
                setStitchedVideoUrl(videoUrl);
            } else {
                const demoVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
                setStitchedVideoUrl(demoVideoUrl);
            }

            // Set analysis result
            setAnalysisResult({
                totalSegments: selectedSegments.length,
                totalDuration: selectedSegments.reduce((sum, seg) => sum + (seg.duration || 5), 0),
                adSegments: selectedSegments.filter(seg => seg.isAd).length,
                videoSegments: selectedSegments.filter(seg => !seg.isAd).length,
                confidence: selectedSegments.reduce((sum, seg) => {
                    const score = getConfidenceScore(seg);
                    return sum + (score || 0);
                }, 0) / selectedSegments.length,
                timestamp: new Date().toISOString(),
                isDemo: true
            });

            alert(`API call failed: ${error.message}. Using demo mode.`);
        } finally {
            setIsAnalyzingSegments(false);
        }
    };

    // Format time helper
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Drag and drop handlers
    const handleDragStart = (e, segment) => {
        if (segment.isAd && segment.draggable) {
            setIsDragging(true);
            setDraggedSegment(segment);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', segment.id);
            e.target.style.opacity = '0.5';
            e.target.style.transform = 'rotate(2deg)';
        }
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        setDraggedSegment(null);
        setDragOverIndex(null);
        e.target.style.opacity = '1';
        e.target.style.transform = 'rotate(0deg)';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = (e) => {
        // Only clear drag over if we're leaving the drop zone entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const draggedSegmentId = e.dataTransfer.getData('text/plain');
        
        if (draggedSegmentId) {
            const newSegments = [...segments];
            const draggedIndex = newSegments.findIndex(seg => seg.id === draggedSegmentId);
            
            if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
                // Remove dragged segment from its current position
                const [draggedSeg] = newSegments.splice(draggedIndex, 1);
                
                // Adjust target index if we removed an item before it
                const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
                
                // Insert it at the target position
                newSegments.splice(adjustedTargetIndex, 0, draggedSeg);
                setSegments(newSegments);
            }
        }
        
        setDragOverIndex(null);
    };

    // Get confidence score for display
    const getConfidenceScore = (segment) => {
        if (!segment.isAd) return null;
        // Find the highest confidence score for this ad
        const scores = Object.entries(adConfidenceScores)
            .filter(([key]) => key.startsWith(segment.adData?.id))
            .map(([, score]) => score);
        return scores.length > 0 ? Math.max(...scores) : null;
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
                    onDragOver={handleFileDragOver}
                    onDragLeave={handleFileDragLeave}
                    onDrop={handleFileDrop}
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

                    {/* Uploaded Ads Info */}
                    {uploadedAds && uploadedAds.length > 0 && !uploadedFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-green-900 mb-3">📺 Uploaded Ads Available</h4>
                            <p className="text-sm text-green-800 mb-4">
                                You have {uploadedAds.length} ad(s) ready to use. Upload a main video to see all segments together, or work with your ads directly.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {uploadedAds.map((ad) => (
                                    <div key={ad.id} className="bg-white rounded-lg p-3 border border-green-200">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-green-600">📺</span>
                                            <span className="text-sm font-medium text-gray-900 truncate" title={ad.name}>
                                                {ad.name}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatFileSize(ad.size)} • {ad.duration > 0 ? formatTime(ad.duration) : 'Loading...'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Video Segmentation */}
                    {segments.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">
                                    {uploadedAds && uploadedAds.length > 0 && segments.some(s => s.isAd) 
                                        ? 'Available Segments & Ads' 
                                        : videoAnalysis && videoAnalysis.segments 
                                            ? 'AI-Generated Segments' 
                                            : 'Video Segments'
                                    }
                                </h4>
                                <div className="flex items-center space-x-4">
                                    {uploadedAds && uploadedAds.length > 0 && (
                                        <div className="text-sm text-green-600">
                                            📺 {uploadedAds.length} ad(s) available
                                        </div>
                                    )}
                                    {!(videoAnalysis && videoAnalysis.segments) && !uploadedAds?.length && (
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
                            </div>

                            <div className="space-y-4">
                                {segments.map((segment, index) => (
                                    <div key={segment.id} className="relative">
                                        {/* Drop zone indicator */}
                                        {isDragging && dragOverIndex === index && (
                                            <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 animate-pulse"></div>
                                        )}
                                        
                                        {/* Drag over highlight */}
                                        {isDragging && dragOverIndex === index && (
                                            <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg bg-blue-50 bg-opacity-50 z-5"></div>
                                        )}
                                        
                                        <div
                                            draggable={segment.isAd && segment.draggable}
                                            onDragStart={(e) => handleDragStart(e, segment)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={`border rounded-lg p-4 transition-all ${
                                                segment.isAd 
                                                    ? segment.selected
                                                        ? 'border-green-500 bg-green-50'
                                                        : isDragging && draggedSegment?.id === segment.id
                                                            ? 'border-green-400 bg-green-100 opacity-50'
                                                            : segment.draggable
                                                                ? 'border-green-200 hover:border-green-300 bg-green-25 cursor-move'
                                                                : 'border-green-200 hover:border-green-300 bg-green-25 cursor-pointer'
                                                    : segment.selected
                                                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                                        : isDragging
                                                            ? 'border-blue-300 bg-blue-25 cursor-pointer'
                                                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                            }`}
                                            onClick={() => toggleSegmentSelection(segment.id)}
                                        >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                {segment.isAd && <span className="text-green-600 text-sm">📺</span>}
                                                <span className="text-sm font-medium text-gray-900">
                                                    {segment.description || `Segment ${segment.id + 1}`}
                                                </span>
                                                {segment.isAd && segment.draggable && (
                                                    <span className="text-xs text-gray-400 cursor-move" title="Drag to reorder">
                                                        ⋮⋮
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {segment.selected && (
                                                    <span className={`text-sm ${segment.isAd ? 'text-green-600' : 'text-blue-600'}`}>
                                                        ✓ Selected
                                                    </span>
                                                )}
                                                {segment.isAd && segment.draggable && (
                                                    <span className="text-xs text-gray-400" title="Drag to reorder">
                                                        Drag
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {segment.isAd ? (
                                            <div className="space-y-2">
                                                <div className="text-xs text-gray-600">
                                                    Duration: {formatTime(segment.duration)}
                                                </div>
                                                {segment.adData && (
                                                    <div className="text-xs text-gray-500">
                                                        Size: {formatFileSize(segment.adData.size)}
                                                    </div>
                                                )}
                                                {getConfidenceScore(segment) ? (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-gray-500">Confidence:</span>
                                                        <div className="flex items-center space-x-1">
                                                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                <div 
                                                                    className={`h-1.5 rounded-full ${
                                                                        getConfidenceScore(segment) >= 90 
                                                                            ? 'bg-green-500' 
                                                                            : getConfidenceScore(segment) >= 70 
                                                                                ? 'bg-yellow-500' 
                                                                                : 'bg-red-500'
                                                                    }`}
                                                                    style={{ width: `${getConfidenceScore(segment)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-700">
                                                                {getConfidenceScore(segment)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-gray-500">Confidence:</span>
                                                        <div className="flex items-center space-x-1">
                                                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                <div className="w-4 bg-gray-300 h-1.5 rounded-full animate-pulse"></div>
                                                            </div>
                                                            <span className="text-xs text-gray-400">Calculating...</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-600 mb-3">
                                                {formatTime(segment.start)} - {formatTime(segment.end)}
                                                <span className="ml-2">({formatTime(segment.duration)})</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    playSegment(segment);
                                                }}
                                                className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                                                    segment.isAd 
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {segment.isAd ? 'Preview Ad' : 'Play'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (segment.isAd) {
                                                        // Add ad to video timeline
                                                        alert(`Ad "${segment.description}" added to video timeline!`);
                                                    } else {
                                                        // Add edit functionality here
                                                        alert('Edit functionality coming soon!');
                                                    }
                                                }}
                                                className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                                                    segment.isAd 
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                }`}
                                            >
                                                {segment.isAd ? 'Add to Timeline' : 'Edit'}
                                            </button>
                                        </div>
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
                                        <button 
                                            onClick={analyzeSelectedSegments}
                                            disabled={isAnalyzingSegments}
                                            className={`px-4 py-2 text-white text-sm rounded transition-colors ${
                                                isAnalyzingSegments 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {isAnalyzingSegments ? 'Analyzing...' : 'Analyze Selected Segments'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Analysis Loading */}
                            {isAnalyzingSegments && (
                                <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-blue-900">Analyzing Selected Segments</h4>
                                            <p className="text-sm text-blue-700">Processing segments and creating stitched video...</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 w-full bg-blue-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                            )}

                            {/* Analysis Results */}
                            {analysisResult && (
                                <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="text-lg font-semibold text-green-900 mb-4">✅ Analysis Complete</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <div className="text-2xl font-bold text-green-600">{analysisResult.totalSegments}</div>
                                            <div className="text-sm text-gray-600">Total Segments</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <div className="text-2xl font-bold text-green-600">{formatTime(analysisResult.totalDuration)}</div>
                                            <div className="text-sm text-gray-600">Total Duration</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <div className="text-2xl font-bold text-green-600">{analysisResult.adSegments}</div>
                                            <div className="text-sm text-gray-600">Ad Segments</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-green-200">
                                            <div className="text-2xl font-bold text-green-600">{Math.round(analysisResult.confidence)}%</div>
                                            <div className="text-sm text-gray-600">Avg Confidence</div>
                                        </div>
                                    </div>
                                    
                                    {stitchedVideoUrl && (
                                        <div className="mt-4">
                                            <h5 className="text-md font-semibold text-green-900 mb-3">
                                                Stitched Video
                                                {analysisResult.isDemo && (
                                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                        Demo Mode
                                                    </span>
                                                )}
                                            </h5>
                                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                                {/* Video Info */}
                                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Video ID:</span>
                                                            <div className="font-mono text-xs">{analysisResult.stitchedVideoId || 'N/A'}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Processing Time:</span>
                                                            <div className="text-xs">{analysisResult.processingTime || 'N/A'}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Total Duration:</span>
                                                            <div className="text-xs">{formatTime(analysisResult.totalDuration)}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Segments:</span>
                                                            <div className="text-xs">{analysisResult.totalSegments}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <video
                                                    src={stitchedVideoUrl}
                                                    className="w-full rounded-lg"
                                                    controls
                                                    onError={(e) => {
                                                        console.error('Video playback error:', e);
                                                        // Show fallback message
                                                        const videoElement = e.target;
                                                        videoElement.style.display = 'none';
                                                        const fallbackDiv = document.createElement('div');
                                                        fallbackDiv.className = 'p-8 text-center bg-gray-100 rounded-lg';
                                                        fallbackDiv.innerHTML = `
                                                            <div class="text-gray-600 mb-4">
                                                                <div class="text-4xl mb-2">🎬</div>
                                                                <h3 class="text-lg font-semibold mb-2">Stitched Video Ready</h3>
                                                                <p class="text-sm">Video contains ${analysisResult.totalSegments} segments with ${formatTime(analysisResult.totalDuration)} total duration</p>
                                                                ${analysisResult.stitchedVideoId ? `<p class="text-xs text-gray-500 mt-2">Video ID: ${analysisResult.stitchedVideoId}</p>` : ''}
                                                            </div>
                                                            <div class="text-xs text-gray-500">
                                                                ${analysisResult.isDemo ? 'Demo mode: Using fallback video. In production, this would be the actual stitched video combining all selected segments.' : 'This is the stitched video combining all selected segments in the correct order.'}
                                                            </div>
                                                        `;
                                                        videoElement.parentNode.insertBefore(fallbackDiv, videoElement.nextSibling);
                                                    }}
                                                    onLoadStart={() => {
                                                        console.log('Stitched video loading started');
                                                    }}
                                                    onCanPlay={() => {
                                                        console.log('Stitched video can play');
                                                    }}
                                                />
                                                
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const link = document.createElement('a');
                                                            link.href = stitchedVideoUrl;
                                                            link.download = `stitched-video-${Date.now()}.mp4`;
                                                            link.click();
                                                        }}
                                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                                    >
                                                        📥 Download
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(stitchedVideoUrl);
                                                            alert('Video URL copied to clipboard!');
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        📋 Copy URL
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            // Play the segment sequence instead
                                                            playSegmentSequence();
                                                        }}
                                                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                                                    >
                                                        ▶️ Play Sequence
                                                    </button>
                                                    {analysisResult.stitchedVideoId && (
                                                        <button
                                                            onClick={() => {
                                                                // Share video functionality
                                                                const shareUrl = `${window.location.origin}/video/${analysisResult.stitchedVideoId}`;
                                                                navigator.clipboard.writeText(shareUrl);
                                                                alert('Share URL copied to clipboard!');
                                                            }}
                                                            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                                                        >
                                                            🔗 Share
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-xs text-blue-800">
                                                        {analysisResult.isDemo ? (
                                                            <>
                                                                <strong>Demo Mode:</strong> API call failed, using fallback video. 
                                                                In production, this would be the actual stitched video combining all selected segments.
                                                            </>
                                                        ) : (
                                                            <>
                                                                <strong>Production Mode:</strong> This is the stitched video created by the API, 
                                                                combining all selected segments in the correct order with proper transitions.
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Segment Timeline */}
                            {segments.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h5 className="text-sm font-semibold text-gray-900 mb-3">
                                        Current Segment Order
                                        {isSequencePlaying && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                ▶️ Playing
                                            </span>
                                        )}
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {segments
                                            .filter(seg => seg.selected || seg.order !== undefined)
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((segment, index) => (
                                            <div
                                                key={segment.id}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                                    isSequencePlaying && currentPlayingIndex === index
                                                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400 animate-pulse'
                                                        : segment.isAd 
                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                }`}
                                            >
                                                {index + 1}. {segment.isAd ? '📺' : '🎬'} {segment.description}
                                                {segment.order !== undefined && (
                                                    <span className="ml-1 text-xs opacity-75">(Ordered)</span>
                                                )}
                                                {isSequencePlaying && currentPlayingIndex === index && (
                                                    <span className="ml-1 text-xs font-bold">▶️</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                        💡 Drag ad segments (📺) to reorder them between video segments (🎬). Look for the ⋮⋮ icon to identify draggable segments.
                                    </p>
                                    <div className="mt-3 flex space-x-2">
                                        <button
                                            onClick={playSegmentSequence}
                                            disabled={isSequencePlaying}
                                            className={`px-4 py-2 text-white text-sm rounded transition-colors ${
                                                isSequencePlaying 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                        >
                                            {isSequencePlaying ? '▶️ Playing...' : '▶️ Play Timeline'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (videoRef.current) {
                                                    videoRef.current.pause();
                                                    setIsPlaying(false);
                                                }
                                                setIsSequencePlaying(false);
                                                setCurrentPlayingIndex(null);
                                                setSelectedSegment(null);
                                            }}
                                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                        >
                                            ⏸️ Stop
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
