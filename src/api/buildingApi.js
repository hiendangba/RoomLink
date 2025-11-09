import axiosClient from "./axiosClient";

const buildingApi = {
    
    getBuilding() {
        return axiosClient.get("/buildings/",);
    },

    getBuildings(data) {
        return axiosClient.get("/buildings/get", { params: data });
    }
};

export default buildingApi;