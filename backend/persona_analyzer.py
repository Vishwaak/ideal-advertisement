#!/usr/bin/env python3
"""
Streamlined Persona Analysis Engine using TwelveLabs Summarize API.

This module analyzes video content from different persona perspectives using
the TwelveLabs summarize endpoint with persona-specific prompts.
"""

import os
import json
import requests
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class PersonaAnalyzer:
    """Analyzes video content from different persona perspectives using TwelveLabs Summarize API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("TWELVELABS_API_KEY") 
        self.base_url = "https://api.twelvelabs.io/v1.3"
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Load personas
        self.personas = self._load_personas()
        
        # Use existing index ID (matches the video ID)
        self.index_id = "68e1a0d666ecb2513d7ef19f"
    
    def _load_personas(self) -> List[Dict[str, Any]]:
        """Load persona definitions from JSON file"""
        try:
            with open("persona_categories.json", 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('personas', [])
        except FileNotFoundError:
            print("Warning: persona_categories.json not found")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing persona file: {e}")
            return []
    
    def _generate_persona_prompt(self, persona: Dict[str, Any]) -> str:
        """Generate a persona-specific prompt for video analysis"""
        
        name = persona.get("name", "Unknown")
        motto = persona.get("motto", "")
        summary = persona.get("summary", "")
        evaluation_focus = persona.get("evaluation_focus", [])
        emotional_triggers = persona.get("engagement_style", {}).get("emotional_triggers", [])
        positive_biases = persona.get("biases", {}).get("positive", [])
        negative_biases = persona.get("biases", {}).get("negative", [])
        output_tone = persona.get("output_tone", "neutral")
        
        prompt = f"""Analyze this video from the perspective of "{name}" - {motto}

Persona Profile:
- {summary}
- Evaluation Focus: {', '.join(evaluation_focus)}
- Emotional Triggers: {', '.join(emotional_triggers)}
- Positive Biases: {', '.join(positive_biases)}
- Negative Biases: {', '.join(negative_biases)}
- Preferred Tone: {output_tone}

Please provide a detailed analysis covering:
1. How well this content aligns with this persona's interests and values
2. What emotional responses this content would likely trigger
3. Specific strengths and weaknesses from this persona's perspective
4. Recommendations for improvement to better appeal to this persona
5. Overall score (0-10) for persona alignment

Format your response in a clear, {output_tone} tone that matches this persona's communication style."""

        return prompt
    
    def analyze_video_for_persona(self, video_id: str, persona: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a video for a specific persona using the summarize API"""
        
        try:
            # Generate persona-specific prompt
            prompt = self._generate_persona_prompt(persona)
            
            # Prepare request payload
            payload = {
                "video_id": video_id,
                "type": "summary",
                "prompt": prompt,
                "temperature": 0.3  # Slightly creative but focused
            }
            
            print(f"Analyzing for {persona['name']}...")
            
            # Make API request
            response = requests.post(
                f"{self.base_url}/summarize",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                
                return {
                    "persona": persona["name"],
                    "category": persona["category"],
                    "motto": persona["motto"],
                    "analysis": result.get("summary", ""),
                    "usage": result.get("usage", {}),
                    "status": "success"
                }
            else:
                return {
                    "persona": persona["name"],
                    "category": persona["category"],
                    "error": f"API Error: {response.status_code} - {response.text}",
                    "status": "error"
                }
                
        except Exception as e:
            return {
                "persona": persona["name"],
                "category": persona["category"],
                "error": str(e),
                "status": "error"
            }
    
    def analyze_video_for_all_personas(self, video_id: str) -> Dict[str, Any]:
        """Analyze a video for all personas"""
        
        print(f"Analyzing video {video_id} for {len(self.personas)} personas...")
        
        results = {
            "video_id": video_id,
            "persona_analyses": {},
            "summary": {
                "total_personas": len(self.personas),
                "successful_analyses": 0,
                "failed_analyses": 0
            }
        }
        
        # Analyze for each persona
        for persona in self.personas:
            analysis = self.analyze_video_for_persona(video_id, persona)
            results["persona_analyses"][persona["name"]] = analysis
            
            if analysis["status"] == "success":
                results["summary"]["successful_analyses"] += 1
            else:
                results["summary"]["failed_analyses"] += 1
        
        return results
    
    def get_persona_summary(self, results: Dict[str, Any]) -> str:
        """Generate a summary of all persona analyses"""
        
        successful = results["summary"]["successful_analyses"]
        total = results["summary"]["total_personas"]
        
        summary = f"Analysis Complete: {successful}/{total} personas analyzed successfully\n\n"
        
        # Group by category
        categories = {}
        for persona_name, analysis in results["persona_analyses"].items():
            if analysis["status"] == "success":
                category = analysis["category"]
                if category not in categories:
                    categories[category] = []
                categories[category].append(persona_name)
        
        for category, personas in categories.items():
            summary += f"{category.upper()} PERSONAS:\n"
            for persona in personas:
                summary += f"  + {persona}\n"
            summary += "\n"
        
        return summary


def main():
    """Example usage of the PersonaAnalyzer"""
    
    # Initialize analyzer
    analyzer = PersonaAnalyzer()
    
    print("Persona Analyzer - TwelveLabs Summarize API")
    print("=" * 50)
    print(f"Loaded {len(analyzer.personas)} personas")
    print(f"Using index: {analyzer.index_id}")
    
    # Example video ID (replace with actual video ID)
    video_id = "68e1911e17b39f617835d4ff"  # Your recent video ID
    
    print(f"\nAnalyzing video: {video_id}")
    
    # Analyze for all personas
    results = analyzer.analyze_video_for_all_personas(video_id)
    
    # Display summary
    print("\n" + analyzer.get_persona_summary(results))
    
    # Save detailed results
    with open("persona_analysis_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("Detailed results saved to: persona_analysis_results.json")
    
    # Display individual analyses
    print("\nINDIVIDUAL PERSONA ANALYSES:")
    print("=" * 50)
    
    for persona_name, analysis in results["persona_analyses"].items():
        if analysis["status"] == "success":
            print(f"\n{persona_name} ({analysis['category']}):")
            print(f"Motto: {analysis['motto']}")
            print(f"Analysis: {analysis['analysis'][:200]}...")
        else:
            print(f"\n{persona_name}: ERROR - {analysis.get('error', 'Unknown error')}")


if __name__ == "__main__":
    main()
