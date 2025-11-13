import axiosClient from "./axiosClient";

const healthCheckApi = {
    getHealthChecks(data) {
        return axiosClient.get("/healthCheck/getHealthCheck", { params: data });
    },
    createHealthCheck(data) {
        return axiosClient.post("/healthCheck/createHealthCheck", data);
    },
    updateHealthCheck(data) {
        return axiosClient.put("/healthCheck/updateHealthCheck", data);
    },
    registerHealthCheck(data) {
        return axiosClient.post("/healthCheck/registerHealthCheck", data);
    }
};

export default healthCheckApi;