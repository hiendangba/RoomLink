import axiosClient from "./axiosClient";

const floorApi = {
    getFloor(data) {
        return axiosClient.get("/floors/", { params: data });
    }
};

export default floorApi;

