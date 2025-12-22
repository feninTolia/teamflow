import { MessageItem } from './message/MessageItem';

const messages = [
  {
    id: '1',
    message: 'Hello, how a u ?',
    date: new Date(),
    avatarUrl: 'https://avatars.githubusercontent.com/JohnDoe.png',
    authorName: 'John Doe',
  },
];

const MessagesList = () => {
  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-4">
        {messages.map((message) => (
          <MessageItem key={message.id} {...message} />
        ))}
      </div>
    </div>
  );
};

export default MessagesList;
