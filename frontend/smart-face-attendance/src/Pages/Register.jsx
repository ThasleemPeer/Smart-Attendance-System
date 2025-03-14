import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      // Access the camera
      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.play();
  
      // Wait for video to start
      await new Promise((resolve) => {
        video.onplaying = resolve;
      });
  
      // Capture Image
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640; // Increase resolution if needed
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      let imageData = canvas.toDataURL("image/jpeg");
  
      // Stop the camera stream
      stream.getTracks().forEach((track) => track.stop());
  
      // Remove "data:image/jpeg;base64," prefix (Important for some backends)
      imageData = imageData.split(",")[1];
  
      // Send to backend
      const response = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, regNumber, className, image: imageData }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }
  
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Register Number:</label>
          <input
            type="text"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Class:</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <video ref={videoRef} autoPlay className="w-full border rounded"></video>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="mt-2 text-center">
          <a href="/login" className="text-blue-500">Go to Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;