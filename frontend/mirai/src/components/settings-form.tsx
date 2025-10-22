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
import { useAuth } from "@/contexts/auth-context"


export function SettingsFormCard() {
        const { title, setTitle } = useAuth();
        const [formData, setFormData] = useState({
                title: title,
        });

        const handleChange = (field: string, value: any) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                // TODO: persist settings
                e.preventDefault();
                setTitle(formData.title);
        };

        return (
                <form onSubmit={handleSubmit}>
                        <Card>
                                <CardHeader>
                                        <CardTitle>Settings</CardTitle>
                                        <CardDescription></CardDescription>
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
                                </CardContent>

                                <CardFooter>
                                        <Button type="submit" >Save</Button>
                                </CardFooter>
                        </Card>
                </form>
        );
}

export default function SettingsForm() {
        return (
                <div className="flex w-full max-w-sm flex-col gap-6">
                        <Tabs defaultValue="booking_type">
                                <TabsList>
                                        <TabsTrigger value="booking_type">Settings</TabsTrigger>
                                </TabsList>

                                <TabsContent value="booking_type">
                                        <SettingsFormCard
                                        />
                                </TabsContent>

                        </Tabs>
                </div>
        );
}
