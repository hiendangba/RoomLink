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

    // PUT - Cập nhật loại phòng
    updateRoomType: (id, data) => {
        return axiosClient.put(`/rooms/room-type/${id}`, data);
    },

    // DELETE - Xóa loại phòng
    deleteRoomType: (id) => {
        return axiosClient.delete(`/rooms/room-type/${id}`);
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
    },

    // PUT - Cập nhật thông tin phòng
    updateRoom: (id, data) => {
        return axiosClient.put(`/rooms/${id}`, data);
    },

    // DELETE - Xóa phòng
    deleteRoom: (id) => {
        return axiosClient.delete(`/rooms/${id}`);
    }
};

export default roomApi;