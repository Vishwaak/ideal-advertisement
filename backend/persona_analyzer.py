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
        
        # Use index ID from environment or default
        self.index_id = os.getenv("twelve_index_id", "68e1a0d666ecb2513d7ef19f")
    
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

Please provide your analysis in the following JSON format:

{{
  "content_overview": "A detailed overview of the video content and how it aligns with this persona's interests and values. Include emotional responses, strengths, weaknesses, and recommendations for improvement. Write in a {output_tone} tone that matches this persona's communication style.",
  "scores": {{
    "overall_alignment": 0-10,
    "emotional_engagement": 0-10,
    "content_relevance": 0-10,
    "visual_appeal": 0-10,
    "narrative_quality": 0-10
  }}
}}

Provide specific, detailed analysis in the content_overview section and precise numerical scores in the scores section."""

        return prompt
    
    def _calculate_overall_score(self, scores: Dict[str, Any]) -> float:
        """Calculate overall weighted score using equal weightage for all score categories"""
        
        if not scores:
            return 0.0
        
        # List of expected score categories (must be exact same for all personas)
        score_categories = [
            "overall_alignment",
            "emotional_engagement", 
            "content_relevance",
            "visual_appeal",
            "narrative_quality"
        ]
        
        # Get valid scores (only numeric values from the exact categories)
        valid_scores = []
        for category in score_categories:
            if category in scores and isinstance(scores[category], (int, float)):
                valid_scores.append(scores[category])
        
        # Calculate average (equal weightage) - must have all 5 categories
        if len(valid_scores) == len(score_categories):
            return round(sum(valid_scores) / len(valid_scores), 2)
        else:
            # If not all categories are present, return 0.0
            return 0.0
    
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
                summary_text = result.get("summary", "")
                
                # Try to parse the JSON response
                try:
                    # First try to parse the entire summary as JSON
                    try:
                        analysis_data = json.loads(summary_text)
                        content_overview = analysis_data.get("content_overview", summary_text)
                        scores = analysis_data.get("scores", {})
                    except json.JSONDecodeError:
                        # If that fails, try to extract JSON from the text
                        import re
                        json_match = re.search(r'\{.*\}', summary_text, re.DOTALL)
                        if json_match:
                            analysis_data = json.loads(json_match.group())
                            content_overview = analysis_data.get("content_overview", summary_text)
                            scores = analysis_data.get("scores", {})
                        else:
                            # Fallback if JSON parsing fails
                            content_overview = summary_text
                            scores = {}
                except (json.JSONDecodeError, AttributeError):
                    # Fallback if JSON parsing fails
                    content_overview = summary_text
                    scores = {}
                
                # Ensure all personas have the same scoring categories
                default_scores = {
                    "overall_alignment": 0,
                    "emotional_engagement": 0,
                    "content_relevance": 0,
                    "visual_appeal": 0,
                    "narrative_quality": 0
                }
                
                # Merge with default scores to ensure all categories exist
                for key in default_scores:
                    if key not in scores:
                        scores[key] = default_scores[key]
                
                # Calculate overall weighted score (equal weightage)
                overall_score = self._calculate_overall_score(scores)
                
                return {
                    "persona": persona["name"],
                    "category": persona["category"],
                    "motto": persona["motto"],
                    "content_overview": content_overview,
                    "scores": scores,
                    "overall_score": overall_score,
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
    
    def get_overall_scores_summary(self, results: Dict[str, Any]) -> str:
        """Generate a summary of overall scores for all personas"""
        
        summary = "OVERALL SCORES SUMMARY:\n"
        summary += "=" * 30 + "\n"
        
        # Sort personas by overall score (highest first)
        persona_scores = []
        for persona_name, analysis in results["persona_analyses"].items():
            if analysis["status"] == "success":
                overall_score = analysis.get("overall_score", 0)
                persona_scores.append((persona_name, overall_score, analysis["category"]))
        
        # Sort by score (descending)
        persona_scores.sort(key=lambda x: x[1], reverse=True)
        
        for persona_name, score, category in persona_scores:
            summary += f"{persona_name:<30} {score:>5.2f}/10 ({category})\n"
        
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
            print(f"Overall Score: {analysis.get('overall_score', 'N/A')}/10")
            content_overview = analysis.get('content_overview', 'N/A')
            print(f"Content Overview: {content_overview[:200]}...")
            scores = analysis.get('scores', {})
            if scores:
                print("Detailed Scores:")
                for score_name, score_value in scores.items():
                    print(f"  {score_name.replace('_', ' ').title()}: {score_value}")
        else:
            print(f"\n{persona_name}: ERROR - {analysis.get('error', 'Unknown error')}")


if __name__ == "__main__":
    main()
