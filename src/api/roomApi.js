import axiosClient from "./axiosClient";

const roomApi = {
    getRoomType() {
        return axiosClient.get("/rooms/room-type"); // không cần token
    },

    getRoomTypeForAdmin(buildingId) {
        return axiosClient.get("/rooms/room-type/admin", { params: { buildingId } });
    },

    createRoomType(data) {
        return axiosClient.post("/rooms/room-type", data);
    },

    getRoom(data) {
        return axiosClient.get("/rooms/", { params: data });
    },

    getRoomForAdmin(data) {
        return axiosClient.get("/rooms/admin", { params: data });
    },

    createRoom(data) {
        return axiosClient.post("/rooms/", data);
    },

    getRoomByUser() {
        return axiosClient.get("/rooms/active");
    }
};

export default roomApi;