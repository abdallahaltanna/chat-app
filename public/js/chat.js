const socket = io();

// Element
const $messageForm = document.querySelector('#message-form');
const $messageInput = $messageForm.querySelector('#message-input');
const $messageBtn = $messageForm.querySelector('button');
const $locationBtn = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML;
const $msLocationTemplate = document.querySelector(
  '#message-template-location'
).innerHTML;
const $sidebaremplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;
  
  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight
  
  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How for have i scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (message) => {
  const html = Mustache.render($messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll()
});

socket.on('locationMessage', (message) => {
  const html = Mustache.render($msLocationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll()
});

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render($sidebaremplate, {
    room,
    users
  })
  $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  $messageBtn.setAttribute('disabled', 'disabled');

  const messageValue = e.target.elements.message.value;
  socket.emit('sendMessage', messageValue, (error) => {
    $messageBtn.removeAttribute('disabled');
    $messageInput.value = '';
    $messageInput.focus();
    if (error) {
      return console.log(error);
    }

    console.log('Message delivered');
  });
});

document.querySelector('#send-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  $locationBtn.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $locationBtn.removeAttribute('disabled')
        console.log('Location shared!');
      }
    );
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/'
  }
});
