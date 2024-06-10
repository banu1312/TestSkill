import axios from "axios";

const apiClient = axios.create({
    baseURL: `https://6662e35462966e20ef0a74bb.mockapi.io/`,
    headers:{
        "Content-Type": "application/json",
        Accept: "application/json"
    }
})

export default apiClient