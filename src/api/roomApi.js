import axiosClient from "./axiosClient";

const roomApi = {
    getRoomType() {
        return axiosClient.get("/rooms/room-type"); // không cần token
    },

    getRoom(data) {
        return axiosClient.get("/rooms/", { params: data });
    }
};

export default roomApi;