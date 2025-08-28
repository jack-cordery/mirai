import { useState } from 'react';

export default function UserDashboard() {
        const [form, setForm] = useState({ name: '', date: '', type: '' });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                setForm({ ...form, [e.target.name]: e.target.value });
        };

        const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                alert(`Booking created: ${JSON.stringify(form)}`);
        };

        return (
                <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
                        <h2 className="text-lg font-bold mb-4">Create a Booking</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                        name="name"
                                        placeholder="Your name"
                                        className="w-full px-4 py-2 border rounded"
                                        value={form.name}
                                        onChange={handleChange}
                                />
                                <input
                                        name="date"
                                        type="date"
                                        className="w-full px-4 py-2 border rounded"
                                        value={form.date}
                                        onChange={handleChange}
                                />
                                <select
                                        name="type"
                                        className="w-full px-4 py-2 border rounded"
                                        value={form.type}
                                        onChange={handleChange}
                                >
                                        <option value="">Select booking type</option>
                                        <option value="consultation">Consultation</option>
                                        <option value="follow-up">Follow-up</option>
                                </select>
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                        Book
                                </button>
                        </form>
                </div>
        );
}
