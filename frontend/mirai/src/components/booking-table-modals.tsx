import { postCancellation, postManualPayment } from "@/api/bookings";
import { Button } from "@/components/ui/button"
import {
        Dialog,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogOverlay,
        DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTableContext } from "@/contexts/table-context";
import { format } from "date-fns";
import { toast } from "sonner";

export function PaidModal() {
        const { isPaidModalOpen, setBookingData, setIsPaidModalOpen, paidModalRow } = useTableContext();

        const handleManualPayment = async () => {
                const booking_id = paidModalRow?.id;
                console.log("manual")
                if (booking_id === undefined) {
                        toast("no row was select for manual payment");
                        return
                }
                try {
                        await postManualPayment(booking_id)
                        setBookingData(prev => prev.map(row =>
                                row.id === booking_id ? { ...row, paid: true } : row
                        ));
                        toast("manual payment accepted");
                        setIsPaidModalOpen(false);

                } catch (err) {
                        console.log(err);
                        toast("manual payment failed, please try again");
                }
        }

        return (
                <Dialog open={isPaidModalOpen} onOpenChange={setIsPaidModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually set Payment</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Customer</span>
                                                        <span className="font-medium">{paidModalRow?.user_email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Amount</span>
                                                        <span className="font-medium">£{((paidModalRow?.cost ?? 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Date</span>
                                                        <span className="font-medium">
                                                                {format(new Date(paidModalRow?.start_time ?? 0), "dd MMM yyyy HH:mm")}
                                                        </span>
                                                </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                                This will permanently record a manual payment in the system.
                                                Make sure you have verified the payment (cash, bank transfer, etc).
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleManualPayment}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}

export function CancelModal() {
        const { isCancelModalOpen, setBookingData, setIsCancelModalOpen, cancelModalRow } = useTableContext();

        const handleCancel = async () => {
                const booking_id = cancelModalRow?.id;
                if (booking_id === undefined) {
                        toast("no row was select for manual cancellation");
                        return
                }
                try {
                        await postCancellation(booking_id)
                        setBookingData(prev => prev.map(row =>
                                row.id === booking_id ? { ...row, status: "cancelled" } : row
                        ));
                        toast("cancellation accepted");
                        setIsCancelModalOpen(false);

                } catch (err) {
                        console.log(err);
                        toast("manual cancellation failed, please try again");
                }
        }

        return (
                <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually Cancel</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Customer</span>
                                                        <span className="font-medium">{cancelModalRow?.user_email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Amount</span>
                                                        <span className="font-medium">£{((cancelModalRow?.cost ?? 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Date</span>
                                                        <span className="font-medium">
                                                                {format(new Date(cancelModalRow?.start_time ?? 0), "dd MMM yyyy HH:mm")}
                                                        </span>
                                                </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                                This will permanently cancel a booking in the system.
                                                Make sure you have notified the customer.
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleCancel}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}
