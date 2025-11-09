import React, { useState } from 'react';
import Button from '../ui/Button';
import PageLayout from '../ui/PageLayout';
import two_bed from "../../assets/2bed.png";
import four_bed from "../../assets/4bed.png";

const RoomDetail = ({ room, onRoomSlotSelected, onBack }) => {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [duration, setDuration] = useState();

    const handleSelectSlot = (slotId) => {
        setSelectedSlot(selectedSlot === slotId ? null : slotId);
    };

    const handleConfirm = () => {
        if (!selectedSlot) {
            alert('Vui lòng chọn vị trí trong phòng trước!');
            return;
        }
        if (!duration) {
            alert('Vui lòng chọn thời gian thuê phòng!');
            return;
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + parseInt(duration));

        onRoomSlotSelected({
            slotId: selectedSlot,
            endDate: endDate.toISOString().split('T')[0],
        });
    };


    if (!room) {
        return (
            <PageLayout title="Chi tiết phòng">
                <p>Không có thông tin phòng.</p>
                <Button onClick={onBack}>Quay lại</Button>
            </PageLayout>
        );
    }

    let roomImage = null;
    if (room.capacity === 2) roomImage = two_bed;
    else if (room.capacity === 4) roomImage = four_bed;

    return (
        <PageLayout title={`Phòng ${room.roomNumber}`}>
            <div className="space-y-4">
                {/* Thông tin phòng */}
                <div className="border p-4 rounded-xl bg-white shadow">
                    <h2 className="text-lg font-semibold mb-2">Thông tin phòng</h2>
                    <p><b>Tòa:</b> {room.roomNumber.split('-')[0]}</p>
                    <p><b>Tầng:</b> {room.floor_number}</p>
                    <p><b>Loại phòng:</b> {room.roomType_type}</p>
                    <p><b>Sức chứa:</b> {room.capacity} người</p>
                    <p><b>Giá phòng:</b> {parseInt(room.monthlyFee).toLocaleString()} VND/tháng</p>
                    <p><b>Tiện ích:</b> {room.roomType_amenities.join(', ')}</p>
                </div>

                <div className="border p-4 rounded-xl bg-white shadow">
                    <h2 className="text-lg font-semibold mb-3">Chọn vị trí & ngày trả phòng</h2>
                    {roomImage && (
                        <div className="w-full flex justify-center mb-3">
                            <img
                                src={roomImage}
                                alt={`Bố cục phòng ${room.capacity} giường`}
                                className="max-w-[500px] h-auto rounded-lg border shadow-md"
                            />
                        </div>
                    )}

                    {/* Nút chọn giường */}
                    <div className="flex gap-3 flex-wrap justify-center mb-4">
                        {room.roomSlots.map((slot) => {
                            let slotClass = '';
                            if (slot.isOccupied) {
                                slotClass = 'bg-gray-300 cursor-not-allowed';
                            } else if (selectedSlot === slot.id) {
                                slotClass = 'bg-black text-white';
                            } else {
                                slotClass = 'bg-green-500 text-white hover:bg-green-600';
                            }

                            return (
                                <button
                                    key={slot.id}
                                    disabled={slot.isOccupied}
                                    onClick={() => handleSelectSlot(slot.id)}
                                    className={`px-4 py-2 rounded-lg border ${slotClass}`}
                                >
                                    Giường {slot.slotNumber}
                                </button>
                            );
                        })}
                    </div>

                    {/* Chọn ngày kết thúc */}
                    <div className="flex flex-col items-center">
                        <label htmlFor="duration" className="font-medium mb-1">Thời gian thuê phòng:</label>
                        <select
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="border rounded-lg px-3 py-2 w-60 text-center"
                        >
                            <option value="">-- Chọn thời gian --</option>
                            <option value="8">8 tháng</option>
                            <option value="10">10 tháng</option>
                        </select>
                    </div>
                </div>

                {/* Nút điều hướng */}
                <div className="flex justify-between mt-4">
                    <Button variant="secondary" onClick={onBack}>
                        Quay lại
                    </Button>
                    <Button variant="primary" onClick={handleConfirm}>
                        Xác nhận
                    </Button>
                </div>
            </div>
        </PageLayout>
    );
};

export default RoomDetail;
