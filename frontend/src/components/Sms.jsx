import { useState } from "react";

function Sms() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const sendSms = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/sms/send?phone=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}`,
        {
          method: "POST",
        }
      );

      const result = await response.text();

      alert("SMS sent successfully. SID: " + result);
    } catch (error) {
      console.error(error);
      alert("Failed to send SMS");
    }
  };

  return (
    <div>
      <h2>Send SMS</h2>

      <input
        type="text"
        placeholder="+919876543210"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Enter message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <br /><br />

      <button onClick={sendSms}>
        Send SMS
      </button>
    </div>
  );
}

export default Sms;