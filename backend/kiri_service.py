"""
Crimetryx AI - KIRI Engine Service
For video-to-3D photogrammetry processing.
API Documentation: https://docs.kiriengine.app/
"""

import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()

KIRI_API_KEY = os.getenv('KIRI_API_KEY', '')
KIRI_BASE_URL = "https://api.kiriengine.app/api/v1/open"

# Status codes from KIRI Engine
STATUS_CODES = {
    0: "queued",
    1: "queued",
    2: "processing",
    3: "completed",
    4: "failed",
    -1: "failed"
}


class KiriEngineService:
    """Service for interacting with KIRI Engine API for 3D reconstruction."""
    
    def __init__(self):
        self.api_key = KIRI_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def upload_video(self, video_path: str, model_quality: int = 1, 
                     texture_quality: int = 1, file_format: str = "GLTF") -> dict:
        """
        Upload a video for photogrammetry processing.
        
        Args:
            video_path: Path to video file
            model_quality: 0=High, 1=Medium, 2=Low
            texture_quality: 0=4K, 1=2K, 2=1K
            file_format: GLTF, OBJ, FBX, etc.
            
        Returns:
            dict with success status and serialize (task_id)
        """
        url = f"{KIRI_BASE_URL}/photo/video"
        
        try:
            with open(video_path, "rb") as video_file:
                files = {"videoFile": video_file}
                data = {
                    "modelQuality": model_quality,
                    "textureQuality": texture_quality,
                    "fileFormat": file_format
                }
                
                response = requests.post(
                    url, 
                    headers=self.headers, 
                    files=files, 
                    data=data, 
                    timeout=180
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("code") == 200:
                        return {
                            "success": True,
                            "task_id": result.get("data", {}).get("serialize"),
                            "message": "Video uploaded successfully"
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("msg", "Unknown error")
                        }
                else:
                    return {
                        "success": False,
                        "error": f"Upload failed with status {response.status_code}",
                        "details": response.text
                    }
                    
        except FileNotFoundError:
            return {"success": False, "error": "Video file not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_status(self, task_id: str) -> dict:
        """
        Get the processing status of a task.
        
        Status codes:
            0, 1: Queued
            2: Processing
            3: Completed
            4, -1: Failed
        """
        url = f"{KIRI_BASE_URL}/model/getStatus?serialize={task_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 200:
                    status_code = result.get("data", {}).get("status", -1)
                    return {
                        "success": True,
                        "status_code": status_code,
                        "status": STATUS_CODES.get(status_code, "unknown"),
                        "task_id": task_id
                    }
            
            return {
                "success": False,
                "error": f"Failed to get status: {response.status_code}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def download_model(self, task_id: str, output_dir: str = "models") -> dict:
        """
        Download the completed 3D model (zipped).
        Link is valid for 60 minutes.
        """
        url = f"{KIRI_BASE_URL}/model/getModelZip?serialize={task_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 200:
                    model_url = result.get("data", {}).get("modelUrl")
                    
                    if model_url:
                        # Download the zip file
                        os.makedirs(output_dir, exist_ok=True)
                        zip_path = os.path.join(output_dir, f"{task_id}.zip")
                        
                        download_response = requests.get(model_url, timeout=120)
                        if download_response.status_code == 200:
                            with open(zip_path, "wb") as f:
                                f.write(download_response.content)
                            
                            return {
                                "success": True,
                                "zip_path": zip_path,
                                "model_url": model_url,
                                "message": "Model downloaded successfully"
                            }
                        else:
                            return {
                                "success": False,
                                "error": f"Failed to download model: {download_response.status_code}"
                            }
                    else:
                        return {"success": False, "error": "No model URL in response"}
            
            return {
                "success": False,
                "error": f"Failed to get download link: {response.status_code}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def wait_for_completion(self, task_id: str, max_wait: int = 900, 
                            poll_interval: int = 15) -> dict:
        """
        Poll until processing is complete.
        
        Args:
            task_id: The serialize ID from upload
            max_wait: Maximum seconds to wait (default 15 min)
            poll_interval: Seconds between polls
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            status = self.get_status(task_id)
            
            if not status.get("success"):
                return status
            
            if status.get("status") == "completed":
                return {
                    "success": True,
                    "status": "completed",
                    "task_id": task_id,
                    "elapsed_time": time.time() - start_time
                }
            elif status.get("status") == "failed":
                return {
                    "success": False,
                    "error": "Processing failed",
                    "task_id": task_id
                }
            
            time.sleep(poll_interval)
        
        return {
            "success": False,
            "error": "Timeout waiting for completion",
            "task_id": task_id
        }
