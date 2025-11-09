import axiosClient from "./axiosClient";

const buildingApi = {
    getBuilding(data) {
        return axiosClient.get("/buildings/", { params: data });
    }
};

export default buildingApi;