import LoadingSpinner from "@/components/common/LoadingSpinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/context/AuthContext"
import { useSocketContext } from "@/context/SocketContext"
import useMessageParams from "@/hooks/useMessageParams"
import axiosFetch from "@/lib/axios"
import formatSmartDate from "@/lib/formatSmartDate"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"

type ConversationListProps = {
    showMobileChat: boolean
    setShowMobileChat: (show: boolean) => void,
}

const ConversationList = ({
    showMobileChat,
    setShowMobileChat,
}: ConversationListProps) => {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();
    const { socket } = useSocketContext();
    const [searchTerm, setSearchTerm] = useState("");
    const { leaseAgreementId, setLeaseAgreementId } = useMessageParams();

    const { data: conversationList, isLoading } = useQuery({
        queryKey: ['conversationList', searchTerm],
        queryFn: async () => {
            const isLandlord = user?.role === 'landlord';
            const endpoint = isLandlord ? "/message/getConversationListLandlord" : "/message/getConversationListTenant";
            const response = await axiosFetch.get(`${endpoint}?search=${searchTerm}`)

            if(response.status >= 400) {
                throw new Error(response.data.message);
            }

            return response.data as conversationList;
        },
        refetchOnWindowFocus: false,
    })

    useEffect(() => {
        if(!socket) return;

        // this is for the sender
        socket.on("newMessageConversation", async (message: any) => {
            queryClient.setQueryData(['conversationList', searchTerm], (oldData: conversationList) => {
                if(!oldData) return oldData;

                const isSender = user?.id === message.senderId
                const newData = oldData.map((conversation) => {
                    if(conversation.id === message.leaseAgreementId) {
                        return {
                            ...conversation,
                            messages: [message],
                            unreadCount: isSender ? conversation.unreadCount : conversation.unreadCount + 1,
                        }
                    }
                    return conversation;
                })

                return newData;
            })
        })

        return () => {
            socket.off("newMessageTenant");
        }
    }, [socket, searchTerm])
    
    if(!conversationList && !isLoading) return

    const sortedConversations = conversationList?.sort((a, b) => {
        const aDate = new Date(a.messages?.[0]?.createdAt || 0).getTime();
        const bDate = new Date(b.messages?.[0]?.createdAt || 0).getTime();
        return bDate - aDate;
    }) || [];

    return (
        <div className={`w-full h-full md:w-1/4 border-r flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search residents..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {sortedConversations.map((conversation) => (
                        <div
                        key={conversation.id}
                        className={`
                            flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors
                            ${leaseAgreementId === conversation.id && "bg-muted"}
                        `}
                        onClick={() => {
                            setLeaseAgreementId(conversation.id) // this should be a parameter
                            setSearchTerm("")
                            setShowMobileChat(true)
                        }}
                        >
                            <div className="relative flex-shrink-0">
                                <Avatar>
                                    <AvatarImage src={conversation.sender.profile} />
                                    <AvatarFallback>{conversation.sender.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {conversation.online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-medium truncate">{conversation.sender.name}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {conversation.messages?.[0]?.createdAt && formatSmartDate(new Date(conversation.messages?.[0]?.createdAt))}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{conversation.condo.name}</p>
                                <p className="text-sm truncate">{conversation.messages?.[0]?.message}</p>
                            </div>

                            {conversation.unreadCount > 0 && (
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium">
                                    {conversation.unreadCount}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ConversationList