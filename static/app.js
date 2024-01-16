
import home from './components/home.js';
import profile from './components/profile.js';
import login from './components/login.js';
import signup from './components/signup.js';
import add_new_post from './components/create_post.js';
import search from './components/search.js';
import followers from './components/followers.js';
import Following from './components/following.js';
import store from './store.js';
import feed from './components/testfeed.js';
import edit_post from './components/edit_post.js';
import editProfile from './components/edit_profile.js';


const routes =[
  { path: '/home', component: home },
  { path: '/users/:email' , name: 'profile',component: profile , props: true },
  { path: '/', component: login },
  { path: '/search', component: search },
  { path: '/signup', component: signup },
  { path: '/add_new_post', component: add_new_post },
  { path: '/edit_post/:id', component: edit_post, name: 'edit_post' ,props: true},
  { path: '/users/:email/followers', component: followers},
  { path: '/users/:email/following', component: Following},
  { path: '/feed/:email' , component: feed , props: true},
  { path: '/updatedetails/:email' , component: editProfile,name: 'editprofile', props: true}

];

const router = new VueRouter({
  routes,
  base: '/',
});

const app = new Vue({
  el: '#app',
  template: '<div> <router-view /> </div>',
  router,
  store,
  methods: {
    async logout() {
      const res = await fetch('/logout');
      if (res.ok) {
        const logoutTime = Date.now(); // save the timestamp of logout action localStorage.setItem('login-time', loginTime); 
        const loginTime = localStorage.getItem('login-time');
        // const userId = this.$store.state.currentUserId;
        if (loginTime) {
          const interval = Math.floor((logoutTime - loginTime) / 1000); // calculate time interval in seconds
          const intervalData = { user_id: this.$store.state.currentUserId, login_time: loginTime, logout_time: logoutTime, interval };
          const response = await fetch(`/api/interval-data/${this.$store.state.currentUserEmail}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(intervalData),
          });
          if (response.ok) {
            console.log('interval data saved');
          } else {
            console.log('could not save interval data');
          }
        }
        localStorage.clear();
        this.$store.commit("setCurrentUser", null);
        this.$store.commit("setCurrentUserId",null);
        this.$store.commit("setCurrentUserName", null);
        this.$router.push('/');
      } else {
        console.log('could not log out');
      }
    },
  },
  mounted() {
    const user = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (user && userId && userName) {
      store.setCurrentUser(user);
      store.setCurrentUserId(userId);
      store.setCurrentUserName(userName);
    }
  },
});

export const logout = app.logout;
