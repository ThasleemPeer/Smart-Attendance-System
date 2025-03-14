import { useState, useRef, useEffect } from "react";

function Login() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera feed when component mounts
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Wait for video metadata to load
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        // Add a small delay to ensure the video feed is fully rendered
        await new Promise((resolve) => setTimeout(resolve, 500));
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

  // Continuously capture frames from the video feed
  useEffect(() => {
    const captureFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Optionally, you can process the captured frame here
        // For example, send it to a backend API or perform some image processing
        const imageData = canvas.toDataURL("image/jpeg");
        console.log("Captured frame:", imageData); // Log the captured frame (for debugging)
      }

      requestAnimationFrame(captureFrame); // Continuously capture frames
    };

    captureFrame(); // Start the capture loop
  }, []);

  const handleMarkAttendance = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      // Capture the current frame from the canvas
      const imageData = canvas.toDataURL("image/jpeg");

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
          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
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