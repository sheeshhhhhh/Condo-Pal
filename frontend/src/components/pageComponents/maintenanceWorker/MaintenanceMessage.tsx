import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthContext } from "@/context/AuthContext"
import formatDateTime from "@/lib/formatDateTime"

type MaintenanceMessageProps = {
    message: MaintenanceMessageWithSender,
}

const MaintenanceMessage = ({
    message, 
}: MaintenanceMessageProps) => {
    const { user } = useAuthContext();
    const userId = user!.id

    return (
        <div
        key={message.id}
        className={`flex ${message.senderId === userId ? "justify-end" : "justify-start"}`}
        >
            <div className={`flex gap-2 max-w-[80%] ${message.senderId === userId ? "flex-row-reverse" : "flex-row"}`}>
                {message.senderId !== "system" && (
                    <Avatar className={`h-8 w-8 ${message.senderId === userId ? "mt-2" : "mt-6"}`}>
                        <AvatarImage src={message.sender?.profile} alt={message.sender?.name} />
                        <AvatarFallback>{(message.sender?.name || message.workerName || "W").charAt(0)}</AvatarFallback>
                    </Avatar>
                )}

                <div className="my-1">
                    <div className={`flex items-center gap-2 mb-1 ${message.senderId === userId ? "justify-end" : "justify-start"}`}>
                        {message.senderId !== userId && (
                            <span className="text-xs font-medium">
                                {message.sender ? message.sender.name : message.workerName} {" "}
                                <span className="capitalize">({message.senderType.toLowerCase()})</span>
                            </span>
                        )}
                    </div>

                    <div
                    className={`p-1 px-2 rounded-lg ${
                    message.senderId === "system"
                        ? "bg-muted text-muted-foreground text-sm border"
                        : message.senderId === userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                    }`}
                    >
                        <p className="whitespace-pre-wrap ">{message.message}</p>
                    </div>
                    
                    {message.attachment && message.attachment.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mt-2 ${message.senderId === userId ? "justify-end" : "justify-start"}`}>
                            {message.attachment.map((attachment: any, index: number) => (
                                <img
                                key={index}
                                src={attachment || "/placeholder.svg"}
                                alt={`Attachment ${index + 1}`}
                                className="h-24 w-24 object-cover rounded-md border"
                                />
                            ))}
                        </div>
                    )}
                    <div className={`flex items-center gap-2 mt-1 select-none ${message.senderId === userId ? "justify-end" : "justify-start"}`}>
                        <span className="text-xs text-muted-foreground">{formatDateTime(new Date(message.createdAt))}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MaintenanceMessage