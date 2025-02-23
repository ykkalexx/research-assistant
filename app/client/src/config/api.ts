import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

// local: http://localhost:3000/api
// production: https://research-assistant-production.up.railway.app/api
