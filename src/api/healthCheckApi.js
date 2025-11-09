import axiosClient from "./axiosClient";

const healthCheckApi = {
    getHealthChecks(data) {
        return axiosClient.get("/healthCheck/getHealthCheck", { params: data });
    },
    createHealthCheck(data) {
        return axiosClient.post("/healthCheck/createHealthCheck", data);
    }
};

export default healthCheckApi;