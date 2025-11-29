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
import { useState } from "react"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { postBookingType } from "@/api/booking-type"
import { toast } from "sonner"
import { postEmployee } from "@/api/employee"
import { DurationSelector } from "./ui/duration-selector"

export function BookingTypeFormCard() {
        const rawUnit = import.meta.env.VITE_TIME_SLOT_DURATION;
        const unit = rawUnit ? Number(rawUnit) : NaN;

        if (
                !Number.isInteger(unit)
        ) {
                throw new Error(
                        `invalid config vars unit ${rawUnit}`,
                );
        }


        const [formData, setFormData] = useState({
                title: "",
                description: "",
                cost: 0,
                fixed: false,
                duration: unit,
        });

        const handleChange = (field: string, value: any) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                try {
                        await postBookingType({
                                title: formData.title,
                                description: formData.description,
                                cost: formData.cost * 100,
                                fixed: formData.fixed,
                                duration: formData.duration,
                        })
                        toast(`booking type ${formData.title} created`)
                        setFormData({
                                title: "",
                                description: "",
                                cost: 0,
                                fixed: false,
                                duration: unit,
                        })
                } catch (err) {
                        toast("creation failed")
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
                                                <Label htmlFor="cost">Duration</Label>
                                                <DurationSelector formData={formData} handleChange={handleChange} unit={unit} />
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
                                        <Button type="submit" >Create</Button>
                                </CardFooter>
                        </Card>
                </form>
        );
}


export function EmployeeFormCard() {
        const [formData, setFormData] = useState({
                name: "",
                surname: "",
                email: "",
                title: "",
                description: "",
        });

        const handleChange = (field: string, value: any) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                try {
                        const res = await postEmployee({
                                name: formData.name,
                                surname: formData.surname,
                                email: formData.email,
                                title: formData.title,
                                description: formData.description,
                        })
                        toast(`employee ${formData.name} ${formData.surname} created`)
                        setFormData({
                                name: "",
                                surname: "",
                                email: "",
                                title: "",
                                description: "",
                        })
                } catch (err) {
                        toast("creation failed")
                }
        };

        return (
                <form onSubmit={handleSubmit}>
                        <Card>
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
                                        <Button type="submit" >Create</Button>
                                </CardFooter>
                        </Card>
                </form >
        );
}

export default function SettingsForm() {
        return (
                <div className="flex w-full max-w-sm flex-col gap-6">
                        <Tabs defaultValue="booking_type">
                                <TabsList>
                                        <TabsTrigger value="booking_type">Booking Type</TabsTrigger>
                                        <TabsTrigger value="employee">Employee</TabsTrigger>
                                </TabsList>

                                <TabsContent value="booking_type">
                                        <BookingTypeFormCard
                                        />
                                </TabsContent>

                                <TabsContent value="employee">
                                        <EmployeeFormCard />
                                </TabsContent>
                        </Tabs>
                </div>
        );
}
