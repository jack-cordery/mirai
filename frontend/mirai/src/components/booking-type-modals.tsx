import { Button } from "@/components/ui/button"
import {
        Dialog,
        DialogClose,
        DialogContent,
        DialogFooter,
        DialogHeader,
        DialogOverlay,
        DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTableContext } from "@/contexts/table-context";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { DurationSelector } from "./ui/duration-selector";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteBookingType, putBookingType } from "@/api/booking-type";
import { loadWorkingDayTimes } from "@/lib/utils";

export function BookingTypeEditModal() {
        const { slotDuration } = loadWorkingDayTimes()

        const { isBookingTypeEditModalOpen, setBookingTypeData, setIsBookingTypeEditModalOpen, bookingTypeEditModalRow } = useTableContext();
        const [formData, setFormData] = useState({
                title: "",
                description: "",
                cost: 0,
                fixed: false,
                duration: slotDuration,
        });

        useEffect(() => {
                if (isBookingTypeEditModalOpen && bookingTypeEditModalRow) {
                        setFormData({
                                title: bookingTypeEditModalRow.title ?? "",
                                description: bookingTypeEditModalRow.description ?? "",
                                fixed: bookingTypeEditModalRow.fixed ?? false,
                                cost: bookingTypeEditModalRow?.cost / 100,
                                duration: bookingTypeEditModalRow.duration * slotDuration,
                        });
                }
        }, [isBookingTypeEditModalOpen, bookingTypeEditModalRow]);

        const handleChange = (field: string, value: any) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                try {
                        await putBookingType(bookingTypeEditModalRow?.type_id ?? -1, {
                                title: formData.title,
                                description: formData.description,
                                fixed: formData.fixed,
                                cost: formData.cost * 100,
                                duration: formData.duration,
                        })
                        setBookingTypeData(prev => prev.map(row =>
                                row.type_id === (bookingTypeEditModalRow?.type_id ?? -1) ? { ...row, title: formData.title, description: formData.description, fixed: formData.fixed, cost: formData.cost * 100, duration: formData.duration / slotDuration } : row
                        ));

                        toast(`booking type ${formData.title} successfully edited`)
                        setFormData({
                                title: "",
                                description: "",
                                fixed: true,
                                cost: 0,
                                duration: slotDuration,
                        })
                        setIsBookingTypeEditModalOpen(false);
                } catch (err) {
                        toast("booking type edit failed, please try again later")
                }
        };

        return (
                <Dialog open={isBookingTypeEditModalOpen} onOpenChange={setIsBookingTypeEditModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually Edit Booking Type</DialogTitle>
                                </DialogHeader>
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
                                                                <Label htmlFor="cost">Duration</Label>
                                                                <DurationSelector formData={formData} handleChange={handleChange} unit={slotDuration} />modal
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
                                                                <Checkbox
                                                                        id="fixed"
                                                                        checked={formData.fixed}
                                                                        onCheckedChange={(e) => handleChange("fixed", e)}
                                                                        defaultChecked />
                                                                <div className="grid gap-2">
                                                                        <Label htmlFor="fixed">Fixed Cost </Label>
                                                                        <p className="text-muted-foreground text-sm">
                                                                                By checking this box you are saying that this booking Type has a fixed cost as opposed to an hourly rate.
                                                                        </p>
                                                                </div>
                                                        </div>

                                                </CardContent>

                                                <CardFooter>
                                                        <Button variant="outline" onClick={() => { setIsBookingTypeEditModalOpen(false) }}>Cancel</Button>
                                                        <Button type="submit" >Edit</Button>

                                                </CardFooter>
                                        </Card>
                                </form>

                        </DialogContent>
                </Dialog >
        )
}

export function BookingTypeDeleteModal() {
        const { slotDuration } = loadWorkingDayTimes()
        const { isBookingTypeDeleteModalOpen, setBookingTypeData, setIsBookingTypeDeleteModalOpen, bookingTypeDeleteModalRow } = useTableContext();

        const handleDelete = async () => {
                const bookingTypeId = bookingTypeDeleteModalRow?.type_id;
                if (bookingTypeId === undefined) {
                        toast("no row was select for manual cancellation");
                        return
                }
                try {
                        await deleteBookingType(bookingTypeId)
                        setBookingTypeData(prev => prev.filter(row => row.type_id != bookingTypeId))
                        toast("deletion accepted");
                        setIsBookingTypeDeleteModalOpen(false);

                } catch (err) {
                        console.log(err);
                        toast("bookingType deletion failed, please try again");
                }
        }
        return (
                <Dialog open={isBookingTypeDeleteModalOpen} onOpenChange={setIsBookingTypeDeleteModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Delete Booking Type</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Title</span>
                                                        <span className="font-medium">{bookingTypeDeleteModalRow?.title}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Description</span>
                                                        <span className="font-medium">{bookingTypeDeleteModalRow?.description}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Cost</span>
                                                        <span className="font-medium">£{((bookingTypeDeleteModalRow?.cost ?? 0) / 100).toFixed(2)}</span >
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Duration (minutes)</span>
                                                        <span className="font-medium">{(bookingTypeDeleteModalRow?.duration ?? 1) * slotDuration}</span >
                                                </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                                This will permanently delete the Booking Type. Ensure you first delete all their
                                                active bookings!
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline" onClick={() => setIsBookingTypeDeleteModalOpen(false)}>Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleDelete}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}
