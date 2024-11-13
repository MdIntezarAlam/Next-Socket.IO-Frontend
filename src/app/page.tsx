/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-sequences */
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type TypeRoom, useRoom } from '@/lib/slice/useRoom';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
const SOCKET_URL = 'https://chatme-qulw.onrender.com/';

const socket: Socket = io(SOCKET_URL);

export default function Page() {
  const [showChatBox, setShowChatBox] = useState<boolean>(false);
  const [nameErr, setNameErr] = useState<string>('');
  const [roomErr, setRoomErr] = useState<string>('');
  const { room, setRoom } = useRoom();
  const [isFilupped, setIsFilled] = useState<boolean>(false);

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
      setIsFilled(true);
      setNameErr('');
      setRoomErr('');
    }
  };

  return (
    <main className='h-screen w-full overflow-hidden bg-[#dadada] bg-primary/50 shadow lg:p-5'>
      <div className='grid h-[100%] grid-cols-1 gap-1 rounded-md bg-background lg:grid-cols-4 lg:p-2'>
        {!isFilupped ? (
          <section className='col-span-1 flex h-full w-full flex-col items-center justify-center gap-5 rounded-md border p-5'>
            <h1 className='mb-5 text-3xl font-bold underline'>Chat With Me.</h1>
            <div className='flex w-full flex-col gap-2'>
              <Input
                type='text'
                placeholder='Enter your name'
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className='!h-10 !rounded-full placeholder:text-xs'
              />
              <p className='text-destructive'>{nameErr}</p>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <Input
                type='text'
                value={formData.roomId}
                placeholder='Enter roomId(room id should be 4 char)'
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    roomId: e.target.value,
                  }))
                }
                className='!h-10 !rounded-full placeholder:text-xs'
              />
              <p className='text-destructive'>{roomErr}</p>
            </div>
            <Button onClick={joinRoomForChat} className='!w-full !rounded-full'>
              Join Room
            </Button>
          </section>
        ) : (
          <div className='hidden flex-col items-center justify-center lg:flex'>
            <h1 className='text-lg font-bold md:text-3xl'>
              Happy Chatting ...
            </h1>
            <span>😘💕😍</span>
          </div>
        )}

        {isFilupped ? (
          <section className='col-span-3 flex h-full w-full items-center justify-center overflow-auto rounded-md border bg-secondary/50'>
            {showChatBox && <ChatBox room={room} socket={socket} />}
          </section>
        ) : (
          <div className='col-span-3 hidden h-full w-full items-center justify-center bg-secondary/50 text-center text-lg font-bold md:text-2xl lg:flex'>
            Waiting for you to fill the form to start Chatting.
          </div>
        )}
      </div>
    </main>
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
      // console.log('getting err while sending message', error);
    }
  };

  useEffect(() => {
    socket.on('load_message', (message: TypeRoom[]) => {
      // load msg
      // console.log('loading prev msg with this id', socket.id);
      setMessageList(message);
    });

    socket.on('recive_message', (data: TypeRoom) => {
      // send msg
      // console.log('sending msg with this id', data);
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off('recive_message');
      socket.off('load_message');
      // console.log('Clean up the listeners when the component unmounts');
    };
  });

  useEffect(() => {
    if (autoScroll.current) {
      autoScroll.current.scrollTop = autoScroll.current.scrollHeight;
    }
  }),
    [messageList];

  return (
    <main className='flex h-full w-full flex-col items-center justify-between'>
      <nav className='sticky top-0 z-50 flex w-full flex-col border bg-white px-5 py-3 shadow-sm'>
        <h1>From : {room?.username}</h1>
        <h1>UniqueId : {room?.roomId}</h1>
      </nav>

      <main
        ref={autoScroll}
        className='h-full w-full overflow-y-auto border bg-background p-4'
      >
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

      <footer className='flex w-full items-center justify-center gap-3 rounded-md border border-green-500 bg-background p-0.5 pl-3 focus:outline-double'>
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
          className='w-full overflow-hidden border-0 bg-transparent outline-none placeholder:text-foreground lg:!h-14'
        />
        <Button
          onClick={sendMessageController}
          className='!h-full !rounded-full px-10 text-sm lg:px-14 lg:text-2xl'
        >
          send
        </Button>
      </footer>
    </main>
  );
};
