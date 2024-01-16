const login = {
  template: `<div id='app'>
  <nav class="navbar bg-light">
    <div class="container">
      <h1><span class="navbar-brand mb-0 h1"> WELCOME TO BLOGLITE APPLICATION !</span></h1>
    </div>
  </nav>
  <div class="card border-primary mb-3">
    <h3 class="card-header">LOGIN</h3>
    <form action=''>
    <div class="card-body">
      <div class="container"> 
      <div class="form-group">
  <label>Email:</label>
  <input type='text' name='email' id='email' placeholder='email' v-model="formData.email"/>
</div>
<div class="form-group">
  <label>Password:</label> 
  <input type='password' name='password' placeholder='password' v-model="formData.password"/>
</div>
      <button @click.prevent="loginUser"> Login </button></div></div>
    </form>
    <div class="card-footer"><h5>New User? <router-link to ="/signup">SIGN UP HERE</router-link></h5></div>
    </div></div>
  `,

  data() {
    return {
      formData: {
        email: '',
        password: '',
      },
    }
  },

  methods: {
    async loginUser() {
      const res = await fetch('/login?include_auth_token', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.formData),
      })
    
      if (res.ok) {
        const data = await res.json()
        console.log(data)
        const loginTime = Date.now(); // save the timestamp of login action
        localStorage.setItem('auth-token', data.response.user.authentication_token)
        localStorage.setItem('login-time', loginTime); // save the login timestamp in local storage
        this.$router.push(`feed/${ this.formData.email}`)
      } else {
        console.log('something went wrong')
      }
    },
  }
}
export default login