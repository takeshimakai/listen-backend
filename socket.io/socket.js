import { Server } from 'socket.io';

import Room from '../models/chat/room.js';
import Message from '../models/chat/message.js';
import User from '../models/user.js';

import usersAreAvailable from '../utils/usersAreAvailable.js';
import findMatch from '../utils/findMatch.js';

const socket = (server) => {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('socket connected!');

    socket.on('initialize', async (user, form) => {
      try {
        if (!usersAreAvailable()) {
          return socket.emit('unavailable');
        }
    
        const currentUser = await User.findByIdAndUpdate(user._id, {
          chat: {
            isAvailable: true,
            filters: {
              age: {
                min: form.age.min,
                max: form.age.max
              },
              gender: form.gender,
              interests: form.interests,
              problemTopics: form.problemTopics
            }
          },
        }, { new: true, select: 'profile -profile.hidden' });
    
        // Make array of users that match criteria
        const match = await findMatch(currentUser);
        let room;
    
        if (!match) {
          room = new Room({ users: user._id });
  
          currentUser.chat.room = room._id;
          await currentUser.save();
  
          socket.join(room._id.toString());
  
          return socket.emit('no match', room._id);
        }
        
        room = await Room.findByIdAndUpdate(match.chat.room, {
          $push: { users: user._id }
        }, { new: true });
  
        currentUser.chat.isAvailable = false;
        currentUser.chat.room = room._id;
  
        match.chat.isAvailable = false;
  
        await Promise.all([currentUser.save(), match.save()]);
  
        socket.join(room._id.toString());
  
        const users = {
          userA: {
            _id: currentUser._id,
            username: currentUser.profile.username
          },
          userB: {
            _id: match._id,
            username: match.profile.username
          }
        };
    
        return io.to(room._id.toString()).emit('initialized', (room._id, users));
      } catch (err) {
        console.log(err);
      }
    });

    socket.on('get messages', async (room) => {
      try {
        const messages = await Message.find({ room: room._id }, 'input sentBy');

        socket.emit('retrieved messages', messages);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on('new message', async (roomId, message) => {
      try {
        const msg = new Message({
          room: roomId,
          message: message.input,
          sentBy: message.sentBy
        });

        await msg.save();

        io.to(roomId.toString()).emit('new message', message);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on('leave room', async (user, room) => {
      try {
        socket.leave(room.toString());

        const res = await Promise.all([
          User.findByIdAndUpdate(user._id, {
            chat: {
              room: undefined,
              filters: {
                age: {
                  min: undefined,
                  max: undefined
                },
                gender: undefined,
                interests: undefined,
                problemTopics: undefined
              }
            }
          }),
          Room.findByIdAndUpdate(room, { $pull: { users: user._id } }, { new: true })
        ]);

        if (res[1].users.length === 0) {
          await Promise.all([
            Room.findByIdAndDelete(room),
            Message.deleteMany({ room })
          ]);
          return;
        }

        io.to(room.toString()).emit('user left', user);
      } catch (err) {
        console.log(err);
      }
    })

    socket.on('disconnect', () => console.log('user disconnected'));
  });
};

export default socket;