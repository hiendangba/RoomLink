export default function RoomList({ rooms, onSelectRoom }) {
    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {rooms.map((room) => (
                <div
                    key={room.id}
                    onClick={() => onSelectRoom?.(room)} // gọi hàm callback khi chọn
                    className="cursor-pointer w-full h-full p-4 bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all text-gray-800"
                >
                    <h3 className="font-bold text-lg mb-2 text-center">{room.roomNumber}</h3>
                    <p className="text-sm">Loại: {room.roomType_type}</p>
                    <p className="text-sm">Sức chứa: {room.capacity} người</p>
                    <p className="text-sm mb-3">
                        Giá: {parseInt(room.monthlyFee).toLocaleString()} VND/tháng
                    </p>

                    {/* Tiện ích */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {room.roomType_amenities.map((am, i) => (
                            <span
                                key={i}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100"
                            >
                                {am}
                            </span>
                        ))}
                    </div>

                    {/* Slot - trạng thái phòng */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {room.roomSlots.map((slot) => (
                            <span
                                key={slot.id}
                                className={`px-3 py-1 text-xs rounded-full border font-medium ${slot.isOccupied
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : "bg-green-100 text-green-700 border-green-200"
                                    }`}
                            >
                                Vị trí {slot.slotNumber}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
