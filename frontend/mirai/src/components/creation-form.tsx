import { Button } from "@/components/ui/button"
import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
} from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { postBookingType } from "@/api/booking-type"
import { toast } from "sonner"


export function BookingTypeFormCard() {
        const [formData, setFormData] = useState({
                title: "",
                description: "",
                cost: 0,
                fixed: false,
        });

        const handleChange = (field: string, value: any) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                try {
                        const res = await postBookingType({
                                title: formData.title,
                                description: formData.description,
                                cost: formData.cost * 100,
                                fixed: formData.fixed,
                        })
                        toast(`booking type ${formData.title} created`)
                        setFormData({
                                title: "",
                                description: "",
                                cost: 0,
                                fixed: false,
                        })
                        console.log(res)
                } catch (err) {
                        toast("creation failed")
                        console.log(err)
                }
        };

        return (
                <form onSubmit={handleSubmit}>
                        <Card>
                                <CardHeader>
                                        <CardTitle>Booking Type</CardTitle>
                                        <CardDescription>Set the name and description for this booking type.</CardDescription>
                                </CardHeader>

                                <CardContent className="grid gap-6">
                                        <div className="grid gap-3">
                                                <Label htmlFor="title">Title</Label>
                                                <Input
                                                        id="title"
                                                        value={formData.title}
                                                        onChange={(e) => handleChange("title", e.target.value)}
                                                />
                                        </div>
                                        <div className="grid resize-none gap-3">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                        id="description"
                                                        value={formData.description}
                                                        className="resize-none whitespace-pre-wrap break-words"
                                                        rows={4}
                                                        onChange={(e) => handleChange("description", e.target.value)}
                                                />
                                        </div>
                                        <div className="grid gap-3">
                                                <Label htmlFor="cost">Cost</Label>
                                                <Input
                                                        id="cost"
                                                        type="number"
                                                        value={formData.cost}
                                                        onChange={(e) => handleChange("cost", e.target.value)}
                                                />
                                        </div>
                                        <div className="flex items-start gap-3">
                                                <Checkbox id="fixed" defaultChecked />
                                                <div className="grid gap-2">
                                                        <Label htmlFor="fixed">Fixed Cost </Label>
                                                        <p className="text-muted-foreground text-sm">
                                                                By checking this box you are saying that this booking Type has a fixed cost as opposed to an hourly rate.
                                                        </p>
                                                </div>
                                        </div>
                                </CardContent>

                                <CardFooter>
                                        <Button type="submit" >Create</Button>
                                </CardFooter>
                        </Card>
                </form>
        );
}


export function AvailabilityFormCard({
        availability,
        onChange,
}: {
        availability: Date[];
        onChange: (slots: Date[]) => void;
}) {
        const [selectedDates, setSelectedDates] = useState<Date[]>(availability || []);

        const handleSelect = (date: Date | undefined) => {
                if (!date) return;

                const exists = selectedDates.some(
                        (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
                );

                let updatedDates;
                if (exists) {
                        updatedDates = selectedDates.filter(
                                (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
                        );
                } else {
                        updatedDates = [...selectedDates, date];
                }

                setSelectedDates(updatedDates);
                onChange(updatedDates);
        };

        return (
                <Card>
                        <CardHeader>
                                <CardTitle>Availability</CardTitle>
                                <CardDescription>Select one or more dates for availability.</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                                <Label>Pick Dates</Label>
                                <Calendar
                                        mode="single"
                                        selected={undefined} // disable default highlight
                                        onDayClick={handleSelect}
                                        modifiers={{
                                                selected: selectedDates,
                                        }}
                                />

                                {selectedDates.length > 0 && (
                                        <div className="mt-4 text-sm">
                                                <strong>Selected Dates:</strong>
                                                <ul className="list-disc list-inside">
                                                        {selectedDates.map((date, i) => (
                                                                <li key={i}>{date.toLocaleDateString(undefined, {
                                                                        year: "numeric",
                                                                        month: "short",
                                                                        day: "numeric",
                                                                })}</li>
                                                        ))}
                                                </ul>
                                        </div>
                                )}
                        </CardContent>

                        <CardFooter>
                                <Button type="button" onClick={() => onChange(selectedDates)}>
                                        Save Availability
                                </Button>
                        </CardFooter>
                </Card>
        );
}

export default function CreationForm() {
        return (
                <div className="flex w-full max-w-sm flex-col gap-6">
                        <Tabs defaultValue="booking_type">
                                <TabsList>
                                        <TabsTrigger value="booking_type">Booking Type</TabsTrigger>
                                        <TabsTrigger value="availability">Availability</TabsTrigger>
                                </TabsList>

                                <TabsContent value="booking_type">
                                        <BookingTypeFormCard
                                        />
                                </TabsContent>

                                <TabsContent value="availability">
                                        /* availability card */
                                </TabsContent>
                        </Tabs>
                </div>
        );
}
