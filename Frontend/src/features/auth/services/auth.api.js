import axios from "axios"


const api = axios.create({
    baseURL: "https://interview-ai-2-nwze.onrender.com",
    withCredentials: true
})
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("TOKEN BEING SENT:", token); // debug

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })
        if(response.data.token){
            localStorage.setItem("token", response.data.token)
        }
        localStorage.setItem("user", JSON.stringify(response.data.user))    

        return response.data

    } catch (err) {

        console.log(err)

    }

}

export async function login({ email, password }) {

    try {

        const response = await api.post("/api/auth/login", {
            email, password
        })
        console.log("LOGIN RESPONSE:", response.data)
        if(response.data.token){
            localStorage.setItem("token", response.data.token)
        }
        localStorage.setItem("user", JSON.stringify(response.data.user))
        return response.data

    } catch (err) {
        console.log(err)
    }

}

export async function logout() {
    try {

        const response = await api.get("/api/auth/logout")

        return response.data

    } catch (err) {
        console.log(err)
    }
}

export async function getMe() {

    try {

        const response = await api.get("/api/auth/get-me")

        return response.data

    } catch (err) {
        console.log(err)
    }

}
