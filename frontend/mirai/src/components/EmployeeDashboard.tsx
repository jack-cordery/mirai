import { useState } from 'react';

export default function EmployeeDashboard() {
        const [availability, setAvailability] = useState({ date: '', slots: '' });
        const [type, setType] = useState({ label: '', duration: '' });

        return (
                <div className="max-w-2xl mx-auto grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Availability Form */}
                        <div className="bg-white p-6 rounded shadow">
                                <h2 className="text-lg font-bold mb-4">Add Availability</h2>
                                <form
                                        className="space-y-4"
                                        onSubmit={(e) => {
                                                e.preventDefault();
                                                alert(`Availability added: ${JSON.stringify(availability)}`);
                                        }}
                                >
                                        <input
                                                name="date"
                                                type="date"
                                                className="w-full px-4 py-2 border rounded"
                                                value={availability.date}
                                                onChange={(e) => setAvailability({ ...availability, date: e.target.value })}
                                        />
                                        <input
                                                name="slots"
                                                placeholder="Number of slots"
                                                className="w-full px-4 py-2 border rounded"
                                                value={availability.slots}
                                                onChange={(e) => setAvailability({ ...availability, slots: e.target.value })}
                                        />
                                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                                                Save Availability
                                        </button>
                                </form>
                        </div>

                        {/* Booking Type Form */}
                        <div className="bg-white p-6 rounded shadow">
                                <h2 className="text-lg font-bold mb-4">Create Booking Type</h2>
                                <form
                                        className="space-y-4"
                                        onSubmit={(e) => {
                                                e.preventDefault();
                                                alert(`Booking type added: ${JSON.stringify(type)}`);
                                        }}
                                >
                                        <input
                                                name="label"
                                                placeholder="Booking name"
                                                className="w-full px-4 py-2 border rounded"
                                                value={type.label}
                                                onChange={(e) => setType({ ...type, label: e.target.value })}
                                        />
                                        <input
                                                name="duration"
                                                placeholder="Duration (minutes)"
                                                className="w-full px-4 py-2 border rounded"
                                                value={type.duration}
                                                onChange={(e) => setType({ ...type, duration: e.target.value })}
                                        />
                                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                                                Add Booking Type
                                        </button>
                                </form>
                        </div>
                </div>
        );
}
