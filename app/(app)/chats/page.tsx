import { ChatScreen } from "@/components/chat/chat-screen";

/** Экран один на обе роли: сервер сам отдаёт те комнаты, что доступны
 *  вошедшему, — так же устроено и в мобильном приложении. */
export default function Page() {
  return <ChatScreen />;
}
