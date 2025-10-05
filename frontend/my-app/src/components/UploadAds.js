import { useState, useCallback, useRef, useEffect } from "react";

export default function UploadAds({ onAdsUpdate, onSwitchTab }) {
    const [uploadedAds, setUploadedAds] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadErrors, setUploadErrors] = useState({});

    // API Upload function for ads
    const uploadAdToTwelveLabs = async (file, adId) => {
        const url = 'https://api.twelvelabs.io/v1.3/tasks';
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
            // For demo purposes, return mock data
            return { 
                id: `ad_${adId}_${Date.now()}`, 
                video_id: `ad_${adId}_${Date.now()}`,
                name: file.name,
                size: file.size,
                type: file.type
            };
            
            const response = await fetch(url, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error('Ad upload error:', error);
            throw error;
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const files = Array.from(acceptedFiles);
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadErrors({});

        const newAds = [];
        const progress = {};
        const errors = {};

        // Initialize progress for all files
        files.forEach((file, index) => {
            const adId = `ad_${Date.now()}_${index}`;
            progress[adId] = 0;
        });

        setUploadProgress(progress);

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const adId = `ad_${Date.now()}_${i}`;
            
            try {
                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => ({
                        ...prev,
                        [adId]: Math.min(prev[adId] + 10, 90)
                    }));
                }, 200);

                // Upload to TwelveLabs API
                const uploadResult = await uploadAdToTwelveLabs(file, adId);
                
                clearInterval(progressInterval);
                
                // Update progress to 100%
                setUploadProgress(prev => ({
                    ...prev,
                    [adId]: 100
                }));

                // Create ad object
                const adObject = {
                    id: adId,
                    file: file,
                    url: URL.createObjectURL(file),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    duration: 0, // Will be set when video loads
                    uploadResult: uploadResult,
                    uploadedAt: new Date().toISOString(),
                    status: 'uploaded'
                };

                newAds.push(adObject);

            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                errors[adId] = error.message;
                setUploadErrors(prev => ({ ...prev, [adId]: error.message }));
            }
        }

        // Add new ads to existing ones
        if (newAds.length > 0) {
            const updatedAds = [...uploadedAds, ...newAds];
            setUploadedAds(updatedAds);
            
            // Notify parent component about the update
            if (onAdsUpdate) {
                onAdsUpdate(updatedAds);
            }
        }

        setIsUploading(false);
        
        // Clear progress after a delay
        setTimeout(() => {
            setUploadProgress({});
        }, 2000);
    }, [uploadedAds, onAdsUpdate]);

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

    const removeAd = (adId) => {
        const updatedAds = uploadedAds.filter(ad => ad.id !== adId);
        setUploadedAds(updatedAds);
        
        // Notify parent component
        if (onAdsUpdate) {
            onAdsUpdate(updatedAds);
        }
    };

    const clearAllAds = () => {
        setUploadedAds([]);
        setUploadProgress({});
        setUploadErrors({});
        
        // Notify parent component
        if (onAdsUpdate) {
            onAdsUpdate([]);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Ads</h3>
                <p className="text-gray-600">
                    Upload multiple ad videos that will be used as segments in your main video analysis.
                </p>
            </div>

            {uploadedAds.length === 0 ? (
                <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                        isDragOver
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">📺</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                {isDragOver ? "Drop your ads here" : "Choose ad videos"}
                            </h4>
                            <p className="text-gray-600 mb-4">
                                Drag and drop multiple ad videos here, or click the button below to browse
                            </p>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileInput}
                                className="hidden"
                                id="ads-upload"
                                multiple
                            />
                            <label
                                htmlFor="ads-upload"
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                            >
                                <span className="mr-2">📁</span>
                                Choose Multiple Files
                            </label>
                        </div>
                        <p className="text-sm text-gray-500">
                            Maximum file size: 500MB per file • Supported formats: MP4, MOV, AVI, MKV, WebM
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Upload Progress */}
                    {isUploading && Object.keys(uploadProgress).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4">Uploading Ads...</h4>
                            <div className="space-y-3">
                                {Object.entries(uploadProgress).map(([adId, progress]) => (
                                    <div key={adId}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">
                                                Uploading ad {adId.split('_')[2] ? `#${parseInt(adId.split('_')[2]) + 1}` : ''}
                                            </span>
                                            <span className="text-sm text-gray-500">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload Errors */}
                    {Object.keys(uploadErrors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-red-900 mb-3">❌ Upload Errors</h4>
                            <div className="space-y-2">
                                {Object.entries(uploadErrors).map(([adId, error]) => (
                                    <div key={adId} className="bg-white rounded-lg p-3 border border-red-200">
                                        <p className="text-sm text-red-700">
                                            Ad {adId.split('_')[2] ? `#${parseInt(adId.split('_')[2]) + 1}` : ''}: {error}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Uploaded Ads Grid */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-semibold text-gray-900">
                                Uploaded Ads ({uploadedAds.length})
                            </h4>
                            <div className="flex space-x-2">
                                <button
                                    onClick={clearAllAds}
                                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => document.getElementById('ads-upload').click()}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add More
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uploadedAds.map((ad) => (
                                <div key={ad.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="space-y-3">
                                        {/* Video Preview */}
                                        <div className="relative">
                                            <video
                                                src={ad.url}
                                                className="w-full h-32 object-cover rounded-lg"
                                                onLoadedMetadata={(e) => {
                                                    setUploadedAds(prev => 
                                                        prev.map(a => 
                                                            a.id === ad.id 
                                                                ? { ...a, duration: e.target.duration }
                                                                : a
                                                        )
                                                    );
                                                }}
                                            />
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    onClick={() => removeAd(ad.id)}
                                                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>

                                        {/* Ad Info */}
                                        <div>
                                            <h5 className="font-medium text-gray-900 text-sm truncate" title={ad.name}>
                                                {ad.name}
                                            </h5>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(ad.size)} • {ad.type}
                                            </p>
                                            {ad.duration > 0 && (
                                                <p className="text-xs text-gray-500">
                                                    Duration: {formatTime(ad.duration)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✓ Ready
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(ad.uploadedAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => document.getElementById('ads-upload').click()}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Add More Ads
                        </button>
                        {uploadedAds.length > 0 && (
                            <button 
                                onClick={() => {
                                    if (onSwitchTab) {
                                        onSwitchTab("Video");
                                    } else {
                                        alert(`${uploadedAds.length} ad(s) uploaded successfully! Switch to the Video tab to use them as segments.`);
                                    }
                                }}
                                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Proceed to Video Analysis
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Upload Tips */}
            <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Ad Upload Tips</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Upload multiple ad videos to create a comprehensive ad library</li>
                    <li>• These ads will be available as segments in your main video analysis</li>
                    <li>• Keep ads short and focused (15-60 seconds recommended)</li>
                    <li>• Ensure good quality and clear audio for better analysis results</li>
                    <li>• Supported formats: MP4, MOV, AVI, MKV, WebM, FLV</li>
                </ul>
            </div>
        </div>
    );
}