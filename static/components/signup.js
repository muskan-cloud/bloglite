const signup = {
    template:`<div>
    <nav class="navbar bg-light">
      <div class="container">
        <h1><span class="navbar-brand mb-0 h1"> WELCOME TO BLOGLITE APPLICATION !</span></h1>
      </div>
    </nav>
    <div class="card border-primary mb-3">
      <h3 class="card-header">SIGN-UP</h3>
      <form>
        <div class="card-body">
          <div class="container">
            <label>Email : </label>
            <input type="text" name="email" placeholder="Email" v-model="formData.email" required><br>
            <label>Username : </label>
            <input type="text" name="username" placeholder="username" v-model="formData.username" required><br>
            <label>Password : </label>
            <input type="password" name="password" placeholder="Password" v-model="formData.password" required><br>
            <label>Confirm password : </label>
            <input type="password" name="confirm_password" placeholder="Confirm Password"
              v-model="formData.confirm_password" required><br>
            <button @click.prevent="signupUser">Sign up</button></div></div>
      </form>
      <div class="card-footer">
        <h5>Already a User? <router-link to="/">Login here !</router-link></h5>
      </div>
    </div>
  </div>`
  ,
  data() {
    return {
      formData:{
        username:'',
        email: '',
        password: '',
        confirm_password: ''
      }
    }
  },
  methods: {
    async signupUser() {
      if (this.formData.password !== this.formData.confirm_password) {
        console.log('Passwords do not match')
      }
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.formData)
      })
      if (res.ok) {
        const data = await res.json()
        console.log(data.message)
        this.$router.push('/')
      } else {
        console.log('Something went wrong')
      }
    }
  }
}
export default signup