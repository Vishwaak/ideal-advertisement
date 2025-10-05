#!/usr/bin/env python3
"""
Test script to verify the integration between frontend and backend
"""
import requests
import json

def test_ad_placement_endpoint():
    """Test the /ad_placement endpoint with a video_id"""
    url = "http://127.0.0.1:8000/ad_placement"
    video_id = "test_video_123"
    
    print(f"Testing endpoint: {url}")
    print(f"Video ID: {video_id}")
    
    try:
        # Test with video_id parameter
        response = requests.post(f"{url}?video_id={video_id}")
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response:")
            print(json.dumps(data, indent=2))
            
            # Check if the response has the expected structure
            if "result" in data:
                print("✅ Response contains 'result' field")
                if "segments" in data["result"]:
                    print("✅ Response contains 'segments' field")
                    print(f"Number of segments: {len(data['result']['segments'])}")
                else:
                    print("⚠️  Response doesn't contain 'segments' field")
            else:
                print("❌ Response doesn't contain 'result' field")
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Make sure the backend server is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_cors_headers():
    """Test CORS headers"""
    url = "http://127.0.0.1:8000/ad_placement"
    
    try:
        # Send OPTIONS request to test CORS
        response = requests.options(url)
        print(f"\nCORS Test - Status Code: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        # Check for CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print("CORS Configuration:")
        for header, value in cors_headers.items():
            if value:
                print(f"✅ {header}: {value}")
            else:
                print(f"❌ {header}: Not set")
                
    except Exception as e:
        print(f"❌ CORS test failed: {e}")

if __name__ == "__main__":
    print("🧪 Testing Backend Integration")
    print("=" * 50)
    
    test_ad_placement_endpoint()
    test_cors_headers()
    
    print("\n" + "=" * 50)
    print("Test completed!")
