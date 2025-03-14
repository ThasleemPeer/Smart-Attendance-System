import { useState, useRef, useEffect } from "react";

function Login() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  // Initialize camera feed when component mounts
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Failed to access camera. Please allow camera permissions.");
        console.error("Camera access error:", err);
      }
    };

    initializeCamera();

    // Cleanup: Stop the camera stream when the component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleMarkAttendance = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const video = videoRef.current;
      if (!video || !video.srcObject) {
        throw new Error("Camera feed not available");
      }

      // Wait for the video to start playing
      await new Promise((resolve) => {
        video.onplaying = resolve;
      });

      // Capture the image
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");

      // Debug: Save the captured image
      const link = document.createElement("a");
      link.href = imageData;
      link.download = "debug_image.jpg";
      link.click();

      // Stop the camera stream
      video.srcObject.getTracks().forEach((track) => track.stop());

      // Send the image data to the backend
      const response = await fetch("http://localhost:8000/api/mark-attendance/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark attendance");
      }

      const data = await response.json();
      console.log("Backend response:", data);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
      console.error("Error marking attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <div className="mb-4">
          <video ref={videoRef} autoPlay className="w-full border rounded"></video>
        </div>
        <button
          onClick={handleMarkAttendance}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          {loading ? "Processing..." : "Mark Attendance"}
        </button>
        {message && <p className="mt-4 text-green-600">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
        <p className="mt-2">
          <a href="/" className="text-blue-500">Go to Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;