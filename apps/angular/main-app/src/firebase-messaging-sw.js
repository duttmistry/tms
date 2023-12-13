importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');
//let redirection_url = '';
// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
self.addEventListener('notificationclick', function (event) {
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      // for (var i = 0; i < windowClients.length; i++) {
      //   var client = windowClients[i];
      //   // If so, just focus it.
      //   if (client.url === redirection_url && 'focus' in client) {
      //     return client.focus();
      //   }
      // }
      // If not, then open the target URL in a new window/tab.
      //if (clients.openWindow) {
      //const redirectUrl = 'http://localhost:4201/notifications'; // local
      const redirectUrl = 'http://tms-staging/notifications'; // Staging
      // const redirectUrl = 'https://task-new.cybercom.in/notifications'; // Production
      return clients.openWindow(redirectUrl);
      //}
    })
  );
});
firebase.initializeApp({
  apiKey: 'AIzaSyBeFkFog0heycnFDqZ29QdXfWKqKrXErWQ',
  authDomain: 'test-project-b6164.firebaseapp.com',
  projectId: 'test-project-b6164',
  storageBucket: 'test-project-b6164.appspot.com',
  messagingSenderId: '1016557614714',
  appId: '1:1016557614714:web:7646d0305b7a4b1f84adc3',
  measurementId: 'G-NQEN4EK4FL',
});
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  if (payload.data && payload.data.click_actions) {
    /**
     * NOTE :- key 'click_actions' set from firebase console (Additional option key value);
     * if we send notification from console then set same key
     * */

    redirection_url = payload?.data?.click_actions;
  } else {
    /**
     * NOTE :- when we send notification from api call or with custome data then manage nortification object like belove
     *  "notification": {
        "body": "Test---",
        "title": "New Notification ",
        "click_action": "https://www.angular.io"
        },
     */
    redirection_url = payload?.fcmOptions?.link;
  }
});

self.addEventListener('push', function (event) {
  event.waitUntil(
    navigator.serviceWorker.ready.then(function (registration) {
      // Subscription for push notifications
      return registration.pushManager
        .subscribe({ userVisibleOnly: true })
        .then(function (subscription) {
          // Subscription successful, send subscription data to server if needed
        })
        .catch(function (error) {
          // Subscription failed, handle accordingly
        });
    })
  );
});
