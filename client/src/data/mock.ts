import type { Chat } from '../types/app'
export const chats: Chat[] = [
 { id:'1', name:'Priya Sharma', avatar:'PS', online:true, lastMessage:'Sure, see you at 8!', time:'9:42 PM', unread:2, messages:[
  {id:'m1',text:'Hey! Are we still meeting today?',time:'9:38 PM'},
  {id:'m2',text:'Yes 😊 I will send the location.',time:'9:39 PM'},
  {id:'m3',text:'Sure, see you at 8!',time:'9:42 PM',fromMe:true,status:'read'}]},
 { id:'2', name:'FedChat Team', avatar:'FT', online:true, lastMessage:'Arjun: Build is ready', time:'8:51 PM', unread:7, messages:[{id:'m4',text:'The new realtime build is ready for testing.',time:'8:51 PM'}]},
 { id:'3', name:'Rahul Verma', avatar:'RV', lastMessage:'Photo', time:'Yesterday', messages:[{id:'m5',text:'Photo',time:'Yesterday',kind:'image'}]},
 { id:'4', name:'Design Community', avatar:'DC', lastMessage:'Meera: New announcement', time:'Monday', unread:1, messages:[{id:'m6',text:'New announcement',time:'Monday'}]},
]
export const contacts = ['Aarav Mehta','Ananya Singh','Arjun Kapoor','Meera Joshi','Neha Gupta','Rohan Sharma']
