import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function Register() {
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        setError("Failed to access camera: " + err.message);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const video = videoRef.current;
      if (!video || !video.srcObject) throw new Error("Camera not initialized");

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      let imageData = canvas.toDataURL("image/jpeg", 0.8);

      imageData = imageData.split(",")[1];

      const response = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, regNumber, className, image: imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      navigate("/login");
    } catch (err) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-900 via-purple-900 to-black p-6">
      {/* Main Container */}
      <div className="relative bg-gray-900/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-4xl border border-indigo-500/30 flex gap-6">
        {/* Left Side: Form and Video */}
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-center text-indigo-300 mb-6 animate-glow">
            Smart Register
          </h1>

          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <p className="text-red-400 flex items-center gap-2 justify-center animate-shake">
                <AlertCircle size={20} /> {error}
              </p>
            )}

            <div className="space-y-4">
              <div className="relative animate-slide-up">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-indigo-500/50 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-all duration-300"
                  required
                />
              </div>

              <div className="relative animate-slide-up animation-delay-100">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                <input
                  type="text"
                  placeholder="Register Number"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-indigo-500/50 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-all duration-300"
                  required
                />
              </div>

              <div className="relative animate-slide-up animation-delay-200">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                <input
                  type="text"
                  placeholder="Class"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-indigo-500/50 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full rounded-xl border-2 border-indigo-500/50 shadow-inner"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 border-2 border-dashed border-indigo-400 rounded-full animate-spin-slow opacity-50" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 ${
                loading ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              }`}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>

        {/* Right Side: Go to Login */}
        <div className="w-80 flex flex-col justify-center">
          <div className="bg-gray-800/90 p-4 rounded-xl animate-slide-up">
            <p className="text-indigo-300 text-center text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <User size={24} /> Already Registered?
            </p>
            <a
              href="/login"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 animate-float"
            >
              <CheckCircle size={20} /> Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;