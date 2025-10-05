# 🎯 Contextual Ad Matching System

## Overview
The **Contextual Ad Matching System** intelligently matches advertisements to specific moments within a video based on **emotional tone**, **persona alignment**, and **content relevance**.  
It integrates emotion analysis, persona-based ad scoring, and timestamp optimization to automatically generate a **timestamped ad placement plan** that explains **which ads to show, when, and why**.

---

## 🧩 System Architecture

### **Input**
- **Main Video** — Primary video content where ads will be inserted.  
- **N Ad Videos** — Pool of potential advertisements.  
- **Persona Config** — Set of persona definitions and preferences used for persona-based analysis.

---

## ⚙️ MODULE A: Ad Selection

### 1. Persona Analysis
- Analyzes each ad video from multiple persona perspectives.
- Generates individual **scores per persona** based on appeal and relevance.

### 2. Similarity Analysis
- Evaluates **content relevance** between ad and main video.
- Measures **audience alignment** to ensure targeted delivery.

### 3. Composite Scoring
- Combines multiple metrics into a unified ranking score.
- Produces a **Ranked Ad List** based on best fit for the given context.

---

## 🎬 MODULE B: Ad Placement

### 1. Emotion Timeline Analysis
- Extracts emotion timestamps from the main video.  
- Analyzes emotional content frame-by-frame.  
- Generates **emotion scores (0–10)** representing emotional intensity.  

🔗 **External APIs:**
- **Video Analysis API** – for visual and emotional content extraction.  
- **Gemini API** – for semantic emotion interpretation and contextual embedding.

### 2. Ad Opportunity Detection
- Identifies **peak emotional moments** ideal for ad insertion.  
- Matches **ad types** to emotional categories.  
- Generates placement suggestions.

**Output:**  
- Emotion Timeline (CSV + Graph)

---

## 🔄 Integration

Combines outputs from **Module A** and **Module B**:

- Selects **best-matching ads** (from Module A)
- Pairs with **optimal emotional timestamps** (from Module B)
- Generates a **placement strategy** that balances relevance, timing, and emotional continuity.

---

## ✅ Final Output

**Timestamped Ad Placement Plan**
- Which ads to show  
- When to show them  
- Why they match (based on persona, emotion, and context)

---

## 🧠 Data Flow Summary

| Stage | Module | Description | Output |
|--------|---------|-------------|---------|
| Input | - | Main video, N ads, persona config | Input data |
| Persona & Similarity Analysis | A | Generate persona-based and relevance scores | Ranked Ad List |
| Emotion Analysis | B | Generate emotional timeline | Emotion Timeline CSV |
| Integration | - | Combine ad ranking + emotion peaks | Placement Strategy |
| Output | - | Explain which ads appear, when, and why | Final Plan |

---


## 🧠 Example Output Format

```json
data = {
  "result": {
    "emotion": {
      "timestamps": [
        {
          "description": "Preparation and Tension, setting the stage for the upcoming action.",
          "time": "0s (00:00) - 4s (00:04)"
        },
        {
          "description": "Action and Excitement, as Barkley makes a significant run and dodges tackles.",
          "time": "5s (00:05) - 12s (00:12)"
        },
        {
          "description": "Achievement and Celebration, Barkley successfully reaches the end zone and celebrates.",
          "time": "13s (00:13) - 17s (00:17)"
        },
        {
          "description": "Reflection and Analysis, the video replays the run from different angles, allowing viewers to appreciate the skill and strategy.",
          "time": "18s (00:18) - 32s (00:32)"
        }
      ]
    },
    "emotion_graph": "asserts/emotion_timeline_graph.png",
    "ad_placement_report": [
      "{\n  \"fits\": true,\n  \"segment_time\": \"18s (00:18)\",\n  \"current_advertisements\": [\n    \"Broadcast network sponsors\",\n    \"NFL+ subscription\",\n    \"Replay technology brands\"\n  ],\n  \"suggested_advertisement\": [\n    \"Volkswagen\"\n  ],\n  \"transition\": \"Insert Volkswagen as a broadcast/network sponsor alongside the existing ads at the 18s segment, matching the sports‑media sponsorship context.\"\n}",
      "{\n  \"advertisements\": [\n    {\n      \"time\": \"0s (00:00)\",\n      \"advertisement\": [\n        \"Philadelphia Eagles merchandise\",\n        \"NFL Game Pass\",\n        \"Sports betting apps\"\n      ],\n      \"fits_pg_ad_products\": true\n    },\n    {\n      \"time\": \"6s (00:06)\",\n      \"advertisement\": [\n        \"NFL apparel\",\n        \"Sports drink brands\",\n        \"Footwear brands\"\n      ],\n      \"fits_pg_ad_products\": false\n    },\n    {\n      \"time\": \"12s (00:12)\",\n      \"advertisement\": [\n        \"Jacksonville Jaguars merchandise\",\n        \"Protective sports gear\",\n        \"Sports medicine/rehabilitation services\"\n      ],\n      \"fits_pg_ad_products\": false\n    },\n    {\n      \"time\": \"18s (00:18)\",\n      \"advertisement\": [\n        \"Broadcast network sponsors\",\n        \"NFL+ subscription\",\n        \"Replay technology brands\"\n      ],\n      \"fits_pg_ad_products\": false\n    },\n    {\n      \"time\": \"27s (00:27)\",\n      \"advertisement\": [\n        \"Sports camera equipment\",\n        \"NFL collectibles\",\n        \"Official team sponsors\"\n      ],\n      \"fits_pg_ad_products\": true\n    }\n  ],\n  \"transition\": [\n    {\n      \"from\": \"0s\",\n      \"to\": \"6s\",\n      \"emotion_trend\": \"rising\"\n    },\n    {\n      \"from\": \"6s\",\n      \"to\": \"12s\",\n      \"emotion_trend\": \"rising\"\n    },\n    {\n      \"from\": \"12s\",\n      \"to\": \"18s\",\n      \"emotion_trend\": \"falling\"\n    },\n    {\n      \"from\": \"18s\",\n      \"to\": \"27s\",\n      \"emotion_trend\": \"falling\"\n    },\n    {\n      \"from\": \"27s\",\n      \"to\": \"32s\",\n      \"emotion_trend\": \"low\"\n    }\n  ]\n}",
      "{\n  \"fits_segment\": true,\n  \"matched_segment\": {\n    \"time\": \"6s (00:06)\",\n    \"advertisement\": [\n      \"NFL apparel\",\n      \"Sports drink brands\",\n      \"Footwear brands\"\n    ]\n  },\n  \"transition\": \"The emotion value rises steadily from 4.0 at 0 s to 8.0 at 6 s, indicating growing audience engagement. This upward trend aligns with the 6 s advertising slot that features sports‑drink brands, making the Coca‑Cola 3‑product ad a suitable fit. The peak continues to climb to around 10.0 at 13 s, after which the emotion gradually declines, signalling a natural transition to the next segment at 12 s.\"\n}"
    ]
  }
}
