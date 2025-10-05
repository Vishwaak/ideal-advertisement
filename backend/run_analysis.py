#!/usr/bin/env python3
"""
Simple script to run persona analysis on your video.
"""

from persona_analyzer import PersonaAnalyzer
import json

def main():
    """Run analysis on the uploaded video"""
    
    print("Persona Analysis for Your Video")
    print("=" * 40)
    
    # Initialize analyzer
    analyzer = PersonaAnalyzer()
    
    # Your video ID (from the UI upload)
    video_id = "68e1a0e164ff05606e15297c"  # Actual video ID from TwelveLabs UI
    
    print(f"Analyzing video: {video_id}")
    print(f"Using {len(analyzer.personas)} personas")
    print()
    
    # Run analysis
    results = analyzer.analyze_video_for_all_personas(video_id)
    
    # Display summary
    print(analyzer.get_persona_summary(results))
    
    # Save results
    with open("video_analysis_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("Detailed results saved to: video_analysis_results.json")
    
    # Show a sample analysis
    print("\nSAMPLE ANALYSIS:")
    print("=" * 40)
    
    first_persona = list(results["persona_analyses"].keys())[0]
    analysis = results["persona_analyses"][first_persona]
    
    print(f"Persona: {analysis['persona']}")
    print(f"Category: {analysis['category']}")
    print(f"Motto: {analysis['motto']}")
    print(f"\nAnalysis:\n{analysis['analysis']}")

if __name__ == "__main__":
    main()
