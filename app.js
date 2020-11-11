// helper function to pass falsy checks
// param: any
const unFalsy = (check)=>{
  if (check === '') {
    return true;
  }
  return check;
}

// console destructuring for shorter access
const { error, log } = console;

// Socket class
// Inits socket.io communication with an options object.
// Options has two fields: url and onReceive.
// url: the url for socket.io to connect
// onReceive: callback function fired each time a message is
// received by socket.io
class Socket {
  constructor({ url, onReceive = () => {} }) {
    this.url = url;
    this.onReceive = onReceive;
    this.socket = null;
    this.init();
  }
  init() {
    // check socket.io and necessary input
    !window.io && error("No socket.io client found");
    !this.url && error("No url for socket.io found");
    this.socket = io(this.url);
    !this.socket && error("Socket.io initialization error");

    // sign up for message event if we have a handler
    this.socket.on("message", this.onReceive);
  }
  // function to send message
  // param: options {} with message and user strings
  send(options) {
    this.socket.emit("message", options);
  }
}

// Node class
// On instantiate it tries to query the DOM
// with the specified selector.
class Node {
  constructor(selector) {
    this.selector = selector;
    this.node = null;
    this.init();
  }
  init() {
    !this.selector && error("No selector provided");
    this.node = document.querySelector(this.selector);
    if (!this.node) {
      this.node = null;
      log(`DOM query failed for ${this.selector}`);
    }
  }
  // attaches a handler to a specified event type
  on(event, handler) {
    this.node.addEventListener(event, handler);
  }
  // returns the value of node if any
  val(newVal) {
    const {value} = this.node;
    if (unFalsy(newVal) && value) {
      this.node.value = newVal;
      return;
    }
    return value || null;
  }
  // returns 
  hasClass(_class) {
    return this.node ? this.node.classList.contains(_class) : false;
  }
  focus(){
    this.node.focus()
  }
}

// Simple list with one feature: append
// a string to the tail of it's content
class StringList extends Node {
  constructor(selector) {
    super(selector);
  }
  write(string) {
    this.node.innerHTML += string;
  }
}

// main function
const app = () => {
  let lastSentMessage = {}; // holds the lastly sent message by this client
  let lastUser; // holds the user of the last reveived message 

  // init socket
  const socket = new Socket({
    url: "http://35.157.80.184:8080/",
    // message receive handler
    onReceive({ message, user }) {
      const { message: m, user: u } = lastSentMessage;
      // check if the new arriving message is mine
      const newMessageIsMine = m === message && u === user;
      // check if a separator is needed
      const separatorNeeded = user !== lastUser;
      // build message template
      const template = `
      ${
        separatorNeeded
          ? `
        <li class="separator"></li>`
          : ""
      }
        <li class="${newMessageIsMine ? "mine" : ""}">
          ${(!newMessageIsMine && separatorNeeded) ? `<span class="message-user">${user}</span><br/>` : ""}
          <span>${message}</span>
        </li>
      `;

      // init messagelist, write tempalte
      const messageList = new StringList("#app > .messages");
      messageList.write(template);

      // scroll to last message
      messageList.node.scrollTop = messageList.node.scrollHeight;

      // update last user
      lastUser = user;
    },
  });

  //init userInput
  const userInput = new Node('#app [name="user"]');

  // init message input
  const messageInput = new Node('#app [name="message"]');

  // init form
  const form = new Node("#app > form");
  form.on("submit", (event) => {
    // don't send the form
    event.preventDefault();
    lastSentMessage = {
      user: userInput.val(),
      message: messageInput.val(),
    };
    // send the message only if username and message provided
    if (lastSentMessage.user && lastSentMessage.message) {
      socket.send(lastSentMessage);
      // reset the input's value and regain focus
      messageInput.val('');
      messageInput.focus();
    }
  });
};

// the load event
window.onload = app;
