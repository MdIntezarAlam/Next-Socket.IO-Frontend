'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TypeRoom, useRoom } from '@/lib/slice/useRoom';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:5000');
export default function Page() {
  const [showChatBox, setShowChatBox] = useState<boolean>(false);
  const [nameErr, setNameErr] = useState<string>('');
  const [roomErr, setRoomErr] = useState<string>('');
  const { room, setRoom } = useRoom();

  const initialValues: TypeRoom = {
    username: '',
    roomId: '',
    timestamp: '',
    message: '',
  };

  const [formData, setFormData] = useState<TypeRoom>(initialValues);

  const joinRoomForChat = async () => {
    if (!formData.username) {
      setNameErr('username is required!');
      return;
    }
    if (!formData.roomId) {
      setRoomErr('roomId is required!');
      return;
    }
    if (formData.roomId.length > 6) {
      setRoomErr('room id should not be above 6 chat');
      return;
    }

    if (formData.username && formData.roomId !== '') {
      socket.emit('join_room', formData.roomId);

      setRoom({
        roomId: formData.roomId,
        username: formData.username,
        timestamp: '',
        message: '',
      });

      setShowChatBox(true);
    }
  };

  return (
    <div className='mt-1/2 mx-auto flex h-[90vh] w-full flex-col items-center justify-center gap-4 p-5 lg:flex-row lg:p-0'>
      <div className='flex h-[30vh] w-full flex-col gap-4 rounded-md border p-5 shadow-sm lg:w-1/2'>
        <div className='flex flex-col gap-2'>
          <Input
            type='text'
            placeholder='Enter username'
            value={formData.username}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                username: e.target.value,
              }))
            }
          />
          <p className='text-destructive'>{nameErr}</p>
        </div>
        <div className='flex flex-col gap-2'>
          <Input
            type='text'
            value={formData.roomId}
            placeholder='Enter roomId(room id should be less than 6 char)'
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                roomId: e.target.value,
              }))
            }
          />
          <p className='text-destructive'>{roomErr}</p>
        </div>
        <Button onClick={joinRoomForChat}>Join Room</Button>
      </div>

      {showChatBox ? (
        <ChatBox room={room} socket={socket} />
      ) : (
        <div className='flex h-[90vh] w-full flex-col gap-4 rounded-md border p-5 text-center text-xl font-bold shadow-sm lg:w-1/2'>
          Please Join a room
        </div>
      )}
    </div>
  );
}

const ChatBox = ({
  room,
  socket,
}: {
  room: TypeRoom | null;
  socket: Socket;
}) => {
  const [curMessage, setCurMessage] = useState<string>('');
  const [messageList, setMessageList] = useState<TypeRoom[]>([]);
  const autoScroll = useRef<HTMLElement>(null);

  const sendMessageController = async () => {
    try {
      if (curMessage !== '') {
        const messageData: TypeRoom = {
          username: room?.username,
          roomId: room?.roomId, // no need to send it
          message: curMessage,
          timestamp:
            new Date(Date.now()).getHours() +
            ':' +
            new Date(Date.now()).getMinutes(),
        };
        socket.emit('send_message', { ...messageData, room });
        setMessageList((list) => [...list, messageData]);
        setCurMessage('');
      }
    } catch (error: any) {
      console.log('getting err while sending message', error);
    }
  };

  useEffect(() => {
    socket.on('load_message', (message: TypeRoom[]) => {
      //load msg
      console.log('loading prev msg with this id', socket.id);
      setMessageList(message);
    });

    socket.on('recive_message', (data: TypeRoom) => {
      //send msg
      console.log('sending msg with this id', data);
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off('recive_message');
      socket.off('load_message');
      console.log('Clean up the listeners when the component unmounts');
    };
  });

  useEffect(() => {
    if (autoScroll.current) {
      autoScroll.current.scrollTop = autoScroll.current.scrollHeight;
    }
  }),
    [messageList];
  return (
    <div className='h-[90vh] w-full border p-5 shadow-sm'>
      <nav className='sticky top-0 z-50 flex w-full flex-col border bg-white p-5 shadow-sm'>
        <h1>From : {room?.username}</h1>
        <h1>roomId : {room?.roomId}</h1>
      </nav>

      <main ref={autoScroll} className='h-full overflow-y-auto border p-4'>
        {messageList.map((msg, i) => (
          <div
            key={i}
            className={cn('my-2 w-[70%] overflow-hidden break-words', {
              'ml-auto rounded-t-xl rounded-bl-xl border border-green-800 bg-green-200 p-2':
                room?.username === msg.username,
              'mr-auto rounded-t-xl rounded-br-xl border border-green-800 bg-green-200 p-2':
                room?.username !== msg.username,
            })}
          >
            <div className='flex w-full flex-col p-1'>
              <p className='text-sm font-semibold'>{msg.message}</p>
              <span className='flex items-end justify-end text-xs font-medium'>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </main>

      <footer className='mt-auto flex h-20 items-center justify-center gap-3 rounded-md border border-green-500 bg-background px-3 py-1 focus:outline-double'>
        <textarea
          rows={1}
          cols={1}
          maxLength={500}
          value={curMessage}
          placeholder='Type message here...'
          onChange={(event) => setCurMessage(event.target.value)}
          onKeyPress={(event) => {
            if (event.key === 'Enter') sendMessageController();
          }}
          className='!h-full w-full border-0 bg-transparent outline-none placeholder:text-foreground/50'
        />
        <Button
          onClick={sendMessageController}
          className='mr-3 cursor-pointer p-1 text-4xl'
        >
          send
        </Button>
      </footer>
    </div>
  );
};
