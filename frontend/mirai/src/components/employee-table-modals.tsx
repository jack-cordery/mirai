import { postCancellation, postComplete, postConfirm, postManualPayment } from "@/api/bookings";
import { deleteEmployee, putEmployee, type GetEmployeeResponse } from "@/api/employee";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";

export function EmployeeEditModal() {

        const { isEmployeeEditModalOpen, setEmployeeData, setIsEmployeeEditModalOpen, employeeEditModalRow } = useTableContext();
        const [formData, setFormData] = useState({
                name: "",
                surname: "",
                email: "",
                title: "",
                description: "",
        });

        useEffect(() => {
                if (isEmployeeEditModalOpen && employeeEditModalRow) {
                        setFormData({
                                name: employeeEditModalRow.name ?? "",
                                surname: employeeEditModalRow.surname ?? "",
                                email: employeeEditModalRow.email ?? "",
                                title: employeeEditModalRow.title ?? "",
                                description: employeeEditModalRow.description ?? "",
                        });
                }
        }, [isEmployeeEditModalOpen, employeeEditModalRow]);

        const handleChange = (field: string, value: any) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                try {
                        await putEmployee(employeeEditModalRow?.employee_id ?? -1, {
                                name: formData.name,
                                surname: formData.surname,
                                email: formData.email,
                                title: formData.title,
                                description: formData.description,
                        })
                        setEmployeeData(prev => prev.map(row =>
                                row.employee_id === (employeeEditModalRow?.employee_id ?? -1) ? { ...row, name: formData.name, surname: formData.surname, email: formData.email, title: formData.title, description: formData.description } : row
                        ));

                        toast(`employee ${formData.name} ${formData.surname} successfully edited`)
                        setFormData({
                                name: "",
                                surname: "",
                                email: "",
                                title: "",
                                description: "",
                        })
                        setIsEmployeeEditModalOpen(false);
                } catch (err) {
                        toast("employee edit failed, please try again later")
                }
        };

        return (
                <Dialog open={isEmployeeEditModalOpen} onOpenChange={setIsEmployeeEditModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually Edit Employee</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit}>
                                        <Card className="bg-transparent">
                                                <CardHeader>
                                                        <CardTitle>Employee</CardTitle>
                                                        <CardDescription>Set the information for this employee.</CardDescription>
                                                </CardHeader>

                                                <CardContent className="grid gap-6">
                                                        <div className="grid grid-cols-2 gap-3">
                                                                <div className="flex flex-col">
                                                                        <Label htmlFor="name">Name</Label>
                                                                        <Input
                                                                                id="name"
                                                                                value={formData.name}
                                                                                onChange={(e) => handleChange("name", e.target.value)}
                                                                        />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                        <Label htmlFor="surname">Surname</Label>
                                                                        <Input
                                                                                id="surname"
                                                                                value={formData.surname}
                                                                                onChange={(e) => handleChange("surname", e.target.value)}
                                                                        />
                                                                </div>
                                                        </div>
                                                        <div className="grid  gap-3">
                                                                <Label htmlFor="title">Title</Label>
                                                                <Input
                                                                        id="title"
                                                                        value={formData.title}
                                                                        onChange={(e) => handleChange("title", e.target.value)}
                                                                />
                                                        </div>
                                                        <div className="grid  gap-3">
                                                                <Label htmlFor="email">Email</Label>
                                                                <Input
                                                                        id="email"
                                                                        value={formData.email}
                                                                        onChange={(e) => handleChange("email", e.target.value)}
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
                                                </CardContent>

                                                <CardFooter>
                                                        <Button variant="outline" onClick={() => { setIsEmployeeEditModalOpen(false) }}>Cancel</Button>
                                                        <Button type="submit" className="mx-2" >Edit</Button>
                                                </CardFooter>
                                        </Card>
                                </form >
                        </DialogContent>
                </Dialog>
        )
}

export function EmployeeDeleteModal() {
        const { isEmployeeDeleteModalOpen, setEmployeeData, setIsEmployeeDeleteModalOpen, employeeDeleteModalRow } = useTableContext();

        const handleDelete = async () => {
                const employeeId = employeeDeleteModalRow?.employee_id;
                if (employeeId === undefined) {
                        toast("no row was select for manual cancellation");
                        return
                }
                try {
                        await deleteEmployee(employeeId)
                        setEmployeeData(prev => prev.filter(row => row.employee_id != employeeId))
                        toast("deletion accepted");
                        setIsEmployeeDeleteModalOpen(false);

                } catch (err) {
                        console.log(err);
                        toast("employee deletion failed, please try again");
                }
        }

        return (
                <Dialog open={isEmployeeDeleteModalOpen} onOpenChange={setIsEmployeeDeleteModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Delete Employee</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Name</span>
                                                        <span className="font-medium">{employeeDeleteModalRow?.name} {employeeDeleteModalRow?.surname}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Email</span>
                                                        <span className="font-medium">{employeeDeleteModalRow?.email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Title</span>
                                                        <span className="font-medium">{employeeDeleteModalRow?.title}</span>
                                                </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                                This will permanently delete the employee. Ensure you first delete all their
                                                active bookings!
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline" onClick={() => setIsEmployeeDeleteModalOpen(false)}>Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleDelete}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}
