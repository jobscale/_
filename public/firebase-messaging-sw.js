importScripts('/service-worker.js');
importScripts('https://www.gstatic.com/firebasejs/5.8.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.8.3/firebase-messaging.js');
const config = {
  apiKey: "AIzaSyAlGETt2oe_9zfGwuzdvKzNK9pdqrQqwgA",
  authDomain: "notification-aaa.firebaseapp.com",
  databaseURL: "https://notification-aaa.firebaseio.com",
  projectId: "notification-aaa",
  storageBucket: "notification-aaa.appspot.com",
  messagingSenderId: "592002215665",
};
firebase.initializeApp(config);
const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(payload => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png',
  };
  return self.registration.showNotification(
    notificationTitle, notificationOptions,
  );
});
