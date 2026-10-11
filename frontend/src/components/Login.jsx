
import { useState } from "react"
import "./Register.css"
import axios from "axios"
import { useNavigate } from "react-router-dom"
function Login(){

    const [loginUser,setLoginUser]=useState({
        email:"",
        password:""
    })

const navigate=useNavigate()

    function a(e){
         setLoginUser({...loginUser,[e.target.name]:e.target.value})
    }

    async function submit(){
             try{
                const response=  await axios.post(`http://localhost:8080/login`,loginUser)
                localStorage.setItem("token",response.data)
             alert("User Login Successfull")
             navigate("/dashboard")
            }catch(err){
                 alert("User  Failed TO Login")

             }
     }

    return (
      <>

    
       <div className="Third-div">

    <h1>Login Page</h1>
    <h2>Email</h2>
        <input type="text" name="email" id="" onChange={a} />
    <h2>Password</h2>
        <input type="password" name="password" id="" onChange={a} />

    <button onClick={submit}>Login</button>
    <a href="/">new Register An Accout?</a>
      </div>
      </>
    )
}
export default Login