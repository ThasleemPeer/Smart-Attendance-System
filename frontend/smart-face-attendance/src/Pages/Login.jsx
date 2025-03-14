import { useState, useRef, useEffect } from "react";
import { Camera, User, Lock, Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function Login() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        setError("Failed to access camera. Please allow camera permissions.");
        console.error("Camera access error:", err);
      }
    };

    initializeCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const captureFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      requestAnimationFrame(captureFrame);
    };

    captureFrame();
  }, []);

  const handleMarkAttendance = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");

      const imageData = canvas.toDataURL("image/jpeg");

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
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setError("");
    if (adminUsername === "admin" && adminPassword === "password123") {
      setAdminAuthenticated(true);
      setShowAdminLogin(false);
    } else {
      setError("Invalid admin credentials");
    }
  };

  const handleDownloadAttendance = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/download_attendance/", {
        method: "GET",
      });
      if (!response.ok) throw new Error("Failed to download attendance data");

      const blob = await response.blob();
      const file = new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance_data.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Error downloading attendance data: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-purple-900 to-black p-6">
      {/* Main Container */}
      <div className="relative bg-gray-900/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-4xl border border-indigo-500/30 flex gap-6">
        {/* Left Side: Video Feed and Attendance */}
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold text-center text-indigo-300 mb-6 animate-glow">
            Smart Login
          </h2>

          <div className="relative mb-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full rounded-xl border-2 border-indigo-500/50 shadow-inner"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-dashed border-indigo-400 rounded-full animate-spin-slow opacity-50" />
            </div>
          </div>

          <button
            onClick={handleMarkAttendance}
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            }`}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            {loading ? "Processing..." : "Mark Attendance"}
          </button>

          {message && (
            <p className="mt-4 text-green-400 flex items-center gap-2 justify-center animate-fade-in">
              <CheckCircle size={20} /> {message}
            </p>
          )}
          {error && (
            <p className="mt-4 text-red-400 flex items-center gap-2 justify-center animate-shake">
              <AlertCircle size={20} /> {error}
            </p>
          )}

          <p className="mt-4 text-center">
            <a
              href="/"
              className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <User size={18} /> Go to Register
            </a>
          </p>
        </div>

        {/* Right Side: Admin Panel */}
        <div className="w-80 flex flex-col gap-4">
          {/* Admin Toggle Button */}
          <button
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <User size={20} />
            Admin
          </button>

          {/* Admin Login or Dashboard */}
          {showAdminLogin && !adminAuthenticated && (
            <div className="bg-gray-800/90 p-4 rounded-xl animate-slide-up">
              <h3 className="text-xl font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                <Lock size={24} /> Admin Access
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-indigo-500/50 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-indigo-500/50 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-all duration-300"
                  />
                </div>
                <button
                  onClick={handleAdminLogin}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                >
                  <CheckCircle size={20} /> Login
                </button>
              </div>
            </div>
          )}

          {adminAuthenticated && (
            <div className="bg-gray-800/90 p-4 rounded-xl animate-slide-up">
              <h3 className="text-xl font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                <User size={24} /> Admin Dashboard
              </h3>
              <button
                onClick={handleDownloadAttendance}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl flex items-center justify-center gap-2 hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 animate-float"
              >
                <Download size={20} /> Download Attendance
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;