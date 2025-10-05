#!/usr/bin/env python3
"""
Multi-Video Persona Analysis Script
Analyzes multiple videos for all personas and stores results in one comprehensive JSON file.
"""

from persona_analyzer import PersonaAnalyzer
import json
import os
from dotenv import load_dotenv

def persona_main(main_video_id,ads_id=[]):
    """Run analysis on all videos"""
    
    # Load environment variables
    load_dotenv()
    
    print("Multi-Video Persona Analysis")
    print("=" * 50)
    
    # Initialize analyzer
    analyzer = PersonaAnalyzer()
    
    # Get video IDs from environment
    main_sports_video_id = main_video_id
    ad_volkswagen_video_id = ads_id[1]
    ad_pg_video_id = ads_id[0]
    ad_coco_cola_3_video_id = ads_id[2]
    
    # Define video information
    videos = {
        "main_sports_video": {
            "id": main_sports_video_id,
            "name": "Main Sports Video",
            "description": "Main sports video where ads would be placed"
        },
        "ad_volkswagen": {
            "id": ad_volkswagen_video_id,
            "name": "Volkswagen Ad",
            "description": "Volkswagen advertisement video"
        },
        "ad_pg": {
            "id": ad_pg_video_id,
            "name": "PG Ad",
            "description": "PG advertisement video"
        },
        "ad_coco_cola_3": {
            "id": ad_coco_cola_3_video_id,
            "name": "Coca-Cola Ad 3",
            "description": "Coca-Cola advertisement video"
        }
    }
    
    print(f"Analyzing {len(videos)} videos for {len(analyzer.personas)} personas")
    print()
    
    # Comprehensive results structure
    comprehensive_results = {
        "analysis_metadata": {
            "total_videos": len(videos),
            "total_personas": len(analyzer.personas),
            "index_id": os.getenv("twelve_index_id"),
            "analysis_timestamp": None
        },
        "video_analyses": {},
        "summary": {
            "total_analyses": 0,
            "successful_analyses": 0,
            "failed_analyses": 0
        }
    }
    
    # Analyze each video
    for video_key, video_info in videos.items():
        video_id = video_info["id"]
        video_name = video_info["name"]
        
        if not video_id:
            print(f"WARNING: Skipping {video_name}: No video ID found in environment")
            continue
            
        print(f"Analyzing: {video_name} ({video_id})")
        print("-" * 40)
        
        # Run analysis for this video
        video_results = analyzer.analyze_video_for_all_personas(video_id)
        
        # Add video metadata
        video_results["video_metadata"] = {
            "video_key": video_key,
            "video_name": video_name,
            "video_description": video_info["description"],
            "video_id": video_id
        }
        
        # Store in comprehensive results
        comprehensive_results["video_analyses"][video_key] = video_results
        
        # Update summary counts
        comprehensive_results["summary"]["total_analyses"] += video_results["summary"]["total_personas"]
        comprehensive_results["summary"]["successful_analyses"] += video_results["summary"]["successful_analyses"]
        comprehensive_results["summary"]["failed_analyses"] += video_results["summary"]["failed_analyses"]
        
        # Display video summary
        print(analyzer.get_persona_summary(video_results))
        print(analyzer.get_overall_scores_summary(video_results))
        print()
    
    # Add timestamp
    from datetime import datetime
    comprehensive_results["analysis_metadata"]["analysis_timestamp"] = datetime.now().isoformat()
    
    # Save comprehensive results
    output_file = "json/comprehensive_video_analysis_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(comprehensive_results, f, indent=2, ensure_ascii=False)
    
    print("=" * 50)
    print("COMPREHENSIVE ANALYSIS COMPLETE")
    print("=" * 50)
    print(f"Total Analyses: {comprehensive_results['summary']['total_analyses']}")
    print(f"Successful: {comprehensive_results['summary']['successful_analyses']}")
    print(f"Failed: {comprehensive_results['summary']['failed_analyses']}")
    print(f"Results saved to: {output_file}")
    
    # Display overall ranking across all videos
    print("\nOVERALL RANKING ACROSS ALL VIDEOS:")
    print("=" * 50)
    
    # Collect all persona scores across all videos
    all_scores = {}
    for video_key, video_data in comprehensive_results["video_analyses"].items():
        video_name = video_data["video_metadata"]["video_name"]
        for persona_name, analysis in video_data["persona_analyses"].items():
            if analysis["status"] == "success":
                if persona_name not in all_scores:
                    all_scores[persona_name] = []
                all_scores[persona_name].append({
                    "video": video_name,
                    "score": analysis.get("overall_score", 0)
                })
    
    # Calculate average scores and display ranking
    persona_averages = []
    for persona_name, scores in all_scores.items():
        avg_score = sum(s["score"] for s in scores) / len(scores)
        persona_averages.append((persona_name, avg_score, len(scores)))
    
    # Sort by average score
    persona_averages.sort(key=lambda x: x[1], reverse=True)
    
    for i, (persona_name, avg_score, video_count) in enumerate(persona_averages, 1):
        print(f"{i:2d}. {persona_name:<30} {avg_score:>5.2f}/10 (across {video_count} videos)")
    
    # Calculate Persona Affinity Metrics for each video
    print("\nPERSONA AFFINITY METRICS:")
    print("=" * 50)
    
    video_affinities = {}
    for video_key, video_data in comprehensive_results["video_analyses"].items():
        video_name = video_data["video_metadata"]["video_name"]
        
        # Separate personas by category
        general_scores = []
        sports_scores = []
        
        for persona_name, analysis in video_data["persona_analyses"].items():
            if analysis["status"] == "success":
                score = analysis.get("overall_score", 0)
                category = analysis.get("category", "general")
                
                if category == "general":
                    general_scores.append(score)
                elif category == "sports":
                    sports_scores.append(score)
        
        # Calculate category averages
        general_avg = sum(general_scores) / len(general_scores) if general_scores else 0
        sports_avg = sum(sports_scores) / len(sports_scores) if sports_scores else 0
        
        # Calculate weighted persona affinity (40% general, 60% sports)
        persona_affinity = (general_avg * 0.4) + (sports_avg * 0.6)
        
        video_affinities[video_name] = {
            "persona_affinity": round(persona_affinity, 2),
            "general_avg": round(general_avg, 2),
            "sports_avg": round(sports_avg, 2),
            "general_count": len(general_scores),
            "sports_count": len(sports_scores)
        }
        
        print(f"{video_name}:")
        print(f"  General Personas: {general_avg:.2f}/10 (n={len(general_scores)})")
        print(f"  Sports Personas:  {sports_avg:.2f}/10 (n={len(sports_scores)})")
        print(f"  Persona Affinity: {persona_affinity:.2f}/10 (40% general + 60% sports)")
        print()
    
    # Sort videos by persona affinity
    sorted_videos = sorted(video_affinities.items(), key=lambda x: x[1]["persona_affinity"], reverse=True)
    
    print("VIDEO RANKING BY PERSONA AFFINITY:")
    print("=" * 50)
    for i, (video_name, metrics) in enumerate(sorted_videos, 1):
        print(f"{i}. {video_name:<25} {metrics['persona_affinity']:>5.2f}/10")
    
    # Add persona affinity metrics to comprehensive results
    comprehensive_results["persona_affinity_metrics"] = {
        "weighting": {
            "general_personas": "40%",
            "sports_personas": "60%"
        },
        "video_affinities": video_affinities,
        "ranking": [{"rank": i, "video": name, "affinity": metrics["persona_affinity"]} 
                   for i, (name, metrics) in enumerate(sorted_videos, 1)]
    }
    
    # Save updated comprehensive results
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(comprehensive_results, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated results with persona affinity metrics saved to: {output_file}")
    print("\nHACKATHON READY! All analyses complete with persona affinity metrics.")

# if __name__ == "__main__":
#     main()
