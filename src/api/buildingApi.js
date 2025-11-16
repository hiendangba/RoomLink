import axiosClient from "./axiosClient";

const buildingApi = {
    getBuilding() {
        return axiosClient.get("/buildings/");
    },

    getBuildings(data) {
        return axiosClient.get("/buildings/get", { params: data });
    },

    createBuilding(data) {
        return axiosClient.post("/buildings/", data);
    },

    deleteBuilding(id) {
        return axiosClient.delete(`/buildings/${id}`);
    }
};

export default buildingApi;