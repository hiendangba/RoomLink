import axiosClient from "./axiosClient";

const healthCheckApi = {
    getHealthChecks(data) {
        return axiosClient.get("/healthCheck/getHealthCheck", { params: data });
    },
    getHealthCheckById(id) {
        return axiosClient.get(`/healthCheck/getHealthCheck/${id}`);
    },
    createHealthCheck(data) {
        return axiosClient.post("/healthCheck/createHealthCheck", data);
    },
    updateHealthCheck(data) {
        // Backend dùng cùng endpoint POST với createHealthCheck, chỉ cần thêm healthCheckId vào body
        return axiosClient.post("/healthCheck/createHealthCheck", data);
    },
    deleteHealthCheck(id) {
        return axiosClient.delete(`/healthCheck/deleteHealthCheck/${id}`);
    },
    registerHealthCheck(data) {
        return axiosClient.post("/healthCheck/registerHealthCheck", data);
    }
};

export default healthCheckApi;