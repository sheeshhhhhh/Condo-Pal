import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useDebounceValue from "@/hooks/useDebounceValue"
import useMaintenanceParams from "@/hooks/useMaintenanceParams"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"

const MaintenanceHeader = () => {
    const { status, priority, search, setPriority, setStatus, setSearch } = useMaintenanceParams();

    const [inputSearch, setInputSearch] = useState<string>(search || "")
    const debounceValue = useDebounceValue(inputSearch, 500);
    
    useEffect(() => {
        if(debounceValue === undefined) return
        setSearch(debounceValue)
    }, [debounceValue])

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={inputSearch} onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Search maintenance request..." className="pl-10 w-full" />
            </div>
            <div className="flex gap-2">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Priority</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELED">Canceled</SelectItem>
                    </SelectContent>
                </Select>
                
                <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export default MaintenanceHeader