"""
Embedding-based Similarity Analysis for Contextual Advertising
Uses existing persona analysis data to create embeddings and calculate similarity scores
"""

import json
from typing import Dict, Any

class EmbeddingSimilarityAnalyzer:
    def __init__(self, results_file: str = "comprehensive_video_analysis_results.json"):
        """Initialize with existing analysis results"""
        self.results_file = results_file
        self.results = self._load_results()
        
    def _load_results(self) -> Dict[str, Any]:
        """Load existing analysis results"""
        try:
            with open(self.results_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Error: {self.results_file} not found!")
            return {}
    
    def _extract_content_overviews(self) -> Dict[str, str]:
        """Extract content overviews for each video"""
        content_overviews = {}
        
        for video_key, video_data in self.results.get("video_analyses", {}).items():
            video_name = video_data["video_metadata"]["video_name"]
            
            # Combine all persona content overviews for this video
            all_overviews = []
            for persona_name, analysis in video_data["persona_analyses"].items():
                if analysis["status"] == "success":
                    overview = analysis.get("content_overview", "")
                    if overview:
                        all_overviews.append(overview)
            
            # Join all overviews for this video
            combined_overview = " ".join(all_overviews)
            content_overviews[video_name] = combined_overview
            
        return content_overviews
    
    def _extract_persona_affinity_scores(self) -> Dict[str, float]:
        """Extract persona affinity scores for each video"""
        affinity_scores = {}
        
        for video_key, video_data in self.results.get("video_analyses", {}).items():
            video_name = video_data["video_metadata"]["video_name"]
            
            # Calculate persona affinity (40% general, 60% sports)
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
            
            # Calculate weighted average
            general_avg = sum(general_scores) / len(general_scores) if general_scores else 0
            sports_avg = sum(sports_scores) / len(sports_scores) if sports_scores else 0
            persona_affinity = (general_avg * 0.4) + (sports_avg * 0.6)
            
            affinity_scores[video_name] = round(persona_affinity, 2)
            
        return affinity_scores
    
    
    def calculate_sports_contextual_similarity(self) -> Dict[str, float]:
        """Calculate similarity with sports-specific context weighting"""
        
        # Extract content overviews
        content_overviews = self._extract_content_overviews()
        
        if not content_overviews:
            print("No content overviews found!")
            return {}
        
        # Get main video and ads
        main_video = "Main Sports Video"
        ads = [name for name in content_overviews.keys() if name != main_video]
        
        if main_video not in content_overviews:
            print(f"Main video '{main_video}' not found!")
            return {}
        
        main_content = content_overviews[main_video].lower()
        
        # Define sports context categories and their relevance weights
        sports_contexts = {
            "refreshment": {
                "keywords": ["drink", "beverage", "snack", "food", "refresh", "thirst", "energy", "cola", "soda", "coke", "pepsi", "gatorade", "water", "juice"],
                "weight": 0.9,  # High relevance for sports
                "examples": ["Coca-Cola", "Pepsi", "Gatorade", "snacks"]
            },
            "automotive": {
                "keywords": ["car", "vehicle", "drive", "transport", "luxury", "performance", "volkswagen", "bmw", "mercedes", "automobile", "driving"],
                "weight": 0.6,  # Medium relevance for sports
                "examples": ["Volkswagen", "BMW", "Mercedes"]
            },
            "personal_care": {
                "keywords": ["hygiene", "clean", "fresh", "grooming", "care", "beauty", "shampoo", "soap", "toothpaste", "deodorant", "skincare"],
                "weight": 0.3,  # Lower relevance for sports
                "examples": ["PG", "Unilever", "personal care products"]
            },
            "sports_equipment": {
                "keywords": ["gear", "equipment", "apparel", "shoes", "training", "fitness", "nike", "adidas", "sports", "athletic", "performance"],
                "weight": 1.0,  # Perfect relevance for sports
                "examples": ["Nike", "Adidas", "sports brands"]
            }
        }
        
        def calculate_keyword_similarity(text1, text2, keywords):
            """Calculate similarity based on keyword presence"""
            text1_words = set(text1.split())
            text2_words = set(text2.split())
            keyword_set = set(keywords)
            
            # Count keyword matches in both texts
            text1_keywords = text1_words.intersection(keyword_set)
            text2_keywords = text2_words.intersection(keyword_set)
            
            # Calculate similarity based on keyword overlap
            if not text1_keywords and not text2_keywords:
                return 0.0
            
            # Jaccard similarity for keywords
            union_keywords = text1_keywords.union(text2_keywords)
            intersection_keywords = text1_keywords.intersection(text2_keywords)
            
            if not union_keywords:
                return 0.0
            
            return len(intersection_keywords) / len(union_keywords)
        
        similarities = {}
        
        for ad_name in ads:
            ad_content = content_overviews[ad_name].lower()
            
            # Calculate weighted similarity based on context
            total_similarity = 0
            context_scores = {}
            
            for context, data in sports_contexts.items():
                context_similarity = calculate_keyword_similarity(main_content, ad_content, data["keywords"])
                weighted_similarity = context_similarity * data["weight"]
                total_similarity += weighted_similarity
                context_scores[context] = {
                    "similarity": round(context_similarity, 4),
                    "weight": data["weight"],
                    "weighted_score": round(weighted_similarity, 4)
                }
            
            # Average the weighted similarities
            avg_similarity = total_similarity / len(sports_contexts)
            similarities[ad_name] = {
                "overall_similarity": round(avg_similarity, 4),
                "context_scores": context_scores
            }
        
        return similarities
    
    
    def comprehensive_ad_scoring(self, 
                                content_relevance_weight: float = 0.5, 
                                audience_alignment_weight: float = 0.5,
                                normalize_scores: bool = True) -> Dict[str, Dict[str, float]]:
        """Comprehensive scoring with equal weightage and normalized ranges (0-1) for both metrics"""
        
        # Get sports contextual similarity scores
        sports_similarities = self.calculate_sports_contextual_similarity()
        content_similarities = {ad: data["overall_similarity"] for ad, data in sports_similarities.items()}
        
        # Get persona affinity scores (audience alignment)
        affinity_scores = self._extract_persona_affinity_scores()
        
        if not content_similarities or not affinity_scores:
            return {}
        
        main_video = "Main Sports Video"
        main_affinity = affinity_scores.get(main_video, 0)
        
        # Normalize content relevance scores to 0-1 range
        if normalize_scores and content_similarities:
            content_scores = list(content_similarities.values())
            min_content = min(content_scores)
            max_content = max(content_scores)
            content_range = max_content - min_content
            
            # Avoid division by zero
            if content_range > 0:
                normalized_content_similarities = {}
                for ad_name, score in content_similarities.items():
                    normalized_content_similarities[ad_name] = (score - min_content) / content_range
            else:
                normalized_content_similarities = content_similarities
        else:
            normalized_content_similarities = content_similarities
        
        # For audience alignment, we don't normalize the affinity scores
        # Instead, we calculate alignment based on how close the scores are to the main video
        # This preserves the original relative differences
        normalized_main_affinity = main_affinity / 10.0
        normalized_affinity_scores = {name: score / 10.0 for name, score in affinity_scores.items()}
        
        comprehensive_scores = {}
        
        for ad_name in content_similarities.keys():
            ad_affinity = affinity_scores.get(ad_name, 0)
            content_relevance = content_similarities[ad_name]
            normalized_content_relevance = normalized_content_similarities[ad_name]
            normalized_ad_affinity = normalized_affinity_scores[ad_name]
            
            # Calculate audience alignment (how close the normalized affinity scores are)
            audience_alignment = 1 - abs(normalized_main_affinity - normalized_ad_affinity)
            
            # Calculate comprehensive score with equal weightage
            comprehensive_score = (normalized_content_relevance * content_relevance_weight) + (audience_alignment * audience_alignment_weight)
            
            comprehensive_scores[ad_name] = {
                "content_relevance": content_relevance,
                "normalized_content_relevance": round(normalized_content_relevance, 4),
                "audience_alignment": round(audience_alignment, 4),
                "comprehensive_score": round(comprehensive_score, 4),
                "main_affinity": main_affinity,
                "ad_affinity": ad_affinity,
                "normalized_main_affinity": round(normalized_main_affinity, 4),
                "normalized_ad_affinity": round(normalized_ad_affinity, 4),
                "content_relevance_weight": content_relevance_weight,
                "audience_alignment_weight": audience_alignment_weight,
                "normalized": normalize_scores,
                "sports_context_used": True
            }
            
            # Add sports context details
            if ad_name in sports_similarities:
                comprehensive_scores[ad_name]["sports_context_scores"] = sports_similarities[ad_name]["context_scores"]
        
        return comprehensive_scores

    def generate_analysis_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        
        print("EMBEDDING-BASED SIMILARITY ANALYSIS")
        print("=" * 50)
        
        # Get all scores
        sports_similarities = self.calculate_sports_contextual_similarity()
        affinity_scores = self._extract_persona_affinity_scores()
        comprehensive_scores = self.comprehensive_ad_scoring()
        
        # Display results
        print("\n1. SPORTS CONTEXTUAL SIMILARITY SCORES:")
        print("-" * 40)
        for ad_name, data in sports_similarities.items():
            print(f"{ad_name}:")
            print(f"  Overall Similarity: {data['overall_similarity']:.4f}")
            print(f"  Context Breakdown:")
            for context, scores in data['context_scores'].items():
                print(f"    {context.title()}: {scores['similarity']:.4f} (weight: {scores['weight']:.1f}) = {scores['weighted_score']:.4f}")
            print()
        
        print("\n2. PERSONA AFFINITY SCORES:")
        print("-" * 30)
        for video_name, score in affinity_scores.items():
            print(f"{video_name:<20}: {score:.2f}/10")
        
        print("\n3. COMPREHENSIVE SCORES (50% Sports Context + 50% Audience Alignment):")
        print("-" * 70)
        for ad_name, scores in comprehensive_scores.items():
            print(f"{ad_name}:")
            print(f"  Content Relevance (Original):    {scores['content_relevance']:.4f}")
            if scores.get('normalized', False):
                print(f"  Content Relevance (Normalized):  {scores['normalized_content_relevance']:.4f}")
            print(f"  Audience Alignment:              {scores['audience_alignment']:.4f}")
            print(f"  Comprehensive Score:             {scores['comprehensive_score']:.4f}")
            print(f"  Main Affinity (Original):        {scores['main_affinity']:.2f}/10")
            print(f"  Ad Affinity (Original):          {scores['ad_affinity']:.2f}/10")
            if scores.get('normalized', False):
                print(f"  Main Affinity (Normalized):      {scores['normalized_main_affinity']:.4f}")
                print(f"  Ad Affinity (Normalized):        {scores['normalized_ad_affinity']:.4f}")
            print()
        
        # Comprehensive ranking
        if comprehensive_scores:
            sorted_comprehensive = sorted(comprehensive_scores.items(), 
                                        key=lambda x: x[1]["comprehensive_score"], 
                                        reverse=True)
            
            print("4. FINAL RANKING (Comprehensive Score):")
            print("-" * 40)
            for i, (ad_name, scores) in enumerate(sorted_comprehensive, 1):
                print(f"{i}. {ad_name:<20} Score: {scores['comprehensive_score']:.4f}")
        
        # Create report data
        report = {
            "analysis_metadata": {
                "method": "sports_contextual_similarity_analysis",
                "content_relevance_weight": 0.5,
                "audience_alignment_weight": 0.5,
                "sports_context_method": "keyword_based_weighted_similarity",
                "normalization": "both_metrics_0_to_1_range",
                "sports_context_used": True
            },
            "sports_contextual_similarities": sports_similarities,
            "persona_affinity_scores": affinity_scores,
            "comprehensive_scores": comprehensive_scores,
            "final_ranking": [{"rank": i, "ad": name, "score": data["comprehensive_score"]} 
                            for i, (name, data) in enumerate(sorted_comprehensive, 1)] if comprehensive_scores else []
        }
        
        return report

def main():
    """Main function to run embedding similarity analysis"""
    
    analyzer = EmbeddingSimilarityAnalyzer()
    
    if not analyzer.results:
        print("No analysis results found. Please run the multi-video analysis first.")
        return
    
    # Generate and display analysis
    report = analyzer.generate_analysis_report()
    
    # Save results
    output_file = "embedding_similarity_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\nResults saved to: {output_file}")
    
    return report

if __name__ == "__main__":
    main()
