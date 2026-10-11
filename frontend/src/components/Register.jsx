import { useState } from "react"
import "./Register.css"
import axios from "axios"
import { useNavigate } from "react-router-dom"

function Register(){
   
        const [registerUser,setRegisterUser]=useState({
                name:"",
                email:"",
                password:""
        })

        const navigate=useNavigate();
       function a(e){
setRegisterUser({...registerUser,[e.target.name]:e.target.value})
       }

      async function submit(){
           try{
                 const response= await axios.post(`http://localhost:8080/register`,registerUser)
         alert("User Registered Successfully")
         navigate("/login")
           }catch(err){
                alert("User failed TO register " ,err.message);
           }
       }


        return (
    <>
    
<div className="Third-div">
            <h1>Create Account</h1>
    <h3>name</h3>
<input type="text" name="name" id="" onChange={a} />
    <h3>Email</h3>
<input type="text" name="email" id="" onChange={a} />
    <h3>Password</h3>
<input type="password" name="password" id="" onChange={a}/>

    <button onClick={submit}>Register</button>
    <a href="/login">Do you already Have Account</a>
</div>
    </>
        )
}
export default Register