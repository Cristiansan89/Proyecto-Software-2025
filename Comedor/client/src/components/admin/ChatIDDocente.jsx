import { useState } from "react";

const ChatIDDocenteForm = ({ chatId }) => {
    const [chatIdValue, setChatIdValue] = useState(chatId || "");
}

export default ChatIDDocenteForm;