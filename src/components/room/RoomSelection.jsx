import React, { useState, useEffect } from "react";
import Pagination from "../ui/Pagination";
import Button from "../ui/Button";
import roomApi from "../../api/roomApi";
import buildingApi from "../../api/buildingApi";
import RoomList from "./RoomList";

const RoomSelection = ({ onRoomSelected, onCancel }) => {
  const [filters, setFilters] = useState({
    gender: "",
    building: "",
    roomType: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [paginatedRooms, setPaginatedRooms] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    if (!selectedFloor) {
      setPaginatedRooms([])
      return;
    }
    const roomsByFloor = rooms.filter(r => r.floor_number === selectedFloor);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRooms(roomsByFloor.slice(startIndex, endIndex));
  }, [rooms, selectedFloor, currentPage, itemsPerPage]);
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (filters.gender && filters.roomType) {
      fetchBuildings(filters.gender, filters.roomType);
    }
  }, [filters.gender, filters.roomType]);

  useEffect(() => {
    if (filters.roomType && filters.building) {
      fetchRooms(filters.roomType, filters.building);
    }
  }, [filters.roomType, filters.building]);

  const fetchRoomTypes = async () => {
    try {
      const res = await roomApi.getRoomType();
      if (res.success) setRoomTypes(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy loại phòng:", error);
    }
  };

  const fetchBuildings = async (genderRestriction, roomTypeId) => {
    try {
      setIsLoading(true);
      const res = await buildingApi.getBuilding({ genderRestriction, roomTypeId });
      if (res.success) setBuildings(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy tòa:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async (roomTypeId, buildingId) => {
    try {
      setIsLoading(true);
      const res = await roomApi.getRoom({ roomTypeId, buildingId });
      console.log("response", res)
      if (res.success) {

        setRooms(res.data);
        const uniqueFloors = [...new Set(res.data.map(r => r.floor_number))].sort((a, b) => a - b);
        setFloors(uniqueFloors);

        if (uniqueFloors.length > 0) {
          setSelectedFloor(uniqueFloors[0]);
        } else {
          setSelectedFloor(null);
        }
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Lỗi khi lấy phòng:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === "gender") {
      setFilters({ gender: value, building: "", roomType: "" });
      setBuildings([]);
      setRooms([]);
      setFloors([]);
    } else if (name === "roomType") {
      setFilters(prev => ({ ...prev, building: "" }));
      setRooms([]);
      setFloors([]);
    }
  };

  const roomsByFloor = rooms.filter(r => r.floor_number === selectedFloor);
  const totalPages = Math.ceil(roomsByFloor.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chọn phòng ở KTX</h1>
          <p className="text-gray-600">Chọn giới tính, loại phòng và tòa bạn muốn ở</p>
        </div>
        <div className="mb-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
        </div>

        {/* 🔹 Bộ lọc */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8 flex flex-wrap gap-4 items-end">
          {/* Giới tính */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled hidden>Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>

          {/* Loại phòng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại phòng</label>
            <select
              value={filters.roomType}
              onChange={(e) => handleFilterChange("roomType", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={!filters.gender}
            >
              <option value="">Chọn loại phòng</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.type}</option>
              ))}
            </select>
          </div>

          {/* Tòa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tòa</label>
            <select
              value={filters.building}
              onChange={(e) => handleFilterChange("building", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={!filters.roomType}
            >
              <option value="">Chọn tòa</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 🔹 Chọn tầng */}
        {floors.length > 0 && (
          <div className="flex gap-3 mb-6 justify-center">
            {floors.map(floor => (
              <button
                key={floor}
                onClick={() => {
                  setSelectedFloor(floor);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg border transition-all ${selectedFloor === floor
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                  }`}
              >
                Tầng {floor}
              </button>
            ))}
          </div>
        )}

        {/* 🔹 Danh sách phòng */}
        <div>
          {paginatedRooms.length === 0 ? (
            <div className="text-center col-span-full py-10 text-gray-500">
              Không tìm thấy phòng phù hợp
            </div>
          ) : (
            <RoomList rooms={paginatedRooms} onSelectRoom={onRoomSelected} />
          )}
        </div>


        {/* 🔹 Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={roomsByFloor.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSelection;
