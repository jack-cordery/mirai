import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"

interface DurationSelectorProps {
        unit: number;
        formData: {
                duration: number
        }
        handleChange: (field: "duration", value: number) => void
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
        unit,
        formData,
        handleChange,
}) => {
        const step = unit
        const min = unit * 1
        const max = unit * 10 // optional max duration

        const decrease = () => {
                handleChange("duration", Math.max(min, formData.duration - step))
        }

        const increase = () => {
                handleChange("duration", Math.min(max, formData.duration + step))
        }

        return (
                <div className="grid gap-3">
                        <div className="flex items-center space-x-2">
                                <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={decrease}
                                        disabled={formData.duration <= min}
                                >
                                        −
                                </Button>

                                <Input
                                        id="duration"
                                        readOnly
                                        className="w-20 text-center pointer-events-none"
                                        value={`${formData.duration}`}
                                />

                                <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={increase}
                                        disabled={formData.duration >= max}
                                >
                                        +
                                </Button>
                        </div>
                </div>
        )
}
