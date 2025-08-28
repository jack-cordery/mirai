import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue, SelectLabel } from "@/components/ui/select"
import type { TimeOfDay, SelectedTimes } from "@/types/booking";
import { timeToValue, valueToTime } from "@/types/booking";
import { generateOptions, loadWorkingDayTimes } from "@/lib/utils";

type Props = {
        defaultStart: TimeOfDay,
        defaultEnd: TimeOfDay,
        selectedTimes: SelectedTimes;
        onChange: (times: {
                startTime: TimeOfDay | null;
                endTime: TimeOfDay | null;
        }) => void;
}



export default function TimeSelection({ defaultStart, defaultEnd, selectedTimes, onChange }: Props) {
        const { startTime, endTime, slotDuration } = loadWorkingDayTimes()

        const handleStartChange = (val: string) => {
                if (val === "__clear__") {
                        onChange({ startTime: null, endTime: null })
                } else if (val === "morning") {
                        onChange({ startTime: defaultStart, endTime: { hour: 12, minute: 0 } })
                } else if (val === "afternoon") {
                        onChange({ startTime: { hour: 12, minute: 0 }, endTime: { hour: 16, minute: 0 } })
                } else if (val === "evening") {
                        onChange({ startTime: { hour: 16, minute: 0 }, endTime: defaultEnd })
                } else {
                        const parsed = valueToTime(val)
                        if (parsed) onChange({ startTime: parsed, endTime: selectedTimes?.endTime })
                }
        }

        const handleEndChange = (val: string) => {
                if (val === "__clear__") {
                        onChange({ startTime: null, endTime: null })
                } else {
                        const parsed = valueToTime(val)
                        if (parsed) onChange({
                                startTime: selectedTimes.startTime, endTime: parsed
                        })
                }
        }
        const options = generateOptions(startTime, endTime, slotDuration)

        return (
                <div className="flex items-center gap-2">
                        <Select
                                value={selectedTimes?.startTime ? timeToValue(selectedTimes.startTime) : ""}
                                onValueChange={handleStartChange}
                        >
                                <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All day" />
                                </SelectTrigger>
                                <SelectContent>
                                        <SelectGroup>
                                                <SelectLabel>Start Time</SelectLabel>
                                                <SelectItem key="allDay" value="__clear__">
                                                        All day
                                                </SelectItem>
                                                <SelectItem key="morning" value="morning">
                                                        Morning
                                                </SelectItem>
                                                <SelectItem key="afternoon" value="afternoon">
                                                        Afternoon
                                                </SelectItem>
                                                <SelectItem key="evening" value="evening">
                                                        Evening
                                                </SelectItem>
                                                {options.map((option) => (
                                                        <SelectItem key={timeToValue(option)} value={timeToValue(option)} >
                                                                {timeToValue(option)}
                                                        </SelectItem>
                                                ))}
                                        </SelectGroup>
                                </SelectContent>
                        </Select >
                        {selectedTimes?.startTime && (
                                <span className="text-gray-500">→</span>
                        )}
                        {selectedTimes?.startTime && (
                                <Select
                                        value={selectedTimes?.endTime ? timeToValue(selectedTimes.endTime) : ""}
                                        onValueChange={handleEndChange}
                                >
                                        <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="All day" />
                                        </SelectTrigger>
                                        <SelectContent>
                                                <SelectGroup>
                                                        <SelectLabel>End Time</SelectLabel>
                                                        {options.map((option) => (
                                                                <SelectItem key={timeToValue(option)} value={timeToValue(option)} >
                                                                        {timeToValue(option)}
                                                                </SelectItem>
                                                        ))}
                                                </SelectGroup>
                                        </SelectContent>
                                </Select >
                        )}
                </div>
        )
}
