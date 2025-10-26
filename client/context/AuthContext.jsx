// client/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Set default axios base URL
axios.defaults.baseURL = backendUrl;

// Create the Auth context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // States for auth token, user data, online users, and socket connection
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // --- Check if user is authenticated on load ---
  const checkAuth = async () => {
    if (!token) return;

    try {
      axios.defaults.headers.common["token"] = token;
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      logout(); // Optional: auto logout on invalid token
    }
  };

  // --- Login function ---
  const login = async (endpoint, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${endpoint}`, credentials);
      if (data.success) {
        const { token, userData } = data;

        setToken(token);
        localStorage.setItem("token", token);
        axios.defaults.headers.common["token"] = token;

        setAuthUser(userData);
        connectSocket(userData);

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // --- Logout function ---
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // --- Update profile function ---
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // --- Socket connection ---
  const connectSocket = (userData) => {
    if (!userData || (socket && socket.connected)) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      transports: ["websocket"], // ensures WebSocket connection
    });

    newSocket.connect();

    // Listen for online users
    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    setSocket(newSocket);
  };

  // --- Effect: check authentication on mount ---
  useEffect(() => {
    checkAuth();

    // Cleanup socket on unmount
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Context value
  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
